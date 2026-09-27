import React, { useState } from 'react';
import { 
  X, Sparkles, CheckCircle2, AlertCircle, FileText, Upload, 
  ArrowRight, ShieldCheck, Briefcase, Calendar, Users, 
  DollarSign, Check, RefreshCw
} from 'lucide-react';
import { Client, Matter, AgentExtractionResult } from '../types';

interface AssignExtractionTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients?: Client[];
  targetClient?: Client | null;
  preselectedClientId?: string;
  initialAgentId?: string;
  initialFile?: { name: string; content?: string } | null;
  onApplyExtraction: (result: AgentExtractionResult, targetClientId?: string) => void;
}

const AGENTS = [
  {
    id: 'eve',
    name: 'EVE',
    role: 'Office Manager & Intake Lead',
    badge: 'Primary Intake Lead',
    avatar: '👩‍💼',
    desc: 'Specialized in exhaustive client onboarding, contact particulars, statutory timelines, and file directory setup.',
    color: 'from-amber-500/20 to-amber-600/10 border-amber-500/40 text-amber-300'
  },
  {
    id: 'elena',
    name: 'Elena Vasquez',
    role: 'Bilingual Intake Specialist',
    badge: 'ES / EN Specialist',
    avatar: '👩‍⚖️',
    desc: 'Expert in bilingual Spanish/English intake documents, family background, and domestic relations.',
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40 text-emerald-300'
  },
  {
    id: 'sophia',
    name: 'Sophia Chen',
    role: 'Lead Litigation Paralegal',
    badge: 'Procedural Paralegal',
    avatar: '📑',
    desc: 'Specialized in court forms, statutory filing deadlines, community property schedules, and procedural tasks.',
    color: 'from-teal-500/20 to-teal-600/10 border-teal-500/40 text-teal-300'
  },
  {
    id: 'alex',
    name: 'Alex Mercer',
    role: 'Senior Managing Partner',
    badge: 'Executive Oversight',
    avatar: '⚖️',
    desc: 'Strategic review of high-exposure financial exposure, fee structures, and litigation postures.',
    color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/40 text-indigo-300'
  }
];

