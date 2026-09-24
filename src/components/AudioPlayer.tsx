import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  url: string;
  name?: string;
  isPlaying?: boolean;
  onTogglePlay?: (isPlaying: boolean) => void;
}

export default function AudioPlayer({ url, name, isPlaying: externalIsPlaying, onTogglePlay }: AudioPlayerProps) {
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.warn("Audio playback failed:", err);
        if (onTogglePlay) onTogglePlay(false);
        else setInternalIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, onTogglePlay]);

  const togglePlay = () => {
    const nextState = !isPlaying;
    if (onTogglePlay) {
      onTogglePlay(nextState);
    } else {
      setInternalIsPlaying(nextState);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const reset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
      if (onTogglePlay) onTogglePlay(false);
      else setInternalIsPlaying(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-100 p-2 px-3 rounded flex flex-col gap-1.5 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="mono-label text-[8px] tracking-widest font-bold">Synthesized Audio</span>
          <span className="font-mono text-[10px] truncate max-w-[150px] text-gray-500">{name || 'Recording_01.wav'}</span>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={reset}
            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400"
            title="Reset"
          >
            <RotateCcw size={12} />
          </button>
          <button 
            onClick={togglePlay}
            className={`p-1.5 rounded transition-all shadow-sm ${
              isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
          </button>
        </div>
      </div>
      
      <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-gray-900 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <audio 
        ref={audioRef} 
        src={url} 
        onTimeUpdate={onTimeUpdate} 
        onEnded={() => {
          if (onTogglePlay) onTogglePlay(false);
          else setInternalIsPlaying(false);
        }}
      />
    </div>
  );
}

