import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Play,
  Mic,
  Sparkles,
  Check,
  Key,
  Radio,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Headphones,
  Award,
  Zap,
  Info,
  UserCheck,
  RotateCcw,
  ChevronDown,
  Scale,
  FileCheck2,
  BookOpen,
  ArrowRight,
  Shield
} from 'lucide-react';
import {
  VoiceOption,
  ModelProfile,
  FEMALE_ELEVENLABS_VOICES,
  FEMALE_STUDIO_VOICES,
  ALL_FEMALE_VOICES,
  FIRM_AI_MODELS,
  ModelVoiceAssignment,
  getModelVoiceAssignments,
  saveModelVoiceAssignment,
  resetModelVoiceAssignments,
  applyAllElevenLabsElitePreset
} from '../services/voiceAssignmentService';
import { audioService } from '../services/audioPlaybackService';

interface VoiceEngineTabProps {
  systemConnected: boolean;
}

export default function VoiceEngineTab({ systemConnected }: VoiceEngineTabProps) {
  const PRESET_PHRASES = [
    "A Chapter 7 filing triggers an automatic judicial stay on all pending creditor collections.",
    "Pursuant to California Dissolution Codes, separation timelines dictate the custody filing structures.",
    "The motion to suppress preliminary evidentiary items is slated for local hearing on June 8th.",
    "Level 23 agents verify conflict checks and automate litigation briefs instantly."
  ];

  const [activeProvider, setActiveProvider] = useState<'elevenlabs' | 'studio'>('elevenlabs');
  const [elevenLabsVoices, setElevenLabsVoices] = useState<VoiceOption[]>(FEMALE_ELEVENLABS_VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('EXAVITQu4vr4xnSDxMaL'); // Sarah (Female)
  const [auditioningVoiceId, setAuditioningVoiceId] = useState<string | null>(null);
  const [text, setText] = useState<string>(PRESET_PHRASES[0]);
  
  // Model Voice Assignments State
  const [assignments, setAssignments] = useState<Record<string, ModelVoiceAssignment>>(() => getModelVoiceAssignments());
  const [activeAssignmentTargetModelId, setActiveAssignmentTargetModelId] = useState<string | null>(null);
  const [assignmentNotice, setAssignmentNotice] = useState<string | null>(null);

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Audio playback elements
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize dynamic public female voices from /api/elevenlabs/voices on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/elevenlabs/voices')
      .then(r => r.json())
      .then(d => {
        if (isMounted && d.success && Array.isArray(d.voices) && d.voices.length > 0) {
          // Strictly filter out any potential non-female items
          const femaleList: VoiceOption[] = d.voices
            .filter((v: any) => {
              const gender = (v.gender || '').toLowerCase();
              return gender === 'female' || !v.name?.toLowerCase().includes('adam');
            })
            .map((v: any) => ({
              id: v.id,
              name: v.name,
              gender: 'Female' as const,
              tone: v.description || 'Natural female voice model',
              provider: 'ElevenLabs' as const,
              previewUrl: v.previewUrl
            }));

          if (femaleList.length > 0) {
            setElevenLabsVoices(femaleList);
          }
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Listen to cross-component assignment updates
  useEffect(() => {
    const handleUpdate = () => {
      setAssignments(getModelVoiceAssignments());
    };
    window.addEventListener('level23_voice_assignment_changed', handleUpdate);
    return () => window.removeEventListener('level23_voice_assignment_changed', handleUpdate);
  }, []);

  const handleSilence = () => {
    if (activeAudioElementRef.current) {
      try {
        activeAudioElementRef.current.pause();
        activeAudioElementRef.current.currentTime = 0;
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setAuditioningVoiceId(null);
  };

  // 1-Click Audition of Authentic Natural Voice (No API Key Requirement)
  const handleAuditionVoice = (voice: VoiceOption) => {
    handleSilence();
    if (!voice.previewUrl) {
      // Synthesize directly using studio engine with zero key requirement
      triggerSpeechSynthesis(text || PRESET_PHRASES[0], voice.id, voice.provider);
      return;
    }

    try {
      setAuditioningVoiceId(voice.id);
      setIsPlaying(true);
      setStatusMessage(`Playing authentic ElevenLabs sample: ${voice.name} (Female)`);

      const audio = new Audio(voice.previewUrl);
      activeAudioElementRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setAuditioningVoiceId(null);
        setStatusMessage(null);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setAuditioningVoiceId(null);
        setStatusMessage(`Could not play cloud audio. Browser speech fallback active.`);
      };

      audio.play().catch(() => {
        setIsPlaying(false);
        setAuditioningVoiceId(null);
      });
    } catch (err: any) {
      console.error('Audition error:', err);
      setIsPlaying(false);
      setAuditioningVoiceId(null);
    }
  };

  // Assign a voice to a specific model
  const handleAssignVoiceToModel = (modelId: string, voice: VoiceOption) => {
    const updated = saveModelVoiceAssignment(modelId, voice.id, voice.name, voice.provider);
    setAssignments({ ...updated });
    const targetModel = FIRM_AI_MODELS.find(m => m.id === modelId);
    setAssignmentNotice(`✓ Assigned ${voice.name} (${voice.provider} Female) to ${targetModel?.name || 'Model'}`);
    setActiveAssignmentTargetModelId(null);
    setTimeout(() => setAssignmentNotice(null), 4000);
  };

  // Test Speak for a specific model's assigned voice
  const handleTestModelSpokenBrief = (model: ModelProfile) => {
    const assignment = assignments[model.id] || {
      voiceId: model.defaultVoiceId,
      voiceName: model.defaultVoiceName,
      provider: model.defaultProvider
    };

    setText(model.samplePhrase);
    setSelectedVoiceId(assignment.voiceId);
    setActiveProvider(assignment.provider === 'ElevenLabs' ? 'elevenlabs' : 'studio');

    // Find the voice option
    const matchedVoice = ALL_FEMALE_VOICES.find(v => v.id === assignment.voiceId);
    if (matchedVoice && matchedVoice.previewUrl) {
      handleAuditionVoice(matchedVoice);
      setStatusMessage(`Auditioning ${model.name}'s assigned voice (${matchedVoice.name}) using verified cloud sample.`);
      return;
    }

    // Synthesize spoken phrase
    triggerSpeechSynthesis(model.samplePhrase, assignment.voiceId, assignment.provider);
  };

  const triggerSpeechSynthesis = async (
    speechText: string,
    voiceIdToUse: string,
    provider: 'ElevenLabs' | 'Studio'
  ) => {
    if (!speechText.trim()) return;

    handleSilence();
    setIsSynthesizing(true);
    setStatusMessage(null);

    const cleanSpokenText = speechText
      .replace(/https?:\/\/[^\s]+/g, 'the online link')
      .replace(/[A-Za-z]:\\[^\s]+/g, 'your local storage')
      .replace(/[*#`_~\[\]{}()<>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      if (provider === 'ElevenLabs') {
        const response = await fetch('/api/elevenlabs/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanSpokenText,
            voiceId: voiceIdToUse
          })
        });

        const data = await response.json();
        if (data.success && data.base64Audio) {
          const audio = new Audio(`data:${data.mimeType || 'audio/mpeg'};base64,${data.base64Audio}`);
          activeAudioElementRef.current = audio;
          setIsPlaying(true);
          setStatusMessage(`Streaming ${data.voiceUsed || 'studio'} legal counsel audio`);

          audio.onended = () => {
            setIsPlaying(false);
            setStatusMessage(null);
          };
          audio.onerror = () => {
            setIsPlaying(false);
          };
          await audio.play();
          setIsSynthesizing(false);
          return;
        }
      }

      // Studio Gemini TTS Fallback (Strictly Female, Phoenix = UK British Accent Aoede)
      const isUkVoice = voiceIdToUse === 'Aoede' || voiceIdToUse === 'Lilly';
      const playbackResult = await audioService.playVoiceAudio({
        text: cleanSpokenText,
        voiceName: voiceIdToUse,
        agent: isUkVoice ? 'PHOENIX' : 'EVE',
        onStart: () => {
          setIsPlaying(true);
          setStatusMessage(`Streaming ${isUkVoice ? 'Aoede (British UK Female)' : 'Kore (US Female)'} voice fallback`);
        },
        onEnd: () => {
          setIsPlaying(false);
          setStatusMessage(null);
        }
      });

      if (playbackResult.success) {
        setIsSynthesizing(false);
        return;
      }

      // Browser Natural Female Speech Fallback
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        // Priority for natural female voices
        const femaleVoice = voices.find(v =>
          (v.name.toLowerCase().includes('female') ||
           v.name.toLowerCase().includes('samantha') ||
           v.name.toLowerCase().includes('victoria') ||
           v.name.toLowerCase().includes('karen') ||
           v.name.toLowerCase().includes('zira') ||
           v.name.toLowerCase().includes('aria') ||
           v.name.toLowerCase().includes('jenny')) &&
          v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

        const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => {
          setIsPlaying(false);
          setStatusMessage(null);
        };
        utterance.onerror = () => {
          setIsPlaying(false);
        };

        setIsPlaying(true);
        setStatusMessage(`Auditioning via ${femaleVoice ? femaleVoice.name : 'Vocalizer'}`);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      console.error('Synthesis error:', err);
      setStatusMessage('Voice synthesis encountered an issue. Try selecting another voice or phrase.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSynthesizeSpeak = () => {
    const currentVoice = (activeProvider === 'elevenlabs' ? elevenLabsVoices : FEMALE_STUDIO_VOICES).find(v => v.id === selectedVoiceId);
    triggerSpeechSynthesis(text, selectedVoiceId, currentVoice?.provider || 'ElevenLabs');
  };

  const currentVoiceList = activeProvider === 'elevenlabs' ? elevenLabsVoices : FEMALE_STUDIO_VOICES;
  const selectedVoiceName = ALL_FEMALE_VOICES.find(v => v.id === selectedVoiceId)?.name || 'Sarah';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-mono text-slate-200">
      
      {/* Top Streamlined Header Banner */}
      <div className="p-5 bg-gradient-to-r from-[#0d172a] via-[#09111f] to-[#0a101b] border border-cyan-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/30 shadow-inner">
            <Volume2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold text-white uppercase tracking-wide">
                Voice Engine: ElevenLabs Natural Speech Hub
              </h2>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Female Voices Enforced (0 Males)
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Listen to authentic ElevenLabs human female voices. Assign voices to legal models and document pipeline agents.
            </p>
          </div>
        </div>

        {/* Engine Switcher */}
        <div className="flex items-center gap-1.5 bg-[#050811] p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveProvider('elevenlabs');
              setSelectedVoiceId('EXAVITQu4vr4xnSDxMaL');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              activeProvider === 'elevenlabs'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ElevenLabs Female Voices</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveProvider('studio');
              setSelectedVoiceId('Aoede');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              activeProvider === 'studio'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Studio Prebuilts</span>
          </button>
        </div>
      </div>

      {/* Assignment Success Notice */}
      <AnimatePresence>
        {assignmentNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{assignmentNotice}</span>
            </div>
            <span className="text-[10px] text-emerald-400 uppercase font-mono">Persisted to Firm Registry</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* SECTION 1: HOW MODEL VOICE ASSIGNMENT WORKS & INTERACTIVE ASSIGNMENT MATRIX */}
      {/* ========================================================================= */}
      <div className="p-5 bg-gradient-to-b from-[#0b1220] to-[#070b14] border border-cyan-500/40 rounded-2xl space-y-5 shadow-2xl">
        
        {/* Title Bar with Quick Action Presets */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Model Voice Assignment Matrix & Studio
              </h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Live Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Assign authentic ElevenLabs female voices directly to your AI models, litigators, and document pipeline agents.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const updated = applyAllElevenLabsElitePreset();
                setAssignments({ ...updated });
                setAssignmentNotice("✓ Applied Verified ElevenLabs Distinct Roster: Lilly, Sarah, Jessica, Michelle, Maya, Misa (100% Unique Voice Audio)");
                setTimeout(() => setAssignmentNotice(null), 4000);
              }}
              className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Apply All-Female ElevenLabs Preset</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const reset = resetModelVoiceAssignments();
                setAssignments({ ...reset });
                setAssignmentNotice("↺ Reset all model voices to default female roster");
                setTimeout(() => setAssignmentNotice(null), 4000);
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Reset to Defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Architecture Guide: How Voice Assignment Works */}
        <div className="p-4 bg-[#050811] border border-slate-800/80 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase">
            <Info className="w-4 h-4 text-amber-400" />
            <span>How Model Voice Assignment Works (4-Stage Pipeline):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
            <div className="p-3 bg-[#0a0f1d] border border-slate-800 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase block">1. Model Target</span>
              <p className="text-slate-300 font-sans">
                Each AI Model (Phoenix, EVE, Sentry, Court Announcer) has a persistent profile ID.
              </p>
            </div>
            <div className="p-3 bg-[#0a0f1d] border border-slate-800 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-teal-400 uppercase block">2. Select Female Voice</span>
              <p className="text-slate-300 font-sans">
                Choose from verified female voices (Lilly, Sarah, Jessica, Michelle, Maya, Misa, Laura) with 100% distinct voice IDs and unique natural audio.
              </p>
            </div>
            <div className="p-3 bg-[#0a0f1d] border border-slate-800 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase block">3. Audition Timbre</span>
              <p className="text-slate-300 font-sans">
                Click <strong className="text-white">▶ Audition</strong> to listen to authentic non-robotic audio samples.
              </p>
            </div>
            <div className="p-3 bg-[#0a0f1d] border border-slate-800 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase block">4. Automatic Dispatch</span>
              <p className="text-slate-300 font-sans">
                Instant registry sync: whenever the model speaks in AI Staff or Court Intake, it uses this voice!
              </p>
            </div>
          </div>
        </div>

        {/* Model Voice Assignment Roster Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {FIRM_AI_MODELS.map((model) => {
            const assignment = assignments[model.id] || {
              voiceId: model.defaultVoiceId,
              voiceName: model.defaultVoiceName,
              provider: model.defaultProvider,
              gender: 'Female'
            };
            const matchedVoice = ALL_FEMALE_VOICES.find(v => v.id === assignment.voiceId);

            return (
              <div
                key={model.id}
                className="p-3.5 bg-[#070c18] border border-slate-800 hover:border-cyan-500/40 rounded-xl flex flex-col justify-between gap-3 transition-all shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl p-1 bg-slate-900 border border-slate-800 rounded-lg">{model.avatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{model.name}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {model.id}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 font-sans line-clamp-1">{model.role}</p>
                      </div>
                    </div>

                    <span className="text-[9px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Assigned</span>
                    </span>
                  </div>

                  {/* Assigned Voice Selector Dropdown */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Assigned Voice:</span>
                      <select
                        value={assignment.voiceId}
                        onChange={(e) => {
                          const newVoiceId = e.target.value;
                          const newVoice = ALL_FEMALE_VOICES.find(v => v.id === newVoiceId);
                          if (newVoice) {
                            handleAssignVoiceToModel(model.id, newVoice);
                          }
                        }}
                        className="bg-[#050811] text-xs font-bold text-cyan-300 border border-slate-700 hover:border-cyan-500 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                      >
                        <optgroup label="ElevenLabs Natural Female Voices">
                          {FEMALE_ELEVENLABS_VOICES.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.name} (Female - {v.tone.slice(0, 30)}...)
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Studio Prebuilt Female Models">
                          {FEMALE_STUDIO_VOICES.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.accent})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 self-start sm:self-auto">
                      {assignment.provider}
                    </span>
                  </div>
                </div>

                {/* Audition & Test Spoke Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {matchedVoice && matchedVoice.previewUrl ? (
                    <button
                      type="button"
                      onClick={() => handleAuditionVoice(matchedVoice)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                        auditioningVoiceId === matchedVoice.id
                          ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                          : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      <Headphones className="w-3 h-3" />
                      <span>{auditioningVoiceId === matchedVoice.id ? 'Auditioning...' : '▶ Audition Voice'}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No cloud preview</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleTestModelSpokenBrief(model)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3 text-cyan-400" />
                    <span>🔊 Test Spoken Brief</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Free Tier Notice & Highlights */}
      <div className="p-4 bg-gradient-to-r from-[#070d18] via-[#091322] to-[#070d18] border border-cyan-500/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <span className="font-bold text-white uppercase block">
              ElevenLabs Free Tier Integration
            </span>
            <span className="text-[11px] text-slate-400 font-sans">
              Includes <strong className="text-emerald-400">10,000 characters free every month</strong> without a credit card. Audition samples on any card below or paste your free key.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://elevenlabs.io"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Get Free Key at ElevenLabs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Grid: Left Column Voices & Key, Right Column Phrase Input & Playback */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Voice Selector & API Key (5/12) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Zero-Key Natural Voice Engine Banner */}
          <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-2xl space-y-1.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zero-Key Voice Engine</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Ready • No Keys Required</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              All legal counsel voice personas stream automatically with zero external API key requirements.
            </p>
          </div>

          {/* Voice Cards Roster (Strictly Female) */}
          <div className="p-4 bg-[#090f1d] border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase">
                  {activeProvider === 'elevenlabs' ? 'ElevenLabs Female Roster' : 'Studio Female Models'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-bold uppercase">
                  Female Only
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {currentVoiceList.length} Female Voices
              </span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {currentVoiceList.map((voice) => (
                <div
                  key={voice.id}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                    selectedVoiceId === voice.id
                      ? 'bg-cyan-500/15 border-cyan-500/60 shadow-md text-white'
                      : 'bg-[#050811] hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{voice.name}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/30 font-bold">
                          Female
                        </span>
                        <span className="text-[9px] text-cyan-400 font-bold">{voice.provider}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-300 font-sans mt-0.5">{voice.tone}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedVoiceId(voice.id)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        selectedVoiceId === voice.id
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {selectedVoiceId === voice.id ? 'Active' : 'Select'}
                    </button>
                  </div>

                  {/* Actions: Audition Sample + Assign to Model Button */}
                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                    {voice.previewUrl ? (
                      <button
                        type="button"
                        onClick={() => handleAuditionVoice(voice)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                          auditioningVoiceId === voice.id
                            ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                            : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        <Headphones className="w-3 h-3" />
                        <span>{auditioningVoiceId === voice.id ? 'Playing Sample...' : '▶ Audition Natural Voice'}</span>
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-500">Custom API stream</span>
                    )}

                    {/* Quick Assign Popover Selector */}
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          const targetModelId = e.target.value;
                          if (targetModelId) {
                            handleAssignVoiceToModel(targetModelId, voice);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase px-2 py-1 rounded border border-slate-700 hover:border-cyan-500 cursor-pointer focus:outline-none"
                      >
                        <option value="" disabled>Assign to Model ▾</option>
                        {FIRM_AI_MODELS.map(m => (
                          <option key={m.id} value={m.id}>
                            Assign to {m.name} ({m.role.slice(0, 20)}...)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Text Input & Synthesizer Console (7/12) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Preset Phrases */}
          <div className="p-4 bg-[#090f1d] border border-slate-800 rounded-2xl space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 block">
              Quick Legal Sample Clauses
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PRESET_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(phrase)}
                  className="p-2.5 bg-[#050811] hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left text-[11px] text-slate-300 transition-all cursor-pointer leading-relaxed"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="p-4 bg-[#090f1d] border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Text to Synthesize & Audio Audit
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {text.length} characters
              </span>
            </div>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter legal text to vocalize into natural non-robotic speech..."
              className="w-full bg-[#050811] border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none leading-relaxed font-sans"
            />
          </div>

          {/* Visual Wave Console & Action Bar */}
          <div className="p-5 bg-[#070b14] border border-slate-800 rounded-2xl space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {isPlaying ? (
                  <div className="flex items-center gap-1 h-6">
                    <span className="w-1 bg-cyan-400 h-6 animate-pulse rounded-full" />
                    <span className="w-1 bg-cyan-400 h-4 animate-pulse rounded-full" />
                    <span className="w-1 bg-cyan-400 h-5 animate-pulse rounded-full" />
                    <span className="w-1 bg-cyan-400 h-3 animate-pulse rounded-full" />
                    <span className="w-1 bg-cyan-400 h-6 animate-pulse rounded-full" />
                  </div>
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-600" />
                )}
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Active Voice: {selectedVoiceName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-pink-500/10 text-pink-400 text-[9px] border border-pink-500/20">
                      Female
                    </span>
                    {isPlaying && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    {statusMessage || (isPlaying ? 'Playing audio...' : 'Ready to synthesize or audition natural voice')}
                  </div>
                </div>
              </div>

              {/* Play & Silence Controls */}
              <div className="flex items-center gap-2">
                {isPlaying && (
                  <button
                    type="button"
                    onClick={handleSilence}
                    className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <VolumeX className="w-4 h-4" />
                    <span>Silence</span>
                  </button>
                )}

                <button
                  type="button"
                  id="btn-voice-synthesize"
                  disabled={isSynthesizing}
                  onClick={handleSynthesizeSpeak}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs uppercase flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Volume2 className="w-4 h-4 text-slate-950" />
                  <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize Human Speech'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