export const AssignExtractionTaskModal: React.FC<AssignExtractionTaskModalProps> = ({
  isOpen,
  onClose,
  clients = [],
  targetClient,
  preselectedClientId,
  initialAgentId,
  initialFile,
  onApplyExtraction
}) => {
  const initialAgentKey = initialAgentId ? (initialAgentId.includes('4') || initialAgentId.toLowerCase().includes('eve') ? 'eve' : initialAgentId.includes('1') ? 'sophia' : initialAgentId.includes('2') ? 'elena' : 'alex') : 'eve';
  const [selectedAgentId, setSelectedAgentId] = useState<string>(initialAgentKey);
  const activeClientId = preselectedClientId || (targetClient ? targetClient.id : (clients[0]?.id || ''));
  const [targetMode, setTargetMode] = useState<'existing' | 'new'>(preselectedClientId || targetClient ? 'existing' : 'new');
  const [selectedClientId, setSelectedClientId] = useState<string>(activeClientId);
  
  // Document source
  const [inputType, setInputType] = useState<'upload' | 'paste'>(initialFile?.content ? 'paste' : 'upload');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string; size: string } | null>(
    initialFile ? { name: initialFile.name, content: initialFile.content || '', size: 'Loaded' } : null
  );
  const [pastedText, setPastedText] = useState<string>(initialFile?.content || '');
  const [counselInstructions, setCounselInstructions] = useState<string>('');
  
  // Execution status
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionStep, setExecutionStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<AgentExtractionResult | null>(null);

  if (!isOpen) return null;

  const currentAgent = AGENTS.find(a => a.id === selectedAgentId) || AGENTS[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isBinary = file.name.endsWith('.pdf') || file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.doc') || file.name.endsWith('.docx');
    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;
      
      setUploadedFile({
        name: file.name,
        content: result,
        size: sizeStr
      });
      setErrorMsg(null);
    };

    if (isBinary) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleRunTask = async () => {
    const docText = inputType === 'paste' ? pastedText.trim() : (uploadedFile?.content || '');
    const docName = inputType === 'paste' ? 'Intake_Counsel_Notes.txt' : (uploadedFile?.name || 'Uploaded_Document.pdf');

    if (!docText && !uploadedFile) {
      setErrorMsg('Please upload a document or paste intake text for the AI Agent to process.');
      return;
    }

    setIsExecuting(true);
    setErrorMsg(null);
    setExecutionStep(1);

    // Step simulation timers for transparent visual progression
    const timer1 = setTimeout(() => setExecutionStep(2), 700);
    const timer2 = setTimeout(() => setExecutionStep(3), 1600);

    try {
      const response = await fetch('/api/agents/assign-extraction-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          fileName: docName,
          fileContent: uploadedFile?.content || '',
          documentText: inputType === 'paste' ? pastedText : '',
          targetClientId: targetMode === 'existing' ? selectedClientId : undefined,
          taskInstruction: counselInstructions.trim() || undefined,
          existingClients: clients
        })
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: AgentExtractionResult = await response.json();
      setExecutionStep(4);
      setExtractionResult(data);
    } catch (err: any) {
      console.error('Task execution failure:', err);
      setErrorMsg(err.message || 'An error occurred while executing the extraction task.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleApplyAndFinish = () => {
    if (!extractionResult) return;
    const effectiveClientId = targetMode === 'existing' ? selectedClientId : undefined;
    onApplyExtraction(extractionResult, effectiveClientId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="assign-extraction-task-modal-container"
        className="relative w-full max-w-4xl bg-[#0b1220] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-gradient-to-r from-[#0d1728] via-[#09101d] to-[#0d1728]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-sans font-bold text-white flex items-center gap-2">
                <span>Assign Task: AI Agent Client Extraction</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  Task Assignment Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Delegate document parsing & client file population directly to a specialized AI Agent
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!extractionResult ? (
            <>
              {/* 1. SELECT AI AGENT */}
              <div className="space-y-3">
                <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">1</span>
                  <span>Select AI Agent to Assign</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {AGENTS.map((agent) => {
                    const isSelected = selectedAgentId === agent.id;
                    return (
                      <div
                        key={agent.id}
                        id={`agent-card-${agent.id}`}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? `bg-[#131e33] border-amber-400 shadow-md ring-1 ring-amber-400/40`
                            : `bg-[#090e1a] border-slate-800 hover:border-slate-700 hover:bg-[#0f1728]`
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-2xl">{agent.avatar}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${agent.color}`}>
                            {agent.badge}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-white mb-0.5">{agent.name}</div>
                        <div className="text-[10px] font-mono text-teal-400 mb-1.5">{agent.role}</div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{agent.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. TARGET CLIENT FILE */}
              <div className="space-y-3">
                <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">2</span>
                  <span>Target Client File</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetMode('new')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                      targetMode === 'new'
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm'
                        : 'bg-[#090e1a] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    + Create Brand New Client Record
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('existing')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                      targetMode === 'existing'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-[#090e1a] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    📇 Place / Ingest into Existing Client File
                  </button>
                </div>

                {targetMode === 'existing' && (
                  <div className="p-3 bg-[#090e1a] border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[11px] text-slate-400 font-mono">Select Existing Client File:</span>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full bg-[#0d1627] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.practiceArea || 'General'}) — ID: {c.id}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 3. DOCUMENT / INTAKE INPUT */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">3</span>
                    <span>Document or Intake Source</span>
                  </label>
                  <div className="flex gap-1 bg-[#090e1a] p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setInputType('upload')}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition ${
                        inputType === 'upload'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputType('paste')}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition ${
                        inputType === 'paste'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Paste Notes / Text
                    </button>
                  </div>
                </div>

                {inputType === 'upload' ? (
                  <div className="relative border-2 border-dashed border-[#1e293b] hover:border-amber-500/50 bg-[#090e1a]/80 rounded-2xl p-6 text-center transition-all group">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.csv,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 mx-auto text-amber-400/80 mb-2 group-hover:scale-110 transition-transform" />
                    {uploadedFile ? (
                      <div className="space-y-1">
                        <p className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Selected: {uploadedFile.name} ({uploadedFile.size})</span>
                        </p>
                        <p className="text-[10px] text-slate-400">Click or drop another file to replace</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-sans font-medium text-slate-200">
                          Drop client intake, petition, court form, or contract here
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Supports PDF, DOCX, TXT, Scanned Forms & Images
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <textarea
                      rows={5}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste raw client interview notes, intake sheet transcription, or case facts here..."
                      className="w-full bg-[#090e1a] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 leading-relaxed"
                    />
                    <div className="text-[10px] text-slate-500 font-mono text-right">
                      {pastedText.length} characters
                    </div>
                  </div>
                )}
              </div>

              {/* 4. OPTIONAL COUNSEL DIRECTIVES */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Special Counsel Directives for {currentAgent.name} (Optional):</span>
                  <span className="text-[9px] text-slate-500">e.g. Focus on child custody, dates, Spanish translation</span>
                </label>
                <input
                  type="text"
                  value={counselInstructions}
                  onChange={(e) => setCounselInstructions(e.target.value)}
                  placeholder="e.g. Extract marriage and separation dates accurately; note UCCJEA child residences."
                  className="w-full bg-[#090e1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Execution status indicator if in progress */}
              {isExecuting && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-amber-300">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>{currentAgent.name} is executing the assigned extraction task...</span>
                    </span>
                    <span>Step {executionStep} of 4</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
                    <div className={executionStep >= 1 ? 'text-amber-300 font-bold' : 'text-slate-600'}>
                      ● [1/4] Ingesting and reading document structure...
                    </div>
                    <div className={executionStep >= 2 ? 'text-amber-300 font-bold' : 'text-slate-600'}>
                      ● [2/4] Extracting client identity, timeline dates, and family entities...
                    </div>
                    <div className={executionStep >= 3 ? 'text-amber-300 font-bold' : 'text-slate-600'}>
                      ● [3/4] Structuring 16 client dossier fields & statutory property schedule...
                    </div>
                    <div className={executionStep >= 4 ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                      ● [4/4] Generating litigation procedural tasks & file record...
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* EXTRACTION RESULT & PLACEMENT CONFIRMATION */
            <div className="space-y-5">
              {/* Task Completion Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0a171d] to-emerald-950/40 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-xs font-mono font-extrabold uppercase text-emerald-300">
                      Task Completed Successfully
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {extractionResult.taskAudit.extractedFieldsCount} Fields Extracted
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {extractionResult.taskAudit.summary}
                </p>
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-3 pt-1 border-t border-emerald-500/20">
                  <span>Assigned Agent: <b className="text-amber-300">{extractionResult.taskAudit.assignedAgent}</b></span>
                  <span>Task ID: <code className="text-teal-300">{extractionResult.taskAudit.taskId}</code></span>
                </div>
              </div>

              {/* Client Profile Summary Placed into File */}
              <div className="p-4 bg-[#090e1a] border border-slate-800 rounded-xl space-y-3">
                <div className="text-xs font-mono font-bold uppercase text-amber-300 flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Client Identity Placed into File</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {extractionResult.client.practiceArea}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Client Legal Name:</span>
                    <span className="text-white font-bold">{extractionResult.client.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Email Address:</span>
                    <span className="text-teal-300">{extractionResult.client.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Phone Number:</span>
                    <span className="text-slate-300">{extractionResult.client.phone}</span>
                  </div>
                </div>
              </div>

              {/* 16 Extracted Card Fields Grid */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dossier Fields Ready for Placement</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {Object.entries(extractionResult.extractedFields).map(([label, val]) => (
                    <div key={label} className="p-2.5 bg-[#080d17] border border-slate-800/80 rounded-lg text-xs font-mono space-y-0.5">
                      <div className="text-[10px] text-slate-400 font-semibold">{label}</div>
                      <div className="text-slate-200 font-medium break-words text-[11px]">{val || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Procedural Tasks for Matter */}
              {extractionResult.matter && extractionResult.matter.tasks && extractionResult.matter.tasks.length > 0 && (
                <div className="p-3 bg-[#090e1a] border border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs font-mono font-bold uppercase text-teal-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>Litigation Tasks Created for Matter ({extractionResult.matter.title})</span>
                  </div>
                  <div className="space-y-1.5">
                    {extractionResult.matter.tasks.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-mono p-2 bg-[#060a12] rounded border border-slate-800/60">
                        <span className="text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                          <span>{t.title}</span>
                        </span>
                        <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Due: {t.dueDate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e293b] bg-[#090e1a]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          {!extractionResult ? (
            <button
              type="button"
              id="btn-confirm-assign-task"
              onClick={handleRunTask}
              disabled={isExecuting}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-mono text-xs font-black uppercase rounded-xl transition flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{currentAgent.name} Working...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Assign Task to {currentAgent.name} →</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExtractionResult(null)}
                className="px-3 py-2 text-xs font-mono text-slate-400 hover:text-white"
              >
                Re-run Task
              </button>
              <button
                type="button"
                id="btn-apply-extraction-to-client"
                onClick={handleApplyAndFinish}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-mono text-xs font-black uppercase rounded-xl transition flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Place Information into Client File</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
