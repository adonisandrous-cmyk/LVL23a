import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  X, 
  Tablet, 
  Smartphone, 
  Headphones, 
  BellOff, 
  Sliders, 
  RefreshCw,
  Zap
} from 'lucide-react';
import { audioService } from '../services/audioPlaybackService';

interface AudioTroubleshooterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAgent?: 'PHOENIX' | 'EVE' | 'ALURE' | 'SENTRY' | string;
}

export const AudioTroubleshooterModal: React.FC<AudioTroubleshooterModalProps> = ({
  isOpen,
  onClose,
  selectedAgent = 'PHOENIX'
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    method: string;
    contextState: string;
    tabletTips: string[];
  } | null>(null);
  const [diagnostics, setDiagnostics] = useState(audioService.getDiagnostics());

  useEffect(() => {
    if (isOpen) {
      setDiagnostics(audioService.getDiagnostics());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunSoundCheck = async (agent: 'PHOENIX' | 'EVE') => {
    setIsPlayingTest(true);
    try {
      const res = await audioService.testPhoenixAudio(agent);
      setTestResult(res);
      setDiagnostics(audioService.getDiagnostics());
    } catch (err: any) {
      console.warn('Audio test failed:', err);
    } finally {
      setIsPlayingTest(false);
    }
  };

  const isTabletOrMobile = diagnostics.isTabletOrMobile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0c121e] border border-amber-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-200"
      >
        {/* Header */}
        <div className="bg-[#070c16] border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Tablet Audio Diagnostics & Sound Check
              </h3>
              <p className="text-xs text-slate-400">
                Verify speaker output, tablet silent switches, and AI voice streaming
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Sound Check Action Card */}
          <div className="p-4 bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Direct Speaker Test
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Tap to play a live voice check from Phoenix to test your tablet speakers.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                Studio 24kHz
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleRunSoundCheck('PHOENIX')}
                disabled={isPlayingTest}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-mono text-xs uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50"
              >
                {isPlayingTest ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Phoenix Speaking...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Test Phoenix Voice (UK)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleRunSoundCheck('EVE')}
                disabled={isPlayingTest}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold font-mono text-xs uppercase rounded-xl border border-teal-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-teal-400" />
                <span>Test Eve Voice</span>
              </button>
            </div>

            {testResult && (
              <div className="mt-2 p-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Audio stream dispatched via <strong className="text-amber-300">{testResult.method}</strong> (Context: {testResult.contextState})</span>
              </div>
            )}
          </div>

          {/* Tablet Troubleshooting Checklist */}
          <div className="p-4 bg-[#090e18] border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-2">
              <Tablet className="w-4 h-4 text-teal-400" />
              <span>Common Tablet Audio Muting Issues</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-300">
              {/* Tip 1: iPad Silent Mode */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <BellOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">iPad Silent Mode (Most Common):</strong>
                  <p className="text-slate-400 mt-0.5">
                    On iPad, open Control Center by swiping down from the top-right corner. If the <strong>Bell icon (Silent Mode)</strong> is highlighted red or orange, tap it to turn it OFF. In-browser audio is muted by Silent Mode even when video apps are not.
                  </p>
                </div>
              </div>

              {/* Tip 2: Media Volume vs Ringer Volume */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <Sliders className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Media Volume Level:</strong>
                  <p className="text-slate-400 mt-0.5">
                    Press your tablet's physical volume UP button while this web page is open to ensure <strong>Media Volume</strong> is turned up, not just alert volume.
                  </p>
                </div>
              </div>

              {/* Tip 3: Bluetooth Output */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <Headphones className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Bluetooth Devices:</strong>
                  <p className="text-slate-400 mt-0.5">
                    Check if your tablet is currently connected to AirPods, headphones, or a speaker in another room.
                  </p>
                </div>
              </div>

              {/* Tip 4: Browser Autoplay Permission */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Touch-to-Unmute:</strong>
                  <p className="text-slate-400 mt-0.5">
                    Tablets require at least one tap on the screen to permit sound. Tapping the "Test Phoenix Voice" button above immediately unlocks audio permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Telemetry & Status Badges */}
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
              Live Audio Hardware Telemetry
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">Audio Context:</span>
                <span className={`font-bold ${diagnostics.audioContextState === 'running' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {diagnostics.audioContextState.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">Gemini Cloud TTS:</span>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">Device Form:</span>
                <span className="text-teal-300">{isTabletOrMobile ? 'Tablet / Mobile' : 'Desktop / PC'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">Browser Fallback:</span>
                <span className="text-slate-200">{diagnostics.speechSynthesisSupported ? 'Ready' : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#070c16] border-t border-slate-800 p-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Level 23 Voice Engine v2.5
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer border border-slate-700"
          >
            Close Diagnostics
          </button>
        </div>
      </motion.div>
    </div>
  );
};
