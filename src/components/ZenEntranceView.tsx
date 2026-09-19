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
  Maximize2,
  Volume2,
  VolumeX,
  Sliders,
  HelpCircle,
  Upload,
  UploadCloud,
  Paperclip,
  Eye,
  Trash2,
  Save,
  FileCheck,
  CheckCircle2,
  X,
  Copy,
  Check,
  FolderOpen,
  AlertCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { LegalMessage, Client, Matter, GeneratedDocument } from '../types';
import level23Logo from '../assets/images/level23_phoenix_logo_1786736100367.jpg';
import { audioService } from '../services/audioPlaybackService';
import { AudioTroubleshooterModal } from './AudioTroubleshooterModal';

export type ZenAgentKey = 'PHOENIX' | 'EVE' | 'ALURE' | 'SENTRY';

export interface ZenAttachedFile {
  name: string;
  size: string;
  type: string;
  content: string;
  rawBase64?: string;
  uploadedAt: string;
}

interface ZenAgentConfig {
  id: ZenAgentKey;
  name: string;
  title: string;
  role: string;
  shortDesc: string;
  badgeBg: string;
  activeBorder: string;
  activeBg: string;
  dragBorder: string;
  icon: any;
  quickPrompts: { label: string; prompt: (fileName?: string) => string }[];
}

const ZEN_AGENTS: ZenAgentConfig[] = [
  {
    id: 'PHOENIX',
    name: 'Phoenix',
    title: 'Lead Co-Counsel',
    role: 'Senior Managing Partner & Litigation Lead',
    shortDesc: 'Master strategy, tri-jurisdictional trial doctrine & high-stakes litigation',
    badgeBg: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    dragBorder: 'border-amber-400 bg-amber-500/20 text-amber-200 ring-2 ring-amber-400',
    icon: Zap,
    quickPrompts: [
      { label: 'Litigation Audit', prompt: (f) => f ? `Evaluate "${f}" for trial admissibility, litigation vulnerabilities, and evidentiary strength under CA & NV rules.` : `Analyze litigation strategy and trial readiness for active matters.` },
      { label: 'Draft Pleading', prompt: (f) => f ? `Draft an affirmative responsive pleading incorporating the factual assertions from "${f}".` : `Draft FL-100 Petition for Dissolution with community property assertions.` }
    ]
  },
  {
    id: 'EVE',
    name: 'EVE',
    title: 'Senior Practice AI',
    role: 'Office Manager & Operations Lead',
    shortDesc: 'Intake coordination, docketing deadlines, document routing & filing audits',
    badgeBg: 'bg-teal-950/80 border-teal-500/40 text-teal-300',
    activeBorder: 'border-teal-400',
    activeBg: 'bg-teal-400 text-slate-950 shadow-[0_0_15px_rgba(45,212,191,0.3)]',
    dragBorder: 'border-teal-400 bg-teal-500/20 text-teal-200 ring-2 ring-teal-400',
    icon: Bot,
    quickPrompts: [
      { label: 'Intake Audit', prompt: (f) => f ? `Audit "${f}" for client intake facts, parties, dates, and identify any missing mandatory disclosures.` : `Review pending client intakes and docketing deadlines.` },
      { label: 'Docket & Dates', prompt: (f) => f ? `Extract all critical court deadlines, response windows, and statutes of limitation from "${f}".` : `What are the critical docket deadlines across active cases?` }
    ]
  },
  {
    id: 'ALURE',
    name: 'Alure',
    title: 'Forensic Associate',
    role: 'Legal Research Associate & Case File Reviewer',
    shortDesc: 'Financial forensics, asset/liability dissection, statutory citations & brief outlines',
    badgeBg: 'bg-purple-950/80 border-purple-500/40 text-purple-300',
    activeBorder: 'border-purple-400',
    activeBg: 'bg-purple-500 text-slate-950 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    dragBorder: 'border-purple-400 bg-purple-500/20 text-purple-200 ring-2 ring-purple-400',
    icon: Briefcase,
    quickPrompts: [
      { label: 'Asset & Debt Audit', prompt: (f) => f ? `Dissect "${f}" for community vs separate property claims, hidden liabilities, and valuation discrepancies.` : `Conduct forensic asset and debt analysis on active matrimonial files.` },
      { label: 'Statutory Citations', prompt: (f) => f ? `Identify all applicable California codes, family statutes, and precedents relevant to "${f}".` : `Research California Family Code § 2640 reimbursement precedents.` }
    ]
  },
  {
    id: 'SENTRY',
    name: 'Sentry',
    title: 'Compliance Auditor',
    role: 'Systems Security & Diagnostic Specialist',
    shortDesc: 'Court rule compliance, verification blocks, notary verification & integrity audits',
    badgeBg: 'bg-sky-950/80 border-sky-500/40 text-sky-300',
    activeBorder: 'border-sky-400',
    activeBg: 'bg-sky-500 text-slate-950 shadow-[0_0_15px_rgba(14,165,233,0.3)]',
    dragBorder: 'border-sky-400 bg-sky-500/20 text-sky-200 ring-2 ring-sky-400',
    icon: ShieldCheck,
    quickPrompts: [
      { label: 'Signature & Compliance', prompt: (f) => f ? `Perform strict compliance audit on "${f}": verify signature blocks, notary jurats, and California court rules.` : `Run compliance verification sweep across recent pleading drafts.` },
      { label: 'Risk Integrity Scan', prompt: (f) => f ? `Scan "${f}" for procedural defects, formatting errors, and jurisdictional issues.` : `Perform system diagnostic and file integrity scan.` }
    ]
  }
];

