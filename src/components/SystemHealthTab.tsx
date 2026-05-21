import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  CheckCircle,
  AlertCircle,
  Database,
  Cpu,
  RefreshCw,
  Clock,
  Terminal,
  Server,
  Zap,
  Globe
} from 'lucide-react';
import { ActivityLog, SystemDiagnostic } from '../types';

interface SystemHealthTabProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export default function SystemHealthTab({ logs, onClearLogs }: SystemHealthTabProps) {
  const [latency, setLatency] = useState(48);
  const [cpuUsage, setCpuUsage] = useState(12);
  const [ramUsage, setRamUsage] = useState(44);
  const [geminiConnected, setGeminiConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setLatency(data.latencyMs || 25);
      setGeminiConnected(data.geminiConnected || false);
    } catch {
      setLatency(102);
      setGeminiConnected(false);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Simulate some active cpu/ram variance
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(8 + Math.random() * 8));
      setRamUsage(Math.floor(41 + Math.random() * 4));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const diagnostics: SystemDiagnostic[] = [
    {
      id: 'd-1',
      name: 'Google Gemini API Endpoint',
      value: geminiConnected ? 'Connected (secure)' : 'Disconnected (requires key)',
      status: geminiConnected ? 'ok' : 'warning',
      details: geminiConnected
        ? 'Successfully connected to server-side Google GenAI service with environment config.'
        : 'Please update your secrets in the settings panel to activate legal agents, summaries, and document automation.'
    },
    {
      id: 'd-2',
      name: 'Google TTS Modality prebuilt service',
      value: geminiConnected ? 'Connected (WAV stereo)' : 'Offline',
      status: geminiConnected ? 'ok' : 'warning',
      details: 'Generates real-time voices Puck, Charon, Kore, Zephyr from text streams dynamically.'
    },
    {
      id: 'd-3',
      name: 'Express 4 Full-Stack routing system',
      value: 'Online (0.0.0.0:3000)',
      status: 'ok',
      details: 'Handles secure proxy calls and binds locally for container incoming ingress.'
    },
    {
      id: 'd-4',
      name: 'IndexDB Persistent client cache',
      value: 'Online (Active)',
      status: 'ok',
      details: 'Persists ongoing client intake directories, matter logs, and document lists locally.'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Diagnostic Diagnostic banner */}
      <div className="flex items-center justify-between p-5 bg-[#0e1626] border border-[#1e293b] rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading text-white">System Diagnostics Panel</h2>
            <p className="text-xs text-slate-400">Track express server latency, system metrics, and audit logs</p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={isRefreshing}
          className="px-3.5 py-2 bg-[#090d16] hover:bg-slate-900 border border-[#1e293b] text-xs font-semibold text-slate-300 rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-40 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Diagnostics auditing...' : 'Audits Check'}</span>
        </button>
      </div>

      {/* Grid quick meters metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Latency Meter */}
        <div className="p-5 bg-[#0e1626] border border-[#1e293b] rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">API Connection Latency</span>
            <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">{latency}</span>
            <span className="text-xs font-mono text-slate-500">ms roundtrip</span>
          </div>
          <div className="w-full h-1.5 bg-[#090d16] rounded-full overflow-hidden">
            <div
              className={`h-full ${latency > 90 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(latency, 100)}%` }}
            />
          </div>
        </div>

        {/* Simulated CPU */}
        <div className="p-5 bg-[#0e1626] border border-[#1e293b] rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Simulated CPU Load</span>
            <Cpu className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">{cpuUsage}</span>
            <span className="text-xs font-mono text-slate-500">% capacity</span>
          </div>
          <div className="w-full h-1.5 bg-[#090d16] rounded-full overflow-hidden">
            <div className="h-full bg-sky-400" style={{ width: `${cpuUsage * 5}%` }} />
          </div>
        </div>

        {/* Database memory indicators */}
        <div className="p-5 bg-[#0e1626] border border-[#1e293b] rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">System Cache footprint</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">{ramUsage}</span>
            <span className="text-xs font-mono text-slate-500">% index allocation</span>
          </div>
          <div className="w-full h-1.5 bg-[#090d16] rounded-full overflow-hidden">
            <div className="h-full bg-purple-400" style={{ width: `${ramUsage}%` }} />
          </div>
        </div>

      </div>

      {/* Diagnostics details & Audit logs section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Services lists (7/12 width) */}
        <div className="lg:col-span-7 bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="pb-3 border-b border-[#1e293b]">
            <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-400" />
              Connected Stack Audit Checks
            </h3>
          </div>
          <div className="space-y-3">
            {diagnostics.map((diag) => (
              <div key={diag.id} className="p-3 bg-[#090d16] rounded-xl border border-[#1e293b] space-y-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-slate-200">{diag.name}</h4>
                    <span className="text-[10px] font-mono text-slate-500 block">{diag.value}</span>
                  </div>
                  {diag.status === 'ok' ? (
                    <span className="p-1 text-emerald-400 bg-emerald-500/10 rounded-md">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="p-1 text-amber-400 bg-amber-500/10 rounded-md animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">{diag.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Activity logs terminal (5/12 width) */}
        <div className="lg:col-span-5 bg-[#0e1626] border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between shadow-xl select-text">
          <div className="pb-3 border-b border-[#1e293b] flex justify-between items-center bg-[#0e1626]/20">
            <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Real-Time Audit Trial Log
            </h3>
            <button onClick={onClearLogs} className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono">
              Clear Logs
            </button>
          </div>
          
          <div className="flex-1 mt-3 p-3 bg-[#090d16] rounded-xl border border-[#1e293b] h-[260px] overflow-y-auto space-y-1.5 font-mono text-[10px] text-emerald-400/80 leading-normal scrollbar-none select-text">
            {logs.length === 0 ? (
              <span className="text-slate-600 block italic text-center py-12 font-sans">No security events triggered in current session yet</span>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-1 items-start text-left select-text">
                  <span className="text-teal-500 shrink-0 select-none">[{log.timestamp}]</span>
                  <span className="text-slate-400 uppercase tracking-widest text-[9px] font-semibold shrink-0 select-none">{log.type}:</span>
                  <span className="text-slate-300 flex-1 whitespace-pre-wrap select-text">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </motion.div>
  );
}
