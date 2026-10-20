import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Network,
  Scale,
  Calendar,
  FileCheck2,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Volume2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Send,
  AlertTriangle,
  Layers,
  Terminal,
  Server,
  Cpu,
  ChevronRight,
  UserCheck,
  Search
} from 'lucide-react';
import {
  biglawService,
  BigLawStatus,
  BigLawTask,
  DyTopoRound,
  CourtDeadlineCalculation,
  RedlineAnalysis,
  CitationVerification
} from '../services/biglawService';
import { audioService } from '../services/audioPlaybackService';

export function BigLawIntegrationStudio() {
  const [activeSubTab, setActiveSubTab] = useState<'rounds' | 'deadlines' | 'redline' | 'citations' | 'connection'>('rounds');
  const [status, setStatus] = useState<BigLawStatus | null>(null);
  const [currentTask, setCurrentTask] = useState<BigLawTask | null>(null);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // New Task Form
  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newJurisdiction, setNewJurisdiction] = useState<BigLawTask['jurisdiction']>('US_FEDERAL_FRCP');
  const [newWorkflow, setNewWorkflow] = useState<BigLawTask['workflow']>('roundtable');
  const [newBrief, setNewBrief] = useState('');
  const [newRequireGate, setNewRequireGate] = useState(true);

  // Deadline Calculator State
  const [deadlineJurisdiction, setDeadlineJurisdiction] = useState('US_FEDERAL_FRCP');
  const [deadlineTriggerDate, setDeadlineTriggerDate] = useState(new Date().toISOString().slice(0, 10));
  const [deadlineServiceMethod, setDeadlineServiceMethod] = useState<'personal' | 'mail' | 'electronic'>('personal');
  const [deadlineCalc, setDeadlineCalc] = useState<CourtDeadlineCalculation | null>(null);
  const [isCalculatingDeadlines, setIsCalculatingDeadlines] = useState(false);

  // Redline State
  const [contractInput, setContractInput] = useState(
    `11.2 Indemnification: Customer shall defend, indemnify, and hold harmless Provider, its affiliates, and their respective directors, officers, employees, and agents from and against all liabilities, losses, damages, claims, and expenses (including attorney's fees) arising out of or related to Customer's use of the Services or any alleged violation of law.\n\n12.1 Limitation of Liability: In no event will Provider be liable for any consequential, incidental, special, punitive, or indirect damages. Provider's total aggregate liability under this agreement will not exceed the amounts actually paid by Customer in the one (1) month immediately preceding the event giving rise to liability.`
  );
  const [redlineResult, setRedlineResult] = useState<RedlineAnalysis | null>(null);
  const [isAnalyzingRedline, setIsAnalyzingRedline] = useState(false);

  // Citation State
  const [citationInput, setCitationInput] = useState('Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007)');
  const [citationResult, setCitationResult] = useState<CitationVerification | null>(null);
  const [isCheckingCitation, setIsCheckingCitation] = useState(false);

  // Custom API Url
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [urlSaved, setUrlSaved] = useState(false);

  useEffect(() => {
    loadStatus();
    loadDefaultTask();
    runInitialDeadlines();
    setCustomUrlInput(biglawService.getSavedApiUrl());
  }, []);

  const loadStatus = async () => {
    const s = await biglawService.getStatus();
    setStatus(s);
  };

  const loadDefaultTask = async () => {
    setIsLoading(true);
    try {
      const task = await biglawService.getTask('bl-task-10482-014');
      setCurrentTask(task);
      setSelectedRoundIndex(task.rounds.length > 0 ? task.rounds[task.rounds.length - 1].roundIndex : 1);
    } catch {
      // Create fresh if needed
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrief.trim()) return;
    setIsLoading(true);
    try {
      const task = await biglawService.submitTask({
        title: newTitle || `DyTopo Legal Review - ${newJurisdiction}`,
        jurisdiction: newJurisdiction,
        workflow: newWorkflow,
        inputBrief: newBrief,
        requireHumanGate: newRequireGate,
        clientName: 'Active Client Matter',
        matterNumber: '2026-042'
      });
      setCurrentTask(task);
      setSelectedRoundIndex(task.rounds.length);
      setShowNewTaskModal(false);
      setNewBrief('');
      setNewTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveGate = async (gateId: string, action: 'approve' | 'reject') => {
    if (!currentTask) return;
    try {
      const res = await biglawService.resolveGate(currentTask.id, gateId, action);
      setCurrentTask(res.task);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoiceBriefing = async () => {
    if (!currentTask?.finalSynthesis) return;
    if (isSpeaking) {
      audioService.stopAllAudio();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    await audioService.playVoiceAudio({
      text: currentTask.finalSynthesis,
      agent: 'PHOENIX',
      voiceName: 'Aoede',
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false)
    });
  };

  const runInitialDeadlines = async () => {
    setIsCalculatingDeadlines(true);
    try {
      const res = await biglawService.computeDeadlines({
        jurisdiction: deadlineJurisdiction,
        triggerEvent: 'service_of_complaint',
        triggerDate: deadlineTriggerDate,
        serviceMethod: deadlineServiceMethod
      });
      setDeadlineCalc(res);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsCalculatingDeadlines(false);
    }
  };

  const handleAnalyzeRedline = async () => {
    if (!contractInput.trim()) return;
    setIsAnalyzingRedline(true);
    try {
      const res = await biglawService.analyzeRedline(contractInput);
      setRedlineResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingRedline(false);
    }
  };

  const handleCheckCitation = async () => {
    if (!citationInput.trim()) return;
    setIsCheckingCitation(true);
    try {
      const res = await biglawService.verifyCitation(citationInput);
      setCitationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingCitation(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleSaveUrl = () => {
    biglawService.setCustomApiUrl(customUrlInput.trim());
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2000);
    loadStatus();
  };

  const currentRound = currentTask?.rounds.find((r) => r.roundIndex === selectedRoundIndex) || currentTask?.rounds[0];

  return (
    <div className="h-full flex flex-col bg-[#070b13] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Banner Header */}
      <div className="p-4 border-b border-[#1e293b] bg-[#090e1a]/90 backdrop-blur-md shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 via-[#dfb76c]/30 to-blue-500/20 border border-[#dfb76c]/50 flex items-center justify-center text-[#dfb76c] shadow-[0_0_15px_rgba(223,183,108,0.2)]">
            <Network className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-wide">
                Phoenix: BigLaw Senior Counsel Command
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                Phoenix = BigLaw Senior Counsel
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 border border-blue-500/40 text-blue-300">
                100+ DyTopo Bench
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Phoenix Senior Counsel command</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono">
                {status?.mode === 'docker' ? 'Live Docker Engine (:3102)' : status?.mode === 'native_go' ? 'Native Go Engine (:3101)' : 'Embedded DyTopo Engine (Active)'}
              </span>
              <span>•</span>
              <span className="text-amber-400/90 font-mono">98.4% Verbatim Grounding</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {currentTask?.finalSynthesis && (
            <button
              type="button"
              onClick={handleVoiceBriefing}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                isSpeaking
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 shadow-sm'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeaking ? 'Pause Senior Counsel Briefing' : 'Phoenix Briefing (UK Senior Counsel)'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowNewTaskModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center gap-1.5 shadow-md transition-all cursor-pointer border-none"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Convene Matter Bench</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-[#1e293b] bg-[#080c16] px-4 flex items-center gap-1 overflow-x-auto custom-scrollbar shrink-0">
        {[
          { id: 'rounds', label: 'DyTopo Roundtable & Gates', icon: Network, badge: currentTask?.status === 'HUMAN_GATE_PENDING' ? '1 Gate' : undefined },
          { id: 'deadlines', label: 'Court Deadline Calculator', icon: Calendar, badge: 'FRCP / CPR' },
          { id: 'redline', label: 'Playbook Redline & Silent Edits', icon: FileCheck2 },
          { id: 'citations', label: 'CourtListener CitationGate', icon: BookOpen },
          { id: 'connection', label: 'Engine & MCP Bridge', icon: Server, badge: status?.mode }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`py-2.5 px-3.5 text-xs font-medium flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
                isActive
                  ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase ${
                  tab.badge === '1 Gate' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Workspace Views */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        {/* SUBTAB 1: DYTOPO ROUNDTABLE & GATES */}
        {activeSubTab === 'rounds' && (
          <div className="space-y-5 max-w-6xl mx-auto">
            {/* Task Overview Card */}
            {currentTask && (
              <div className="p-4 rounded-xl bg-[#0d1322] border border-[#1e293b] flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Matter #{currentTask.matterNumber || '10482-014'}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      {currentTask.jurisdiction}
                    </span>
                    <span className={`font-mono text-xs px-2 py-0.5 rounded border ${
                      currentTask.status === 'HUMAN_GATE_PENDING'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {currentTask.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white">
                    {currentTask.title}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Client: <span className="text-slate-200">{currentTask.clientName || 'Apex Global Holdings'}</span> • DyTopo Rounds: <span className="text-amber-300">{currentTask.rounds.length} completed</span> • Verbatim Citation Rate: <span className="text-emerald-400 font-mono">{currentTask.statutoryGroundingRate}%</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadDefaultTask}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border-none"
                    title="Reload Task"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Human Gate Banner if Pending */}
            {currentTask?.gates && currentTask.gates.some((g) => g.status === 'PENDING') && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider font-mono">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Human Gate Triggered — Managing Partner Phoenix Authorization Required</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/30">
                    Rule 5 No-Guess Verified
                  </span>
                </div>

                {currentTask.gates
                  .filter((g) => g.status === 'PENDING')
                  .map((gate) => (
                    <div key={gate.id} className="p-3.5 bg-slate-950/60 rounded-lg border border-rose-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-rose-200">
                          {gate.finding}
                        </div>
                        <p className="text-xs text-slate-400">
                          Authority: <span className="font-mono text-amber-300">{gate.ruleCitation}</span> • Rationale: {gate.rationale}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleResolveGate(gate.id, 'approve')}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer border-none transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Finding</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveGate(gate.id, 'reject')}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600/80 hover:bg-rose-600 text-white flex items-center gap-1.5 cursor-pointer border-none transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject / Issue Counter</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* DyTopo Multi-Round Progression Stepper */}
            {currentTask && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
                    DyTopo Communication Graph Rounds
                  </span>
                  <span className="text-xs font-mono text-amber-400">
                    Round {selectedRoundIndex} of {currentTask.rounds.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {currentTask.rounds.map((round) => {
                    const isSelected = round.roundIndex === selectedRoundIndex;
                    return (
                      <button
                        key={round.roundIndex}
                        type="button"
                        onClick={() => setSelectedRoundIndex(round.roundIndex)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/60 shadow-[0_0_15px_rgba(223,183,108,0.15)]'
                            : 'bg-[#0d1322] border-[#1e293b] hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>ROUND 0{round.roundIndex}</span>
                          {round.status === 'flagged' ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-white mt-1">
                          {round.stageName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {round.activeAgents.join(' • ')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Round Communication Details */}
            {currentRound && (
              <div className="p-5 rounded-xl bg-[#0a0f1d] border border-[#1e293b] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Round {currentRound.roundIndex}: {currentRound.stageName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/30">
                        {currentRound.activeAgents.length} Agents In Session
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentRound.description}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Status: {currentRound.status}
                  </span>
                </div>

                {/* Exchanges Stream */}
                <div className="space-y-3">
                  {currentRound.exchanges.map((ex, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        ex.isContested
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : 'bg-[#0f172a]/70 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400 font-mono">
                            {ex.fromAgent}
                          </span>
                          <span className="text-slate-500">→</span>
                          <span className="font-bold text-blue-400 font-mono">
                            {ex.toAgent}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            ({ex.agentRole})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {ex.isContested && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                              CONTESTED
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px] font-mono">
                            Confidence: {Math.round(ex.confidence * 100)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed">
                        {ex.content}
                      </p>

                      {ex.citation && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-mono text-amber-300/90">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>Verbatim Citation: {ex.citation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Synthesis Card with Voice Playback */}
            {currentTask?.finalSynthesis && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-amber-950/20 via-[#0d1322] to-blue-950/20 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-white">
                      Phoenix Executive Synthesis & Advisory Output
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/40">
                    British UK Voice Ready
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {currentTask.finalSynthesis}
                </p>

                {currentTask.verbatimCitations && currentTask.verbatimCitations.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                      Grounded Authorities:
                    </span>
                    {currentTask.verbatimCitations.map((cite, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono text-[11px]">
                        {cite}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: COURT DEADLINE CALCULATOR */}
        {activeSubTab === 'deadlines' && (
          <div className="space-y-5 max-w-5xl mx-auto">
            <div className="p-5 rounded-xl bg-[#0d1322] border border-[#1e293b] space-y-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>BigLaw Statutory Court Deadline Calculator</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enforces Federal Rules of Civil Procedure (FRCP), California CCP, and UK High Court CPR deadlines with automatic Rule 6(d) service extensions and calendar/court-day roll-forwards.
                </p>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Jurisdiction Ruleset
                  </label>
                  <select
                    value={deadlineJurisdiction}
                    onChange={(e) => setDeadlineJurisdiction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-amber-400 outline-none"
                  >
                    <option value="US_FEDERAL_FRCP">US Federal (FRCP Rule 12 / 26 / 56)</option>
                    <option value="CA_JUDICIAL">California Superior Court (CCP § 412.20 / 437c)</option>
                    <option value="UK_CPR">UK High Court (CPR Part 10 / 15 / 26)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Trigger Event Date
                  </label>
                  <input
                    type="date"
                    value={deadlineTriggerDate}
                    onChange={(e) => setDeadlineTriggerDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Service Method
                  </label>
                  <select
                    value={deadlineServiceMethod}
                    onChange={(e) => setDeadlineServiceMethod(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-amber-400 outline-none"
                  >
                    <option value="personal">Personal In-Hand Service (Standard)</option>
                    <option value="mail">Mail Service (+3 Days per FRCP Rule 6(d))</option>
                    <option value="electronic">Electronic CM/ECF Notice</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={runInitialDeadlines}
                  disabled={isCalculatingDeadlines}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer border-none flex items-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isCalculatingDeadlines ? 'Calculating...' : 'Recalculate Deadlines'}</span>
                </button>
              </div>
            </div>

            {/* Deadlines Table */}
            {deadlineCalc && (
              <div className="p-5 rounded-xl bg-[#0a0f1d] border border-[#1e293b] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="text-xs font-mono text-slate-300">
                    Calculated for: <span className="text-amber-400 font-bold">{deadlineCalc.jurisdiction}</span> from trigger date <span className="text-white">{deadlineCalc.triggerDate}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                    {deadlineCalc.deadlines.length} Court Action Milestones
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                        <th className="py-2.5 px-3">Milestone Action</th>
                        <th className="py-2.5 px-3">Statutory Due Date</th>
                        <th className="py-2.5 px-3">Rule & Authority</th>
                        <th className="py-2.5 px-3">Notes & Rules</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {deadlineCalc.deadlines.map((dl, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-white">
                            {dl.actionName}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                              {dl.dueDate}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              ({dl.daysCount} {dl.dayType} days)
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300">
                            {dl.statutoryBasis}
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-[11px]">
                            {dl.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: PLAYBOOK CONTRACT REDLINE */}
        {activeSubTab === 'redline' && (
          <div className="space-y-5 max-w-5xl mx-auto">
            <div className="p-5 rounded-xl bg-[#0d1322] border border-[#1e293b] space-y-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-amber-400" />
                  <span>BigLaw Playbook-Aware Counter-Redline & Silent-Edit Detection</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Detects concealed unilateral modifications, unconscionable indemnity liabilities, and disclaimers of intentional wrongdoing against firm playbook standards.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Paste Contract Provisions for Deep Redline Audit
                </label>
                <textarea
                  rows={6}
                  value={contractInput}
                  onChange={(e) => setContractInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-amber-400 outline-none"
                  placeholder="Paste agreement text..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAnalyzeRedline}
                  disabled={isAnalyzingRedline}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer border-none flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isAnalyzingRedline ? 'Auditing Inbound Terms...' : 'Run BigLaw Redline Audit'}</span>
                </button>
              </div>
            </div>

            {/* Redline Results */}
            {redlineResult && (
              <div className="space-y-4">
                {/* Silent Edits Alert */}
                {redlineResult.silentEditsDetected.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/30 to-slate-900 border border-rose-500/40 space-y-3">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase font-mono">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Silent Edits & Critical Variances Detected ({redlineResult.silentEditsDetected.length})</span>
                    </div>

                    <div className="space-y-2">
                      {redlineResult.silentEditsDetected.map((edit, idx) => (
                        <div key={idx} className="p-3 bg-slate-950/70 rounded-lg border border-rose-500/20 text-xs">
                          <div className="font-semibold text-rose-200">{edit.clause}</div>
                          <p className="text-slate-300 mt-0.5">{edit.hiddenChange}</p>
                          <p className="text-amber-400 font-mono text-[11px] mt-1">Recommended Remedy: {edit.remedy}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Playbook Variances & Counter-Proposals */}
                <div className="p-5 rounded-xl bg-[#0a0f1d] border border-[#1e293b] space-y-4">
                  <h3 className="font-bold text-sm text-white">
                    Playbook Variances & Negotiating Cards
                  </h3>

                  <div className="space-y-4">
                    {redlineResult.playbookVariances.map((v, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-[#0d1322] border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-amber-300 font-mono">
                            {v.clauseName}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Playbook Variance
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20">
                            <span className="text-[10px] font-mono text-rose-400 uppercase font-bold block mb-1">
                              Inbound Offered Text
                            </span>
                            <p className="text-slate-300 font-mono text-[11px]">{v.offeringText}</p>
                          </div>

                          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block mb-1">
                              Phoenix Recommended Counter-Position
                            </span>
                            <p className="text-slate-300 font-mono text-[11px]">{v.recommendedCounter}</p>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
                          <span className="text-amber-400 font-bold font-mono">Strategic Rationale: </span>
                          {v.negotiationRationale}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 4: COURTLISTENER CITATIONGATE */}
        {activeSubTab === 'citations' && (
          <div className="space-y-5 max-w-4xl mx-auto">
            <div className="p-5 rounded-xl bg-[#0d1322] border border-[#1e293b] space-y-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <span>BigLaw CitationGate & CourtListener Verbatim Verifier</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Verifies case reporter citations, statutory penalties, and Shepard's-style vitality ratings against official caselaw records. Zero fabricated legal authority permitted.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={citationInput}
                  onChange={(e) => setCitationInput(e.target.value)}
                  placeholder="e.g. 550 U.S. 544 or Kalisch-Jarcho"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-400 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleCheckCitation}
                  disabled={isCheckingCitation}
                  className="px-4 py-2.5 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer border-none flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isCheckingCitation ? 'Verifying...' : 'Verify Citation'}</span>
                </button>
              </div>

              {/* Sample Quick Searches */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] font-mono text-slate-400">Quick Verifications:</span>
                {[
                  'Bell Atlantic Corp. v. Twombly, 550 U.S. 544',
                  'Ashcroft v. Iqbal, 556 U.S. 662',
                  'Kalisch-Jarcho v. City of New York, 58 N.Y.2d 377'
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setCitationInput(sample);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] cursor-pointer border-none"
                  >
                    {sample.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Citation Result Card */}
            {citationResult && (
              <div className="p-5 rounded-xl bg-[#0a0f1d] border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      CourtListener Grounded Case Law Record
                    </span>
                    <h3 className="font-bold text-base text-white font-mono mt-0.5">
                      {citationResult.queryCitation}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded font-mono text-xs font-bold border ${
                    citationResult.precedentialVitality === 'Good Law'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    Vitality: {citationResult.precedentialVitality}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-0.5">
                      Official Reporter
                    </span>
                    <p className="font-mono text-amber-300">{citationResult.officialReporter}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-0.5">
                      Deciding Court & Date
                    </span>
                    <p className="text-white">{citationResult.court} ({citationResult.dateDecided})</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                    Verbatim Case Holding
                  </span>
                  <p className="text-xs text-slate-200 italic leading-relaxed">
                    "{citationResult.verbatimHolding}"
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Governing Rules & Codes:</span>
                  <span className="text-amber-400">{citationResult.statutoryPenaltyOrRule}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 5: CONNECTION & MCP CONFIGURATION */}
        {activeSubTab === 'connection' && (
          <div className="space-y-5 max-w-4xl mx-auto">
            {/* Status Card */}
            <div className="p-5 rounded-xl bg-[#0d1322] border border-[#1e293b] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-amber-400" />
                    <span>discover-legal/BigLaw Connection Status</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect Level 23 to a running Docker stack, native Go binary, or rely on the embedded DyTopo engine.
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded font-mono text-xs font-bold border ${
                  status?.isConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {status?.mode === 'docker' ? 'DOCKER ACTIVE (:3102)' : status?.mode === 'native_go' ? 'NATIVE GO ACTIVE (:3101)' : 'EMBEDDED DYTOPO ACTIVE'}
                </span>
              </div>

              {/* Endpoint Override Input */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold">
                  BigLaw API Target Endpoint (REST / MCP Host)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="http://localhost:3102 or https://your-biglaw-host.com"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-400 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveUrl}
                    className="px-4 py-2.5 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer border-none"
                  >
                    {urlSaved ? 'Saved!' : 'Save & Connect'}
                  </button>
                </div>
              </div>
            </div>

            {/* 60 Seconds Run Guide */}
            <div className="p-5 rounded-xl bg-[#0a0f1d] border border-[#1e293b] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Launch BigLaw Locally (Docker or Native Go)</span>
                </h3>
                <a
                  href="https://github.com/discover-legal/BigLaw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-3">
                {/* Option 1: Docker 60-Second Setup */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      Option A: 60-Second Docker Stack (REST on :3102)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('curl -fsSL https://raw.githubusercontent.com/discover-legal/BigLaw/main/setup.sh | bash', 'docker')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      {copiedCmd === 'docker' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Command</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded bg-[#070b13] text-amber-300 font-mono text-xs overflow-x-auto">
                    curl -fsSL https://raw.githubusercontent.com/discover-legal/BigLaw/main/setup.sh | bash
                  </pre>
                </div>

                {/* Option 2: Native Go Binary */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      Option B: Native Go 1.25 Binary (REST on :3101)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('git clone https://github.com/discover-legal/BigLaw.git && cd BigLaw && go run ./biglaw-go/cmd/biglaw', 'go')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      {copiedCmd === 'go' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Command</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded bg-[#070b13] text-amber-300 font-mono text-xs overflow-x-auto">
                    git clone https://github.com/discover-legal/BigLaw.git && cd BigLaw && go run ./biglaw-go/cmd/biglaw
                  </pre>
                </div>
              </div>
            </div>

            {/* MCP Tool Registry */}
            <div className="p-5 rounded-xl bg-[#0a0f1d] border border-[#1e293b] space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Exposed BigLaw MCP Tools (Model Context Protocol)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Phoenix dispatches into these BigLaw MCP endpoints across the DyTopo communication pipeline:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { name: 'submit_task', desc: 'Convene 100+ multi-agent legal task with jurisdiction parameter' },
                  { name: 'get_task', desc: 'Poll status, DyTopo graph, and verified findings' },
                  { name: 'approve_gate / reject_gate', desc: 'Human attorney gatekeeping for flagged risks' },
                  { name: 'submit_from_template', desc: 'Run pre-built workflow (EU brief, lease review, M&A due diligence)' },
                  { name: 'ingest_document', desc: 'Add contract or pleading to the knowledge store' },
                  { name: 'search_knowledge', desc: 'Semantic search across vectorized case files' },
                  { name: 'list_agents', desc: 'Browse the 100+ active DyTopo agent roster' },
                  { name: 'get_time_entries', desc: 'Automatic 6-min billable units in LEDES 1998B format' }
                ].map((tool) => (
                  <div key={tool.name} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-0.5">
                    <span className="text-amber-400 font-bold">{tool.name}</span>
                    <p className="text-[11px] text-slate-400 font-sans">{tool.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CONVENE MATTER / DISPATCH TASK */}
      <AnimatePresence>
        {showNewTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c121e] border border-[#dfb76c]/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200"
            >
              <div className="p-4 border-b border-slate-800 bg-[#070b13] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">
                    Convene BigLaw Multi-Agent DyTopo Bench
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer border-none bg-transparent"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="p-5 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Matter Review Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Cross-Border Software Agreement Indemnity Review"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                      Governing Jurisdiction
                    </label>
                    <select
                      value={newJurisdiction}
                      onChange={(e) => setNewJurisdiction(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-amber-400 outline-none"
                    >
                      <option value="US_FEDERAL_FRCP">US Federal (FRCP)</option>
                      <option value="CA_JUDICIAL">California Law (Judicial Council)</option>
                      <option value="NY_COMMERCIAL">New York Commercial Division</option>
                      <option value="UK_CPR">UK High Court (CPR)</option>
                      <option value="EU_COMPETITION">EU Competition (TFEU 101/102)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                      Workflow Topology
                    </label>
                    <select
                      value={newWorkflow}
                      onChange={(e) => setNewWorkflow(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-amber-400 outline-none"
                    >
                      <option value="roundtable">Roundtable Multi-Agent Debate</option>
                      <option value="counter_redline">Playbook Counter-Redline</option>
                      <option value="deadline_audit">Statutory Deadline Audit</option>
                      <option value="citation_check">CitationGate Grounding</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Input Legal Brief / Matter Facts / Disputed Clauses
                  </label>
                  <textarea
                    rows={4}
                    value={newBrief}
                    onChange={(e) => setNewBrief(e.target.value)}
                    placeholder="Describe the matter facts, dispute, or paste clauses to submit across the 100+ agent bench..."
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-400 outline-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="requireGate"
                    checked={newRequireGate}
                    onChange={(e) => setNewRequireGate(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="requireGate" className="text-xs text-slate-300">
                    Require Managing Partner (Phoenix) Human Gate Sign-off on High Risks
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNewTaskModal(false)}
                    className="px-3 py-2 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !newBrief.trim()}
                    className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isLoading ? 'Convening...' : 'Dispatch to DyTopo Bench'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
