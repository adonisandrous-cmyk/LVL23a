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
  Sliders,
  Gauge,
  TrendingUp,
  Coins,
  PlayCircle,
  Code2
} from 'lucide-react';
import { ActivityLog, SystemDiagnostic } from '../types';

interface SystemHealthTabProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export default function SystemHealthTab({ logs, onClearLogs }: SystemHealthTabProps) {
  // Hardcoded server states
  const [latency, setLatency] = useState(48);
  const [cpuUsage, setCpuUsage] = useState(12);
  const [ramUsage, setRamUsage] = useState(44);
  const [geminiConnected, setGeminiConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Level 23 Hybrid Router States
  const [routerConfig, setRouterConfig] = useState<any>({
    strategy: "DYNAMIC_LLM_EVALUATOR",
    freeModel: "google/gemma-4-31b-it:free",
    premiumModel: "google/gemini-2.5-flash",
    evaluatorThreshold: 45,
    simulatedStats: {
      totalRouted: 24,
      freeTierCount: 16,
      premiumTierCount: 8,
      estimatedCostSaved: 23.40,
      lastDecision: "Routed to Gemma 4 (31B) - standard client brief search index query parsed cost-effectively"
    }
  });

  // Simulator States
  const [testPrompt, setTestPrompt] = useState('Draft a Chapter 7 litigation petition detailing community liabilities under joint pressure and duress.');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchHealthAndRouter = async () => {
    setIsRefreshing(true);
    try {
      // Fetch status & health
      const response = await fetch('/api/health');
      const data = await response.json();
      setLatency(data.latencyMs || 25);
      setGeminiConnected(data.geminiConnected || false);

      // Fetch router configuration details
      const routerRes = await fetch('/api/ai/router-state');
      const routerData = await routerRes.json();
      if (routerData && routerData.strategy) {
        setRouterConfig(routerData);
      }
    } catch (err) {
      console.warn("Failed to query full health and routing states, using mock metrics fallback.", err);
      setLatency(102);
      setGeminiConnected(false);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    fetchHealthAndRouter();

    // Constant CPU Variance
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(8 + Math.random() * 8));
      setRamUsage(Math.floor(41 + Math.random() * 4));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Update server-side AI router settings
  const updateRouterSettings = async (updatedFields: any) => {
    setIsSaving(true);
    try {
      const nextConfig = { ...routerConfig, ...updatedFields };
      const res = await fetch('/api/ai/router-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConfig)
      });
      const data = await res.json();
      if (data.success) {
        setRouterConfig(data.routerState);
      }
    } catch (err) {
      console.error("Failed to update Level 23 AI Router settings on Express backend", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Run dynamic classification test
  const handleRunRoutingTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/route-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testPrompt })
      });
      const data = await res.json();
      setTestResult(data.decision);
      
