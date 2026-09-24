import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Midi } from '@tonejs/midi';
import { Download, Music2, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import Soundfont, { Player } from 'soundfont-player';

interface MidiPlayerProps {
  url: string;
  title: string;
}

interface MidiNote {
  midi: number;
  time: number;
  duration: number;
  velocity: number;
}

const PIANO_ROLL_HEIGHT = 280;
const RULER_HEIGHT = 24;
const PIXELS_PER_SECOND = 48;
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

function PianoRoll({
  notes,
  duration,
  position,
  onSeek,
}: {
  notes: MidiNote[];
  duration: number;
  position: number;
  onSeek: (time: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { minimumPitch, maximumPitch } = useMemo(() => {
    if (notes.length === 0) return { minimumPitch: 21, maximumPitch: 108 };
    return {
      minimumPitch: Math.max(0, Math.min(...notes.map((note) => note.midi)) - 2),
      maximumPitch: Math.min(127, Math.max(...notes.map((note) => note.midi)) + 2),
    };
  }, [notes]);
  const pitchCount = maximumPitch - minimumPitch + 1;
  const noteAreaHeight = PIANO_ROLL_HEIGHT - RULER_HEIGHT;
  const rowHeight = noteAreaHeight / pitchCount;
  const rollWidth = Math.max(900, Math.ceil(duration * PIXELS_PER_SECOND));
  const seconds = Array.from({ length: Math.ceil(duration) + 1 }, (_, index) => index);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const x = position * PIXELS_PER_SECOND;
    const leftGuard = scroller.scrollLeft + scroller.clientWidth * 0.2;
    const rightGuard = scroller.scrollLeft + scroller.clientWidth * 0.8;
    if (x < leftGuard || x > rightGuard) {
      scroller.scrollLeft = Math.max(0, x - scroller.clientWidth * 0.35);
    }
  }, [position]);

  const seekFromRoll = (event: MouseEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(duration, (event.clientX - bounds.left) / PIXELS_PER_SECOND)));
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white" aria-label="Piano roll visualization">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-gray-500">Piano roll</span>
        <span className="font-mono text-[9px] text-gray-400">First onset normalized to 0:01</span>
      </div>
      <div className="flex">
        <div className="relative z-10 h-[280px] w-12 shrink-0 border-r border-gray-200 bg-white shadow-[4px_0_8px_rgba(15,23,42,0.05)]">
          <div className="h-6 border-b border-gray-200 bg-gray-50" />
          {Array.from({ length: pitchCount }, (_, index) => maximumPitch - index).map((pitch) => {
            const isBlack = BLACK_PITCH_CLASSES.has(pitch % 12);
            return (
              <div
                key={pitch}
                className={`absolute right-0 border-b border-gray-100 ${isBlack ? 'w-8 bg-gray-800' : 'w-full bg-white'}`}
                style={{ top: RULER_HEIGHT + (maximumPitch - pitch) * rowHeight, height: Math.max(1, rowHeight) }}
              >
                {pitch % 12 === 0 && rowHeight >= 4 ? (
                  <span className="absolute left-1 top-0 font-mono text-[7px] text-gray-400">C{Math.floor(pitch / 12) - 1}</span>
                ) : null}
              </div>
            );
          })}
        </div>

        <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto">
          <svg
            width={rollWidth}
            height={PIANO_ROLL_HEIGHT}
            className="block cursor-crosshair bg-white"
            onClick={seekFromRoll}
            role="img"
            aria-label={`Piano roll with ${notes.length} notes`}
          >
            <rect width={rollWidth} height={RULER_HEIGHT} fill="#f8fafc" />
            {Array.from({ length: pitchCount }, (_, index) => maximumPitch - index).map((pitch) => (
              <rect
                key={`row-${pitch}`}
                x={0}
                y={RULER_HEIGHT + (maximumPitch - pitch) * rowHeight}
                width={rollWidth}
                height={rowHeight}
                fill={BLACK_PITCH_CLASSES.has(pitch % 12) ? '#f8fafc' : '#ffffff'}
              />
            ))}
            {seconds.map((second) => (
              <g key={second}>
                <line
                  x1={second * PIXELS_PER_SECOND}
                  x2={second * PIXELS_PER_SECOND}
                  y1={RULER_HEIGHT}
                  y2={PIANO_ROLL_HEIGHT}
                  stroke={second % 5 === 0 ? '#cbd5e1' : '#eef2f7'}
                  strokeWidth={second % 5 === 0 ? 1 : 0.5}
                />
                {second % 5 === 0 ? (
                  <text x={second * PIXELS_PER_SECOND + 4} y={16} fill="#94a3b8" fontSize="9" fontFamily="monospace">
                    {formatTime(second)}
                  </text>
                ) : null}
              </g>
            ))}
            {notes.map((note, index) => (
              <rect
                key={`${note.midi}-${note.time}-${index}`}
                x={note.time * PIXELS_PER_SECOND}
                y={RULER_HEIGHT + (maximumPitch - note.midi) * rowHeight + Math.min(1, rowHeight * 0.12)}
                width={Math.max(2, note.duration * PIXELS_PER_SECOND)}
                height={Math.max(1.5, rowHeight - Math.min(2, rowHeight * 0.24))}
                rx={Math.min(2, rowHeight / 3)}
                fill="#4f46e5"
                opacity={0.48 + note.velocity * 0.5}
              />
            ))}
            <line
              x1={position * PIXELS_PER_SECOND}
              x2={position * PIXELS_PER_SECOND}
              y1={0}
              y2={PIANO_ROLL_HEIGHT}
              stroke="#ef4444"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}

