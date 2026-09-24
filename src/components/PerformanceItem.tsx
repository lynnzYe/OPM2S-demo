import { lazy, Suspense, useState } from 'react';
import { Download } from 'lucide-react';
import { DemoPiece } from '../constants';
import AudioPlayer from './AudioPlayer';

const MidiPlayer = lazy(() => import('./MidiPlayer'));
const ScoreDisplay = lazy(() => import('./ScoreDisplay'));

type ViewMode = 'live' | 'midi' | 'score';
type ScoreMethod = keyof DemoPiece['scoreComparison'];

interface PerformanceItemProps {
  performance: DemoPiece;
  index: number;
}

const TABS: Array<{ id: ViewMode; label: string }> = [
  { id: 'live', label: 'Live Transcription Demo' },
  { id: 'midi', label: 'Input MIDI' },
  { id: 'score', label: 'Transcribed Score Comparison' },
];

const SCORE_METHODS: ScoreMethod[] = ['hybrid', 'liu', 'beyer'];

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center text-xs uppercase tracking-widest text-gray-400">
      {label}
    </div>
  );
}

export default function PerformanceItem({ performance, index }: PerformanceItemProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [isScorePlaying, setIsScorePlaying] = useState(false);
  const [scoreMethod, setScoreMethod] = useState<ScoreMethod>('hybrid');
  const score = performance.scoreComparison[scoreMethod];

  const selectTab = (mode: ViewMode) => {
    setIsScorePlaying(false);
    setViewMode(mode);
  };

  const selectScoreMethod = (method: ScoreMethod) => {
    setIsScorePlaying(false);
    setScoreMethod(method);
  };

  return (
    <article
      id={`performance-${performance.id}`}
      className="mb-16 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      <header className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
        <h3 className="text-base font-bold text-gray-800">
          Example {index + 1}: {performance.title}
        </h3>
        <p className="mb-3 mt-5 text-xs leading-relaxed text-gray-500">
          {performance.description}
        </p>
      </header>

      <div className="p-4 sm:p-6">
        <div
          className="mb-6 grid grid-cols-3 gap-3 border-b border-gray-200 font-medium sm:flex sm:gap-6 sm:text-sm"
          role="tablist"
          aria-label={`${performance.title} media`}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={viewMode === tab.id}
              onClick={() => selectTab(tab.id)}
              className={`border-b-2 px-1 pb-3 text-center text-[11px] leading-tight transition-colors sm:shrink-0 sm:text-sm ${
                viewMode === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[260px] sm:min-h-[400px]">
          {viewMode === 'live' ? (
            <div className="mx-auto max-w-4xl" role="tabpanel">
              <div className="aspect-video overflow-hidden rounded border border-gray-100 bg-black shadow-lg">
                <video
                  key={performance.liveVideoUrl}
                  src={performance.liveVideoUrl}
                  controls
                  preload="metadata"
                  playsInline
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="mt-4 text-center text-xs italic text-gray-400">
                Live hybrid transcription visualization
              </div>
            </div>
          ) : null}

          {viewMode === 'midi' ? (
            <div className="mx-auto max-w-3xl py-6 sm:py-12" role="tabpanel">
              <Suspense fallback={<LoadingPanel label="Loading MIDI player…" />}>
                <MidiPlayer
                  url={performance.inputMidiUrl}
                  title={`${performance.title} — input performance`}
                />
              </Suspense>
            </div>
          ) : null}

          {viewMode === 'score' ? (
            <div className="space-y-6" role="tabpanel">
              <div className="flex flex-wrap gap-2" aria-label="Transcription method">
                {SCORE_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => selectScoreMethod(method)}
                    className={`rounded border px-4 py-2 text-xs transition-colors ${
                      scoreMethod === method
                        ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {performance.scoreComparison[method].label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                    {score.label}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {scoreMethod === 'hybrid'
                      ? 'Immediate online predictions combined with periodic offline refinement.'
                      : 'Offline PM2S baseline transcription.'}
                  </p>
                </div>
                <a
                  href={score.musicXmlUrl}
                  download
                  className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
                >
                  <Download size={14} />
                  MusicXML
                </a>
              </div>

              <Suspense fallback={<LoadingPanel label="Loading score renderer…" />}>
                <ScoreDisplay
                  xmlUrl={score.musicXmlUrl}
                  isPlaying={isScorePlaying}
                  onTogglePlay={() => setIsScorePlaying((playing) => !playing)}
                />
              </Suspense>
              <AudioPlayer
                key={score.audioUrl}
                url={score.audioUrl}
                name={`${performance.id}-${scoreMethod}.mp3`}
                isPlaying={isScorePlaying}
                onTogglePlay={setIsScorePlaying}
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
