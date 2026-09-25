/**
 * LEVEL 23 / PHOENIX 23
 * EIGHT-AGENT INTERACTIVE DIALOGUE POP-UP MODAL
 * 
 * Provides an authoritative, real-time pop-up dialogue interface to inspect,
 * question, and issue direct instructions to each of the 8 specialized agents:
 * 
 * 1. Agent 1 — Ingestion Agent (Vault Byte Hash & MIME)
 * 2. Agent 2 — Document Analysis Agent (Millimeter Geometry & Structural Map)
 * 3. Agent 3 — Extraction Agent (Zero-Speculation Canonical Extraction)
 * 4. Agent 4 — Database Agent (Relational Intelligence & Ontology)
 * 5. Agent 5 — Template Builder Agent (Millimeter Coordinate Overlays)
 * 6. Agent 6 — Template Delivery / Population Agent (Deterministic Outputs)
 * 7. Agent 7 — Integration Orchestrator Agent (External Systems & Drive)
 * 8. Agent 8 — Integration / Validation / QA Agent (QA Sentinel Watchdog)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Zap,
  Bot,
  MessageSquare,
  RefreshCw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
  Database,
  ArrowRight,
  Sliders,
  Lock,
  Check,
  Terminal,
  Activity,
  Trash2,
  Maximize2,
  Minimize2,
  Cpu,
  CornerDownLeft
} from 'lucide-react';
import { phoenixPipelineCoordinator } from '../services/phoenixEngine/PhoenixPipelineCoordinator';
import { AgentDescriptor, AgentChatMessage } from '../services/phoenixEngine/types';
import { audioService } from '../services/audioPlaybackService';

interface EightAgentsDialogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAgentId?: string; // e.g. 'agent_1_ingestion', 'agent_3_extraction', etc.
  onOpenExecutiveHandOff?: (dispatcher: 'phoenix' | 'eve') => void;
}

const AGENT_SHORT_PROMPTS: Record<string, string[]> = {
  agent_1_ingestion: [
    'Explain your primary directive and vaulting process.',
    'How do you calculate and verify the SHA-256 byte fingerprint?',
    'What MIME types and document formats do you accept?',
    'How do you enforce Rule 1 (Master Document is Immutable)?'
  ],
  agent_2_analysis: [
    'How do you build the DocumentStructureMap without changing the file?',
    'What structural geometry elements and bounding boxes do you detect?',
    'How do you distinguish native text from OCR scanned layers?',
    'Explain how you map blanks, AcroForms, and checkbox coordinates.'
  ],
  agent_3_extraction: [
    'How do you strictly enforce Rule 5 (Never Guess)?',
    'What is your confidence threshold before marking REQUIRES_REVIEW?',
    'How do you establish source coordinates and provenance for every fact?',
    'Explain your extraction method on CA Judicial Council FL forms.'
  ],
  agent_4_database: [
    'How does your canonical field ontology decouple data from the PDF?',
    'Explain the Client -> Matter -> Document -> Template schema relation.',
    'How can facts extracted today populate a completely different form tomorrow?',
    'Show your database integrity and indexing model.'
  ],
  agent_5_template_builder: [
    'How do you create coordinate-based overlays without HTML reflow?',
    'Explain the "Blank Field Rule" and how you anchor field coordinates.',
    'Why is converting the PDF into HTML or recreating it strictly forbidden?',
    'Show how you preserve page dimensions, margins, and typography.'
  ],
  agent_6_delivery: [
    'What deterministic outputs do you generate (PDF, XFDF, JSON)?',
    'How do you populate mapped fields while preserving source structure?',
    'Explain how you compare output geometry against the template master.',
    'Can Adobe Acrobat and court filing systems read your fillable outputs?'
  ],
  agent_7_integration: [
    'What external systems and connectors do you support (Google Drive, etc.)?',
    'How do you stage deliverables in the designated "phoenix_review" folder?',
    'Explain your authentication, retry logic, and webhook architecture.',
    'How do you ensure integrations never mutate the source master?'
  ],
  agent_8_qa_sentinel: [
    'Explain your independent watchdog validation workflow.',
    'What automated tests do you perform before permitting document delivery?',
    'How do you compare original byte hashes and boundary containment?',
    'What happens when a document fails your integrity comparison?'
  ]
};

export function EightAgentsDialogueModal({
  isOpen,
  onClose,
  initialAgentId = 'agent_1_ingestion',
  onOpenExecutiveHandOff
}: EightAgentsDialogueModalProps) {
  const [agents, setAgents] = useState<AgentDescriptor[]>(() => phoenixPipelineCoordinator.getAgents());
  const [selectedAgentId, setSelectedAgentId] = useState<string>(initialAgentId);
  const [chatHistory, setChatHistory] = useState<AgentChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync agents on open
  useEffect(() => {
    if (isOpen) {
      const allAgents = phoenixPipelineCoordinator.getAgents();
      setAgents(allAgents);
      if (initialAgentId && allAgents.some(a => a.id === initialAgentId)) {
        setSelectedAgentId(initialAgentId);
      } else if (allAgents.length > 0) {
        setSelectedAgentId(allAgents[0].id);
      }
    }
  }, [isOpen, initialAgentId]);

  // Sync chat history when selected agent changes
  useEffect(() => {
    if (selectedAgentId) {
      setChatHistory(phoenixPipelineCoordinator.getChatHistory(selectedAgentId));
      scrollToBottom();
    }
  }, [selectedAgentId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const currentAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || !currentAgent || isSending) return;

    setInputMessage('');
    setIsSending(true);

    try {
      const reply = await phoenixPipelineCoordinator.chatWithAgent(currentAgent.id, textToSend);
      setChatHistory(phoenixPipelineCoordinator.getChatHistory(currentAgent.id));
      scrollToBottom();

      // Text to speech if toggled
      if (ttsEnabled && reply?.content) {
        const cleanVoiceText = reply.content.replace(/[*_#`]/g, '').slice(0, 300);
        audioService.playVoiceAudio({ text: cleanVoiceText, agent: currentAgent.name });
      }
    } catch (err) {
      console.error('Error chatting with agent:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = () => {
    if (!currentAgent) return;
    // Clear chat history in coordinator
    (phoenixPipelineCoordinator as any).chatHistories?.set(currentAgent.id, []);
    setChatHistory([]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`bg-[#0a0f1d] border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 transition-all ${
            isMaximized
              ? 'w-full h-full max-w-none rounded-none'
              : 'w-full max-w-5xl h-[88vh] max-h-[860px]'
          }`}
        >
          {/* MODAL HEADER */}
          <div className="px-5 py-3.5 bg-[#0e162a] border-b border-[#1b263f] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 rounded-xl text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black font-mono tracking-wider uppercase text-white">
                    Level 23 Phoenix 8-Agent Dialogue Command Hub
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    ACTIVE DIALOGUE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Direct operational communication with each specialized autonomous agent in the Document Automation Engine.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* TTS Voice Toggle */}
              <button
                type="button"
                onClick={() => {
                  setTtsEnabled(!ttsEnabled);
                  if (ttsEnabled) audioService.stopAllAudio();
                }}
                className={`p-2 rounded-lg border text-xs font-mono transition flex items-center gap-1.5 cursor-pointer ${
                  ttsEnabled
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-[0_0_8px_rgba(20,184,166,0.3)]'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title={ttsEnabled ? 'Mute Agent Voice' : 'Enable Spoken Agent Voice Responses'}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-[10px] hidden sm:inline">{ttsEnabled ? 'Voice ON' : 'Voice OFF'}</span>
              </button>

              {/* Maximize Toggle */}
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-lg cursor-pointer transition"
                title={isMaximized ? 'Restore Normal Window' : 'Maximize Dialog'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 rounded-lg cursor-pointer transition"
                title="Close Agent Dialogue Pop-up"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 8 AGENTS TOP SELECTOR TABS BAR */}
          <div className="bg-[#070b14] border-b border-[#1b263f] px-4 py-2.5 overflow-x-auto flex items-center gap-2 shrink-0 scrollbar-thin scrollbar-thumb-slate-800">
            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              const shortTitle = agent.name.split(':')[0].replace('Agent ', 'A');
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/15 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)] scale-[1.02]'
                      : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {agent.index}
                  </span>
                  <div className="text-left">
                    <span className="block leading-tight text-[11px] truncate max-w-[130px]">
                      {agent.name.split(':')[1]?.trim() || agent.name}
                    </span>
                    <span className={`text-[8.5px] uppercase block tracking-wider font-sans ${
                      isSelected ? 'text-amber-300' : 'text-slate-500'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* MODAL MAIN CONTENT AREA: TWO PANELS */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
            
            {/* LEFT COLUMN: AGENT SPECIFICATIONS & INVARIANTS (4/12) */}
            <div className="md:col-span-4 bg-[#080d19] border-r border-[#1b263f] flex flex-col min-h-0 overflow-y-auto p-4 space-y-4 text-xs font-mono">
              
              {/* Agent Profile Card */}
              <div className="p-3.5 bg-[#0e1628] rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" />
                    Agent Specifications
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Status: {currentAgent.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white font-mono">{currentAgent.name}</h4>
                  <p className="text-[10.5px] text-slate-400 font-sans mt-0.5">{currentAgent.title}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase block">Core Directive:</span>
                  <p className="text-[10.5px] text-amber-200/90 leading-relaxed font-sans bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    &quot;{currentAgent.directive}&quot;
                  </p>
                </div>
              </div>

              {/* Strict Permissions Policy */}
              <div className="p-3 bg-[#0e1628] rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Execution Boundaries & Permissions
                </span>
                
                <div className="space-y-1.5 text-[9.5px]">
                  <div>
                    <span className="text-slate-400 block font-bold">READ PERMITTED:</span>
                    <span className="text-teal-300 block bg-slate-950/40 px-2 py-1 rounded border border-slate-800">
                      {currentAgent.permissionPolicy.read.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">WRITE PERMITTED:</span>
                    <span className="text-emerald-300 block bg-slate-950/40 px-2 py-1 rounded border border-slate-800">
                      {currentAgent.permissionPolicy.write.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-rose-400 block font-bold">FORBIDDEN ACTIONS:</span>
                    <span className="text-rose-300 block bg-rose-950/20 px-2 py-1 rounded border border-rose-500/20">
                      {currentAgent.permissionPolicy.forbidden.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Master Invariant Rule Enforcement */}
              <div className="p-3 bg-[#0e1628] rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Level 23 Invariants Enforced
                </span>
                <ul className="text-[10px] text-slate-300 space-y-1.5 font-sans">
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Rule 1 (Immutable Master):</strong> Original file preserved byte-for-byte in vault.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Rule 2 (Zero Reflow):</strong> Page count, dimensions, and typography stay exact.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Rule 5 (Never Guess):</strong> Missing facts left blank; further info requested.</span>
                  </li>
                </ul>
              </div>

              {/* Dispatch Action Shortcut */}
              {onOpenExecutiveHandOff && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenExecutiveHandOff('phoenix');
                    }}
                    className="w-full py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-xl text-[10.5px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Issue Executive Directives</span>
                  </button>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: INTERACTIVE LIVE CHAT & PROMPTS (8/12) */}
            <div className="md:col-span-8 flex flex-col min-h-0 bg-[#090d18] relative">
              
              {/* Agent Active Banner */}
              <div className="px-4 py-2.5 bg-[#0b1222] border-b border-[#1b263f] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-mono font-bold text-white">
                    Live Channel with {currentAgent.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-700 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer transition"
                    title="Clear dialogue history for this agent"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Chat</span>
                  </button>
                </div>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Ready to Dialogue with {currentAgent.name.split(':')[0]}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-sans max-w-md mt-1 leading-normal">
                        Ask about this agent&apos;s specific responsibilities, test its invariant rules, or issue operational guidelines.
                      </p>
                    </div>

                    {/* Quick suggested prompt buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full pt-2">
                      {(AGENT_SHORT_PROMPTS[currentAgent.id] || []).map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="p-2.5 bg-[#0f172a] hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-xl text-left text-[10.5px] text-slate-300 hover:text-amber-200 font-mono transition cursor-pointer flex items-center justify-between group shadow-sm"
                        >
                          <span className="line-clamp-2">{prompt}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {chatHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 mb-1 px-1">
                          {msg.sender === 'user' ? (
                            <span>Counsel Directive</span>
                          ) : (
                            <span className="text-amber-400 font-bold">{currentAgent.name.split(':')[0]}</span>
                          )}
                          <span>&bull;</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-tr-none shadow-md'
                              : 'bg-[#101728] border border-slate-800 text-slate-200 rounded-tl-none font-sans shadow-md'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    {isSending && (
                      <div className="flex items-center gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-mono text-amber-300 max-w-xs animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>{currentAgent.name.split(':')[0]} is formulating response...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Quick Prompts Chip Bar when in active chat */}
              {chatHistory.length > 0 && (
                <div className="px-4 py-1.5 bg-[#080d1a] border-t border-[#1b263f] flex items-center gap-1.5 overflow-x-auto shrink-0">
                  <span className="text-[9px] font-mono uppercase text-slate-500 font-bold shrink-0">Prompt:</span>
                  {(AGENT_SHORT_PROMPTS[currentAgent.id] || []).slice(0, 3).map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-300 rounded text-[9.5px] font-mono truncate max-w-[200px] shrink-0 transition"
                      title={prompt}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* CHAT INPUT BAR */}
              <div className="p-3.5 bg-[#0b1222] border-t border-[#1b263f] flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder={`Dialogue with ${currentAgent.name.split(':')[0]} (e.g. "Explain your Rule 5 zero-guess policy" or "Report activity")...`}
                  disabled={isSending}
                  className="flex-1 bg-[#060a14] border border-[#1b2742] focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isSending || !inputMessage.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 text-slate-950 font-bold font-mono text-xs uppercase rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  {isSending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>

            </div>

          </div>

          {/* MODAL FOOTER */}
          <div className="px-5 py-2.5 bg-[#070b14] border-t border-[#1b263f] flex items-center justify-between text-[10.5px] font-mono text-slate-400 shrink-0">
            <div className="flex items-center gap-3">
              <span>Selected: <strong className="text-amber-300">{currentAgent.name}</strong></span>
              <span className="hidden sm:inline">&bull;</span>
              <span className="hidden sm:inline">Visual Master: <strong className="text-teal-300">100% Immutable</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] text-slate-500">Press Esc or Close to dismiss</span>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
