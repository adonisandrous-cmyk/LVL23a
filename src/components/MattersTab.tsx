import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  Folder,
  FolderOpen,
  HardDrive,
  RefreshCw,
  FileCode,
  Download,
  File,
  FileText,
  ExternalLink,
  Upload,
  X,
  TrendingUp,
  Clock,
  Activity,
  CheckCircle2,
  Info,
  ShieldCheck,
  Percent,
  BarChart3,
  Users,
  User,
  Eye,
  Scale,
  Building2,
  Globe,
  MapPin,
  Calendar,
  Check,
  Video,
  VideoOff,
  Phone,
  Mic,
  Maximize2,
  Minimize2,
  Copy,
  Send
} from 'lucide-react';
import { Client, Matter, EvidenceFile, ConsultationSession, GeneratedDocument } from '../types';
import MatterFormsViewer, { CaseSpecifics, OFFICIAL_FORM_CATALOG } from './MatterFormsViewer';

interface MattersTabProps {
  matters: Matter[];
  clients: Client[];
  evidenceFiles?: EvidenceFile[];
  consultations?: ConsultationSession[];
  onAddMatter: (newMatter: Omit<Matter, 'id' | 'createdAt'>) => void;
  onUpdateMatter: (updatedMatter: Matter) => void;
  onAddGeneratedDoc?: (doc: GeneratedDocument) => void;
  onNavigateToTab?: (tab: string, clientId?: string) => void;
}

export type MatterPracticeType = 'Family Law' | 'Civil Litigation' | 'Immigration' | 'Bankruptcy' | 'General Practice';

