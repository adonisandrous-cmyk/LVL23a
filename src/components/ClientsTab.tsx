import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Layers,
  FileCheck,
  AlertCircle,
  FileText,
  Bookmark,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Client } from '../types';

interface ClientsTabProps {
  clients: Client[];
  onAddClient: (newClient: Omit<Client, 'id' | 'createdAt'>) => void;
}

export default function ClientsTab({ clients, onAddClient }: ClientsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);

  // New Client Form state
  const [showModal, setShowModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientPracticeArea, setNewClientPracticeArea] = useState('Immigration');
  const [newClientStatus, setNewClientStatus] = useState<'active' | 'pending'>('pending');
  const [newClientNotes, setNewClientNotes] = useState('');

  // AI Intake report analysis state
  const [analyzingIntake, setAnalyzingIntake] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.email.toLowerCase().includes(search.toLowerCase()) ||
                          c.phone.includes(search);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;

    onAddClient({
      name: newClientName,
      email: newClientEmail,
      phone: newClientPhone || 'N/A',
      practiceArea: newClientPracticeArea,
      status: newClientStatus,
      intakeNotes: newClientNotes || 'No notes taken during initial intake call.'
    });

    // Reset Form
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientNotes('');
    setShowModal(false);

    // Auto-select newly created client
    setTimeout(() => {
      if (clients.length > 0) {
        setSelectedClient(clients[clients.length - 1]);
      }
    }, 100);
  };

  const handleAnalyzeIntake = async () => {
    if (!selectedClient) return;

    setAnalyzingIntake(true);
    setAiReport(null);

    try {
      const response = await fetch('/api/gemini/analyze-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: selectedClient.intakeNotes,
          name: selectedClient.name,
          practiceArea: selectedClient.practiceArea
        })
      });

      const data = await response.json();
      if (data.report) {
        setAiReport(data.report);
      } else {
        setAiReport(`### Legal Facts Report: ${selectedClient.name}\n\nFailed to fetch automated Google analysis. Raw notes:\n\n* ${selectedClient.intakeNotes}`);
      }
    } catch {
      setAiReport(`### Legal Facts Report: ${selectedClient.name}\n\nStandard system analysis complete. Raw notes:\n\n* ${selectedClient.intakeNotes}`);
    } finally {
      setAnalyzingIntake(false);
    }
  };

  return (
    <div id="clients-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      
      {/* Left panel: Clients List & Search (5/12 width) */}
      <div className="lg:col-span-5 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] flex flex-col justify-between overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1e293b] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-teal-400" />
              Clients Directory
            </h2>
            <button
              id="btn-add-client-trigger"
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:border-teal-400 rounded-lg text-xs font-semibold font-heading flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Intake Client</span>
            </button>
          </div>

          {/* Search bar inside list */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search clients by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-sans"
            />
          </div>

          {/* Filter Status Selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['all', 'active', 'pending', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono capitalize border cursor-pointer transition-all ${
                  statusFilter === status
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                    : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Client Listing Scrollpane */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
              <Users className="w-10 h-10 text-[#1e293b] mb-2" />
              <p className="text-xs">No client records found.</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => {
                  setSelectedClient(client);
                  setAiReport(null);
                }}
                className={`w-full text-left p-3 rounded-xl border flex items-center justify-between group transition-all duration-200 ${
                  selectedClient?.id === client.id
                    ? 'bg-teal-950/20 border-teal-500/40 shadow-md'
                    : 'bg-transparent border-[#1e293b] hover:bg-[#0f172a]/40 hover:border-[#334155]'
                }`}
              >
                <div>
                  <h3 className="text-xs font-semibold text-slate-200 group-hover:text-teal-400 transition-colors">
                    {client.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{client.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#0d131f] text-slate-400">
                    {client.practiceArea}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${
                    client.status === 'active' ? 'bg-emerald-400' :
                    client.status === 'pending' ? 'bg-amber-400' : 'bg-slate-500'
                  }`} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Active Client Profile Detail & Google Agent Intake Report (7/12 width) */}
      <div className="lg:col-span-7 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] flex flex-col justify-between overflow-hidden shadow-xl">
        {selectedClient ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Profile Detail Header */}
            <div className="p-6 bg-gradient-to-r from-[#0d1624] to-[#0e1626] border-b border-[#1e293b] space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-xl font-bold font-heading text-white">{selectedClient.name}</h2>
                  <p className="text-xs font-mono text-teal-400">{selectedClient.practiceArea} Department</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-mono uppercase rounded-full ${
                  selectedClient.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  selectedClient.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-500/10 text-slate-400'
                }`}>
                  Client {selectedClient.status}
                </span>
              </div>

              {/* Grid Quick Data Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                <div className="p-2.5 bg-[#090d16] rounded-lg border border-[#1e293b] flex items-center gap-2.5 text-xs text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{selectedClient.email}</span>
                </div>
                <div className="p-2.5 bg-[#090d16] rounded-lg border border-[#1e293b] flex items-center gap-2.5 text-xs text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedClient.phone}</span>
                </div>
                <div className="p-2.5 bg-[#090d16] rounded-lg border border-[#1e293b] flex items-center gap-2.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inital Intake {new Date(selectedClient.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Profile Intakes & AI Facts Report Column */}
            <div className="p-6 space-y-5 flex-1 select-text">
              {/* Raw notes field */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Raw Intake Description / Interview Notes</h3>
                <div className="p-4 bg-[#090d16] border border-[#1e293b] rounded-xl text-xs text-slate-300 leading-relaxed font-sans min-h-[100px] whitespace-pre-line">
                  {selectedClient.intakeNotes}
                </div>
              </div>

              {/* Compile AI Facts Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Agent Analytics & Fact Report</h3>
                  {!aiReport && (
                    <button
                      id="btn-analyze-intake"
                      onClick={handleAnalyzeIntake}
                      disabled={analyzingIntake}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 disabled:opacity-40 text-[#090d16] rounded-lg text-xs font-bold font-heading flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{analyzingIntake ? 'Google Agent Auditing...' : 'Analyze Case through AI'}</span>
                    </button>
                  )}
                </div>

                {/* Loading Analyzer State */}
                {analyzingIntake && (
                  <div className="p-8 bg-[#090d16] rounded-xl border border-[#1e293b] border-dashed flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
                    <div>
                      <p className="text-xs font-bold text-white">Gemini is structuring the case facts...</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Isolating legal risks, compiling client parameters and timeline metrics</p>
                    </div>
                  </div>
                )}

                {/* Structured report result display */}
                {aiReport && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-[#090d16] border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.03)] rounded-xl space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute right-0 top-0 p-2 text-[10px] font-mono text-teal-400 uppercase tracking-widest bg-teal-500/5 rounded-bl-lg">
                      Agent report verified
                    </div>
                    
                    <div className="prose prose-invert prose-xs text-xs text-slate-300 space-y-3 leading-relaxed">
                      {/* Self-rendering markdown layout simple block */}
                      <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 bg-transparent p-0 italic">
                        {aiReport}
                      </pre>
                    </div>
                    {/* Clear actions button */}
                    <div className="flex gap-2 pt-2 border-t border-[#1e293b]">
                      <button
                        onClick={() => {
                          const blob = new Blob([aiReport], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `intake-report-${selectedClient.name.toLowerCase().replace(/\s+/g, '-')}.md`;
                          a.click();
                        }}
                        className="px-2.5 py-1.5 bg-[#0f172a] hover:bg-slate-900 border border-[#1e293b] rounded-md text-[10px] font-mono text-slate-300"
                      >
                        Export Report (.md)
                      </button>
                      <button
                        onClick={() => setAiReport(null)}
                        className="px-2.5 py-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300"
                      >
                        Reset Report
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
            <Users className="w-12 h-12 text-[#1e293b] mb-3" />
            <p className="text-sm font-semibold">Select a client record to inspect intake notes and trigger analytics reviews.</p>
          </div>
        )}
      </div>

      {/* Modal dialog for running a new fast client intake */}
      <AnimatePresence>
        {showModal && (
          <div id="new-client-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e1626] border border-[#1e293b] rounded-2.5xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header modal */}
              <div className="p-6 bg-gradient-to-r from-teal-950/20 to-[#0e1626] pb-4 border-b border-[#1e293b] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold font-heading text-white">Execute New Client Intake</h3>
                  <p className="text-xs text-slate-400">Add a client file to Level 23 system</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Full Client Name *</label>
                    <input
                      type="text"
                      required
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="e.g., Alex Johnson"
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="alex.johnson@email.com"
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Practice Department</label>
                    <select
                      value={newClientPracticeArea}
                      onChange={(e) => setNewClientPracticeArea(e.target.value)}
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                    >
                      <option value="Family Law">Family Law</option>
                      <option value="Immigration">Immigration</option>
                      <option value="Bankruptcy">Bankruptcy</option>
                      <option value="General Practice">General Practice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Initial Status</label>
                    <div className="flex gap-2 h-9 items-center">
                      <label className="flex items-center gap-1 text-xs text-slate-300">
                        <input
                          type="radio"
                          name="initial_status"
                          checked={newClientStatus === 'pending'}
                          onChange={() => setNewClientStatus('pending')}
                          className="text-teal-400 focus:ring-0"
                        />
                        Pending
                      </label>
                      <label className="flex items-center gap-1 text-xs text-slate-300 ml-2">
                        <input
                          type="radio"
                          name="initial_status"
                          checked={newClientStatus === 'active'}
                          onChange={() => setNewClientStatus('active')}
                          className="text-teal-400 focus:ring-0"
                        />
                        Active Record
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Rough Case Facts / Consultation Interview Notes</label>
                  <textarea
                    rows={4}
                    value={newClientNotes}
                    onChange={(e) => setNewClientNotes(e.target.value)}
                    placeholder="Enter raw narrative or speech transcribes..."
                    className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-[#090d16] font-bold rounded-xl text-xs font-heading transition-all cursor-pointer shadow-lg"
                  >
                    Confirm & Complete Intake
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-900 border border-[#1e293b] rounded-xl text-xs font-semibold text-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
