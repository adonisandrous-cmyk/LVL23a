import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Camera,
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Calendar,
  Video,
  Bot,
  Zap,
  ArrowRight,
  ShieldCheck,
  Search,
  Scale,
  Clock,
  Terminal,
  Activity,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { LegalMessage, Client, Matter, GeneratedDocument } from '../types';
import level23Logo from '../assets/images/level23_phoenix_logo_1786736100367.jpg';

interface ZenEntranceViewProps {
  onActivateWorkspace: (targetTab?: string) => void;
  chatThread: LegalMessage[];
  onSendMessage: (userPrompt: string, agentName: 'PHOENIX' | 'EVE') => Promise<void>;
  clients: Client[];
  matters: Matter[];
  generatedDocs: GeneratedDocument[];
  systemConnected: boolean;
  dbSyncStatus: string;
}

export default function ZenEntranceView({
  onActivateWorkspace,
  chatThread,
  onSendMessage,
  clients,
  matters,
  generatedDocs,
  systemConnected,
  dbSyncStatus
}: ZenEntranceViewProps) {
  const [selectedAgent, setSelectedAgent] = useState<'PHOENIX' | 'EVE'>('PHOENIX');
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [localClock, setLocalClock] = useState<string>('');
  const [mediaPermissionsGranted, setMediaPermissionsGranted] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const requestMediaPermissions = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setMediaPermissionsGranted(true);
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.warn("Media permissions prompt:", err);
      // If combined mic+camera fails (e.g. no camera attached), try audio only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaPermissionsGranted(true);
        audioStream.getTracks().forEach(track => track.stop());
      } catch (audioErr) {
        console.warn("Audio permission error:", audioErr);
      }
    }
  };

  useEffect(() => {
    // Check if media permissions were previously granted or prompt gently
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as any }).then(res => {
        if (res.state === 'granted') setMediaPermissionsGranted(true);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLocalClock(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const inv = setInterval(updateClock, 1000);
    return () => clearInterval(inv);
  }, []);

  // Time-of-day greeting generator
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning, Co-Counsel.';
    if (hour >= 12 && hour < 17) return 'Good afternoon, Co-Counsel.';
    return 'Good evening, Co-Counsel.';
  };

  // Web Speech API dictation
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSubmit = customPrompt || inputPrompt;
    if (!promptToSubmit.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setInputPrompt('');

    try {
      await onSendMessage(promptToSubmit, selectedAgent);
    } catch (err) {
      console.error("Message send failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatThread, isSubmitting]);

  // Command intent detection to suggest workspace tab transition
  const checkNavigationIntent = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('client') || lower.includes('don watson') || lower.includes('directory')) return 'clients';
    if (lower.includes('matter') || lower.includes('case') || lower.includes('watson v')) return 'matters';
    if (lower.includes('pleading') || lower.includes('document') || lower.includes('fl-100') || lower.includes('draft')) return 'documents';
    if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('event') || lower.includes('google calendar')) return 'dashboard';
    if (lower.includes('consultation') || lower.includes('video') || lower.includes('jitsi')) return 'consult';
    if (lower.includes('dashboard') || lower.includes('workspace') || lower.includes('overview')) return 'dashboard';
    return null;
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col justify-between relative overflow-hidden select-text font-sans">
      
      {/* Background Subtle Ambient Glow Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/10 via-teal-500/10 to-indigo-500/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* TOP BRAND BAR */}
      <header className="w-full px-6 py-5 flex items-center justify-between z-20 border-b border-slate-900/80 bg-[#030712]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Official Level 23 Phoenix Logo Emblem */}
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 bg-[#02050e] flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <img
              src={level23Logo}
              alt="Level 23 Official Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-widest uppercase font-mono text-slate-100 flex items-center gap-2">
              <span>Level 23 Consulting</span>
              <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                AI CO-COUNSEL
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">
              Primary Google Account: <strong className="text-teal-300">level23consulting@gmail.com</strong>
            </p>
          </div>
        </div>

        {/* Top Right Quick Workspace Activation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-950/80 border border-teal-500/40 rounded-lg text-[10px] font-mono text-teal-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>VOICE WAKE ACTIVE</span>
          </div>

          <button
            type="button"
            onClick={requestMediaPermissions}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
              mediaPermissionsGranted
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-300'
            }`}
            title="Click to Grant / Verify Continuous Camera & Microphone Permissions"
          >
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            <Camera className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden md:inline">{mediaPermissionsGranted ? 'AV Access Active' : 'Grant AV Access'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-200 font-bold">{localClock}</span>
            <span className="text-slate-600">|</span>
            <span className={`w-2 h-2 rounded-full ${systemConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>{systemConnected ? 'Gemini AI Ready' : 'Standby Mode'}</span>
          </div>

          <button
            type="button"
            onClick={() => onActivateWorkspace('dashboard')}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-teal-400 hover:from-amber-400 hover:to-teal-300 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2 cursor-pointer border-none"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Open Practice Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CENTER CONVERSATIONAL CONTAINER */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col justify-between z-10 overflow-hidden">
        
        {/* CENTER PHOENIX EMBLEM & GREETING HEADER */}
        <div className="text-center pt-2 sm:pt-6 pb-4">
          <div className="relative inline-block mb-4">
            {/* Glowing Phoenix Symbol Container */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-gradient-to-b from-slate-900 via-[#0d1527] to-[#050b16] border-2 border-amber-500/50 p-4 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center justify-center relative group"
            >
              {/* Phoenix Flame SVG Logo Graphic */}
              <svg className="w-12 h-12 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 8.5L21 9L16 13.5L17.5 20L12 16.5L6.5 20L8 13.5L3 9L9.5 8.5L12 2Z" fill="url(#phoenix-grad)" />
                <defs>
                  <linearGradient id="phoenix-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Emblem 'H' Badge */}
              <span className="font-extrabold text-xs font-mono text-amber-300 mt-1 tracking-widest">
                LEVEL 23
              </span>
            </motion.div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            {getGreeting()}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1 max-w-md mx-auto">
            I am your Legal AI Assistant. How can I assist with your cases, client files, or pleadings today?
          </p>

          {/* Agent Switcher Tabs */}
          <div className="inline-flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl mt-4 font-mono text-xs">
            <button
              type="button"
              onClick={() => setSelectedAgent('PHOENIX')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedAgent === 'PHOENIX'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>PHOENIX (Lead Co-Counsel)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedAgent('EVE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedAgent === 'EVE'
                  ? 'bg-teal-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>EVE (Senior Practice AI)</span>
            </button>
          </div>
        </div>

        {/* CONVERSATION FEED & DIALOGUE LIST */}
        <div className="flex-1 overflow-y-auto my-2 p-4 bg-[#070d19]/60 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-2xl space-y-4 max-h-[380px] custom-scrollbar">
          {chatThread.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 font-sans">
              <Bot className="w-10 h-10 text-amber-500/40 mb-2 animate-bounce" />
              <p className="text-xs text-slate-400 font-medium max-w-sm">
                No active messages yet. Type a question or select a prompt below to begin your briefing session.
              </p>
            </div>
          ) : (
            chatThread.map((msg) => {
              const navTab = checkNavigationIntent(msg.content);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-400">
                    <span className="font-bold text-slate-300">{msg.agentName}</span>
                    <span>• {msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-medium shadow-md rounded-tr-none'
                        : 'bg-[#0f172a] border border-slate-700/80 text-slate-100 shadow-xl rounded-tl-none font-sans'
                    }`}
                  >
                    {msg.content}

                    {/* Interactive Workspace Tab Trigger Chip */}
                    {navTab && msg.sender === 'assistant' && (
                      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-teal-400">Related Practice Module Available:</span>
                        <button
                          type="button"
                          onClick={() => onActivateWorkspace(navTab)}
                          className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 text-[10px] font-mono font-bold uppercase rounded flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <span>Open {navTab.toUpperCase()}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}

          {isSubmitting && (
            <div className="flex items-center gap-2 p-3 bg-slate-900/80 border border-slate-800 text-amber-400 text-xs rounded-xl font-mono">
              <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
              <span>{selectedAgent} is analyzing case files and formulating guidance...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT DIALOGUE BOX & VOICE CONTROLS */}
        <div className="space-y-3 pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center bg-[#0a1222] border-2 border-slate-700 focus-within:border-amber-500/80 rounded-2xl p-2 shadow-2xl transition-all"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`Ask ${selectedAgent} anything (e.g. "Draft FL-100 petition for Don Watson", "Show client list")...`}
              className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
            />

            <div className="flex items-center gap-2 shrink-0">
              {/* Mic Voice Dictation Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                }`}
                title={isListening ? "Listening... Click to stop" : "Voice Dictation"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isSubmitting}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold font-mono text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg border-none"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* SAMPLE PROMPT QUICK CHIPS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
            <span className="text-slate-500 uppercase text-[9px] shrink-0 font-bold">Quick Actions:</span>
            
            <button
              type="button"
              onClick={() => handleSend("Draft FL-100 Marriage Dissolution Petition for Don Watson.")}
              className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-300 rounded-lg shrink-0 cursor-pointer transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-amber-400" />
              <span>Draft FL-100 Pleading</span>
            </button>

            <button
              type="button"
              onClick={() => onActivateWorkspace('clients')}
              className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-slate-300 rounded-lg shrink-0 cursor-pointer transition-colors flex items-center gap-1"
            >
              <Users className="w-3 h-3 text-teal-400" />
              <span>View Client Directory ({clients.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onActivateWorkspace('matters')}
              className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-slate-300 rounded-lg shrink-0 cursor-pointer transition-colors flex items-center gap-1"
            >
              <Briefcase className="w-3 h-3 text-indigo-400" />
              <span>Active Matters ({matters.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSend("What is the current status of Google Drive folder level23consulting@gmail.com?")}
              className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-slate-300 rounded-lg shrink-0 cursor-pointer transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Google Drive Status</span>
            </button>
          </div>
        </div>

      </main>

      {/* FOOTER SHORTCUTS & WORKSPACE QUICK TABS */}
      <footer className="w-full px-6 py-4 bg-[#02050e] border-t border-slate-900/80 z-20 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onActivateWorkspace('dashboard')}
            className="hover:text-amber-400 cursor-pointer flex items-center gap-1.5 text-slate-300 font-bold"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
            <span>Full Workspace</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onActivateWorkspace('clients')}
            className="hover:text-teal-400 cursor-pointer flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5 text-teal-400" />
            <span>Clients</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onActivateWorkspace('matters')}
            className="hover:text-indigo-400 cursor-pointer flex items-center gap-1"
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
            <span>Matters</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onActivateWorkspace('documents')}
            className="hover:text-amber-400 cursor-pointer flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Pleadings</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500">
            Level 23 Consulting Group • Bar Ref #L23-2026
          </span>
          <button
            type="button"
            onClick={() => onActivateWorkspace('dashboard')}
            className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] rounded flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3 h-3 text-amber-400" />
            <span>Expand Full App</span>
          </button>
        </div>
      </footer>

    </div>
  );
}
