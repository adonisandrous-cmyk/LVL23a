import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Download,
  Copy,
  Check,
  Sparkles,
  Sliders,
  RefreshCw,
  X,
  FileText,
  User,
  Briefcase,
  Scale,
  Mic,
  Headphones,
  Radio,
  Zap,
  Info
} from 'lucide-react';
import { Client, Matter } from '../types';

interface TextToVoiceProvisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClient?: Client | null;
  activeMatter?: Matter | null;
}

export type VoicePersona = 'Fenrir' | 'Kore' | 'Zephyr' | 'Puck' | 'Charon';

interface VoiceOption {
  id: VoicePersona;
  name: string;
  role: string;
  tone: string;
  gender: string;
  accent: string;
  badgeColor: string;
}

const VOICE_ROSTER: VoiceOption[] = [
  {
    id: 'Fenrir',
    name: 'Phoenix Senior Counsel',
    role: 'Managing Partner & Chief Trial Strategist',
    tone: 'Authoritative, resonant, measured courtroom presence',
    gender: 'Male',
    accent: 'US Legal (Distinguished)',
    badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-500/10'
  },
  {
    id: 'Kore',
    name: 'EVE Legal Operations',
    role: 'Director of Legal Intake & Procedural Compliance',
    tone: 'Poised, crisp, highly articulate partner cadence',
    gender: 'Female',
    accent: 'US Standard Executive',
    badgeColor: 'border-teal-500/40 text-teal-300 bg-teal-500/10'
  },
  {
    id: 'Zephyr',
    name: 'Zephyr ADR Arbiter',
    role: 'Mediation & Commercial Dispute Specialist',
    tone: 'Calm, analytical, measured neutral evaluator',
    gender: 'Neutral/Male',
    accent: 'Standard Neutral',
    badgeColor: 'border-indigo-500/40 text-indigo-300 bg-indigo-500/10'
  },
  {
    id: 'Puck',
    name: 'Puck Litigation Advocate',
    role: 'Trial Associate & Evidence Marshalling',
    tone: 'Energetic, persuasive, fast-paced appellate oralist',
    gender: 'Male',
    accent: 'US Dynamic',
    badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
  },
  {
    id: 'Charon',
    name: 'Charon Docket Clerk',
    role: 'Court Reporter & Register of Actions',
    tone: 'Solemn, clear, steady procedural reader',
    gender: 'Male',
    accent: 'Official Docket Cadence',
    badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-500/10'
  }
];

