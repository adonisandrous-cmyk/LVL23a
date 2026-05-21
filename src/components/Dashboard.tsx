import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Briefcase,
  Layers,
  Calendar as CalendarIcon,
  Sparkles,
  TrendingUp,
  FileText,
  UserPlus,
  AlertCircle,
  Plus,
  Trash,
  Check,
  Clock,
  CheckCircle2,
  Calendar,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { Client, Matter } from '../types';

interface DashboardProps {
  clients: Client[];
  matters: Matter[];
  setActiveTab: (tab: string) => void;
  triggerNewClient: () => void;
  triggerNewMatter: () => void;
  triggerGenerateDoc: () => void;
}

interface ToDoItem {
  id: string;
  taskName: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  dueDate: string;
}

interface CalendarEvent {
  id: string;
  time: string;
  title: string;
  clientName: string;
  type: 'Hearing' | 'Filing' | 'Intake' | 'Deposition';
  dateStr: string; // YYYY-MM-DD format
}

export default function Dashboard({
  clients,
  matters,
  setActiveTab,
  triggerNewClient,
  triggerNewMatter,
  triggerGenerateDoc
}: DashboardProps) {
  
  // Custom sharp 3D button class elements
  const sharp3DButton = "rounded-none border-2 border-teal-500 bg-[#090f1a] text-teal-400 font-mono text-xs font-bold uppercase py-2 px-4 shadow-[4px_4px_0px_#14b8a6] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#14b8a6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer shrink-0";
  const sharp3DAccentButton = "rounded-none border-2 border-emerald-400 bg-[#061112] text-emerald-400 font-mono text-xs font-bold uppercase py-2 px-4 shadow-[4px_4px_0px_#34d399] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#34d399] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer shrink-0";
  const sharp3DRoseButton = "rounded-none border-2 border-rose-500 bg-[#12070c] text-rose-500 font-mono text-xs font-bold uppercase py-1.5 px-3 shadow-[3px_3px_0px_#f43f5e] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#f43f5e] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none transition-all cursor-pointer shrink-0";

  // Reusable small quick action class
  const smallSharp3D = "rounded-none border border-slate-700 bg-slate-900 text-slate-300 font-mono text-[10px] font-bold uppercase py-1.5 px-3 shadow-[2.5px_2.5px_0px_#475569] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[3.5px_3.5px_0px_#475569] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer";

  // To Do State - Saved locally within component or defaulted
  const [todos, setTodos] = useState<ToDoItem[]>(() => {
    const saved = localStorage.getItem('l23_dashboard_todos');
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    return [
      { id: 't-1', taskName: 'Submit California Form FL-100 pleading schedule', priority: 'HIGH', completed: false, dueDate: '2026-05-21' },
      { id: 't-2', taskName: 'Extract asylum narrative declaration from Mateo Alvarez response', priority: 'HIGH', completed: true, dueDate: '2026-05-20' },
      { id: 't-3', taskName: 'Audit secured asset liability ledger for Samuel Miller bankrupt record', priority: 'MEDIUM', completed: false, dueDate: '2026-05-22' },
      { id: 't-4', taskName: 'Draft mutual NDA governing clause for Acme Apex contract', priority: 'LOW', completed: false, dueDate: '2026-05-25' }
    ];
  });

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');

  // Calendar State - Chosen date index & list of scheduled events
  const [selectedDate, setSelectedDate] = useState<string>('2026-05-21'); // Default selected day
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
    { id: 'e-1', time: '09:00 AM', title: 'Sarah Jenkins Care Intake Review', clientName: 'Sarah Jenkins', type: 'Intake', dateStr: '2026-05-21' },
    { id: 'e-2', time: '11:15 AM', title: 'Chapter 7 Liquidation Counsel', clientName: 'Samuel Miller', type: 'Hearing', dateStr: '2026-05-21' },
    { id: 'e-3', time: '02:00 PM', title: 'Asylum Statement Briefing Room', clientName: 'Mateo Alvarez', type: 'Deposition', dateStr: '2026-05-22' },
    { id: 'e-4', time: '04:30 PM', title: 'Contract Mutual Clause Sync', clientName: 'Apex Co', type: 'Filing', dateStr: '2026-05-23' },
    { id: 'e-5', time: '10:00 AM', title: 'Judicial Council Form Signoff', clientName: 'Sarah Jenkins', type: 'Intake', dateStr: '2026-05-20' }
  ]);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('10:00 AM');
  const [newEventType, setNewEventType] = useState<'Hearing' | 'Filing' | 'Intake' | 'Deposition'>('Intake');
  const [newEventClient, setNewEventClient] = useState('');

  useEffect(() => {
    localStorage.setItem('l23_dashboard_todos', JSON.stringify(todos));
  }, [todos]);

  // Aggregate Stats from current state
  const totalClients = clients.length;
  const activeMatters = matters.filter(m => m.status === 'active').length;
  const unfinishedTodosCount = todos.filter(t => !t.completed).length;
  const currentDayEventsCount = calendarEvents.filter(e => e.dateStr === selectedDate).length;

  const stats = [
    { label: 'Total Clients', value: totalClients, icon: Users, color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { label: 'Active Litigation', value: activeMatters, icon: Briefcase, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'To-Do Reminders', value: unfinishedTodosCount, icon: ChecklistIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Schedules Today', value: currentDayEventsCount, icon: CalendarIcon, color: 'text-orange-400', bg: 'bg-orange-500/10' }
  ];

  // Helper custom checklist icon representation
  function ChecklistIcon(props: any) {
    return <ClipboardList className={props.className} />;
  }

  // To Do Handlers
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const item: ToDoItem = {
      id: `task-${Date.now()}`,
      taskName: newTaskName.trim(),
      priority: newTaskPriority,
      completed: false,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] // default tomorrow
    };
    setTodos(prev => [item, ...prev]);
    setNewTaskName('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  // Calendar Handlers
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const item: CalendarEvent = {
      id: `ev-${Date.now()}`,
      time: newEventTime,
      title: newEventTitle.trim(),
      clientName: newEventClient || 'Inquiry Client',
      type: newEventType,
      dateStr: selectedDate
    };
    setCalendarEvents(prev => [...prev, item]);
    setNewEventTitle('');
    setNewEventClient('');
  };

  const removeEvent = (id: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
  };

  // Static Calendar Days list generator for a 7-day strip (e.g. May 17 to May 23, 2026)
  const currentWeekDays = [
    { dayName: 'Sun', dateStr: '2026-05-17', num: '17' },
    { dayName: 'Mon', dateStr: '2026-05-18', num: '18' },
    { dayName: 'Tue', dateStr: '2026-05-19', num: '19' },
    { dayName: 'Wed', dateStr: '2026-05-20', num: '20' },
    { dayName: 'Thu', dateStr: '2026-05-21', num: '21' },
    { dayName: 'Fri', dateStr: '2026-05-22', num: '22' },
    { dayName: 'Sat', dateStr: '2026-05-23', num: '23' }
  ];

  // Group practice areas distribution counts
  const practiceAreaCounts = matters.reduce(
    (acc, m) => {
      const area = m.practiceArea;
      if (area && acc[area] !== undefined) {
        acc[area]++;
      }
      return acc;
    },
    {
      'Family Law': 0,
      'Immigration': 0,
      'Bankruptcy': 0,
      'General Practice': 0
    } as Record<string, number>
  );

  const totalMattersCount = matters.length || 1;
  const recentClients = [...clients].reverse().slice(0, 3);

  return (
    <motion.div
      id="dashboard-tab"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 select-text"
    >
      {/* 1. Dashboard Brand Header with Sharp 3D Action button */}
      <div className="p-6 bg-gradient-to-r from-[#0d1624] to-[#090d16] rounded-none border-2 border-[#1e293b] shadow-[4px_4px_0px_rgba(30,41,59,0.5)] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/5 blur-[120px] rounded-full"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-heading text-white tracking-tight flex items-center gap-2">
              Level 23 Practice Desk
              <span className="text-[10px] font-mono font-normal uppercase px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 text-teal-400">Desktop v2.4</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-xl font-sans leading-relaxed">
              Unified litigation ledger & automation desk. Active calendar sync triggers automatic court client responses, mapping variables directly to judicial council briefs.
            </p>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Sparkles className="w-3 h-3 animate-spin-slow" />
                DOCKET ENGINE ONLINE
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono bg-[#051a1d] text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                99.8% COURT EXTRACT ACCURACY
              </span>
            </div>
          </div>

          <button
            onClick={triggerGenerateDoc}
            className={sharp3DAccentButton}
          >
            Launch Brief Builder
          </button>
        </div>
      </div>

      {/* 2. Grid Stats Cards (Sharp Raised Borders) */}
      <div id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-5 bg-[#0e1626] rounded-none border-2 border-[#1e293b] flex shadow-md group overflow-hidden"
            >
              <div className="flex flex-col justify-between flex-1 space-y-3">
                <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <span className="text-3xl font-extrabold font-mono text-white leading-none group-hover:text-teal-400 transition-colors">
                  {stat.value}
                </span>
              </div>
              <div className={`p-3 rounded-none border border-[#1e293b] ${stat.bg} ${stat.color} flex items-center justify-center h-12 w-12`}>
                <Icon className="w-5.5 h-5.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Dashboard Double Column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ==================== LEFT COLUMN: CALENDAR & RECENT CLIENTS (7/12 WIDTH) ==================== */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* A. INTERACTIVE CALENDAR BOARD */}
          <div className="p-5 bg-[#0e1626] rounded-none border-2 border-[#1e293b] shadow-lg flex flex-col justify-between">
            <div className="space-y-1 pb-3 border-b border-[#1e293b] flex justify-between items-center mr-1">
              <div>
                <h2 className="text-sm font-bold font-heading text-white flex items-center gap-2">
                  <CalendarIcon className="w-4.5 h-4.5 text-teal-400" />
                  Docket Calendar Grid
                </h2>
                <p className="text-[11px] text-slate-400">Manage court hearings, asylum interviews, and intake briefings</p>
              </div>
              <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5">
                May 2026
              </span>
            </div>

            {/* Custom Horizontal Date strip with dynamic dots indicators */}
            <div className="grid grid-cols-7 gap-2.5 my-4">
              {currentWeekDays.map((d) => {
                const isSelected = d.dateStr === selectedDate;
                // Count events for this date
                const hasEvents = calendarEvents.filter(ev => ev.dateStr === d.dateStr).length;
                
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`p-2 rounded-none border flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-teal-950/30 border-teal-400 shadow-[3px_3px_0px_#14b8a6]'
                        : 'bg-slate-900/50 border-[#1e293b] hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-mono block uppercase">{d.dayName}</span>
                    <span className={`text-sm font-extrabold font-mono block mt-0.5 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {d.num}
                    </span>
                    {hasEvents > 0 && (
                      <span className="flex gap-1 mt-1 justify-center">
                        {Array.from({ length: Math.min(hasEvents, 3) }).map((_, idx) => (
                          <span key={idx} className="w-1.5 h-1.5 rounded-full bg-teal-400 block animate-pulse"></span>
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Day Agenda Event List */}
            <div className="space-y-2 bg-[#090d16]/70 border border-[#1e293b] p-3.5 mt-1">
              <span className="text-[10px] font-bold font-mono text-slate-500 block">
                Agenda List For: <span className="text-slate-300 font-extrabold">{selectedDate}</span>
              </span>
              
              <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                {calendarEvents.filter(e => e.dateStr === selectedDate).length === 0 ? (
                  <div className="py-6 text-center text-slate-600 text-xs font-sans italic">
                    No scheduled hearing, deposition, or intake meetings for this day.
                  </div>
                ) : (
                  calendarEvents
                    .filter(e => e.dateStr === selectedDate)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-[#0c1221] border border-[#1e293b] flex justify-between items-center gap-3 hover:border-slate-700 transition-all text-left"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 border border-amber-500/20 leading-none py-0.5 uppercase">
                              {item.type}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              Time: <span className="text-slate-300 font-semibold">{item.time}</span>
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-200 block">{item.title}</span>
                          <span className="text-[10px] text-slate-400 block">Client case linkage: <span className="text-teal-400 font-mono">{item.clientName}</span></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEvent(item.id)}
                          className={sharp3DRoseButton}
                          title="Purge court docket calendar record"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                )}
              </div>

              {/* Add Custom Calendar Event Inline form */}
              <form onSubmit={handleAddEvent} className="pt-3 border-t border-[#1e293b]/50 grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Appt Title (e.g. Case Deposition)"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="sm:col-span-5 bg-[#090d16] border border-[#1e293b] px-3 py-1.5 text-xs text-white focus:border-teal-400 focus:outline-none focus:ring-0 placeholder-slate-700 font-sans"
                />
                <input
                  type="text"
                  required
                  placeholder="Client (e.g. Jenkins)"
                  value={newEventClient}
                  onChange={(e) => setNewEventClient(e.target.value)}
                  className="sm:col-span-3 bg-[#090d16] border border-[#1e293b] px-3 py-1.5 text-xs text-white focus:border-teal-400 focus:outline-none focus:ring-0 placeholder-slate-700 font-sans"
                />
                <select
                  value={newEventType}
                  onChange={(e: any) => setNewEventType(e.target.value)}
                  className="sm:col-span-2 bg-[#090d16] border border-[#1e293b] px-2 py-1.5 text-xs text-slate-300 focus:outline-none font-sans"
                >
                  <option value="Intake">Intake</option>
                  <option value="Hearing">Hearing</option>
                  <option value="Deposition">Depose</option>
                  <option value="Filing">Filing</option>
                </select>
                <button
                  type="submit"
                  className={`${smallSharp3D} sm:col-span-2 justify-center flex items-center gap-1`}
                  title="Add Docket Entry"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

          </div>

          {/* B. RECENT CLIENTS LIST */}
          <div className="p-5 bg-[#0e1626] rounded-none border-2 border-[#1e293b] shadow-lg">
            <div className="space-y-1 pb-3 border-b border-[#1e293b]">
              <h2 className="text-sm font-bold font-heading text-white flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-teal-400" />
                Active Client Roster Index
              </h2>
              <p className="text-[11px] text-slate-400">Latest active intake records and contact details</p>
            </div>

            <div className="space-y-3 mt-4">
              {recentClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setActiveTab('clients')}
                  className="p-3 bg-[#0d131f]/60 hover:bg-[#0d131f]/100 border border-[#1e293b] flex items-center justify-between cursor-pointer group transition-all"
                >
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 group-hover:text-teal-400 transition-colors">
                      {client.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{client.email} | Specialty: <span className="text-teal-400">{client.practiceArea}</span></p>
                  </div>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 border ${
                    client.status === 'active' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' :
                    client.status === 'pending' ? 'bg-amber-950/20 text-amber-400 border-amber-500/20' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {client.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ==================== RIGHT COLUMN: TO-DO REMINDERS & AREAS DISTRIBUTION (5/12 WIDTH) ==================== */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* C. INTERACTIVE REMINDER TO DO LIST */}
          <div className="p-5 bg-[#0e1626] rounded-none border-2 border-[#1e293b] shadow-lg flex flex-col">
            <div className="space-y-1 pb-3 border-b border-[#1e293b] flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold font-heading text-white flex items-center gap-2">
                  <ClipboardList className="w-4.5 h-4.5 text-teal-400" />
                  Reminders & Case To-Dos
                </h2>
                <p className="text-[11px] text-slate-400">High-priority compliance checklists</p>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5">
                {todos.filter(t => !t.completed).length} Pending
              </span>
            </div>

            {/* To Do Items List */}
            <div className="space-y-2 my-4 min-h-[220px] max-h-[300px] overflow-y-auto pr-1">
              {todos.length === 0 ? (
                <div className="py-12 text-center text-xs font-sans text-slate-600">
                  Todo deck empty. Synthesize new checklists above.
                </div>
              ) : (
                todos.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 border flex justify-between items-center gap-3 transition-all ${
                      t.completed
                        ? 'bg-slate-900/30 border-slate-800 opacity-60'
                        : 'bg-slate-900/80 border-[#1e293b] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => toggleTodo(t.id)}
                        type="button"
                        className={`w-4.5 h-4.5 text-[#050b15] shrink-0 border mt-0.5 flex items-center justify-center cursor-pointer transition-all ${
                          t.completed 
                            ? 'bg-teal-400 border-teal-400' 
                            : 'bg-slate-950 border-slate-700 hover:border-teal-400'
                        }`}
                        title="Toggle task completeness"
                      >
                        {t.completed && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <p className={`text-xs leading-normal font-sans text-slate-200 ${t.completed ? 'line-through text-slate-500' : 'font-semibold'}`}>
                          {t.taskName}
                        </p>
                        <div className="flex gap-2 items-center mt-1">
                          <span className={`text-[8.5px] uppercase font-mono px-1 border leading-none py-0.5 font-bold ${
                            t.priority === 'HIGH' ? 'bg-rose-950/30 text-rose-400 border-rose-500/20' :
                            t.priority === 'MEDIUM' ? 'bg-amber-950/20 text-amber-400 border-amber-500/20' : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {t.priority} Urgent
                          </span>
                          <span className="text-[8.5px] text-slate-500 font-mono">Due: {t.dueDate}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeTodo(t.id)}
                      className={sharp3DRoseButton}
                      title="Purge task reminder"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick Add Custom Reminder Form */}
            <form onSubmit={handleAddTodo} className="pt-3 border-t border-[#1e293b]/50 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                placeholder="Declare brief task description..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="flex-1 bg-[#090d16] border border-[#1e293b] px-3.5 py-2 text-xs text-white focus:border-teal-400 focus:outline-none focus:ring-0 placeholder-slate-700 font-sans"
              />
              <div className="flex gap-2 shrink-0">
                <select
                  value={newTaskPriority}
                  onChange={(e: any) => setNewTaskPriority(e.target.value)}
                  className="bg-[#090d16] border border-[#1e293b] px-2 py-1.5 text-xs text-slate-300 focus:outline-none font-sans"
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <button
                  type="submit"
                  className={sharp3DButton}
                >
                  Add Task
                </button>
              </div>
            </form>

          </div>

          {/* D. PRACTICE AREA METRICS DISTRIBUTION */}
          <div className="p-5 bg-[#0e1626] rounded-none border-2 border-[#1e293b] shadow-lg">
            <div className="space-y-1 pb-3 border-b border-[#1e293b] mb-4">
              <h2 className="text-sm font-bold font-heading text-white flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-teal-400" />
                Practice Area Distribution
              </h2>
              <p className="text-[11px] text-slate-400">Total litigated metrics mapped across court areas</p>
            </div>
            <div className="space-y-4">
              {Object.entries(practiceAreaCounts).map(([area, count]) => {
                const percentage = Math.round((count / totalMattersCount) * 100);
                return (
                  <div key={area} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 font-sans">{area}</span>
                      <span className="font-mono text-teal-400">{count} matters ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#090d16] rounded-none overflow-hidden border border-[#1e293b]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* 4. Quick Action Navigation Row with 3D animation pop effects and SHARP edges */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Desk Navigation Control Rails</h3>
        <div id="quick-actions-bar" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={triggerNewClient}
            className="p-4 bg-slate-900/50 hover:bg-[#0c121e] border-2 border-[#1e293b] hover:border-teal-400/70 rounded-none cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group transition-all shadow-[4px_4px_0px_#1e293b] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#14b8a6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-none border border-teal-500/20 group-hover:bg-teal-500/20 transition-colors">
              <UserPlus className="w-5 h-5 pointer-events-none" />
            </div>
            <span className="text-xs font-bold font-mono uppercase text-white">Record Client Roster</span>
          </button>

          <button
            onClick={triggerNewMatter}
            className="p-4 bg-slate-900/50 hover:bg-[#0c121e] border-2 border-[#1e293b] hover:border-teal-400/70 rounded-none cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group transition-all shadow-[4px_4px_0px_#1e293b] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#14b8a6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-none border border-sky-500/20 group-hover:bg-sky-500/20 transition-colors">
              <Briefcase className="w-5 h-5 pointer-events-none" />
            </div>
            <span className="text-xs font-bold font-mono uppercase text-white">New Court Case</span>
          </button>

          <button
            onClick={triggerGenerateDoc}
            className="p-4 bg-slate-900/50 hover:bg-[#0c121e] border-2 border-[#1e293b] hover:border-teal-400/70 rounded-none cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group transition-all shadow-[4px_4px_0px_#1e293b] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#14b8a6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-none border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
              <FileText className="w-5 h-5 pointer-events-none" />
            </div>
            <span className="text-xs font-bold font-mono uppercase text-white">Assemble Pleading Templates</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className="p-4 bg-slate-900/50 hover:bg-[#0c121e] border-2 border-[#1e293b] hover:border-teal-400/70 rounded-none cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group transition-all shadow-[4px_4px_0px_#1e293b] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#14b8a6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-none border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
              <Sparkles className="w-5 h-5 pointer-events-none animate-bounce" />
            </div>
            <span className="text-xs font-bold font-mono uppercase text-white">Phoenix Intel Vault</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
