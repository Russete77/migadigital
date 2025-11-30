"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, X, Send, Trash2, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomAudioPlayer } from "./CustomAudioPlayer";

interface WhatsAppAudioRecorderProps {
  onSendAudio: (audioBlob: Blob) => Promise<void>;
  disabled?: boolean;
}

export function WhatsAppAudioRecorder({ onSendAudio, disabled }: WhatsAppAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>(""); // Data URL para preview
  const [actualDuration, setActualDuration] = useState<number>(0); // Duração real em segundos
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleRate: 48000, // Aumentado para 48kHz (padrão WebM)
        }
      });

      // Verificar codecs disponíveis e usar o melhor
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn('⚠️ Opus não suportado, tentando alternativas...');
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        }
      }
      console.log('🎙️ Usando codec:', mimeType);

      const options = {
        mimeType,
        audioBitsPerSecond: 128000 // 128kbps para qualidade melhor
      };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Capturar TODOS os chunks, incluindo pequenos
      mediaRecorder.ondataavailable = (e) => {
        // Capturar mesmo chunks pequenos - todo byte conta!
        if (e.data && e.data.size > 0) {
          console.log('📦 Chunk capturado:', e.data.size, 'bytes',
                      'total chunks:', chunksRef.current.length + 1);
          chunksRef.current.push(e.data);
        } else {
          console.warn('⚠️ Chunk vazio recebido');
        }
      };

      mediaRecorder.onstop = async () => {
        const chunksBeforeDelay = chunksRef.current.length;
        console.log('🛑 MediaRecorder parado | Chunks até agora:', chunksBeforeDelay);

        // CRÍTICO: Aguardar tempo suficiente para TODOS os chunks chegarem
        // O último chunk pode demorar até 500ms para ser emitido
        await new Promise(resolve => setTimeout(resolve, 500));

        const chunksAfterDelay = chunksRef.current.length;
        console.log('⏰ Após delay | Chunks finais:', chunksAfterDelay,
                    '| Novos chunks recebidos:', chunksAfterDelay - chunksBeforeDelay);

        // Calcular tamanho total dos chunks
        const totalChunkSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log('📊 Total:', totalChunkSize, 'bytes em', chunksAfterDelay, 'chunks');

        // Criar blob
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log('🎤 Blob criado:', blob.size, 'bytes | Chunks:', chunksRef.current.length);

        // Parar stream
        stream.getTracks().forEach((track) => track.stop());

        // Converter blob para Data URL (base64) - funciona MUITO melhor que blob URL!
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          console.log('🎬 Data URL criada para preview (tamanho:', dataUrl.length, 'chars)');
          setAudioPreviewUrl(dataUrl);
          setAudioBlob(blob);
          setShowPreview(true);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.onerror = (e) => {
        console.error('❌ Erro no MediaRecorder:', e);
      };

      // IMPORTANTE: Timeslice de 100ms para capturar tudo sem perder dados
      // Fragmentação não é problema, mas perder áudio SIM!
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      startTimeRef.current = Date.now(); // Marcar tempo de início real

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 100); // Atualizar a cada 100ms para mais precisão visual
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Erro ao acessar microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      const recorder = mediaRecorderRef.current;

      // Simplesmente parar - o MediaRecorder já emite o último chunk automaticamente
      if (recorder.state === 'recording') {
        console.log('⏹️ Parando gravação...');
        recorder.stop();
      }

      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();

    setAudioBlob(null);
    setAudioPreviewUrl("");
    setRecordingTime(0);
    setActualDuration(0);
    setShowPreview(false);
  };

  const handleSend = async () => {
    if (!audioBlob) return;

    try {
      setIsSending(true);
      await onSendAudio(audioBlob);
      cancelRecording();
    } catch (error) {
      console.error("Error sending audio:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative">
      {/* Recording/Preview Overlay */}
      <AnimatePresence>
        {(isRecording || showPreview) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-14 right-0 min-w-[320px] max-w-md"
          >
            {/* Recording State */}
            {isRecording && (
              <div className="bg-bg-secondary border-2 border-danger/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  {/* Pulse Animation */}
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-4 h-4 rounded-full bg-danger flex-shrink-0"
                  />

                  {/* Timer */}
                  <div className="flex-1">
                    <div className="text-xs text-text-tertiary mb-0.5">Gravando...</div>
                    <div className="text-2xl font-mono font-bold text-text-primary">
                      {formatTime(recordingTime)}
                    </div>
                  </div>

                  {/* Cancel Button */}
                  <button
                    onClick={cancelRecording}
                    className="w-10 h-10 rounded-full bg-danger/10 hover:bg-danger/20 text-danger flex items-center justify-center transition-all hover:scale-110"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-3 text-xs text-center text-text-tertiary">
                  Clique em <span className="text-danger">✕</span> para cancelar
                </div>
              </div>
            )}

            {/* Preview State */}
            {showPreview && audioBlob && !isRecording && (
              <div className="bg-bg-secondary border-2 border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  {/* Delete Button */}
                  <button
                    onClick={cancelRecording}
                    disabled={isSending}
                    className="w-10 h-10 rounded-full bg-danger/10 hover:bg-danger/20 text-danger flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  {/* Audio Player Customizado */}
                  <div className="flex-1 min-w-0">
                    <CustomAudioPlayer
                      src={audioPreviewUrl}
                      isOwnMessage={false}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSend}
                    disabled={isSending}
                    className="w-12 h-12 rounded-full bg-gradient-hero text-white flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 shadow-lg flex-shrink-0"
                  >
                    {isSending ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Pause className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="mt-3 text-xs text-center text-text-tertiary">
                  Clique em <span className="text-flame-primary">➤</span> para enviar
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic Button */}
      <motion.button
        onMouseDown={(e) => {
          e.preventDefault();
          if (!disabled && !isSending && !showPreview) {
            startRecording();
          }
        }}
        onMouseUp={() => {
          if (isRecording) {
            stopRecording();
          }
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          if (!disabled && !isSending && !showPreview) {
            startRecording();
          }
        }}
        onTouchEnd={() => {
          if (isRecording) {
            stopRecording();
          }
        }}
        disabled={disabled || isSending}
        whileTap={{ scale: 0.9 }}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          isRecording
            ? "bg-danger text-white animate-pulse"
            : "bg-gradient-hero text-white hover:scale-110"
        }`}
        title="Clique e segure para gravar áudio"
      >
        <Mic className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
