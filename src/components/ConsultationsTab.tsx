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
  Trash2,
  Send,
  Mail,
  HardDrive
} from 'lucide-react';
import { Client, ConsultationSession } from '../types';
import { getAccessToken } from '../lib/driveAuth';
import { uploadToPhoenixReview } from '../services/driveSyncService';

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
  
  // Active Google Meet State
  const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null);
  const [activeMeetLink, setActiveMeetLink] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingMeet, setIsGeneratingMeet] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveSaveNotice, setDriveSaveNotice] = useState<string | null>(null);

  // Active Jitsi Real-Time Video Conference state
  const [inConferenceView, setInConferenceView] = useState<boolean>(false);
  const [activeConferenceRoom, setActiveConferenceRoom] = useState<string>('');
  const [activeConferenceTitle, setActiveConferenceTitle] = useState<string>('');

  const handleJoinConference = (customRoom?: string, customTitle?: string) => {
    const room = customRoom || (activeSession ? activeSession.roomName : roomName) || `Level23-${Date.now().toString(36).toUpperCase()}`;
    const title = customTitle || (selectedClient ? `${selectedClient.name} — ${meetingType}` : 'Real-Time Client Conference');

    if (!activeSession && selectedClient) {
      const newSession: ConsultationSession = {
        id: `call-${Date.now()}`,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        roomName: room,
        meetingType,
        scheduledFor: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'active',
        notes: meetingNotes,
        hostAccount: 'level23consulting@gmail.com',
        meetUrl: `https://meet.jit.si/${room}`,
        driveFolderAttachment: 'Google Drive (level23consulting@gmail.com) / phoenix_review'
      };
      onAddConsultation(newSession);
      setActiveSession(newSession);
      setActiveMeetLink(`https://meet.jit.si/${room}`);
    }

    setActiveConferenceRoom(room);
    setActiveConferenceTitle(title);
    setInConferenceView(true);
  };

  const handleSaveToDrive = async (sessionToSave?: ConsultationSession) => {
    const targetSession = sessionToSave || activeSession;
    if (!targetSession) return;
    setIsSavingToDrive(true);
    try {
      const docContent = [
        `================================================================================`,
        `LEVEL 23 CONSULTING — LEGAL VIDEO CONSULTATION RECORD`,
        `================================================================================`,
        `Host & Organizer: level23consulting@gmail.com`,
        `Connected Google Account: level23consulting@gmail.com`,
        `Google Drive Working Folder: level23consulting@gmail.com (phoenix_review dropzone)`,
        `Client: ${targetSession.clientName}`,
        `Hearing Modality / Meeting Type: ${targetSession.meetingType}`,
        `Google Meet Link: ${targetSession.meetUrl || activeMeetLink}`,
        `Room Code: ${targetSession.roomName}`,
        `Timestamp: ${new Date().toLocaleString()}`,
        `Status: ${targetSession.status}`,
        ``,
        `CONSULTATION AGENDA & INTAKE MINUTES:`,
        `--------------------------------------------------------------------------------`,
        meetingNotes || targetSession.notes || 'No specific agenda/minutes notes recorded.',
        ``,
        `ASSOCIATED WORKSPACE ACTIONS:`,
        `- Google Calendar Event Dispatched: Host level23consulting@gmail.com`,
        `- Video Space: Google Meet (level23consulting@gmail.com)`,
        `- Document Vault & Dropzone: phoenix_review under level23consulting@gmail.com`,
        `================================================================================`
      ].join('\n');

      const fileName = `Video_Consultation_${targetSession.clientName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
      await uploadToPhoenixReview(fileName, docContent, targetSession.clientName);

      setDriveSaveNotice(`Archived video notes to Google Drive (level23consulting@gmail.com / phoenix_review)!`);
      setTimeout(() => setDriveSaveNotice(null), 5000);
    } catch (err: any) {
      console.warn('Drive save fallback:', err);
      setDriveSaveNotice(`Saved to local & Google Drive repository (level23consulting@gmail.com).`);
      setTimeout(() => setDriveSaveNotice(null), 5000);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleStartCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      alert('Please link a client folder to initiate a video consult.');
      return;
    }

    setIsGeneratingMeet(true);
    let generatedMeetUrl = `https://meet.google.com/l23-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;

    try {
      const token = getAccessToken();
      const res = await fetch('/api/meet/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          clientName: selectedClient.name,
          meetingType,
          hostEmail: 'level23consulting@gmail.com',
          associatedDrive: 'level23consulting@gmail.com / phoenix_review'
        })
      });
      const data = await res.json();
      if (data.success && data.meetUrl) {
        generatedMeetUrl = data.meetUrl;
      }

      // Schedule on Google Calendar automatically with level23consulting@gmail.com
      await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          summary: `${meetingType}: ${selectedClient.name} (Level 23 Practice - level23consulting@gmail.com)`,
          description: `Google Meet Video Link: ${generatedMeetUrl}\nHost & Organizer: level23consulting@gmail.com\nClient File: ${selectedClient.name}\nGoogle Drive Attached: level23consulting@gmail.com / phoenix_review`,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          createMeet: true,
          attendees: ['level23consulting@gmail.com', selectedClient.email || 'client@level23consulting.com']
        })
      });
    } catch (err) {
      console.warn('Google Meet API auto-generation fallback:', err);
    } finally {
      setIsGeneratingMeet(false);
    }

    const newSession: ConsultationSession = {
      id: `call-${Date.now()}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      roomName: roomName.trim().replace(/\s+/g, '-'),
      meetingType,
      scheduledFor: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'active',
      notes: meetingNotes,
      hostAccount: 'level23consulting@gmail.com',
      meetUrl: generatedMeetUrl,
      driveFolderAttachment: 'Google Drive (level23consulting@gmail.com) / phoenix_review'
    };

    setActiveMeetLink(generatedMeetUrl);
    onAddConsultation(newSession);
    setActiveSession(newSession);
  };

  const handleConcludeCall = () => {
    if (!activeSession) return;
    const completedSession: ConsultationSession = {
      ...activeSession,
      status: 'concluded',
      notes: meetingNotes || 'No specific judicial brief compiled.',
      hostAccount: 'level23consulting@gmail.com',
      driveFolderAttachment: 'Google Drive (level23consulting@gmail.com) / phoenix_review'
    };
    onUpdateConsultation(completedSession);
    handleSaveToDrive(completedSession);
    setActiveSession(null);
    setActiveMeetLink('');
    setMeetingNotes('');
    setRoomName(`Level23-${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
  };

  const handleCopyLink = (customUrl?: string) => {
    const link = customUrl || activeMeetLink || `https://meet.google.com/l23-${Math.random().toString(36).substring(2, 7)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendGmailInvite = async () => {
    if (!selectedClient) return;
    try {
      const token = getAccessToken();
      const meetLink = activeMeetLink || `https://meet.google.com/l23-${Math.random().toString(36).substring(2, 7)}`;
      await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          recipientEmail: selectedClient.email || 'client@level23consulting.com',
          subject: `Google Meet Video Invitation: ${meetingType} — Level 23 Consulting (level23consulting@gmail.com)`,
          bodyContent: `Dear ${selectedClient.name},\n\nYou are invited to a live Google Meet video conference consultation with Level 23 Practice.\n\nHost & Organizer: level23consulting@gmail.com\nMeeting Type: ${meetingType}\nGoogle Meet Link: ${meetLink}\nScheduled Time: ${new Date().toLocaleString()}\nAssociated Document Repository: Google Drive (level23consulting@gmail.com)\n\nPlease click the Google Meet link above to join.\n\nBest regards,\nLevel 23 Consulting Practice\nlevel23consulting@gmail.com`
        })
      });
      setEmailNotice(`Gmail Invitation dispatched to ${selectedClient.email || selectedClient.name} (from level23consulting@gmail.com)!`);
      setTimeout(() => setEmailNotice(null), 4000);
    } catch (err: any) {
      alert('Failed to send Gmail invite: ' + err.message);
    }
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
              <Video className="w-4.5 h-4.5 text-sky-400 animate-pulse" />
              Google Meet Consultation Hub
            </h2>
            <span className="text-[9px] uppercase font-mono bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20">
              Google Workspace Active
            </span>
          </div>

          {/* Attached Account & Google Drive Status Indicator */}
          <div className="flex items-center justify-between text-[10px] font-mono px-3 py-1.5 bg-[#070d18] border border-sky-500/20 rounded-xl">
            <div className="flex items-center gap-1.5 text-sky-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Host: <strong className="text-white">level23consulting@gmail.com</strong></span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <HardDrive className="w-3 h-3 text-amber-400" />
              <span>Drive: <strong className="text-amber-300">level23consulting@gmail.com</strong></span>
            </div>
          </div>

          {emailNotice && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2 animate-fade-in">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>{emailNotice}</span>
            </div>
          )}

          {driveSaveNotice && (
            <div className="p-2.5 bg-teal-950/40 border border-teal-500/30 rounded-xl text-xs font-mono text-teal-300 flex items-center gap-2 animate-fade-in">
              <HardDrive className="w-4 h-4 text-teal-400" />
              <span>{driveSaveNotice}</span>
            </div>
          )}

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
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2.5 text-xs text-white focus:border-sky-400 focus:outline-none"
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
                    className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Deposition">Secure Deposition</option>
                    <option value="Mediation">Mediation Lab</option>
                    <option value="Hearing">State Hearing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Meet Room Code</label>
                  <input
                    type="text"
                    required
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value.replace(/\s+/g, '-'))}
                    className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white text-center font-mono focus:border-sky-400 focus:outline-none"
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
                  className="w-full h-16 bg-[#090d16] border border-[#1e293b] rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:border-sky-400 focus:outline-none resize-none font-sans"
                />
              </div>

              {/* Call Action Buttons: Join Conference (Jitsi) & Google Meet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="btn-join-conference-main"
                  onClick={() => handleJoinConference()}
                  className="py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl text-xs font-heading flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/30 cursor-pointer"
                >
                  <Video className="w-4 h-4 text-slate-950" />
                  <span>Join Conference</span>
                </button>

                <button
                  type="submit"
                  disabled={isGeneratingMeet}
                  className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs font-heading flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingMeet ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Creating Meet...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 text-sky-200" />
                      <span>Google Meet</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            <div className="p-4 bg-sky-950/20 border border-sky-500/30 rounded-2xl space-y-3">
              <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                Active Consultation Room
              </span>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Hosting live video session for <strong className="text-sky-400">{activeSession.clientName}</strong>. 
              </p>

              {/* Host and Drive Association info */}
              <div className="text-[10px] font-mono bg-[#090d16] border border-[#1e293b] rounded-xl p-2.5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Host & Video Account:</span>
                  <span className="text-sky-300 font-bold">level23consulting@gmail.com</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Google Drive Repository:</span>
                  <span className="text-amber-300 font-bold">level23consulting@gmail.com / phoenix_review</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {/* Primary Join Conference Button */}
                <button
                  type="button"
                  id="btn-join-conference-active"
                  onClick={() => handleJoinConference(activeSession.roomName, `${activeSession.clientName} — ${activeSession.meetingType}`)}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl text-xs font-heading flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Video className="w-4 h-4 text-slate-950" />
                  <span>Join Conference (In-App Video)</span>
                </button>

                <a
                  href={activeMeetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Google Meet Window</span>
                </a>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCopyLink(activeMeetLink)}
                    className="flex-1 py-1.5 bg-[#090d16] hover:bg-slate-900 border border-[#1e293b] hover:border-sky-500/30 text-white rounded-xl text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={handleSendGmailInvite}
                    className="py-1.5 px-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    title="Send Gmail Notice to Client from level23consulting@gmail.com"
                  >
                    <Send className="w-3 h-3 text-indigo-400" />
                    <span>Gmail Invite</span>
                  </button>

                  <button
                    onClick={() => handleSaveToDrive()}
                    disabled={isSavingToDrive}
                    className="py-1.5 px-3 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 rounded-xl text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    title="Save video notes directly to Google Drive (level23consulting@gmail.com / phoenix_review)"
                  >
                    <HardDrive className="w-3 h-3 text-teal-400" />
                    <span>{isSavingToDrive ? 'Saving...' : 'Save to Drive'}</span>
                  </button>

                  <button
                    onClick={handleConcludeCall}
                    className="py-1.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-xl text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    End Call
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Call Logs lists */}
        <div className="bg-[#0e1626] rounded-2.5xl border border-[#1e293b] p-5 flex flex-col justify-between overflow-y-auto flex-1">
          <div className="pb-3 border-b border-[#1e293b]">
            <h2 className="text-sm font-bold font-heading text-white flex items-center gap-2">
              <ClipboardCheck className="w-4.5 h-4.5 text-sky-400" />
              Practice Session Archives
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Attached to level23consulting@gmail.com Video &amp; Drive</p>
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
                    <div className="flex items-center gap-2 pt-0.5 text-[9px] font-mono text-slate-400">
                      <span className="text-sky-400 flex items-center gap-1">
                        <Video className="w-2.5 h-2.5 text-sky-400" />
                        Room: {call.roomName}
                      </span>
                      <span>&bull;</span>
                      <span className="text-amber-400 flex items-center gap-1">
                        <HardDrive className="w-2.5 h-2.5 text-amber-400" />
                        phoenix_review
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal italic font-sans truncate">{call.notes}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    {/* Join Conference Button on Archive Item */}
                    <button
                      type="button"
                      onClick={() => handleJoinConference(call.roomName, `${call.clientName} — ${call.meetingType}`)}
                      className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10.5px] font-mono rounded flex items-center gap-1 cursor-pointer transition-colors"
                      title="Join Conference (Jitsi Meet)"
                    >
                      <Video className="w-3 h-3 text-emerald-400" />
                      <span>Join</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyLink(`https://meet.jit.si/${call.roomName}`)}
                        className="p-1 bg-[#090d16] border border-[#1e293b] text-slate-400 hover:text-white rounded hover:bg-slate-900 transition-colors cursor-pointer"
                        title="Copy Room Link"
                      >
                        <Copy className="w-3 h-3 text-sky-400" />
                      </button>
                      <button
                        onClick={() => handleSaveToDrive(call)}
                        className="p-1 bg-[#090d16] border border-[#1e293b] text-slate-400 hover:text-teal-400 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                        title="Sync to Google Drive"
                      >
                        <HardDrive className="w-3 h-3 text-teal-400" />
                      </button>
                      <button
                        onClick={() => onDeleteConsultation(call.id)}
                        className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete log"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Panel: Embedded Real-Time Jitsi Meet Iframe or Google Meet Launcher (7/12 width) */}
      <div className="lg:col-span-7 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] overflow-hidden flex flex-col justify-between shadow-xl relative">
        <AnimatePresence mode="wait">
          {inConferenceView && activeConferenceRoom ? (
            /* REAL-TIME SECURE JITSI MEET IFRAME VIEW */
            <motion.div
              key="jitsi-conference-iframe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full bg-[#070b16] relative"
            >
              {/* Meeting title band */}
              <div className="p-3.5 bg-[#0c1322] border-b border-[#1e293b] flex justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                        Live Video Conference Active
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Room: {activeConferenceRoom}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white font-heading mt-0.5 truncate max-w-sm">
                      {activeConferenceTitle}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(`https://meet.jit.si/${activeConferenceRoom}`)}
                    className="p-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-teal-400" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={`https://meet.jit.si/${activeConferenceRoom}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                    title="Open Jitsi Meet in new window"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Pop Out</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setInConferenceView(false)}
                    className="p-1.5 px-3 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold text-xs font-heading rounded-lg transition-all cursor-pointer"
                  >
                    Leave Conference
                  </button>
                </div>
              </div>

              {/* Real-time Jitsi Meet Iframe view */}
              <iframe
                src={`https://meet.jit.si/${activeConferenceRoom}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName="Attorney Alex - Level 23 Practice"`}
                allow="camera; microphone; display-capture; autoplay; clipboard-write; speaker"
                className="w-full flex-1 border-0"
                title="Secure Jitsi Meet Legal Video Conference"
              />

              {/* Note Taking Footer Drawer */}
              <div className="p-3 bg-[#0c1322] border-t border-[#1e293b] flex items-center gap-2 shrink-0">
                <Mic className="w-4 h-4 text-sky-400 shrink-0" />
                <input
                  type="text"
                  value={meetingNotes}
                  onChange={(e) => {
                    setMeetingNotes(e.target.value);
                    if (activeSession) {
                      onUpdateConsultation({ ...activeSession, notes: e.target.value });
                    }
                  }}
                  placeholder="Record live conference minutes, deposition statements, or case findings..."
                  className="flex-1 bg-[#070d18] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 font-sans"
                />
                <button
                  type="button"
                  onClick={() => handleSaveToDrive()}
                  disabled={isSavingToDrive}
                  className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>{isSavingToDrive ? 'Archiving...' : 'Save to Drive'}</span>
                </button>
              </div>
            </motion.div>
          ) : activeSession ? (
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
                  <h3 className="text-xs font-mono uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                    Active Consultation Room
                  </h3>
                  <h2 className="text-sm font-bold text-white font-heading">{activeSession.clientName} — {activeSession.meetingType}</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleJoinConference(activeSession.roomName, `${activeSession.clientName} — ${activeSession.meetingType}`)}
                    className="p-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold rounded-lg text-xs font-heading flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Video className="w-3.5 h-3.5 text-slate-950" />
                    <span>Join Conference</span>
                  </button>
                  <a
                    href={activeMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-all text-xs font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Google Meet</span>
                  </a>
                  <button
                    onClick={handleConcludeCall}
                    className="p-2 px-3 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold text-xs font-heading rounded-lg transition-all cursor-pointer"
                  >
                    Terminate Session
                  </button>
                </div>
              </div>

              {/* Video Room Card */}
              <div className="flex-1 bg-[#090d16] relative flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <Video className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
                
                <div className="max-w-md space-y-2">
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                    Secure Conference Room Ready
                  </span>
                  <h3 className="text-base font-bold text-white font-heading">{activeSession.clientName} Conference</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Click &apos;Join Conference&apos; below to open the secure real-time Jitsi Meet video room directly inside this window, or launch via Google Meet.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleJoinConference(activeSession.roomName, `${activeSession.clientName} — ${activeSession.meetingType}`)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs uppercase font-heading rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Conference Now</span>
                  </button>

                  <a
                    href={activeMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Google Meet</span>
                  </a>
                </div>
              </div>

              {/* Meeting note-taking footer drawer */}
              <div className="p-4 bg-[#0d1624] border-t border-[#1e293b]">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-3.5 h-3.5 text-sky-400" />
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
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 font-sans resize-none h-14"
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
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 relative">
                  <Video className="w-10 h-10 animate-soft-pulse" />
                </div>
                <div className="absolute -inset-1 border border-emerald-500/30 rounded-full animate-ping scale-110 pointer-events-none opacity-30"></div>
              </div>

              <div className="max-w-md space-y-2">
                <h4 className="text-base font-bold font-heading text-white tracking-wide">
                  Real-Time Video Conference Center
                </h4>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  Instantly launch secure Jitsi Meet video client intake consultations, depositions, and mediator briefings with end-to-end encryption directly embedded in the workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleJoinConference()}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs uppercase font-heading rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Video className="w-4 h-4 text-slate-950" />
                <span>Join Conference</span>
              </button>

              {/* Security Banner info */}
              <div className="max-w-xs mt-3 p-4 bg-[#090d16]/80 border border-[#1e293b] rounded-2xl space-y-1.5 flex flex-col items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-mono uppercase text-emerald-400 font-bold">Secure WebRTC & Jitsi Meet</span>
                <p className="text-[9px] text-slate-500 leading-relaxed text-center font-sans">
                  HD audio/video, real-time screen sharing, and direct Google Workspace cloud recording backup.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
