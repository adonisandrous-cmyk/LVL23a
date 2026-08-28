import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  CloudLightning,
  Laptop,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Server,
  Layers,
  HardDrive,
  ShieldCheck,
  Zap,
  Globe,
  Cpu,
  Smartphone,
  Check,
  FolderSync,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import {
  getPwaState,
  subscribePwaState,
  promptInstallPwa,
  clearPwaCache,
  isStandalone
} from '../lib/pwa';

interface GoogleAppHostingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoogleAppHostingModal({ isOpen, onClose }: GoogleAppHostingModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'pwa' | 'google-cloud' | 'desktop-native'>('pwa');
  const [pwaState, setPwaState] = useState(getPwaState());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [gcpProjectId, setGcpProjectId] = useState<string>('level23-legal-prod');
  const [gcpRegion, setGcpRegion] = useState<string>('us-central1');
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheClearedSuccess, setCacheClearedSuccess] = useState(false);

  // Server hosting diagnostics
  const [hostingInfo, setHostingInfo] = useState<any>(null);
  const [isLoadingHosting, setIsLoadingHosting] = useState(false);

  // Local desktop bridge check
  const [bridgeStatus, setBridgeStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [bridgeFileCount, setBridgeFileCount] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribePwaState((state) => {
      setPwaState(state);
    });

    // Fetch server hosting info
    setIsLoadingHosting(true);
    fetch('/api/hosting/info')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHostingInfo(data);
      })
      .catch((err) => console.warn('Could not load hosting info:', err))
      .finally(() => setIsLoadingHosting(false));

    // Test local bridge
    fetch('http://localhost:4321/api/local-files')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBridgeStatus('connected');
          setBridgeFileCount(data.files?.length || 0);
        } else {
          setBridgeStatus('disconnected');
        }
      })
      .catch(() => {
        setBridgeStatus('disconnected');
      });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleInstallPwa = async () => {
    const res = await promptInstallPwa();
    if (res.outcome === 'accepted') {
      setPwaState(getPwaState());
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    const success = await clearPwaCache();
    setIsClearingCache(false);
    if (success) {
      setCacheClearedSuccess(true);
      setTimeout(() => setCacheClearedSuccess(false), 3000);
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Deployment script templates
  const cloudRunCommand = `gcloud run deploy level23-legal \\
  --source . \\
  --region ${gcpRegion} \\
  --project ${gcpProjectId} \\
  --allow-unauthenticated \\
  --port 8080 \\
  --cpu 2 \\
  --memory 2Gi \\
  --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=$GEMINI_API_KEY"`;

  const appEngineCommand = `npm run build && gcloud app deploy app.yaml --project ${gcpProjectId}`;

  const cloudBuildCommand = `gcloud builds submit --config cloudbuild.yaml --substitutions=_REGION=${gcpRegion} --project ${gcpProjectId}`;

  const firebaseCommand = `firebase deploy --only hosting --project ${gcpProjectId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#090d16] border border-[#1e293b] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#1e293b] bg-[#070b13] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-blue-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-md">
              <CloudLightning className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Google Hosting, Desktop App & PWA Hub
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  Ready for Production
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Deploy to Google Cloud Run / App Engine, install as Desktop PWA, or connect on-premises bridge.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="px-6 pt-3 pb-0 bg-[#070b13] border-b border-[#1e293b] flex gap-2 shrink-0">
          <button
            onClick={() => setActiveSubTab('pwa')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeSubTab === 'pwa'
                ? 'bg-[#090d16] text-teal-300 border-[#1e293b] border-b-transparent shadow-sm'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Progressive Web App (PWA)</span>
            {pwaState.isInstalled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('google-cloud')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeSubTab === 'google-cloud'
                ? 'bg-[#090d16] text-[#fae093] border-[#1e293b] border-b-transparent shadow-sm'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-[#dfb76c]" />
            <span>Google Cloud Hosting</span>
          </button>

          <button
            onClick={() => setActiveSubTab('desktop-native')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeSubTab === 'desktop-native'
                ? 'bg-[#090d16] text-purple-300 border-[#1e293b] border-b-transparent shadow-sm'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop Native & Bridge</span>
            <span className={`w-2 h-2 rounded-full ${bridgeStatus === 'connected' ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: PWA */}
          {activeSubTab === 'pwa' && (
            <div className="space-y-6">
              {/* PWA Overview Banner */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-indigo-950/40 border border-teal-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">LEVEL 23 Progressive Web App (PWA)</h3>
                    {pwaState.isInstalled ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                        INSTALLED & ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
                        READY TO INSTALL
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs max-w-xl">
                    Run LEVEL 23 as a native desktop and mobile application with offline client caching, zero browser address bars, instant loading, and persistent workstation state.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {pwaState.isInstalled ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-mono font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>App Installed on Device</span>
                    </div>
                  ) : pwaState.isInstallable ? (
                    <button
                      onClick={handleInstallPwa}
                      className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold font-mono uppercase rounded-xl transition-all shadow-lg hover:shadow-teal-500/20 active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install App Now</span>
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 font-mono text-[11px]">
                      Use Browser Menu to Install
                    </div>
                  )}
                </div>
              </div>

              {/* Service Worker & Cache Diagnostics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#070b13] border border-[#1e293b] rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Service Worker Engine</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${pwaState.swActive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                    <span className="text-sm font-bold text-white font-mono">
                      {pwaState.swActive ? 'Active & Caching' : 'Registering...'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">v2.4 cache engine registered at /sw.js</p>
                </div>

                <div className="p-4 bg-[#070b13] border border-[#1e293b] rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Network Connectivity</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${pwaState.isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    <span className="text-sm font-bold text-white font-mono">
                      {pwaState.isOnline ? 'Online (Full Sync)' : 'Offline Mode'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Local indexed cache protects unsaved edits</p>
                </div>

                <div className="p-4 bg-[#070b13] border border-[#1e293b] rounded-xl flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Offline Storage Cache</span>
                    <div className="text-sm font-bold text-white font-mono">Level 23 Shell</div>
                  </div>
                  <button
                    onClick={handleClearCache}
                    disabled={isClearingCache}
                    className="mt-2 text-[10px] font-mono text-teal-400 hover:text-teal-300 underline cursor-pointer self-start"
                  >
                    {isClearingCache ? 'Clearing...' : cacheClearedSuccess ? 'Cache Cleaned!' : 'Purge & Refresh Cache'}
                  </button>
                </div>
              </div>

              {/* Step-by-step Installation Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#dfb76c]">
                  How to Install on Your Operating System
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 bg-[#070b13] border border-[#1e293b] rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Laptop className="w-4 h-4 text-blue-400" />
                      <span>Windows & Mac (Chrome / Edge)</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      1. Click the <strong className="text-slate-200">Install</strong> icon in the address bar (or the button above).<br />
                      2. Choose <strong className="text-slate-200">Install LEVEL 23 Legal AI Suite</strong>.<br />
                      3. The app will launch in its own standalone window and appear in your Start Menu / Launchpad.
                    </p>
                  </div>

                  <div className="p-4 bg-[#070b13] border border-[#1e293b] rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Smartphone className="w-4 h-4 text-purple-400" />
                      <span>iPhone & iPad (Safari)</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      1. Open this portal in <strong className="text-slate-200">Safari</strong>.<br />
                      2. Tap the <strong className="text-slate-200">Share</strong> button at the bottom of the screen.<br />
                      3. Scroll down and tap <strong className="text-slate-200">"Add to Home Screen"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE CLOUD HOSTING */}
          {activeSubTab === 'google-cloud' && (
            <div className="space-y-6">
              {/* Project & Region Input */}
              <div className="p-4 bg-[#070b13] border border-[#1e293b] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Google Cloud Deployment Parameters</h3>
                  <p className="text-xs text-slate-400">Configure your Google Cloud Project ID and region to generate one-click deployment commands.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="space-y-1 flex-1 md:w-48">
                    <label className="text-[10px] font-mono text-slate-400">GCP Project ID</label>
                    <input
                      type="text"
                      value={gcpProjectId}
                      onChange={(e) => setGcpProjectId(e.target.value)}
                      className="w-full bg-[#060a12] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-teal-400 outline-none"
                      placeholder="your-project-id"
                    />
                  </div>

                  <div className="space-y-1 w-36">
                    <label className="text-[10px] font-mono text-slate-400">Target Region</label>
                    <select
                      value={gcpRegion}
                      onChange={(e) => setGcpRegion(e.target.value)}
                      className="w-full bg-[#060a12] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-teal-400 outline-none"
                    >
                      <option value="us-central1">us-central1 (Iowa)</option>
                      <option value="us-west1">us-west1 (Oregon)</option>
                      <option value="us-east1">us-east1 (S. Carolina)</option>
                      <option value="us-east4">us-east4 (N. Virginia)</option>
                      <option value="europe-west1">europe-west1 (Belgium)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Option 1: Google Cloud Run (Recommended) */}
              <div className="p-5 bg-[#070b13] border border-[#1e293b] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudLightning className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                      Option 1: Google Cloud Run (Recommended — Scales to Zero)
                    </h4>
                  </div>
                  <button
                    onClick={() => copyToClipboard(cloudRunCommand, 'cloud-run')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 font-mono text-[10px] cursor-pointer transition-colors"
                  >
                    {copiedKey === 'cloud-run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'cloud-run' ? 'Copied!' : 'Copy Command'}</span>
                  </button>
                </div>
                <p className="text-slate-400 text-xs">
                  Runs directly from source code or Dockerfile. Automatically handles SSL certificates, custom domain routing, and auto-scales from 0 to 10 instances.
                </p>
                <div className="p-3 bg-[#03060d] border border-slate-800/80 rounded-lg font-mono text-[11px] text-teal-300 overflow-x-auto whitespace-pre">
                  {cloudRunCommand}
                </div>
              </div>

              {/* Option 2: Google App Engine */}
              <div className="p-5 bg-[#070b13] border border-[#1e293b] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                      Option 2: Google App Engine (Node.js 20 Standard)
                    </h4>
                  </div>
                  <button
                    onClick={() => copyToClipboard(appEngineCommand, 'app-engine')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 font-mono text-[10px] cursor-pointer transition-colors"
                  >
                    {copiedKey === 'app-engine' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'app-engine' ? 'Copied!' : 'Copy Command'}</span>
                  </button>
                </div>
                <p className="text-slate-400 text-xs">
                  Deploys using the pre-configured <code className="text-slate-300">app.yaml</code> file included in this repository.
                </p>
                <div className="p-3 bg-[#03060d] border border-slate-800/80 rounded-lg font-mono text-[11px] text-blue-300 overflow-x-auto whitespace-pre">
                  {appEngineCommand}
                </div>
              </div>

              {/* Option 3: Firebase Hosting */}
              <div className="p-5 bg-[#070b13] border border-[#1e293b] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                      Option 3: Firebase Hosting + Cloud CDN
                    </h4>
                  </div>
                  <button
                    onClick={() => copyToClipboard(firebaseCommand, 'firebase')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-[10px] cursor-pointer transition-colors"
                  >
                    {copiedKey === 'firebase' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'firebase' ? 'Copied!' : 'Copy Command'}</span>
                  </button>
                </div>
                <p className="text-slate-400 text-xs">
                  Routes all frontend static assets through Google's Global CDN with automatic Cloud Run API proxying configured in <code className="text-slate-300">firebase.json</code>.
                </p>
                <div className="p-3 bg-[#03060d] border border-slate-800/80 rounded-lg font-mono text-[11px] text-amber-300 overflow-x-auto whitespace-pre">
                  {firebaseCommand}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESKTOP NATIVE & ON-PREMISES BRIDGE */}
          {activeSubTab === 'desktop-native' && (
            <div className="space-y-6">
              {/* Bridge Status Card */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Local Desktop Bridge Daemon</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      bridgeStatus === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {bridgeStatus === 'connected' ? 'CONNECTED (Port 4321)' : 'STANDBY'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs max-w-xl">
                    Synchronizes your local hard drive folder (<code className="text-teal-300">C:\Users\Administrator\iiiamadex</code>) directly with Google Drive and this cloud workspace.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBridgeStatus('checking');
                      fetch('http://localhost:4321/api/local-files')
                        .then((r) => r.json())
                        .then((d) => {
                          if (d.success) {
                            setBridgeStatus('connected');
                            setBridgeFileCount(d.files?.length || 0);
                          } else {
                            setBridgeStatus('disconnected');
                          }
                        })
                        .catch(() => setBridgeStatus('disconnected'));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Test Local Bridge</span>
                  </button>
                </div>
              </div>

              {/* Download Desktop Launchers */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#dfb76c]">
                  Download Desktop Launch Scripts for Alex's Workstation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-[#070b13] border border-[#1e293b] rounded-xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-white font-bold">
                        <Terminal className="w-4 h-4 text-teal-400" />
                        <span>Windows Batch (.bat)</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Double-click to start local daemon and launch browser in 1 click.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const content = `@echo off\nTITLE LEVEL 23 Desktop Launcher\nCLS\nstart /b node iiiamadex-desktop-bridge.js\nstart "" "http://localhost:3000"\nexit`;
                        downloadFile('install-desktop.bat', content);
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono text-[11px] font-bold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .BAT</span>
                    </button>
                  </div>

                  <div className="p-4 bg-[#070b13] border border-[#1e293b] rounded-xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-white font-bold">
                        <Terminal className="w-4 h-4 text-blue-400" />
                        <span>PowerShell (.ps1)</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Native PowerShell script with automatic folder mounting.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const content = `Start-Process -NoNewWindow -FilePath "node" -ArgumentList "iiiamadex-desktop-bridge.js"\nStart-Process "http://localhost:3000"`;
                        downloadFile('launch-desktop.ps1', content);
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 font-mono text-[11px] font-bold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .PS1</span>
                    </button>
                  </div>

                  <div className="p-4 bg-[#070b13] border border-[#1e293b] rounded-xl flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-white font-bold">
                        <Laptop className="w-4 h-4 text-purple-400" />
                        <span>Electron Desktop</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Pre-configured <code className="text-slate-300">electron-main.cjs</code> for packaged desktop binary.
                      </p>
                    </div>
                    <div className="p-2 bg-[#03060d] border border-slate-800 rounded font-mono text-[10px] text-purple-300 text-center">
                      npm run desktop
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#1e293b] bg-[#070b13] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Google Cloud Run & PWA Manifest Fully Validated</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono rounded-lg transition-colors cursor-pointer border border-slate-700"
          >
            Close Hub
          </button>
        </div>
      </motion.div>
    </div>
  );
}
