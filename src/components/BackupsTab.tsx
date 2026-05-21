import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Server,
  CloudLightning,
  RefreshCw,
  Copy,
  FolderSync,
  FileCheck,
  ShieldCheck,
  UserCheck,
  FileText
} from 'lucide-react';
import { Client, Matter, GeneratedDocument, LegalMessage, AgentProgress, ConsultationSession } from '../types';

interface BackupsTabProps {
  clients: Client[];
  matters: Matter[];
  generatedDocs: GeneratedDocument[];
  chatThread: LegalMessage[];
  agentProgressList: AgentProgress[];
  consultations: ConsultationSession[];
  
  onRestoreState: (state: ImportedState) => void;
}

export interface ImportedState {
  clients: Client[];
  matters: Matter[];
  generatedDocs: GeneratedDocument[];
  chatThread: LegalMessage[];
  agentProgressList: AgentProgress[];
  consultations: ConsultationSession[];
}

export default function BackupsTab({
  clients,
  matters,
  generatedDocs,
  chatThread,
  agentProgressList,
  consultations,
  onRestoreState
}: BackupsTabProps) {
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Conflicts mapping state
  const [pendingImportState, setPendingImportState] = useState<ImportedState | null>(null);
  const [conflictsList, setConflictsList] = useState<{
    id: string;
    type: 'client' | 'matter';
    name: string;
    localVal: any;
    importedVal: any;
  }[]>([]);

  // Creates download package JSON file
  const handleExportState = () => {
    const backupState: ImportedState = {
      clients,
      matters,
      generatedDocs,
      chatThread,
      agentProgressList,
      consultations
    };
    const blob = new Blob([JSON.stringify(backupState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level23-workspace-cloud-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleCopyClipboardText = () => {
    const backupState: ImportedState = {
      clients,
      matters,
      generatedDocs,
      chatThread,
      agentProgressList,
      consultations
    };
    navigator.clipboard.writeText(JSON.stringify(backupState, null, 2));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  // Inspect uploaded JSON state and triage files
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawText = event.target?.result as string;
        const importedObj = JSON.parse(rawText) as ImportedState;

        if (!importedObj.clients || !importedObj.matters) {
          setImportError('File structure format mismatched. Missing clients or matters logs.');
          return;
        }

        // Check for conflicts: Compare incoming clients & matters with existing keys
        const conflicts: any[] = [];

        importedObj.clients.forEach(importedClient => {
          const localMatch = clients.find(c => c.id === importedClient.id || c.name.toLowerCase() === importedClient.name.toLowerCase());
          if (localMatch && (localMatch.name !== importedClient.name || localMatch.intakeNotes !== importedClient.intakeNotes)) {
            conflicts.push({
              id: importedClient.id,
              type: 'client',
              name: importedClient.name,
              localVal: localMatch,
              importedVal: importedClient
            });
          }
        });

        importedObj.matters.forEach(importedMatter => {
          const localMatch = matters.find(m => m.id === importedMatter.id || m.caseNumber === importedMatter.caseNumber);
          if (localMatch && (localMatch.title !== importedMatter.title || localMatch.description !== importedMatter.description)) {
            conflicts.push({
              id: importedMatter.id,
              type: 'matter',
              name: importedMatter.title,
              localVal: localMatch,
              importedVal: importedMatter
            });
          }
        });

        if (conflicts.length > 0) {
          // Store the state so we can process conflicts
          setPendingImportState(importedObj);
          setConflictsList(conflicts);
        } else {
          // No conflicts: Immediately apply the state!
          onRestoreState(importedObj);
          setImportSuccess(true);
        }

      } catch (err) {
        setImportError('Parser compilation failed. Verify file is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Resolve an individual conflict
  const handleResolveConflict = (conflictId: string, choice: 'keep-local' | 'apply-imported') => {
    if (!pendingImportState) return;

    const updatedClients = [...pendingImportState.clients];
    const updatedMatters = [...pendingImportState.matters];

    const currentConflict = conflictsList.find(c => c.id === conflictId);
    if (!currentConflict) return;

    if (choice === 'keep-local') {
      if (currentConflict.type === 'client') {
        const idx = updatedClients.findIndex(c => c.id === conflictId);
        if (idx !== -1) {
          // Substitute with the local value in the importing bundle
          updatedClients[idx] = currentConflict.localVal;
        }
      } else {
        const idx = updatedMatters.findIndex(m => m.id === conflictId);
        if (idx !== -1) {
          updatedMatters[idx] = currentConflict.localVal;
        }
      }
    }

    // Filter resolved conflict from UI
    const nextConflicts = conflictsList.filter(c => c.id !== conflictId);
    setConflictsList(nextConflicts);

    // Update state bundle
    const nextState: ImportedState = {
      ...pendingImportState,
      clients: updatedClients,
      matters: updatedMatters
    };
    setPendingImportState(nextState);

    // If all conflicts resolved, restore state and finalize!
    if (nextConflicts.length === 0) {
      onRestoreState(nextState);
      setPendingImportState(null);
      setImportSuccess(true);
    }
  };

  return (
    <div id="backups-tab" className="space-y-6">
      
      {/* Tab Header bar */}
      <div className="p-5 bg-[#0e1626] border border-[#1e293b] rounded-2.5xl flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
            <FolderSync className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading text-white">Workspace Cloud Mirroring</h2>
            <p className="text-xs text-slate-400">Save complete case history to localized JSON models or synchronize backups securely</p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-3 py-1.5 border border-[#1e293b] rounded-xl flex items-center gap-1.5">
          <CloudLightning className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
          Offline-First Backup
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Export Column */}
        <div className="p-6 bg-[#0e1626] border border-[#1e293b] rounded-2.5xl space-y-4 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-teal-400" />
            1. Package Cloud Storage File
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Consolidate all client listings, active timelines, chat session memories, progressive AI personality statuses, and Jitsi room schedules. Download as a standardized cloud document.
          </p>

          {/* Directory Footprint Metrics */}
          <div className="grid grid-cols-2 gap-2 bg-[#090d16] p-4 rounded-xl border border-slate-800/80 font-mono text-[10px]">
            <div className="space-y-1">
              <span className="text-slate-500 uppercase block">Clients Registered</span>
              <span className="text-white text-xs">{clients.length} profiles</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 uppercase block">Matters Opened</span>
              <span className="text-white text-xs">{matters.length} court records</span>
            </div>
            <div className="space-y-1 pt-2 border-t border-[#1e293b]/55">
              <span className="text-slate-500 uppercase block">Drafts Compiled</span>
              <span className="text-white text-xs">{generatedDocs.length} files</span>
            </div>
            <div className="space-y-1 pt-2 border-t border-[#1e293b]/55">
              <span className="text-slate-500 uppercase block">AI Chats Synced</span>
              <span className="text-white text-xs">{chatThread.length} logs</span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={handleExportState}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 text-[#090d16] font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              Download Backup File
            </button>
            <button
              onClick={handleCopyClipboardText}
              className="px-4 py-2.5 bg-[#090d16] hover:bg-slate-900 border border-[#1e293b] text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-teal-400" />
              <span>{copiedBackup ? 'Copied to Clipboard!' : 'Copy raw JSON'}</span>
            </button>
          </div>
        </div>

        {/* Import & Sync Column */}
        <div className="p-6 bg-[#0e1626] border border-[#1e293b] rounded-2.5xl space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              2. Synchronize Cloud Backup File
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Choose or upload any valid Level 23 JSON file. The system will index it, and if any overlapping records or conflicts exist, it will boot the **Secure Conflict Sandbox** to let you manually resolve data collisions.
            </p>

            <div className="pt-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleJsonUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-[#1e293b] hover:border-emerald-500/40 hover:bg-emerald-500/5 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs transition-colors cursor-pointer gap-1.5"
              >
                <Upload className="w-6 h-6 text-emerald-400 animate-bounce" />
                <span>Upload `.json` State Ledger</span>
                <span className="text-[10px] text-slate-600">Max size 24MB</span>
              </button>
            </div>
          </div>

          <div className="mt-4">
            {importError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />
                <span>{importError}</span>
              </div>
            )}
            {importSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                <span>Cloud State Synced successfully. All folders, profiles, and Jitsi logs finalized!</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Conflict sandbox UI */}
      <AnimatePresence>
        {pendingImportState && conflictsList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-6 bg-[#0c1221] border border-orange-500/35 rounded-2.5xl space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-[#1e293b]">
              <AlertTriangle className="w-6 h-6 text-orange-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-white">Active Conflict Sandbox Detected</h3>
                <p className="text-xs text-slate-400">Please choose which record variables to retain to prevent data overlap confusion.</p>
              </div>
              <span className="ml-auto text-xs font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded">
                {conflictsList.length} unresolved collisions
              </span>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {conflictsList.map((conflict) => (
                <div key={conflict.id} className="p-4.5 bg-[#090d16] rounded-2xl border border-[#1e293b] space-y-3 font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono font-bold uppercase rounded px-2 py-0.5">
                      {conflict.type}
                    </span>
                    <h4 className="text-xs font-bold text-white block">Conflict at: {conflict.name}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Local Option */}
                    <div className="p-3.5 bg-[#0f172a] rounded-xl border border-teal-500/20 space-y-2 relative">
                      <span className="absolute top-2 right-2 text-[8px] uppercase font-mono font-bold py-0.5 px-1.5 bg-teal-500/10 text-teal-400 rounded">
                        Active Local
                      </span>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">System values</span>
                        <div className="text-slate-300 text-xs whitespace-pre-wrap truncate max-h-[80px]">
                          {conflict.type === 'client' 
                            ? `Email: ${conflict.localVal.email}\nNotes: ${conflict.localVal.intakeNotes}`
                            : `Case: ${conflict.localVal.caseNumber}\nDesc: ${conflict.localVal.description}`
                          }
                        </div>
                      </div>
                      <button
                        onClick={() => handleResolveConflict(conflict.id, 'keep-local')}
                        className="w-full mt-2.5 py-1.5 bg-slate-900 hover:bg-[#1e293b] text-teal-400 text-[10px] uppercase font-mono font-bold rounded-lg border border-teal-500/15 cursor-pointer leading-none"
                      >
                        Keep Local Version
                      </button>
                    </div>

                    {/* Mismatch Imported Option */}
                    <div className="p-3.5 bg-[#0f172a] rounded-xl border border-orange-500/20 space-y-2 relative">
                      <span className="absolute top-2 right-2 text-[8px] uppercase font-mono font-bold py-0.5 px-1.5 bg-orange-500/10 text-orange-400 rounded">
                        Incoming Import
                      </span>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Incoming Import values</span>
                        <div className="text-slate-300 text-xs whitespace-pre-wrap truncate max-h-[80px]">
                          {conflict.type === 'client' 
                            ? `Email: ${conflict.importedVal.email}\nNotes: ${conflict.importedVal.intakeNotes}`
                            : `Case: ${conflict.importedVal.caseNumber}\nDesc: ${conflict.importedVal.description}`
                          }
                        </div>
                      </div>
                      <button
                        onClick={() => handleResolveConflict(conflict.id, 'apply-imported')}
                        className="w-full mt-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[10px] uppercase font-mono font-bold rounded-lg border border-orange-500/15 cursor-pointer leading-none"
                      >
                        Overwrite with Imported
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
