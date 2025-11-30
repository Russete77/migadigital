"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { motion } from "framer-motion";

interface CustomAudioPlayerProps {
  src: string;
  duration?: number;
  isOwnMessage?: boolean;
}

export function CustomAudioPlayer({ src, duration, isOwnMessage = false }: CustomAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isBlobUrl = src.startsWith('blob:');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('🔊 Inicializando player de áudio:', { src, duration });

    const updateTime = () => setCurrentTime(audio.currentTime);

    const updateDuration = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        const detectedDuration = audio.duration;
        console.log('⏱️ Duração detectada pelo audio element:', detectedDuration.toFixed(2), 'segundos');
        console.log('⏱️ Duração passada como prop:', duration);

        // SEMPRE usar a duração detectada pelo audio element, ela é a mais precisa!
        setAudioDuration(detectedDuration);

        // Alertar se houver diferença significativa
        if (duration && Math.abs(detectedDuration - duration) > 0.5) {
          console.warn('⚠️ Diferença entre duração detectada e prop:', {
            detected: detectedDuration.toFixed(2) + 's',
            prop: duration.toFixed(2) + 's',
            diff: (detectedDuration - duration).toFixed(2) + 's'
          });
        }
      }
    };

    const handleEnd = () => {
      console.log('✅ Áudio terminou de reproduzir');
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      const error = (e.target as HTMLAudioElement).error;
      console.error('❌ Erro no áudio:', {
        code: error?.code,
        message: error?.message,
        src: audio.src
      });
      setIsPlaying(false);
    };

    const handleLoadStart = () => {
      if (isBlobUrl) console.log('📡 Preview: Carregamento iniciado');
    };

    const handleCanPlay = () => {
      if (isBlobUrl) console.log('✅ Preview: Áudio pronto para reproduzir');
    };

    const handleLoadedData = () => {
      if (isBlobUrl) console.log('📦 Preview: Dados carregados');
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0 && isFinite(audio.duration)) {
        const buffered = audio.buffered.end(audio.buffered.length - 1);
        const progress = (buffered / audio.duration) * 100;
        if (!isBlobUrl) { // Só loga para URLs remotas, não para preview
          console.log('📊 Buffer:', buffered.toFixed(2) + 's de', audio.duration.toFixed(2) + 's', '(' + progress.toFixed(1) + '%)');
        }
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("ended", handleEnd);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("progress", handleProgress);

    // Carregar áudio imediatamente - o delay já foi dado no onstop
    audio.load();
    if (isBlobUrl) {
      console.log('🎬 Preview: Carregando blob URL...');
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("ended", handleEnd);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("progress", handleProgress);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      console.log('⏸️ Áudio pausado em', audio.currentTime.toFixed(2) + 's');
      setIsPlaying(false);
    } else {
      console.log('▶️ Iniciando reprodução do áudio');
      try {
        await audio.play();
        setIsPlaying(true);
        console.log('✅ Reprodução iniciada com sucesso');
      } catch (error) {
        console.error('❌ Erro ao reproduzir:', error);
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration)) return;

    const time = parseFloat(e.target.value);

    try {
      audio.currentTime = time;
      setCurrentTime(time);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        crossOrigin="anonymous"
        playsInline
      />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 flex-shrink-0 ${
          isOwnMessage
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-gradient-hero hover:opacity-90 text-white"
        }`}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform/Progress Container */}
      <div className="flex-1 min-w-0">
        {/* Progress Bar */}
        <div className="relative h-1 mb-1">
          <div
            className={`absolute inset-0 rounded-full ${
              isOwnMessage ? "bg-white/20" : "bg-white/10"
            }`}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`absolute inset-y-0 left-0 rounded-full ${
              isOwnMessage ? "bg-white" : "bg-gradient-hero"
            }`}
          />
          {/* Invisible range input for seeking */}
          <input
            type="range"
            min="0"
            max={audioDuration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            disabled={!isFinite(audioDuration) || audioDuration === 0}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-between text-xs">
          <span className={isOwnMessage ? "text-white/70" : "text-text-tertiary"}>
            {formatTime(currentTime)}
          </span>
          <span className={isOwnMessage ? "text-white/70" : "text-text-tertiary"}>
            {formatTime(audioDuration)}
          </span>
        </div>
      </div>

      {/* Volume Icon */}
      <Volume2
        className={`w-4 h-4 flex-shrink-0 ${
          isOwnMessage ? "text-white/70" : "text-text-tertiary"
        }`}
      />
    </div>
  );
}