export const TextToVoiceProvisionModal: React.FC<TextToVoiceProvisionModalProps> = ({
  isOpen,
  onClose,
  activeClient,
  activeMatter
}) => {
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>('Fenrir');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [selectedPreset, setSelectedPreset] = useState<'matter' | 'statute' | 'intake' | 'custom'>('matter');
  const [textInput, setTextInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeEngine, setActiveEngine] = useState<'gemini-tts' | 'web-speech' | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Generate dynamic presets based on active client or matter
  useEffect(() => {
    if (selectedPreset === 'matter') {
      const clientName = activeClient?.name || 'Marcus Vance';
      const matterTitle = activeMatter?.title || 'Dissolution of Marriage with Minor Children';
      const caseNumber = activeMatter?.caseNumber || '26FL004812C';
      const court = 'Orange County Superior Court, Lamoreaux Justice Center';

      setTextInput(
        `Official Matter Briefing. Matter: ${matterTitle}. Case Number: ${caseNumber}. Client of Record: ${clientName}. Jurisdiction: ${court}. ` +
        `Controlling California authorities: California Family Code Section 2310, Section 4320, and Section 770. ` +
        `Current litigation posture: Initial pleadings filed. Mandatory financial disclosures pending preliminary exchange within thirty statutory days. ` +
        `All responsive declarations and UCCJEA declarations verified for court filing.`
      );
    } else if (selectedPreset === 'statute') {
      setTextInput(
        `Judicial Council Form Statutory Synthesis. Form FL-120: Response and Request for Dissolution of Marriage. ` +
        `Adopted for Mandatory Use under California Code of Civil Procedure Section 415.10 and California Rules of Court Rule 5.62. ` +
        `Party of Record: Respondent enters general appearance and asserts statutory rights under California Family Code Section 4336 ` +
        `reserving court jurisdiction regarding spousal support. Equal division of community estate requested under Family Code Section 2550.`
      );
    } else if (selectedPreset === 'intake') {
      const clientName = activeClient?.name || 'Elena Vance';
      const phone = activeClient?.phone || '(949) 555-0123';
      const area = activeClient?.practiceArea || 'Family Law & Civil Litigation';

      setTextInput(
        `Client Intake Briefing for ${clientName}. Practice Area: ${area}. Primary Contact Phone: ${phone}. ` +
        `Document analysis completed across eighteen extracted canonical fields. Identity, residency qualifications, ` +
        `and verified financial disclosures have been synchronized into the firm encrypted database.`
      );
    }
  }, [selectedPreset, activeClient, activeMatter]);

  // Clean up audio on unmount or close
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const handleSpeak = async () => {
    if (!textInput.trim()) return;

    stopSpeech();
    setIsLoading(true);
    setErrorMessage(null);

    const voiceMeta = VOICE_ROSTER.find(v => v.id === selectedVoice);

    try {
      // 1. Attempt Gemini 3.8 Flash Lite TTS endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textInput,
          voice: selectedVoice,
          style: voiceMeta?.tone || 'Authoritative legal counsel',
          rate: speechRate
        })
      });

      const data = await response.json();

      if (data.success && data.audioBase64) {
        // High fidelity WAV stream generated by Gemini TTS
        const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        setAudioUrl(audioSrc);
        setActiveEngine('gemini-tts');

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = audioSrc;
        audioRef.current.playbackRate = speechRate;

        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
        audioRef.current.onerror = () => {
          console.warn('Audio element error, falling back to Web Speech Synthesis.');
          fallbackToWebSpeech();
        };

        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
        return;
      }

      // If backend signaled fallback or no base64 returned, use browser Web Speech
      fallbackToWebSpeech();
    } catch (err: any) {
      console.warn('Backend TTS request error, activating Web Speech fallback:', err);
      fallbackToWebSpeech();
    }
  };

  const fallbackToWebSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setErrorMessage('Speech synthesis is not supported on this device/browser.');
      setIsLoading(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textInput);
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;

      // Select matching browser voice
      const voices = window.speechSynthesis.getVoices();
      const isFemale = selectedVoice === 'Kore';
      const targetLang = 'en';

      const match = voices.find(v => {
        const name = v.name.toLowerCase();
        if (isFemale) {
          return (name.includes('female') || name.includes('samantha') || name.includes('zira') || name.includes('victoria') || name.includes('karen')) && v.lang.startsWith(targetLang);
        } else {
          return (name.includes('male') || name.includes('daniel') || name.includes('david') || name.includes('george') || name.includes('alex')) && v.lang.startsWith(targetLang);
        }
      }) || voices.find(v => v.lang.startsWith('en')) || voices[0];

      if (match) {
        utterance.voice = match;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
        setActiveEngine('web-speech');
      };

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = (e) => {
        console.warn('Web speech error:', e);
        setIsPlaying(false);
        setIsLoading(false);
      };

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (synthErr: any) {
      setErrorMessage(synthErr?.message || 'Failed to start voice playback.');
      setIsLoading(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(textInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWav = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `Legal_Audio_Briefing_${selectedVoice}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-4xl bg-[#0a0f1d] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="p-4 px-6 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-wide">Text-to-Voice Provision</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase">
                    Gemini 3.8 Flash Lite TTS
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Natural courtroom dictation, client audio briefings & statutory recitation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                stopSpeech();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Presets & Quick Selectors */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Select Briefing Preset</span>
                <span className="text-[10px] text-amber-400 font-normal">One-click legal audio templates</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'matter', label: 'Active Matter Dossier', icon: Briefcase },
                  { id: 'statute', label: 'Judicial Form Recitation', icon: Scale },
                  { id: 'intake', label: 'Client Intake Summary', icon: User },
                  { id: 'custom', label: 'Custom Dictation', icon: FileText }
                ].map(preset => {
                  const Icon = preset.icon;
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPreset(preset.id as any)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.15)] font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="text-xs truncate">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice Personas Selection */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Select Legal Voice Persona</span>
                <span className="text-[10px] text-slate-500 font-normal">Prebuilt 24kHz Studio Neural Voices</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {VOICE_ROSTER.map(v => {
                  const isSelected = selectedVoice === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/50'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-100">{v.name}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${v.badgeColor}`}>
                              {v.gender}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">{v.role}</span>
                        </div>
                        <Radio className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-amber-400 fill-amber-400/20' : 'text-slate-600'}`} />
                      </div>
                      <p className="text-[11px] text-slate-400 italic mt-2 leading-tight">
                        "{v.tone}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Speech Text Input Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                  Script Text to Dictate & Recite
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {textInput.length} characters
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={5}
                className="w-full p-3.5 bg-slate-950 border border-slate-800 focus:border-amber-500/60 rounded-xl text-xs text-slate-200 font-serif leading-relaxed focus:outline-none resize-none"
                placeholder="Type or paste legal brief, statute, or client summary to read aloud..."
              />
            </div>

            {/* Sliders: Rate & Cadence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-900/40 border border-slate-800 rounded-xl">
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span>Pacing / Delivery Rate</span>
                  <span className="text-amber-400 font-bold">{speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSpeechRate(val);
                    if (audioRef.current) audioRef.current.playbackRate = val;
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>0.75x (Deliberate Courtroom)</span>
                  <span>1.0x (Standard)</span>
                  <span>1.5x (Fast Review)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span>Pitch / Pitch Modulation</span>
                  <span className="text-amber-400 font-bold">{speechPitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>Deep / Resonant</span>
                  <span>Natural</span>
                  <span>Crisp / Elevated</span>
                </div>
              </div>
            </div>

            {/* Live Playback Indicator & Animated Visualizer */}
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 animate-pulse">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-200 block">Speaking with {selectedVoice}</span>
                    <span className="text-[10px] font-mono text-amber-400/80">
                      Engine: {activeEngine === 'gemini-tts' ? 'Gemini 3.8 Flash Lite Studio WAV' : 'Browser Neural Speech Engine'}
                    </span>
                  </div>
                </div>

                {/* Animated Waveform equalizer bars */}
                <div className="flex items-end gap-1 h-6">
                  {[40, 75, 55, 90, 60, 100, 45, 80, 65, 95, 50, 85].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [`${h * 0.2}%`, `${h}%`, `${h * 0.3}%`] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6 + (i % 4) * 0.15,
                        ease: 'easeInOut'
                      }}
                      className="w-1 bg-amber-400 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <Info className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 px-6 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isPlaying ? (
                <button
                  type="button"
                  onClick={stopSpeech}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-mono font-bold text-xs uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-lg transition-all"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Speech</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isLoading || !textInput.trim()}
                  onClick={handleSpeak}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-mono font-black text-xs uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <Play className="w-4 h-4 fill-slate-950" />
                  )}
                  <span>{isLoading ? 'Synthesizing...' : 'Read Aloud Now'}</span>
                </button>
              )}

              {audioUrl && (
                <button
                  type="button"
                  onClick={handleDownloadWav}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-all"
                  title="Download .wav audio file"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download WAV</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1 text-[11px]">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Zero Latency Voice Provision</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  onClose();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-xl cursor-pointer transition-all border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TextToVoiceProvisionModal;
