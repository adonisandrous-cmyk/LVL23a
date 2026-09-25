import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  MessageSquare,
  Send,
  Database,
  Layers,
  Cpu,
  RefreshCw,
  Eye,
  Download,
  Terminal,
  Activity,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Lock,
  Code2,
  Check,
  X,
  FileSpreadsheet,
  Workflow
} from 'lucide-react';

import {
  AgentDescriptor,
  AgentChatMessage,
  PipelineExecutionState,
  IntelligentTemplate,
  PopulatedOutputResult,
  QAValidationReport
} from '../services/phoenixEngine/types';
import { phoenixPipelineCoordinator } from '../services/phoenixEngine/PhoenixPipelineCoordinator';
import { automatedTestSuite, AutomatedTestResult } from '../services/phoenixEngine/automatedTests';
import { phoenixDb } from '../services/phoenixDatabaseService';
import { ExecutivePipelineHandOffModal } from './ExecutivePipelineHandOffModal';
import { PhoenixEngineFlowchart } from './PhoenixEngineFlowchart';
import { ExecutiveDispatchResult } from '../services/phoenixEngine/ExecutivePipelineBridge';
import { EightAgentsDialogueModal } from './EightAgentsDialogueModal';

export function PhoenixEightAgentStudio() {
  const [agents, setAgents] = useState<AgentDescriptor[]>(() => phoenixPipelineCoordinator.getAgents());
  const [selectedAgent, setSelectedAgent] = useState<AgentDescriptor | null>(null);
  const [agentChatHistory, setAgentChatHistory] = useState<AgentChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  // 8-Agent Dialogue Pop-up Modal State
  const [showDialogueModal, setShowDialogueModal] = useState(false);
  const [dialogueModalAgentId, setDialogueModalAgentId] = useState<string>('agent_1_ingestion');

  // Executive Hand-Off State
  const [showExecutiveModal, setShowExecutiveModal] = useState(false);
  const [executiveDispatcher, setExecutiveDispatcher] = useState<'phoenix' | 'eve'>('phoenix');
  const [executiveBriefingNotice, setExecutiveBriefingNotice] = useState<string | null>(null);

  // Pipeline execution state
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineState, setPipelineState] = useState<PipelineExecutionState | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<IntelligentTemplate | null>(null);
  const [populatedResult, setPopulatedResult] = useState<PopulatedOutputResult | null>(null);
  const [qaReport, setQaReport] = useState<QAValidationReport | null>(null);

  // Automated Test Suite State
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<AutomatedTestResult[] | null>(null);
  const [testSummary, setTestSummary] = useState<{ total: number; passed: number; failed: number } | null>(null);

  // Inspector Sub-tab
  const [inspectorTab, setInspectorTab] = useState<'visual_master' | 'intelligence_layer' | 'population_export' | 'automated_tests' | 'audit_trail' | 'engine_flowchart'>('intelligence_layer');

  // Human review overrides
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, 'approved' | 'rejected'>>({});

  // Handler for executive hand-off from Phoenix or EVE
  const handleExecutiveDispatchComplete = (result: ExecutiveDispatchResult) => {
    setPipelineState(result.state);
    setCurrentTemplate(result.template);
    setPopulatedResult(result.populatedOutput);
    setQaReport(result.qaReport);
    setAgents(phoenixPipelineCoordinator.getAgents());
    setExecutiveBriefingNotice(result.executiveSummary);
    setInspectorTab('intelligence_layer');
  };

  // Refresh agents every 2 seconds if active
  useEffect(() => {
    const timer = setInterval(() => {
      setAgents(phoenixPipelineCoordinator.getAgents());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Sync chat when selected agent changes
  useEffect(() => {
    if (selectedAgent) {
      setAgentChatHistory(phoenixPipelineCoordinator.getChatHistory(selectedAgent.id));
    }
  }, [selectedAgent]);

  // Handle document file upload or synthetic demo execution
  const handleRunPipeline = async (file?: File) => {
    setIsProcessing(true);
    setPopulatedResult(null);
    setQaReport(null);

    try {
      let fileBytes: Uint8Array;
      let filename = 'FL-300_Request_For_Order.pdf';

      if (file) {
        filename = file.name;
        const arrayBuffer = await file.arrayBuffer();
        fileBytes = new Uint8Array(arrayBuffer);
      } else {
        // Run on synthetic legal master document
        const dummyPdf = `%PDF-1.4\n%Level23 Immutable Visual Master\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF`;
        fileBytes = new Uint8Array(dummyPdf.split('').map(c => c.charCodeAt(0)));
      }

      // Execute via coordinator
      const result = await phoenixPipelineCoordinator.processDocument(fileBytes, filename, {
        clientData: {
          'person.full_name': 'Eleanor Vance',
          'party.petitioner.full_name': 'Eleanor Vance',
          'party.respondent.full_name': 'Jonathan Vance',
          'court.county': 'Orange County',
          'matter.case_number': '24FL-009412'
        },
        matterData: {
          'court.name': 'Superior Court of California',
          'legal.date': 'September 24, 2026'
        }
      });

      setPipelineState(result.state);
      setCurrentTemplate(result.template);
      setPopulatedResult(result.populatedOutput);
      setQaReport(result.qaReport);
      setAgents(phoenixPipelineCoordinator.getAgents());
    } catch (err: any) {
      console.error('Pipeline Execution Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Run the Section VII Automated Test Suite
  const handleRunTests = async () => {
    setIsRunningTests(true);
    setInspectorTab('automated_tests');
    try {
      const suiteResult = await automatedTestSuite.runAllTests();
      setTestResults(suiteResult.results);
      setTestSummary({
        total: suiteResult.total,
        passed: suiteResult.passed,
        failed: suiteResult.failed
      });
    } catch (err) {
      console.error('Test Suite Error:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Send interactive chat message to selected agent
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !selectedAgent || isChatSending) return;
    const msg = chatInput.trim();
    setChatInput('');
    setIsChatSending(true);

    try {
      await phoenixPipelineCoordinator.chatWithAgent(selectedAgent.id, msg);
      setAgentChatHistory(phoenixPipelineCoordinator.getChatHistory(selectedAgent.id));
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsChatSending(false);
    }
  };

  return (
    <div className="flex-1 h-full min-h-0 bg-[#060911] text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Top Banner: Master Rules & Engine Header */}
      <header className="px-6 py-4 bg-[#090e1a] border-b border-[#1b253b] flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500/20 to-teal-500/20 border border-amber-500/40 text-amber-300">
              <Cpu className="w-4 h-4" />
            </div>
            <h1 className="text-base font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-teal-200 to-white font-heading uppercase">
              Phoenix 23 — AI Document Automation Engine
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-teal-500/15 text-teal-300 border border-teal-500/30">
              8-Agent Pipeline
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Visual Master Immutable
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans max-w-3xl leading-relaxed">
            <strong>Core Principle:</strong> Upload once → understand it → extract facts → map blanks → preserve original document byte-for-byte → create reusable template → populate future forms.
          </p>
        </div>

        {/* Global Pipeline Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setDialogueModalAgentId(selectedAgent?.id || 'agent_1_ingestion');
              setShowDialogueModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/50 text-amber-200 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95 cursor-pointer"
            title="Open pop-up dialogue with any of the 8 agents"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>8 Agents Dialogue Pop-Up</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExecutiveDispatcher('phoenix');
              setShowExecutiveModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-purple-950 border border-purple-400/50 hover:border-purple-300 text-purple-200 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.25)] active:scale-95 cursor-pointer"
            title="Phoenix & EVE issue directives and hand documents to the 8-agent pipeline"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Executive Hand-Off (Phoenix & EVE)</span>
          </button>

          <button
            type="button"
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="px-3.5 py-2 bg-[#0d1527] hover:bg-[#121c33] border border-amber-500/40 hover:border-amber-400 text-amber-300 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
            <span>{isRunningTests ? 'Running Tests 1-8...' : 'Run Automated Tests'}</span>
          </button>

          <label className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] active:scale-95 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleRunPipeline(e.target.files[0]);
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => handleRunPipeline()}
            disabled={isProcessing}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs font-sans flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Executing 8 Agents...' : 'Run Synthetic Demo'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body: 8-Agent Visual Rail (Top) + Split Inspector (Bottom) */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        
        {/* 1. EIGHT SPECIALIZED AGENTS PIPELINE BAR */}
        <section className="px-6 py-3 bg-[#080d18] border-b border-[#162033] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-teal-400" />
              Specialized 8-Agent Execution Pipeline
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Click any agent to inspect directives & open live chat
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {agents.map((ag) => {
              const isCurrentStep = pipelineState?.currentStep === ag.index && isProcessing;
              const isSelected = selectedAgent?.id === ag.id;

              return (
                <div
                  key={ag.id}
                  onClick={() => {
                    setSelectedAgent(ag);
                    setDialogueModalAgentId(ag.id);
                    setShowDialogueModal(true);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left relative group ${
                    isSelected
                      ? 'bg-amber-950/20 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : isCurrentStep
                      ? 'bg-teal-950/30 border-teal-400 animate-pulse'
                      : ag.status === 'completed'
                      ? 'bg-[#0d1424] border-emerald-500/40 hover:border-emerald-400'
                      : ag.status === 'failed'
                      ? 'bg-rose-950/30 border-rose-500/60'
                      : 'bg-[#090e1b] border-[#18233a] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono font-bold text-slate-400">
                      Step {ag.index}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ag.status === 'completed'
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                          : isCurrentStep
                          ? 'bg-teal-400 animate-ping'
                          : ag.status === 'failed'
                          ? 'bg-rose-400'
                          : 'bg-slate-600'
                      }`}
                    />
                  </div>

                  <div className="text-[11px] font-bold text-slate-200 truncate group-hover:text-white">
                    {ag.name.replace(/^Agent \d+: /, '')}
                  </div>

                  <div className="text-[9px] text-slate-400 font-mono truncate mt-0.5">
                    {ag.title}
                  </div>

                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-white/5">
                    <span className={`text-[8px] font-mono uppercase px-1 rounded ${
                      ag.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                      isCurrentStep ? 'bg-teal-500/20 text-teal-300' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {isCurrentStep ? 'RUNNING' : ag.status.toUpperCase()}
                    </span>
                    <MessageSquare className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 1.5. EXECUTIVE DIRECTIVE BANNER (When Phoenix or EVE has dispatched with directives) */}
        {pipelineState?.executiveDirective && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-purple-950/70 via-[#0d162d] to-indigo-950/70 border-b border-purple-500/40 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className={`px-2.5 py-1 rounded-lg font-mono font-extrabold uppercase text-[10.5px] flex items-center gap-1.5 shadow-sm border ${
                pipelineState.executiveDirective.dispatcherAgent === 'phoenix'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>DIRECTIVE ISSUED BY {pipelineState.executiveDirective.dispatcherName.toUpperCase()}</span>
              </div>
              <div className="text-slate-200 font-bold truncate max-w-md">
                {pipelineState.executiveDirective.directiveTitle}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {pipelineState.executiveDirective.matterReference?.clientName && (
                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-mono border border-slate-700">
                  Client: {pipelineState.executiveDirective.matterReference.clientName}
                </span>
              )}
              {pipelineState.executiveDirective.matterReference?.caseNumber && (
                <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-300 text-[10px] font-mono border border-slate-700">
                  Case: {pipelineState.executiveDirective.matterReference.caseNumber}
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                Rule: Zero Reflow Enforced
              </span>
            </div>
          </div>
        )}

        {/* 2. MAIN WORKING PANE: Dual Layer Inspector & Diagnostics */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left / Center: Document & Intelligence View */}
          <div className="flex-1 min-h-0 flex flex-col border-r border-[#162033] bg-[#070b14]">
            {/* Inspector Tab Bar */}
            <div className="px-6 py-2 bg-[#090f1d] border-b border-[#162033] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setInspectorTab('intelligence_layer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    inspectorTab === 'intelligence_layer'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Layer 2: Intelligence Layer ({currentTemplate?.fieldMappings.length || 0} Blanks)
                </button>

                <button
                  type="button"
                  onClick={() => setInspectorTab('visual_master')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    inspectorTab === 'visual_master'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Layer 1: Visual Master (Immutable)
                </button>

                <button
                  type="button"
                  onClick={() => setInspectorTab('population_export')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    inspectorTab === 'population_export'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Output & Form Population
                </button>

                <button
                  type="button"
                  onClick={() => setInspectorTab('automated_tests')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    inspectorTab === 'automated_tests'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Section VII Tests {testSummary ? `(${testSummary.passed}/${testSummary.total} Pass)` : ''}
                </button>

                <button
                  type="button"
                  onClick={() => setInspectorTab('audit_trail')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    inspectorTab === 'audit_trail'
                      ? 'bg-slate-700 text-slate-200 border border-slate-600'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Audit Trail
                </button>

                <button
                  type="button"
                  onClick={() => setInspectorTab('engine_flowchart')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inspectorTab === 'engine_flowchart'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-amber-400/80 hover:text-amber-300'
                  }`}
                >
                  <Workflow className="w-3.5 h-3.5" />
                  <span>Automation Flowchart</span>
                </button>
              </div>

              {qaReport && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-extrabold uppercase ${
                  qaReport.passed
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/50'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-500/50'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>QA Sentinel: {qaReport.passed ? 'Certified' : 'Halted'}</span>
                </div>
              )}
            </div>

            {/* Inspector Tab Content Panes */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              
              {/* TAB 1: INTELLIGENCE LAYER (Mapped Blanks & Facts) */}
              {inspectorTab === 'intelligence_layer' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-[#0a1120] p-3 rounded-xl border border-[#18233a]">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-200">
                        Machine-Readable Coordinate Field Overlays
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Mapped to exact page coordinates (X, Y, Width, Height) without altering underlying typography or reflowing text.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-teal-500/15 text-teal-300 px-2 py-1 rounded border border-teal-500/30">
                        Confidence Threshold: 0.85
                      </span>
                    </div>
                  </div>

                  {(!currentTemplate || currentTemplate.fieldMappings.length === 0) ? (
                    <div className="text-center py-16 text-slate-500 font-mono text-xs space-y-2">
                      <FileText className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
                      <div>No active document loaded in the intelligence layer.</div>
                      <div>Click "Run Synthetic Demo" or "Upload Document" to execute the pipeline.</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentTemplate.fieldMappings.map((mapping, idx) => {
                        const extracted = pipelineState?.extractedValues?.find(e => e.canonicalName === mapping.canonicalName);
                        const isReview = extracted?.requiresReview;
                        const decision = reviewDecisions[mapping.mappingId];

                        return (
                          <div
                            key={mapping.mappingId}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isReview && !decision
                                ? 'bg-amber-950/20 border-amber-500/50'
                                : 'bg-[#09101e] border-[#1a263d]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold uppercase">
                                  {mapping.canonicalName}
                                </span>
                                <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
                                  {mapping.sourceLabel}
                                </div>
                              </div>

                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                mapping.confidence > 0.9 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {Math.round(mapping.confidence * 100)}% Conf
                              </span>
                            </div>

                            {/* Coordinates & Geometry Details */}
                            <div className="grid grid-cols-4 gap-1 p-1.5 bg-[#050811] rounded-lg text-[9.5px] font-mono text-slate-400 border border-white/5 mb-2">
                              <div>Page: <span className="text-slate-200">{mapping.pageNumber}</span></div>
                              <div>X: <span className="text-slate-200">{mapping.bounds.x}pt</span></div>
                              <div>Y: <span className="text-slate-200">{mapping.bounds.y}pt</span></div>
                              <div>W×H: <span className="text-slate-200">{mapping.bounds.width}×{mapping.bounds.height}</span></div>
                            </div>

                            {/* Extracted value or empty blank state */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 font-mono text-[10px]">Populated Fact:</span>
                              <span className="font-semibold text-slate-200 font-mono">
                                {extracted?.value ? String(extracted.value) : <span className="text-slate-500 italic">[Blank field]</span>}
                              </span>
                            </div>

                            {/* Rule 5: Human Review Action if Ambiguous */}
                            {isReview && !decision && (
                              <div className="mt-2.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between gap-2">
                                <span className="text-[10px] text-amber-200 font-sans flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                  Requires Human Approval
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setReviewDecisions(prev => ({ ...prev, [mapping.mappingId]: 'approved' }))}
                                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setReviewDecisions(prev => ({ ...prev, [mapping.mappingId]: 'rejected' }))}
                                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[9px] font-bold cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            )}

                            {decision && (
                              <div className="mt-2 text-[9px] font-mono text-emerald-400">
                                Review Decision: {decision.toUpperCase()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: VISUAL MASTER (Immutable Visual Layer) */}
              {inspectorTab === 'visual_master' && (
                <div className="space-y-4">
                  <div className="bg-[#09101f] p-4 rounded-xl border border-[#1a263d] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold text-slate-200">
                          Immutable Visual Master (Layer 1)
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                        Byte-For-Byte Preserved
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      Per the Master Rules, the system will never rewrite, reflow, convert to HTML, or reconstruct the underlying PDF. The visual master retains page count, fonts, margins, tables, and borders without alteration.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                      <div className="p-2.5 bg-[#050913] rounded-lg border border-white/5 font-mono text-xs">
                        <span className="text-slate-500 block text-[10px]">DOCUMENT ID</span>
                        <span className="text-slate-300 font-bold truncate block">
                          {currentTemplate?.documentId || 'N/A'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#050913] rounded-lg border border-white/5 font-mono text-xs">
                        <span className="text-slate-500 block text-[10px]">PAGE DIMENSIONS</span>
                        <span className="text-slate-300 font-bold block">
                          {currentTemplate?.geometry.pages[0]?.widthPoints || 612} × {currentTemplate?.geometry.pages[0]?.heightPoints || 792} pt
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#050913] rounded-lg border border-white/5 font-mono text-xs">
                        <span className="text-slate-500 block text-[10px]">PAGE COUNT</span>
                        <span className="text-slate-300 font-bold block">
                          {currentTemplate?.geometry.pageCount || 1} Page
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#050913] rounded-lg border border-white/5 font-mono text-xs">
                        <span className="text-slate-500 block text-[10px]">SOURCE SHA-256</span>
                        <span className="text-slate-300 font-bold block truncate" title={currentTemplate?.sourceSha256}>
                          {currentTemplate?.sourceSha256 ? `${currentTemplate.sourceSha256.substring(0, 16)}...` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Simulation Canvas */}
                  <div className="p-8 bg-[#03060c] rounded-xl border border-[#151f33] text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]">
                    <div className="w-[306px] h-[396px] bg-white text-slate-900 rounded shadow-2xl p-4 text-left font-serif text-[7.5px] leading-tight relative overflow-hidden border border-slate-300 select-text">
                      <div className="text-center font-bold uppercase border-b border-black pb-1 mb-2 font-sans text-[8.5px]">
                        Superior Court of California, County of Orange
                      </div>
                      <div className="border border-black p-1 mb-2">
                        <div><strong>ATTORNEY:</strong> Lead Counsel, SBN 309821</div>
                        <div><strong>ATTORNEY FOR:</strong> Petitioner Eleanor Vance</div>
                      </div>
                      <div className="border border-black p-1 mb-2">
                        <div><strong>PETITIONER:</strong> Eleanor Vance</div>
                        <div><strong>RESPONDENT:</strong> Jonathan Vance</div>
                        <div><strong>CASE NUMBER:</strong> 24FL-009412</div>
                      </div>
                      <div className="p-1 text-justify">
                        REQUEST FOR ORDER: Petitioner hereby requests standard evidentiary custody and support orders under the California Family Code.
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between border-t border-black pt-1">
                        <span>Date: September 24, 2026</span>
                        <span>Signature: Eleanor Vance</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      High-Fidelity Visual Master Preview • MediaBox [0, 0, 612, 792]
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 3: POPULATION & EXPORT */}
              {inspectorTab === 'population_export' && (
                <div className="space-y-4">
                  <div className="bg-[#091122] p-4 rounded-xl border border-[#1a2842] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-200">
                        Populated Court-Ready Deliverables
                      </div>
                      <div className="text-xs text-slate-400">
                        Populated using approved client & matter facts while preserving original document layout byte-for-byte.
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        {populatedResult?.populatedFieldCount || 0} Fields Populated
                      </span>
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        {populatedResult?.blankFieldCount || 0} Left Blank
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* PDF Export Card */}
                    <div className="p-4 bg-[#0a101d] rounded-xl border border-[#1b263b] space-y-3">
                      <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                        <FileText className="w-4 h-4" />
                        <span>Populated PDF</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Full rendered court PDF with precision coordinate overlays applied.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (populatedResult?.pdfBytes) {
                            const blob = new Blob([populatedResult.pdfBytes], { type: 'application/pdf' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Populated_${currentTemplate?.templateName || 'Form'}.pdf`;
                            a.click();
                          }
                        }}
                        className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                    </div>

                    {/* XFDF / FDF Export Card */}
                    <div className="p-4 bg-[#0a101d] rounded-xl border border-[#1b263b] space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                        <Code2 className="w-4 h-4" />
                        <span>XFDF & FDF Data</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        XML Forms Data Format overlay compatible with Adobe Acrobat and Court Clerks.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (populatedResult?.xfdfContent) {
                            const blob = new Blob([populatedResult.xfdfContent], { type: 'application/vnd.adobe.xfdf' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Form_${currentTemplate?.templateName || 'Data'}.xfdf`;
                            a.click();
                          }
                        }}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download XFDF</span>
                      </button>
                    </div>

                    {/* JSON Field Map Card */}
                    <div className="p-4 bg-[#0a101d] rounded-xl border border-[#1b263b] space-y-3">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                        <Database className="w-4 h-4" />
                        <span>JSON Field Ontology</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Normalized canonical field definitions for cross-form integration.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const jsonStr = JSON.stringify(populatedResult?.dataJson || {}, null, 2);
                          const blob = new Blob([jsonStr], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'field_map.json';
                          a.click();
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download JSON</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SECTION VII AUTOMATED TEST MATRIX */}
              {inspectorTab === 'automated_tests' && (
                <div className="space-y-4">
                  <div className="bg-[#0c101e] p-4 rounded-xl border border-[#1a253d] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-200">
                        Section VII Automated Verification Matrix (Tests 1 through 8)
                      </div>
                      <div className="text-xs text-slate-400">
                        Validates fillable PDF, flat coordinate overlays, OCR, missing data, Rule 5 no-guessing, structural guards, and versioning.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunTests}
                      disabled={isRunningTests}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                      <span>{isRunningTests ? 'Executing...' : 'Re-Run All 8 Tests'}</span>
                    </button>
                  </div>

                  {!testResults ? (
                    <div className="text-center py-12 text-slate-500 font-mono text-xs space-y-2">
                      <div>Click "Run Automated Tests" to execute the complete verification suite.</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {testResults.map((t) => (
                        <div
                          key={t.testId}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            t.passed
                              ? 'bg-emerald-950/20 border-emerald-500/30'
                              : 'bg-rose-950/30 border-rose-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                t.passed ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                              }`}>
                                {t.passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                              </span>
                              <span className="text-xs font-bold text-slate-200">
                                {t.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-400">
                                {t.durationMs}ms
                              </span>
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                t.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {t.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </div>
                          </div>

                          {/* Assertions */}
                          <div className="space-y-1 pl-7">
                            {t.assertions.map((a, i) => (
                              <div key={i} className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                <span>• {a.name}</span>
                                <span className={a.passed ? 'text-emerald-400' : 'text-rose-400'}>
                                  {a.passed ? 'PASS' : `FAIL (Got: ${String(a.actual)})`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: AUDIT TRAIL */}
              {inspectorTab === 'audit_trail' && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 mb-2">
                    Section VIII Cryptographic Audit & Processing History
                  </div>
                  {(!pipelineState?.auditTrail || pipelineState.auditTrail.length === 0) ? (
                    <div className="text-center py-12 text-slate-500 font-mono text-xs">
                      No audit events recorded yet for this session.
                    </div>
                  ) : (
                    pipelineState.auditTrail.map((event, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-[#080d1a] rounded-lg border border-[#162136] flex items-center justify-between text-left font-mono text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded font-bold">
                              Step {event.step}
                            </span>
                            <span className="font-bold text-slate-200">
                              {event.agentName}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              ({event.operation})
                            </span>
                          </div>
                          {event.notes && (
                            <div className="text-[10.5px] text-slate-400 pl-8">
                              {event.notes}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                            event.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {event.status}
                          </span>
                          <div className="text-[9px] text-slate-500 mt-1">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: DOCUMENT AUTOMATION ENGINE FLOWCHART */}
              {inspectorTab === 'engine_flowchart' && (
                <PhoenixEngineFlowchart
                  onSelectStep={(step) => {
                    const mappedAgent = agents.find(a => a.index === step);
                    if (mappedAgent) setSelectedAgent(mappedAgent);
                  }}
                  onLaunchExecutiveHandOff={() => {
                    setExecutiveDispatcher('phoenix');
                    setShowExecutiveModal(true);
                  }}
                />
              )}
            </div>
          </div>

          {/* Right Sidebar: Selected Agent Directive & Interactive Chat */}
          <div className="w-full md:w-80 lg:w-96 min-h-0 flex flex-col bg-[#070b13] border-t md:border-t-0 shrink-0">
            {selectedAgent ? (
              <div className="flex-1 min-h-0 flex flex-col">
                {/* Agent Header */}
                <div className="p-4 bg-[#090f1d] border-b border-[#18243b]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                      Agent {selectedAgent.index} Inspector
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedAgent(null)}
                      className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {selectedAgent.name}
                  </h3>
                  <div className="text-xs text-teal-400 font-mono mt-0.5">
                    {selectedAgent.title}
                  </div>
                </div>

                {/* Directive & Permissions Box */}
                <div className="p-3 bg-[#0a1122] border-b border-[#18243b] space-y-2 text-left">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">
                      Active Directive
                    </span>
                    <p className="text-xs text-slate-300 font-sans mt-0.5 leading-snug">
                      "{selectedAgent.directive}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono pt-1">
                    <div>
                      <span className="text-slate-500 block">WRITE:</span>
                      <span className="text-teal-300 truncate block">
                        {selectedAgent.permissionPolicy.write.join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">FORBIDDEN:</span>
                      <span className="text-rose-400 truncate block">
                        {selectedAgent.permissionPolicy.forbidden.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Chat History */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                  {agentChatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl text-xs max-w-[90%] leading-relaxed ${
                        msg.sender === 'user'
                          ? 'ml-auto bg-teal-600 text-white'
                          : msg.sender === 'system'
                          ? 'mr-auto bg-[#0a1120] text-slate-400 border border-white/5 font-mono text-[10px]'
                          : 'mr-auto bg-[#0f172a] text-slate-200 border border-[#1e293b]'
                      }`}
                    >
                      <div className="text-[8.5px] font-mono opacity-60 mb-0.5 uppercase">
                        {msg.sender === 'user' ? 'Counsel' : msg.sender === 'agent' ? selectedAgent.name : 'System'}
                      </div>
                      <div>{msg.content}</div>
                    </div>
                  ))}
                </div>

                {/* Chat Input Bar */}
                <div className="p-3 bg-[#090f1d] border-t border-[#18243b] flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendChatMessage();
                    }}
                    placeholder={`Ask ${selectedAgent.name.split(':')[0]}...`}
                    className="flex-1 bg-[#050811] border border-[#1b2742] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleSendChatMessage}
                    disabled={isChatSending || !chatInput.trim()}
                    className="p-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-600" />
                <div className="text-xs font-bold text-slate-400">Agent Dialogue Standby</div>
                <div className="text-[11px] font-sans max-w-[200px]">
                  Click on any of the 8 agents in the top pipeline to inspect its directives and chat with it directly.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Executive Hand-Off Modal (Phoenix & EVE) */}
      <ExecutivePipelineHandOffModal
        isOpen={showExecutiveModal}
        onClose={() => setShowExecutiveModal(false)}
        onDispatchComplete={handleExecutiveDispatchComplete}
        initialDispatcher={executiveDispatcher}
      />

      {/* 8-Agent Interactive Dialogue Pop-up Modal */}
      <EightAgentsDialogueModal
        isOpen={showDialogueModal}
        onClose={() => setShowDialogueModal(false)}
        initialAgentId={dialogueModalAgentId}
        onOpenExecutiveHandOff={(dispatcher) => {
          setExecutiveDispatcher(dispatcher);
          setShowExecutiveModal(true);
        }}
      />
    </div>
  );
}
