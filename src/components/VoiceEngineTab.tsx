import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Play,
  Mic,
  MessageSquareCode,
  Music,
  Maximize2,
  Sparkles,
  Sliders,
  Check
} from 'lucide-react';

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

  const prebuiltVoices = [
    { name: 'Eve', gender: 'Female', tone: 'Energetic, efficient, US Receptionist' },
    { name: 'Aoede', gender: 'Female', tone: 'Professional, distinguished, British / UK accent' },
    { name: 'Kore', gender: 'Female', tone: 'Modern, clear, West Coast US' },
    { name: 'Zephyr', gender: 'Female', tone: 'Academic, concise, Mid-Atlantic' }
  ];

  const [text, setText] = useState(PRESET_PHRASES[0]);
  const [selectedVoice, setSelectedVoice] = useState('Aoede');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Audio playback elements
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Pre-load and warm up speech synthesis voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  const handleSynthesizeSpeak = async () => {
    if (!text.trim()) return;

    setIsSynthesizing(true);
    setIsPlaying(false);

    // Stop previous active audio source if playing
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {}
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: selectedVoice
        })
      });

      if (!response.ok) {
        throw new Error(`TTS server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.base64Audio) {
        // Initialize AudioContext
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // Decode base64 16-bit linear PCM audio stream (which does not have a WAV header)
        const binaryString = window.atob(data.base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert 16-bit PCM (little-endian, mono) to Float32 samples
        const numSamples = Math.floor(len / 2);
        const floatData = new Float32Array(numSamples);
        const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

        for (let i = 0; i < numSamples; i++) {
          if (i * 2 + 1 < len) {
            // Read 16-bit signed integer little-endian sample
            const sample = dataView.getInt16(i * 2, true);
            // Normalize to Float32 range [-1.0, 1.0]
            floatData[i] = sample / 32768.0;
          }
        }

        // Initialize AudioBuffer at Gemini TTS native sample rate (24000 Hz)
        const sampleRate = 24000;
        const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
        audioBuffer.getChannelData(0).set(floatData);
        
        // Create audio buffer source Node
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        activeSourceRef.current = source;
        setIsPlaying(true);

        source.onended = () => {
          setIsPlaying(false);
        };

        source.start(0);
      } else {
        throw new Error("No base64 audio returned");
      }
    } catch (e: any) {
      console.warn("TTS API connection or quota issue, falling back to local high-fidelity browser synthesis:", e);
      
      // Fallback to local high-fidelity browser speechSynthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        let matchedVoice = null;

        if (selectedVoice === 'Aoede') {
          // Find British UK English female voice - Case insensitive and extremely robust
          matchedVoice = voices.find(v => {
            const l = v.lang.toLowerCase();
            const n = v.name.toLowerCase();
            return (l.includes('gb') || l.includes('uk') || n.includes('british') || n.includes('united kingdom') || n.includes('england')) && (n.includes('female') || n.includes('natural') || n.includes('google'));
          })
          || voices.find(v => {
            const l = v.lang.toLowerCase();
            const n = v.name.toLowerCase();
            return (l.includes('gb') || l.includes('uk') || n.includes('british') || n.includes('united kingdom') || n.includes('england'));
          })
          || voices.find(v => v.lang.toLowerCase().startsWith('en') && v.name.toLowerCase().includes('google'));
        } else if (selectedVoice === 'Zephyr') {
          matchedVoice = voices.find(v => v.lang.toLowerCase().includes('us') && v.name.toLowerCase().includes('zira'))
                      || voices.find(v => v.lang.toLowerCase().includes('us') && v.name.toLowerCase().includes('female'))
                      || voices.find(v => v.lang.toLowerCase().startsWith('en'));
        } else if (selectedVoice === 'Eve') {
          matchedVoice = voices.find(v => v.lang.toLowerCase().includes('us') && v.name.toLowerCase().includes('google'))
                      || voices.find(v => v.lang.toLowerCase().includes('us') && v.name.toLowerCase().includes('siri'))
                      || voices.find(v => v.lang.toLowerCase().includes('us') && v.name.toLowerCase().includes('female'))
                      || voices.find(v => v.lang.toLowerCase().startsWith('en'));
        } else {
          matchedVoice = voices.find(v => v.lang.toLowerCase().includes('us') && v.name.toLowerCase().includes('samantha'))
                      || voices.find(v => v.lang.toLowerCase().includes('us') && v.name.toLowerCase().includes('female'))
                      || voices.find(v => v.lang.toLowerCase().startsWith('en'));
        }

        if (matchedVoice) utterance.voice = matchedVoice;
        utterance.pitch = selectedVoice === 'Eve' ? 1.15 : 1.05;
        utterance.rate = selectedVoice === 'Eve' ? 1.05 : 1.0;

        utterance.onstart = () => {
          setIsPlaying(true);
        };
        utterance.onend = () => {
          setIsPlaying(false);
        };
        utterance.onerror = () => {
          setIsPlaying(false);
        };

        // Pin reference to prevent garbage collection
        activeUtteranceRef.current = utterance;
        if (typeof window !== 'undefined') {
          (window as any)._activeVoiceEngineUtterance = utterance;
        }

        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSilence = () => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {}
      setIsPlaying(false);
    }
  };

  return (
    <div id="voice-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      
      {/* Left panel: TTS Voice Prebuilts Selector (4/12 width) */}
      <div className="lg:col-span-4 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] p-5 flex flex-col justify-between overflow-y-auto shadow-xl">
        <div className="space-y-4">
          <div className="space-y-1 pb-3 border-b border-[#1e293b]">
            <h2 className="text-sm font-bold font-heading text-white flex items-center gap-2">
              <Mic className="w-4.5 h-4.5 text-teal-400" />
              Prebuilt Voice Profiles
            </h2>
            <p className="text-xs text-slate-400">Select standard high-fidelity voice metrics</p>
          </div>

          <div className="space-y-2">
            {prebuiltVoices.map((voice) => (
              <button
                key={voice.name}
                onClick={() => setSelectedVoice(voice.name)}
                className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  selectedVoice === voice.name
                    ? 'bg-teal-950/20 border-teal-500/40 shadow-md'
                    : 'bg-transparent border-[#1e293b] hover:border-[#334155]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{voice.name}</span>
                    <span className="text-[9px] uppercase font-mono text-slate-500 bg-[#090d16] px-1.5 rounded">
                      {voice.gender}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans block mt-1">{voice.tone}</span>
                </div>
                {selectedVoice === voice.name && (
                  <Check className="w-4 h-4 text-teal-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Powered block info */}
        <div className="p-4 bg-[#090d16] border border-[#1e293b] rounded-xl text-[10px] text-slate-400 leading-relaxed space-y-1">
          <div className="flex items-center gap-1 font-bold text-teal-400 uppercase tracking-widest text-[9px] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini Speak Engine
          </div>
          Uses single-speaker prebuilts with deep expressive accent rendering matching Google-agent models.
        </div>
      </div>

      {/* Right panel: Synthesize Speak Console (8/12 width) */}
      <div className="lg:col-span-8 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] p-6 flex flex-col justify-between shadow-xl">
        <div className="space-y-5 flex-1 flex flex-col">
          
          {/* Preset templates selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase text-slate-400 tracking-wider">Preset Legal Phrases</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PRESET_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => setText(phrase)}
                  className="p-3 bg-[#090d16]/70 hover:bg-[#090d16] border border-[#1e293b] hover:border-teal-500/30 rounded-xl text-left text-xs text-slate-300 leading-normal transition-all"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Custom text area input */}
          <div className="space-y-1.5 flex-1 flex flex-col">
            <label className="block text-[11px] font-mono uppercase text-slate-400 tracking-wider">Custom TTS Input</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Provide clean text for the voice engine to synthesize..."
              className="w-full flex-1 bg-[#090d16] border border-[#1e293b] rounded-2xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/60 leading-relaxed font-sans resize-none"
            />
          </div>

          {/* Visualization Console area */}
          <div className="p-6 bg-[#090d16] border border-[#1e293b] rounded-2xl flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
            <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Audio Console Matrix
            </div>

            {/* If synthesizing */}
            {isSynthesizing ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest">Synthesizing wave profiles...</span>
              </div>
            ) : isPlaying ? (
              
              /* Soundwave animations mapped in index.css */
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-end gap-1.5 h-10 w-48 justify-center">
                  <div className="w-1 bg-[#20b2aa] sound-bar rounded-full"></div>
                  <div className="w-1 bg-[#20b2aa] sound-bar rounded-full"></div>
                  <div className="w-1 bg-[#20b2aa] sound-bar rounded-full"></div>
                  <div className="w-1 bg-[#20b2aa] sound-bar rounded-full"></div>
                  <div className="w-1 bg-[#20b2aa] sound-bar rounded-full"></div>
                  <div className="w-1 bg-[#20b2aa] sound-bar rounded-full"></div>
                  <div className="w-1 bg-[#20b2aa] sound-bar rounded-full"></div>
                  <div className="w-1 bg-[#20b2aa] sound-bar rounded-full"></div>
                  <div className="w-1 bg-[#20b2aa] sound-bar rounded-full"></div>
                  <div className="w-1 bg-[#20b2aa] sound-bar rounded-full"></div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest animate-pulse">
                  Streaming {selectedVoice} Voice Active
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4">
                <VolumeX className="w-8 h-8 text-[#1e293b]" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Synthesizer Idle</span>
              </div>
            )}
          </div>
        </div>

        {/* Primary Synthesize / Silence triggers */}
        <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between gap-4 mt-4">
          <p className="text-[10px] text-slate-500 max-w-md leading-normal font-sans">
            Level 23 Voice Engine connects to server-side Google GenAI Speech metrics. Ensure your volume thresholds are fully raised to audibly audit compiled clauses.
          </p>
          <div className="flex gap-2">
            {isPlaying && (
              <button
                type="button"
                onClick={handleSilence}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold font-heading flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <VolumeX className="w-4 h-4" />
                <span>Silence Speaker</span>
              </button>
            )}
            <button
              type="button"
              id="btn-voice-speak"
              disabled={isSynthesizing}
              onClick={handleSynthesizeSpeak}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 disabled:opacity-40 text-[#090d16] font-bold rounded-xl text-xs font-heading flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSynthesizing ? 'Compiling Voice...' : 'Synthesize Speak'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
