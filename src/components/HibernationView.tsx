import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Moon,
  PowerOff,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Brain,
  FileX,
  Clock,
  Sparkles,
  Database,
  Lock,
  Eye,
  RefreshCw,
  Layers,
  Terminal,
  ServerOff,
  Zap,
  Sun
} from 'lucide-react';
import level23Logo from '../assets/images/level23_phoenix_logo_1786736100367.jpg';

interface HibernationViewProps {
  onWakeUp?: () => void;
  onInspectArchives?: () => void;
  isInspectingArchives?: boolean;
}

export default function HibernationView({
  onWakeUp,
  onInspectArchives,
  isInspectingArchives = false
}: HibernationViewProps) {
  const [hibernatedSince] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const shutdownLogs = [
    { time: '11:09:50', action: 'Document automation pipelines decommissioned', status: 'COMPLETE', icon: FileX },
    { time: '11:09:57', action: 'Form templates (FL-100, FL-120, FL-300, etc.) deleted', status: 'DELETED', icon: Trash2 },
    { time: '11:10:15', action: 'Judicial Council schemas & mapping registries purged', status: 'PURGED', icon: Database },
    { time: '11:10:20', action: 'AI neural workers, 8-Agent pipeline & voice engine put to sleep', status: 'HIBERNATING', icon: Brain },
    { time: '11:10:25', action: 'System sleep lock engaged. Core standby active', status: 'ASLEEP', icon: Moon }
  ];

  const handleWakeAction = () => {
    if (onWakeUp) {
      onWakeUp();
    } else if (onInspectArchives) {
      onInspectArchives();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-200 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden font-sans">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-900/15 via-purple-900/10 to-teal-900/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-950/20 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-950/15 blur-[100px] pointer-events-none rounded-full" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full px-6 py-4 border-b border-slate-800/80 bg-[#060b18]/70 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[#dfb76c]/40 bg-[#02050e] flex items-center justify-center shadow-[0_0_12px_rgba(223,183,108,0.2)]">
            <img
              src={level23Logo}
              alt="Logo"
              className="w-full h-full object-cover opacity-80 filter grayscale-[40%]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest text-[#fae093] uppercase font-heading">
                LEVEL 23
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Sleep Mode
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Legal Practice OS • Dormant State
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>Status: Hibernating (Zzz)</span>
          </div>

          <button
            onClick={handleWakeAction}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-mono font-bold uppercase transition-all shadow-[0_0_15px_rgba(52,211,153,0.35)] cursor-pointer hover:scale-105 active:scale-95"
            title="Wake up practice OS and restore operational state"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Wake Up</span>
          </button>

          {onInspectArchives && (
            <button
              onClick={onInspectArchives}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-teal-400" />
              <span>{isInspectingArchives ? 'Return to Sleep View' : 'Inspect Archives'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Center Hibernation Stage */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-5xl mx-auto w-full my-auto">
        {/* Animated Moon / Sleep Core Icon */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mb-8"
        >
          {/* Pulsing Aura */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-teal-500/20 blur-xl"
          />
          
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-b from-[#0e172a] to-[#080d1a] border-2 border-indigo-500/30 shadow-[0_0_35px_rgba(99,102,241,0.2)] flex items-center justify-center">
            <Moon className="w-14 h-14 text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.6)]" />
            <motion.span
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute -top-1 -right-1 text-xs font-mono font-bold text-indigo-300 px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40"
            >
              Zzz
            </motion.span>
          </div>
        </motion.div>

        {/* Primary Statement */}
        <div className="text-center space-y-3 max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold">
            <Moon className="w-3.5 h-3.5" />
            <span>APP & AI HIBERNATION ACTIVE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
            System Resting in Hibernation
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            The system is currently asleep in low-power standby mode. Click below to awaken all operational services and return to your active workspace.
          </p>
        </div>

        {/* Big Wake Up Call To Action Button */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={handleWakeAction}
            className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black font-mono text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(52,211,153,0.5)] hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Zap className="w-5 h-5 fill-slate-950" />
            <span>Wake Up System</span>
          </button>

          {onInspectArchives && (
            <button
              onClick={onInspectArchives}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
            >
              <Eye className="w-4 h-4 text-teal-400" />
              <span>Inspect Records</span>
            </button>
          )}
        </div>

        {/* 4 Telemetry Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-10">
          {/* Card 1: AI Suite */}
          <div className="p-4 rounded-xl bg-[#090e1c]/80 border border-slate-800 hover:border-indigo-500/30 transition-all text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Brain className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Ready To Wake
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200">AI Agents Core</h3>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                AI staff assistants and intelligence engine ready to reactivate.
              </p>
            </div>
          </div>

          {/* Card 2: Document Automation */}
          <div className="p-4 rounded-xl bg-[#090e1c]/80 border border-slate-800 hover:border-rose-500/30 transition-all text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <FileX className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Removed
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200">Doc Automation</h3>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                Automated document generation and PDF pipelines decommissioned.
              </p>
            </div>
          </div>

          {/* Card 3: Form Templates */}
          <div className="p-4 rounded-xl bg-[#090e1c]/80 border border-slate-800 hover:border-amber-500/30 transition-all text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Trash2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                0 Active
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200">Form Templates</h3>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                All California Judicial Council form templates purged and deleted.
              </p>
            </div>
          </div>

          {/* Card 4: Vault & Storage */}
          <div className="p-4 rounded-xl bg-[#090e1c]/80 border border-slate-800 hover:border-teal-500/30 transition-all text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Secured
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200">Client Vault</h3>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                Practice records securely preserved and ready for active use.
              </p>
            </div>
          </div>
        </div>

        {/* Decommission & Sleep Audit Log Terminal */}
        <div className="w-full rounded-xl bg-[#050811] border border-slate-800/90 p-4 font-mono text-left shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-slate-300">System Telemetry & Standby State</span>
            </div>
            <span className="text-[10px] text-slate-500">Hibernated at {hibernatedSince}</span>
          </div>

          <div className="pt-3 space-y-2 text-[11px]">
            {shutdownLogs.map((log, idx) => {
              const Icon = log.icon;
              return (
                <div key={idx} className="flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-slate-600 text-[10px]">[{log.time}]</span>
                    <Icon className="w-3.5 h-3.5 text-indigo-400/80 shrink-0" />
                    <span className="truncate">{log.action}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 font-bold ml-2 shrink-0">
                    {log.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-slate-800/80 bg-[#060b18]/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <ServerOff className="w-3.5 h-3.5 text-indigo-400" />
          <span>System Idle • Press Wake Up to resume active legal practice operations</span>
        </div>
        <div>
          <span>Level 23 Practice OS</span>
        </div>
      </footer>
    </div>
  );
}
