import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  BrainCircuit,
  Volume2,
  Activity,
  Calendar,
  RefreshCw,
  Clock,
  LogOut,
  Sliders,
  Sparkles,
  Video,
  FolderSync,
  Laptop,
  Keyboard,
  Scale,
  Eye,
  AlertTriangle,
  HardDrive,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  X,
  Key,
  Layers,
  Workflow,
  Moon,
  Camera
} from 'lucide-react';
import {
  subscribeDriveSync,
  getDriveSyncState,
  forceDriveSync,
  clearDriveSyncError,
  DriveSyncState,
  GOOGLE_DRIVE_FOLDER_URL,
  DEFAULT_TARGET_FOLDER_ID,
  DEFAULT_ACCOUNT_EMAIL
} from '../services/driveSyncService';
import level23Logo from '../assets/images/level23_phoenix_logo_1786736100367.jpg';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemConnected: boolean;
  onQuickIntake: () => void;
  onRefreshDiagnostic: () => void;
  utcTime: string;
  isDesktopMode?: boolean;
  setIsDesktopMode?: (val: boolean) => void;
  onOpenShortcuts?: () => void;
  onOpenResearch?: () => void;
  onOpenOmniUpload?: () => void;
  onOpenGoogleHosting?: () => void;
  onOpenZenEntrance?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  systemConnected,
  onQuickIntake,
  onRefreshDiagnostic,
  utcTime,
  isDesktopMode = false,
  setIsDesktopMode,
  onOpenShortcuts,
  onOpenResearch,
  onOpenOmniUpload,
  onOpenGoogleHosting,
  onOpenZenEntrance
}: SidebarProps) {
  const [driveSync, setDriveSync] = useState<DriveSyncState>(getDriveSyncState());
  const [isToastDismissed, setIsToastDismissed] = useState(false);
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);

  // Subscribe to real-time Google Drive sync events
  useEffect(() => {
    const unsubscribe = subscribeDriveSync((newState) => {
      setDriveSync(newState);
      if (newState.status === 'error' && newState.error) {
        setIsToastDismissed(false); // Pop toast on new error
      }
    });
    return () => unsubscribe();
  }, []);

  const handleManualRetry = async () => {
    setIsRetryingSync(true);
    try {
      await forceDriveSync();
    } finally {
      setIsRetryingSync(false);
    }
  };

  const handleAuthorizeDrive = () => {
    // Open Google Drive folder directly or invoke token prompt
    window.open(GOOGLE_DRIVE_FOLDER_URL, '_blank', 'noopener,noreferrer');
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'enterprise_pipeline', label: 'Form Generator', icon: Scale, badge: 'Postgres' },
    { id: 'flexicapture', label: 'FlexiCapture', icon: Camera, badge: 'Piece 1' },
    { id: 'workspace', label: 'Workspace Hub', icon: Sparkles, badge: 'Google' },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'matters', label: 'Matters', icon: Briefcase },
    { id: 'documents', label: 'Documents & Vault', icon: FileText },
    { id: 'staff', label: 'Legal Staff', icon: BrainCircuit, badge: 'Active' },
    { id: 'voice', label: 'AI Voice', icon: Volume2, badge: 'Ready' },
    { id: 'consult', label: 'Video Meet', icon: Video, badge: 'Live' },
    { id: 'backups', label: 'Desktop & Sync', icon: FolderSync, badge: 'Active' },
    { id: 'client_portal', label: 'Client Portal', icon: Eye, badge: 'Portal' },
    { id: 'diagnostic', label: 'Diagnostics', icon: Activity },
    { id: 'hibernation', label: 'Sleep Mode', icon: Moon, badge: 'Standby' }
  ];

  const hasDriveError = driveSync.status === 'error' || Boolean(driveSync.error);

  return (
    <aside id="sidebar-container" className="w-64 h-full max-h-full min-h-0 overflow-hidden bg-[#090d16] border-r border-[#1e293b] flex flex-col justify-between select-none shrink-0 relative">
      {/* Sidebar Header Brand with Official Level 23 Phoenix Logo */}
      <div className="p-3 border-b border-[#1e293b]/60 bg-[#070b13]/80 shrink-0 space-y-2">
        <div className="flex items-center gap-2.5">
          {/* Level 23 Phoenix Logo Badge */}
          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#dfb76c]/40 bg-[#02050e] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(223,183,108,0.25)]">
            <img
              src={level23Logo}
              alt="Level 23 Official Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-left space-y-0.5 min-w-0 flex-1">
            <div className="text-[14px] font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-[#fce093] via-[#dfb76c] to-[#b38627] font-heading uppercase leading-none select-none truncate">
              LEVEL 23
            </div>
            
            <div className="flex items-center gap-1.5 leading-none">
              <h2 className="text-[9px] font-bold tracking-[0.1em] text-[#fae093] uppercase font-mono truncate">
                LEGAL DESK
              </h2>
              <span className="text-[7.5px] font-medium tracking-[0.05em] text-[#dfb76c]/70 uppercase font-sans truncate">
                • PORTAL
              </span>
            </div>
          </div>
        </div>

        {/* Live Active Status Tag */}
        <div className="flex items-center justify-between gap-1.5 px-2 py-1 bg-[#0a101d] rounded-lg border border-[#1e293b]/60 text-[9px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${systemConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]' : 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.4)]'}`}></span>
            <span className="text-slate-400 font-mono font-bold tracking-wide truncate">
              {systemConnected ? 'L-23 Cloud Synced' : 'Offline Engine'}
            </span>
          </div>
          <span className="text-[8px] font-mono text-slate-500 uppercase shrink-0">v2.4</span>
        </div>

        {/* GOOGLE DRIVE REAL-TIME SYNC STATUS INDICATOR IN SIDEBAR */}
        <div
          id="sidebar-gdrive-sync-indicator"
          onClick={() => setShowDriveModal(true)}
          className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg border text-[9.5px] font-mono transition-all cursor-pointer ${
            hasDriveError
              ? 'bg-rose-950/40 border-rose-500/50 hover:bg-rose-900/50 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
              : driveSync.status === 'syncing'
              ? 'bg-amber-950/40 border-amber-500/40 hover:bg-amber-900/40 text-amber-300'
              : 'bg-[#0a1424] border-teal-500/30 hover:border-teal-500/60 text-teal-300'
          }`}
          title="Click to view Google Drive folder sync diagnostics"
        >
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            {hasDriveError ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
            ) : driveSync.status === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" />
            ) : (
              <HardDrive className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            )}
            <span className="font-bold truncate">
              {hasDriveError
                ? 'GDrive: Auth / Access Error'
                : driveSync.status === 'syncing'
                ? 'GDrive: Syncing...'
                : 'GDrive: Synced (1EW-b...)'}
            </span>
          </div>
          
          <span className={`text-[8px] font-extrabold uppercase px-1 rounded shrink-0 ${
            hasDriveError
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : driveSync.status === 'syncing'
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {hasDriveError ? 'ERR' : driveSync.status === 'syncing' ? 'SYNC' : 'OK'}
          </span>
        </div>
      </div>

      {/* VISUAL ERROR TOAST IN SIDEBAR (Notifies user of authentication / access errors during periodic sync) */}
      <AnimatePresence>
        {hasDriveError && !isToastDismissed && (
          <motion.div
            id="sidebar-drive-error-toast"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mx-2.5 my-2 p-2.5 bg-gradient-to-b from-[#2a0c12] via-[#1a080c] to-[#0f0407] border-2 border-rose-500/70 rounded-xl shadow-[0_4px_16px_rgba(244,63,94,0.3)] text-left relative z-20"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-1.5 pb-1.5 border-b border-rose-500/30">
              <div className="flex items-center gap-1.5 text-rose-300 font-mono font-black text-[10.5px] uppercase tracking-tight">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                <span>Drive Sync Auth Error</span>
              </div>
              <button
                type="button"
                onClick={() => setIsToastDismissed(true)}
                className="text-rose-400 hover:text-rose-200 p-0.5 rounded transition-colors cursor-pointer"
                title="Dismiss warning toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Error Body */}
            <div className="py-2 space-y-1">
              <p className="text-[10px] text-rose-200 font-sans leading-tight">
                Periodic Google Drive synchronization encountered an <strong>Authentication or Access Error</strong> for <code className="text-amber-300 font-mono">level23consulting@gmail.com</code>.
              </p>
              <div className="text-[9px] font-mono text-rose-300/80 bg-black/40 p-1.5 rounded border border-rose-500/20 truncate">
                Folder: 1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleManualRetry}
                disabled={isRetryingSync}
                className="flex-1 py-1 px-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-mono text-[9px] font-black uppercase rounded-md transition-all flex items-center justify-center gap-1 shadow cursor-pointer border-none"
              >
                <RefreshCw className={`w-3 h-3 ${isRetryingSync ? 'animate-spin' : ''}`} />
                <span>{isRetryingSync ? 'Retrying...' : 'Retry Sync'}</span>
              </button>

              <button
                type="button"
                onClick={handleAuthorizeDrive}
                className="py-1 px-2 bg-[#090d16] hover:bg-slate-900 border border-amber-500/50 text-amber-300 font-mono text-[9px] font-bold uppercase rounded-md transition-all flex items-center gap-1 cursor-pointer"
                title="Open Google Drive Folder"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Drive</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Items Content */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {/* Dedicated Full-Screen AI Co-Counsel Button */}
        {onOpenZenEntrance && (
          <button
            type="button"
            onClick={onOpenZenEntrance}
            className="w-full mb-2 p-2 bg-gradient-to-r from-amber-500/15 via-teal-500/10 to-purple-500/10 hover:from-amber-500/25 hover:via-teal-500/20 hover:to-purple-500/20 border border-amber-500/40 hover:border-amber-400/70 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer shadow-sm"
            title="Open Full Screen AI Co-Counsel Suite (Phoenix, EVE, Alure, Sentry)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 truncate">
                <div className="text-[11px] font-bold text-amber-200 tracking-wide truncate">AI Co-Counsel</div>
                <div className="text-[9px] text-slate-400 font-mono truncate">Phoenix • Voice • OCR</div>
              </div>
            </div>
            <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded uppercase shrink-0">
              Zen
            </span>
          </button>
        )}

        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#0f172a]/40'
              }`}
            >
              {/* Active Slide Track */}
              {isActive && (
                <motion.div
                  layoutId="active-highlight"
                  className="absolute inset-0 bg-gradient-to-r from-teal-950/30 to-teal-900/5 border-l-2 border-teal-400 rounded-lg"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <Icon
                className={`w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              <span className="relative z-10 font-sans tracking-wide truncate">
                {item.label}
              </span>

              {item.badge && (
                <span className="ml-auto relative z-10 bg-teal-500/10 border border-teal-500/25 text-[8.5px] text-teal-400 font-mono px-1 rounded leading-none uppercase shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Dedicated Gold Judicial Research Panel Trigger */}
        {onOpenResearch && (
          <button
            type="button"
            onClick={onOpenResearch}
            className="w-full relative overflow-hidden group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 text-slate-300 hover:text-[#fce093] hover:bg-[#dfb76c]/5 border border-dashed border-slate-800 hover:border-[#dfb76c]/25 mt-1.5 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#dfb76c]/5 to-[#b38627]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <Scale
              className="w-4 h-4 text-[#dfb76c]/80 relative z-10 group-hover:text-[#dfb76c] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            />

            <span className="relative z-10 font-sans tracking-wide text-[11px] font-bold truncate">
              Research Desk
            </span>

            <span className="ml-auto relative z-10 bg-[#dfb76c]/10 border border-[#dfb76c]/20 text-[8.5px] text-[#dfb76c] font-mono px-1 rounded leading-none uppercase shrink-0">
              Desk
            </span>
          </button>
        )}
      </nav>

      {/* Sidebar Footer Section */}
      <div className="p-2.5 border-t border-[#1e293b] bg-[#070b12] space-y-2 shrink-0">
        {/* Dynamic UTC Time Display */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0f172a]/60 border border-[#1e293b]/60 rounded-lg text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>UTC</span>
          </div>
          <span className="text-teal-400 font-semibold truncate">{utcTime}</span>
        </div>

        {/* Dynamic Desktop/Electron Wrapper Toggle */}
        <div className="p-2 bg-[#0a101b] border border-[#1e293b]/60 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-mono uppercase text-slate-400 flex items-center gap-1.5 font-bold">
              <Laptop className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              Desktop App
            </span>
            <button
              type="button"
              onClick={() => setIsDesktopMode?.(!isDesktopMode)}
              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isDesktopMode ? 'bg-teal-400' : 'bg-[#1e293b]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-[#050b14] shadow ring-0 transition duration-200 ease-in-out ${
                  isDesktopMode ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="w-full text-center py-1 text-[8.5px] font-mono text-slate-500 hover:text-teal-400 flex items-center justify-center gap-1 bg-[#0f172a]/50 hover:bg-slate-900 border border-slate-800/80 rounded-md transition-all cursor-pointer"
            >
              <Keyboard className="w-3 h-3" />
              <span>Shortcuts (Ctrl+I)</span>
            </button>
          )}
        </div>

        {/* Google Cloud & PWA Hub Button */}
        {onOpenGoogleHosting && (
          <button
            id="btn-sidebar-google-hosting"
            onClick={onOpenGoogleHosting}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-blue-950/80 via-slate-900 to-teal-950/80 hover:from-blue-900 hover:to-teal-900 text-teal-300 font-extrabold rounded-lg text-[10px] uppercase transition-all shadow-sm cursor-pointer border border-teal-500/30"
            title="Google Cloud Run Deploy, PWA Installation & Desktop Bridge"
          >
            <Laptop className="w-3.5 h-3.5 shrink-0 text-teal-400" />
            <span>Google App & PWA Hub</span>
          </button>
        )}

        {/* Upload & Translate Docs Button */}
        {onOpenOmniUpload && (
          <button
            id="btn-sidebar-omni-upload"
            onClick={onOpenOmniUpload}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white font-extrabold rounded-lg text-[10px] uppercase transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer border border-purple-400/40"
            title="Upload Legal Documents & Translate Intake to Spanish / English"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-purple-200" />
            <span>Upload & Translate Docs</span>
          </button>
        )}

        {/* Client Intake Generator Button */}
        <button
          id="btn-sidebar-quick-action"
          onClick={onQuickIntake}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 active:scale-[0.98] text-[#090d16] font-extrabold rounded-lg text-[10px] uppercase transition-all shadow-md cursor-pointer border-none"
          title="Open AI Powered Client Intake Generator"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Client Intake Generator</span>
        </button>

        {/* Powered Tag */}
        <div className="flex items-center justify-between text-[8px] text-slate-600 font-mono px-1">
          <span>Electron v2.4</span>
          <span>Phoenix Staff</span>
        </div>
      </div>

      {/* GOOGLE DRIVE SYNC DIAGNOSTIC MODAL */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-teal-400 font-mono font-bold text-sm">
                <HardDrive className="w-5 h-5 text-teal-400" />
                <span>Google Drive Sync Status</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDriveModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-[#060a12] rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Account:</span>
                  <span className="text-white font-bold">{DEFAULT_ACCOUNT_EMAIL}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Folder:</span>
                  <span className="text-teal-300">{DEFAULT_TARGET_FOLDER_ID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sync Status:</span>
                  <span className={`font-bold uppercase ${hasDriveError ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {hasDriveError ? 'Authentication Required' : driveSync.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Attempt:</span>
                  <span className="text-slate-300">{new Date(driveSync.lastSyncedAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {hasDriveError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-rose-200">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Error Description:</span>
                  </div>
                  <p className="text-[11px] font-sans leading-relaxed">
                    {driveSync.error || 'Google Drive authentication token missing or expired. Access permission required to sync files.'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleManualRetry}
                disabled={isRetryingSync}
                className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg uppercase text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetryingSync ? 'animate-spin' : ''}`} />
                <span>{isRetryingSync ? 'Syncing...' : 'Force Sync Now'}</span>
              </button>

              <a
                href={GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#090d16] hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-bold rounded-lg uppercase text-xs flex items-center gap-1.5 transition-all"
              >
                <span>Open in Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
