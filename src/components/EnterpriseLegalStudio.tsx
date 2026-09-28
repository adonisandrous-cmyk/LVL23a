import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Users,
  Briefcase,
  Scale,
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
  Play,
  Copy,
  Plus,
  Search,
  Eye,
  Layers,
  Terminal,
  Database,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle,
  FolderDown,
  FolderCheck,
  FolderOpen,
  FileCheck,
  Share2,
  Edit3
} from 'lucide-react';
import ClientFilesRouter from './legal/ClientFilesRouter';
import DocumentViewer from './legal/DocumentViewer';
import FormEditor from './legal/FormEditor';

interface ClientRecord {
  id: number;
  first_name: string;
  last_name: string;
  dob?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface CaseRecord {
  id: number;
  client_id: number;
  case_type: string;
  case_number: string;
  court_name?: string;
  judge_name?: string;
  status: string;
  first_name?: string;
  last_name?: string;
}

interface FormRecord {
  id: number;
  name: string;
  description: string;
  pdf_template_path: string;
  fields?: Record<string, string>;
}

interface DocumentAuditRecord {
  id: number;
  client_id: number;
  case_id: number;
  form_id: number;
  output_pdf_path: string;
  xfdf_path: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  case_number?: string;
  form_name?: string;
}

export default function EnterpriseLegalStudio() {
  const [activeTab, setActiveTab] = useState<'router' | 'viewer' | 'editor' | 'wizard' | 'grabber' | 'packets' | 'intake' | 'clients' | 'forms' | 'audit' | 'abbyy' | 'schema'>('router');

  // In-App Document & XFDF Viewer State
  const [viewerState, setViewerState] = useState<{
    url: string;
    name: string;
    type: 'pdf' | 'xfdf' | 'json' | 'text';
  }>({
    url: '/templates/FL-120.pdf',
    name: 'FL-120.pdf',
    type: 'pdf'
  });

  // Form Field & Mapping Editor State
  const [editorState, setEditorState] = useState<{
    formName: string;
    clientId: number;
    caseId: number;
  }>({
    formName: 'FL-120',
    clientId: 1,
    caseId: 1
  });

  const handleOpenViewer = (url: string, fileName: string, type: 'pdf' | 'xfdf' | 'json' | 'text' = 'pdf') => {
    setViewerState({ url, name: fileName, type });
    setActiveTab('viewer');
  };

  const handleOpenEditor = (formCode?: string, clientId?: number, caseId?: number) => {
    setEditorState({
      formName: formCode || 'FL-120',
      clientId: clientId || selectedClientId || 1,
      caseId: caseId || selectedCaseId || 1
    });
    setActiveTab('editor');
  };

  // DB Data states
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentAuditRecord[]>([]);
  const [abbyyTasks, setAbbyyTasks] = useState<any[]>([]);
  const [selectedAbbyyTask, setSelectedAbbyyTask] = useState<any | null>(null);
  const [ingestingTaskId, setIngestingTaskId] = useState<string | null>(null);
  const [abbyyIngestResult, setAbbyyIngestResult] = useState<any | null>(null);
  const [copiedJava, setCopiedJava] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Form Grabber & Catalog State
  const [catalogForms, setCatalogForms] = useState<any[]>([]);
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [vaultData, setVaultData] = useState<any[]>([]);
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('All');
  const [isGrabbing, setIsGrabbing] = useState<boolean>(false);
  const [grabSuccessMessage, setGrabSuccessMessage] = useState<string | null>(null);

  // Wizard States
  const [selectedClientId, setSelectedClientId] = useState<number>(1);
  const [selectedCaseId, setSelectedCaseId] = useState<number>(1);
  const [selectedFormName, setSelectedFormName] = useState<string>('FL-120');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationResult, setGenerationResult] = useState<any | null>(null);
  const [copiedXfdf, setCopiedXfdf] = useState<boolean>(false);

  // Packet Generator States (Option 1)
  const [packetType, setPacketType] = useState<'family_dissolution' | 'immigration_defense'>('family_dissolution');
  const [isGeneratingPacket, setIsGeneratingPacket] = useState<boolean>(false);
  const [packetResult, setPacketResult] = useState<any | null>(null);

