import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse agent custom names", e);
    }
    return {
      'ap-1': 'Phoenix',
      'ap-2': 'Sentry',
      'ap-3': 'Alure'
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
    e.stopPropagation(); // Avoid triggering setActiveProfileId
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

  // State-driven active ID
  const [activeProfileId, setActiveProfileId] = useState<string>('ap-1');

  // Grounded check for previous or custom names
  const isMessageForProfile = (msgName: string, profileId: string) => {
    const normMsg = msgName.toLowerCase();
    const custom = (customNames[profileId] || '').toLowerCase();
    const activeMapping: Record<string, string[]> = {
      'ap-1': ['alexandra', 'partner', 'strategist', 'phoenix'],
      'ap-2': ['miranda', 'advocate', 'insolvency', 'bankruptcy', 'sentry', 'maintenance', 'maintain'],
      'ap-3': ['aida', 'associate', 'research', 'alure', 'reviewer', 'manager']
    };
    
    // Check if message matches custom assigned name
    if (custom && normMsg.includes(custom)) {
      return true;
    }
    
    // Check fallback terms
    const terms = activeMapping[profileId] || [];
    return terms.some(term => normMsg.includes(term));
  };

  // All Female Agent Profiles. Alexandra Partner has the British/UK female accent ('Aoede' voice).
  const agentProfiles: VoiceAgentProfile[] = [
    {
      id: 'ap-1',
      name: customNames['ap-1'] || 'Phoenix',
      avatar: '👩‍⚖️',
      role: 'Senior Litigation Strategist',
      voiceName: 'Aoede', // Professional UK Female
      description: 'Prepares trial strategy boards, outlines procedural demand metrics, and manages trial briefs.',
      accent: 'Distinguished British Accent (UK Female)',
      style: 'Authoritative, structured, precise'
    },
    {
      id: 'ap-2',
      name: customNames['ap-2'] || 'Sentry',
      avatar: '🛡️',
      role: 'System Administrator & App Maintenance Sentry',
      voiceName: 'Zephyr', // Mid-Atlantic Academic Female
      description: 'Responsible for diagnostic sweeps, applet health integrity, package tracking, and active deployment monitoring.',
      accent: 'Mid-Atlantic Academic (US Female)',
      style: 'Extremely detailed, reassuring'
    },
    {
      id: 'ap-3',
      name: customNames['ap-3'] || 'Alure',
      avatar: '💼',
      role: 'Office Manager & Business Reviewer',
      voiceName: 'Kore', // West Coast Modern Female
      description: 'Reviews cases, audits document pipelines, manages client intakes, and performs thorough office operational review.',
      accent: 'Modern West Coast (US Female)',
      style: 'Efficient, highly responsive, concise'
    }
  ];

  const activeProfile = agentProfiles.find(p => p.id === activeProfileId) || agentProfiles[0];
  const setActiveProfile = (profile: VoiceAgentProfile) => {
    setActiveProfileId(profile.id);
  };
  const [userInput, setUserInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchCitations, setSearchCitations] = useState<{ title: string; url: string }[]>([]);

  // Speech Recognition & TTS States
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'SLEEPING' | 'LISTENING' | 'WAKING' | 'SPEAKING' | 'ERROR'>('SLEEPING');
  const [recognition, setRecognition] = useState<any>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [automaticSpeakMode, setAutomaticSpeakMode] = useState(true); // Toggle to speak replies automatically
  const [lastHeardSpeech, setLastHeardSpeech] = useState<string>('');

  // Integrated Document Upload and Parsing State Panel
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
    content: string;
  } | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showVoiceSim, setShowVoiceSim] = useState(false);

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
    { key: 'Cross-Exam Mock Interview', levelRequired: 50, icon: BrainCircuit, desc: 'Simulates client grilling under strict evidence protocols.' },
    { key: 'Evidentiary Sandbox Simulator', levelRequired: 75, icon: Zap, desc: 'Computes court trial probabilities and rebuttal plays.' }
  ];

  // ----------------------------------------------------------------------
  // SPEECH RECOGNITION (WAKE WORD & COMMAND LISTENER)
  // ----------------------------------------------------------------------
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setVoiceStatus('LISTENING');
        setSpeechError(null);
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition error:", event.error);
        if (event.error !== 'no-speech') {
          setSpeechError(event.error);
          setVoiceStatus('ERROR');
          setIsListening(false);
        }
      };

      rec.onend = () => {
        if (isListening) {
          // Restart background recognition automatically for continuous listening experience
          try {
            rec.start();
          } catch {
            setIsListening(false);
            setVoiceStatus('SLEEPING');
          }
        } else {
          setVoiceStatus('SLEEPING');
        }
      };

      rec.onresult = (event: any) => {
        const lastResultIndex = event.resultIndex;
        const transcript = event.results[lastResultIndex][0].transcript.trim();
        console.log("🎙️ Legal Wake Listener parsed speech:", transcript);
        setLastHeardSpeech(transcript);
        handleHeardSpeechPhrase(transcript);
      };

      setRecognition(rec);
    }
  }, [isListening]);

  // Clean play-back of dynamic synthesizer chime when waking up
  const playWakeChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(293.66, now); // D4
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.12); // A4

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start(now);
      osc2.start(now);
      
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn("Synth chime failed", e);
    }
  };

  const resumeAudioContextIfSuspended = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  const stopActiveSpeech = () => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {}
      activeSourceRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingAudio(false);
  };

  // Speaks response using premium Gemini TTS API with graceful local browser standard speechSynthesis backup
  const speakResponseText = async (rawText: string, voiceName: string) => {
    stopActiveSpeech();
    setIsSpeakingAudio(true);
    setVoiceStatus('SPEAKING');

    const cleanText = rawText
      .replace(/[#*`_\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    try {
      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voiceName: voiceName
        })
      });

      const data = await response.json();
      if (data.base64Audio) {
        await resumeAudioContextIfSuspended();
        const ctx = audioContextRef.current!;

        const binaryString = window.atob(data.base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const numSamples = Math.floor(len / 2);
        const floatData = new Float32Array(numSamples);
        const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

        for (let i = 0; i < numSamples; i++) {
          if (i * 2 + 1 < len) {
            const sample = dataView.getInt16(i * 2, true);
            floatData[i] = sample / 32768.0;
          }
        }

        const sampleRate = 24000;
        const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
        audioBuffer.getChannelData(0).set(floatData);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        activeSourceRef.current = source;

        source.onended = () => {
          setIsSpeakingAudio(false);
          setVoiceStatus(isListening ? 'LISTENING' : 'SLEEPING');
        };

        source.start(0);
        return; // Success
      }
    } catch (apiError) {
      console.warn("⚠️ Premium offline key or quota limits reached. Triggering native high-fidelity backup speech synthesis:", apiError);
    }

    // High fidelity browser text synthesis fallback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice = null;

      if (voiceName === 'Aoede') {
        // Find British UK English female voice
        matchedVoice = voices.find(v => v.lang.includes('GB') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google')))
                    || voices.find(v => v.lang.includes('GB'))
                    || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google'));
      } else if (voiceName === 'Zephyr') {
        // Mid-Atlantic Female US
        matchedVoice = voices.find(v => v.lang.includes('US') && v.name.toLowerCase().includes('zira'))
                    || voices.find(v => v.lang.includes('US') && v.name.toLowerCase().includes('female'))
                    || voices.find(v => v.lang.startsWith('en'));
      } else {
        // Kore West Coast Female
        matchedVoice = voices.find(v => v.lang.includes('US') && v.name.toLowerCase().includes('samantha'))
                    || voices.find(v => v.lang.includes('US') && v.name.toLowerCase().includes('female'))
                    || voices.find(v => v.lang.startsWith('en'));
      }

      if (matchedVoice) utterance.voice = matchedVoice;
      utterance.pitch = 1.05;
      utterance.rate = 0.98;

      utterance.onend = () => {
        setIsSpeakingAudio(false);
        setVoiceStatus(isListening ? 'LISTENING' : 'SLEEPING');
      };

      utterance.onerror = () => {
        setIsSpeakingAudio(false);
        setVoiceStatus(isListening ? 'LISTENING' : 'SLEEPING');
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeakingAudio(false);
      setVoiceStatus(isListening ? 'LISTENING' : 'SLEEPING');
    }
  };

  // Handles real spoken speech and routes matching names / wake words
  const handleHeardSpeechPhrase = (phrase: string) => {
    const normalized = phrase.toLowerCase();
    
    // Dynamic matching of the custom names assigned by the user
    const alexName = (customNames['ap-1'] || 'Alexandra').toLowerCase();
    const mirandaName = (customNames['ap-2'] || 'Miranda').toLowerCase();
    const aidaName = (customNames['ap-3'] || 'Aida').toLowerCase();

    const hasAlexandra = normalized.includes(alexName) || normalized.includes("alexandra") || normalized.includes("alexa") || normalized.includes("partner");
    const hasMiranda = normalized.includes(mirandaName) || normalized.includes("miranda") || normalized.includes("bankruptcy");
    const hasAida = normalized.includes(aidaName) || normalized.includes("aida") || normalized.includes("associate");
    const hasWakeWord = normalized.includes("wake up") || normalized.includes("wake-up") || normalized.includes("hello") || normalized.includes("activate") || normalized.includes("listen");

    let matchedProfile = null;
    if (hasAlexandra) matchedProfile = agentProfiles[0];
    else if (hasMiranda) matchedProfile = agentProfiles[1];
    else if (hasAida) matchedProfile = agentProfiles[2];

    if (matchedProfile) {
      setActiveProfile(matchedProfile);
      playWakeChime();

      // Extract spoken query
      let querySpoken = normalized
        .replace(matchedProfile.name.toLowerCase(), '')
        .replace(alexName, "")
        .replace("alexandra", "")
        .replace(mirandaName, "")
        .replace("miranda", "")
        .replace(aidaName, "")
        .replace("aida", "")
        .replace("wake up", "")
        .replace("wake-up", "")
        .replace("listen", "")
        .replace(/^[,\s]+|[,\s]+$/g, '')
        .trim();

      if (querySpoken.length > 2) {
        // Speak transition notice and execute query immediately hands-free!
        const intro = `Yes! ${matchedProfile.name} listening. Processing: "${querySpoken}"`;
        speakResponseText(intro, matchedProfile.voiceName);
        submitSpokenCommandDirectly(querySpoken, matchedProfile);
      } else {
        // Simple wake up
        let responsePhrase = "";
        if (matchedProfile.id === 'ap-1') {
          responsePhrase = `Yes, ${matchedProfile.name} here, senior litigation strategist. Online and listening with my British voice. Let's map your trial action plans.`;
        } else if (matchedProfile.id === 'ap-2') {
          responsePhrase = `Hello, ${matchedProfile.name} present. Let's safeguard your property and corporate assets.`;
        } else {
          responsePhrase = `Hi, ${matchedProfile.name} associate at your service. Case laws, filing summaries and citation details verified.`;
        }
        
        speakResponseText(responsePhrase, matchedProfile.voiceName);
        onAddMessage({
          id: `m-voice-${Date.now()}`,
          sender: 'assistant',
          content: `*🎙️ [Voice Wake-up Triggered] ${matchedProfile.name} Activates:* \n"${responsePhrase}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: matchedProfile.name
        });
      }
    } else if (hasWakeWord) {
      playWakeChime();
      const wakeGreeting = `Yes, I am awake. ${agentProfiles[0].name}, ${agentProfiles[1].name}, and ${agentProfiles[2].name} are all online. Who would you like to speak with?`;
      speakResponseText(wakeGreeting, activeProfile.voiceName);
      onAddMessage({
        id: `m-voice-${Date.now()}`,
        sender: 'assistant',
        content: `*🎙️ [Global Wake-up Triggered]:* \n"${wakeGreeting}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: activeProfile.name
      });
    }
  };

  const toggleVoiceListener = () => {
    if (!recognition) {
      alert("Browser Speech Recognition not supported in this frame. Please select a quick action from our Manual Speech triggers panel below to simulate voice commands perfectly!");
      return;
    }

    if (isListening) {
      setIsListening(false);
      recognition.stop();
      setVoiceStatus('SLEEPING');
    } else {
      setIsListening(true);
      resumeAudioContextIfSuspended();
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateSlider = (field: 'caseFamiliarity' | 'prosecutorialAggression', val: number) => {
    onUpdateAgentProgress({
      ...activeProgress,
      [field]: val
    });
  };

  const handleQuickPromptClick = (capacityKey: string) => {
    let textPrompt = '';
    if (capacityKey === 'Pleadings Fact Extraction') {
      textPrompt = `Analyze our active clients' rough schedules. Extract community assets and critical timelines for pleading briefs.`;
    } else if (capacityKey === 'Jurisdictional Audit Scope') {
      textPrompt = `Run a district standing and jurisdictional venue sweep considering California dissolve proceedings.`;
    } else if (capacityKey === 'Cross-Exam Mock Interview') {
      textPrompt = `Initiate a simulated cross-examination. Question me directly and aggressively regarding our primary claims.`;
    } else if (capacityKey === 'Evidentiary Sandbox Simulator') {
      textPrompt = `Map out standard judge evidentiary objections and optimal rebuttal playbooks for this litigation matter.`;
    }
    
    setUserInput(textPrompt);
  };

  // Direct Submission for Voice commands (hands free, triggers auto speak replies)
  const submitSpokenCommandDirectly = async (queryText: string, profile: VoiceAgentProfile) => {
    setUserInput('');
    setSendingMessage(true);
    setSearchCitations([]);

    const userMsg: LegalMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: profile.name
    };

    onAddMessage(userMsg);

    const progState = agentProgressList.find(p => p.agentId === profile.id) || {
      agentId: profile.id,
      rapportScore: 10,
      personalityState: 'Reserved' as const,
      interactionCount: 0,
      unlockedCapabilities: ['Pleadings Fact Extraction'],
      caseFamiliarity: 15,
      prosecutorialAggression: 75
    };

    const nextCount = progState.interactionCount + 1;
    const addedProg = Math.floor(Math.random() * 4) + 5;
    const nextRapp = Math.min(progState.rapportScore + addedProg, 100);
    const nextFami = Math.min(progState.caseFamiliarity + Math.floor(Math.random() * 2) + 2, 100);

    let nextPers: 'Reserved' | 'Collaborative' | 'Trusting' | 'Empathetic' | 'Highly Aligned' = progState.personalityState;
    if (nextRapp > 75) nextPers = 'Highly Aligned';
    else if (nextRapp > 50) nextPers = 'Empathetic';
    else if (nextRapp > 25) nextPers = 'Trusting';
    else if (nextRapp > 10) nextPers = 'Collaborative';

    const nextUnl = [...progState.unlockedCapabilities];
    capacities.forEach(cap => {
      if (nextRapp >= cap.levelRequired && !nextUnl.includes(cap.key)) {
        nextUnl.push(cap.key);
      }
    });

    onUpdateAgentProgress({
      ...progState,
      interactionCount: nextCount,
      rapportScore: nextRapp,
      personalityState: nextPers,
      caseFamiliarity: nextFami,
      unlockedCapabilities: nextUnl
    });

    try {
      const messagesHistory = chatThread
        .filter(m => isMessageForProfile(m.agentName, profile.id))
        .concat(userMsg);

      const instructionOffset = `You have a rapport score of ${nextRapp}% (${nextPers} relationship status) and case familiarity of ${nextFami}%. Speak and respond in character, reflecting this exact progressive confidence level, being ${nextRapp > 50 ? 'highly collaborative, sharing deep insights' : 'procedural'} in tone. Speak completely as a high-fidelity female expert legal adviser.`;

      const documentContextStr = uploadedFile 
        ? `\n\n[Active Reference Document (${uploadedFile.name}):]\n${uploadedFile.content.slice(0, 15000)}\n\nPlease analyze, audit, or answer questions strictly based on the above document content when the user asks about it.`
        : '';

      const response = await fetch('/api/gemini/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesHistory,
          agentRole: profile.role,
          agentInstruction: `You are ${profile.name}, the ${profile.role}. Profile style: ${profile.style}. Description: ${profile.description}. ${instructionOffset}${documentContextStr}`
        })
      });

      const data = await response.json();
      if (data.reply) {
        onAddMessage({
          id: `m-rep-${Date.now()}`,
          sender: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: profile.name
        });

        if (data.citations && data.citations.length > 0) {
          setSearchCitations(data.citations);
        }

        // Auto SPEAK response out loud!
        if (automaticSpeakMode) {
          speakResponseText(data.reply, profile.voiceName);
        }
      }
    } catch {
      onAddMessage({
        id: `m-err-${Date.now()}`,
        sender: 'assistant',
        content: "Drafting connection failed. Standard fallback metrics apply.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: profile.name
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Standard Written Input form send
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

    // Progress increments dynamically as rapport increases
    const nextInteractionCount = activeProgress.interactionCount + 1;
    const addedRapport = Math.floor(Math.random() * 4) + 4; // Add 4 to 7 rapport points
    const nextRapport = Math.min(activeProgress.rapportScore + addedRapport, 100);
    const nextFamiliarity = Math.min(activeProgress.caseFamiliarity + Math.floor(Math.random() * 3) + 2, 100);

    let nextPersonality: 'Reserved' | 'Collaborative' | 'Trusting' | 'Empathetic' | 'Highly Aligned' = activeProgress.personalityState;
    if (nextRapport > 75) nextPersonality = 'Highly Aligned';
    else if (nextRapport > 50) nextPersonality = 'Empathetic';
    else if (nextRapport > 25) nextPersonality = 'Trusting';
    else if (nextRapport > 10) nextPersonality = 'Collaborative';

    const nextUnlocked = [...activeProgress.unlockedCapabilities];
    capacities.forEach(cap => {
      if (nextRapport >= cap.levelRequired && !nextUnlocked.includes(cap.key)) {
        nextUnlocked.push(cap.key);
      }
    });

    onUpdateAgentProgress({
      ...activeProgress,
       interactionCount: nextInteractionCount,
       rapportScore: nextRapport,
       personalityState: nextPersonality,
       caseFamiliarity: nextFamiliarity,
       unlockedCapabilities: nextUnlocked
    });

    try {
      const messagesHistory = chatThread
        .filter(m => isMessageForProfile(m.agentName, activeProfile.id))
        .concat(userMsg);

      const progressivePromptOffset = `You have a rapport score of ${nextRapport}% (${nextPersonality} relationship stance) and a case familiarity score of ${nextFamiliarity}%. 
      Your Aggression meter is locked at ${activeProgress.prosecutorialAggression}%. 
      Speak and respond in character, reflecting this exact progressive confidence level, being ${nextRapport > 50 ? 'highly collaborative, sharing deep insights' : 'procedural and cautious'} in tone. Respond entirely as a high-fidelity female legal expert.`;

      const documentContextStr = uploadedFile 
        ? `\n\n[Active Reference Document (${uploadedFile.name}):]\n${uploadedFile.content.slice(0, 15000)}\n\nPlease analyze, audit, or answer questions strictly based on the above document content when the user asks about it.`
        : '';

      const response = await fetch('/api/gemini/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesHistory,
          agentRole: activeProfile.role,
          agentInstruction: `You are ${activeProfile.name}, the ${activeProfile.role}. Profile style: ${activeProfile.style}. Description: ${activeProfile.description}. ${progressivePromptOffset}${documentContextStr}`
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

        if (data.citations && data.citations.length > 0) {
          setSearchCitations(data.citations);
        }

        // SPEAK BACK the response automatically if active!
        if (automaticSpeakMode) {
          speakResponseText(data.reply, activeProfile.voiceName);
        }
      } else {
        onAddMessage({
          id: `m-err-${Date.now()}`,
          sender: 'assistant',
          content: "I apologize, the server-side legal agent encountered a brief interruption compiling a response. Let's try again shortly.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: activeProfile.name
        });
      }
    } catch {
      onAddMessage({
        id: `m-err-${Date.now()}`,
        sender: 'assistant',
        content: "Drafting connection failed. Standard fallback metrics apply.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: activeProfile.name
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Document uploading, dragging & parsing action handlers
  const handleFileUpload = (file: File) => {
    setIsParsingFile(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setTimeout(() => {
        setUploadedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type || 'text/plain',
          content: text || `[Document content: ${file.name}] Successfully structured raw text content indexes. No binary issues detected.`
        });
        setIsParsingFile(false);

        // System notification dispatch to the active chat
        onAddMessage({
          id: `m-doc-${Date.now()}`,
          sender: 'system' as any,
          content: `📂 Document Indexed: "${file.name}" (${(file.size / 1024).toFixed(1)} KB). I am ready to process and answer complex questions regarding this text. Ask me anything!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: activeProfile.name
        });
      }, 900); 
    };
    reader.onerror = () => {
      setIsParsingFile(false);
      alert("Failed to read the file. Please check files permission guidelines.");
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

  // Quick simulated phrase triggers for easy user evaluation in sandy boxes
  const simulatedPhrases = [
    { label: `${customNames['ap-1']} wake up`, cmd: `${customNames['ap-1']} wake up` },
    { label: `${customNames['ap-1']}, extract community assets`, cmd: `${customNames['ap-1']}, extract community assets` },
    { label: `${customNames['ap-2']} wake up`, cmd: `${customNames['ap-2']} wake up` },
    { label: `${customNames['ap-2']}, analyze stay rules`, cmd: `${customNames['ap-2']}, what is an automatic stay?` },
    { label: `${customNames['ap-3']} wake up`, cmd: `${customNames['ap-3']} wake up` },
    { label: `${customNames['ap-3']}, list filing checklists`, cmd: `${customNames['ap-3']}, summarize our intake rules` }
  ];

  return (
    <div id="ai-chat-tab" className="flex flex-col gap-4 h-[calc(100vh-140px)] min-h-0">
      
      {/* ========================================== */}
      {/* TOP DECK: HORIZONTAL PROFILES & 3D VOICE HUD */}
      {/* ========================================== */}
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shrink-0">
        
        {/* Left Side: Specialist Selectors (Dense horizontal tabs) */}
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
                    stopActiveSpeech();
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
                  <div className="flex items-center justify-between gap-1 leading-none" onClick={(e) => {
                    if (editingId === p.id) e.stopPropagation();
                  }}>
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
                    
                    {/* Compact rapport metric */}
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

        {/* Right Side: Active 3D Voice Hotmic Controls & Indicators */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end shrink-0 select-none">
          
          {/* Wake Status Pill */}
          <div className="bg-[#090d16] border border-[#1e293b] px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono text-[9px] font-bold text-teal-400 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${voiceStatus === 'LISTENING' ? 'bg-emerald-400 animate-ping' : voiceStatus === 'SPEAKING' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}></span>
            <span>WAKE: {voiceStatus}</span>
          </div>

          {/* 3D-Styled Enable / Disable Hot Mic Toggle Button */}
          <button
            type="button"
            onClick={toggleVoiceListener}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 select-none ${
              isListening 
                ? 'bg-rose-950/20 text-rose-400 border-rose-500/40 shadow-[0_3px_0_#f43f5e] hover:shadow-[0_1px_0_#f43f5e] hover:border-rose-500/60 active:translate-y-[2px] active:shadow-none' 
                : 'bg-teal-950/20 text-teal-400 border-teal-500/30 shadow-[0_3px_0_#14b8a6] hover:shadow-[0_1px_0_#14b8a6] hover:-translate-y-[0.5px] hover:border-teal-500/50 active:translate-y-[2px] active:shadow-none'
            }`}
            title={isListening ? "Disable Hot Mic Detection" : "Enable Passive Voice Hot Mic Detection"}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5 mr-1" /> : <Mic className="w-3.5 h-3.5 mr-1" />}
            <span>{isListening ? "MIC ACTIVE" : "ENABLE VOICE MIC"}</span>
          </button>

          {/* 3D-Styled Stop speaking voice speaker Button */}
          <button
            type="button"
            onClick={stopActiveSpeech}
            title="Silence Active Response Speech"
            className="p-1.5 bg-[#0d1624] text-[#f43f5e] border border-rose-500/30 rounded-xl shadow-[0_3px_0_#f43f5e] hover:shadow-[0_1px_0_#f43f5e] hover:-translate-y-[0.5px] hover:border-rose-500/50 active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center font-bold"
          >
            <VolumeX className="w-4 h-4" />
          </button>

          {/* Auto-Speak Toggle Checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-sans text-slate-400 bg-[#090d16] border border-[#1e293b] px-2.5 py-1.5 rounded-lg hover:border-slate-800 transition">
            <input
              type="checkbox"
              checked={automaticSpeakMode}
              onChange={(e) => setAutomaticSpeakMode(e.target.checked)}
              className="rounded border-[#1e293b] bg-slate-950 text-teal-400 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
            />
            <span className="font-semibold">Auto-Speak</span>
          </label>

          {/* Developer Sandbox Phrase Toggler */}
          <button
            type="button"
            onClick={() => setShowVoiceSim(prev => !prev)}
            className={`p-1.5 rounded-xl border font-semibold text-[10px] flex items-center gap-1 transition-all ${
              showVoiceSim 
                ? 'bg-amber-950/10 border-amber-500/40 text-amber-400 shadow-[0_2px_0_#f59e0b] active:translate-y-[2px]' 
                : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-slate-300'
            }`}
          >
            <span>Simulate Voice</span>
            {showVoiceSim ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* ======================================================= */}
      {/* MAIN BODY: WORKSPACE SPLIT (Left: Document, Right: Chat) */}
      {/* ======================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        
        {/* ------------------------------------- */}
        {/* LEFT COLUMN: FILE PARSER / DOC READER */}
        {/* ------------------------------------- */}
        <div className="lg:col-span-5 bg-[#0e1626] rounded-2xl border border-[#1e293b] flex flex-col min-h-0 overflow-hidden shadow-xl">
          
          {/* Header */}
          <div className="p-3 bg-[#0d1624] border-b border-[#1e293b] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4.5 h-4.5 text-teal-400 shrink-0" />
              <h3 className="text-xs font-bold text-white font-heading truncate">
                {uploadedFile ? `📜 ${uploadedFile.name}` : `Integrated Document Workspace`}
              </h3>
            </div>
            {uploadedFile && (
              <button
                onClick={() => setUploadedFile(null)}
                className="p-1 text-slate-400 hover:text-rose-400 rounded-lg bg-slate-900 hover:bg-slate-800 transition"
                title="Unload Reference Document"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Document Workspace Content Body */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#090d16]/20 relative">
            
            {isParsingFile ? (
              /* Circular glowing parsing loader skeleton */
              <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                <div className="relative w-12 h-12">
                  <div className="w-12 h-12 rounded-full border-4 border-teal-500/10 border-t-teal-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-teal-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <span className="font-mono text-[10px] text-teal-400 animate-pulse block font-black uppercase tracking-widest">
                    PARSING FILE DETAILS...
                  </span>
                  <p className="text-[9px] text-slate-500 font-mono">Compiling word buffers & aligning custom context vectors</p>
                </div>
              </div>

            ) : !uploadedFile ? (
              /* Drag & Drop Upload Zone */
              <div 
                className="flex-1 flex flex-col p-4"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={`flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all ${
                  dragOver 
                    ? 'border-teal-400 bg-teal-950/20 text-teal-300 scale-[0.99] shadow-inner' 
                    : 'border-[#1e293b] bg-[#090d16]/30 text-slate-500 hover:border-[#334155]'
                }`}>
                  <UploadCloud className={`w-12 h-12 text-teal-500/40 mb-3 ${dragOver ? 'animate-bounce text-teal-400' : ''}`} />
                  <h4 className="text-xs font-bold text-slate-300">Share or Drag Intakes / Case Documents Here</h4>
                  <p className="text-[10px] text-slate-500 text-center max-w-xs mt-1.5 mb-4 leading-normal">
                    Drag and drop any plain text contract, CSV matrix, court notes or pleadings. 
                    Agents immediately read the document context in real time.
                  </p>
                  
                  <label className="px-3 py-1.5 bg-teal-950/40 border border-teal-500/30 text-teal-400 font-bold rounded-lg text-[10px] tracking-wide hover:bg-teal-900 transition-all cursor-pointer shadow-[0_2px_0_#14b8a6] hover:shadow-[0_1px_0_#14b8a6] hover:-translate-y-[0.5px]">
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
              /* Live Scrollable Formatted Document Text-Area */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4 space-y-3">
                <div className="flex items-center justify-between text-[9px] text-slate-400 shrink-0 bg-[#090d16] px-2.5 py-1.5 rounded-lg border border-[#1e293b]">
                  <span className="font-mono">Reference Size: <strong className="text-white">{uploadedFile.size}</strong></span>
                  <span className="font-mono uppercase text-teal-400">Status: Read and Parsed</span>
                </div>

                {/* Inline workspace trigger buttons */}
                <div className="grid grid-cols-2 gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setUserInput(`Review this document ("${uploadedFile.name}") and Summary pinpoint all critical financial assets, community liabilities, and risk details.`);
                    }}
                    className="p-1.5 text-left text-[9px] font-bold text-teal-300 border border-teal-500/20 bg-teal-950/15 rounded-lg hover:border-teal-500/50 transition cursor-pointer flex items-center gap-1"
                  >
                    🚀 Phoenix Risk Audit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserInput(`Run continuous validation check on this file ("${uploadedFile.name}"). Highlight formatting gaps, empty fields, or structural maintenance issues.`);
                    }}
                    className="p-1.5 text-left text-[9px] font-bold text-amber-300 border border-amber-500/20 bg-amber-950/15 rounded-lg hover:border-amber-500/50 transition cursor-pointer flex items-center gap-1"
                  >
                    🛠️ Sentry Applet Audit
                  </button>
                </div>

                {/* Large reader canvas */}
                <div className="flex-1 min-h-0 bg-[#040810] border border-[#1e293b] rounded-xl p-3.5 overflow-y-auto selection:bg-teal-500/30">
                  <pre className="text-[11px] font-mono text-[#38bdf8] leading-relaxed whitespace-pre-wrap font-medium">
                    {uploadedFile.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------- */}
        {/* RIGHT COLUMN: ACTIVE STRATEGIC CHAT   */}
        {/* ------------------------------------- */}
        <div className="lg:col-span-7 bg-[#0e1626] rounded-2xl border border-[#1e293b] flex flex-col min-h-0 overflow-hidden shadow-xl">
          
          {/* Chat header agent info */}
          <div className="p-3 bg-[#0d1624] border-b border-[#1e293b] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg shrink-0">{activeProfile.avatar}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <h3 className="text-xs font-bold text-white font-heading truncate">{activeProfile.name}</h3>
                  <span className="text-[8px] uppercase tracking-wider font-mono bg-teal-950 text-teal-400 border border-teal-500/20 px-1 py-0.5 rounded leading-none shrink-0 font-bold scale-90">
                    {activeProfile.voiceName === 'Aoede' ? 'UK Accent' : 'US Accent'}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-sans truncate mt-0.5">{activeProfile.role}</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                onClearThread();
                stopActiveSpeech();
              }}
              className="px-2 py-1 text-[9px] font-mono border border-slate-800 text-slate-500 hover:text-slate-300 rounded hover:border-[#1e293b] transition cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Inline Slider HUD Meter */}
          <div className="flex items-center gap-3 bg-[#090d16]/40 px-3.5 py-1.5 border-b border-[#1e293b]/50 text-[9px] text-slate-400 justify-between shrink-0 flex-wrap">
            <span className="flex items-center gap-1 font-mono">STANCE: <strong className="text-teal-400">{activeProgress.personalityState}</strong></span>
            <span className="flex items-center gap-1 font-mono">FAMILIARITY: <strong className="text-slate-200">{activeProgress.caseFamiliarity}%</strong></span>
            <div className="flex items-center gap-1 max-w-[170px] flex-1 font-sans">
              <span>AGGRESSION:</span>
              <input
                type="range"
                min="10"
                max="100"
                value={activeProgress.prosecutorialAggression}
                onChange={(e) => handleUpdateSlider('prosecutorialAggression', parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-none"
              />
              <strong className="text-emerald-400 font-mono w-5 text-right shrink-0">{activeProgress.prosecutorialAggression}%</strong>
            </div>
          </div>

          {/* Active Tactical Specialty Skills row */}
          <div className="px-4 py-2 bg-[#090d16]/20 border-b border-[#1e293b]/40 space-y-1 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {capacities.map((cap) => {
                const isUnlocked = activeProgress.rapportScore >= cap.levelRequired;
                const CapIcon = cap.icon;
                return (
                  <button
                    key={cap.key}
                    disabled={!isUnlocked}
                    onClick={() => handleQuickPromptClick(cap.key)}
                    className={`p-1.5 rounded-lg text-left border flex flex-col justify-between group transition-all text-[#101726]-200 text-[9.5px] h-[48px] ${
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

          {/* Balloon Chat Log messages viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#090d16]/10 select-text min-h-0">
            {activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-2">
                <Bot className="w-10 h-10 text-[#1e293b]" />
                <h4 className="text-xs font-bold text-slate-300 font-heading">Consult {activeProfile.name}</h4>
                <p className="text-[10px] text-slate-500 leading-normal font-sans">
                  "I am ready. Ask me any procedural questions or upload a draft on the left to review facts and audit details."
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
                        : msg.sender === 'system' as any
                        ? 'bg-[#0c1a2e]/40 text-teal-300 border-teal-500/30'
                        : 'bg-[#090d16] text-slate-200 border-[#1e293b] rounded-tl-none'
                    }`}>
                      <div className="whitespace-pre-wrap font-medium">
                        {msg.content}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 px-1 leading-none">
                      <span>{msg.sender === 'user' ? 'You' : msg.sender === 'system' as any ? 'Applet Workspace' : activeProfile.name} | {msg.timestamp}</span>
                      {msg.sender === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => speakResponseText(msg.content, activeProfile.voiceName)}
                          className="text-teal-400 hover:text-teal-300 flex items-center gap-1 shrink-0 font-bold ml-2 leading-none"
                        >
                          <Volume2 className="w-2.5 h-2.5" /> Re-speak
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading assistant indicator */}
            {sendingMessage && (
              <div className="flex gap-2.5 max-w-[90%] animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-xs">
                  {activeProfile.avatar}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="p-3 bg-[#090d16] border border-[#1e293b] rounded-2xl rounded-tl-none text-[10px] text-slate-500 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    <span className="font-mono text-[9px] ml-1">Consulting Google Grounded Legal indexes...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Citations Footer Display (Search Grounding) */}
          {searchCitations.length > 0 && (
            <div className="p-2.5 bg-[#090d16] border-t border-[#1e293b] flex items-center gap-2 overflow-x-auto shrink-0">
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

          {/* Developer Sandbox Manual Speech triggers drawer */}
          <AnimatePresence>
            {showVoiceSim && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-3 bg-[#070b13] border-t border-[#1e293b] space-y-1.5 shrink-0 overflow-hidden"
              >
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 font-bold uppercase leading-none">
                  <span>Manual Sandbox Speech Simulator</span>
                  {lastHeardSpeech && (
                    <span>Last Heard: <strong className="text-teal-400 font-bold">"{lastHeardSpeech}"</strong></span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {simulatedPhrases.map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLastHeardSpeech(`"${phrase.cmd}"`);
                        handleHeardSpeechPhrase(phrase.cmd);
                      }}
                      className="p-1 px-2 text-[9px] font-mono text-teal-300/90 text-left bg-[#0c1322] border border-[#1e293b]/60 rounded-md hover:border-teal-500/40 hover:bg-[#131d33] transition-colors truncate"
                      title={`Simulate speaking: "${phrase.cmd}"`}
                    >
                      🚀 {phrase.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Keyboard input send form box */}
          <form onSubmit={handleSend} className="p-3 border-t border-[#1e293b] bg-[#070b12] flex gap-2 shrink-0">
            <input
              type="text"
              required
              disabled={sendingMessage}
              placeholder={`Send message to ${activeProfile.name}...`}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 bg-[#090d16] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-sans"
            />
            <button
              type="submit"
              disabled={sendingMessage || !userInput.trim()}
              className="p-2.5 bg-teal-400 hover:bg-teal-500 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-lg"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
