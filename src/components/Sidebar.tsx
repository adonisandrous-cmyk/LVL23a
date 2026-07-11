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
  Keyboard,
  Scale,
  Eye
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
  onOpenResearch?: () => void;
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
  onOpenResearch
}: SidebarProps) {
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'matters', label: 'Matters', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'staff', label: 'Legal Staff', icon: BrainCircuit, badge: 'Level 23' },
    { id: 'voice', label: 'AI Voice', icon: Volume2 },
    { id: 'consult', label: 'Video Meet', icon: Video, badge: 'Live' },
    { id: 'backups', label: 'Desktop & Sync', icon: FolderSync, badge: 'Active' },
    { id: 'client_portal', label: 'Client Portal', icon: Eye, badge: 'Portal' },
    { id: 'diagnostic', label: 'Diagnostics', icon: Activity }
  ];

  return (
    <aside id="sidebar-container" className="w-64 h-full max-h-full min-h-0 overflow-hidden bg-[#090d16] border-r border-[#1e293b] flex flex-col justify-between select-none shrink-0">
      {/* Sidebar Header Brand with Custom Level 23 Geometric Badge - Extremely Compact Horizontal Layout */}
      <div className="p-3 border-b border-[#1e293b]/60 bg-[#070b13]/80 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Level 23 Geometric Shield Logo - Scaled Down */}
          <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
            {/* Background ambient lighting */}
            <div className="absolute inset-0 bg-radial-gradient from-[#dfb76c]/15 via-[#b38627]/5 to-transparent rounded-full animate-pulse filter blur-md"></div>
            
            <svg id="level-23-logo-svg" viewBox="0 0 120 120" className="w-8 h-8 relative z-10 filter drop-shadow-[0_2px_8px_rgba(223,183,108,0.35)]">
              <defs>
                <linearGradient id="brandGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fce093" />
                  <stop offset="50%" stopColor="#dfb76c" />
                  <stop offset="100%" stopColor="#b38627" />
                </linearGradient>
                <linearGradient id="goldAccent" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#dfb76c" />
                  <stop offset="100%" stopColor="#fce093" />
                </linearGradient>
              </defs>
              {/* Outer Golden Hexagonal Border */}
              <polygon points="60,10 105,35 105,85 60,110 15,85 15,35" fill="none" stroke="url(#brandGold)" strokeWidth="4" strokeLinejoin="round" />
              {/* Inner Hexagon Container */}
              <polygon points="60,18 97,40 97,80 60,102 23,80 23,40" fill="#020203" stroke="rgba(223,183,108,0.25)" strokeWidth="2" strokeLinejoin="round" opacity="0.95" />
              {/* Modern Slab L-23 Styled Elements */}
              <g fill="url(#brandGold)">
                <text x="32" y="74" fontSize="35" fontWeight="900" fontFamily='"Americana BT", "Cinzel", "Playfair Display", Georgia, serif' fill="url(#brandGold)" letterSpacing="-2">L</text>
                <text x="56" y="74" fontSize="35" fontWeight="900" fontFamily='"Americana BT", "Cinzel", "Playfair Display", Georgia, serif' fill="url(#goldAccent)" letterSpacing="-2">23</text>
              </g>
              {/* Scales under structural level */}
              <path d="M 45,85 L 75,85 M 60,81 L 60,89" stroke="url(#brandGold)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="text-left space-y-0.5 min-w-0 flex-1">
            {/* Level 23 Brand Name */}
            <div className="text-[14px] font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-[#fce093] via-[#dfb76c] to-[#b38627] font-heading uppercase leading-none select-none truncate">
              LEVEL 23
            </div>
            
            {/* Sub branding labels */}
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

        {/* Live Active Status Tag - Compact Single Row */}
        <div className="mt-2 flex items-center justify-between gap-1.5 px-2 py-1 bg-[#0a101d] rounded-lg border border-[#1e293b]/60 text-[9px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${systemConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]' : 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.4)]'}`}></span>
            <span className="text-slate-400 font-mono font-bold tracking-wide truncate">
              {systemConnected ? 'L-23 Cloud Synced' : 'Offline Engine'}
            </span>
          </div>
          <span className="text-[8px] font-mono text-slate-500 uppercase shrink-0">v2.4</span>
        </div>
      </div>

      {/* Sidebar Items Content - Maximized Scrollable Area */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
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

        {/* Dedicated Gold Judicial Research Panel Trigger - Compact */}
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

      {/* Sidebar Footer Section - Super space-efficient */}
      <div className="p-2.5 border-t border-[#1e293b] bg-[#070b12] space-y-2 shrink-0">
        {/* Dynamic UTC Time Display - Single-line layout */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0f172a]/60 border border-[#1e293b]/60 rounded-lg text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>UTC</span>
          </div>
          <span className="text-teal-400 font-semibold truncate">{utcTime}</span>
        </div>

        {/* Dynamic Desktop/Electron Wrapper Toggle - Highly compressed layout */}
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

        {/* Quick Help Intakes Button - Compact height */}
        <button
          id="btn-sidebar-quick-action"
          onClick={onQuickIntake}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 active:scale-[0.98] text-[#090d16] font-bold rounded-lg text-[10.5px] uppercase transition-all shadow-md cursor-pointer border-none"
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          <span>Quick Intake</span>
        </button>

        {/* Powered Tag */}
        <div className="flex items-center justify-between text-[8px] text-slate-600 font-mono px-1">
          <span>Electron v2.4</span>
          <span>Phoenix Staff</span>
        </div>
      </div>
    </aside>
  );
}