  // Client Intake States (Option 4)
  const [intakeForm, setIntakeForm] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    phone: '',
    email: '',
    address_line1: '',
    city: '',
    state: '',
    zip: '',
    a_number: '',
    case_type: 'Family Law',
    case_number: '',
    court_name: '',
    target_packet: 'family'
  });
  const [isIntaking, setIsIntaking] = useState<boolean>(false);
  const [intakeResult, setIntakeResult] = useState<any | null>(null);

  // Ingest Form Modal State (Form Workflow Ingestion)
  const [showIngestModal, setShowIngestModal] = useState<boolean>(false);
  const [ingestFormCode, setIngestFormCode] = useState<string>('');
  const [ingestFormDesc, setIngestFormDesc] = useState<string>('');
  const [ingestCaseType, setIngestCaseType] = useState<string>('Family Law');
  const [isIngestingForm, setIsIngestingForm] = useState<boolean>(false);

  // Audit view mode: 'matter' (grouped by matter & type) or 'ledger' (chronological)
  const [auditGrouping, setAuditGrouping] = useState<'matter' | 'ledger'>('matter');

  // New Client Form Modal state
  const [showNewClientModal, setShowNewClientModal] = useState<boolean>(false);
  const [newClient, setNewClient] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    phone: '',
    email: '',
    address_line1: '',
    city: '',
    state: '',
    zip: ''
  });

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [clientsRes, casesRes, formsRes, docsRes, abbyyRes, catalogRes, templatesRes, vaultRes] = await Promise.all([
        fetch('/api/v1/clients').then((r) => r.json()),
        fetch('/api/v1/cases').then((r) => r.json()),
        fetch('/api/v1/forms').then((r) => r.json()),
        fetch('/api/v1/documents').then((r) => r.json()),
        fetch('/api/v1/abbyy/tasks').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/forms/catalog').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/templates').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/vault').then((r) => r.json()).catch(() => ({ success: false }))
      ]);

      if (clientsRes.success) setClients(clientsRes.data || []);
      if (casesRes.success) setCases(casesRes.data || []);
      if (formsRes.success) setForms(formsRes.data || []);
      if (docsRes.success) setDocuments(docsRes.data || []);
      if (abbyyRes.success) setAbbyyTasks(abbyyRes.data || []);
      if (catalogRes?.success) setCatalogForms(catalogRes.data || []);
      if (templatesRes?.success) setTemplatesList(templatesRes.data || []);
      if (vaultRes?.success) setVaultData(vaultRes.data || []);
    } catch (err) {
      console.error('Failed to load enterprise data from API:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const clientCases = cases.filter((c) => c.client_id === (selectedClient?.id || 1));
  const selectedCase = clientCases.find((c) => c.id === selectedCaseId) || clientCases[0] || cases[0];
  const selectedForm = forms.find((f) => f.name === selectedFormName) || forms[0];

  const handleGenerate = async () => {
    if (!selectedClient || !selectedCase || !selectedForm) return;
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const res = await fetch(`/api/v1/generate/${selectedForm.name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          case_id: selectedCase.id
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setGenerationResult(data);
        // Refresh audit log
        fetchData();
      } else {
        alert(`Generation Error: ${data.error || 'Failed to generate form'}`);
      }
    } catch (err: any) {
      alert(`Network error during generation: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.first_name || !newClient.last_name) return;

    try {
      const res = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      const data = await res.json();
      if (data.success) {
        setShowNewClientModal(false);
        setNewClient({
          first_name: '',
          last_name: '',
          dob: '',
          phone: '',
          email: '',
          address_line1: '',
          city: '',
          state: '',
          zip: ''
        });
        await fetchData();
        if (data.data?.id) {
          setSelectedClientId(data.data.id);
        }
      }
    } catch (err) {
      console.error('Failed to create client:', err);
    }
  };

  const handleGeneratePacket = async (type?: 'family_dissolution' | 'immigration_defense') => {
    const targetType = type || packetType;
    if (!selectedClient || !selectedCase) return;
    setIsGeneratingPacket(true);
    setPacketResult(null);

    try {
      const res = await fetch('/api/v1/generate-packet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          case_id: selectedCase.id,
          packet_type: targetType
        })
      });
      const data = await res.json();
      if (data.success) {
        setPacketResult(data);
        await fetchData();
      } else {
        alert(`Packet Generation Error: ${data.error || 'Failed to generate packet'}`);
      }
    } catch (err: any) {
      alert(`Network error during packet generation: ${err.message}`);
    } finally {
      setIsGeneratingPacket(false);
    }
  };

  const handleClientIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeForm.first_name || !intakeForm.last_name) return;
    setIsIntaking(true);
    setIntakeResult(null);

    try {
      const res = await fetch('/api/v1/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intakeForm)
      });
      const data = await res.json();
      if (data.success) {
        setIntakeResult(data);
        await fetchData();
        if (data.client?.id) {
          setSelectedClientId(data.client.id);
        }
        if (data.case?.id) {
          setSelectedCaseId(data.case.id);
        }
      } else {
        alert(`Intake Submission Error: ${data.error || 'Failed to process intake'}`);
      }
    } catch (err: any) {
      alert(`Network error during intake submission: ${err.message}`);
    } finally {
      setIsIntaking(false);
    }
  };

  const handleIngestForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestFormCode) return;
    setIsIngestingForm(true);

    try {
      const res = await fetch('/api/v1/forms/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_name: ingestFormCode,
          description: ingestFormDesc,
          case_type: ingestCaseType
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowIngestModal(false);
        setIngestFormCode('');
        setIngestFormDesc('');
        await fetchData();
      } else {
        alert(`Ingest Error: ${data.error || 'Failed to ingest form'}`);
      }
    } catch (err: any) {
      alert(`Network error during form ingest: ${err.message}`);
    } finally {
      setIsIngestingForm(false);
    }
  };

  const handleGrabForm = async (code: string, category: string = 'Family Law', desc?: string) => {
    setIsGrabbing(true);
    setGrabSuccessMessage(null);
    try {
      const res = await fetch('/api/v1/forms/grab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_code: code,
          practice_type: category,
          description: desc
        })
      });
      const data = await res.json();
      if (data.success) {
        setGrabSuccessMessage(`Form ${code} successfully placed into templates/${code}.pdf and registered with field mappings!`);
        await fetchData();
      } else {
        alert(`Form Grab Error: ${data.error || 'Failed to grab form'}`);
      }
    } catch (err: any) {
      alert(`Network error during form grab: ${err.message}`);
    } finally {
      setIsGrabbing(false);
    }
  };

  const handleIngestAbbyyTask = async (taskId: string) => {
    try {
      setIngestingTaskId(taskId);
      const res = await fetch(`/api/v1/abbyy/tasks/${taskId}/ingest-and-generate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setAbbyyIngestResult(data);
        await fetchData();
      } else {
        alert(`ABBYY Ingestion Error: ${data.error || 'Failed to ingest'}`);
      }
    } catch (err: any) {
      alert(`Network error during ABBYY ingest: ${err.message}`);
    } finally {
      setIngestingTaskId(null);
    }
  };

  const handleMergeAbbyyPages = async (taskId: string) => {
    try {
      await fetch(`/api/v1/abbyy/tasks/${taskId}/merge`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Failed to merge pages:', err);
    }
  };

  const handleVerifyAbbyyTask = async (taskId: string) => {
    try {
      await fetch(`/api/v1/abbyy/tasks/${taskId}/verify`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Failed to verify task:', err);
    }
  };

  const handleRejectAbbyyTask = async (taskId: string) => {
    try {
      await fetch(`/api/v1/abbyy/tasks/${taskId}/reject`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Failed to reject task:', err);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-4 sm:p-6 text-slate-200">
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER & TELEMETRY STRIP */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#0b1220] border-2 border-indigo-500/40 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_20px_rgba(99,102,241,0.15)] shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-md">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white font-heading tracking-wide">
                ENTERPRISE LEGAL DOCUMENT PLATFORM
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase font-black">
                PostgreSQL • XFDF • API v1
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Production legal automation architecture: Universal Database ➔ Declarative Field Mapping ➔ XFDF Engine ➔ Official Unaltered Court PDF.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#070b14] border border-slate-800 rounded-lg flex-wrap">
          <button
            onClick={() => setActiveTab('router')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'router' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-300" />
            <span>Client Files Router</span>
          </button>

          <button
            onClick={() => setActiveTab('viewer')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'viewer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-blue-300" />
            <span>Document Viewer</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'editor' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-300" />
            <span>Form & Field Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'wizard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Generate Form Wizard</span>
          </button>

          <button
            onClick={() => setActiveTab('grabber')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'grabber' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderDown className="w-3.5 h-3.5 text-amber-300" />
            <span>Form Grabber ({templatesList.length || 7})</span>
          </button>

          <button
            onClick={() => setActiveTab('packets')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'packets' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-300" />
            <span>Filing Packets</span>
          </button>

          <button
            onClick={() => setActiveTab('intake')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'intake' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-300" />
            <span>Client Intake</span>
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'clients' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clients & Cases ({clients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('forms')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'forms' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Forms Library ({forms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Matter Vault ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('abbyy')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'abbyy' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
            <span>ABBYY Associate ({abbyyTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'schema' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQL & API Specs</span>
          </button>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* A. CLIENT FILES ROUTER & MATTER VAULT TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'router' && (
        <ClientFilesRouter
          onViewFile={(url, fileName, type) => handleOpenViewer(url, fileName, type)}
          onEditForm={(formCode, cId, mId) => handleOpenEditor(formCode, cId, mId)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* B. IN-APP DOCUMENT & XFDF VIEWER TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'viewer' && (
        <DocumentViewer
          initialFileUrl={viewerState.url}
          initialFileName={viewerState.name}
          initialFileType={viewerState.type}
          onEditInEditor={(formCode) => handleOpenEditor(formCode)}
          onRouteFile={() => setActiveTab('router')}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* C. FORM FIELD & MAPPING EDITOR TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'editor' && (
        <FormEditor
          initialFormName={editorState.formName}
          initialClientId={editorState.clientId}
          initialCaseId={editorState.caseId}
          onOpenViewer={(url, fileName, type) => handleOpenViewer(url, fileName, type)}
          onOpenRouter={() => setActiveTab('router')}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 0. FORM GRABBER & TEMPLATES INGESTION WORKFLOW TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'grabber' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-[#090f1d] border border-amber-500/30 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <FolderDown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center gap-2">
                    <span>Court Form Grabber & Templates Ingestion Pipeline</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      templates/ & forms/
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Workflow: Grabs any requested court form ➔ Stores official PDF into <span className="text-amber-300">templates/</span> ➔ Generates mapping in <span className="text-indigo-300">forms/</span> ➔ Registers in DB ➔ Assigns outputs strictly by Matter and Practice Type.
                  </p>
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <div className="px-3 py-1 rounded bg-[#050914] border border-slate-800 text-slate-300">
                  Templates on Disk: <strong className="text-amber-400">{templatesList.length}</strong>
                </div>
                <div className="px-3 py-1 rounded bg-[#050914] border border-slate-800 text-slate-300">
                  Active Forms: <strong className="text-indigo-400">{forms.length}</strong>
                </div>
              </div>
            </div>

            {grabSuccessMessage && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-xs font-mono text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{grabSuccessMessage}</span>
                </div>
                <button
                  onClick={() => setActiveTab('wizard')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold cursor-pointer"
                >
                  Generate Now in Wizard ➔
                </button>
              </div>
            )}
          </div>

          {/* Section 1: Quick Grab Curated Official Court Catalog */}
          <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <FolderCheck className="w-4 h-4 text-amber-400" />
                  <span>Curated Official Court Forms Catalog (1-Click Grab)</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Select any standard California Judicial Council, EOIR Immigration, or Civil litigation form to instantly grab and place in <code className="text-amber-400">templates/</code>.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 p-1 bg-[#050914] border border-slate-800 rounded-lg text-xs font-mono">
                {['All', 'Family Law', 'Immigration', 'Civil Litigation'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCatalogCategory(cat)}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                      selectedCatalogCategory === cat
                        ? 'bg-amber-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {catalogForms
                .filter(
                  (f) =>
                    selectedCatalogCategory === 'All' ||
                    f.category.toLowerCase().includes(selectedCatalogCategory.toLowerCase())
                )
                .map((f) => {
                  const isAlreadyInTemplates = f.in_templates || templatesList.some((t) => t.form_code === f.code);
                  return (
                    <div
                      key={f.code}
                      className="p-3.5 rounded-xl bg-[#050914] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 font-mono text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-amber-400">
                            {f.code}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              isAlreadyInTemplates
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isAlreadyInTemplates ? 'In templates/' : 'Available to Grab'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-200 font-bold leading-snug line-clamp-2">
                          {f.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {f.category}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {f.type}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80">
                        {isAlreadyInTemplates ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedFormName(f.code);
                                setActiveTab('wizard');
                              }}
                              className="w-full py-1.5 px-2 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Use in Wizard</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <a
                              href={`/templates/${f.code}.pdf`}
                              download
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                              title="Download PDF Template"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGrabForm(f.code, f.category, f.title)}
                            disabled={isGrabbing}
                            className="w-full py-1.5 px-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-[11px] font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                          >
                            <FolderDown className="w-3.5 h-3.5" />
                            <span>Grab ➔ Place in templates/</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Section 2: Custom Form Grabber & Directory Monitor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Grab Form by Identifier */}
            <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Request & Grab Custom Court Form
                </h3>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!ingestFormCode) return;
                  await handleGrabForm(ingestFormCode, ingestCaseType, ingestFormDesc);
                  setIngestFormCode('');
                  setIngestFormDesc('');
                }}
                className="space-y-3 font-mono text-xs"
              >
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Court Form Code / Identifier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FL-110, FL-141, EOIR-28, G-28, MC-030"
                    value={ingestFormCode}
                    onChange={(e) => setIngestFormCode(e.target.value)}
                    className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-amber-400 mt-1 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Practice Type / Category</label>
                    <select
                      value={ingestCaseType}
                      onChange={(e) => setIngestCaseType(e.target.value)}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-amber-400 mt-1 cursor-pointer"
                    >
                      <option value="Family Law">California Family Law</option>
                      <option value="Immigration">Federal Immigration (EOIR/USCIS)</option>
                      <option value="Civil Litigation">Civil Litigation</option>
                      <option value="Probate">Probate / Estate</option>
                      <option value="Corporate">Corporate / Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Form Title / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Summons & Notice of Action"
                      value={ingestFormDesc}
                      onChange={(e) => setIngestFormDesc(e.target.value)}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-amber-400 mt-1"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#050914] rounded border border-slate-800/80 text-[11px] text-slate-400">
                  <div className="font-bold text-slate-300">Automated Pipeline:</div>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li>Places clean PDF form into <code className="text-amber-400">templates/{ingestFormCode || '&lt;FORM&gt;'}.pdf</code></li>
                    <li>Generates mapping configuration into <code className="text-indigo-400">forms/{ingestFormCode || '&lt;FORM&gt;'}.mapping.json</code></li>
                    <li>Registers into SQLite/Postgres <code className="text-slate-300">forms</code> and <code className="text-slate-300">form_fields</code></li>
                    <li>Assigns generated outputs to <code className="text-emerald-400">output/{ingestCaseType.replace(/ /g, '_')}/&lt;matter&gt;/</code></li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isGrabbing || !ingestFormCode}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isGrabbing ? 'Grabbing & Registering...' : 'Grab Form & Place in templates/'}
                </button>
              </form>
            </div>

            {/* Live Templates Directory Inspector */}
            <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Templates Directory Monitor (./templates/)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-indigo-400">
                  {templatesList.length} Files Present
                </span>
              </div>

              <div className="rounded-lg border border-slate-800 overflow-hidden bg-[#050914] max-h-[310px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0b1220] border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">File Name</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Mapping Config</th>
                      <th className="py-2.5 px-3">Database</th>
                      <th className="py-2.5 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {templatesList.map((tpl) => (
                      <tr key={tpl.file_name} className="hover:bg-[#0c1424]">
                        <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>{tpl.file_name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {(tpl.size_bytes / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-2.5 px-3">
                          {tpl.has_mapping ? (
                            <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>forms/{tpl.form_code}.mapping.json</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 text-[10px]">Pending</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {tpl.registered_in_db ? (
                            <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                              Registered
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Unregistered</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedFormName(tpl.form_code);
                                setActiveTab('wizard');
                              }}
                              className="px-2 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-[10px] rounded cursor-pointer"
                              title="Generate this form in Wizard"
                            >
                              Wizard
                            </button>
                            <a
                              href={`/${tpl.path}`}
                              download
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                              title="Download PDF template"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. GENERATE FORM WIZARD TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'wizard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Form Configuration & Field Selection */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-5 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Step 1: Select Records & Form Target
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Database Connected (PostgreSQL/SQLite)
                </span>
              </div>

              {/* Output Matter & Type Assigned Banner */}
              <div className="p-3 rounded-lg bg-[#050914] border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Assigned Output Vault:</span>
                    <div className="text-white font-bold flex items-center gap-2">
                      <span className="text-indigo-400">output/{selectedCase?.case_type.replace(/ /g, '_') || 'General'}/{selectedCase?.case_number.replace(/ /g, '_') || 'Matter'}/</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {selectedCase?.case_type || 'General'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 sm:text-right">
                  Client: <strong className="text-slate-200">{selectedClient?.first_name} {selectedClient?.last_name}</strong>
                </div>
              </div>

              {/* Record Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Client Picker */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">1. Client Record</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(parseInt(e.target.value, 10))}
                    className="w-full bg-[#050914] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} (ID: {c.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Case Picker */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">2. Matter / Case</label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(parseInt(e.target.value, 10))}
                    className="w-full bg-[#050914] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    {clientCases.length > 0 ? (
                      clientCases.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.case_number} ({c.case_type})
                        </option>
                      ))
                    ) : (
                      cases.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.case_number} ({c.case_type})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Form Picker */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">3. Court Form Target</label>
                  <select
                    value={selectedFormName}
                    onChange={(e) => setSelectedFormName(e.target.value)}
                    className="w-full bg-[#050914] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    {forms.map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.name} (Official PDF)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Auto-Filled Field Mapping Preview Table */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                    Step 2: Universal Field Mappings Preview
                  </h4>
                  <span className="text-[10px] font-mono text-indigo-400">
                    5 Universal Fields Linked
                  </span>
                </div>

                <div className="rounded-lg border border-slate-800 overflow-hidden bg-[#050914]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0b1220] border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-3">Universal Field</th>
                        <th className="py-2 px-3">Database Value</th>
                        <th className="py-2 px-3">Target PDF AcroForm Field</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-[11px]">
                      <tr>
                        <td className="py-2 px-3 text-indigo-300 font-bold">client_first_name</td>
                        <td className="py-2 px-3 text-white">{selectedClient?.first_name || 'Maria'}</td>
                        <td className="py-2 px-3 text-emerald-400">ClientFirstName</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-indigo-300 font-bold">client_last_name</td>
                        <td className="py-2 px-3 text-white">{selectedClient?.last_name || 'Lopez'}</td>
                        <td className="py-2 px-3 text-emerald-400">ClientLastName</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-indigo-300 font-bold">client_DOB</td>
                        <td className="py-2 px-3 text-white">{selectedClient?.dob || '1990-05-12'}</td>
                        <td className="py-2 px-3 text-emerald-400">ClientDOB</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-indigo-300 font-bold">client_address</td>
                        <td className="py-2 px-3 text-white truncate max-w-[200px]" title={`${selectedClient?.address_line1}, ${selectedClient?.city}, ${selectedClient?.state} ${selectedClient?.zip}`}>
                          {selectedClient?.address_line1 || '123 Main St'}, {selectedClient?.city || 'Las Vegas'}, {selectedClient?.state || 'NV'} {selectedClient?.zip || '89101'}
                        </td>
                        <td className="py-2 px-3 text-emerald-400">ClientAddress</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-indigo-300 font-bold">case_number</td>
                        <td className="py-2 px-3 text-white">{selectedCase?.case_number || '23-12345'}</td>
                        <td className="py-2 px-3 text-emerald-400">CaseNumber</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3 px-5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <Play className={`w-4 h-4 fill-white ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Generating XFDF Payload...' : `Generate ${selectedForm?.name || 'FL-120'} Form`}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Generation Output & PDF Preview */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      XFDF Generation Output
                    </h3>
                  </div>
                  {generationResult && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      SUCCESS
                    </span>
                  )}
                </div>

                {generationResult ? (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs font-mono space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Form Successfully Generated & Logged to DB!</span>
                      </div>
                      <div className="text-[11px] text-emerald-300">
                        Client: {generationResult.client_name} • Case: {generationResult.case_number}
                      </div>
                    </div>

                    {/* Output File Links */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono text-slate-400 uppercase">Document Actions & Inspection</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          onClick={() =>
                            handleOpenViewer(
                              generationResult.filled_pdf_url,
                              `${generationResult.form_name}_Filled.pdf`,
                              'pdf'
                            )
                          }
                          className="p-2.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 rounded-lg flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-blue-300 hover:text-white transition-all cursor-pointer shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open in Viewer</span>
                        </button>

                        <button
                          onClick={() =>
                            handleOpenEditor(
                              generationResult.form_name,
                              generationResult.client_id,
                              generationResult.case_id
                            )
                          }
                          className="p-2.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 rounded-lg flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-indigo-300 hover:text-white transition-all cursor-pointer shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit in Editor</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('router')}
                          className="p-2.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 rounded-lg flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-cyan-300 hover:text-white transition-all cursor-pointer shadow-sm"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Route to Client</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 pt-1">
                        {generationResult.filled_pdf_url && (
                          <a
                            href={generationResult.filled_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-gradient-to-r from-emerald-950/70 to-teal-950/70 hover:from-emerald-900/70 hover:to-teal-900/70 border border-emerald-500/50 rounded-lg flex items-center justify-between text-xs font-mono text-emerald-200 transition-all group shadow-md"
                          >
                            <div className="flex items-center gap-2">
                              <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                              <span className="font-bold">View / Print Filled {generationResult.form_name}.pdf</span>
                            </div>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                              Browser Ready (Option 2)
                            </span>
                          </a>
                        )}

                        <a
                          href={generationResult.xfdf_url}
                          download
                          className="p-3 bg-[#050914] hover:bg-[#081024] border border-slate-800 hover:border-indigo-500/40 rounded-lg flex items-center justify-between text-xs font-mono text-indigo-300 transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4 text-indigo-400 group-hover:translate-y-0.5 transition-transform" />
                            <span>Download {generationResult.form_name}.xfdf</span>
                          </div>
                          <span className="text-[10px] text-slate-500">XFDF Data</span>
                        </a>

                        <a
                          href={generationResult.pdf_url}
                          download
                          className="p-3 bg-[#050914] hover:bg-[#081024] border border-slate-800 hover:border-emerald-500/40 rounded-lg flex items-center justify-between text-xs font-mono text-emerald-300 transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
                            <span>Download Official {generationResult.form_name}.pdf</span>
                          </div>
                          <span className="text-[10px] text-slate-500">Unaltered Court PDF</span>
                        </a>
                      </div>
                    </div>

                    {/* How to use in Adobe Acrobat instructions */}
                    <div className="p-3.5 bg-[#050914] rounded-lg border border-slate-800/80 text-xs space-y-2">
                      <div className="font-mono text-slate-300 font-bold uppercase text-[11px]">
                        How to open in Adobe Acrobat:
                      </div>
                      <ol className="list-decimal list-inside text-slate-400 space-y-1 text-[11px] font-mono">
                        <li>Open the official <strong className="text-white">FL-120.pdf</strong> in Acrobat</li>
                        <li>Click <strong className="text-white">Prepare Form ➔ More ➔ Import Data</strong></li>
                        <li>Select the downloaded <strong className="text-indigo-300">.xfdf</strong> file</li>
                        <li>All fields populate instantly with zero layout alteration!</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-[#050914] space-y-3">
                    <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                    <div className="text-xs font-mono font-bold text-slate-400">Ready to Generate</div>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Click "Generate FL-120 Form" to extract universal fields from PostgreSQL, generate the XFDF payload, and record an audit log.
                    </p>
                  </div>
                )}
              </div>

              {/* CLI Command Helper */}
              <div className="pt-4 border-t border-slate-800">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                  Equivalent Terminal CLI Command
                </div>
                <div className="bg-[#050811] p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-indigo-300 select-all overflow-x-auto">
                  python3 generate_form.py --form {selectedFormName} --client {selectedClientId} --case {selectedCaseId}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MULTI-FORM FILING PACKETS TAB (Option 1) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'packets' && (
        <div className="space-y-5">
          <div className="bg-[#090f1d] border border-purple-500/40 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400 font-black font-mono shadow-md">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                    Multi-Form Court Filing Packet Generator
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                    Batch Engine
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Generate entire judicial bundles in a single atomic transaction with both standard XFDF and browser-ready flattened PDFs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">
                Selected Client: <strong className="text-white">{selectedClient?.first_name} {selectedClient?.last_name}</strong>
              </span>
            </div>
          </div>

          {/* Packet Selector Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Packet 1: California Dissolution */}
            <div
              onClick={() => setPacketType('family_dissolution')}
              className={`p-5 rounded-xl border transition-all cursor-pointer space-y-3 ${
                packetType === 'family_dissolution'
                  ? 'bg-purple-950/30 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                  : 'bg-[#090f1d] border-slate-800 hover:border-purple-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-400" />
                  <h4 className="text-sm font-bold text-white font-mono">California Family Law Dissolution Packet</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  3 Court Forms
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Standard divorce & legal separation filing bundle for California Superior Court:
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-purple-400 font-bold">• FL-100:</span> Petition—Marriage / Domestic Partnership
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-purple-400 font-bold">• FL-120:</span> Response—Marriage / Domestic Partnership
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-purple-400 font-bold">• FL-300:</span> Request for Order (Hearing & Temp Relief)
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleGeneratePacket('family_dissolution')}
                  disabled={isGeneratingPacket}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isGeneratingPacket && packetType === 'family_dissolution' ? 'Generating 3 Forms...' : 'Generate Dissolution Packet'}</span>
                </button>
              </div>
            </div>

            {/* Packet 2: Immigration Defense */}
            <div
              onClick={() => setPacketType('immigration_defense')}
              className={`p-5 rounded-xl border transition-all cursor-pointer space-y-3 ${
                packetType === 'immigration_defense'
                  ? 'bg-teal-950/30 border-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.2)]'
                  : 'bg-[#090f1d] border-slate-800 hover:border-teal-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <h4 className="text-sm font-bold text-white font-mono">Federal Immigration Court Defense Packet</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  2 Court Forms
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Executive Office for Immigration Review (EOIR) & USCIS defensive filing bundle:
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-teal-400 font-bold">• EOIR-33:</span> Alien's Change of Address Form / EOIR Notice
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-teal-400 font-bold">• I-589:</span> Application for Asylum & Withholding of Removal
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleGeneratePacket('immigration_defense')}
                  disabled={isGeneratingPacket}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-mono font-bold text-xs uppercase rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isGeneratingPacket && packetType === 'immigration_defense' ? 'Generating 2 Forms...' : 'Generate Immigration Packet'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Packet Generation Results Display */}
          {packetResult && (
            <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                      {packetResult.packet_title} Generated ({packetResult.total_forms} Forms)
                    </h4>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Client ID #{packetResult.client_id} • Case #{packetResult.case_id}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ALL FORMS COMPILED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {packetResult.forms.map((f: any) => (
                  <div key={f.form_name} className="p-3.5 rounded-lg bg-[#050914] border border-slate-800 space-y-2.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{f.form_name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {f.field_count} Fields Mapped
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {f.filled_pdf_url && (
                        <a
                          href={f.filled_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 flex items-center justify-between text-[11px] transition-all"
                        >
                          <span className="flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3" />
                            <span>View / Print PDF</span>
                          </span>
                          <span className="text-[9px] text-emerald-400 font-bold">FLATTENED</span>
                        </a>
                      )}

                      <a
                        href={f.xfdf_url}
                        download
                        className="px-2.5 py-1.5 rounded bg-[#080d1a] hover:bg-[#0c152a] border border-slate-800 text-indigo-300 flex items-center justify-between text-[11px] transition-all"
                      >
                        <span className="flex items-center gap-1.5">
                          <Download className="w-3 h-3 text-indigo-400" />
                          <span>Download XFDF</span>
                        </span>
                        <span className="text-[9px] text-slate-500">ACROBAT</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CLIENT SELF-SERVICE INTAKE QUESTIONNAIRE (Option 4) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'intake' && (
        <div className="space-y-5">
          <div className="bg-[#090f1d] border border-emerald-500/40 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-black font-mono shadow-md">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                    Client Self-Service Intake Questionnaire
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                    Direct DB Pipeline
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Client completes personal facts and case information once. Writes directly to PostgreSQL and auto-triggers instant form/packet generation.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-6 shadow-xl">
            <form onSubmit={handleClientIntakeSubmit} className="space-y-5 font-mono text-xs">
              {/* Section 1: Personal Demographics */}
              <div className="space-y-3 pb-4 border-b border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <span>1. Client Identity & Demographics</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Carlos"
                      value={intakeForm.first_name}
                      onChange={(e) => setIntakeForm({ ...intakeForm, first_name: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mendoza"
                      value={intakeForm.last_name}
                      onChange={(e) => setIntakeForm({ ...intakeForm, last_name: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Date of Birth (YYYY-MM-DD)</label>
                    <input
                      type="text"
                      placeholder="1988-11-20"
                      value={intakeForm.dob}
                      onChange={(e) => setIntakeForm({ ...intakeForm, dob: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Alien Registration No. (A-Number)</label>
                    <input
                      type="text"
                      placeholder="A-098-765-432"
                      value={intakeForm.a_number}
                      onChange={(e) => setIntakeForm({ ...intakeForm, a_number: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Phone Number</label>
                    <input
                      type="text"
                      placeholder="(619) 555-0182"
                      value={intakeForm.phone}
                      onChange={(e) => setIntakeForm({ ...intakeForm, phone: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Email Address</label>
                    <input
                      type="email"
                      placeholder="carlos.mendoza@example.com"
                      value={intakeForm.email}
                      onChange={(e) => setIntakeForm({ ...intakeForm, email: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Residential Address */}
              <div className="space-y-3 pb-4 border-b border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  2. Residential Address
                </h4>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Street Address</label>
                  <input
                    type="text"
                    placeholder="742 Broadway"
                    value={intakeForm.address_line1}
                    onChange={(e) => setIntakeForm({ ...intakeForm, address_line1: e.target.value })}
                    className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">City</label>
                    <input
                      type="text"
                      placeholder="San Diego"
                      value={intakeForm.city}
                      onChange={(e) => setIntakeForm({ ...intakeForm, city: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">State</label>
                    <input
                      type="text"
                      placeholder="CA"
                      value={intakeForm.state}
                      onChange={(e) => setIntakeForm({ ...intakeForm, state: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Zip Code</label>
                    <input
                      type="text"
                      placeholder="92101"
                      value={intakeForm.zip}
                      onChange={(e) => setIntakeForm({ ...intakeForm, zip: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Legal Case Facts & Filing Target */}
              <div className="space-y-3 pb-4 border-b border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  3. Legal Matter & Instant Filing Target
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Case Area / Practice Type</label>
                    <select
                      value={intakeForm.case_type}
                      onChange={(e) => setIntakeForm({ ...intakeForm, case_type: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                    >
                      <option value="Family Law">California Family Law (Dissolution)</option>
                      <option value="Immigration">Federal Immigration Defense (EOIR / USCIS)</option>
                      <option value="Civil Litigation">Civil Law</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Case Docket / A-Number Docket</label>
                    <input
                      type="text"
                      placeholder="e.g. A098765432-EOIR"
                      value={intakeForm.case_number}
                      onChange={(e) => setIntakeForm({ ...intakeForm, case_number: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Auto-Generate Target</label>
                    <select
                      value={intakeForm.target_packet}
                      onChange={(e) => setIntakeForm({ ...intakeForm, target_packet: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-emerald-400"
                    >
                      <option value="family">Full Dissolution Packet (FL-100 + FL-120 + FL-300)</option>
                      <option value="immigration">Full Immigration Packet (EOIR-33 + I-589)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isIntaking}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isIntaking ? 'Submitting & Generating Documents...' : 'Submit Intake & Auto-Generate Court Documents'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Intake Result Modal */}
          {intakeResult && (
            <div className="bg-[#090f1d] border-2 border-emerald-500/50 rounded-xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Intake Processed Successfully • Client Registered to PostgreSQL
                  </h4>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-200">
                Client: <strong>{intakeResult.client.first_name} {intakeResult.client.last_name}</strong> (ID #{intakeResult.client.id}) • Case: <strong>{intakeResult.case.case_number}</strong> (ID #{intakeResult.case.id})
              </div>

              {/* Display Generated Forms / Packet */}
              {intakeResult.packet_forms ? (
                <div className="space-y-2 font-mono text-xs">
                  <div className="text-[11px] text-slate-400 uppercase">Generated Court Documents:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {intakeResult.packet_forms.map((f: any) => (
                      <div key={f.form_name} className="p-3 rounded bg-[#050914] border border-slate-800 space-y-2">
                        <div className="font-bold text-white">{f.form_name}</div>
                        <div className="flex flex-col gap-1.5">
                          <a
                            href={f.filled_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] flex items-center justify-between"
                          >
                            <span>View / Print PDF</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={f.xfdf_url}
                            download
                            className="px-2 py-1 rounded bg-slate-800 text-indigo-300 text-[10px] flex items-center justify-between"
                          >
                            <span>Download XFDF</span>
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 font-mono text-xs">
                  {intakeResult.filled_pdf_url && (
                    <a
                      href={intakeResult.filled_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View / Print Filled {intakeResult.form_name}.pdf</span>
                    </a>
                  )}
                  <a
                    href={intakeResult.xfdf_url}
                    download
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {intakeResult.form_name}.xfdf</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. CLIENTS & CASES DIRECTORY TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Client & Matter Repository ({clients.length} Clients Registered)
            </h3>
            <button
              onClick={() => setShowNewClientModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Client</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((c) => {
              const matchedCases = cases.filter((cs) => cs.client_id === c.id);
              return (
                <div
                  key={c.id}
                  className="bg-[#090f1d] border border-slate-800 rounded-xl p-4 space-y-3 hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {c.first_name} {c.last_name}
                      </h4>
                      <span className="text-[10px] font-mono text-indigo-400">Client ID #{c.id}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedClientId(c.id);
                        setActiveTab('wizard');
                      }}
                      className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <span>Fill Form</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                    <div>DOB: <span className="text-slate-200">{c.dob || 'N/A'}</span></div>
                    <div>Phone: <span className="text-slate-200">{c.phone || 'N/A'}</span></div>
                    <div>Email: <span className="text-slate-200">{c.email || 'N/A'}</span></div>
                    <div>Address: <span className="text-slate-200">{c.address_line1}, {c.city}, {c.state} {c.zip}</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      Active Matters ({matchedCases.length})
                    </div>
                    {matchedCases.map((cs) => (
                      <div key={cs.id} className="p-2 rounded bg-[#050914] border border-slate-800 text-xs font-mono flex items-center justify-between">
                        <div>
                          <div className="text-emerald-400 font-bold">{cs.case_number}</div>
                          <div className="text-[10px] text-slate-400">{cs.case_type}</div>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                          {cs.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. FORMS LIBRARY & MAPPINGS TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'forms' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Official Court Forms Library & Declarative Mappings ({forms.length} Forms Active)
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                California Family Law, Federal Immigration Court (EOIR), and custom ingested templates.
              </p>
            </div>
            <button
              onClick={() => setShowIngestModal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ingest Requested Form</span>
            </button>
          </div>

          <div className="space-y-4">
            {forms.map((f) => (
              <div key={f.id} className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black font-mono">
                      {f.name.slice(0, 6)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{f.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Official PDF Template
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">{f.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/${f.pdf_template_path}`}
                      download
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Base PDF</span>
                    </a>
                  </div>
                </div>

                {/* Mappings Table */}
                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-300 font-bold uppercase">
                    Field Mapping Configuration (Table: form_fields)
                  </div>
                  <div className="rounded-lg border border-slate-800 overflow-hidden bg-[#050914]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#0b1220] border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">Universal Field</th>
                          <th className="py-2 px-3">Target PDF AcroForm Name</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        {f.fields ? (
                          Object.entries(f.fields).map(([uKey, pKey]) => (
                            <tr key={uKey}>
                              <td className="py-2 px-3 text-indigo-300 font-bold">{uKey}</td>
                              <td className="py-2 px-3 text-emerald-400 font-bold">{pKey}</td>
                              <td className="py-2 px-3 text-slate-400">text</td>
                              <td className="py-2 px-3 text-emerald-400">Active Mapped</td>
                            </tr>
                          ))
                        ) : (
                          <>
                            <tr>
                              <td className="py-2 px-3 text-indigo-300 font-bold">client_first_name</td>
                              <td className="py-2 px-3 text-emerald-400 font-bold">ClientFirstName</td>
                              <td className="py-2 px-3 text-slate-400">text</td>
                              <td className="py-2 px-3 text-emerald-400">Active Mapped</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 text-indigo-300 font-bold">case_number</td>
                              <td className="py-2 px-3 text-emerald-400 font-bold">CaseNumber</td>
                              <td className="py-2 px-3 text-slate-400">text</td>
                              <td className="py-2 px-3 text-emerald-400">Active Mapped</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. DOCUMENT HISTORY & MATTER-CENTRIC VAULT TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Document Repository & Audit Trail (Assigned by Matter & Practice Type)
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Output templates structured by: <span className="text-emerald-400">/output/&lt;case_type&gt;/&lt;case_number&gt;/</span>
              </p>
            </div>

            {/* Toggle Grouping */}
            <div className="flex items-center gap-1 p-1 bg-[#050914] border border-slate-800 rounded-lg font-mono text-xs">
              <button
                onClick={() => setAuditGrouping('matter')}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  auditGrouping === 'matter' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Group by Matter & Type
              </button>
              <button
                onClick={() => setAuditGrouping('ledger')}
                className={`px-3 py-1 rounded transition-all cursor-pointer ${
                  auditGrouping === 'ledger' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Documents Ledger ({documents.length})
              </button>
            </div>
          </div>

          {/* Grouped by Matter & Type View */}
          {auditGrouping === 'matter' ? (
            <div className="space-y-4">
              {cases.map((cs) => {
                const matchedDocs = documents.filter((d) => d.case_id === cs.id || d.case_number === cs.case_number);
                return (
                  <div key={cs.id} className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white font-mono">{cs.case_number}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {cs.case_type}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Matter Vault Path: <strong className="text-slate-300">output/{cs.case_type.replace(/\s+/g, '_')}/{cs.case_number.replace(/\s+/g, '_')}/</strong>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {matchedDocs.length} Generated Documents
                      </span>
                    </div>

                    {matchedDocs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        {matchedDocs.map((doc) => {
                          const sanitizedClient = `${doc.first_name || 'Client'}_${doc.last_name || ''}`.replace(/\s+/g, '_');
                          const sanitizedType = (cs.case_type || 'General').trim().replace(/\s+/g, '_').replace(/\//g, '-');
                          const sanitizedCase = (cs.case_number || 'Matter').trim().replace(/\s+/g, '_').replace(/\//g, '-');
                          const filledPdfPath = `/output/${sanitizedType}/${sanitizedCase}/${doc.form_name}_${sanitizedClient}_Filled.pdf`;
                          return (
                            <div key={doc.id} className="p-3 rounded-lg bg-[#050914] border border-slate-800 space-y-2 font-mono text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>{doc.form_name}</span>
                                </span>
                                <span className="text-[9px] text-slate-500">{doc.created_at.slice(0, 10)}</span>
                              </div>
                              <div className="text-[11px] text-slate-300 truncate">
                                Client: {doc.first_name} {doc.last_name}
                              </div>

                              <div className="flex flex-col gap-1.5 pt-1">
                                <a
                                  href={filledPdfPath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[10px] flex items-center justify-between"
                                >
                                  <span>View / Print Filled PDF</span>
                                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                                </a>

                                <a
                                  href={`/${doc.xfdf_path}`}
                                  download
                                  className="px-2 py-1 rounded bg-[#080d1a] hover:bg-[#0c152a] border border-slate-800 text-indigo-300 text-[10px] flex items-center justify-between"
                                >
                                  <span>Download XFDF Data</span>
                                  <Download className="w-3 h-3 text-indigo-400" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs font-mono text-slate-500 bg-[#050914] rounded-lg border border-dashed border-slate-800">
                        No documents generated yet for this matter.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Tabular Ledger View */
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#090f1d] shadow-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0b1220] border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Audit ID</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Case Docket</th>
                    <th className="py-3 px-4">Court Form</th>
                    <th className="py-3 px-4">Output Template Path</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#0c1424] transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-bold">#{doc.id}</td>
                      <td className="py-3 px-4 text-slate-400">{doc.created_at}</td>
                      <td className="py-3 px-4 text-white font-bold">{doc.first_name} {doc.last_name}</td>
                      <td className="py-3 px-4 text-emerald-400">{doc.case_number}</td>
                      <td className="py-3 px-4 text-indigo-300 font-bold">{doc.form_name}</td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[220px]" title={doc.xfdf_path}>
                        {doc.xfdf_path}
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`/${doc.xfdf_path}`}
                          download
                          className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded text-[10px] flex items-center gap-1 w-max"
                        >
                          <Download className="w-3 h-3" />
                          <span>XFDF</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. ABBYY FLEXICAPTURE ASSOCIATE TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'abbyy' && (
        <div className="space-y-5">
          {/* ABBYY Station Connection Banner */}
          <div className="bg-[#090f1d] border border-teal-500/40 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-teal-950/80 border border-teal-500/50 flex items-center justify-center text-teal-400 font-black font-mono shadow-md text-sm">
                ABBYY
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                    ABBYY FlexiCapture 12 Web Verification Station
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold uppercase">
                    Connected Associate
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Host: <strong className="text-slate-200">afc5.datadevice.com.au</strong></span>
                  <span>•</span>
                  <span>Project: <strong className="text-teal-300">Trescon_NewVersion</strong></span>
                  <span>•</span>
                  <span>Role: <strong className="text-indigo-300">Senior Verification Operator</strong></span>
                  <span>•</span>
                  <span>Queue: <strong className="text-emerald-400">Verification</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">
                Tasks in Queue: <strong className="text-white">{abbyyTasks.length}</strong>
              </span>
              <button
                onClick={fetchData}
                className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Queue</span>
              </button>
            </div>
          </div>

          {/* Tasks Ledger matching Selenium Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <span>Verification Task Queue</span>
                <span className="text-[10px] text-slate-500 font-normal">(100 entries per page)</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {abbyyTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-4 hover:border-teal-500/40 transition-all shadow-md"
                >
                  {/* Task Top Meta */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                        <span className="text-teal-400">{task.taskId}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400">{task.batchName}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          task.status === 'Ingested'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : task.status === 'Verified'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : task.status === 'Rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    {/* Selenium Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {!task.pagesMerged && (
                        <button
                          onClick={() => handleMergeAbbyyPages(task.id)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-xs font-mono flex items-center gap-1 cursor-pointer"
                          title="HTML5 Drag & Drop Merge Separated Pages"
                        >
                          <span>Merge Pages</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleVerifyAbbyyTask(task.id)}
                        className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded text-xs font-mono cursor-pointer"
                      >
                        Verify
                      </button>

                      <button
                        onClick={() => handleRejectAbbyyTask(task.id)}
                        className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded text-xs font-mono cursor-pointer"
                      >
                        Reject
                      </button>

                      {/* Primary Ingestion & FL-120 Generation Trigger */}
                      <button
                        onClick={() => handleIngestAbbyyTask(task.id)}
                        disabled={ingestingTaskId === task.id}
                        className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold font-mono text-xs rounded uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.3)] cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>{ingestingTaskId === task.id ? 'Ingesting...' : 'Ingest & Fill FL-120'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Extracted Fields Grid (Read from Verification DOM) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono">
                    <div className="bg-[#050914] p-2.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Work ID</div>
                      <div className="font-bold text-white truncate">
                        {task.fields.workId ? (
                          <span className="text-teal-300">{task.fields.workId}</span>
                        ) : (
                          <span className="text-rose-400">BLANK ❌</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#050914] p-2.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Invoice / Case #</div>
                      <div className="font-bold text-emerald-400 truncate">
                        {task.fields.invoiceNo || 'BLANK ❌'}
                      </div>
                    </div>

                    <div className="bg-[#050914] p-2.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Invoice Date (dd/MM/yy)</div>
                      <div className="font-bold text-slate-200 truncate">
                        {task.fields.invoiceDate || 'BLANK ❌'}
                      </div>
                    </div>

                    <div className="bg-[#050914] p-2.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Received Date</div>
                      <div className="font-bold text-slate-200 truncate">
                        {task.fields.receivedDate || 'BLANK ❌'}
                      </div>
                    </div>

                    <div className="bg-[#050914] p-2.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Invoice Amount</div>
                      <div className="font-bold text-emerald-300">
                        ${task.fields.invoiceAmount}
                      </div>
                    </div>

                    <div className="bg-[#050914] p-2.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">GST Amount</div>
                      <div className="font-bold text-teal-300">
                        ${task.fields.gstAmount}
                      </div>
                    </div>
                  </div>

                  {/* Description & Location */}
                  <div className="p-2.5 bg-[#050914] rounded border border-slate-800 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-500 uppercase text-[10px] mr-2">Description:</span>
                      <span className="text-slate-300">{task.fields.description}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[10px] mr-2">Location:</span>
                      <span className="text-indigo-300">{task.fields.location}</span>
                    </div>
                  </div>

                  {/* Red Errors & Multi-page Validation Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400 text-[11px]">Validation Audit:</span>
                      {task.redErrors && task.redErrors.length > 0 ? (
                        task.redErrors.map((err: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold"
                          >
                            ⚠️ {err}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>All Validations Passed</span>
                        </span>
                      )}

                      {task.pagesMerged ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                          ✓ Pages Merged
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                          ⚠ Separated Pages Detected
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500">
                      Received at {new Date(task.receivedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Java Selenium & Maven POM Reference Drawer */}
          <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-400" />
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Automation Test Suite (Selenium WebDriver + TestNG + Maven)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                DataDevice.FlexiCapture
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              The automated testing engine logs into ABBYY FlexiCapture 12 Web Station, reads WorkId, Invoice Date, Location, and GST, audits the Red Error flag list, and invokes the ingest pipeline into your Universal Database.
            </p>

            <div className="bg-[#050811] p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[11px] pb-1 border-b border-slate-800">
                <span>Execution Command</span>
                <span>Maven 3.8+ / Java 17</span>
              </div>
              <div className="text-emerald-400 select-all">
                mvn test -Dtest=InvoiceCheaking
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ingestion & Form Generation Success Dialog */}
      <AnimatePresence>
        {abbyyIngestResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090f1d] border-2 border-emerald-500/40 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    ABBYY OCR Ingest & FL-120 Generation Complete
                  </h3>
                </div>
                <button
                  onClick={() => setAbbyyIngestResult(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-200 space-y-1">
                <div>✓ ABBYY Task: <strong>{abbyyIngestResult.task_id}</strong> successfully parsed</div>
                <div>✓ Client Ingested: <strong>{abbyyIngestResult.client_name}</strong> (ID #{abbyyIngestResult.client_id})</div>
                <div>✓ Matter Created: <strong>{abbyyIngestResult.case_number}</strong> (ID #{abbyyIngestResult.case_id})</div>
                <div>✓ Form Generated: <strong>FL-120 Response—Marriage/Domestic Partnership</strong></div>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="text-[11px] text-slate-400 uppercase">Download Generated Artifacts</div>
                <div className="flex flex-col gap-2">
                  <a
                    href={abbyyIngestResult.xfdf_url}
                    download
                    className="p-3 bg-[#050914] hover:bg-[#081024] border border-slate-800 hover:border-indigo-500/40 rounded-lg flex items-center justify-between text-indigo-300 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-400" />
                      <span>Download {abbyyIngestResult.form_name}.xfdf (Populated Form Data)</span>
                    </div>
                    <span className="text-[10px] text-slate-500">XFDF</span>
                  </a>

                  <a
                    href={abbyyIngestResult.pdf_url}
                    download
                    className="p-3 bg-[#050914] hover:bg-[#081024] border border-slate-800 hover:border-emerald-500/40 rounded-lg flex items-center justify-between text-emerald-300 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Download Official Unaltered {abbyyIngestResult.form_name}.pdf</span>
                    </div>
                    <span className="text-[10px] text-slate-500">PDF Template</span>
                  </a>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setAbbyyIngestResult(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 6. SQL & REST API SPECS TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* SQL PostgreSQL Schema Code */}
          <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  PostgreSQL Production Schema (schema.sql)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">7 Tables</span>
            </div>

            <pre className="bg-[#050811] p-3.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 max-h-[500px] overflow-y-auto leading-relaxed">
{`-- 1. CLIENTS (People)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    dob DATE,
    a_number VARCHAR(20),
    ssn VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(150),
    address_line1 VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. CASES (Matters)
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id),
    case_type VARCHAR(100),
    case_number VARCHAR(100),
    court_name VARCHAR(200),
    judge_name VARCHAR(200),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. FORMS LIBRARY
CREATE TABLE forms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    description TEXT,
    pdf_template_path VARCHAR(300),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. FORM FIELD MAPPINGS
CREATE TABLE form_fields (
    id SERIAL PRIMARY KEY,
    form_id INT REFERENCES forms(id),
    universal_field VARCHAR(100),
    pdf_field_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. GENERATED DOCUMENTS (Audit Trail)
CREATE TABLE generated_documents (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id),
    case_id INT REFERENCES cases(id),
    form_id INT REFERENCES forms(id),
    output_pdf_path VARCHAR(300),
    xfdf_path VARCHAR(300),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);`}
            </pre>
          </div>

          {/* REST API Endpoints Reference */}
          <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Enterprise REST API Reference (Base: /api/v1)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Live Express Endpoints</span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#050914] border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">GET</span>
                  <span className="text-white font-bold">/api/v1/clients</span>
                </div>
                <div className="text-[11px] text-slate-400">Returns list of all clients in database.</div>
              </div>

              <div className="p-3 rounded-lg bg-[#050914] border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">GET</span>
                  <span className="text-white font-bold">/api/v1/cases?client_id=1</span>
                </div>
                <div className="text-[11px] text-slate-400">Returns list of matters/cases for client.</div>
              </div>

              <div className="p-3 rounded-lg bg-[#050914] border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">POST</span>
                  <span className="text-white font-bold">/api/v1/generate/:form_name</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Generates filled XFDF from database, writes audit record, returns downloadable URLs.
                </div>
                <div className="bg-[#03060f] p-2 rounded text-[10px] text-indigo-300">
                  {`curl -X POST http://localhost:3000/api/v1/generate/FL-120 \\
  -H "Content-Type: application/json" \\
  -d '{"client_id": 1, "case_id": 1}'`}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#050914] border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">GET</span>
                  <span className="text-white font-bold">/api/v1/documents</span>
                </div>
                <div className="text-[11px] text-slate-400">Fetches complete document audit log.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD CLIENT MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showNewClientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090f1d] border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white font-mono uppercase">Add New Client Record</h3>
                <button
                  onClick={() => setShowNewClientModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">First Name</label>
                    <input
                      type="text"
                      required
                      value={newClient.first_name}
                      onChange={(e) => setNewClient({ ...newClient, first_name: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Last Name</label>
                    <input
                      type="text"
                      required
                      value={newClient.last_name}
                      onChange={(e) => setNewClient({ ...newClient, last_name: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">DOB (YYYY-MM-DD)</label>
                    <input
                      type="text"
                      placeholder="1990-05-12"
                      value={newClient.dob}
                      onChange={(e) => setNewClient({ ...newClient, dob: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Phone</label>
                    <input
                      type="text"
                      placeholder="(702) 555-0149"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Street Address</label>
                  <input
                    type="text"
                    placeholder="123 Main St"
                    value={newClient.address_line1}
                    onChange={(e) => setNewClient({ ...newClient, address_line1: e.target.value })}
                    className="w-full bg-[#050914] border border-slate-800 rounded px-2.5 py-1.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">City</label>
                    <input
                      type="text"
                      placeholder="Las Vegas"
                      value={newClient.city}
                      onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">State</label>
                    <input
                      type="text"
                      placeholder="NV"
                      value={newClient.state}
                      onChange={(e) => setNewClient({ ...newClient, state: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Zip</label>
                    <input
                      type="text"
                      placeholder="89101"
                      value={newClient.zip}
                      onChange={(e) => setNewClient({ ...newClient, zip: e.target.value })}
                      className="w-full bg-[#050914] border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold uppercase"
                  >
                    Save Client to Database
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
