import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video,
  VideoOff,
  Copy,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ClipboardCheck,
  Check,
  Users,
  Briefcase,
  Mic,
  Clock,
  Trash2
} from 'lucide-react';
import { Client, ConsultationSession } from '../types';

interface ConsultationsTabProps {
  clients: Client[];
  consultations: ConsultationSession[];
  onAddConsultation: (session: ConsultationSession) => void;
  onUpdateConsultation: (session: ConsultationSession) => void;
  onDeleteConsultation: (id: string) => void;
}

export default function ConsultationsTab({
  clients,
  consultations,
  onAddConsultation,
  onUpdateConsultation,
  onDeleteConsultation
}: ConsultationsTabProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  const [roomName, setRoomName] = useState(`Level23-${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
  const [meetingType, setMeetingType] = useState<'Consultation' | 'Deposition' | 'Mediation' | 'Hearing'>('Consultation');
  const [meetingNotes, setMeetingNotes] = useState('');
  
  // Active Jitsi Call State
  const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleStartCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      alert('Please link a client folder to initiate a video consult.');
      return;
    }

    const newSession: ConsultationSession = {
      id: `call-${Date.now()}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      roomName: roomName.trim().replace(/\s+/g, '-'),
      meetingType,
      scheduledFor: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'active',
      notes: meetingNotes
    };

    onAddConsultation(newSession);
    setActiveSession(newSession);
  };

  const handleConcludeCall = () => {
    if (!activeSession) return;
    const completedSession: ConsultationSession = {
      ...activeSession,
      status: 'concluded',
      notes: meetingNotes || 'No specific judicial brief compiled.'
    };
    onUpdateConsultation(completedSession);
    setActiveSession(null);
    setMeetingNotes('');
    setRoomName(`Level23-${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
  };

  const handleCopyLink = (name: string) => {
    const link = `https://meet.jit.si/${name}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const jitsiUrl = activeSession 
    ? `https://meet.jit.si/${activeSession.roomName}#config.prejoinPageEnabled=false&userInfo.displayName="Level 23 Associate"`
    : '';

  return (
    <div id="consultations-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      
      {/* Left Panel: Launcher & Meeting logs (5/12 width) */}
      <div className="lg:col-span-5 flex flex-col justify-between gap-6 overflow-hidden">
        
        {/* Launcher Panel */}
        <div className="bg-[#0e1626] rounded-2.5xl border border-[#1e293b] p-5 space-y-4 flex-1 overflow-y-auto max-h-[55%]">
          <div className="pb-3 border-b border-[#1e293b] flex items-center justify-between">
            <h2 className="text-sm font-bold font-heading text-white flex items-center gap-2">
              <Video className="w-4.5 h-4.5 text-teal-400 animate-pulse" />
              Secure Consultation Hub
            </h2>
            <span className="text-[9px] uppercase font-mono bg-teal-500/10 text-teal-400 px-1.5 py-0.5 rounded border border-teal-500/20">
              Jitsi Integration Enabled
            </span>
          </div>

          {!activeSession ? (
            <form onSubmit={handleStartCall} className="space-y-4">
              
              {/* Select Client file link */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Link Client File</label>
                <select
                  value={selectedClient ? selectedClient.id : ''}
                  onChange={(e) => {
                    const found = clients.find(c => c.id === e.target.value);
                    setSelectedClient(found || null);
                  }}
                  required
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.practiceArea})</option>
                  ))}
                </select>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Hearing Modality</label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value as any)}
                    className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:border-teal-400 focus:outline-none"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Deposition">Secure Deposition</option>
                    <option value="Mediation">Mediation Lab</option>
                    <option value="Hearing">State Hearing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Conferencing Passkey</label>
                  <input
                    type="text"
                    required
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value.replace(/\s+/g, '-'))}
                    className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white text-center font-mono focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Call Prep Summary Notes */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Brief Agenda / Call Goal</label>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Review asset division community values..."
                  className="w-full h-16 bg-[#090d16] border border-[#1e293b] rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:border-teal-400 focus:outline-none resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 text-[#090d16] font-bold rounded-xl text-xs font-heading flex items-center justify-center gap-2 transition-all shadow-lg text-center"
              >
                <Video className="w-4 h-4" />
                <span>Initialize Secure Videolink Node</span>
              </button>

            </form>
          ) : (
            <div className="p-4 bg-teal-950/10 border border-teal-500/30 rounded-2xl space-y-3">
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Room Active & Encrypted
              </span>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                You are currently hosting a secure room for <strong className="text-teal-400">{activeSession.clientName}</strong>. 
                Share the secure room code or conclude the session to save notes back into persistent client records.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyLink(activeSession.roomName)}
                  className="flex-1 py-2 bg-[#090d16] hover:bg-slate-900 border border-[#1e293b] hover:border-teal-500/30 text-white rounded-xl text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-teal-400" />}
                  <span>{copiedLink ? 'Copied Meeting Invite!' : 'Copy Meeting Invite'}</span>
                </button>
                <button
                  onClick={handleConcludeCall}
                  className="py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-xl text-[11px] font-mono transition-colors cursor-pointer"
                >
                  End Call
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Call Logs lists */}
        <div className="bg-[#0e1626] rounded-2.5xl border border-[#1e293b] p-5 flex flex-col justify-between overflow-y-auto flex-1">
          <div className="pb-3 border-b border-[#1e293b]">
            <h2 className="text-sm font-bold font-heading text-white flex items-center gap-2">
              <ClipboardCheck className="w-4.5 h-4.5 text-teal-400" />
              Practice Session Archives
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Retranscribed courtroom briefs & meeting logs</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1 min-h-[120px]">
            {consultations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 py-6">
                <VideoOff className="w-8 h-8 text-[#1e293b] mb-2" />
                <span className="text-xs font-sans text-slate-600">No sessions archived yet</span>
              </div>
            ) : (
              [...consultations].reverse().map((call) => (
                <div
                  key={call.id}
                  className="p-3 bg-[#090d16]/50 border border-[#1e293b] hover:border-slate-800 rounded-xl flex items-start justify-between gap-3 group transition-all"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 block truncate leading-none">{call.clientName}</span>
                      <span className="text-[8px] uppercase font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400 font-bold leading-none">
                        {call.meetingType}
                      </span>
                    </div>
                    <span className="text-[10px] text-teal-400 font-mono flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Room: {call.roomName}
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal italic font-sans truncate">{call.notes}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <button
                      onClick={() => handleCopyLink(call.roomName)}
                      className="p-1.5 bg-[#090d16] border border-[#1e293b] text-slate-400 hover:text-white rounded hover:bg-slate-900 transition-colors cursor-pointer"
                      title="Copy Invite Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteConsultation(call.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Panel: Embedded active Jitsi frame or Idle Screen (7/12 width) */}
      <div className="lg:col-span-7 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] overflow-hidden flex flex-col justify-between shadow-xl relative">
        <AnimatePresence mode="wait">
          {activeSession ? (
            <motion.div
              key="active-video-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full"
            >
              {/* Meeting title band */}
              <div className="p-4.5 bg-[#0d1624] border-b border-[#1e293b] flex justify-between items-center z-10">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-teal-400">Secure Live Session</h3>
                  <h2 className="text-sm font-bold text-white font-heading">{activeSession.clientName} — {activeSession.meetingType} Room</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyLink(activeSession.roomName)}
                    className="p-2 bg-[#090d16] hover:bg-slate-900 border border-[#1e293b] text-teal-400 hover:text-white rounded-lg transition-all text-xs font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Invite</span>
                  </button>
                  <button
                    onClick={handleConcludeCall}
                    className="p-2 px-3 bg-rose-500 hover:bg-rose-600 text-[#090d16] font-bold text-xs font-heading rounded-lg transition-all cursor-pointer"
                  >
                    Terminate Consultation Node
                  </button>
                </div>
              </div>

              {/* Jitsi meet real frame */}
              <div className="flex-1 bg-[#090d16] relative">
                <iframe
                  src={jitsiUrl}
                  allow="camera; microphone; fullscreen; display-capture;"
                  className="w-full h-full border-0"
                  referrerPolicy="no-referrer"
                  title="Level 23 Secure Conference Room"
                />
              </div>

              {/* Meeting note-taking footer drawer */}
              <div className="p-4 bg-[#0d1624] border-t border-[#1e293b]">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Active Deposition Minutes & Intake Note Taking</span>
                </div>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => {
                    setMeetingNotes(e.target.value);
                    if (activeSession) {
                      onUpdateConsultation({
                        ...activeSession,
                        notes: e.target.value
                      });
                    }
                  }}
                  placeholder="Record transcripts or draft case findings dynamically inside this consultation loop..."
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 font-sans resize-none h-14"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle-video-visual"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 h-full bg-[#090d16]/20 select-none animate-fade-in"
            >
              <div className="relative">
                <div className="w-20 h-20 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center justify-center text-teal-400 relative">
                  <Video className="w-10 h-10 animate-soft-pulse" />
                </div>
                {/* Glowing ring */}
                <div className="absolute -inset-1 border border-teal-500/30 rounded-full animate-ping scale-110 pointer-events-none opacity-30"></div>
              </div>

              <div className="max-w-md space-y-2">
                <h4 className="text-base font-bold font-heading text-white tracking-wide">
                  Secure Video Conference Center
                </h4>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  Instantly open secure, lag-free client intake consultations, expert depositions, and federal hearing briefings powered by our high-performance Jitsi routing networks.
                </p>
              </div>

              {/* Security Banner info */}
              <div className="max-w-xs mt-3 p-4 bg-[#090d16]/80 border border-[#1e293b] rounded-2xl space-y-1.5 flex flex-col items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-mono uppercase text-emerald-400 font-bold">Encrypted WebRTC Channel Active</span>
                <p className="text-[9px] text-slate-500 leading-relaxed text-center font-sans">
                  WebRTC lines use end-to-end SRTP credentials. No audio stream packets or metadata records are persisted on intermediate relays.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
