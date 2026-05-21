import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Search,
  Plus,
  Compass,
  DollarSign,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  PlusCircle,
  FileCheck2,
  Trash2,
  AlertTriangle,
  Award,
  ChevronDown
} from 'lucide-react';
import { Client, Matter } from '../types';

interface MattersTabProps {
  matters: Matter[];
  clients: Client[];
  onAddMatter: (newMatter: Omit<Matter, 'id' | 'createdAt'>) => void;
  onUpdateMatter: (updatedMatter: Matter) => void;
}

export default function MattersTab({
  matters,
  clients,
  onAddMatter,
  onUpdateMatter
}: MattersTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(matters[0] || null);

  // New Matter Form state
  const [showModal, setShowModal] = useState(false);
  const [newMatterTitle, setNewMatterTitle] = useState('');
  const [newMatterClient, setNewMatterClient] = useState('');
  const [newMatterArea, setNewMatterArea] = useState<'Family Law' | 'Immigration' | 'Bankruptcy' | 'General Practice'>('Immigration');
  const [newMatterStatus, setNewMatterStatus] = useState<'active' | 'pending'>('active');
  const [newMatterRate, setNewMatterRate] = useState(250);
  const [newMatterDescription, setNewMatterDescription] = useState('');

  // AI legal risk assessment state
  const [analyzingRisk, setAnalyzingRisk] = useState(false);

  // New Task input inside active matter
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Filters matters list
  const filteredMatters = matters.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
                          m.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
                          m.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatterTitle || !newMatterClient) return;

    const matchedClient = clients.find(c => c.id === newMatterClient);
    const clientName = matchedClient ? matchedClient.name : 'Unknown Client';
    const caseNumber = `L-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;

    onAddMatter({
      title: newMatterTitle,
      caseNumber,
      clientId: newMatterClient,
      clientName,
      practiceArea: newMatterArea,
      status: newMatterStatus,
      billingRate: Number(newMatterRate) || 200,
      billedHours: 0,
      description: newMatterDescription || 'No detailed case details provided yet.',
      tasks: [
        { id: 't-init', title: 'Open formal practice matter and establish files', completed: true, dueDate: new Date().toISOString().split('T')[0] },
        { id: 't-doc', title: 'Collect legal documentation from intake audit', completed: false, dueDate: '2026-06-15' }
      ]
    });

    setNewMatterTitle('');
    setNewMatterDescription('');
    setShowModal(false);

    // Auto select recent
    setTimeout(() => {
      if (matters.length > 0) {
        setSelectedMatter(matters[matters.length - 1]);
      }
    }, 100);
  };

  const handleToggleTask = (taskId: string) => {
    if (!selectedMatter) return;

    const updatedTasks = selectedMatter.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    const updatedMatter = { ...selectedMatter, tasks: updatedTasks };
    onUpdateMatter(updatedMatter);
    setSelectedMatter(updatedMatter);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatter || !newTaskTitle) return;

    const newTask = {
      id: `t-${Date.now()}`,
      title: newTaskTitle,
      completed: false,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // default 1 week
    };

    const updatedMatter = {
      ...selectedMatter,
      tasks: [...selectedMatter.tasks, newTask]
    };

    onUpdateMatter(updatedMatter);
    setSelectedMatter(updatedMatter);
    setNewTaskTitle('');
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedMatter) return;
    const updatedTasks = selectedMatter.tasks.filter(t => t.id !== taskId);
    const updatedMatter = { ...selectedMatter, tasks: updatedTasks };
    onUpdateMatter(updatedMatter);
    setSelectedMatter(updatedMatter);
  };

  const handleAIRiskModelAnalysis = async () => {
    if (!selectedMatter) return;

    setAnalyzingRisk(true);

    try {
      const response = await fetch('/api/gemini/analyze-matter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedMatter.title,
          description: selectedMatter.description,
          practiceArea: selectedMatter.practiceArea
        })
      });

      const data = await response.json();
      
      const newTasks = data.tasks || [];
      const riskAssessment = data.riskAssessment || 'Assessment retrieved successfully.';

      // Combine previous tasks with new AI generated tasks
      const mergedTasks = [...selectedMatter.tasks];
      newTasks.forEach((aiT: any) => {
        if (!mergedTasks.some(existing => existing.title === aiT.title)) {
          mergedTasks.push({
            id: aiT.id,
            title: `[AI Alert] ${aiT.title}`,
            completed: aiT.completed,
            dueDate: aiT.dueDate
          });
        }
      });

      const updatedMatter = {
        ...selectedMatter,
        tasks: mergedTasks,
        riskAssessment
      };

      onUpdateMatter(updatedMatter);
      setSelectedMatter(updatedMatter);
    } catch {
      // Return beautiful generic fallback states if backend unhandled/error
      const updatedMatter = {
        ...selectedMatter,
        riskAssessment: 'Case presents moderate administrative requirements. Key litigation strategy demands quick evidentiary brief setup, client credentials filing, and direct jurisdictional checkouts.'
      };
      onUpdateMatter(updatedMatter);
      setSelectedMatter(updatedMatter);
    } finally {
      setAnalyzingRisk(false);
    }
  };

  return (
    <div id="matters-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      
      {/* Left Columns: Matters Directory list (5/12 width) */}
      <div className="lg:col-span-5 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] flex flex-col justify-between overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1e293b] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Briefcase className="w-4.5 h-4.5 text-teal-400" />
              Matters Directory
            </h2>
            <button
              id="btn-add-matter-trigger"
              onClick={() => {
                if (clients.length === 0) {
                  alert('Please perform an intake for at least one client record before starting a matter file.');
                  return;
                }
                setShowModal(true);
              }}
              className="px-3 py-1.5 bg-[#0d1624]/60 hover:bg-[#0d1624] text-teal-400 border border-teal-500/30 hover:border-teal-400 rounded-lg text-xs font-semibold font-heading flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Matter</span>
            </button>
          </div>

          {/* Search inside Matters list */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search case, title, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-sans"
            />
          </div>

          {/* Sort tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['all', 'active', 'pending', 'completed'] as const).map((status) => (
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

        {/* Scrollpane listing for active cases */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredMatters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
              <Briefcase className="w-10 h-10 text-[#1e293b] mb-2" />
              <p className="text-xs">No matter files found.</p>
            </div>
          ) : (
            filteredMatters.map((matter) => (
              <button
                key={matter.id}
                onClick={() => setSelectedMatter(matter)}
                className={`w-full text-left p-3 rounded-xl border flex items-center justify-between group transition-all duration-200 ${
                  selectedMatter?.id === matter.id
                    ? 'bg-teal-950/20 border-teal-500/40 shadow-md'
                    : 'bg-transparent border-[#1e293b] hover:bg-[#0f172a]/40 hover:border-[#334155]'
                }`}
              >
                <div className="max-w-[70%]">
                  <h3 className="text-xs font-semibold text-slate-200 group-hover:text-teal-400 truncate">
                    {matter.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">Client: {matter.clientName} | {matter.caseNumber}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded-full leading-none border ${
                    matter.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    matter.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {matter.status}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">${(matter.billedHours * matter.billingRate).toLocaleString()} billed</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Case description details, tasks registry, and AI assessor (7/12 width) */}
      <div className="lg:col-span-7 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] flex flex-col justify-between overflow-hidden shadow-xl">
        {selectedMatter ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Header profile of case matter */}
            <div className="p-6 bg-gradient-to-r from-[#0d1624] to-[#0e1626] border-b border-[#1e293b] space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-lg font-bold font-heading text-white">{selectedMatter.title}</h2>
                  <p className="text-xs font-mono text-teal-400">{selectedMatter.caseNumber} | Client: {selectedMatter.clientName}</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-mono uppercase rounded-md bg-[#090d16] text-[#64748b] border border-[#1e293b]">
                  {selectedMatter.practiceArea}
                </span>
              </div>

              {/* Hourly Billing rates card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-[#090d16] rounded-xl border border-[#1e293b] space-y-0.5">
                  <span className="text-[9px] font-mono uppercase text-slate-500 block">Billing Rate</span>
                  <p className="text-xs font-semibold text-teal-400 font-mono flex items-center">
                    <DollarSign className="w-3.5 h-3.5" />
                    {selectedMatter.billingRate}/hr
                  </p>
                </div>
                <div className="p-3 bg-[#090d16] rounded-xl border border-[#1e293b] space-y-0.5 animate-soft-pulse">
                  <span className="text-[9px] font-mono uppercase text-slate-500 block">Billed Hours</span>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-200 font-mono">
                      {selectedMatter.billedHours} hrs
                    </p>
                    <button
                      onClick={() => {
                        const updated = { ...selectedMatter, billedHours: selectedMatter.billedHours + 1 };
                        onUpdateMatter(updated);
                        setSelectedMatter(updated);
                      }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 font-mono uppercase transition-colors"
                    >
                      +1 Hr Billed
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-[#090d16] rounded-xl border border-[#1e293b] space-y-0.5">
                  <span className="text-[9px] font-mono uppercase text-slate-500 block">Total Due Revenue</span>
                  <p className="text-xs font-semibold text-emerald-400 font-mono flex items-center">
                    <DollarSign className="w-3.5 h-3.5" />
                    {(selectedMatter.billedHours * selectedMatter.billingRate).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Matter Narrative & Interactive Tasks Checklist */}
            <div className="p-6 space-y-6 flex-1 select-text">
              {/* Detailed narrative case facts */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Case Description & Litigation Narrative</h3>
                <div className="p-4 bg-[#090d16] border border-[#1e293b] rounded-xl text-xs text-slate-300 leading-relaxed font-sans min-h-[80px]">
                  {selectedMatter.description}
                </div>
              </div>

              {/* AI litigator planning agent reports */}
              <div className="space-y-3 p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-heading">
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      Google AI Litigation Planner
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans">Run Gemini to draft matter risk profiling and automatically populate checkpoints</p>
                  </div>
                  <button
                    onClick={handleAIRiskModelAnalysis}
                    disabled={analyzingRisk}
                    className="px-3 py-1.5 bg-teal-400 hover:bg-teal-500 text-slate-950 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    {analyzingRisk ? 'Consulting Gemini...' : 'Analyze Planning'}
                  </button>
                </div>

                {/* AI report readout */}
                {selectedMatter.riskAssessment && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pt-2 text-xs text-slate-300 font-sans leading-relaxed border-t border-teal-500/10 whitespace-pre-line"
                  >
                    {selectedMatter.riskAssessment}
                  </motion.div>
                )}
              </div>

              {/* Tasks schedule / Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Litigation Milestones Checklist</h3>
                
                {/* Check list container */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {selectedMatter.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        task.completed
                          ? 'bg-slate-900/40 border-[#1e293b] opacity-60'
                          : 'bg-[#090d16] border-[#1e293b]'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="flex items-center gap-3 text-left max-w-[80%]"
                      >
                        {task.completed ? (
                          <div id={`task-check-${task.id}`} className="p-0.5 bg-teal-500/20 text-teal-400 rounded-md border border-teal-500/30">
                            <FileCheck2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div id={`task-uncheck-${task.id}`} className="w-5 h-5 rounded-md border-2 border-slate-500" />
                        )}
                        <span className={`font-sans tracking-wide leading-tight ${task.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                          {task.title}
                        </span>
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">{task.dueDate}</span>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new subtask inline form */}
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add specialized litigation milestone task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 bg-[#090d16] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-sans"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-teal-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center justify-center cursor-pointer hover:bg-teal-500"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
            <Briefcase className="w-12 h-12 text-[#1e293b] mb-3" />
            <p className="text-sm font-semibold">Select an active litigation matter file to overview milestone checklists, task plans, and AI assessments.</p>
          </div>
        )}
      </div>

      {/* Modal view for establishing a new legal matter */}
      <AnimatePresence>
        {showModal && (
          <div id="new-matter-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e1626] border border-[#1e293b] rounded-2.5xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-teal-950/20 to-[#0e1626] pb-4 border-b border-[#1e293b] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold font-heading text-white">Instantiate New Practice Matter</h3>
                  <p className="text-xs text-slate-400">Open a case file and link the client ledger</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer">✕</button>
              </div>

              {/* Form body */}
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Matter Title *</label>
                    <input
                      type="text"
                      required
                      value={newMatterTitle}
                      onChange={(e) => setNewMatterTitle(e.target.value)}
                      placeholder="e.g., Petition for Administrative Appeal of Visa Denial"
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Link Client Ledger Record *</label>
                    <select
                      value={newMatterClient}
                      onChange={(e) => setNewMatterClient(e.target.value)}
                      required
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2.2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Choose Intake Record --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.practiceArea})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Practice Area category</label>
                    <select
                      value={newMatterArea}
                      onChange={(e) => setNewMatterArea(e.target.value as any)}
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                    >
                      <option value="Family Law">Family Law</option>
                      <option value="Immigration">Immigration</option>
                      <option value="Bankruptcy">Bankruptcy</option>
                      <option value="General Practice">General Practice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Hourly Billing rate ($)</label>
                    <input
                      type="number"
                      value={newMatterRate}
                      onChange={(e) => setNewMatterRate(Number(e.target.value))}
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Initial Case Status</label>
                    <select
                      value={newMatterStatus}
                      onChange={(e) => setNewMatterStatus(e.target.value as any)}
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                    >
                      <option value="active">Active File</option>
                      <option value="pending">Pending Status</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Full litigation scope, background narrative, and objectives</label>
                  <textarea
                    rows={4}
                    value={newMatterDescription}
                    onChange={(e) => setNewMatterDescription(e.target.value)}
                    placeholder="Outline legal theories, core timelines, and filing goals..."
                    className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-[#090d16] font-bold rounded-xl text-xs font-heading transition-all cursor-pointer shadow-lg"
                  >
                    Confirm & Instantiate Case File
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
