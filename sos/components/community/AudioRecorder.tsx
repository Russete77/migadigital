"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface AudioRecorderProps {
  onSendAudio: (audioBlob: Blob) => Promise<void>;
  onCancel: () => void;
}

export function AudioRecorder({ onSendAudio, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Erro ao acessar microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleCancel = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
    onCancel();
  };

  const handleSend = async () => {
    if (!audioBlob) return;

    try {
      setIsSending(true);
      await onSendAudio(audioBlob);
      handleCancel();
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-bg-elevated border-2 border-flame-primary rounded-2xl p-4"
    >
      <div className="flex items-center gap-3">
        {!audioBlob ? (
          <>
            {/* Recording UI */}
            {!isRecording ? (
              <>
                <Button
                  onClick={startRecording}
                  disabled={isSending}
                  className="flex-1 bg-gradient-hero text-white font-bold py-3 rounded-xl"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Gravar Áudio
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSending}
                  className="text-text-tertiary hover:text-text-primary"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1 flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-3 h-3 rounded-full bg-danger"
                  />
                  <span className="text-text-primary font-mono text-lg font-bold">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                <Button
                  onClick={stopRecording}
                  className="bg-danger hover:bg-danger/80 text-white font-bold py-3 px-6 rounded-xl"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Parar
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            {/* Preview UI */}
            <div className="flex-1 flex items-center gap-3">
              <audio src={URL.createObjectURL(audioBlob)} controls className="flex-1" />
              <span className="text-text-tertiary text-sm">
                {formatTime(recordingTime)}
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isSending}
              className="text-danger hover:text-danger hover:bg-danger/10"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending}
              className="bg-gradient-hero text-white font-bold py-3 px-6 rounded-xl"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
