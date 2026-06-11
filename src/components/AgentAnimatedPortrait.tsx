import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  ShieldCheck, 
  Sparkles, 
  Volume2, 
  Activity, 
  Cpu, 
  Award, 
  Flame, 
  CheckCircle,
  TrendingUp,
  Bot
} from 'lucide-react';
import { VoiceAgentProfile } from '../types';

interface AgentAnimatedPortraitProps {
  profile: VoiceAgentProfile;
  isSpeaking: boolean;
  voiceStatus: 'SLEEPING' | 'LISTENING' | 'WAKING' | 'SPEAKING' | 'ERROR';
  onPortraitClick?: () => void;
}

export const AgentAnimatedPortrait: React.FC<AgentAnimatedPortraitProps> = ({
  profile,
  isSpeaking,
  voiceStatus,
  onPortraitClick
}) => {
  const [sineOffset, setSineOffset] = useState(0);
  const [bars, setBars] = useState<number[]>([]);

  // Constant ticking for audio bars & wave offsets
  useEffect(() => {
    let interval: any;
    if (isSpeaking) {
      interval = setInterval(() => {
        setSineOffset(prev => (prev + 10) % 360);
        // Generate randomized high-activity equalizer bar heights
        const newBars = Array.from({ length: 16 }, () => Math.floor(Math.random() * 40) + 10);
        setBars(newBars);
      }, 70);
    } else {
      // Idle breathing visualizer bars
      interval = setInterval(() => {
        setSineOffset(prev => (prev + 3) % 360);
        const idleBars = Array.from({ length: 16 }, (_, i) => {
          return 12 + Math.sin((Date.now() / 300) + i) * 6;
        });
        setBars(idleBars);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Color mappings matching the original boardroom image
  const getAgentTheme = () => {
    switch (profile.id) {
      case 'ap-1': // Phoenix (Gold / Bronze Legal Strategy style)
        return {
          glowColor: 'shadow-amber-500/20 border-amber-500/40',
          textColor: 'text-amber-400',
          bgColor: 'bg-amber-950/20',
          fillColor: 'bg-amber-400',
          ringColor: 'border-amber-500/30',
          accentGradient: 'from-amber-600/20 to-yellow-950/20',
          badgeText: 'LEGAL STRATEGIST & CO-COUNSEL',
          icon: Scale,
          logoText: 'PHOENIX LEGAL'
        };
      case 'ap-2': // Sentry (Severe High-Tech Sentry style - Blue / Cyan / Gold)
        return {
          glowColor: 'shadow-teal-500/20 border-teal-500/40',
          textColor: 'text-teal-400',
          bgColor: 'bg-teal-950/20',
          fillColor: 'bg-teal-400',
          ringColor: 'border-teal-500/30',
          accentGradient: 'from-teal-600/20 to-emerald-950/20',
          badgeText: 'TECH MASTER & APP SENTRY',
          icon: Cpu,
          logoText: 'PHOENIX SENTRY'
        };
      case 'ap-3': // Alure (Luxury penthouse boardroom rose gold / purple / coral)
        return {
          glowColor: 'shadow-rose-400/20 border-rose-400/40',
          textColor: 'text-rose-400',
          bgColor: 'bg-rose-950/20',
          fillColor: 'bg-rose-400',
          ringColor: 'border-rose-400/30',
          accentGradient: 'from-rose-600/20 to-purple-950/20',
          badgeText: 'BUSINESS HEAD & GROWTH MANAGER',
          icon: TrendingUp,
          logoText: 'ALURE MANAGEMENT'
        };
      case 'ap-4': // EVE (Supportive high-tech receptionist indigo-violet styled co-pilot)
        return {
          glowColor: 'shadow-indigo-500/20 border-indigo-500/40',
          textColor: 'text-indigo-400',
          bgColor: 'bg-indigo-950/20',
          fillColor: 'bg-indigo-400',
          ringColor: 'border-indigo-500/30',
          accentGradient: 'from-indigo-600/20 to-purple-950/20',
          badgeText: 'RECEPTIONIST & TASK ROUTER',
          icon: Bot,
          logoText: 'EVE OLLAMA CO-PILOT'
        };
      default:
        return {
          glowColor: 'shadow-slate-500/20 border-slate-500/40',
          textColor: 'text-slate-400',
          bgColor: 'bg-slate-950/20',
          fillColor: 'bg-slate-400',
          ringColor: 'border-slate-500/30',
          accentGradient: 'from-slate-600/25 to-slate-950/20',
          badgeText: 'AI CO-COUNSEL',
          icon: Sparkles,
          logoText: 'LEVEL 23'
        };
    }
  };

  const theme = getAgentTheme();
  const AgentIcon = theme.icon;

  return (
    <div className="flex flex-col h-full bg-[#070b14] rounded-2xl border border-slate-800/60 overflow-hidden relative group/portrait shadow-2xl">
      
      {/* 3D Holographic Matrix Grid Background Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none" />

      {/* Tri-jurisdictional License Badge Row */}
      <div className="absolute top-2.5 left-2.5 z-20 flex gap-1 items-center flex-wrap select-none">
        <span className="text-[7.5px] font-mono bg-amber-950/80 text-amber-300 border border-amber-500/30 px-1 py-0.5 rounded font-black tracking-wider shadow">
          CA BAR
        </span>
        <span className="text-[7.5px] font-mono bg-teal-950/80 text-teal-300 border border-teal-500/30 px-1 py-0.5 rounded font-black tracking-wider shadow">
          NV BAR
        </span>
        <span className="text-[7.5px] font-mono bg-sky-950/80 text-sky-300 border border-sky-500/30 px-1 py-0.5 rounded font-black tracking-wider shadow">
          FED PRACTITIONER
        </span>
      </div>

      {/* Level 23 Active Co-Counsel Status badge */}
      <div className="absolute top-2.5 right-2.5 z-20 select-none">
        <span className="text-[7.5px] font-mono bg-[#090d16] text-white border border-slate-800 px-1.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
          <Award className="w-2.5 h-2.5 text-yellow-500" />
          ACTIVE CO-COUNSEL
        </span>
      </div>

      {/* Main Portrait Frame with Zoom and Interactive Breathing Motion */}
      <div 
        onClick={onPortraitClick}
        className="flex-1 relative overflow-hidden flex items-center justify-center cursor-pointer select-none py-14"
        title="Click on Co-Counsel to trigger greetings & wake state response"
      >
        {/* Subtle radial light cone behind portrait */}
        <div className={`absolute w-80 h-80 rounded-full bg-gradient-to-tr ${theme.accentGradient} blur-[80px] opacity-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none`} />

        {/* Outer Glowing tech telemetry ring */}
        <div className={`absolute w-64 h-64 rounded-full border border-dashed ${theme.ringColor} animate-[spin_110s_linear_infinite] opacity-65 flex items-center justify-center`}>
          <div className="absolute w-56 h-56 rounded-full border border-double border-slate-800/40 animate-[spin_55s_linear_infinite]" />
        </div>

        {/* Animated Soundwave ripple rings that expand during live speech */}
        <AnimatePresence>
          {isSpeaking && (
            <>
              <motion.div 
                initial={{ scale: 0.85, opacity: 0.8 }}
                animate={{ scale: 1.28, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                className={`absolute w-52 h-52 rounded-full border-2 ${theme.ringColor} pointer-events-none`}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1.45, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                className={`absolute w-52 h-52 rounded-full border ${theme.ringColor} pointer-events-none`}
              />
            </>
          )}
        </AnimatePresence>

        {/* Avatar Portrait Portrait Image Component */}
        <motion.div
          animate={{
            y: isSpeaking ? [0, -4, 0, -4, 0] : [0, -2, 0],
            scale: isSpeaking ? [1.02, 1.05, 1.02] : 1.0
          }}
          transition={{
            y: { duration: isSpeaking ? 1.6 : 4.5, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className={`relative w-44 h-44 rounded-full p-1.5 bg-[#090d16] border-2 shadow-2xl ${theme.glowColor} overflow-hidden z-10 transition-all duration-300`}
        >
          {profile.portrait ? (
            <img 
              src={profile.portrait} 
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full select-none pointer-events-none filter brightness-105 contrast-100"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-4xl shadow-inner">
              {profile.avatar}
            </div>
          )}

          {/* Glowing HUD Scanline Overlays to emulate futuristic dashboard */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/5 to-transparent pointer-events-none animate-pulse" />
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none animate-[bounce_8s_infinite]" />

          {/* Speaking Mic Indicator Badge */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute bottom-2 right-2 bg-rose-500/90 text-white rounded-full p-1 shadow-lg shadow-rose-500/30 border border-rose-400/40 animate-pulse"
              >
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sentry Cyber Diagnostic holographic globe overlay */}
        {profile.id === 'ap-2' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-[185px] h-[185px] rounded-full border border-emerald-500/5 hover:border-emerald-500/10 transition duration-300 animate-[spin_14s_linear_infinite]" />
          </div>
        )}
      </div>

      {/* Real-time Responsive Soundwave Audio Visualizer Equalizer strip */}
      <div className="bg-[#03060c] border-t border-slate-900 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 z-10 relative">
        <div className="flex items-center gap-1.5 select-none shrink-0">
          <Activity className={`w-3.5 h-3.5 ${isSpeaking ? 'text-rose-400 rotate-12 transition' : 'text-slate-500'}`} />
          <span className="text-[8.5px] font-mono font-bold text-slate-400">
            {isSpeaking ? 'VOCAL SYNTH ANALYSIS' : 'IDLE CO-COUNSEL BAND'}
          </span>
        </div>

        {/* Audio Spectrum Graphic */}
        <div className="flex items-center gap-0.5 h-6 flex-1 justify-end max-w-[120px]">
          {bars.map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-sm transition-all duration-700 ${theme.fillColor}`}
              style={{ 
                height: `${height}%`,
                opacity: isSpeaking ? 0.95 : 0.4 
              }}
            />
          ))}
        </div>
      </div>

      {/* Technical Diagnostic Metadata Block */}
      <div className="bg-[#050810] border-t border-slate-900 p-3.5 space-y-2 shrink-0 z-10 select-none">
        <div className="flex items-start justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-[8px] font-mono tracking-widest text-slate-500 font-extrabold uppercase block leading-none">
              {theme.logoText}
            </span>
            <h4 className="text-xs font-black text-white hover:text-teal-400 transition cursor-pointer mt-1 font-sans flex items-center gap-1">
              {profile.name}
              {isSpeaking && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
              )}
            </h4>
            <span className="text-[9px] text-slate-400 font-sans block truncate mt-0.5">{profile.role}</span>
          </div>

          <div className="text-right shrink-0">
            <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded-full font-bold border ${theme.bgColor} ${theme.textColor} ${theme.glowColor}`}>
              {profile.accent}
            </span>
          </div>
        </div>

        {/* Structured Personality Persona Indicators */}
        <p className="text-[10px] text-slate-350 leading-relaxed italic bg-slate-950/45 p-2 rounded-lg border border-slate-900 text-slate-300">
          "{profile.description}"
        </p>

        {/* Dynamic telemetry state indicators */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <div className="bg-[#080d16] border border-slate-900 p-1.5 rounded-md flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[7px] text-slate-500 block uppercase font-mono leading-none">Status</span>
              <span className="text-[8px] text-emerald-300 font-mono font-bold block truncate mt-0.5">
                {isSpeaking ? 'TALKING' : 'STANDBY LOCK'}
              </span>
            </div>
          </div>

          <div className="bg-[#080d16] border border-slate-900 p-1.5 rounded-md flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <span className="text-[7px] text-slate-500 block uppercase font-mono leading-none">Practice Scope</span>
              <span className="text-[8px] text-teal-300 font-mono font-semibold block truncate mt-0.5">
                CA + NV Advocate
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
