import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Briefcase,
  Calendar,
  FileText,
  Clock,
  ShieldCheck,
  Eye,
  User,
  Mail,
  Phone,
  Lock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import { Client, Matter, EvidenceFile } from '../types';

interface ClientPortalTabProps {
  clients: Client[];
  matters: Matter[];
  evidenceFiles: EvidenceFile[];
}

export default function ClientPortalTab({
  clients,
  matters,
  evidenceFiles
}: ClientPortalTabProps) {
  // Simulate active client selection for preview purposes
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients.length > 0 ? clients[0].id : ''
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Filter matters associated with this client
  const clientMatters = matters.filter(m => m.clientId === selectedClientId);

  // Collect all tasks/deadlines from the client's matters
  const allDeadlines = clientMatters.flatMap(matter => 
    matter.tasks.map(task => ({
      ...task,
      matterTitle: matter.title,
      caseNumber: matter.caseNumber
    }))
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Filter evidence files for this client
  const clientEvidence = evidenceFiles.filter(
    ef => ef.clientId === selectedClientId || ef.clientName === selectedClient?.name
  );

  // Styling helpers
  const containerBorder = "border-2 border-[#1e293b] bg-[#0a0f1d] p-6 shadow-xl relative overflow-hidden";
  const sectionTitle = "text-xs font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-[#1e293b] pb-2";
  const badgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-teal-500/10 border border-teal-500/30 text-teal-400';
      case 'pending':
        return 'bg-amber-500/10 border border-amber-500/30 text-amber-400';
      case 'completed':
        return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';
      default:
        return 'bg-slate-500/10 border border-slate-500/30 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Simulator Controls */}
      <div className="bg-[#0b1326] border-2 border-[#dfb76c]/30 p-5 shadow-lg relative">
        <div className="absolute top-0 right-0 p-1.5 bg-[#dfb76c]/10 border-b border-l border-[#dfb76c]/30 font-mono text-[8px] text-[#dfb76c] font-black uppercase tracking-wider">
          PORTAL REPLICATOR
        </div>

        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-sans font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-500 animate-pulse" />
              Secure Client Portal Console
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Simulate and inspect a client's read-only external dashboard to review litigation records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold self-center">
              Active Client Simulator:
            </span>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-[#050811] border-2 border-[#1e293b] text-amber-400 font-mono text-xs font-bold px-3 py-1.5 rounded-none focus:outline-none focus:border-amber-500"
            >
              {clients.length === 0 ? (
                <option value="">No clients registered</option>
              ) : (
                clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.practiceArea})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {selectedClient ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Client Credentials & Attorney Direct Line (4 cols) */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Client Credentials Card */}
            <div className={containerBorder}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-radial-gradient from-teal-500/5 via-transparent to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
              
              <h3 className={sectionTitle}>
                <User className="w-4 h-4 text-amber-500" />
                Verified Identity
              </h3>

              <div className="flex flex-col items-center text-center py-4 space-y-3 bg-[#060a12] border border-slate-900 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#dfb76c] to-[#fce093] flex items-center justify-center shadow-lg relative">
                  <span className="text-xl font-extrabold text-[#090d16] font-mono">
                    {selectedClient.name.split(' ').map(n => n[0]).join('')}
                  </span>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-[#0a0f1d] border border-emerald-500/50 p-1 rounded-full text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">{selectedClient.name}</h4>
                  <p className="text-[10px] text-teal-400 font-mono tracking-wide mt-0.5">{selectedClient.practiceArea} Department</p>
                </div>

                <span className={`px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded ${badgeStyle(selectedClient.status)}`}>
                  Status: {selectedClient.status}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-[#121a2e]">
                  <span className="text-slate-500 uppercase font-black text-[10px]">Client ID</span>
                  <span className="text-white font-bold">{selectedClient.id}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#121a2e] items-center min-w-0">
                  <span className="text-slate-500 uppercase font-black text-[10px] shrink-0 mr-2">Email Address</span>
                  <span className="text-slate-300 truncate font-semibold" title={selectedClient.email}>{selectedClient.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#121a2e]">
                  <span className="text-slate-500 uppercase font-black text-[10px]">Primary Phone</span>
                  <span className="text-slate-300 font-semibold">{selectedClient.phone}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 uppercase font-black text-[10px]">Portal Created</span>
                  <span className="text-slate-400">{new Date(selectedClient.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-slate-950 border border-[#1e293b] rounded-none">
                <div className="flex items-center gap-2 mb-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[9.5px] font-mono text-slate-400 font-extrabold uppercase tracking-wider">Secure Access Hash</span>
                </div>
                <p className="text-[9px] font-mono text-slate-600 truncate">
                  SHA-256://{selectedClient.name.toLowerCase().replace(/\s+/g, '_')}@level23.law.sec_compartment_v24.crt
                </p>
              </div>
            </div>

            {/* Legal Advisory / Secure Memo */}
            <div className={containerBorder}>
              <h3 className={sectionTitle}>
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Counsel Advisory Notes
              </h3>

              <div className="space-y-4">
                <div className="p-3 bg-teal-950/20 border border-teal-500/20 rounded-none">
                  <p className="text-[11px] text-teal-300 leading-relaxed italic">
                    "This is a verified secure workspace channel. Documents, file records, and deadlines shown here represent live litigation updates synchronized with the court clerk."
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2 text-slate-300">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Always consult your primary attorney before sharing any documents externally.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Upload additional court files directly using the client intake desk.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>For emergency hearings or prompt filings, call our direct line: <span className="text-teal-400 font-mono font-semibold">+1 (800) L23-DESK</span>.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Case Status, Deadlines & Evidence Repository (8 cols) */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Case Status & Matters Progress */}
            <div className={containerBorder}>
              <h3 className={sectionTitle}>
                <Briefcase className="w-4 h-4 text-amber-500" />
                Active Legal Matters & Case Progression
              </h3>

              {clientMatters.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-mono italic">
                  No active legal matters registered for this client.
                </div>
              ) : (
                <div className="space-y-6">
                  {clientMatters.map((matter) => (
                    <div key={matter.id} className="bg-[#050811] border border-[#1e293b] p-4 relative">
                      
                      {/* Top banner */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-2 border-b border-[#121a2e]">
                        <div>
                          <span className="text-[9px] font-mono text-teal-400 font-black uppercase tracking-wider block">
                            CASE REGISTER
                          </span>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-0.5">
                            {matter.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-slate-500 font-bold">
                            {matter.caseNumber}
                          </span>
                          <span className={`px-2.5 py-0.5 text-[9px] font-mono uppercase font-extrabold ${badgeStyle(matter.status)}`}>
                            {matter.status}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                        {matter.description}
                      </p>

                      {/* Visual Progress Milestones Gauge */}
                      <div className="space-y-2 mt-4 pt-4 border-t border-[#121a2e]">
                        <span className="text-[9px] font-mono text-slate-500 font-extrabold uppercase tracking-widest block">
                          Case Stage Progression Gauge
                        </span>
                        
                        <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[8px] text-slate-500">
                          {[
                            { label: 'Intake Completed', index: 1, color: 'border-teal-500 text-teal-400 bg-teal-500/10' },
                            { label: 'Fact Audit', index: 2, color: matter.status !== 'pending' ? 'border-teal-500 text-teal-400 bg-teal-500/10' : 'border-slate-800 text-slate-600 bg-slate-950' },
                            { label: 'Drafting Brief', index: 3, color: matter.status === 'active' ? 'border-amber-500 text-amber-400 bg-amber-500/5 animate-pulse' : matter.status === 'completed' ? 'border-teal-500 text-teal-400 bg-teal-500/10' : 'border-slate-800 text-slate-600 bg-slate-950' },
                            { label: 'Filing & Plead', index: 4, color: matter.status === 'completed' ? 'border-teal-500 text-teal-400 bg-teal-500/10' : 'border-slate-800 text-slate-600 bg-slate-950' },
                            { label: 'Judicial Hearing', index: 5, color: 'border-slate-800 text-slate-600 bg-slate-950' }
                          ].map((node) => (
                            <div key={node.index} className={`p-2 border rounded-none flex flex-col justify-between h-14 ${node.color}`}>
                              <span className="font-bold text-[8.5px] tracking-wide block leading-tight">
                                {node.label}
                              </span>
                              <span className="text-[8px] opacity-75 font-mono">
                                STAGE 0{node.index}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risk / Advisory Assessment Summary */}
                      {matter.riskAssessment && (
                        <div className="mt-4 p-3 bg-amber-950/15 border border-amber-500/20 text-[10.5px] leading-relaxed text-slate-300 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-400 font-mono text-[9px] uppercase tracking-wider block mb-0.5">Counsel Strategic Risk Summary</span>
                            {matter.riskAssessment}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Deadlines & Tasks */}
            <div className={containerBorder}>
              <h3 className={sectionTitle}>
                <Calendar className="w-4 h-4 text-amber-500" />
                Upcoming Deadlines & Filing Calendar
              </h3>

              {allDeadlines.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-mono italic">
                  No upcoming deadlines or court filings scheduled for this case.
                </div>
              ) : (
                <div className="relative border-l border-[#1e293b] pl-4 ml-2 space-y-4">
                  {allDeadlines.map((task) => {
                    const isOverdue = new Date(task.dueDate).getTime() < new Date().getTime() && !task.completed;
                    
                    return (
                      <div key={task.id} className="relative group text-left">
                        {/* Dot indicator on timeline */}
                        <span className={`absolute -left-6.5 top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          task.completed 
                            ? 'bg-emerald-500 border-emerald-400' 
                            : isOverdue 
                              ? 'bg-rose-500 border-rose-400 animate-pulse' 
                              : 'bg-[#0a0f1d] border-amber-500'
                        }`}>
                          {task.completed && <CheckCircle2 className="w-3.5 h-3.5 text-[#090d16]" />}
                        </span>

                        <div className="bg-[#050811] border border-[#1e293b] group-hover:border-[#dfb76c]/40 p-4 transition-colors">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <span className="text-[9.5px] font-mono text-slate-500 font-black tracking-widest uppercase">
                              Matter: {task.matterTitle}
                            </span>
                            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 border ${
                              task.completed 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                : isOverdue
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}>
                              Due: {new Date(task.dueDate).toLocaleDateString()} {isOverdue && '(Overdue)'}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-2">
                            {task.title}
                          </h4>

                          <div className="flex items-center gap-1.5 mt-3 text-[9px] text-slate-500 font-mono">
                            <Clock className="w-3 h-3 text-teal-400" />
                            <span>Action Status:</span>
                            <span className={task.completed ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                              {task.completed ? 'FILED & COMPLETED' : 'PENDING COURT SUBMISSION'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Uploaded Evidence Files */}
            <div className={containerBorder}>
              <h3 className={sectionTitle}>
                <FileText className="w-4 h-4 text-amber-500" />
                Uploaded Evidence Files & Scanned Media
              </h3>

              {clientEvidence.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-mono italic border border-dashed border-[#1e293b]">
                  No evidence files uploaded to this cabinet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientEvidence.map((file) => (
                    <div key={file.id} className="bg-[#050811] border border-[#1e293b] p-4 hover:border-teal-500/40 transition-colors flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="p-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs rounded-none">
                            <FileSpreadsheet className="w-4 h-4" />
                          </span>
                          <span className={`px-2 py-0.25 text-[8px] font-mono uppercase font-black tracking-wider ${
                            file.duressLevel === 'High' 
                              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' 
                              : 'bg-slate-500/10 border border-slate-500/30 text-slate-400'
                          }`}>
                            Duress Index: {file.duressLevel}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white uppercase tracking-wider truncate mb-1" title={file.name}>
                          {file.name}
                        </h4>
                        
                        <div className="font-mono text-[9px] text-slate-500 space-y-0.5">
                          <div>Size: <span className="text-slate-300">{file.size}</span></div>
                          <div>MimeType: <span className="text-slate-400">{file.mimeType}</span></div>
                          <div>Category: <span className="text-amber-500 font-bold uppercase">{file.fileCategory}</span></div>
                          <div>Uploaded: <span className="text-slate-400">{new Date(file.uploadedAt).toLocaleDateString()}</span></div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[#121a2e]">
                          <span className="text-[8.5px] font-mono text-slate-500 font-extrabold uppercase tracking-wide block mb-1">AI Extracted Summary</span>
                          <p className="text-[10px] text-slate-400 leading-relaxed italic">
                            "{file.summary || 'Summary pending OCR verification scans...'}"
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#121a2e] flex justify-end gap-2">
                        <span className="px-2 py-1 bg-teal-950/30 border border-teal-500/30 text-teal-400 font-mono text-[9px] font-black uppercase">
                          OCR Verified
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          
        </div>
      ) : (
        <div className="py-24 text-center text-slate-500 border-2 border-dashed border-[#1e293b] font-mono text-sm">
          No clients available. Create one in the "Clients" tab to access the simulator.
        </div>
      )}
    </div>
  );
}