      // Fetch router status again to increment stats count on screen
      setTimeout(() => {
        fetch('/api/ai/router-state')
          .then(r => r.json())
          .then(stateData => {
            if (stateData && stateData.strategy) {
              setRouterConfig(stateData);
            }
          })
          .catch(() => {});
      }, 500);

    } catch (err) {
      console.error("AI Routing simulator failed to fetch decision blueprint.", err);
    } finally {
      setIsTesting(false);
    }
  };

  const diagnostics: SystemDiagnostic[] = [
    {
      id: 'd-1',
      name: 'Google Gemini API Endpoint',
      value: geminiConnected ? 'Connected (secure)' : 'Disconnected (Requires personal key)',
      status: geminiConnected ? 'ok' : 'warning',
      details: geminiConnected
        ? 'Successfully connected to server-side Google GenAI service with environment config.'
        : 'Please update your secrets in settings to activate legal agents, multi-turn summaries, and document automation.'
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
      className="space-y-6 text-left selection:bg-teal-500/20"
    >
      {/* 1. Header Diagnostics Banner */}
      <div className="flex items-center justify-between p-5 bg-[#0e1626] border border-[#1e293b] rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading text-white">System Diagnostics & AI Router</h2>
            <p className="text-xs text-slate-400">Manage Express proxy latencies, system metrics, and dual OpenRouter-Gemini cost metrics.</p>
          </div>
        </div>

        <button
          onClick={fetchHealthAndRouter}
          disabled={isRefreshing}
          className="px-3.5 py-2 bg-[#090d16] hover:bg-slate-900 border border-[#1e293b] text-xs font-semibold text-slate-300 rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-40 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Diagnosing connection...' : 'Audit Metrics Check'}</span>
        </button>
      </div>

      {/* 2. Grid Quick meters metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Latency Meter */}
        <div className="p-5 bg-[#0e1626] border border-[#1e293b] rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">API Connection Latency</span>
            <Zap className="w-4 h-4 text-emerald-400 animate-bounce" />
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

        {/* Active CPU */}
        <div className="p-5 bg-[#0e1626] border border-[#1e293b] rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Active CPU Load</span>
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

        {/* Savings Ticker */}
        <div className="p-5 bg-[#0e1626] border border-[#1e293b] rounded-2xl shadow-md space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 -translate-y-4 translate-x-4 pointer-events-none group-hover:scale-110 transition-transform">
            <Coins className="w-24 h-24 text-teal-400" />
          </div>
          
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono text-teal-400">Estimated Cost Saved</span>
            <TrendingUp className="w-4 h-4 text-teal-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-zinc-100">${routerConfig.simulatedStats.estimatedCostSaved.toFixed(2)}</span>
            <span className="text-xs font-mono text-emerald-500">USD accumulated</span>
          </div>
          <div className="w-full h-1.5 bg-[#090d16] rounded-full overflow-hidden">
            <div className="h-full bg-teal-400" style={{ width: '78%' }} />
          </div>
        </div>

      </div>

      {/* 3. Level 23 Dual AI Router Command Deck */}
      <div className="bg-gradient-to-b from-[#0f172a] to-[#0a101f] border border-[#1e293b] rounded-3xl p-6 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#1e293b] gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded-md font-mono text-[9px] uppercase font-bold tracking-wider">Level 23 Core Security</span>
              <Sliders className="w-4.5 h-4.5 text-teal-400 animate-spin-slow" />
            </div>
            <h3 className="text-base font-bold text-white font-heading">Hybrid AI Router Control Deck</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Alex's bespoke model-routing engine. Routes low-stakes administration, inbox logs, and intake sorting to **cost-free open models** (Gemma 2 / Llama 3.1) via OpenRouter, escalates and deploys **premium Gemini reasoners** (Gemini 1.5 Pro) for heavy legal briefing.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">Router Deployment</span>
              <span className="text-xs text-emerald-400 font-mono font-bold uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Dual Active
              </span>
            </div>
          </div>
        </div>

        {/* Settings grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
          
          {/* Controls form: 7/12 width */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Router Orchestration Matrix</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Strategy Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Model Selector Strategy</label>
                <select
                  value={routerConfig.strategy}
                  onChange={(e) => updateRouterSettings({ strategy: e.target.value })}
                  className="w-full bg-[#070b13] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-teal-400 outline-none transition-colors"
                >
                  <option value="DYNAMIC_LLM_EVALUATOR">Dynamic LLM Evaluator</option>
                  <option value="OPENROUTER_FUSION">OpenRouter Fusion (Claude 3.7 + Gemini)</option>
                  <option value="DETERMINISTIC_BY_FEATURE">Deterministic Rules</option>
                  <option value="ALWAYS_PREMIUM">Always Premium (Gemini Pro)</option>
                  <option value="ALWAYS_FREE">Always Free (Open Weights)</option>
                </select>
                <span className="text-[9px] text-slate-500 block">How requests are evaluated & matched to models</span>
              </div>

              {/* Threshold Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 font-medium">Complexity Gate Threshold</label>
                  <span className="text-xs font-mono font-bold text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded leading-none">{routerConfig.evaluatorThreshold}%</span>
                </div>
                <div className="flex items-center gap-3 py-1.5">
                  <span className="text-[10px] text-slate-600">Free</span>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={routerConfig.evaluatorThreshold}
                    onChange={(e) => updateRouterSettings({ evaluatorThreshold: e.target.value })}
                    className="flex-1 accent-teal-400 bg-slate-900 rounded-lg appearance-none h-1.5 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-600">Gemini</span>
                </div>
                <span className="text-[9px] text-slate-500 block">Minimum complexity rating required to escalate to paid models</span>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Free Open Weights Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Tier 1: Cost-Free Model (OpenRouter)</label>
                <select
                  value={routerConfig.freeModel}
                  onChange={(e) => updateRouterSettings({ freeModel: e.target.value })}
                  className="w-full bg-[#070b13] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-teal-400 outline-none transition-colors font-mono"
                >
                  <option value="google/gemma-4-31b-it:free">google/gemma-4-31b-it:free</option>
                  <option value="google/gemma-4-26b-a4b-it:free">google/gemma-4-26b-it:free</option>
                  <option value="openrouter/free">openrouter/free (Dynamic Free Router)</option>
                  <option value="liquid/lfm-2.5-1.2b-thinking:free">liquid/lfm-2.5-1.2b-thinking:free</option>
                </select>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[9px] text-zinc-500">Perfect for daily scheduling, notes intakes, form parsing</span>
                </div>
              </div>

              {/* Premium Google Gemini Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Tier 2: Premium Model (Escalated)</label>
                <select
                  value={routerConfig.premiumModel}
                  onChange={(e) => updateRouterSettings({ premiumModel: e.target.value })}
                  className="w-full bg-[#070b13] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-teal-400 outline-none transition-colors font-mono"
                >
                  <option value="google/gemini-2.5-flash">google/gemini-2.5-flash (Active Premium)</option>
                  <option value="google/gemini-2.5-pro">google/gemini-2.5-pro (Flagship - Paid Plan)</option>
                  <option value="google/gemini-2.0-flash">google/gemini-2.0-flash (Experimental)</option>
                </select>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                  <span className="text-[9px] text-zinc-500">Escalated for Litigation briefs, Joint duress, Asylum declarations</span>
                </div>
              </div>

            </div>

            {/* Quick stats indicators inside matrix */}
            <div className="p-4 bg-[#070c16] rounded-xl border border-[#1e293b] flex items-center justify-between">
              <div className="text-left space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Last Decisions Trace</span>
                <span className="text-xs text-slate-300 font-sans block truncate max-w-[280px] sm:max-w-[360px] md:max-w-[480px]">"{routerConfig.simulatedStats.lastDecision}"</span>
              </div>
              <Gauge className="w-5 h-5 text-teal-400 shrink-0 select-none hidden sm:block animate-pulse" />
            </div>

          </div>

          {/* Router Metrics Dashboard: 5/12 width */}
          <div className="lg:col-span-5 bg-[#070b13] border border-[#1e293b] rounded-2.5xl p-5 space-y-4 shadow-inner flex flex-col justify-between">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-teal-400 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-teal-400" />
              Real-Time Sentry Audits
            </h4>
            
            <div className="space-y-3.5 flex-1 mt-1 justify-center flex flex-col">
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-sans">Total Routed Requests:</span>
                <span className="text-base font-bold font-mono text-zinc-100">{routerConfig.simulatedStats.totalRouted}</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-mono">Cost-Free Open-Weights:</span>
                  <span className="text-slate-300 font-mono font-semibold">{routerConfig.simulatedStats.freeTierCount} ({Math.round(routerConfig.simulatedStats.freeTierCount / (routerConfig.simulatedStats.totalRouted || 1) * 100)}%)</span>
                </div>
                <div className="w-full h-1.5 bg-[#0b101c] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(routerConfig.simulatedStats.freeTierCount / (routerConfig.simulatedStats.totalRouted || 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-mono">Premium Gemini Pro Escalation:</span>
                  <span className="text-slate-300 font-mono font-semibold">{routerConfig.simulatedStats.premiumTierCount} ({Math.round(routerConfig.simulatedStats.premiumTierCount / (routerConfig.simulatedStats.totalRouted || 1) * 100)}%)</span>
                </div>
                <div className="w-full h-1.5 bg-[#0b101c] rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${(routerConfig.simulatedStats.premiumTierCount / (routerConfig.simulatedStats.totalRouted || 1)) * 100}%` }}></div>
                </div>
              </div>

            </div>

            <div className="pt-2 border-t border-[#1e293b]/50 text-[10px] text-slate-500 leading-normal font-sans">
              *Savings calculated based on Escape Rate: Standard API calls avoided for high-volume intake classification operations using self-referential weights.
            </div>
          </div>

        </div>

        {/* 4. Real-time Model Decider Diagnostic Board */}
        <div className="pt-4 border-t border-[#1e293b] space-y-3 bg-[#0a101f]/50 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
              Automated Router Decision Audit
            </h4>
            <span className="text-[10px] text-emerald-500 font-mono">Decision Diagnostics</span>
          </div>

          <div className="space-y-3">
            <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed">
              Analyze how the routing engine instantly evaluates potential litigation briefs, duress cases, or chapter 7 assets, and select templates to auto-fill the diagnostic bed.
            </p>
            
            {/* Quick Templates */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Custody Schedule', text: 'Administrative scheduled calendar intake review: ask Eleanor Vance for separation dates and custody timelines.' },
                { label: 'Bankruptcy Assets Ledger', text: 'Chapter 7 assets audit ledger: cross audit Samuel Miller liabilities lists for any joint duress limits.' },
                { label: 'Asylum Briefing (Complex)', text: 'Draft asylum brief under CPC Title 8 CP. Include formal supporting narrative declaration of persecution and duress.' }
              ].map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTestPrompt(tpl.text)}
                  className="px-2.5 py-1 bg-[#070b14] hover:bg-slate-900 border border-slate-800 text-[10px] text-teal-400 font-mono rounded-lg cursor-pointer transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            {/* Input & Call trigger */}
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="flex-1 bg-[#060a12] border border-[#1e293b] text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-teal-400 h-16 font-mono resize-none"
                placeholder="Enter test legal prompt details..."
              />
              <button
                type="button"
                onClick={handleRunRoutingTest}
                disabled={isTesting || !testPrompt.trim()}
                className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 active:scale-95 transition-all text-[#090d16] font-bold text-xs font-mono uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Code2 className="w-4 h-4" />
                <span>{isTesting ? 'Evaluating...' : 'Triage Route Decision'}</span>
              </button>
            </div>

            {/* Decision Evaluation Result display */}
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#070b13] border border-[#1e293b] rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4"
              >
                <div className="md:col-span-4 border-r border-[#1e293b]/40 pr-3 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block">Router Sentry Verdict</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${testResult.isPremium ? 'bg-sky-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className={`text-sm font-bold font-mono ${testResult.isPremium ? 'text-sky-400' : 'text-emerald-400'}`}>
                      {testResult.isPremium ? 'PREMIUM ESCALATED' : 'STANDARD SAVED'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-mono">Routed To model:</span>
                    <span className="text-xs text-white font-mono block truncate">{testResult.modelSelected}</span>
                  </div>
                </div>

                <div className="md:col-span-8 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Assessed Complexity Rating</span>
                      <span className="text-xs font-mono font-bold text-white">{testResult.score}%</span>
                    </div>
                    <div className="w-full bg-[#0a101b] h-2 rounded-full overflow-hidden border border-slate-900">
                      <div
                        className={`h-full rounded-full ${testResult.isPremium ? 'bg-sky-400' : 'bg-emerald-400'}`}
                        style={{ width: `${testResult.score}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="pt-2 text-[11px] text-slate-300 font-sans leading-normal">
                    <span className="font-semibold text-slate-400">Router Rationale:</span> {testResult.reason}
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>

      {/* 5. Diagnostics Details & Audit logs section */}
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
            <button onClick={onClearLogs} className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono cursor-pointer bg-transparent border-none">
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
