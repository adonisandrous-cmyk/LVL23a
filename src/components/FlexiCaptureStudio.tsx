import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Download,
  Copy,
  Check,
  Trash2,
  Monitor,
  Eye,
  X,
  FileCode,
  Zap,
  Clock,
  Sparkles,
  ShieldAlert,
  HardDrive,
  Maximize2
} from 'lucide-react';
import {
  FlexiCapture,
  ScreenShotModel,
  FlexiCaptureState,
  FlexiCaptureStatus
} from '../lib/flexicapture';

export default function FlexiCaptureStudio() {
  const flexiCaptureRef = useRef<FlexiCapture | null>(null);

  // Component States
  const [state, setState] = useState<FlexiCaptureState>({
    status: 'idle',
    maxMinute: 5,
    enableCompress: true,
    maxSize: 400 * 1024,
    convertBase64: true,
    exceptAppName: 'flexitrac',
    isPaused: false,
    isDisposed: false,
    currentIntervalSeconds: 0,
    secondsRemaining: 0,
    lastCapturedAt: null,
    captureCount: 0
  });

  const [captures, setCaptures] = useState<ScreenShotModel[]>([]);
  const [selectedCapture, setSelectedCapture] = useState<ScreenShotModel | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [hasScreenPermission, setHasScreenPermission] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'monitor' | 'gallery' | 'integration'>('monitor');

  // Initialize FlexiCapture engine instance
  useEffect(() => {
    const engine = new FlexiCapture({
      maxMinute: 3,
      enableCompress: true,
      maxSize: 400 * 1024,
      convertBase64: true,
      exceptAppName: 'flexitrac'
    });

    engine.onCaptured = (model) => {
      setCaptures((prev) => [model, ...prev]);
      setState(engine.getState());
      setErrorNotice(null);
    };

    engine.onCaptureError = (err) => {
      setErrorNotice(err);
      setState(engine.getState());
    };

    engine.onTick = (remaining, total) => {
      setState((prev) => ({
        ...prev,
        secondsRemaining: remaining,
        currentIntervalSeconds: total
      }));
    };

    engine.onStatusChange = (status) => {
      setState(engine.getState());
    };

    engine.onRandomMinutes = (mins) => {
      setState(engine.getState());
    };

    flexiCaptureRef.current = engine;
    setState(engine.getState());

    return () => {
      engine.dispose();
    };
  }, []);

  // Controls
  const handleStart = () => {
    flexiCaptureRef.current?.start();
    if (flexiCaptureRef.current) {
      setState(flexiCaptureRef.current.getState());
    }
  };

  const handlePause = () => {
    flexiCaptureRef.current?.togglePause();
    if (flexiCaptureRef.current) {
      setState(flexiCaptureRef.current.getState());
    }
  };

  const handleCaptureNow = async () => {
    await flexiCaptureRef.current?.captureNow();
    if (flexiCaptureRef.current) {
      setState(flexiCaptureRef.current.getState());
    }
  };

  const handleReset = () => {
    flexiCaptureRef.current?.restart();
    if (flexiCaptureRef.current) {
      setState(flexiCaptureRef.current.getState());
    }
  };

  const handleRequestScreen = async () => {
    const granted = await flexiCaptureRef.current?.requestDisplayPermission();
    setHasScreenPermission(Boolean(granted));
  };

  const handleMaxMinuteChange = (mins: number) => {
    flexiCaptureRef.current?.setMaxMinute(mins);
    if (flexiCaptureRef.current) {
      setState(flexiCaptureRef.current.getState());
    }
  };

  const handleMaxSizeChange = (kb: number) => {
    flexiCaptureRef.current?.setMaxSize(kb * 1024);
    if (flexiCaptureRef.current) {
      setState(flexiCaptureRef.current.getState());
    }
  };

  const handleToggleCompress = () => {
    flexiCaptureRef.current?.toggleCompress();
    if (flexiCaptureRef.current) {
      setState(flexiCaptureRef.current.getState());
    }
  };

  const handleToggleBase64 = () => {
    flexiCaptureRef.current?.toggleConvertBase64();
    if (flexiCaptureRef.current) {
      setState(flexiCaptureRef.current.getState());
    }
  };

  const handleExceptAppChange = (val: string) => {
    flexiCaptureRef.current?.setExceptAppName(val);
    if (flexiCaptureRef.current) {
      setState(flexiCaptureRef.current.getState());
    }
  };

  const handleCopyBase64 = (model: ScreenShotModel) => {
    if (model.base64Image) {
      navigator.clipboard.writeText(model.base64Image);
      setCopiedId(model.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleDownload = (model: ScreenShotModel) => {
    if (!model.previewUrl) return;
    const a = document.createElement('a');
    a.href = model.previewUrl;
    a.download = `flexicapture_${model.id}.jpg`;
    a.click();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const dm = 1;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-4 sm:p-6 text-slate-200">
      {/* Module Title Header */}
      <div className="bg-[#0b1220] border-2 border-teal-500/40 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_20px_rgba(20,184,166,0.15)] shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-950/80 border border-teal-500/50 flex items-center justify-center text-teal-400 shadow-md">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white font-heading tracking-wide">
                FLEXICAPTURE
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase font-black">
                PIECE: SCREEN CAPTURE & COMPRESSION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated randomized screenshot intervals, target-byte image compression, and active window detection.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-[#070b14] border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'monitor'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monitor & Controls
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Captures</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-teal-300">
              {captures.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('integration')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'integration'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Assembly API</span>
          </button>
        </div>
      </div>

      {/* Error / Filter Notice */}
      <AnimatePresence>
        {errorNotice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3 bg-amber-950/60 border border-amber-500/50 rounded-xl text-amber-200 text-xs font-mono flex items-center justify-between gap-3 shadow-md"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Filter Triggered / Notice:</strong> {errorNotice}
              </span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="p-1 hover:bg-amber-900/50 rounded text-amber-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tab 1: Monitor & Controls */}
      {activeTab === 'monitor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Live Status & Countdown */}
          <div className="lg:col-span-2 space-y-5">
            {/* Real-time State Card */}
            <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-teal-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Engine Telemetry
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                      state.status === 'running'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : state.status === 'capturing' || state.status === 'compressing'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                        : state.status === 'paused'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        state.status === 'running'
                          ? 'bg-emerald-400 animate-ping'
                          : state.status === 'capturing'
                          ? 'bg-amber-400'
                          : 'bg-slate-500'
                      }`}
                    />
                    <span>{state.status}</span>
                  </span>
                </div>
              </div>

              {/* Big Countdown / Timer Gauge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#050914] p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Next Capture Countdown
                  </span>
                  <div className="text-3xl font-black font-mono text-teal-400 my-1">
                    {state.status === 'running'
                      ? formatTime(state.secondsRemaining)
                      : state.status === 'paused'
                      ? 'PAUSED'
                      : '--:--'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Total Window: {formatTime(state.currentIntervalSeconds)}
                  </span>
                </div>

                <div className="bg-[#050914] p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Compression Target
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-400 my-1">
                    ≤ {Math.round(state.maxSize / 1024)} KB
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Quality stepping: 90% → 10%
                  </span>
                </div>

                <div className="bg-[#050914] p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Total Captures Logged
                  </span>
                  <div className="text-2xl font-black font-mono text-white my-1">
                    {state.captureCount}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono truncate">
                    Last: {state.lastCapturedAt ? new Date(state.lastCapturedAt).toLocaleTimeString() : 'None'}
                  </span>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {state.status === 'running' ? (
                  <button
                    onClick={handlePause}
                    className="flex-1 py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause Timer</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs uppercase rounded-lg transition-all shadow-[0_0_15px_rgba(52,211,153,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>{state.status === 'paused' ? 'Resume Timer' : 'Start Capture Timer'}</span>
                  </button>
                )}

                <button
                  onClick={handleCaptureNow}
                  className="py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-mono font-black text-xs uppercase rounded-lg transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                  title="Take instant screenshot"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Now</span>
                </button>

                <button
                  onClick={handleRequestScreen}
                  className={`py-2.5 px-3 border font-mono text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    hasScreenPermission
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                  title="Share physical screen or monitor for live display capturing"
                >
                  <Monitor className="w-4 h-4" />
                  <span>{hasScreenPermission ? 'Display Linked' : 'Link Screen'}</span>
                </button>

                <button
                  onClick={handleReset}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  title="Reset engine and dispose"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Latest Snapshot Quick Preview */}
            {captures.length > 0 && (
              <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      Most Recent Captured Frame
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedCapture(captures[0])}
                    className="text-xs font-mono text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand</span>
                  </button>
                </div>

                <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black aspect-video max-h-72 flex items-center justify-center">
                  <img
                    src={captures[0].previewUrl}
                    alt="Latest Capture"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm border border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono">
                    <div className="truncate min-w-0 pr-2">
                      <div className="text-white font-bold truncate">
                        {captures[0].windowInfo.appName} • {captures[0].windowInfo.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(captures[0].capturedAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-emerald-400 font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                        {formatBytes(captures[0].sizeBytes)}
                      </span>
                      <button
                        onClick={() => handleCopyBase64(captures[0])}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1"
                      >
                        {copiedId === captures[0].id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Base64</span>
                      </button>
                      <button
                        onClick={() => handleDownload(captures[0])}
                        className="px-2 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded text-[10px] flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Settings Panel (Matching flexicapture dart options) */}
          <div className="space-y-4">
            <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Sliders className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  FlexiCapture Parameters
                </h3>
              </div>

              {/* Slider 1: maxMinute */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Max Minutes (Interval Window)</span>
                  <span className="text-teal-400 font-bold">{state.maxMinute} min</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={state.maxMinute}
                  onChange={(e) => handleMaxMinuteChange(parseInt(e.target.value, 10))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Fixed Ratio (50%) + Random Ratio (50%) creates unpredictable intervals.
                </p>
              </div>

              {/* Slider 2: Target maxSize */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Target Max Size (Compression)</span>
                  <span className="text-emerald-400 font-bold">
                    {Math.round(state.maxSize / 1024)} KB
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={Math.round(state.maxSize / 1024)}
                  onChange={(e) => handleMaxSizeChange(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Iteratively compresses JPEG frames down until size is under threshold.
                </p>
              </div>

              {/* Toggles */}
              <div className="pt-2 space-y-3 border-t border-slate-800 text-xs">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-slate-300 font-mono">Enable Compression</span>
                  <input
                    type="checkbox"
                    checked={state.enableCompress}
                    onChange={handleToggleCompress}
                    className="w-4 h-4 accent-teal-400 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-slate-300 font-mono">Convert To Base64</span>
                  <input
                    type="checkbox"
                    checked={state.convertBase64}
                    onChange={handleToggleBase64}
                    className="w-4 h-4 accent-teal-400 rounded"
                  />
                </label>
              </div>

              {/* Exception App Name */}
              <div className="pt-3 border-t border-slate-800 space-y-1.5">
                <label className="text-xs font-mono text-slate-400 block">
                  Except App Name (Excluded from capture)
                </label>
                <input
                  type="text"
                  value={state.exceptAppName}
                  onChange={(e) => handleExceptAppChange(e.target.value)}
                  placeholder="e.g. flexitrac, banking, private"
                  className="w-full bg-[#050914] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-teal-400"
                />
                <p className="text-[10px] text-slate-500">
                  If the active window begins with this name, capture is safely skipped.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: Gallery of Captures */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Captured Screenshots Ledger ({captures.length})
            </h3>
            {captures.length > 0 && (
              <button
                onClick={() => setCaptures([])}
                className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {captures.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-[#090f1d]/50 space-y-3">
              <Camera className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-400 font-mono">No captures yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Press "Capture Now" or start the randomized timer to begin logging screenshots.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {captures.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#090f1d] border border-slate-800 rounded-xl overflow-hidden hover:border-teal-500/40 transition-all flex flex-col justify-between"
                >
                  <div
                    onClick={() => setSelectedCapture(item)}
                    className="relative aspect-video bg-black cursor-pointer group"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.id}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono">
                      Click to Enlarge
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2.5">
                    <div>
                      <div className="text-xs font-bold text-slate-200 truncate" title={item.windowInfo.title}>
                        {item.windowInfo.appName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate" title={item.windowInfo.title}>
                        {item.windowInfo.title}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-800/80">
                      <span className="text-emerald-400 font-bold">
                        {formatBytes(item.sizeBytes)}
                        {item.compressed && (
                          <span className="text-slate-500 text-[10px] ml-1">
                            (was {formatBytes(item.originalSizeBytes)})
                          </span>
                        )}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(item.capturedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleCopyBase64(item)}
                        className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Base64</span>
                      </button>
                      <button
                        onClick={() => handleDownload(item)}
                        className="py-1 px-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded text-xs font-mono flex items-center justify-center cursor-pointer"
                        title="Download JPG"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Tab 3: Integration & Assembly Guide */}
      {activeTab === 'integration' && (
        <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <FileCode className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              FlexiCapture Modular Assembly Reference
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            This module implements the exact API and lifecycle from <code className="text-teal-400">prabhuc94/flexicapture</code>. You can import and invoke it anywhere in the application or assemble it into client activity trackers.
          </p>

          <div className="bg-[#050811] p-4 rounded-xl border border-slate-800 font-mono text-xs text-teal-300 space-y-1 overflow-x-auto">
            <div className="text-slate-500">// 1. Import the FlexiCapture module</div>
            <div>import &#123; FlexiCapture &#125; from '../lib/flexicapture';</div>
            <br />
            <div className="text-slate-500">// 2. Initialize and configure parameters</div>
            <div>const captureEngine = new FlexiCapture(&#123;</div>
            <div className="pl-4">maxMinute: 5,</div>
            <div className="pl-4">enableCompress: true,</div>
            <div className="pl-4">maxSize: 400 * 1024, <span className="text-slate-500">// 400 KB target</span></div>
            <div className="pl-4">convertBase64: true,</div>
            <div className="pl-4">exceptAppName: 'flexitrac'</div>
            <div>&#125;);</div>
            <br />
            <div className="text-slate-500">// 3. Subscribe to capture events</div>
            <div>captureEngine.onCaptured = (model) =&gt; &#123;</div>
            <div className="pl-4">console.log('Captured size:', model.sizeBytes);</div>
            <div className="pl-4">console.log('Active App:', model.windowInfo.appName);</div>
            <div className="pl-4">console.log('Base64:', model.base64Image?.slice(0, 40));</div>
            <div>&#125;;</div>
            <br />
            <div className="text-slate-500">// 4. Start the randomized background timer</div>
            <div>captureEngine.start();</div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Modal */}
      <AnimatePresence>
        {selectedCapture && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090f1d] border border-slate-800 rounded-2xl max-w-4xl w-full p-4 space-y-3 relative shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 truncate">
                  <Camera className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-mono font-bold text-white truncate">
                    {selectedCapture.windowInfo.appName} — {selectedCapture.windowInfo.title}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCapture(null)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-hidden rounded-xl bg-black flex items-center justify-center">
                <img
                  src={selectedCapture.previewUrl}
                  alt={selectedCapture.id}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>

              <div className="flex items-center justify-between pt-2 text-xs font-mono">
                <div className="space-x-3 text-slate-400">
                  <span>Size: <strong className="text-emerald-400">{formatBytes(selectedCapture.sizeBytes)}</strong></span>
                  <span>Captured: <strong>{new Date(selectedCapture.capturedAt).toLocaleTimeString()}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyBase64(selectedCapture)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1.5"
                  >
                    {copiedId === selectedCapture.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Base64</span>
                  </button>
                  <button
                    onClick={() => handleDownload(selectedCapture)}
                    className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded text-xs font-mono flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