export default function MattersTab({
  matters,
  clients,
  evidenceFiles = [],
  consultations = [],
  onAddMatter,
  onUpdateMatter,
  onAddGeneratedDoc,
  onNavigateToTab
}: MattersTabProps) {
  // Navigation & View Mode inside Matters Tab
  const [leftPanelMode, setLeftPanelMode] = useState<'directory' | 'create-assemble'>('create-assemble');
  const [rightPanelMode, setRightPanelMode] = useState<'forms-viewer' | 'case-dossier'>('forms-viewer');

  // Search & Filter for Matters Directory
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(matters[0] || null);

  // Active Client associated with matter assembly
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (matters[0]?.clientId) return matters[0].clientId;
    if (clients[0]?.id) return clients[0].id;
    return '';
  });
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // Selected Client Object
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  // Selected Practice Type for Create / Assemble Pipeline
  const [selectedType, setSelectedType] = useState<MatterPracticeType>(() => {
    const area = selectedMatter?.practiceArea || selectedClient?.practiceArea || 'Family Law';
    if (area.includes('Civil')) return 'Civil Litigation';
    if (area.includes('Immigration')) return 'Immigration';
    if (area.includes('Bankruptcy')) return 'Bankruptcy';
    if (area.includes('General')) return 'General Practice';
    return 'Family Law';
  });

  // Keep practice type synchronized when selecting an existing matter
  useEffect(() => {
    if (selectedMatter?.practiceArea) {
      const area = selectedMatter.practiceArea;
      if (area.includes('Civil')) setSelectedType('Civil Litigation');
      else if (area.includes('Immigration')) setSelectedType('Immigration');
      else if (area.includes('Bankruptcy')) setSelectedType('Bankruptcy');
      else if (area.includes('General')) setSelectedType('General Practice');
      else setSelectedType('Family Law');

      if (selectedMatter.clientId) {
        setSelectedClientId(selectedMatter.clientId);
      }
    }
  }, [selectedMatter]);

  // Nature of Suit / Specific Matter Request options by practice area
  const natureOfSuitOptions = useMemo(() => {
    switch (selectedType) {
      case 'Family Law':
        return [
          'Divorce / Dissolution of Marriage (FL-120 / FL-100)',
          'Child Custody & Visitation Dispute (FL-311 / FL-105)',
          'Child & Spousal Support Modification (FL-150 / FL-300)',
          'Legal Separation of Marriage',
          'Domestic Violence Restraining Order (DV-100)',
          'Property & Community Debt Division (FL-160)',
          'Declaration of Financial Disclosures (FL-141)'
        ];
      case 'Immigration':
        return [
          'Defensive Asylum & Withholding of Removal (I-589)',
          'Application for Employment Authorization / Work Permit (I-765)',
          'Adjustment of Status to Permanent Resident (I-485)',
          'Cancellation of Removal for Non-Permanent Residents (EOIR-42B)',
          'Alien Notice of Change of Address (EOIR-33)',
          'Petition for Alien Relative (I-130)'
        ];
      case 'Civil Litigation':
        return [
          'Breach of Written Contract (PLD-C-010 Answer)',
          'Tort / Personal Injury (Motor Vehicle Negligence)',
          'Premises Liability / Commercial Property Injury',
          'Business Partnership Dispute & Breach of Fiduciary Duty',
          'Commercial Debt Collection & Verified General Denial',
          'Wrongful Termination & Employment Retaliation'
        ];
      case 'Bankruptcy':
        return [
          'Chapter 7 Liquidation (Voluntary Petition Form 101)',
          'Chapter 13 Individual Debt Adjustment (Repayment Plan)',
          'Chapter 11 Small Business Reorganization',
          'Means Test Calculation & Disposable Income Determination',
          'Homestead & Wildcard Exemption Election (Schedule C)'
        ];
      case 'General Practice':
        return [
          'Revocable Living Trust & Estate Plan Package',
          'California Statutory Durable Power of Attorney (DPOA-01)',
          'Civil Harassment Restraining Order (CH-100)',
          'Adult or Minor Petition for Change of Name (NC-100)',
          'Pre-Litigation Demand Letter & Settlement Release'
        ];
    }
  }, [selectedType]);

  const [selectedNatureOfSuit, setSelectedNatureOfSuit] = useState<string>(natureOfSuitOptions[0]);

  useEffect(() => {
    setSelectedNatureOfSuit(natureOfSuitOptions[0]);
  }, [natureOfSuitOptions]);

  // Questions reflecting the initial matter selected
  const [matterQuestions, setMatterQuestions] = useState<Record<string, string>>({
    proceedingType: 'Dissolution',
    marriageDate: '09/18/2015',
    separationDate: '04/10/2026',
    minorChildrenCount: '2',
    custodyPreference: 'Joint Legal and Physical Custody (Alternating 2-2-3)',
    spousalSupportReq: 'Reserve Jurisdiction Pursuant to Fam. Code § 4336',
    damagesClaimed: '$125,000',
    alienRegNumber: 'A# 248-091244',
    entryDate: '03/15/2014',
    persecutionGrounds: 'Political Opinion and Particular Social Group',
    debtEstimate: '$45,000 Unsecured Credit / Medical Debt',
    reliefSummary: 'Full general denial and mandatory statutory affirmative defenses asserted'
  });

  const handleUpdateQuestion = (key: string, val: string) => {
    setMatterQuestions(prev => ({ ...prev, [key]: val }));
  };

  // Case Specifics State
  const [caseSpecifics, setCaseSpecifics] = useState<CaseSpecifics>({
    state: 'California',
    county: 'Orange County',
    courtVenue: 'Orange County Superior Court',
    branchName: 'Lamoreaux Justice Center',
    caseNumber: selectedMatter?.caseNumber || '26FL004812C',
    opposingParty: selectedMatter?.opposingParty || 'Elena Vance (Petitioner)',
    districtAttorneyOrDhs: 'Orange County District Attorney / Family Support Division',
    judgeName: 'Hon. Deborah C. Servino',
    deptNumber: 'Dept. L-64',
    incidentOrMarriageDate: '09/18/2015',
    separationOrIncidentDate: '04/10/2026',
    reliefRequested: 'Statutory relief granted, fees awarded, and responsive pleading confirmed.',
    natureOfSuit: selectedNatureOfSuit
  });

  // Modal for Request for Case Specifics
  const [showCaseSpecificsModal, setShowCaseSpecificsModal] = useState<boolean>(false);
  const [hasSearchedForms, setHasSearchedForms] = useState<boolean>(true);

  // Available forms listed for current matter type
  const availableFormsForType = useMemo(() => {
    return OFFICIAL_FORM_CATALOG.filter(f => f.practiceArea === selectedType);
  }, [selectedType]);

  // Handle "Find Forms" Button
  const handleFindForms = () => {
    setHasSearchedForms(true);
    // Open the popup as a request for case specifics to logically assemble probable forms!
    setShowCaseSpecificsModal(true);
  };

  // Save Case Specifics Modal
  const handleSaveCaseSpecifics = () => {
    setShowCaseSpecificsModal(false);
    // Update active matter if present
    if (selectedMatter) {
      const updated: Matter = {
        ...selectedMatter,
        courtVenue: caseSpecifics.courtVenue,
        opposingParty: caseSpecifics.opposingParty,
        caseNumber: caseSpecifics.caseNumber,
        practiceArea: selectedType
      };
      onUpdateMatter(updated);
      setSelectedMatter(updated);
    }
  };

  // Filtered Clients for dropdown search
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    const q = clientSearchQuery.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  }, [clients, clientSearchQuery]);

  // Filtered Matters Directory
  const filteredMatters = useMemo(() => {
    return matters.filter(m => {
      const matchesSearch =
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.clientName.toLowerCase().includes(search.toLowerCase()) ||
        m.caseNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesType = typeFilter === 'all' || m.practiceArea === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [matters, search, statusFilter, typeFilter]);

  // Quick Create Matter from assemble panel
  const handleCreateMatterFromAssemble = () => {
    const newMatterTitle = `${selectedType}: ${selectedNatureOfSuit.split('(')[0].trim()} — ${selectedClient?.name || 'Client'}`;
    const newMatter: Omit<Matter, 'id' | 'createdAt'> = {
      title: newMatterTitle,
      caseNumber: caseSpecifics.caseNumber || `26-${selectedType.slice(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      clientId: selectedClient?.id || 'client-gen',
      clientName: selectedClient?.name || 'New Client',
      practiceArea: selectedType,
      status: 'active',
      description: `Assembled legal matter for ${selectedClient?.name || 'Client'} in ${selectedType}. Nature of Suit: ${selectedNatureOfSuit}. Court Venue: ${caseSpecifics.courtVenue}.`,
      billingRate: 350,
      billedHours: 1.5,
      tasks: [
        { id: 't1', title: 'Verify client intake & case specifics', completed: true, dueDate: '2026-05-01' },
        { id: 't2', title: 'Assemble mandatory Judicial Council forms', completed: true, dueDate: '2026-05-05' },
        { id: 't3', title: 'Client Data Populate on mapped fields', completed: false, dueDate: '2026-05-10' },
        { id: 't4', title: 'Export approved pleadings to client file', completed: false, dueDate: '2026-05-15' }
      ],
      courtVenue: caseSpecifics.courtVenue,
      opposingParty: caseSpecifics.opposingParty
    };

    onAddMatter(newMatter);
    setLeftPanelMode('directory');
  };

  // Matter Workspace Modal & Pop-up State
  const [showMatterWorkspaceModal, setShowMatterWorkspaceModal] = useState<boolean>(false);

  // Video Conference Modal & Provision State
  const [showVideoConferenceModal, setShowVideoConferenceModal] = useState<boolean>(false);
  const [copiedVideoLink, setCopiedVideoLink] = useState<boolean>(false);
  const [videoNotes, setVideoNotes] = useState<string>('');
  const [newTaskInput, setNewTaskInput] = useState<string>('');

  // Matter Video Conference Room ID
  const matterVideoRoom = useMemo(() => {
    const rawCase = (selectedMatter?.caseNumber || caseSpecifics.caseNumber || 'General').replace(/[^a-zA-Z0-9]/g, '');
    return `L23-Matter-${rawCase || 'Active'}`;
  }, [selectedMatter?.caseNumber, caseSpecifics.caseNumber]);

  const handleCopyVideoLink = () => {
    const link = `https://meet.jit.si/${matterVideoRoom}`;
    navigator.clipboard.writeText(link);
    setCopiedVideoLink(true);
    setTimeout(() => setCopiedVideoLink(false), 2000);
  };

  const handleToggleTask = (taskId: string) => {
    if (!selectedMatter) return;
    const updatedTasks = selectedMatter.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updatedMatter = { ...selectedMatter, tasks: updatedTasks };
    setSelectedMatter(updatedMatter);
    onUpdateMatter(updatedMatter);
  };

  const handleAddTask = () => {
    if (!selectedMatter || !newTaskInput.trim()) return;
    const newTask = {
      id: `t-${Date.now()}`,
      title: newTaskInput.trim(),
      completed: false,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    };
    const updatedMatter = {
      ...selectedMatter,
      tasks: [...selectedMatter.tasks, newTask]
    };
    setSelectedMatter(updatedMatter);
    onUpdateMatter(updatedMatter);
    setNewTaskInput('');
  };

  const handleLogHours = (addedHours: number) => {
    if (!selectedMatter) return;
    const updatedMatter = {
      ...selectedMatter,
      billedHours: Math.max(0, +(selectedMatter.billedHours + addedHours).toFixed(1))
    };
    setSelectedMatter(updatedMatter);
    onUpdateMatter(updatedMatter);
  };

  const handleChangeStatus = (status: 'active' | 'pending' | 'completed') => {
    if (!selectedMatter) return;
    const updatedMatter = { ...selectedMatter, status };
    setSelectedMatter(updatedMatter);
    onUpdateMatter(updatedMatter);
  };

  const renderMatterWorkspaceContent = (isModal: boolean = false) => {
    const curMatter = selectedMatter || {
      id: 'default-matter',
      title: `${selectedType} Pleading Matter`,
      caseNumber: caseSpecifics.caseNumber || '26FL004812C',
      clientId: selectedClient?.id || 'c-1',
      clientName: selectedClient?.name || 'Client File',
      practiceArea: selectedType,
      status: 'active' as const,
      description: 'Active legal proceeding and case assembly.',
      billingRate: 350,
      billedHours: 2.5,
      tasks: [
        { id: 't1', title: 'Verify client intake & case specifics', completed: true, dueDate: '2026-05-01' },
        { id: 't2', title: 'Assemble mandatory Judicial Council forms', completed: true, dueDate: '2026-05-05' },
        { id: 't3', title: 'Client Data Populate on mapped fields', completed: true, dueDate: '2026-05-10' },
        { id: 't4', title: 'Conduct Video Conference & Deposition Hearing', completed: false, dueDate: '2026-05-12' },
        { id: 't5', title: 'Export approved pleadings to client file', completed: false, dueDate: '2026-05-15' }
      ],
      courtVenue: caseSpecifics.courtVenue,
      opposingParty: caseSpecifics.opposingParty
    };

    const matterEvidence = evidenceFiles.filter(e => e.clientId === curMatter.clientId || e.matterId === curMatter.id);

    return (
      <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-200 overflow-y-auto select-text">
        {/* TOP DOSSIER BANNER */}
        <div className="p-4 bg-gradient-to-r from-teal-950/70 via-[#0e172a] to-slate-900 border-b border-teal-500/30 shrink-0 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-md">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold font-heading text-white tracking-wide">
                    {curMatter.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono uppercase font-bold border ${
                    curMatter.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    curMatter.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/30'
                  }`}>
                    {curMatter.status}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-mono bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {curMatter.practiceArea}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Client: <strong className="text-white">{curMatter.clientName}</strong> • Case #: <strong className="text-teal-300 font-mono">{curMatter.caseNumber}</strong> • Venue: <span className="text-slate-300">{caseSpecifics.courtVenue}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Switch to forms previewer */}
              <button
                type="button"
                onClick={() => {
                  setRightPanelMode('forms-viewer');
                  if (isModal) setShowMatterWorkspaceModal(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-teal-400" />
                <span>View Forms Previewer</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCaseSpecificsModal(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Case Specifics</span>
              </button>
            </div>
          </div>
        </div>

        {/* WORKSPACE MAIN BODY */}
        <div className="p-4 sm:p-5 space-y-5 flex-1">
          
          {/* 1. VIDEO CONFERENCE PROVISION CARD (PROMINENT SECTION) */}
          <div className="p-4.5 rounded-2.5xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-slate-900 border-2 border-emerald-500/40 shadow-xl space-y-3.5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
                  <Video className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold font-heading text-white uppercase tracking-wide">
                      Video Conference Provision & Virtual Hearing Room
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Provisioned
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                    Real-time secure video deposition, client consultation & judicial mediation room mapped to this matter.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Join Video Conference */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  id="btn-workspace-join-video"
                  onClick={() => setShowVideoConferenceModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold font-heading text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Video className="w-4 h-4 text-slate-950" />
                  <span>Join Video Conference</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyVideoLink}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono rounded-xl cursor-pointer flex items-center gap-1.5 transition-all"
                  title="Copy direct meeting link"
                >
                  {copiedVideoLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedVideoLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>

                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('consult', curMatter.clientId)}
                    className="px-3 py-2 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/30 text-xs font-mono rounded-xl cursor-pointer flex items-center gap-1.5 transition-all"
                    title="Open Consultations Hub tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    <span>Consultations Hub</span>
                  </button>
                )}
              </div>
            </div>

            {/* Room metadata banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10.5px] font-mono bg-[#060a14] border border-emerald-500/20 rounded-xl p-2.5">
              <div className="text-slate-400">
                <span className="text-slate-500 block text-[9.5px]">MEETING ROOM:</span>
                <span className="text-emerald-300 font-bold">{matterVideoRoom}</span>
              </div>
              <div className="text-slate-400">
                <span className="text-slate-500 block text-[9.5px]">SECURITY & PROTOCOL:</span>
                <span className="text-slate-200">End-to-End Encrypted WebRTC</span>
              </div>
              <div className="text-slate-400">
                <span className="text-slate-500 block text-[9.5px]">SYNCED GOOGLE ACCOUNT:</span>
                <span className="text-teal-300">level23consulting@gmail.com</span>
              </div>
            </div>
          </div>

          {/* 2. CASE FACTS & JURISDICTION SUMMARY */}
          <div className="p-4 rounded-2xl bg-[#090d18] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold font-heading text-white uppercase tracking-wide flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-400" />
                <span>Case Specifics & Judicial Venue Record</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowCaseSpecificsModal(true)}
                className="text-[10px] font-mono text-teal-400 hover:text-teal-300 cursor-pointer"
              >
                Edit Records →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Court Venue:</span>
                <span className="text-slate-200 font-semibold block">{caseSpecifics.courtVenue}</span>
                <span className="text-[10px] text-slate-400 font-mono">{caseSpecifics.branchName}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Opposing Party:</span>
                <span className="text-slate-200 font-semibold block">{caseSpecifics.opposingParty}</span>
                <span className="text-[10px] text-slate-400 font-mono">D.A. / DHS: {caseSpecifics.districtAttorneyOrDhs}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Presiding Dept & Judge:</span>
                <span className="text-slate-200 font-semibold block">{caseSpecifics.judgeName || 'Hon. Deborah C. Servino'}</span>
                <span className="text-[10px] text-slate-400 font-mono">{caseSpecifics.deptNumber || 'Dept. L-64'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Key Case Dates:</span>
                <span className="text-slate-200 font-semibold block">Incident/Marriage: {caseSpecifics.incidentOrMarriageDate || matterQuestions.marriageDate || '09/18/2015'}</span>
                <span className="text-[10px] text-slate-400 font-mono">Separation/Breach: {caseSpecifics.separationOrIncidentDate || matterQuestions.separationDate || '04/10/2026'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Nature of Suit:</span>
                <span className="text-teal-300 font-semibold block truncate">{selectedNatureOfSuit}</span>
                <span className="text-[10px] text-slate-400 font-mono">Pleading Mapped: Yes</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Case Status:</span>
                <div className="flex gap-1.5 mt-1">
                  {(['active', 'pending', 'completed'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleChangeStatus(st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize cursor-pointer transition-all ${
                        curMatter.status === st ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. CASE TASKS & PROCEDURAL MILESTONES */}
          <div className="p-4 rounded-2xl bg-[#090d18] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold font-heading text-white uppercase tracking-wide flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Matter Tasks, Deadlines & Procedural Milestones</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                {curMatter.tasks.filter(t => t.completed).length}/{curMatter.tasks.length} Completed
              </span>
            </div>

            <div className="space-y-2">
              {curMatter.tasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    task.completed
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                      : 'bg-slate-900/50 border-slate-800 text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button type="button" className="text-emerald-400 cursor-pointer">
                      {task.completed ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                    </button>
                    <span className={`text-xs ${task.completed ? 'line-through text-slate-500' : 'font-medium'}`}>
                      {task.title}
                    </span>
                  </div>
                  {task.dueDate && (
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Due: {task.dueDate}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Add Task Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add new procedural deadline or matter action..."
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask();
                }}
                className="flex-1 bg-[#050812] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 font-sans"
              />
              <button
                type="button"
                onClick={handleAddTask}
                className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold font-heading text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* 4. BILLING & TIME LEDGER */}
          <div className="p-4 rounded-2xl bg-[#090d18] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold font-heading text-white uppercase tracking-wide flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Matter Billing & Time Invoicing</span>
              </h4>
              <span className="text-xs font-mono font-bold text-amber-300">
                Total Accrued: ${(curMatter.billedHours * curMatter.billingRate).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Billing Rate:</span>
                <span className="text-sm font-mono font-bold text-white">${curMatter.billingRate}/hr</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Billed Hours:</span>
                <span className="text-sm font-mono font-bold text-teal-300">{curMatter.billedHours} hrs</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Quick Log:</span>
                  <div className="flex gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => handleLogHours(0.5)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                    >
                      +0.5h
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogHours(1.0)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                    >
                      +1.0h
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogHours(2.0)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                    >
                      +2.0h
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. EVIDENCE & DOCUMENTS VAULT */}
          {matterEvidence.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#090d18] border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold font-heading text-white uppercase tracking-wide flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span>Associated Evidence & Files ({matterEvidence.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matterEvidence.map(ev => (
                  <div key={ev.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="truncate">
                      <span className="font-semibold text-slate-200 block truncate">{ev.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{ev.fileCategory || ev.mimeType} • {ev.uploadedAt}</span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Vault
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  return (
    <div id="matters-tab-container" className="flex flex-col gap-4 h-[calc(100vh-140px)]">
      {/* MAIN 2-COLUMN VIEW CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

        {/* LEFT COLUMN: Matters Directory, Create Matter, Type Selector, Client Matter Data Card (5/12 width) */}
        <div className="lg:col-span-5 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] flex flex-col justify-between overflow-hidden shadow-xl min-h-0">
          
          {/* Top Header & Mode Toggle Bar */}
          <div className="p-4 border-b border-[#1e293b] space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-400" />
                <h2 className="text-base font-bold font-heading text-white">
                  {leftPanelMode === 'create-assemble' ? 'Create Matter & Assemble Forms' : 'Matters Directory'}
                </h2>
              </div>

              {/* Mode & Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-left-workspace"
                  onClick={() => setShowMatterWorkspaceModal(true)}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold font-heading bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                  title="Pop up Matter Workspace"
                >
                  <Briefcase className="w-3.5 h-3.5 text-teal-400" />
                  <span className="hidden sm:inline">Workspace</span>
                </button>

                <button
                  type="button"
                  id="btn-left-video"
                  onClick={() => setShowVideoConferenceModal(true)}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold font-heading bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 flex items-center gap-1 transition-all cursor-pointer"
                  title="Join Matter Video Room"
                >
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Video</span>
                </button>

                {/* Mode Toggle Button */}
                <button
                  type="button"
                  id="btn-toggle-create-matter"
                  onClick={() => setLeftPanelMode(leftPanelMode === 'create-assemble' ? 'directory' : 'create-assemble')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-heading flex items-center gap-1.5 transition-all cursor-pointer ${
                    leftPanelMode === 'create-assemble'
                      ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                      : 'bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20'
                  }`}
                >
                  {leftPanelMode === 'create-assemble' ? (
                    <>
                      <Briefcase className="w-3.5 h-3.5 text-teal-400" />
                      <span>Directory</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-teal-400" />
                      <span>+ Create</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {leftPanelMode === 'directory' ? (
              /* SEARCH & FILTER CONTROLS FOR DIRECTORY */
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    id="matters-search-input"
                    type="text"
                    placeholder="Search by case #, client name, or title in real-time..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-sans transition-all"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort / Status Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {(['all', 'active', 'pending', 'completed'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono capitalize border cursor-pointer transition-all ${
                        statusFilter === status
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/30 font-semibold'
                          : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* CREATE & ASSEMBLE BANNER */
              <p className="text-xs text-slate-400 font-sans">
                Select matter type, search or pick client, customize specific questions, and find official forms.
              </p>
            )}
          </div>

          {/* LEFT PANEL MAIN BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {leftPanelMode === 'directory' ? (
              /* MATTERS DIRECTORY LIST */
              <div className="space-y-2">
                {filteredMatters.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-sans text-xs">
                    <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    No matters matching filter. Click "+ Create Matter" to assemble a new file.
                  </div>
                ) : (
                  filteredMatters.map((matter) => (
                    <div
                      key={matter.id}
                      onClick={() => {
                        setSelectedMatter(matter);
                        setLeftPanelMode('create-assemble');
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group transition-all duration-200 cursor-pointer ${
                        selectedMatter?.id === matter.id
                          ? 'bg-teal-950/25 border-teal-500/40 shadow-lg'
                          : 'bg-slate-900/40 border-[#1e293b] hover:bg-[#0f172a] hover:border-slate-700'
                      }`}
                    >
                      <div className="max-w-full sm:max-w-[65%]">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-semibold text-slate-200 group-hover:text-teal-400 truncate">
                            {matter.title}
                          </h3>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          Client: {matter.clientName} | Case: {matter.caseNumber}
                        </p>
                        <span className="text-[9.5px] font-mono text-indigo-400/90 mt-1 inline-block">
                          {matter.practiceArea}
                        </span>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded-full border ${
                            matter.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            matter.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                            {matter.status}
                          </span>
                          <span className="text-[9.5px] text-teal-400 font-mono">
                            ${(matter.billedHours * matter.billingRate).toLocaleString()}
                          </span>
                        </div>

                        {/* Quick Action Buttons on Card */}
                        <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMatter(matter);
                              setShowMatterWorkspaceModal(true);
                            }}
                            className="px-2 py-0.5 rounded text-[9.5px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                            title="Pop up Matter Workspace"
                          >
                            Workspace
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMatter(matter);
                              setShowVideoConferenceModal(true);
                            }}
                            className="px-2 py-0.5 rounded text-[9.5px] font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1"
                            title="Join Video Room"
                          >
                            <Video className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Video</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* CREATE & ASSEMBLE PIPELINE (USER SPECIFICATION) */
              <div className="space-y-4">
                
                {/* 1. SELECT TYPE: Family Law, Civil Litigation, Immigration, Bankruptcy, General Practice */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-teal-400" />
                      <span>1. Select Matter Type</span>
                    </span>
                    <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                      Active: {selectedType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'Family Law', icon: Scale, label: 'Family Law', desc: 'FL-120, FL-100' },
                      { id: 'Civil Litigation', icon: Briefcase, label: 'Civil Litigation', desc: 'PLD-C-010' },
                      { id: 'Immigration', icon: Globe, label: 'Immigration', desc: 'I-589, EOIR-42B' },
                      { id: 'Bankruptcy', icon: Building2, label: 'Bankruptcy', desc: 'Form 101, 106' },
                      { id: 'General Practice', icon: Layers, label: 'General Practice', desc: 'Probate, DPOA' }
                    ].map(type => {
                      const isSelected = selectedType === type.id;
                      const IconComp = type.icon;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setSelectedType(type.id as MatterPracticeType);
                            setCaseSpecifics(prev => ({
                              ...prev,
                              caseNumber: type.id === 'Immigration' ? 'A# 248-091244' : type.id === 'Civil Litigation' ? '30-2026-01489201-CU-BC-CGC' : '26FL004812C',
                              courtVenue: type.id === 'Immigration' ? 'EOIR Immigration Court, Los Angeles' : 'Orange County Superior Court'
                            }));
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-br from-teal-950/40 to-slate-900 border-teal-400 shadow-md ring-1 ring-teal-500/40'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`} />
                            <span className={`text-xs font-bold font-heading truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {type.label}
                            </span>
                          </div>
                          <span className="text-[9.5px] font-mono text-slate-500 block truncate">
                            {type.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SEARCH OR SELECT A CLIENT (DROPDOWN SEARCH FIELD) */}
                <div className="space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-400" />
                      <span>2. Search or Select Client</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {clients.length} Clients in Database
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Type client name, email, or select below..."
                      value={clientSearchQuery || selectedClient?.name || ''}
                      onChange={(e) => {
                        setClientSearchQuery(e.target.value);
                        setIsClientDropdownOpen(true);
                      }}
                      onFocus={() => setIsClientDropdownOpen(true)}
                      className="w-full bg-[#090d16] border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dropdown list of clients */}
                  {isClientDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-[#0a0f1d] border border-slate-700 rounded-xl shadow-2xl p-1 z-30 space-y-1">
                      {filteredClients.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 text-center">
                          No matching clients found.
                        </div>
                      ) : (
                        filteredClients.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedClientId(c.id);
                              setClientSearchQuery('');
                              setIsClientDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                              c.id === selectedClientId
                                ? 'bg-teal-500/20 text-teal-200 border border-teal-500/30'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div>
                              <span className="font-semibold block">{c.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{c.email || c.phone || 'No direct phone'}</span>
                            </div>
                            <span className="text-[9.5px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {c.practiceArea || 'Client'}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 3. CLIENT MATTER DATA CARD (POPULATES THE FRAME BELOW) */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0a0f1d] to-[#070b14] border border-teal-500/30 shadow-lg space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white font-heading uppercase tracking-wide">
                          Client Matter Data Card
                        </h4>
                        <span className="text-[10px] font-mono text-teal-300">
                          {selectedClient ? selectedClient.name : 'Intake Ready'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-mono font-bold bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/30">
                      Mapped to {selectedType}
                    </span>
                  </div>

                  {/* Specific Matter / Nature of Suit Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-mono font-bold text-slate-300 uppercase">
                      Specific Matter / Nature of Suit:
                    </label>
                    <select
                      value={selectedNatureOfSuit}
                      onChange={(e) => {
                        setSelectedNatureOfSuit(e.target.value);
                        setCaseSpecifics(prev => ({ ...prev, natureOfSuit: e.target.value }));
                      }}
                      className="w-full bg-[#050812] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-400 font-sans cursor-pointer"
                    >
                      {natureOfSuitOptions.map(opt => (
                        <option key={opt} value={opt} className="bg-[#050812] text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* DYNAMIC QUESTIONS REFLECTING INITIAL MATTER SELECTED */}
                  <div className="space-y-2 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                        Matter-Specific Inquiries & Questionnaire:
                      </span>
                      <span className="text-[9px] font-mono text-teal-400">
                        Auto-Fills Form Sections
                      </span>
                    </div>

                    {selectedType === 'Family Law' && (
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9.5px] font-mono text-slate-400 block mb-0.5">Date of Marriage:</span>
                            <input
                              type="text"
                              value={matterQuestions.marriageDate}
                              onChange={(e) => handleUpdateQuestion('marriageDate', e.target.value)}
                              className="w-full bg-[#050812] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <span className="text-[9.5px] font-mono text-slate-400 block mb-0.5">Date of Separation:</span>
                            <input
                              type="text"
                              value={matterQuestions.separationDate}
                              onChange={(e) => handleUpdateQuestion('separationDate', e.target.value)}
                              className="w-full bg-[#050812] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-[9.5px] font-mono text-slate-400 block mb-0.5">Custody Requested:</span>
                          <input
                            type="text"
                            value={matterQuestions.custodyPreference}
                            onChange={(e) => handleUpdateQuestion('custodyPreference', e.target.value)}
                            className="w-full bg-[#050812] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}

                    {selectedType === 'Immigration' && (
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9.5px] font-mono text-slate-400 block mb-0.5">Alien Reg No. (A-Number):</span>
                            <input
                              type="text"
                              value={matterQuestions.alienRegNumber}
                              onChange={(e) => handleUpdateQuestion('alienRegNumber', e.target.value)}
                              className="w-full bg-[#050812] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <span className="text-[9.5px] font-mono text-slate-400 block mb-0.5">U.S. Entry Date:</span>
                            <input
                              type="text"
                              value={matterQuestions.entryDate}
                              onChange={(e) => handleUpdateQuestion('entryDate', e.target.value)}
                              className="w-full bg-[#050812] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-[9.5px] font-mono text-slate-400 block mb-0.5">Protected Grounds of Relief:</span>
                          <input
                            type="text"
                            value={matterQuestions.persecutionGrounds}
                            onChange={(e) => handleUpdateQuestion('persecutionGrounds', e.target.value)}
                            className="w-full bg-[#050812] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}

                    {selectedType === 'Civil Litigation' && (
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9.5px] font-mono text-slate-400 block mb-0.5">Claimed Damages ($):</span>
                            <input
                              type="text"
                              value={matterQuestions.damagesClaimed}
                              onChange={(e) => handleUpdateQuestion('damagesClaimed', e.target.value)}
                              className="w-full bg-[#050812] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <span className="text-[9.5px] font-mono text-slate-400 block mb-0.5">Incident/Breach Date:</span>
                            <input
                              type="text"
                              value={caseSpecifics.separationOrIncidentDate || '04/10/2026'}
                              onChange={(e) => setCaseSpecifics(prev => ({ ...prev, separationOrIncidentDate: e.target.value }))}
                              className="w-full bg-[#050812] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-[9.5px] font-mono text-slate-400 block mb-0.5">Asserted Defenses Summary:</span>
                          <input
                            type="text"
                            value={matterQuestions.reliefSummary}
                            onChange={(e) => handleUpdateQuestion('reliefSummary', e.target.value)}
                            className="w-full bg-[#050812] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}

                    {selectedType === 'Bankruptcy' && (
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[9.5px] font-mono text-slate-400 block mb-0.5">Estimated Total Debt:</span>
                          <input
                            type="text"
                            value={matterQuestions.debtEstimate}
                            onChange={(e) => handleUpdateQuestion('debtEstimate', e.target.value)}
                            className="w-full bg-[#050812] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {selectedType === 'General Practice' && (
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[9.5px] font-mono text-slate-400 block mb-0.5">Requested Relief / Document Aim:</span>
                          <input
                            type="text"
                            value={matterQuestions.reliefSummary}
                            onChange={(e) => handleUpdateQuestion('reliefSummary', e.target.value)}
                            className="w-full bg-[#050812] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. BUTTON TITLED "FIND FORMS" */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-find-forms"
                      onClick={handleFindForms}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold font-heading text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Find Forms</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCaseSpecificsModal(true)}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono rounded-xl cursor-pointer transition-all"
                      title="Open Case Specifics Modal"
                    >
                      <MapPin className="w-4 h-4 text-teal-400" />
                    </button>
                  </div>
                </div>

                {/* 5. LIST OF AVAILABLE FORMS FOR THAT MATTER TYPE */}
                {hasSearchedForms && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Available Forms ({selectedType}):</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {availableFormsForType.length} Forms
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {availableFormsForType.map(f => (
                        <div
                          key={f.code}
                          className="p-2.5 bg-[#090d16] border border-slate-800 rounded-xl flex items-center justify-between group hover:border-teal-500/40 transition-all"
                        >
                          <div className="space-y-0.5 max-w-[70%]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-teal-400">
                                {f.code}
                              </span>
                              {f.mandatory && (
                                <span className="text-[8.5px] uppercase font-bold text-amber-300 bg-amber-950/80 px-1 rounded">
                                  Mandatory
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 font-sans truncate">{f.title}</p>
                            <span className="text-[9.5px] text-slate-500 font-mono block">{f.statute}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              // Switch viewer to this form immediately
                              setRightPanelMode('forms-viewer');
                            }}
                            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assemble as Registered Matter Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCreateMatterFromAssemble}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-heading font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-teal-400" />
                    <span>Register New Matter File in Database</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: THE LARGER WINDOW BESIDE THE MATTERS DIRECTORY (7/12 width) */}
        {/* Can toggle between Judicial Forms Previewer and Matter Case Workspace & Video */}
        <div className="lg:col-span-7 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] flex flex-col justify-between overflow-hidden shadow-xl min-h-0">
          
          {/* Top Panel Mode Switcher Bar */}
          <div className="px-4 py-2.5 bg-[#090e1c] border-b border-[#1e293b] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-tab-forms-viewer"
                onClick={() => setRightPanelMode('forms-viewer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  rightPanelMode === 'forms-viewer'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Judicial Forms Previewer</span>
              </button>

              <button
                type="button"
                id="btn-tab-matter-workspace"
                onClick={() => setRightPanelMode('case-dossier')}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  rightPanelMode === 'case-dossier'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-teal-400" />
                <span>Matter Workspace & Video</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Pop up workspace modal button */}
              <button
                type="button"
                id="btn-popup-workspace"
                onClick={() => setShowMatterWorkspaceModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                title="Pop up Matter Workspace in large modal window"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Pop Up Workspace</span>
              </button>

              {/* Video Conference Button */}
              <button
                type="button"
                id="btn-top-join-video"
                onClick={() => setShowVideoConferenceModal(true)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Open live video conference / deposition for this matter"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>Video Provision</span>
              </button>
            </div>
          </div>

          {rightPanelMode === 'forms-viewer' ? (
            <MatterFormsViewer
              selectedMatter={selectedMatter}
              client={selectedClient}
              clients={clients}
              caseSpecifics={caseSpecifics}
              onUpdateCaseSpecifics={(specs) => setCaseSpecifics(specs)}
              onAddGeneratedDoc={onAddGeneratedDoc}
              onRequestOpenCaseSpecificsModal={() => setShowCaseSpecificsModal(true)}
              onRequestOpenMatterWorkspace={() => setShowMatterWorkspaceModal(true)}
              onRequestOpenVideoConference={() => setShowVideoConferenceModal(true)}
              onSelectClientId={(newId) => setSelectedClientId(newId)}
            />
          ) : (
            renderMatterWorkspaceContent(false)
          )}
        </div>

      </div>

      {/* POPUP MODAL: REQUEST FOR CASE SPECIFICS */}
      <AnimatePresence>
        {showCaseSpecificsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-2xl border border-teal-500/40 bg-[#090d18] text-slate-200 shadow-2xl p-6 relative font-sans space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-heading text-white">
                      Request for Case Specifics
                    </h3>
                    <p className="text-xs text-slate-400">
                      Saved to Client&apos;s Intake Card & used by AI Agent to logically assemble probable forms.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCaseSpecificsModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Specifics Form */}
              <div className="space-y-3.5 text-xs">
                {/* State & County */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                      State / Jurisdiction:
                    </label>
                    <input
                      type="text"
                      value={caseSpecifics.state}
                      onChange={(e) => setCaseSpecifics(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full bg-[#050812] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                      County / Venue:
                    </label>
                    <input
                      type="text"
                      value={caseSpecifics.county}
                      onChange={(e) => setCaseSpecifics(prev => ({ ...prev, county: e.target.value }))}
                      className="w-full bg-[#050812] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Court Venue & Branch */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                      Court Name:
                    </label>
                    <input
                      type="text"
                      value={caseSpecifics.courtVenue}
                      onChange={(e) => setCaseSpecifics(prev => ({ ...prev, courtVenue: e.target.value }))}
                      className="w-full bg-[#050812] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                      Branch / Courthouse:
                    </label>
                    <input
                      type="text"
                      value={caseSpecifics.branchName}
                      onChange={(e) => setCaseSpecifics(prev => ({ ...prev, branchName: e.target.value }))}
                      className="w-full bg-[#050812] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Case Number & Opposing Party */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                      Case Number / A-Number / Docket:
                    </label>
                    <input
                      type="text"
                      value={caseSpecifics.caseNumber}
                      onChange={(e) => setCaseSpecifics(prev => ({ ...prev, caseNumber: e.target.value }))}
                      className="w-full bg-[#050812] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                      Opposing Party (Petitioner/Plaintiff):
                    </label>
                    <input
                      type="text"
                      value={caseSpecifics.opposingParty}
                      onChange={(e) => setCaseSpecifics(prev => ({ ...prev, opposingParty: e.target.value }))}
                      className="w-full bg-[#050812] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* District Attorney / DHS Trial Counsel */}
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                    District Attorney / DHS Assistant Chief Counsel:
                  </label>
                  <input
                    type="text"
                    value={caseSpecifics.districtAttorneyOrDhs}
                    onChange={(e) => setCaseSpecifics(prev => ({ ...prev, districtAttorneyOrDhs: e.target.value }))}
                    className="w-full bg-[#050812] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* Specific Dates & Relief */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                      Incident / Marriage Date:
                    </label>
                    <input
                      type="text"
                      value={caseSpecifics.incidentOrMarriageDate || ''}
                      onChange={(e) => setCaseSpecifics(prev => ({ ...prev, incidentOrMarriageDate: e.target.value }))}
                      className="w-full bg-[#050812] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                      Separation / Breach Date:
                    </label>
                    <input
                      type="text"
                      value={caseSpecifics.separationOrIncidentDate || ''}
                      onChange={(e) => setCaseSpecifics(prev => ({ ...prev, separationOrIncidentDate: e.target.value }))}
                      className="w-full bg-[#050812] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-300 uppercase block mb-1">
                    Specific Relief Requested / Special Stipulations:
                  </label>
                  <textarea
                    rows={2}
                    value={caseSpecifics.reliefRequested || ''}
                    onChange={(e) => setCaseSpecifics(prev => ({ ...prev, reliefRequested: e.target.value }))}
                    className="w-full bg-[#050812] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-sans"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10.5px] font-mono text-slate-400">
                  Client: {selectedClient?.name || 'Marcus Vance'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCaseSpecificsModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCaseSpecifics}
                    className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold font-heading rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save to Intake Card & Assemble</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: MATTER WORKSPACE & CASE DOSSIER */}
      <AnimatePresence>
        {showMatterWorkspaceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl h-[88vh] rounded-3xl border border-teal-500/40 bg-[#070b14] text-slate-200 shadow-2xl flex flex-col overflow-hidden relative"
            >
              <div className="absolute right-4 top-4 z-20">
                <button
                  type="button"
                  id="btn-close-workspace-modal"
                  onClick={() => setShowMatterWorkspaceModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderMatterWorkspaceContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: LIVE VIDEO CONFERENCE PROVISION */}
      <AnimatePresence>
        {showVideoConferenceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl h-[88vh] rounded-3xl border border-emerald-500/40 bg-[#070b14] text-slate-200 shadow-2xl flex flex-col overflow-hidden relative"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/80 via-[#0e1626] to-slate-900 border-b border-emerald-500/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
                    <Video className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold font-heading text-white">
                        {selectedMatter?.title || selectedClient?.name || 'Case Matter'} — Real-Time Video Deposition
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Live Room
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Room Code: <strong className="text-emerald-300">{matterVideoRoom}</strong> • Secure Host: <span className="text-teal-300">level23consulting@gmail.com</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyVideoLink}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono rounded-xl cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    {copiedVideoLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedVideoLink ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  {onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowVideoConferenceModal(false);
                        onNavigateToTab('consult', selectedClient?.id);
                      }}
                      className="px-3 py-1.5 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/30 text-xs font-mono rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                      <span>Consultations Tab</span>
                    </button>
                  )}

                  <button
                    type="button"
                    id="btn-close-video-modal"
                    onClick={() => setShowVideoConferenceModal(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Jitsi Meet Iframe view */}
              <div className="flex-1 bg-black relative min-h-0">
                <iframe
                  src={`https://meet.jit.si/${matterVideoRoom}#config.prejoinPageEnabled=false&userInfo.displayName="Level 23 Counsel"`}
                  allow="camera; microphone; display-capture; autoplay; clipboard-write; speaker"
                  className="w-full h-full border-0"
                  title="Matter Video Conference"
                />
              </div>

              {/* Meeting Notes Footer */}
              <div className="p-3 bg-[#080d18] border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex-1">
                  <input
                    type="text"
                    value={videoNotes}
                    onChange={(e) => setVideoNotes(e.target.value)}
                    placeholder="Enter deposition transcript note or hearing finding to record in matter..."
                    className="w-full bg-[#050812] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 font-sans"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (videoNotes.trim()) {
                        handleAddTask();
                        setVideoNotes('');
                      }
                      setShowVideoConferenceModal(false);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-heading text-xs rounded-xl cursor-pointer transition-all"
                  >
                    Save & Conclude
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVideoConferenceModal(false)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                  >
                    Close Video
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