export default function MidiPlayer({ url, title }: MidiPlayerProps) {
  const [notes, setNotes] = useState<MidiNote[]>([]);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMidiLoading, setIsMidiLoading] = useState(true);
  const [isInstrumentLoading, setIsInstrumentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const instrumentRef = useRef<Player | null>(null);
  const instrumentPromiseRef = useRef<Promise<Player> | null>(null);
  const scheduledRef = useRef<Array<{ stop: (when?: number) => void }>>([]);
  const animationRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const offsetRef = useRef(0);

  const stopScheduled = useCallback(() => {
    scheduledRef.current.forEach((node) => node.stop());
    scheduledRef.current = [];
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsMidiLoading(true);
    setError(null);
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`MIDI request failed (${response.status})`);
        return response.arrayBuffer();
      })
      .then((buffer) => {
        if (cancelled) return;
        const midi = new Midi(buffer);
        const rawNotes = midi.tracks
          .flatMap((track) => track.notes)
          .map((note) => ({
            midi: note.midi,
            time: note.time,
            duration: note.duration,
            velocity: note.velocity,
          }))
          .sort((left, right) => left.time - right.time);
        const shift = 1 - (rawNotes[0]?.time ?? 1);
        const flattened = rawNotes.map((note) => ({
          ...note,
          time: Math.max(0, note.time + shift),
        }));
        const normalizedDuration = Math.max(
          1,
          ...flattened.map((note) => note.time + note.duration),
        );
        setNotes(flattened);
        setDuration(normalizedDuration);
        setPosition(0);
        offsetRef.current = 0;
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load MIDI.');
      })
      .finally(() => {
        if (!cancelled) setIsMidiLoading(false);
      });
    return () => {
      cancelled = true;
      stopScheduled();
    };
  }, [stopScheduled, url]);

  useEffect(() => {
    if (gainRef.current && contextRef.current) {
      gainRef.current.gain.setTargetAtTime(volume, contextRef.current.currentTime, 0.01);
    }
  }, [volume]);

  useEffect(() => () => {
    stopScheduled();
    instrumentRef.current?.stop();
    void contextRef.current?.close();
  }, [stopScheduled]);

  const ensureInstrument = useCallback(async (): Promise<Player> => {
    if (instrumentRef.current) return instrumentRef.current;
    if (instrumentPromiseRef.current) return instrumentPromiseRef.current;

    const AudioContextClass = window.AudioContext
      || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = contextRef.current ?? new AudioContextClass();
    contextRef.current = context;
    await context.resume();

    const gain = gainRef.current ?? context.createGain();
    gain.gain.value = volume;
    if (!gainRef.current) gain.connect(context.destination);
    gainRef.current = gain;

    setIsInstrumentLoading(true);
    const promise = Soundfont.instrument(context, 'acoustic_grand_piano', {
      destination: gain,
      format: 'mp3',
      soundfont: 'MusyngKite',
    });
    instrumentPromiseRef.current = promise;
    try {
      const instrument = await promise;
      instrumentRef.current = instrument;
      return instrument;
    } finally {
      setIsInstrumentLoading(false);
    }
  }, [volume]);

  const pause = useCallback(() => {
    const elapsed = (performance.now() - startedAtRef.current) / 1000;
    offsetRef.current = Math.min(duration, offsetRef.current + Math.max(0, elapsed));
    setPosition(offsetRef.current);
    setIsPlaying(false);
    stopScheduled();
  }, [duration, stopScheduled]);

  const scheduleFrom = useCallback((offset: number, instrument: Player) => {
    const context = contextRef.current;
    if (!context) return;
    stopScheduled();
    offsetRef.current = offset;
    startedAtRef.current = performance.now();
    const startAt = context.currentTime + 0.05;

    scheduledRef.current = notes
      .filter((note) => note.time + note.duration > offset)
      .map((note) => {
        const audibleStart = Math.max(note.time, offset);
        return instrument.play(note.midi.toString(), startAt + audibleStart - offset, {
          duration: Math.max(0.03, note.time + note.duration - audibleStart),
          gain: Math.max(0.08, note.velocity),
        });
      });

    const update = () => {
      const next = offsetRef.current + (performance.now() - startedAtRef.current) / 1000;
      if (next >= duration) {
        stopScheduled();
        offsetRef.current = 0;
        setPosition(duration);
        setIsPlaying(false);
        return;
      }
      setPosition(next);
      animationRef.current = requestAnimationFrame(update);
    };
    animationRef.current = requestAnimationFrame(update);
    setIsPlaying(true);
  }, [duration, notes, stopScheduled]);

  const togglePlayback = async () => {
    if (isPlaying) {
      pause();
      return;
    }
    try {
      setError(null);
      const instrument = await ensureInstrument();
      const start = position >= duration - 0.02 ? 0 : position;
      setPosition(start);
      scheduleFrom(start, instrument);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Piano soundfont could not be loaded.');
    }
  };

  const seek = (next: number) => {
    const bounded = Math.max(0, Math.min(duration, next));
    stopScheduled();
    offsetRef.current = bounded;
    setPosition(bounded);
    if (isPlaying && instrumentRef.current) scheduleFrom(bounded, instrumentRef.current);
  };

  const reset = () => {
    stopScheduled();
    offsetRef.current = 0;
    setPosition(0);
    setIsPlaying(false);
  };

  const busy = isMidiLoading || isInstrumentLoading;

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" aria-label={`${title} MIDI player`}>
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-gray-50 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-lg bg-indigo-600 p-2 text-white">
            <Music2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">{title}</div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-gray-400">
              Acoustic grand piano soundfont
            </div>
          </div>
        </div>
        <a
          href={url}
          download
          title="Download input MIDI"
          className="rounded border border-gray-200 bg-white p-2 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-700"
        >
          <Download size={15} />
        </a>
      </div>

      <div className="space-y-5 p-5">
        <PianoRoll
          notes={notes}
          duration={duration}
          position={position}
          onSeek={seek}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void togglePlayback()}
            disabled={isMidiLoading || notes.length === 0}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 ${
              isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-900 hover:bg-gray-700'
            }`}
            aria-label={isPlaying ? 'Pause input MIDI' : 'Play input MIDI'}
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>

          <div className="min-w-0 flex-1">
            <input
              type="range"
              min={0}
              max={Math.max(duration, 0.01)}
              step={0.01}
              value={Math.min(position, Math.max(duration, 0.01))}
              onChange={(event) => seek(Number(event.target.value))}
              className="w-full accent-indigo-600"
              aria-label="MIDI playback position"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-gray-400">
              <span>{formatTime(position)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={reset}
            className="rounded p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Reset MIDI playback"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
          <Volume2 size={15} className="text-gray-400" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="w-32 accent-gray-900"
            aria-label="MIDI playback volume"
          />
          <span className="font-mono text-[10px] text-gray-400">{Math.round(volume * 100)}%</span>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-400">
            {busy ? (isMidiLoading ? 'Loading MIDI…' : 'Loading piano…') : `${notes.length} notes`}
          </span>
        </div>

        {error ? <p className="text-xs text-red-600" role="alert">{error}</p> : null}
      </div>
    </section>
  );
}
