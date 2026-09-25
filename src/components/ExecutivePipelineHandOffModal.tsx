/**
 * LEVEL 23 / PHOENIX 23
 * EXECUTIVE PIPELINE HAND-OFF MODAL
 * 
 * Enables Phoenix (Lead Legal Strategist) and EVE (Director of Operations)
 * to hand documents to the 8-Agent Pipeline and issue authoritative directives.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  Send,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { executivePipelineBridge, ExecutiveDispatchResult } from '../services/phoenixEngine/ExecutivePipelineBridge';

interface ExecutivePipelineHandOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDispatchComplete: (result: ExecutiveDispatchResult) => void;
  initialDispatcher?: 'phoenix' | 'eve';
  initialDocumentName?: string;
  initialFile?: File | null;
  initialClientName?: string;
  initialCaseNumber?: string;
  initialFileContent?: string;
}

export function ExecutivePipelineHandOffModal({
  isOpen,
  onClose,
  onDispatchComplete,
  initialDispatcher = 'phoenix',
  initialDocumentName,
  initialFile,
  initialClientName,
  initialCaseNumber,
  initialFileContent
}: ExecutivePipelineHandOffModalProps) {
  const [dispatcher, setDispatcher] = useState<'phoenix' | 'eve'>(initialDispatcher);
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile || null);
  const [documentName, setDocumentName] = useState<string>(
    initialDocumentName || (initialDispatcher === 'phoenix' ? 'Superior_Court_FL300_Petition.pdf' : 'Client_Intake_Dossier_Christopher_Guinto.txt')
  );
  const [clientName, setClientName] = useState<string>(initialClientName || 'Christopher Guinto');
  const [caseNumber, setCaseNumber] = useState<string>(initialCaseNumber || '26FL008921');
  const [courtCounty, setCourtCounty] = useState<string>('Orange County Superior Court');
  const [fileContentText, setFileContentText] = useState<string>(initialFileContent || '');

  React.useEffect(() => {
    if (isOpen) {
      if (initialDispatcher) setDispatcher(initialDispatcher);
      if (initialDocumentName) setDocumentName(initialDocumentName);
      if (initialFile) setSelectedFile(initialFile);
      if (initialClientName) setClientName(initialClientName);
      if (initialCaseNumber) setCaseNumber(initialCaseNumber);
      if (initialFileContent) setFileContentText(initialFileContent);
    }
  }, [isOpen, initialDispatcher, initialDocumentName, initialFile, initialClientName, initialCaseNumber, initialFileContent]);

  // Directives
  const [directiveTitle, setDirectiveTitle] = useState<string>(
    initialDispatcher === 'phoenix'
      ? 'Litigation Master Directive: Exact Coordinate Pleading Mapping'
      : 'Executive Intake Directive: Full Dossier & Fact Matrix Ingestion'
  );
  const [generalInstructions, setGeneralInstructions] = useState<string>(
    initialDispatcher === 'phoenix'
      ? 'Preserve underlying court pleading geometry byte-for-byte. Extract petitioner/respondent designations, relief requests, and case numbers. Do not guess on contested facts; flag all ambiguities for counsel review.'
      : 'Process incoming client documentation into structured intake records. Extract verified identity, contact parameters, children dates of birth, marriage/separation statistical facts, and jurisdictional residency.'
  );
  const [caseStrategy, setCaseStrategy] = useState<string>(
    initialDispatcher === 'phoenix'
      ? 'Prepare court-admissible California Judicial Council pleading overlay. Ensure all signature blocks, court captions, and checkbox matrices retain exact millimeter alignment.'
      : 'Consolidate raw client documents into reusable template forms. Cross-check extracted names against conflict checks and database rosters.'
  );

  // Per-Agent Directives
  const [isAgentDirectivesExpanded, setIsAgentDirectivesExpanded] = useState<boolean>(false);
  const [agentDirectives, setAgentDirectives] = useState<Record<string, string>>({
    agent_1_ingestion: 'Ingest immutable visual master; calculate and vault SHA-256 fingerprint.',
    agent_2_analysis: 'Analyze structural bounding boxes, AcroForm fields, and blank lines without altering source.',
    agent_3_extraction: 'Extract key litigation parties, case number, filing dates; apply Rule 5 No-Guess review policy.',
    agent_4_database: 'Relate facts to Client and Matter ledger under canonical legal field ontology.',
    agent_5_template_builder: 'Generate precision coordinate-based overlays. Zero HTML conversion or reflow permitted.',
    agent_6_delivery: 'Generate deterministic populated PDF, Adobe XFDF, and JSON field map outputs.',
    agent_7_integration: 'Stage completed files in designated Google Drive folder "phoenix_review".',
    agent_8_qa_sentinel: 'Perform independent verification of page geometry, hashes, and boundary containment.'
  });

  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Switch dispatcher and load corresponding defaults
  const handleSelectDispatcher = (newDispatcher: 'phoenix' | 'eve') => {
    setDispatcher(newDispatcher);
    if (newDispatcher === 'phoenix') {
      const p = executivePipelineBridge.getPhoenixDefaultDirectives({ clientName, caseNumber });
      setDirectiveTitle(p.directiveTitle);
      setGeneralInstructions(p.generalInstructions);
      setCaseStrategy(p.caseStrategy || '');
      setAgentDirectives(p.customAgentDirectives || {});
      setDocumentName('Superior_Court_FL300_Petition.pdf');
    } else {
      const e = executivePipelineBridge.getEveDefaultDirectives({ clientName, caseNumber });
      setDirectiveTitle(e.directiveTitle);
      setGeneralInstructions(e.generalInstructions);
      setCaseStrategy(e.caseStrategy || '');
      setAgentDirectives(e.customAgentDirectives || {});
      setDocumentName('Client_Intake_Dossier_Vance.pdf');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDocumentName(file.name);
    }
  };

  const handleExecuteDispatch = async () => {
    setIsDispatching(true);
    setDispatchError(null);

    try {
      let bytes: Uint8Array | undefined;
      if (selectedFile) {
        const buf = await selectedFile.arrayBuffer();
        bytes = new Uint8Array(buf);
      } else if (fileContentText) {
        bytes = new TextEncoder().encode(fileContentText);
      }

      const result = await executivePipelineBridge.dispatchDocument({
        dispatcher,
        documentName,
        documentBytes: bytes,
        directiveTitle,
        generalInstructions,
        caseStrategy,
        clientName,
        caseNumber,
        courtCounty,
        customAgentDirectives: agentDirectives
      });

      setIsDispatching(false);
      onDispatchComplete(result);
      onClose();
    } catch (err: any) {
      console.error('Dispatch failed:', err);
      setDispatchError(err.message || 'Failed to dispatch document to 8-agent pipeline.');
      setIsDispatching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-3xl bg-[#090f1d] border-2 border-[#1e2f4f] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#070b16] border-b border-[#18263f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-teal-500/20 border border-amber-500/40 text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Executive Pipeline Hand-Off
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Phoenix 23 Directive Protocol
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Phoenix & EVE issue commanding directives to the 8-agent document pipeline.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-left text-xs font-sans">
          
          {/* Dispatcher Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              1. Select Executive Dispatcher
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Phoenix */}
              <div
                onClick={() => handleSelectDispatcher('phoenix')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                  dispatcher === 'phoenix'
                    ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-[#0c1426] border-[#18263f] hover:border-slate-600'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Phoenix</span>
                    <span className="text-[9px] px-1 bg-amber-500/30 text-amber-300 rounded font-mono">#1 SENIORITY</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Managing Partner & Lead Strategist
                  </div>
                  <div className="text-[9px] text-amber-300 font-mono mt-0.5">
                    Focus: Pleading Geometry & Strict Overlays
                  </div>
                </div>
              </div>

              {/* EVE */}
              <div
                onClick={() => handleSelectDispatcher('eve')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                  dispatcher === 'eve'
                    ? 'bg-teal-950/40 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.2)]'
                    : 'bg-[#0c1426] border-[#18263f] hover:border-slate-600'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>EVE</span>
                    <span className="text-[9px] px-1 bg-teal-500/30 text-teal-300 rounded font-mono">OPERATIONS</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Director of Legal Operations & Intake Lead
                  </div>
                  <div className="text-[9px] text-teal-300 font-mono mt-0.5">
                    Focus: 16-Point Intake Matrix & Relational DB
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Document to Hand-Off */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              2. Document to Hand-Off to Pipeline
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="flex-1 bg-[#050811] border border-[#1a2944] rounded-xl px-3 py-2 text-xs text-white font-mono"
                placeholder="Filename..."
              />
              <label className="px-3.5 py-2 bg-[#0e192e] hover:bg-[#15233e] border border-teal-500/40 hover:border-teal-400 text-teal-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>{selectedFile ? 'Change File' : 'Upload File'}</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            {selectedFile && (
              <div className="text-[10.5px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Loaded file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Matter / Case Parameters */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              3. Client & Matter Case Association
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-mono">Client Name</span>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full mt-1 bg-[#050811] border border-[#1a2944] rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono">Case Number</span>
                <input
                  type="text"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full mt-1 bg-[#050811] border border-[#1a2944] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono">Court Jurisdiction</span>
                <input
                  type="text"
                  value={courtCounty}
                  onChange={(e) => setCourtCounty(e.target.value)}
                  className="w-full mt-1 bg-[#050811] border border-[#1a2944] rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Directives Section */}
          <div className="space-y-3 p-4 bg-[#060b17] rounded-xl border border-[#16233c]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                4. Authoritative Directives from {dispatcher === 'phoenix' ? 'Phoenix' : 'EVE'}
              </span>
              <button
                type="button"
                onClick={() => setIsAgentDirectivesExpanded(!isAgentDirectivesExpanded)}
                className="text-[10px] font-mono text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
              >
                <span>{isAgentDirectivesExpanded ? 'Collapse Agent Orders' : 'Customize Orders for All 8 Agents'}</span>
                {isAgentDirectivesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-mono">Directive Title</span>
              <input
                type="text"
                value={directiveTitle}
                onChange={(e) => setDirectiveTitle(e.target.value)}
                className="w-full bg-[#03060c] border border-[#1a2944] rounded-xl px-3 py-1.5 text-xs text-white font-semibold"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono">General Pipeline Instructions</span>
              <textarea
                rows={2}
                value={generalInstructions}
                onChange={(e) => setGeneralInstructions(e.target.value)}
                className="w-full bg-[#03060c] border border-[#1a2944] rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none font-sans"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono">Case Strategy Directive</span>
              <textarea
                rows={2}
                value={caseStrategy}
                onChange={(e) => setCaseStrategy(e.target.value)}
                className="w-full bg-[#03060c] border border-[#1a2944] rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none font-sans"
              />
            </div>

            {/* Expandable Per-Agent Directives */}
            {isAgentDirectivesExpanded && (
              <div className="pt-3 border-t border-white/5 space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
                  Per-Agent Directives Breakdown
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px]">
                  {[
                    { id: 'agent_1_ingestion', name: 'Agent 1: Ingestion' },
                    { id: 'agent_2_analysis', name: 'Agent 2: Analysis' },
                    { id: 'agent_3_extraction', name: 'Agent 3: Extraction' },
                    { id: 'agent_4_database', name: 'Agent 4: Database' },
                    { id: 'agent_5_template_builder', name: 'Agent 5: Template Builder' },
                    { id: 'agent_6_delivery', name: 'Agent 6: Delivery' },
                    { id: 'agent_7_integration', name: 'Agent 7: Integration' },
                    { id: 'agent_8_qa_sentinel', name: 'Agent 8: QA Sentinel' }
                  ].map((ag) => (
                    <div key={ag.id} className="p-2 bg-[#02050c] rounded-lg border border-white/5 space-y-1">
                      <div className="font-mono font-bold text-teal-300 text-[10px]">{ag.name}</div>
                      <input
                        type="text"
                        value={agentDirectives[ag.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAgentDirectives(prev => ({ ...prev, [ag.id]: val }));
                        }}
                        className="w-full bg-[#050a14] border border-[#16233d] rounded px-2 py-1 text-[10px] text-slate-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {dispatchError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{dispatchError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#070b16] border-t border-[#18263f] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-mono text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteDispatch}
            disabled={isDispatching}
            className={`px-5 py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 ${
              dispatcher === 'phoenix'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20'
                : 'bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 shadow-teal-500/20'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isDispatching ? 'animate-spin' : ''}`} />
            <span>
              {isDispatching
                ? 'Dispatching Across 8 Agents...'
                : `Dispatch Document & Issue Directives (${dispatcher === 'phoenix' ? 'Phoenix' : 'EVE'})`}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
