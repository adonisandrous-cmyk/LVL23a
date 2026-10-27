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
  FolderSync,
  Laptop,
  Keyboard,
  Scale,
  Eye,
  Sparkles,
  Video,
  Moon,
  Camera,
  Upload,
  Network,
  ChevronRight,
  ShieldCheck,
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
  onOpenOmniUpload?: () => void;
  onOpenGoogleHosting?: () => void;
  onOpenZenEntrance?: () => void;
}

const primaryNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'matters', label: 'Matters', icon: Briefcase },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'staff', label: 'Phoenix Staff', icon: BrainCircuit },
  { id: 'biglaw', label: 'BigLaw', icon: Network },
  { id: 'voice', label: 'Voice', icon: Volume2 },
];

const secondaryNav = [
  { id: 'workspace', label: 'Workspace', icon: Sparkles },
  { id: 'consult', label: 'Consult', icon: Video },
  { id: 'diagnostic', label: 'Diagnostics', icon: Activity },
  { id: 'backups', label: 'Sync', icon: FolderSync },
  { id: 'client_portal', label: 'Portal', icon: Eye },
  { id: 'hibernation', label: 'Sleep', icon: Moon },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  systemConnected,
  onQuickIntake,
  utcTime,
  isDesktopMode = false,
  setIsDesktopMode,
  onOpenShortcuts,
  onOpenResearch,
  onOpenOmniUpload,
  onOpenGoogleHosting,
  onOpenZenEntrance,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-[#090d16] text-slate-200">
      <div className="border-b border-slate-800 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm font-black text-amber-300">
            L23
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Level 23</div>
            <div className="truncate text-sm font-semibold text-white">Phoenix Desk</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-[10px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${systemConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span>{systemConnected ? 'System live' : 'Standby'}</span>
          </div>
          <span className="font-mono text-slate-500">{utcTime.split(' ')[1] || 'UTC'}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
        <div className="space-y-1">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] transition-all ${
                  active
                    ? 'bg-slate-800 text-white shadow-[inset_0_0_0_1px_rgba(45,212,191,0.2)]'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl border border-teal-500/30 bg-gradient-to-r from-teal-500/10 to-transparent"
                  />
                )}
                <Icon className={`relative z-10 h-4 w-4 ${active ? 'text-teal-300' : 'text-slate-400'}`} />
                <span className="relative z-10 flex-1 truncate">{item.label}</span>
                <ChevronRight className="relative z-10 h-3.5 w-3.5 text-slate-500" />
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-800 pt-3">
          <div className="mb-2 px-2 text-[9px] uppercase tracking-[0.2em] text-slate-500">Tools</div>
          <div className="space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[11px] transition-all ${
                    active
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-3 space-y-1">
          {onOpenZenEntrance && (
            <button
              type="button"
              onClick={onOpenZenEntrance}
              className="flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left text-[11px] text-amber-200 hover:bg-amber-500/15"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>AI Co-Counsel</span>
              </div>
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[8px] uppercase">Zen</span>
            </button>
          )}

          {onOpenResearch && (
            <button
              type="button"
              onClick={onOpenResearch}
              className="flex w-full items-center justify-between rounded-xl border border-[#dfb76c]/30 bg-[#dfb76c]/5 px-3 py-2 text-left text-[11px] text-[#f6d998] hover:bg-[#dfb76c]/10"
            >
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                <span>Research Desk</span>
              </div>
              <span className="rounded border border-[#dfb76c]/30 bg-[#dfb76c]/10 px-1.5 py-0.5 text-[8px] uppercase">Desk</span>
            </button>
          )}

          {onOpenOmniUpload && (
            <button
              type="button"
              onClick={onOpenOmniUpload}
              className="flex w-full items-center justify-between rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-left text-[11px] text-violet-200 hover:bg-violet-500/15"
            >
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>Upload & Translate</span>
              </div>
              <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[8px] uppercase">Docs</span>
            </button>
          )}
        </div>
      </nav>

      <div className="space-y-2 border-t border-slate-800 px-3 py-3">
        <button
          type="button"
          onClick={onQuickIntake}
          className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 px-3 py-2 text-[11px] font-medium text-slate-950"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Client Intake</span>
          </div>
        </button>

        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Laptop className="h-3.5 w-3.5 text-teal-300" />
            <span>Desktop</span>
          </div>
          <button
            type="button"
            onClick={() => setIsDesktopMode?.(!isDesktopMode)}
            className={`relative inline-flex h-4 w-7 rounded-full ${isDesktopMode ? 'bg-teal-400' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-slate-950 transition-all ${isDesktopMode ? 'left-3.5' : 'left-0.5'}`} />
          </button>
        </div>

        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[10px] text-slate-300 hover:border-slate-500"
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Shortcuts</span>
          </button>
        )}

        {onOpenGoogleHosting && (
          <button
            type="button"
            onClick={onOpenGoogleHosting}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-1.5 text-[10px] text-sky-200 hover:bg-sky-500/15"
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>App & Hosting</span>
          </button>
        )}
      </div>
    </aside>
  );
}