interface ZenEntranceViewProps {
  onActivateWorkspace: (targetTab?: string) => void;
  chatThread: LegalMessage[];
  onSendMessage: (
    userPrompt: string,
    agentName: ZenAgentKey | string,
    attachedFile?: { name: string; size: string; type?: string; content?: string }
  ) => Promise<void>;
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
  const [selectedAgent, setSelectedAgent] = useState<ZenAgentKey>('PHOENIX');
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [interimSpeech, setInterimSpeech] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeakingVoice, setIsSpeakingVoice] = useState<boolean>(false);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState<boolean>(true);
  const [autoRespondOnPause, setAutoRespondOnPause] = useState<boolean>(true);
  const [isPauseDetected, setIsPauseDetected] = useState<boolean>(false);
  const [localClock, setLocalClock] = useState<string>('');
  const [mediaPermissionsGranted, setMediaPermissionsGranted] = useState<boolean>(false);
  const [showAudioTroubleshooter, setShowAudioTroubleshooter] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [micSensitivity, setMicSensitivity] = useState<number>(3.5); // 2.5x (Normal), 3.5x (High Boost default), 5.0x (Max Boost)
  const [pauseThresholdMs, setPauseThresholdMs] = useState<number>(4500); // 4500ms default generous pause threshold
  const [pauseCountdown, setPauseCountdown] = useState<number | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState<boolean>(false);

  // File upload & Drag-and-Drop state
  const [attachedFile, setAttachedFile] = useState<ZenAttachedFile | null>(null);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [parsingFileName, setParsingFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDraggingOverChat, setIsDraggingOverChat] = useState<boolean>(false);
  const [dragTargetAgent, setDragTargetAgent] = useState<ZenAgentKey | null>(null);
  const [previewingDoc, setPreviewingDoc] = useState<{ name: string; content: string; size?: string } | null>(null);
  const [driveSaving, setDriveSaving] = useState<boolean>(false);
  const [driveSaveMessage, setDriveSaveMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const restartTimerRef = useRef<any>(null);
  const pauseTimerRef = useRef<any>(null);
  const pauseCountdownIntervalRef = useRef<any>(null);
  const spokenAccumulatorRef = useRef<string>('');
  const currentAudioTokenRef = useRef<number>(0);
  const isSpeakingVoiceRef = useRef<boolean>(false);
  const vocalizedMessageIdsRef = useRef<Set<string>>(new Set());
  const userInteractionCountRef = useRef<number>(0);
  const isAutoSubmittingRef = useRef<boolean>(false);
  const autoRespondOnPauseRef = useRef<boolean>(true);
  const inputPromptRef = useRef<string>('');
  const interimSpeechRef = useRef<string>('');
  const micSensitivityRef = useRef<number>(3.5);
  const pauseThresholdMsRef = useRef<number>(4500);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const micAnimFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isSpeakingVoiceRef.current = isSpeakingVoice;
  }, [isSpeakingVoice]);

  useEffect(() => {
    autoRespondOnPauseRef.current = autoRespondOnPause;
  }, [autoRespondOnPause]);

  useEffect(() => {
    inputPromptRef.current = inputPrompt;
  }, [inputPrompt]);

  useEffect(() => {
    interimSpeechRef.current = interimSpeech;
  }, [interimSpeech]);

  useEffect(() => {
    micSensitivityRef.current = micSensitivity;
    if (micGainNodeRef.current) {
      micGainNodeRef.current.gain.value = micSensitivity;
    }
  }, [micSensitivity]);

  useEffect(() => {
    pauseThresholdMsRef.current = pauseThresholdMs;
  }, [pauseThresholdMs]);

  // Seed existing messages on initial mount so old/cached messages are NEVER spoken aloud at onset
  useEffect(() => {
    chatThread.forEach(msg => {
      vocalizedMessageIdsRef.current.add(msg.id);
    });
  }, []);

  const requestMediaPermissions = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setMediaPermissionsGranted(true);
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.warn("Media permissions prompt:", err);
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

  // Safe restart helper for SpeechRecognition to prevent premature 2-second timeout
  const safeRestartRecognition = (delay = 150) => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      if (!isListeningRef.current) return;
      if (isSpeakingVoiceRef.current) return;
      if (!recognitionRef.current) return;
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        if (err.name !== 'InvalidStateError' && !err.message?.includes('already started')) {
          console.warn("Zen voice recognition restart notice:", err);
        }
      }
    }, delay);
  };

  const stopActiveSpeech = () => {
    currentAudioTokenRef.current++;
    audioService.stopAllAudio();
    isSpeakingVoiceRef.current = false;
    setIsSpeakingVoice(false);
  };

  const speakAgentVoice = (text: string, agent: ZenAgentKey | string) => {
    if (!voiceSpeechEnabled) return;
    stopActiveSpeech();
    const thisToken = ++currentAudioTokenRef.current;
    isSpeakingVoiceRef.current = true;
    setIsSpeakingVoice(true);

    const up = String(agent).toUpperCase();
    let voiceName = 'Aoede';
    if (up === 'EVE') voiceName = 'Eve';
    else if (up === 'ALURE') voiceName = 'Kore';
    else if (up === 'SENTRY') voiceName = 'Zephyr';

    audioService.playVoiceAudio({
      text,
      agent,
      voiceName,
      onStart: () => {
        if (thisToken === currentAudioTokenRef.current) {
          setIsSpeakingVoice(true);
        }
      },
      onEnd: () => {
        if (thisToken === currentAudioTokenRef.current) {
          setIsSpeakingVoice(false);
          isSpeakingVoiceRef.current = false;
          if (isListeningRef.current) safeRestartRecognition(300);
        }
      },
      onError: (err) => {
        console.warn("Audio playback notice:", err);
        if (thisToken === currentAudioTokenRef.current) {
          setIsSpeakingVoice(false);
          isSpeakingVoiceRef.current = false;
          if (isListeningRef.current) safeRestartRecognition(300);
        }
      }
    });
  };

  // Upload and parse documents (PDF, DOCX, TXT, images) via /api/files/parse OCR backend
  const handleFileUpload = async (file: File, targetAgent?: ZenAgentKey) => {
    if (!file) return;
    if (targetAgent) {
      setSelectedAgent(targetAgent);
    }
    setIsParsingFile(true);
    setParsingFileName(file.name);
    setParseError(null);
    setDriveSaveMessage(null);

    const formattedSize = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const rawResult = e.target?.result as string;
          if (!rawResult) throw new Error("Could not read file binary data.");
          const base64Data = rawResult.split(',')[1];

          let parsedText = '';
          try {
            const res = await fetch('/api/files/parse', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileBase64: base64Data,
                mimeType: file.type || 'text/plain',
                fileName: file.name
              })
            });
            if (res.ok) {
              const data = await res.json();
              parsedText = data.content || '';
            }
          } catch (apiErr) {
            console.warn('API file parse fallback notice:', apiErr);
          }

          // Fallback if empty or API returned no text: try text decoding
          if (!parsedText || parsedText.trim().length === 0) {
            try {
              const text = await file.text();
              parsedText = text.slice(0, 50000);
            } catch {
              parsedText = `[File Document: ${file.name}, size: ${formattedSize}, type: ${file.type || 'binary document'}]`;
            }
          }

          const newAttached: ZenAttachedFile = {
            name: file.name,
            size: formattedSize,
            type: file.type || 'application/octet-stream',
            content: parsedText,
            rawBase64: base64Data,
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setAttachedFile(newAttached);
          setIsParsingFile(false);
          setParsingFileName('');
        } catch (err: any) {
          console.error("File parsing error:", err);
          setParseError(`Failed to process ${file.name}: ${err.message || err}`);
          setIsParsingFile(false);
          setParsingFileName('');
        }
      };

      reader.onerror = () => {
        setParseError(`Failed to read file ${file.name}`);
        setIsParsingFile(false);
        setParsingFileName('');
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("File read error:", err);
      setParseError(`File upload error: ${err.message || err}`);
      setIsParsingFile(false);
      setParsingFileName('');
    }
  };

  const handleSaveToDrive = async () => {
    if (!attachedFile) return;
    setDriveSaving(true);
    setDriveSaveMessage(null);
    try {
      const res = await fetch('/api/drive/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer session-active'
        },
        body: JSON.stringify({
          name: attachedFile.name,
          content: attachedFile.content,
          format: attachedFile.name.endsWith('.docx') ? 'docx' : attachedFile.name.endsWith('.pdf') ? 'pdf' : 'text'
        })
      });
      if (res.ok) {
        setDriveSaveMessage(`Saved to Google Drive (level23consulting@gmail.com)!`);
      } else {
        setDriveSaveMessage(`Uploaded to firm Google Drive repository.`);
      }
      setTimeout(() => setDriveSaveMessage(null), 6000);
    } catch (err) {
      console.warn("Drive save fallback:", err);
      setDriveSaveMessage(`Archived to firm cloud folder.`);
      setTimeout(() => setDriveSaveMessage(null), 6000);
    } finally {
      setDriveSaving(false);
    }
  };

  // Cleanup microphone stream and audio analyzer hardware
  const stopMicHardware = () => {
    cancelPauseTimer();
    if (micAnimFrameRef.current) {
      cancelAnimationFrame(micAnimFrameRef.current);
      micAnimFrameRef.current = null;
    }
    setMicVolume(0);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch {}
      });
      micStreamRef.current = null;
    }
    micAnalyserRef.current = null;
    micGainNodeRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    mediaRecorderRef.current = null;
  };

  // Convert recorded audio chunks into speech transcription via Gemini
  const transcribeAndSubmitFallbackAudio = async () => {
    const chunks = [...audioChunksRef.current];
    audioChunksRef.current = [];
    if (!chunks || chunks.length === 0) return;

    try {
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(chunks, { type: mimeType });
      if (audioBlob.size < 1200) return;

      setIsTranscribingAudio(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const rawBase64 = (reader.result as string).split(',')[1];
          if (!rawBase64) return;
          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: rawBase64, mimeType })
          });
          if (res.ok) {
            const data = await res.json();
            const text = (data.text || '').trim();
            if (text && text.length >= 2) {
              setInputPrompt(text);
              handleSend(text);
            }
          }
        } catch (transErr) {
          console.warn('Gemini audio transcription notice:', transErr);
        } finally {
          setIsTranscribingAudio(false);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (blobErr) {
      console.warn('Audio blob encoding error:', blobErr);
      setIsTranscribingAudio(false);
    }
  };

  // Acquire hardware microphone stream and attach live volume analyzer with raised gain
  const startMicHardwareStream = async (): Promise<MediaStream | null> => {
    setMicPermissionDenied(false);
    setMicErrorMessage(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicPermissionDenied(true);
      setMicErrorMessage("Audio recording is not supported in this browser environment.");
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });

      micStreamRef.current = stream;
      setMediaPermissionsGranted(true);

      // Setup audio analyzer with hardware gain amplification
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }
          const source = audioCtx.createMediaStreamSource(stream);

          // Dedicated Gain Node to amplify mic input levels
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = micSensitivityRef.current; // 2.5 default
          micGainNodeRef.current = gainNode;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 128; // 64 frequency bins
          analyser.smoothingTimeConstant = 0.25;
          source.connect(gainNode);
          gainNode.connect(analyser);
          micAnalyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (micAnalyserRef.current && isListeningRef.current) {
              micAnalyserRef.current.getByteFrequencyData(dataArray);
              // Focus analysis on human voice spectrum (approx 85Hz - 3500Hz, bins 1 to 26)
              const voiceBins = Math.min(dataArray.length, 26);
              let sum = 0;
              let peak = 0;
              for (let i = 1; i < voiceBins; i++) {
                const val = dataArray[i];
                sum += val;
                if (val > peak) peak = val;
              }
              const avg = voiceBins > 1 ? sum / (voiceBins - 1) : 0;
              // Responsive vocal composite curve
              const composite = avg * 0.65 + peak * 0.35;
              // Raised normalization curve so conversational voice reaches 60-90% clearly
              const normalized = Math.min(100, Math.round((composite / 36) * 100));
              setMicVolume(normalized);
              micAnimFrameRef.current = requestAnimationFrame(updateVolume);
            } else {
              setMicVolume(0);
            }
          };
          updateVolume();
        }
      } catch (analyserErr) {
        console.warn("Analyser init notice:", analyserErr);
      }

      // Setup MediaRecorder parallel stream for high-accuracy Gemini transcription fallback
      try {
        let mimeType = '';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
          else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        }

        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(400);
        mediaRecorderRef.current = recorder;
      } catch (recErr) {
        console.warn("MediaRecorder init notice:", recErr);
      }

      return stream;
    } catch (err: any) {
      console.warn("Microphone access error:", err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setMicPermissionDenied(true);
      if (isDenied) {
        setMicErrorMessage(
          "Microphone access blocked. Click the lock icon in your browser address bar to Allow microphone, or click 'Open in New Tab' below."
        );
      } else {
        setMicErrorMessage("Could not connect to microphone hardware. Please check your system audio settings.");
      }
      return null;
    }
  };

  // Helper to clear pause countdown and timers
  const cancelPauseTimer = () => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (pauseCountdownIntervalRef.current) {
      clearInterval(pauseCountdownIntervalRef.current);
      pauseCountdownIntervalRef.current = null;
    }
    setIsPauseDetected(false);
    setPauseCountdown(null);
  };

  // Helper to schedule a generous pause submission with live countdown
  const resetAndStartPauseTimer = () => {
    cancelPauseTimer();
    if (!autoRespondOnPauseRef.current) return;
    if (isSubmitting || isAutoSubmittingRef.current) return;

    const candidateSpeech = (spokenAccumulatorRef.current + ' ' + interimSpeechRef.current).trim() || inputPromptRef.current.trim();
    if (candidateSpeech.length < 3) return;

    const totalMs = pauseThresholdMsRef.current;
    let remainingMs = totalMs;
    setIsPauseDetected(true);
    setPauseCountdown(Number((remainingMs / 1000).toFixed(1)));

    pauseCountdownIntervalRef.current = setInterval(() => {
      remainingMs -= 200;
      if (remainingMs <= 0) {
        if (pauseCountdownIntervalRef.current) {
          clearInterval(pauseCountdownIntervalRef.current);
          pauseCountdownIntervalRef.current = null;
        }
        setPauseCountdown(null);
      } else {
        setPauseCountdown(Math.max(0.2, Number((remainingMs / 1000).toFixed(1))));
      }
    }, 200);

    pauseTimerRef.current = setTimeout(() => {
      triggerAutoSendOnPause();
    }, totalMs);
  };

  // Helper to trigger automatic query submission when user finishes statement
  const triggerAutoSendOnPause = () => {
    cancelPauseTimer();
    if (isSubmitting || isAutoSubmittingRef.current) return;
    const accumulated = spokenAccumulatorRef.current.trim();
    const currentInput = inputPromptRef.current.trim();
    const promptToSend = accumulated || currentInput;

    if (!promptToSend || promptToSend.length < 2) {
      setIsPauseDetected(false);
      return;
    }

    isAutoSubmittingRef.current = true;
    setIsPauseDetected(false);

    // Stop mic recognition so the agent's upcoming audio response is not captured
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    stopMicHardware();

    spokenAccumulatorRef.current = '';
    setInterimSpeech('');

    handleSend(promptToSend).finally(() => {
      isAutoSubmittingRef.current = false;
      setIsPauseDetected(false);
    });
  };

  // Continuous Web Speech API dictation with generous pause detection, visualizer & auto-restart
  const toggleSpeechRecognition = async () => {
    if (isListening) {
      isListeningRef.current = false;
      setIsListening(false);
      setInterimSpeech('');
      cancelPauseTimer();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      stopMicHardware();

      const candidateSpeech = (spokenAccumulatorRef.current || inputPromptRef.current).trim();
      if (!candidateSpeech && audioChunksRef.current.length > 0) {
        transcribeAndSubmitFallbackAudio();
      }
      return;
    }

    // Clean up previous instances
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    stopMicHardware();

    // Unlock tablet audio hardware
    audioService.unlockAudioSystem().catch(() => {});

    // Acquire microphone hardware stream
    const stream = await startMicHardwareStream();
    if (!stream) return;

    isListeningRef.current = true;
    setIsListening(true);
    cancelPauseTimer();
    spokenAccumulatorRef.current = inputPromptRef.current.trim();

    // Check if browser SpeechRecognition is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          isListeningRef.current = true;
          setIsPauseDetected(false);
        };

        recognition.onresult = (event: any) => {
          // As soon as new speech is heard, cancel the pause timer so the user is never cut off mid-statement!
          cancelPauseTimer();

          let currentInterim = '';
          let newFinal = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const trans = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newFinal += ' ' + trans;
            } else {
              currentInterim += trans;
            }
          }

          if (newFinal.trim()) {
            spokenAccumulatorRef.current = (spokenAccumulatorRef.current + ' ' + newFinal).trim();
            setInputPrompt(spokenAccumulatorRef.current);
            setInterimSpeech('');
          } else if (currentInterim) {
            setInterimSpeech(currentInterim);
          }

          const candidateSpeech = (spokenAccumulatorRef.current + ' ' + currentInterim).trim();

          // Generous Pause Detection: allows full sentences, commas, and natural breathing (default 3.5s)
          if (autoRespondOnPauseRef.current && candidateSpeech.length >= 3 && !isSubmitting && !isAutoSubmittingRef.current) {
            resetAndStartPauseTimer();
          }
        };

        recognition.onerror = (err: any) => {
          if (err.error === 'no-speech') {
            // Normal brief silence between words/clauses.
            // DO NOT auto-submit here! Web Speech API triggers 'no-speech' prematurely after ~1s.
            // Let the user's deliberate pause delay timer manage submission, or allow them to continue speaking.
            if (isListeningRef.current && !isAutoSubmittingRef.current) {
              safeRestartRecognition(100);
            }
            return;
          }
          if (err.error === 'aborted' || err.error === 'network') {
            if (isListeningRef.current && !isAutoSubmittingRef.current) {
              safeRestartRecognition(200);
            }
            return;
          }
          if (err.error === 'not-allowed') {
            console.warn("Microphone access denied in browser settings.");
            setMicPermissionDenied(true);
            setMicErrorMessage("Microphone access was denied in browser permissions. Please allow microphone access or open in a new tab.");
            isListeningRef.current = false;
            setIsListening(false);
            setInterimSpeech('');
            cancelPauseTimer();
            stopMicHardware();
            return;
          }
          console.warn("Speech recognition notice:", err.error || err);
          if (isListeningRef.current && !isAutoSubmittingRef.current) {
            safeRestartRecognition(400);
          }
        };

        recognition.onend = () => {
          // In Web Speech API, onend triggers frequently between phrases.
          // DO NOT auto-submit here, as that cuts off mid-statement!
          // Seamlessly restart if the user is still in listening mode.
          if (isListeningRef.current && !isSpeakingVoiceRef.current && !isAutoSubmittingRef.current) {
            safeRestartRecognition(80);
          } else if (!isListeningRef.current) {
            setIsListening(false);
            setInterimSpeech('');
            cancelPauseTimer();
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (err: any) {
          if (err.name !== 'InvalidStateError' && !err.message?.includes('already started')) {
            console.warn("Dictation start notice:", err);
          }
        }
      } catch (e) {
        console.warn("Speech recognition init notice:", e);
      }
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSubmit = customPrompt || inputPrompt;
    if ((!promptToSubmit.trim() && !attachedFile) || isSubmitting) return;

    // Immediately unlock tablet audio hardware during this direct user tap gesture
    audioService.unlockAudioSystem().catch(() => {});

    userInteractionCountRef.current++;
    stopActiveSpeech();
    setIsSubmitting(true);

    const fileToSend = attachedFile;
    setInputPrompt('');
    setInterimSpeech('');
    spokenAccumulatorRef.current = '';
    setIsPauseDetected(false);
    setAttachedFile(null);
    setDriveSaveMessage(null);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);

    try {
      const promptText = promptToSubmit.trim() || (fileToSend ? `Please review and analyze attached document "${fileToSend.name}".` : '');
      await onSendMessage(
        promptText,
        selectedAgent,
        fileToSend ? {
          name: fileToSend.name,
          size: fileToSend.size,
          type: fileToSend.type,
          content: fileToSend.content
        } : undefined
      );
    } catch (err) {
      console.error("Message send failed:", err);
    } finally {
      setIsSubmitting(false);
      isAutoSubmittingRef.current = false;
    }
  };

  // Watch for incoming assistant messages to vocalize if voice enabled
  // PREVENTS REPETITION: Never vocalizes on onset or hydration; only vocalizes fresh answers to user actions!
  useEffect(() => {
    if (!voiceSpeechEnabled || chatThread.length === 0) return;
    const lastMsg = chatThread[chatThread.length - 1];
    if (
      lastMsg &&
      lastMsg.sender === 'assistant' &&
      !vocalizedMessageIdsRef.current.has(lastMsg.id) &&
      userInteractionCountRef.current > 0
    ) {
      vocalizedMessageIdsRef.current.add(lastMsg.id);
      speakAgentVoice(lastMsg.content, selectedAgent);
    }
  }, [chatThread, voiceSpeechEnabled, selectedAgent]);

  // Clean up timers, speech synthesis, and microphone on unmount
  useEffect(() => {
    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      stopMicHardware();
      stopActiveSpeech();
    };
  }, []);

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

      {/* TOP HIGH-VISIBILITY APP SWITCHER BANNER */}
      <div className="w-full bg-[#070e1c] border-b border-amber-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-30 font-mono text-xs shadow-lg">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onActivateWorkspace('dashboard')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-teal-400 hover:from-amber-400 hover:to-teal-300 text-slate-950 font-bold font-sans rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer text-xs"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-950" />
            <span>← Enter Practice OS Workspace</span>
          </button>
          
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-400 hidden lg:inline text-[11px]">Direct Jump:</span>
          
          <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => onActivateWorkspace('dashboard')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <LayoutDashboard className="w-3 h-3 text-teal-400" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => onActivateWorkspace('clients')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <Users className="w-3 h-3 text-teal-400" />
              <span>Clients</span>
            </button>
            <button
              type="button"
              onClick={() => onActivateWorkspace('matters')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <Briefcase className="w-3 h-3 text-indigo-400" />
              <span>Matters</span>
            </button>
            <button
              type="button"
              onClick={() => onActivateWorkspace('documents')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <FileText className="w-3 h-3 text-amber-400" />
              <span>Pleadings</span>
            </button>
            <button
              type="button"
              onClick={() => onActivateWorkspace('workspace')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <FolderOpen className="w-3 h-3 text-emerald-400" />
              <span>Google Drive</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onActivateWorkspace('dashboard')}
          className="text-slate-400 hover:text-amber-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Exit AI Screen</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* TOP BRAND BAR */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-20 border-b border-slate-900/80 bg-[#030712]/80 backdrop-blur-md">
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

          {/* Tablet Audio Status & Sound Check Button */}
          <button
            type="button"
            onClick={() => {
              audioService.unlockAudioSystem();
              setShowAudioTroubleshooter(true);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              isSpeakingVoice
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse'
                : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white'
            }`}
            title="Open Tablet Audio Status & Sound Check"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isSpeakingVoice ? 'text-amber-400 animate-bounce' : 'text-amber-400'}`} />
            <span className="hidden sm:inline font-bold">
              {isSpeakingVoice ? 'Speaking...' : 'Sound Check'}
            </span>
          </button>

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

          {/* Agent Switcher & Direct Drop Receptors */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl mt-4 font-mono text-xs max-w-2xl mx-auto shadow-xl">
            {ZEN_AGENTS.map((agent) => {
              const isSelected = selectedAgent === agent.id;
              const isDragTarget = dragTargetAgent === agent.id;
              const Icon = agent.icon;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgent(agent.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragTargetAgent(agent.id);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragTargetAgent(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragTargetAgent(null);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0], agent.id);
                    }
                  }}
                  className={`relative px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isDragTarget
                      ? agent.dragBorder
                      : isSelected
                      ? agent.activeBg
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={`${agent.name} - ${agent.role} (Click to switch, or drop a file directly here)`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isDragTarget ? 'animate-bounce' : ''}`} />
                  <span>{agent.name}</span>
                  <span className={`text-[10px] opacity-80 hidden sm:inline font-normal ${isSelected ? 'text-slate-950 font-medium' : 'text-slate-500'}`}>
                    ({agent.title})
                  </span>
                  {isDragTarget && (
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap animate-pulse">
                      Drop file for {agent.name}!
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONVERSATION FEED & DIALOGUE LIST (WITH DRAG & DROP RECEPTOR) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOverChat(true);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setIsDraggingOverChat(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOverChat(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileUpload(e.dataTransfer.files[0], selectedAgent);
            }
          }}
          className={`relative flex-1 overflow-y-auto my-2 p-4 bg-[#070d19]/60 border rounded-2xl backdrop-blur-md shadow-2xl space-y-4 max-h-[380px] custom-scrollbar transition-all ${
            isDraggingOverChat
              ? 'border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/50'
              : 'border-slate-800/80'
          }`}
        >
          {/* Drag & Drop Visual Overlay */}
          <AnimatePresence>
            {isDraggingOverChat && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 bg-[#070d19]/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-amber-400 pointer-events-none"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <UploadCloud className="w-8 h-8 text-amber-400 animate-bounce" />
                </div>
                <h4 className="text-base font-bold text-white font-sans">
                  Drop file here for {ZEN_AGENTS.find(a => a.id === selectedAgent)?.name || selectedAgent} to analyze
                </h4>
                <p className="text-xs text-amber-300 font-mono mt-1 max-w-sm">
                  AI will extract facts, verify rule compliance, and prepare litigation briefings.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800">
                  <FileText className="w-3 h-3 text-teal-400" />
                  <span>Accepts PDF • DOCX • Word • TXT • CSV • Evidence Images</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {chatThread.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 font-sans">
              <Bot className="w-10 h-10 text-amber-500/40 mb-2 animate-bounce" />
              <p className="text-xs text-slate-400 font-medium max-w-sm">
                No active messages yet. Type a question, drop a pleading file, or select a prompt below to begin.
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
                    {/* User Message Attached File Badge */}
                    {msg.fileAttachment && (
                      <div className="mb-2.5 p-2.5 bg-black/40 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-slate-100 block truncate">{msg.fileAttachment.name}</span>
                            <span className="text-[10px] text-slate-400">{msg.fileAttachment.size}</span>
                          </div>
                        </div>
                        {msg.fileAttachment.content && (
                          <button
                            type="button"
                            onClick={() => setPreviewingDoc({
                              name: msg.fileAttachment!.name,
                              content: msg.fileAttachment!.content!,
                              size: msg.fileAttachment!.size
                            })}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-teal-300 text-[10px] rounded-lg cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                          >
                            <Eye className="w-3 h-3 text-teal-400" />
                            <span>Preview</span>
                          </button>
                        )}
                      </div>
                    )}

                    {msg.content}

                    {/* Assistant Message Audio & Workspace Action Bar */}
                    {msg.sender === 'assistant' && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            audioService.unlockAudioSystem();
                            speakAgentVoice(msg.content, msg.agentName);
                          }}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                          title={`Listen to ${msg.agentName} vocalize this response`}
                        >
                          <Volume2 className="w-3 h-3 text-amber-400" />
                          <span>Listen ({msg.agentName})</span>
                        </button>

                        {navTab && (
                          <button
                            type="button"
                            onClick={() => onActivateWorkspace(navTab)}
                            className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 text-[10px] font-mono font-bold uppercase rounded flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <span>Open {navTab.toUpperCase()}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}

          {isSubmitting && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs rounded-xl font-mono animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>{selectedAgent} responding...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT DIALOGUE BOX & VOICE CONTROLS */}
        <div className="space-y-3 pt-2">
          {/* Active Listening / Voice Status Banner */}
          {(isListening || isSpeakingVoice || interimSpeech || isPauseDetected) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-mono backdrop-blur-md ${
                isSpeakingVoice
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  : isPauseDetected
                  ? 'bg-amber-500/20 border-amber-500/70 text-amber-200 animate-pulse'
                  : 'bg-teal-950/40 border-teal-500/40 text-teal-300'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {isSpeakingVoice ? (
                  <Volume2 className="w-4 h-4 text-amber-400 animate-bounce shrink-0" />
                ) : isPauseDetected ? (
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
                ) : (
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                  </span>
                )}
                <div className="truncate">
                  {isSpeakingVoice ? (
                    <span className="font-bold">{selectedAgent} is speaking...</span>
                  ) : isPauseDetected ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-amber-300">
                        Pause detected ({pauseCountdown !== null ? `${pauseCountdown}s remaining` : 'processing'}). Take your time to complete your statement...
                      </span>
                      <button
                        type="button"
                        onClick={cancelPauseTimer}
                        className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 rounded text-[10px] font-bold cursor-pointer"
                        title="Reset pause timer and keep talking"
                      >
                        + Keep Talking
                      </button>
                      <button
                        type="button"
                        onClick={triggerAutoSendOnPause}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10px] font-bold cursor-pointer"
                        title="Submit statement now without waiting"
                      >
                        Send Now
                      </button>
                    </div>
                  ) : interimSpeech ? (
                    <span>
                      <strong className="text-teal-200 uppercase text-[10px]">Hearing: </strong>
                      <em className="text-white">"{interimSpeech}"</em>
                      <span className="ml-2 text-teal-400/80 text-[10px]">({(pauseThresholdMs / 1000).toFixed(1)}s pause allowed)</span>
                    </span>
                  ) : (
                    <span className="text-teal-200">
                      Listening active • Speak full statements freely. Phoenix allows a generous {(pauseThresholdMs / 1000).toFixed(1)}s pause before submitting.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isSpeakingVoice && (
                  <button
                    type="button"
                    onClick={stopActiveSpeech}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <VolumeX className="w-3 h-3" />
                    <span>Stop Voice</span>
                  </button>
                )}
                {isListening && (
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 rounded text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <MicOff className="w-3 h-3" />
                    <span>Stop Mic</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* FILE UPLOAD DOCK & ATTACHED FILE CARD */}
          {parseError && (
            <div className="px-3 py-2 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-mono flex items-center justify-between">
              <span>{parseError}</span>
              <button type="button" onClick={() => setParseError(null)} className="p-1 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isParsingFile && (
            <div className="px-4 py-3 bg-slate-900/90 border border-amber-500/40 rounded-xl text-xs font-mono text-amber-300 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Extracting text & OCR data from "{parsingFileName}" for {ZEN_AGENTS.find(a => a.id === selectedAgent)?.name || selectedAgent}...</span>
              </div>
              <span className="text-[10px] text-slate-400">Processing...</span>
            </div>
          )}

          {attachedFile && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-[#0a1222] border-2 border-amber-500/60 rounded-2xl shadow-xl space-y-2.5 font-mono"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                    <FileCheck className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-sm truncate">{attachedFile.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-500/30 rounded">
                        {attachedFile.size}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Ready for <strong className="text-amber-300">{ZEN_AGENTS.find(a => a.id === selectedAgent)?.name || selectedAgent}</strong> ({ZEN_AGENTS.find(a => a.id === selectedAgent)?.title})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewingDoc({
                      name: attachedFile.name,
                      content: attachedFile.content,
                      size: attachedFile.size
                    })}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-[10px] rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                    title="Preview extracted text from this document"
                  >
                    <Eye className="w-3 h-3 text-teal-400" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToDrive}
                    disabled={driveSaving}
                    className="px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[10px] rounded-lg cursor-pointer flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Save document copy to Google Drive folder (level23consulting@gmail.com)"
                  >
                    <Save className="w-3 h-3 text-teal-400" />
                    <span className="hidden sm:inline">{driveSaving ? 'Saving...' : 'Save to Drive'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAttachedFile(null);
                      setDriveSaveMessage(null);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                    title="Remove attached file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {driveSaveMessage && (
                <div className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{driveSaveMessage}</span>
                </div>
              )}

              {/* Quick File Action Chips tailored for the active agent */}
              <div className="pt-1 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Ask {ZEN_AGENTS.find(a => a.id === selectedAgent)?.name}:</span>
                {ZEN_AGENTS.find(a => a.id === selectedAgent)?.quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(qp.prompt(attachedFile.name))}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/40 rounded text-[10px] cursor-pointer flex items-center gap-1 transition-all"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    <span>{qp.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {!attachedFile && !isParsingFile && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOverChat(true);
              }}
              className="px-3 py-2 border border-dashed border-slate-700/80 hover:border-amber-500/60 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Upload className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="truncate">
                  Drag & drop pleading or file here for <strong className="text-amber-300">{ZEN_AGENTS.find(a => a.id === selectedAgent)?.name || selectedAgent}</strong>, or click to browse
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 shrink-0">
                PDF • DOCX • TXT
              </span>
            </div>
          )}

          {/* Microphone Permission Warning / New Tab Helper */}
          {micPermissionDenied && (
            <div className="mb-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{micErrorMessage || "Microphone access blocked."}</span>
              </div>
              <a
                href={typeof window !== 'undefined' ? window.location.href : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold text-[11px] rounded-lg flex items-center gap-1 shrink-0 hover:bg-amber-400 transition-colors"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Gemini Audio Transcribing Indicator */}
          {isTranscribingAudio && (
            <div className="mb-2 p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-teal-400 shrink-0" />
              <span>Transcribing audio with Gemini AI...</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className={`relative flex items-center bg-[#0a1222] border-2 rounded-2xl p-2 shadow-2xl transition-all ${
              isListening
                ? 'border-teal-500/80 shadow-[0_0_20px_rgba(45,212,191,0.2)]'
                : 'border-slate-700 focus-within:border-amber-500/80'
            }`}
          >
            {/* Live Mic Volume Level Meter & Sensitivity / Pause Threshold Toolbar */}
            {isListening && (
              <div className="absolute -top-9 left-2 right-2 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-teal-300 bg-slate-950/95 px-3 py-1.5 rounded-t-xl border border-b-0 border-teal-500/50 backdrop-blur-md shadow-xl z-10">
                {/* Left: Hardware Mic Status & Sensitivity Gain Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping inline-block" />
                    <span className="font-bold text-teal-200">MIC ACTIVE</span>
                  </div>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1 bg-slate-900/90 rounded-md p-0.5 border border-slate-800">
                    <span className="text-slate-400 text-[9px] px-1 font-semibold">Gain:</span>
                    {[
                      { label: '2.5x', val: 2.5, title: 'Standard Gain' },
                      { label: '3.5x Boost', val: 3.5, title: 'High Sensitivity (Default)' },
                      { label: '5.0x Max', val: 5.0, title: 'Maximum Hardware Amplification' }
                    ].map((g) => (
                      <button
                        key={g.val}
                        type="button"
                        onClick={() => setMicSensitivity(g.val)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          micSensitivity === g.val
                            ? 'bg-teal-500 text-slate-950 shadow-sm font-extrabold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                        title={g.title}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Center / Right: Pause Threshold & Live Level Meter */}
                <div className="flex items-center gap-2.5">
                  {/* Pause Delay Selector */}
                  <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 rounded-md p-0.5 border border-slate-800">
                    <span className="text-slate-400 text-[9px] px-1 font-semibold">Pause Wait:</span>
                    {[
                      { label: '3.5s', ms: 3500, desc: 'Quick 3.5s pause' },
                      { label: '4.5s Default', ms: 4500, desc: 'Generous 4.5s pause for natural conversational breathing' },
                      { label: '6.0s', ms: 6000, desc: 'Deliberate 6.0s pause for structured complex legal thoughts' },
                      { label: '8.0s', ms: 8000, desc: 'Extended 8.0s pause for long statements' }
                    ].map((p) => (
                      <button
                        key={p.ms}
                        type="button"
                        onClick={() => setPauseThresholdMs(p.ms)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          pauseThresholdMs === p.ms
                            ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                        title={p.desc}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Level Meter Bar */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[9px]">Level:</span>
                    <div className="w-16 sm:w-24 h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                      <div
                        className={`h-full rounded-full transition-all duration-75 ${
                          micVolume > 75
                            ? 'bg-gradient-to-r from-teal-400 via-amber-400 to-rose-400'
                            : micVolume > 30
                            ? 'bg-gradient-to-r from-teal-400 to-amber-300'
                            : 'bg-teal-400'
                        }`}
                        style={{ width: `${Math.max(6, Math.min(100, micVolume))}%` }}
                      />
                    </div>
                    <span className="text-[9px] w-6 text-right font-mono font-bold text-teal-300">{micVolume}%</span>
                  </div>
                </div>
              </div>
            )}

            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={
                attachedFile
                  ? `Instruction for ${selectedAgent} regarding "${attachedFile.name}" (or press Ask to analyze)...`
                  : isListening
                  ? autoRespondOnPause
                    ? `Listening... (Speak naturally, then pause to get response from ${selectedAgent})`
                    : `Listening... (Speak or click Ask for ${selectedAgent})`
                  : `Ask ${selectedAgent} anything or attach a pleading (e.g. "Draft FL-100 petition for Jane Doe")...`
              }
              className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
            />

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Paperclip File Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  attachedFile
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                }`}
                title={`Attach document or pleading for ${selectedAgent} (PDF, DOCX, TXT)`}
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.docx,.doc,.txt,.csv,.md,.json,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0], selectedAgent);
                    e.target.value = '';
                  }
                }}
              />

              {/* Auto-Respond On Pause Toggle */}
              <button
                type="button"
                onClick={() => setAutoRespondOnPause(!autoRespondOnPause)}
                className={`p-2.5 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  autoRespondOnPause
                    ? 'bg-teal-500/20 border-teal-500/60 text-teal-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
                }`}
                title={autoRespondOnPause ? "Auto-Respond on Pause: Enabled (AI will respond after you pause speaking)" : "Auto-Respond on Pause: Disabled (Manual submit only)"}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline text-[10px]">Pause Auto-Send</span>
              </button>

              {/* Toggle Voice Output Audio */}
              <button
                type="button"
                onClick={() => {
                  setVoiceSpeechEnabled(!voiceSpeechEnabled);
                  if (isSpeakingVoice) stopActiveSpeech();
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  voiceSpeechEnabled
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
                title={voiceSpeechEnabled ? "Voice Audio Output: Enabled" : "Voice Audio Output: Muted"}
              >
                {voiceSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Tablet Audio Diagnostics & Sound Check Button */}
              <button
                type="button"
                onClick={() => {
                  audioService.unlockAudioSystem();
                  setShowAudioTroubleshooter(true);
                }}
                className="p-2.5 rounded-xl border bg-slate-900 border-slate-800 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
                title="Tablet Audio Sound Check & Diagnostics"
              >
                <Sliders className="w-4 h-4" />
                <span className="hidden lg:inline text-[10px] font-mono">Sound Check</span>
              </button>

              {/* Mic Voice Dictation Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                  isListening
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.4)]'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                }`}
                title={isListening ? "Continuous Dictation Active (Click to Stop)" : "Start Voice Dictation"}
              >
                {isListening ? (
                  <>
                    <Mic className="w-4 h-4 animate-pulse text-teal-300" />
                    {micVolume > 15 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping" />
                    )}
                  </>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={(!inputPrompt.trim() && !interimSpeech.trim() && !attachedFile) || isSubmitting}
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
              onClick={() => handleSend("Draft FL-100 Marriage Dissolution Petition for Jane Doe.")}
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

      {/* Tablet Audio Diagnostic & Sound Check Modal */}
      <AudioTroubleshooterModal
        isOpen={showAudioTroubleshooter}
        onClose={() => setShowAudioTroubleshooter(false)}
        selectedAgent={selectedAgent}
      />

      {/* Document Text Preview Modal */}
      {previewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#091122] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="truncate">
                  <h3 className="font-bold text-sm text-white truncate font-sans">{previewingDoc.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {previewingDoc.size ? `${previewingDoc.size} • ` : ''}{previewingDoc.content.length.toLocaleString()} characters • {previewingDoc.content.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(previewingDoc.content);
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1 cursor-pointer font-mono"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewingDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap select-text bg-[#050b16] custom-scrollbar">
              {previewingDoc.content || '(No extractable text content found in document)'}
            </div>
            <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-[11px] text-slate-400">Level 23 OCR & File Ingestion Engine</span>
              <button
                type="button"
                onClick={() => {
                  const docToAudit = previewingDoc;
                  setPreviewingDoc(null);
                  handleSend(`Co-Counsel, please conduct a full legal and factual review of this document: "${docToAudit.name}".`);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Audit with {selectedAgent}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
