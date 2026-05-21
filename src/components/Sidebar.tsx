import React from 'react';
import { motion } from 'motion/react';
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
  Keyboard
} from 'lucide-react';

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
  onOpenShortcuts
}: SidebarProps) {
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'matters', label: 'Matters', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'staff', label: 'Phoenix Staff', icon: BrainCircuit, badge: 'Level 23' },
    { id: 'voice', label: 'AI Voice', icon: Volume2 },
    { id: 'consult', label: 'Video Meet', icon: Video, badge: 'Live' },
    { id: 'backups', label: 'Cloud Sync', icon: FolderSync },
    { id: 'diagnostic', label: 'Diagnostics', icon: Activity }
  ];

  return (
    <aside id="sidebar-container" className="w-64 bg-[#090d16] border-r border-[#1e293b] flex flex-col justify-between select-none">
      {/* Sidebar Header Brand */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl shadow-[0_0_12px_rgba(20,184,166,0.3)] animate-pulse">
            <span className="text-[#090d16] font-bold text-lg font-heading tracking-wider">L23</span>
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading tracking-tight text-white flex items-center gap-1.5 leading-none">
              Level 23
            </h1>
            <span className="text-[10px] text-teal-400 uppercase tracking-widest font-mono">Legal Management</span>
          </div>
        </div>

        {/* Live Active Tag */}
        <div className="mt-5 flex items-center gap-2 px-3 py-1.5 bg-[#0f172a] rounded-lg border border-[#1e293b] text-[11px]">
          <span className={`w-2 h-2 rounded-full ${systemConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)] animate-ping'}`}></span>
          <span className="text-slate-400 font-mono">
            {systemConnected ? '● Google Agents Active' : '○ Standalone Offline'}
          </span>
        </div>
      </div>

      {/* Sidebar Items Content */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#0f172a]/50'
              }`}
            >
              {/* Active Slide Track */}
              {isActive && (
                <motion.div
                  layoutId="active-highlight"
                  className="absolute inset-0 bg-gradient-to-r from-teal-950/40 to-teal-900/10 border-l-2 border-teal-400 rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <Icon
                className={`w-4.5 h-4.5 relative z-10 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              <span className="relative z-10 font-sans tracking-wide">
                {item.label}
              </span>

              {item.badge && (
                <span className="ml-auto relative z-10 bg-teal-500/10 border border-teal-500/20 text-[10px] text-teal-400 font-mono px-1.5 py-0.25 rounded-md leading-none uppercase">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Section */}
      <div className="p-4 border-t border-[#1e293b] bg-[#070b12] space-y-3">
        {/* Dynamic UTC Time Display */}
        <div className="p-3 bg-[#0f172a] rounded-lg space-y-1.5 border border-[#1e293b]">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase tracking-header">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>UTC Clock</span>
          </div>
          <p className="text-[12px] font-semibold text-teal-400 font-mono text-center">
            {utcTime}
          </p>
        </div>

        {/* Dynamic Desktop/Electron Wrapper Toggle */}
        <div className="p-2.5 bg-[#0a101b] border border-[#1e293b]/70 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5 font-bold">
              <Laptop className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              Desktop Client
            </span>
            <button
              type="button"
              onClick={() => setIsDesktopMode?.(!isDesktopMode)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                isDesktopMode ? 'bg-teal-400' : 'bg-[#1e293b]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#050b14] shadow ring-0 transition duration-250 ease-in-out ${
                  isDesktopMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="w-full text-left py-1 text-[9px] font-mono text-slate-500 hover:text-teal-400 flex items-center justify-center gap-1 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded transition-all cursor-pointer"
            >
              <Keyboard className="w-3 h-3" />
              <span>Show Shortcuts (Ctrl+I)</span>
            </button>
          )}
        </div>

        {/* Quick Help Intakes Button */}
        <button
          id="btn-sidebar-quick-action"
          onClick={onQuickIntake}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 active:scale-[0.98] text-[#090d16] font-semibold rounded-xl text-xs font-heading transition-all shadow-[0_4px_12px_rgba(20,184,166,0.15)] cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Intake Note</span>
        </button>

        {/* Powered Tag */}
        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono px-1.5 pt-1">
          <span>Electron v2.4</span>
          <span>By Phoenix Staff</span>
        </div>
      </div>
    </aside>
  );
}
