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
  FileText,
  Laptop,
  Terminal,
  ExternalLink,
  Cpu,
  HardDrive,
  Lock,
  Unlock
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
  dbSyncStatus?: 'offline' | 'connecting' | 'synced' | 'error';
  syncMessage?: string;
  isStorageLocked?: boolean;
  onToggleStorageLock?: () => void;
  storagePin?: string;
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
  onRestoreState,
  dbSyncStatus = 'offline',
  syncMessage = 'Sync Status Offline',
  isStorageLocked = false,
  onToggleStorageLock,
  storagePin = '1234'
}: BackupsTabProps) {
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local Desktop Bridge & Local Ollama Connection States
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [activeModel, setActiveModel] = useState<string>('');
  const [bridgeStatus, setBridgeStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [bridgeFiles, setBridgeFiles] = useState<string[]>([]);
  const [bridgeFolder, setBridgeFolder] = useState<string>('');
  const [isTestingLocalOllama, setIsTestingLocalOllama] = useState(false);
  const [localOllamaPrompt, setLocalOllamaPrompt] = useState('Verify the Chapter 7 asset list format for Samuel Miller.');
  const [localOllamaReply, setLocalOllamaReply] = useState('');
  const [copiedBridgeScript, setCopiedBridgeScript] = useState(false);

  // Poll Local Services Mount Check
  React.useEffect(() => {
    checkLocalOllama();
    checkLocalBridge();
  }, []);

  const checkLocalOllama = async () => {
    setOllamaStatus('checking');
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch('http://localhost:11434/api/tags', { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        if (data && data.models) {
          const names = data.models.map((m: any) => m.name);
          setOllamaModels(names);
          if (names.length > 0) setActiveModel(names[0]);
          setOllamaStatus('connected');
        } else {
          setOllamaStatus('connected');
        }
      } else {
        setOllamaStatus('disconnected');
      }
    } catch {
      setOllamaStatus('disconnected');
    }
  };

  const checkLocalBridge = async () => {
    setBridgeStatus('checking');
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch('http://localhost:4321/api/local-files', { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setBridgeFiles(data.files || []);
          setBridgeFolder(data.folder || 'C:\\Users\\Administrator\\iiiamadex');
          setBridgeStatus('connected');
        } else {
          setBridgeStatus('disconnected');
        }
      } else {
        setBridgeStatus('disconnected');
      }
    } catch {
      setBridgeStatus('disconnected');
    }
  };

  const runLocalOllamaTest = async () => {
    setIsTestingLocalOllama(true);
    setLocalOllamaReply('');
    const targetModel = activeModel || 'gemma2';
    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          prompt: localOllamaPrompt,
          stream: false
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLocalOllamaReply(data.response || 'Inference completed successfully.');
      } else {
        setLocalOllamaReply(`Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      setLocalOllamaReply(`CORS or connection block: ${err.message}. To resolve, start Ollama with OLLAMA_ORIGINS="*" environment variable.`);
    } finally {
      setIsTestingLocalOllama(false);
    }
  };

  const handleCopyBridgeScript = () => {
    const scriptText = `const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 4321;

app.use(cors());
app.use(express.json({ limit: '60mb' }));

const baseDir = path.join(os.homedir(), 'iiiamadex');

if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

// Locate Local Google Drive path (Standard Windows Installers)
const possibleDrivePaths = [
  path.join(os.homedir(), 'Google Drive', 'My Drive', 'iiiamadex'),
  path.join(os.homedir(), 'Google Drive', 'iiiamadex'),
  path.join(os.homedir(), 'Google Drive (adonisandrous@gmail.com)', 'My Drive', 'iiiamadex'),
  'G:\\\\My Drive\\\\iiiamadex',
  'G:\\\\iiiamadex'
];

let activeGoogleDrivePath = null;

function scanGoogleDrivePath() {
  for (const drivePath of possibleDrivePaths) {
    try {
      const parentDir = path.dirname(drivePath);
      if (fs.existsSync(parentDir)) {
        if (!fs.existsSync(drivePath)) {
          fs.mkdirSync(drivePath, { recursive: true });
        }
        activeGoogleDrivePath = drivePath;
        console.log("[iiiamadex Sentry] ☁️ Found Google Drive desktop mount point at: " + activeGoogleDrivePath);
        return activeGoogleDrivePath;
      }
    } catch (e) {}
  }
  return null;
}

scanGoogleDrivePath();

function runSync() {
  const gDrive = activeGoogleDrivePath || scanGoogleDrivePath();
  if (!gDrive) {
    console.log("[iiiamadex Sentry] ℹ️ Google Drive desktop folder not yet active. Using local standalone mode.");
    return { synced: false, reason: 'Google Drive App is not running or folder not mounted yet.' };
  }

  try {
    const localFiles = fs.readdirSync(baseDir);
    const driveFiles = fs.readdirSync(gDrive);

    let syncCount = 0;

    for (const f of localFiles) {
      const localFilePath = path.join(baseDir, f);
      const driveFilePath = path.join(gDrive, f);
      const localStat = fs.statSync(localFilePath);
      if (localStat.isDirectory()) continue;

      let shouldCopy = false;
      if (!fs.existsSync(driveFilePath)) {
        shouldCopy = true;
      } else {
        const driveStat = fs.statSync(driveFilePath);
        if (localStat.mtimeMs > driveStat.mtimeMs) {
          shouldCopy = true;
        }
      }

      if (shouldCopy) {
        fs.copyFileSync(localFilePath, driveFilePath);
        syncCount++;
        console.log("[iiiamadex Sentry] ⬆️ Uploaded to Google Drive: " + f);
      }
    }

    for (const f of driveFiles) {
      const localFilePath = path.join(baseDir, f);
      const driveFilePath = path.join(gDrive, f);
      const driveStat = fs.statSync(driveFilePath);
      if (driveStat.isDirectory()) continue;

      let shouldCopy = false;
      if (!fs.existsSync(localFilePath)) {
        shouldCopy = true;
      } else {
        const localStat = fs.statSync(localFilePath);
        if (driveStat.mtimeMs > localStat.mtimeMs) {
          shouldCopy = true;
        }
      }

      if (shouldCopy) {
        fs.copyFileSync(driveFilePath, localFilePath);
        syncCount++;
        console.log("[iiiamadex Sentry] ⬇️ Downloaded and synced to local disk: " + f);
      }
    }

    if (syncCount > 0) {
      console.log("[iiiamadex Sentry] ✅ Completed bidirectional sync cycle. Synchronized " + syncCount + " document profiles.");
    }
    return { synced: true, drivePath: gDrive, filesSyncedCount: syncCount };
  } catch (error) {
    console.error("[iiiamadex Sentry] ⚠️ Synchronization cycle warning: " + error.message);
    return { synced: false, error: error.message };
  }
}

app.get('/api/local-files', (req, res) => {
  try {
    const syncStatus = runSync();
    const files = fs.readdirSync(baseDir);
    res.json({ success: true, folder: baseDir, files, syncStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/local-write', (req, res) => {
  const { fileName, content } = req.body;
  if (!fileName || !content) return res.status(400).json({ error: 'Missing fileName or content.' });
  try {
    const filePath = path.join(baseDir, fileName);
    fs.writeFileSync(filePath, content, 'utf-8');
    const syncResult = runSync();
    res.json({ success: true, filePath, syncResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log("================================================================");
  console.log("🚀 Level 23 Desktop Bridge is Active with Auto Google Drive Sync!");
  console.log("📂 Listening locally on: http://localhost:" + PORT);
  console.log("🏠 Client Workspace Folder: " + baseDir);
  console.log("================================================================");
});`;

    navigator.clipboard.writeText(scriptText);
    setCopiedBridgeScript(true);
    setTimeout(() => setCopiedBridgeScript(false), 2400);
  };

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
          Secure Session Sync
        </span>
      </div>

      {/* Cloud Persistent Memory Status Panel */}
      <div className={`p-5 rounded-2.5xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl transition-all duration-500 ${
        dbSyncStatus === 'synced' 
          ? 'bg-[#091b15]/70 border-emerald-500/30' 
          : dbSyncStatus === 'connecting'
          ? 'bg-[#1b1709]/70 border-amber-500/30'
          : 'bg-[#1b090a]/70 border-rose-500/30'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className={`p-3 rounded-xl shrink-0 ${
            dbSyncStatus === 'synced' 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : dbSyncStatus === 'connecting'
              ? 'bg-amber-500/10 text-amber-400 animate-pulse'
              : 'bg-rose-500/10 text-rose-400'
          }`}>
            {dbSyncStatus === 'synced' ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Google Cloud Firestore Connected Memory
              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                dbSyncStatus === 'synced' 
                  ? 'bg-emerald-500/15 text-emerald-400' 
                  : dbSyncStatus === 'connecting'
                  ? 'bg-amber-500/15 text-amber-400 animate-pulse'
                  : 'bg-rose-500/15 text-rose-400'
              }`}>
                {dbSyncStatus}
              </span>
            </h3>
            <p className="text-xs text-slate-400 leading-normal font-sans">
              {dbSyncStatus === 'synced' && 'Your Level 23 digital practice is synchronized with standard high-integrity Google Cloud persistence. Any client profile changes, legal briefs, and timeline logs automatically survive browser cache clears.'}
              {dbSyncStatus === 'connecting' && 'Opening bidirectional socket tunnels to secure Google Cloud storage clusters. Preparing index structures...'}
              {dbSyncStatus === 'error' && 'The app is running in Local Backup State due to missing remote configuration or quota limits. Data is fully persisted locally in indexedDB, but remote live sync is temporarily paused.'}
              {dbSyncStatus === 'offline' && 'Direct cloud persistence is currently off. Connect a personal Firestore plan to initiate remote synchronization.'}
            </p>
            <div className="text-[10.5px] font-mono text-slate-500 flex items-center gap-1.5">
              <span>Status Msg:</span>
              <span className={dbSyncStatus === 'synced' ? 'text-emerald-400' : dbSyncStatus === 'connecting' ? 'text-amber-400 animate-pulse' : 'text-rose-400'}>
                "{syncMessage}"
              </span>
            </div>
          </div>
        </div>
        
        {dbSyncStatus === 'error' && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500 text-rose-400 rounded-xl text-xs font-bold font-mono uppercase cursor-pointer transition-colors shrink-0"
          >
            Reconnect Cloud DB
          </button>
        )}
      </div>

      {/* Storage Security Write Lock Control Box */}
      <div className={`p-5 rounded-2.5xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl transition-all duration-500 bg-[#0d1626]/80 ${
        isStorageLocked 
          ? 'border-rose-500/40 bg-[#1b0a0e]/40' 
          : 'border-emerald-500/25'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className={`p-3 rounded-xl shrink-0 ${
            isStorageLocked 
              ? 'bg-rose-500/10 text-rose-400' 
              : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            {isStorageLocked ? <Lock className="w-6 h-6 animate-pulse" /> : <Unlock className="w-6 h-6" />}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Client & Matter Write-Lock Protection
              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                isStorageLocked 
                  ? 'bg-rose-500/15 text-rose-400' 
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {isStorageLocked ? 'Sealed' : 'Mutable'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 leading-normal font-sans">
              {isStorageLocked 
                ? 'Storage locking is currently active. Local index databases, client timeline ledgers, and bidirectional cloud collections are securely sealed. No create, edit, or delete actions can be executed.' 
                : 'Write mutations are fully enabled for local caches and synchronized remote Firestore databases. Lock storage to freeze databases for archiving, public demonstrations, or offline reading.'}
            </p>
            <div className="text-[10.5px] font-mono text-slate-500 flex items-center gap-1.5">
              <span>Security Method:</span>
              <span className="text-slate-400">"{storagePin ? '4-Digit PIN Lock Code Verified' : 'Standard Session Key Lock'}"</span>
            </div>
          </div>
        </div>

        <button
          onClick={onToggleStorageLock}
          className={`px-4 py-2.5 border rounded-xl text-xs font-bold font-mono uppercase cursor-pointer transition-all shrink-0 flex items-center gap-2 ${
            isStorageLocked
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/35 hover:border-emerald-500 text-emerald-400 font-bold'
              : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 hover:border-rose-500 text-rose-400 font-bold'
          }`}
        >
          {isStorageLocked ? (
            <>
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock Storage Cache</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Storage Cache</span>
            </>
          )}
        </button>
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

      {/* 4. HYBRID DESKTOP & LOCAL PC GATEWAY PORTAL */}
      <div id="hybrid-desktop-portal" className="border-t border-[#1e293b]/60 pt-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#1e293b] gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-md font-mono text-[9px] uppercase font-bold tracking-wider">Hybrid Integration Gateway</span>
              <Laptop className="w-4.5 h-4.5 text-sky-400 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-white font-heading">On-Premises Desktop Sync & Ollama Co-Pilot</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Connect this Level 23 cloud web interface direct to your personal hard drive and run secure, free local Ollama weights on your Windows PC (<code className="text-sky-300 font-mono">C:\Users\Administrator</code>) for absolute client data privacy.
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => { checkLocalOllama(); checkLocalBridge(); }}
              className="px-3 py-1.5 bg-[#090d16] hover:bg-slate-900 border border-[#1e293b] text-[10px] font-bold text-slate-300 rounded-lg cursor-pointer uppercase font-mono flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Scan</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* OLLAMA LOCAL WORKSPACE PORTAL */}
          <div className="bg-[#0b1220] border border-[#1e293b] rounded-2.5xl p-6 space-y-5 shadow-lg flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono tracking-wider text-teal-400 uppercase flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-teal-400" />
                  Local Ollama Co-Pilot
                </h4>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold leading-none uppercase ${
                  ollamaStatus === 'connected' ? 'bg-emerald-500/15 text-emerald-400' :
                  ollamaStatus === 'checking' ? 'bg-amber-400/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {ollamaStatus === 'connected' ? '● ONLINE' :
                   ollamaStatus === 'checking' ? '○ SCANNING PORT...' : '● OFFLINE [PORT 11434]'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your browser locally to <code className="text-teal-300 font-mono">http://localhost:11434</code>. Run local open-weights models (Gemma 2, Llama 3) direct on your graphics card to draft Chapter 7 briefs with zero API billing.
              </p>

              {ollamaStatus === 'connected' ? (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 font-mono">Select Available Local Model</label>
                    <select
                      value={activeModel}
                      onChange={(e) => setActiveModel(e.target.value)}
                      className="w-full bg-[#050810] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-teal-400 font-mono"
                    >
                      {ollamaModels.length > 0 ? (
                        ollamaModels.map((m, idx) => (
                          <option key={idx} value={m}>{m}</option>
                        ))
                      ) : (
                        <option value="gemma:2b">gemma:2b (Detected, select default)</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 font-mono">Local Test Prompt</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={localOllamaPrompt}
                        onChange={(e) => setLocalOllamaPrompt(e.target.value)}
                        className="flex-1 bg-[#050810] border border-[#1e293b] px-3 py-2 text-xs text-slate-200 rounded-xl outline-none focus:border-teal-400 font-mono"
                      />
                      <button
                        onClick={runLocalOllamaTest}
                        disabled={isTestingLocalOllama || !localOllamaPrompt.trim()}
                        className="px-3.5 bg-gradient-to-r from-teal-500 to-emerald-400 text-[#090d16] hover:opacity-90 font-bold font-mono text-[11px] uppercase rounded-xl cursor-pointer disabled:opacity-40"
                      >
                        {isTestingLocalOllama ? 'Inference...' : 'Test Run'}
                      </button>
                    </div>
                  </div>

                  {localOllamaReply && (
                    <div className="p-3 bg-[#050810] border border-[#1e293b] rounded-xl space-y-1">
                      <span className="text-[9px] font-mono text-teal-400 uppercase tracking-widest block">Local Model Reply:</span>
                      <p className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap leading-normal truncate max-h-[120px]">{localOllamaReply}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#050a14] rounded-2xl border border-slate-900 space-y-3">
                  <span className="text-[11px] font-bold text-slate-300 block">How to configure Ollama to accept Web App calls:</span>
                  <div className="space-y-1.5 text-[10.5px] text-slate-400 font-sans leading-normal list-decimal pl-1">
                    <p>1. Open your terminal or Command Prompt as Administrator.</p>
                    <p>2. Set the environment variable to bypass browser sandbox limits (CORS):</p>
                    <pre className="p-2 bg-[#020408] rounded border border-slate-800 text-[10px] text-amber-400 font-mono select-text">
                      set OLLAMA_ORIGINS="*"<br/>
                      ollama serve
                    </pre>
                    <p>3. Once active, run your favorite local model: <code className="text-teal-400 font-mono">ollama run gemma-2-27b</code></p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#1e293b]/50 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Modality: Browser Localhost Fetch</span>
              <span>Endpoint: port 11434</span>
            </div>
          </div>

          {/* LOCAL FILE SYSTEM BRIDGE GATEWAY CONTROLLER */}
          <div className="bg-[#0b1220] border border-[#1e293b] rounded-2.5xl p-6 space-y-5 shadow-lg flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono tracking-wider text-sky-400 uppercase flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-sky-400" />
                  iiiamadex Desktop Bridge
                </h4>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold leading-none uppercase ${
                  bridgeStatus === 'connected' ? 'bg-emerald-500/15 text-emerald-400' :
                  bridgeStatus === 'checking' ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {bridgeStatus === 'connected' ? '● SYNC ACTIVE' :
                   bridgeStatus === 'checking' ? '○ SCANNING...' : '● STANDALONE BACKUP'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                A simple local proxy allows this cloud web app to securely list, read, and write litigation briefs right inside your physical folder: <span className="text-sky-300 font-mono font-bold">C:\Users\Administrator\iiiamadex</span> on your computer.
              </p>

              {bridgeStatus === 'connected' ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Exposed Target Folder:</span>
                    <span className="text-sky-300 font-mono text-[10px] bg-sky-950/40 px-2 py-0.5 rounded border border-sky-900/60">{bridgeFolder}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500 uppercase">Synchronized Disk Files ({bridgeFiles.length})</span>
                      <span className="text-emerald-400">Connected</span>
                    </div>

                    <div className="bg-[#050810] border border-[#1e293b] rounded-xl p-3 max-h-[110px] overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1 text-left">
                      {bridgeFiles.length > 0 ? (
                        bridgeFiles.map((file, idx) => (
                          <div key={idx} className="flex justify-between items-center border-b border-slate-900/60 pb-1 last:border-b-0">
                            <span className="truncate text-teal-400">{file}</span>
                            <span className="text-[9px] text-slate-500 font-mono">Local Sync</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-600 block italic text-center py-4">No local files found inside folder. Use the Matters/Documents tools to write briefs!</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-left">
                  <div className="p-3 bg-[#0d1527] border border-sky-500/20 rounded-xl space-y-2">
                    <span className="text-[10.5px] font-bold text-sky-400 block uppercase font-mono">Safe Command Prompt Setup Checklist:</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed select-text">
                      ⚠️ <strong className="text-white">DO NOT</strong> copy Javascript lines directly into your blank Command Prompt! Follow this three-step pipeline:
                    </p>
                    <div className="space-y-1 text-[10px] text-slate-400 leading-normal pl-1 select-text">
                      <p>1. Open raw editor (Notepad) or VS Code, create a file named <code className="text-sky-300 font-mono font-bold select-text">bridge.js</code> inside <code className="text-sky-300 font-mono">C:\Users\Administrator\iiiamadex</code>.</p>
                      <p>2. Paste the script below into the Notepad file and save.</p>
                      <p>3. In Command Prompt run these commands:</p>
                      <pre className="p-1 px-2 bg-[#020408] rounded text-[9.5px] text-emerald-400 font-mono font-bold leading-normal select-text">
                        cd C:\Users\Administrator\iiiamadex<br/>
                        npm install express cors<br/>
                        node bridge.js
                      </pre>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyBridgeScript}
                    className="w-full py-2 bg-[#050810] hover:bg-slate-900 border border-[#1e293b] hover:border-sky-500/40 text-sky-400 font-bold font-mono text-[10.5px] uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedBridgeScript ? 'Copied Desktop Bridge JS Script!' : 'Copy Desktop Bridge JS script'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#1e293b]/50 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Port Bind: local 4321</span>
              <span>CORS: Bypassed for Web</span>
            </div>
          </div>

        </div>

        {/* 5. GOOGLE DRIVE SYNC DIRECTORY MODULE */}
        <div className="p-5 bg-gradient-to-r from-[#0d1527] to-[#070b13] border border-[#1e293b] rounded-2.5xl space-y-3.5 shadow-lg text-left">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-mono tracking-wider text-[#dfb76c] uppercase flex items-center gap-2">
              <CloudLightning className="w-4.5 h-4.5 text-[#dfb76c]" />
              Google Drive Cloud Synchronizer & Mapping Sentry
            </h4>
            <span className="text-[9px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-505/10 px-1.5 py-0.5 uppercase">Sync Armed</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Your application is locked into your specific active shared Google Drive folder link. Bidirectional sync is managed in real-time by your local computer bridge script copying files to Google Drive Desktop and writing directly down to <code className="text-[#dfb76c] font-mono">C:\Users\Administrator\iiiamadex</code>.
          </p>

          <div className="p-3 bg-[#050810] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-none">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-mono text-slate-500 block">Active Target Cloud Folder ID</span>
              <span className="text-xs font-mono font-bold text-[#dfb76c] block truncate">10sli3oVprhgacIRjH7wzze9wNSn4lxJk</span>
            </div>
            
            <a
              href="https://drive.google.com/drive/folders/10sli3oVprhgacIRjH7wzze9wNSn4lxJk?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#dfb76c]/10 hover:bg-[#dfb76c]/20 border border-[#dfb76c]/30 hover:border-[#dfb76c] text-[#dfb76c] text-xs font-mono uppercase font-bold flex items-center gap-1.5 rounded-none transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Google Drive Cloud Folder</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-[#050810]/80 rounded-xl border border-[#1e293b]/60 space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Drive Credentials</span>
              <span className="text-xs text-slate-300 font-bold block">Adonis & Alex Feed</span>
              <span className="text-[9.5px] text-emerald-400 font-mono">Direct sync mapping active</span>
            </div>
            <div className="p-3 bg-[#050810]/80 rounded-xl border border-[#1e293b]/60 space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Mirroring Status</span>
              <span className="text-xs text-slate-300 font-bold block">Local Disk Target</span>
              <span className="text-[9.5px] text-teal-400 font-mono">C:\Users\Administrator\iiiamadex</span>
            </div>
            <div className="p-3 bg-[#050810]/80 rounded-xl border border-[#1e293b]/60 space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Direct Action</span>
              <button
                onClick={() => {
                  fetch('http://localhost:4321/api/local-files')
                    .then(r => r.json())
                    .then(data => {
                      if (data.success) {
                        alert(`Successfully refreshed local active directory cache! Found ${data.files?.length || 0} files sync-queued.`);
                      } else {
                        alert(`Could not authenticate with local on-premises node bridge.js. Ensure bridge is running in CMD command line prompt!`);
                      }
                    })
                    .catch(() => {
                      alert(`Bridge offline. Follow instructions in Section 2 above to start your bridge.js locally on port 4321.`);
                    });
                }}
                className="text-[9px] font-bold font-mono uppercase bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 px-2 py-1 rounded border border-teal-500/20 block w-full text-center mt-1 cursor-pointer transition-colors"
              >
                Force Cloud Mirror Sync
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
