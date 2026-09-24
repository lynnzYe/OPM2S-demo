import React, { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize, Play, Pause, AlertCircle } from 'lucide-react';
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

interface ScoreDisplayProps {
  xmlUrl: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

const OSMD_THROTTLE_UPDATE_MS = 150;

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ xmlUrl, isPlaying, onTogglePlay }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(0.6);
  
  const isLoadedRef = useRef<boolean>(false);
  const isRenderingRef = useRef<boolean>(false);
  const pendingUpdateRef = useRef<boolean>(false);
  const throttleRef = useRef<number | null>(null);

  const initOSMD = useCallback(async () => {
    if (!containerRef.current || osmdRef.current) return;
    
    try {
      const osmd = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        drawPartNames: false,
        drawTitle: false,
        drawSubtitle: false,
        drawComposer: false,
        backend: "canvas",
        autoBeam: true,
        coloringMode: 0,
        drawLyrics: false,
        drawFingerings: false,
      });

      const rules = (osmd as any).rules;
      if (rules) {
        rules.EvenlySpreadMeasureWidths = false;
        rules.VoiceSpacingAddend = 2.0;
        rules.VoiceSpacingMultiplierVexflow = 1.0;
        rules.MinNoteDistance = 6.0;
        rules.PreferredNoteDistance = 8.0;
        rules.NoteToNoteMargin = 4.0;
        rules.MeasureLeftDistance = 10.0;
        rules.MeasureRightDistance = 10.0;
        rules.StaffDistance = 10;
        rules.MinimumDistanceBetweenSystems = 15;
        rules.BetweenStaffDistance = 5;
      }

      osmdRef.current = osmd;
    } catch (err) {
      console.error("OSMD Init Error:", err);
      setError("Failed to initialize score renderer.");
    }
  }, []);

  const performRender = async () => {
    if (!osmdRef.current || isRenderingRef.current) {
      pendingUpdateRef.current = true;
      return;
    }

    isRenderingRef.current = true;
    try {
      // Only render if something has been loaded
      if (isLoadedRef.current) {
        osmdRef.current.zoom = zoom;
        osmdRef.current.render();
      }
    } catch (err) {
      console.error("OSMD Render Error:", err);
    } finally {
      isRenderingRef.current = false;
      if (pendingUpdateRef.current) {
        pendingUpdateRef.current = false;
        performRender();
      }
    }
  };

  const loadAndRender = async (url: string) => {
    await initOSMD();
    if (!osmdRef.current) return;

    // Wait for current rendering to finish if any
    if (isRenderingRef.current) {
      setTimeout(() => loadAndRender(url), 50);
      return;
    }

    setLoading(true);
    isRenderingRef.current = true;
    try {
      let content = "";
      if (url.startsWith('data:')) {
        content = atob(url.split(',')[1]);
      } else {
        const response = await fetch(url);
        if (response.ok) {
          content = await response.text();
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      }

      await osmdRef.current.load(content);
      isLoadedRef.current = true;
      osmdRef.current.zoom = zoom;
      osmdRef.current.render();
      setError(null);
    } catch (err) {
      console.error("OSMD Load/Render Error:", err);
      setError("Rendering error.");
    } finally {
      setLoading(false);
      isRenderingRef.current = false;
    }
  };

  useEffect(() => {
    if (throttleRef.current) window.clearTimeout(throttleRef.current);
    
    throttleRef.current = window.setTimeout(() => {
      loadAndRender(xmlUrl);
    }, OSMD_THROTTLE_UPDATE_MS);

    return () => {
      if (throttleRef.current) window.clearTimeout(throttleRef.current);
    };
  }, [xmlUrl]);

  useEffect(() => {
    performRender();
  }, [zoom]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));
  const handleResetZoom = () => setZoom(0.75);

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden relative flex flex-col shadow-sm">
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
           <button 
             onClick={onTogglePlay}
             className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold uppercase transition-all shadow-sm border ${
               isPlaying 
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-700'
             }`}
           >
             {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
             <span>{isPlaying ? 'Pause' : 'Play Score'}</span>
           </button>
           <div className="h-4 w-px bg-gray-200" />
           <h2 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">
             OpenSheetMusicDisplay
           </h2>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-red-500 text-[10px] uppercase font-bold mr-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex bg-white border border-gray-200 rounded p-0.5">
            <button onClick={handleZoomOut} className="p-1 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors">
              <ZoomOut size={14} />
            </button>
            <div className="px-2 flex items-center justify-center text-[10px] font-mono font-bold text-gray-400 min-w-[35px]">
              {Math.round(zoom * 100)}%
            </div>
            <button onClick={handleZoomIn} className="p-1 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors">
              <ZoomIn size={14} />
            </button>
          </div>
          
          <button onClick={handleResetZoom} className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-400 transition-colors">
            <Maximize size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white min-h-[400px] flex items-start justify-center relative bg-white">
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
             <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
             <span className="mono-label tracking-widest font-bold">Engraving Notation...</span>
          </div>
        )}
        <div ref={containerRef} className="w-full" />
      </div>

      <style>{`
        canvas {
          margin: 0 auto !important;
          display: block !important;
          max-width: 100% !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          background-color: white;
        }
      `}</style>
    </div>
  );
};

export default ScoreDisplay;

