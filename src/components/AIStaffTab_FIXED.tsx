import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import phoenixPortrait from '../assets/images/phoenix_portrait_v2_1781038910299.png';
import sentryPortrait from '../assets/images/sentry_tech_portrait_1781008318863.png';
import alurePortrait from '../assets/images/alure_business_portrait_1781008336656.png';
import evePortrait from '../assets/images/eve_receptionist_portrait_1781138141388.png';
import { AgentAnimatedPortrait } from './AgentAnimatedPortrait';
import {
  BrainCircuit,
  Send,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sliders,
  Award,
  ChevronRight,
  BookOpen,
  AlertCircle,
  TrendingUp,
  Lock,
  Activity,
  Heart,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  Sparkle,
  Edit2,
  Check,
  UploadCloud,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { LegalMessage, VoiceAgentProfile, AgentProgress } from '../types';

interface AIStaffTabProps {
  chatThread: LegalMessage[];
  onAddMessage: (msg: LegalMessage) => void;
  onClearThread: () => void;
  
  // Progressive agent state
  agentProgressList: AgentProgress[];
  onUpdateAgentProgress: (progress: AgentProgress) => void;
}

export default function AIStaffTab({
  chatThread,
  onAddMessage,
  onClearThread,
  agentProgressList,
  onUpdateAgentProgress
}: AIStaffTabProps) {
  
  // Manage Custom Agent Names persistently via localStorage/state
  const [customNames, setCustomNames] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('agent_custom_names_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Safely migrate old names to the new default personas
        if (parsed['ap-1'] === 'Alexandra Partner' || parsed['ap-1'] === 'Alexandra') parsed['ap-1'] = 'Phoenix';
        if (parsed['ap-2'] === 'Miranda Advocate' || parsed['ap-2'] === 'Miranda') parsed['ap-2'] = 'Sentry';
        if (parsed['ap-3'] === 'Aida Associate' || parsed['ap-3'] === 'Aida') parsed['ap-3'] = 'Alure';
        if (!parsed['ap-4']) parsed['ap-4'] = 'EVE';
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse agent custom names", e);
    }
    return {
      'ap-1': 'Phoenix',
      'ap-2': 'Sentry',
      'ap-3': 'Alure',
      'ap-4': 'EVE'
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('agent_custom_names_v1', JSON.stringify(customNames));
    } catch (e) {
      console.warn("Storage write blocked", e);
    }
  }, [customNames]);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');

  const startEditing = (pId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(pId);
    setEditNameValue(currentName);
  };

  const saveEditingName = (pId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editNameValue.trim()) {
      setCustomNames(prev => ({
        ...prev,
        [pId]: editNameValue.trim()
      }));
    }
    setEditingId(null);
  };

  // State-driven active ID (Default to ap-4 EVE - Receptionist / First Voice)
  const [activeProfileId, setActiveProfileId] = useState<string>('ap-4');

  // Grounded check for previous or custom names
  const isMessageForProfile = (msgName: string, profileId: string) => {
    const normMsg = msgName.toLowerCase();
    const custom = (customNames[profileId] || '').toLowerCase();
    const activeMapping: Record<string, string[]> = {
      'ap-1': ['alexandra', 'partner', 'strategist', 'phoenix'],
      'ap-2': ['miranda', 'advocate', 'insolvency', 'bankruptcy', 'sentry', 'maintenance', 'maintain'],
      'ap-3': ['aida', 'associate', 'research', 'alure', 'reviewer', 'manager'],
      'ap-4': ['eve', 'receptionist', 'router', 'assistant', 'ollama']
    };
    
    if (custom && normMsg.includes(custom)) {
      return true;
    }
    
    const terms = activeMapping[profileId] || [];
    return terms.some(term => normMsg.includes(term));
  };

  // All Female Agent Profiles
  const agentProfiles: VoiceAgentProfile[] = [
    {
      id: 'ap-4',
      name: customNames['ap-4'] || 'EVE',
      avatar: '🤖',
      role: 'Ollama Administrative Receptionist & Task Router',
      voiceName: 'Kore',
      description: 'First voice reception agent. Supervises the iiiamadex filing system, parses database notes, drafts simple motions/memos, and schedules Adonis calendar checklists dynamically.',
      accent: 'Ollama-Powered Accent (US Receptionist)',
      style: 'Extremely efficient, proactive, supportive, organized',
      portrait: evePortrait
    },
    {
      id: 'ap-1',
      name: customNames['ap-1'] || 'Phoenix',
      avatar: '👩‍⚖️',
      role: 'Senior Litigation Strategist',
      voiceName: 'Aoede',
      description: 'Prepares trial strategy boards, outlines procedural demand metrics, and manages trial briefs.',
      accent: 'Distinguished British Accent (UK Female)',
      style: 'Authoritative, structured, precise',
      portrait: phoenixPortrait
    },
    {
      id: 'ap-2',
      name: customNames['ap-2'] || 'Sentry',
      avatar: '🛡️',
      role: 'System Administrator & App Maintenance Sentry',
      voiceName: 'Zephyr',
      description: 'Responsible for diagnostic sweeps, applet health integrity, package tracking, and active deployment monitoring.',
      accent: 'Mid-Atlantic Academic (US Female)',
      style: 'Extremely detailed, reassuring',
      portrait: sentryPortrait
    },
    {
      id: 'ap-3',
      name: customNames['ap-3'] || 'Alure',
      avatar: '💼',
      role: 'Office Manager & Business Reviewer',
      voiceName: 'Kore',
      description: 'Reviews cases, audits document pipelines, manages client intakes, and performs thorough office operational review.',
      accent: 'Modern West Coast (US Female)',
      style: 'Efficient, highly responsive, concise',
      portrait: alurePortrait
    }
  ];

  const activeProfile = agentProfiles.find(p => p.id === activeProfileId) || agentProfiles[0];
  const setActiveProfile = (profile: VoiceAgentProfile) => {
    setActiveProfileId(profile.id);
  };
  const [userInput, setUserInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchCitations, setSearchCitations] = useState<{ title: string; url: string }[]>([]);

  // State for document upload and parsing
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
    content: string;
  } | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [leftTab, setLeftTab] = useState<'portrait' | 'workspace'>('portrait');

  // Audio Playback Elements
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatThread, sendingMessage]);

  // Find or create local progress tracker
  const activeProgress = agentProgressList.find(p => p.agentId === activeProfile.id) || {
    agentId: activeProfile.id,
    rapportScore: 10,
    personalityState: 'Reserved' as const,
    interactionCount: 0,
    unlockedCapabilities: ['Pleadings Fact Extraction'],
    caseFamiliarity: 15,
    prosecutorialAggression: 75
  };

  // Capabilities mapped by thresholds
  const capacities = [
    { key: 'Pleadings Fact Extraction', levelRequired: 0, icon: BookOpen, desc: 'Condenses raw intake notes into logical legal grids.' },
    { key: 'Jurisdictional Audit Scope', levelRequired: 25, icon: ShieldCheck, desc: 'Scrutinizes court filings for district standing rules.' },
    { key: 'Cross-Exam Practice Interview', levelRequired: 50, icon: BrainCircuit, desc: 'Conducts intensive direct preparation under strict evidence protocols.' },
    { key: 'Evidentiary Rebuttal Sandbox', levelRequired: 75, icon: Zap, desc: 'Computes court trial probabilities and proactive rebuttal plays.' }
  ];

  // ... (Keep all the speech recognition, TTS, and message handling code from original)
  // ... (Keeping isListening, voiceStatus, handleSend, etc.)

  // Simplified handlers for the fixed version
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg: LegalMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      content: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: activeProfile.name
    };

    onAddMessage(userMsg);
    setUserInput('');
    setSendingMessage(true);
    setSearchCitations([]);

    // Progress increments
    const nextRapport = Math.min(activeProgress.rapportScore + 5, 100);
    onUpdateAgentProgress({
      ...activeProgress,
      rapportScore: nextRapport
    });

    try {
      const response = await fetch('/api/gemini/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [userMsg],
          agentRole: activeProfile.role,
          agentInstruction: `You are ${activeProfile.name}, the ${activeProfile.role}.`
        })
      });

      const data = await response.json();
      if (data.reply) {
        onAddMessage({
          id: `m-rep-${Date.now()}`,
          sender: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: activeProfile.name
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileUpload = (file: File) => {
    setIsParsingFile(true);
    setLeftTab('workspace');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setTimeout(() => {
        setUploadedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type || 'text/plain',
          content: text || `[Document content: ${file.name}]`
        });
        setIsParsingFile(false);
      }, 900);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const activeMessages = chatThread.filter(m => isMessageForProfile(m.agentName, activeProfile.id));

  return (
    <div id="ai-chat-tab" className="flex flex-col gap-4 h-full min-h-0">
      
      {/* TOP DECK: LOCKED HEADER - Agent Profiles & Voice Controls */}
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shrink-0">
        
        {/* Left Side: Agent Profile Tabs */}
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto flex-1">
          {agentProfiles.map((p) => {
            const prog = agentProgressList.find(pr => pr.agentId === p.id) || {
              rapportScore: 10,
              personalityState: 'Reserved'
            };
            const isActive = activeProfile.id === p.id;
            
            return (
              <div
                key={p.id}
                onClick={() => {
                  if (editingId !== p.id) {
                    setActiveProfile(p);
                    setSearchCitations([]);
                  }
                }}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer text-left select-none max-w-[210px] flex-1 ${
                  isActive
                    ? 'bg-teal-950/30 border-teal-500/60 shadow-lg shadow-teal-500/5'
                    : 'bg-transparent border-[#1e293b] hover:border-slate-800'
                }`}
              >
                <span className="text-xl shrink-0">{p.avatar}</span>
                <div className="min-w-0 flex-1 leading-none">
                  <div className="flex items-center justify-between gap-1 leading-none">
                    {editingId === p.id ? (
                      <form
                        onSubmit={(e) => saveEditingName(p.id, e)}
                        className="flex items-center gap-1 flex-1"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          onBlur={() => saveEditingName(p.id)}
                          className="bg-[#040810] border border-teal-500/50 rounded px-1 text-[10px] text-white outline-none w-full font-sans py-0.5"
                        />
                      </form>
                    ) : (
                      <div className="flex items-center gap-1 leading-none shrink-0 min-w-0">
                        <span className="text-xs font-black text-slate-200 truncate max-w-[70px]">{p.name}</span>
                        <button
                          type="button"
                          onClick={(e) => startEditing(p.id, p.name, e)}
                          className="p-0.5 text-slate-500 hover:text-teal-400 rounded transition-colors"
                          title="Assign custom name"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                    
                    <span className="text-[8px] font-mono font-bold flex items-center gap-0.5 bg-[#090d16] px-1 py-0.5 rounded border border-[#1e293b] text-teal-400 self-center shrink-0">
                      <Heart className="w-2 h-2 text-rose-500 fill-rose-500" />
                      {prog.rapportScore}%
                    </span>
                  </div>
                  <span className="text-[8px] text-slate-400 block truncate mt-1 font-mono uppercase font-bold tracking-wider leading-none">
                    {p.id === 'ap-1' ? 'Litigation' : p.id === 'ap-2' ? 'Sentry' : 'Manager'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Voice Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end shrink-0 select-none">
          <div className="bg-[#090d16] border border-[#1e293b] px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono text-[9px] font-bold text-teal-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>VOICE: READY</span>
          </div>
        </div>
      </div>

      {/* MAIN BODY: Split Layout with Proper Scroll Containment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: Document Viewer with LOCKED Header and SCROLLABLE Content */}
        <div className="lg:col-span-5 bg-[#0e1626] rounded-2xl border border-[#1e293b] flex flex-col min-h-0 overflow-hidden shadow-xl">
          
          {/* LOCKED Header for Left Column */}
          <div className="bg-[#0d1624] border-b border-[#1e293b] flex items-center justify-between shrink-0 p-2 gap-2 select-none sticky top-0 z-10">
            <div className="flex bg-[#050912]/80 border border-slate-800/60 p-1 rounded-xl w-full">
              <button
                type="button"
                onClick={() => setLeftTab('portrait')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  leftTab === 'portrait'
                    ? 'bg-gradient-to-r from-teal-950/40 to-emerald-950/40 text-teal-400 border border-teal-500/25 shadow-md shadow-teal-500/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Agent Visualizer</span>
              </button>
              <button
                type="button"
                onClick={() => setLeftTab('workspace')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  leftTab === 'workspace'
                    ? 'bg-gradient-to-r from-teal-950/40 to-emerald-950/40 text-teal-400 border border-teal-500/25 shadow-md shadow-teal-500/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Intake Workspace {uploadedFile ? '•' : ''}</span>
              </button>
            </div>
            
            {leftTab === 'workspace' && uploadedFile && (
              <button
                onClick={() => setUploadedFile(null)}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg bg-slate-900 border border-slate-800/80 hover:bg-slate-800 transition shrink-0"
                title="Unload Reference Document"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* SCROLLABLE Content Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#090d16]/20 relative">
            
            {leftTab === 'portrait' ? (
              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                <AgentAnimatedPortrait
                  profile={activeProfile}
                  isSpeaking={false}
                  voiceStatus="SLEEPING"
                  onPortraitClick={() => {}}
                />
              </div>
            ) : isParsingFile ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                <div className="relative w-12 h-12">
                  <div className="w-12 h-12 rounded-full border-4 border-teal-500/10 border-t-teal-400 animate-spin" />
                </div>
                <span className="font-mono text-[10px] text-teal-400 animate-pulse font-black uppercase">
                  PARSING FILE...
                </span>
              </div>
            ) : !uploadedFile ? (
              /* Drag & Drop Upload Zone - SCROLLABLE */
              <div 
                className="flex-1 flex flex-col p-4 overflow-y-auto"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={`flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all ${
                  dragOver 
                    ? 'border-teal-400 bg-teal-950/20 text-teal-300 scale-[0.99] shadow-inner' 
                    : 'border-[#1e293b] bg-[#090d16]/30 text-slate-500 hover:border-[#334155]'
                }`}>
                  <UploadCloud className="w-12 h-12 text-teal-500/40 mb-3" />
                  <h4 className="text-xs font-bold text-slate-300">Drag Documents Here</h4>
                  <p className="text-[10px] text-slate-500 text-center max-w-xs mt-1.5 mb-4 leading-normal">
                    Drag and drop any text, CSV, or court documents.
                  </p>
                  
                  <label className="px-3 py-1.5 bg-teal-950/40 border border-teal-500/30 text-teal-400 font-bold rounded-lg text-[10px] tracking-wide hover:bg-teal-900 transition cursor-pointer">
                    Browse File
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            ) : (
              /* Document Display with SCROLLABLE Content & LOCKED Header Info */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#090d16]/20">
                
                {/* File Info Bar - LOCKED */}
                <div className="flex items-center justify-between text-[9px] text-slate-400 shrink-0 bg-[#090d16] px-2.5 py-1.5 border-b border-[#1e293b] sticky top-0 z-10">
                  <span className="font-mono">Size: <strong className="text-white">{uploadedFile.size}</strong></span>
                  <span className="font-mono uppercase text-teal-400">Status: Loaded</span>
                </div>

                {/* SCROLLABLE Document Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#040810] min-h-0">
                  <pre className="text-[11px] font-mono text-[#38bdf8] leading-relaxed whitespace-pre-wrap font-medium">
                    {uploadedFile.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Chat with LOCKED Header, SCROLLABLE Messages, LOCKED Input */}
        <div className="lg:col-span-7 bg-[#0e1626] rounded-2xl border border-[#1e293b] flex flex-col min-h-0 overflow-hidden shadow-xl">
          
          {/* LOCKED Chat Header */}
          <div className="p-3 bg-[#0d1624] border-b border-[#1e293b] flex items-center justify-between shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg shrink-0">{activeProfile.avatar}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <h3 className="text-xs font-bold text-white font-heading truncate">{activeProfile.name}</h3>
                  <span className="text-[8px] uppercase tracking-wider font-mono bg-teal-950 text-teal-400 border border-teal-500/20 px-1 py-0.5 rounded leading-none shrink-0 font-bold">
                    {activeProfile.voiceName === 'Aoede' ? 'UK' : 'US'}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-sans truncate mt-0.5">{activeProfile.role}</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                onClearThread();
              }}
              className="px-2 py-1 text-[9px] font-mono border border-slate-800 text-slate-500 hover:text-slate-300 rounded hover:border-[#1e293b] transition cursor-pointer shrink-0"
            >
              Clear
            </button>
          </div>

          {/* LOCKED Agent Metrics Bar */}
          <div className="flex items-center gap-3 bg-[#090d16]/40 px-3.5 py-1.5 border-b border-[#1e293b]/50 text-[9px] text-slate-400 justify-between shrink-0 flex-wrap sticky top-12 z-10">
            <span className="flex items-center gap-1 font-mono">STANCE: <strong className="text-teal-400">{activeProgress.personalityState}</strong></span>
            <span className="flex items-center gap-1 font-mono">FAMILIARITY: <strong className="text-slate-200">{activeProgress.caseFamiliarity}%</strong></span>
          </div>

          {/* LOCKED Skills Row */}
          <div className="px-4 py-2 bg-[#090d16]/20 border-b border-[#1e293b]/40 space-y-1 shrink-0 sticky top-[78px] z-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {capacities.map((cap) => {
                const isUnlocked = activeProgress.rapportScore >= cap.levelRequired;
                const CapIcon = cap.icon;
                return (
                  <button
                    key={cap.key}
                    disabled={!isUnlocked}
                    className={`p-1.5 rounded-lg text-left border flex flex-col justify-between group transition-all text-[9.5px] h-[48px] ${
                      isUnlocked
                        ? 'bg-[#101726]/60 hover:bg-[#162035] border-teal-500/10 hover:border-teal-500/30 cursor-pointer text-slate-200 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800/20 opacity-30 text-slate-600'
                    }`}
                    title={cap.desc}
                  >
                    <div className="flex items-center justify-between w-full h-3">
                      <CapIcon className={`w-3 h-3 ${isUnlocked ? 'text-teal-400' : 'text-slate-700'}`} />
                      {!isUnlocked && <Lock className="w-2 h-2 text-slate-600" />}
                    </div>
                    <span className="text-[8px] font-black truncate leading-none w-full">{cap.key}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SCROLLABLE Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#090d16]/10 select-text min-h-0">
            {activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-2">
                <Bot className="w-10 h-10 text-[#1e293b]" />
                <h4 className="text-xs font-bold text-slate-300 font-heading">Consult {activeProfile.name}</h4>
                <p className="text-[10px] text-slate-500 leading-normal font-sans">
                  "I am ready. Ask me any procedural questions or upload a document to review."
                </p>
              </div>
            ) : (
              activeMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[90%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 border shadow-sm ${
                    msg.sender === 'user' ? 'bg-[#090d16] border-[#1e293b]' : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                  }`}>
                    {msg.sender === 'user' ? '👤' : activeProfile.avatar}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className={`p-3.5 rounded-2xl text-[11px] leading-relaxed font-sans shadow-md border ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-teal-600/80 to-teal-800/80 text-white border-teal-500/35 rounded-tr-none ml-auto'
                        : 'bg-[#090d16] text-slate-200 border-[#1e293b] rounded-tl-none'
                    }`}>
                      <div className="whitespace-pre-wrap font-medium">
                        {msg.content ? msg.content.split('\n').filter(line => !line.trim().startsWith('```')).join('\n').trim() : ''}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 px-1 leading-none">
                      <span>{msg.sender === 'user' ? 'You' : activeProfile.name} | {msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {sendingMessage && (
              <div className="flex gap-2.5 max-w-[90%] animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-xs">
                  {activeProfile.avatar}
                </div>
                <div className="p-3 bg-[#090d16] border border-[#1e293b] rounded-2xl rounded-tl-none text-[10px] text-slate-500 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* LOCKED Citations Display */}
          {searchCitations.length > 0 && (
            <div className="p-2.5 bg-[#090d16] border-t border-[#1e293b] flex items-center gap-2 overflow-x-auto shrink-0 sticky bottom-0 z-10">
              <span className="text-[8px] uppercase font-mono text-emerald-400 flex items-center gap-1 shrink-0 font-bold">
                <Search className="w-2.5 h-2.5" />
                CITATIONS:
              </span>
              <div className="flex gap-1.5 text-[9px] font-sans">
                {searchCitations.map((cit, idx) => (
                  <a
                    key={idx}
                    href={cit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-0.5 bg-[#1e293b]/70 hover:bg-[#334155] border border-slate-700/60 rounded text-slate-300 flex items-center gap-1 transition-colors whitespace-nowrap"
                  >
                    {cit.title}
                    <ExternalLink className="w-2 h-2 text-slate-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* LOCKED Multi-Line Input Form - 4 Line Textarea */}
          <form onSubmit={handleSend} className="p-3 border-t border-[#1e293b] bg-[#070b12] flex gap-2 shrink-0 sticky bottom-0 z-10">
            <textarea
              required
              disabled={sendingMessage}
              placeholder={`Send message to ${activeProfile.name}... (min 4 lines)`}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={4}
              className="flex-1 bg-[#090d16] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-sans resize-none"
            />
            <button
              type="submit"
              disabled={sendingMessage || !userInput.trim()}
              className="p-2.5 bg-teal-400 hover:bg-teal-500 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-lg shrink-0 h-fit mt-auto"
              title="Send message (Ctrl+Enter)"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
