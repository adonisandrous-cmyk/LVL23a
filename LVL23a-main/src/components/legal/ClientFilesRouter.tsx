import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderOpen,
  FolderDown,
  FolderCheck,
  FileText,
  FileCheck,
  Download,
  Eye,
  Edit3,
  Trash2,
  Share2,
  Upload,
  Search,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  User,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronRight,
  Filter
} from 'lucide-react';

export interface ClientFileItem {
  file_name: string;
  path: string;
  url: string;
  extension: string;
  type: 'xfdf' | 'pdf' | 'document';
  size_bytes: number;
  modified_at?: number;
}

export interface ClientMatterItem {
  case_id: number;
  case_number: string;
  case_type: string;
  court_name?: string;
  judge_name?: string;
  status: string;
  vault_dir: string;
  file_count: number;
  files: ClientFileItem[];
  subfolders?: Array<{
    id: string;
    name: string;
    description: string;
    file_count: number;
    files: ClientFileItem[];
  }>;
}

export interface ClientFilesRecord {
  client_id: number;
  client_name: string;
  first_name: string;
  last_name: string;
  dob?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  a_number?: string;
  ssn?: string;
  matters_count: number;
  total_files: number;
  matters: ClientMatterItem[];
}

interface ClientFilesRouterProps {
  onViewFile: (url: string, fileName: string, type: 'pdf' | 'xfdf' | 'json' | 'text') => void;
  onEditFile?: (file: ClientFileItem, matter: ClientMatterItem, client: ClientFilesRecord) => void;
  onEditForm?: (formName: string, clientId: number, caseId: number) => void;
}

export default function ClientFilesRouter({
  onViewFile,
  onEditFile,
  onEditForm
}: ClientFilesRouterProps) {
  const [clientFiles, setClientFiles] = useState<ClientFilesRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [expandedMatters, setExpandedMatters] = useState<Record<string, boolean>>({});

  // Routing Modal state
  const [showRouteModal, setShowRouteModal] = useState<boolean>(false);
  const [routeSourcePath, setRouteSourcePath] = useState<string>('templates/FL-120.pdf');
  const [routeClientId, setRouteClientId] = useState<number>(1);
  const [routeCaseId, setRouteCaseId] = useState<number>(1);
  const [routeDestFilename, setRouteDestFilename] = useState<string>('');
  const [isRouting, setIsRouting] = useState<boolean>(false);
  const [routeSuccessMsg, setRouteSuccessMsg] = useState<string | null>(null);
  const [routeErrorMsg, setRouteErrorMsg] = useState<string | null>(null);

  // Available source templates and outputs for routing
  const [availableSources, setAvailableSources] = useState<string[]>([
    'templates/FL-100.pdf',
    'templates/FL-110.pdf',
    'templates/FL-115.pdf',
    'templates/FL-120.pdf',
    'templates/FL-150.pdf',
    'templates/FL-300.pdf',
    'templates/EOIR-33.pdf',
    'templates/I-589.pdf',
    'output/FL-120.xfdf',
    'output/FL-100.xfdf',
    'output/FL-300.xfdf',
    'output/EOIR-33.xfdf'
  ]);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadClientId, setUploadClientId] = useState<number>(1);
  const [uploadCaseId, setUploadCaseId] = useState<number>(1);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadFileContent, setUploadFileContent] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Delete confirm state
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const fetchClientFiles = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/v1/client-files');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setClientFiles(data.data);

        // Auto-expand all matters by default
        const initExpanded: Record<string, boolean> = {};
        data.data.forEach((c: ClientFilesRecord) => {
          c.matters.forEach((m: ClientMatterItem) => {
            initExpanded[`${c.client_id}-${m.case_id}`] = true;
          });
        });
        setExpandedMatters(initExpanded);

        // If client selection for route modal is not set
        if (data.data.length > 0) {
          setRouteClientId(data.data[0].client_id);
          if (data.data[0].matters.length > 0) {
            setRouteCaseId(data.data[0].matters[0].case_id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch client files:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClientFiles();
  }, []);

  const toggleMatter = (key: string) => {
    setExpandedMatters((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleRouteFile = async () => {
    if (!routeSourcePath || !routeClientId || !routeCaseId) {
      setRouteErrorMsg('Please select a source file, target client, and matter.');
      return;
    }

    try {
      setIsRouting(true);
      setRouteErrorMsg(null);
      setRouteSuccessMsg(null);

      const res = await fetch('/api/v1/client-files/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_path: routeSourcePath,
          client_id: routeClientId,
          case_id: routeCaseId,
          destination_filename: routeDestFilename.trim() || undefined
        })
      });

      const json = await res.json();
      if (json.success) {
        setRouteSuccessMsg(`Successfully routed ${json.data.file_name} to matter ${json.data.case_number}!`);
        setRouteDestFilename('');
        await fetchClientFiles();
        setTimeout(() => {
          setShowRouteModal(false);
          setRouteSuccessMsg(null);
        }, 1800);
      } else {
        setRouteErrorMsg(json.error || 'Failed to route file to client matter.');
      }
    } catch (err: any) {
      setRouteErrorMsg(err.message || 'Routing network failure');
    } finally {
      setIsRouting(false);
    }
  };

  const handleUploadFile = async () => {
    if (!uploadFileName || !uploadClientId || !uploadCaseId) {
      return;
    }

    try {
      setIsUploading(true);
      const res = await fetch('/api/v1/client-files/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: uploadClientId,
          case_id: uploadCaseId,
          file_name: uploadFileName.trim(),
          file_text: uploadFileContent || `Client Exhibit / Intake Note\nCreated: ${new Date().toISOString()}\n`
        })
      });

      const json = await res.json();
      if (json.success) {
        setUploadSuccessMsg(`Saved to matter: ${json.data.file_name}`);
        setUploadFileName('');
        setUploadFileContent('');
        await fetchClientFiles();
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadSuccessMsg(null);
        }, 1500);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    if (!confirm(`Are you sure you want to delete ${filePath} from the client matter vault?`)) {
      return;
    }
    try {
      setDeletingPath(filePath);
      const res = await fetch('/api/v1/client-files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath })
      });
      const json = await res.json();
      if (json.success) {
        await fetchClientFiles();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingPath(null);
    }
  };

  // Filter clients and matters
  const filteredClients = clientFiles.filter((client) => {
    const matchesSearch =
      client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.matters.some(
        (m) =>
          m.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.case_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.files.some((f) => f.file_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    const matchesType =
      selectedTypeFilter === 'all' ||
      client.matters.some((m) => m.case_type.toLowerCase() === selectedTypeFilter.toLowerCase());

    return matchesSearch && matchesType;
  });

  const totalVaultFiles = clientFiles.reduce((acc, c) => acc + c.total_files, 0);
  const totalMatters = clientFiles.reduce((acc, c) => acc + c.matters_count, 0);

  // Selected client for route modal to pick cases
  const routeClientObj = clientFiles.find((c) => c.client_id === routeClientId);
  const uploadClientObj = clientFiles.find((c) => c.client_id === uploadClientId);

  return (
    <div className="space-y-6">
      {/* Top Banner / Pipeline Header */}
      <div className="bg-[#090f1d] border border-cyan-500/30 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center gap-2">
                <span>Client Files Router & Matter Vault Hierarchy</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  output/&lt;type&gt;/&lt;docket&gt;/
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Multi-stage document routing: Universal DB ➔ Mapping Config ➔ XFDF Engine ➔ Official PDF ➔ Routed directly to Client Matter Folders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowRouteModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Route File to Matter</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload Exhibit</span>
            </button>

            <button
              onClick={fetchClientFiles}
              disabled={refreshing}
              className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-all"
              title="Refresh Client Vault"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Total Clients:</span>
            <span className="font-bold text-white text-sm">{clientFiles.length}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Active Matters:</span>
            <span className="font-bold text-cyan-300 text-sm">{totalMatters}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Vault Artifacts:</span>
            <span className="font-bold text-emerald-400 text-sm">{totalVaultFiles} files</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Routing Mode:</span>
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Matter & Type
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#090f1d] border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by client, docket number, form..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#070b14] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
            <Filter className="w-3 h-3" /> Practice Area:
          </span>
          {['all', 'Family Law', 'Immigration', 'Civil Litigation'].map((pt) => (
            <button
              key={pt}
              onClick={() => setSelectedTypeFilter(pt)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTypeFilter.toLowerCase() === pt.toLowerCase()
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              {pt === 'all' ? 'All Areas' : pt}
            </button>
          ))}
        </div>
      </div>

      {/* Main Client Files Tree */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Scanning enterprise client vaults and output hierarchy...</span>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-[#090f1d] border border-slate-800 rounded-xl p-10 text-center space-y-3">
          <FolderOpen className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300 font-mono">No Client Files Found</h3>
          <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
            No client files matched your query or no documents have been routed yet. Generate a form or use &quot;Route File to Matter&quot; to assign templates and documents to a client.
          </p>
          <button
            onClick={() => setShowRouteModal(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Route a Form to Client Matter</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <div
              key={client.client_id}
              className="bg-[#090f1d] border border-slate-800 rounded-xl overflow-hidden shadow-lg"
            >
              {/* Client Header Card */}
              <div className="p-4 bg-gradient-to-r from-slate-950 via-[#0a1122] to-slate-950 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white font-mono">{client.client_name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                        Client ID #{client.client_id}
                      </span>
                      {client.a_number && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                          A# {client.a_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5 flex-wrap">
                      <span>{client.email || 'no-email@law.corp'}</span>
                      <span>•</span>
                      <span>{client.phone || '(555) 000-0000'}</span>
                      {client.address && (
                        <>
                          <span>•</span>
                          <span>{client.address}, {client.city} {client.state}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto font-mono text-xs">
                  <span className="text-slate-400">
                    <strong className="text-cyan-300">{client.matters_count}</strong> {client.matters_count === 1 ? 'Matter' : 'Matters'}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">
                    <strong className="text-emerald-300">{client.total_files}</strong> {client.total_files === 1 ? 'File' : 'Files'}
                  </span>
                  <button
                    onClick={() => {
                      setRouteClientId(client.client_id);
                      if (client.matters.length > 0) {
                        setRouteCaseId(client.matters[0].case_id);
                      }
                      setShowRouteModal(true);
                    }}
                    className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1"
                    title="Route document to this client"
                  >
                    <Plus className="w-3 h-3" /> Route File
                  </button>
                </div>
              </div>

              {/* Matters in Client Dossier */}
              <div className="p-3 space-y-3">
                {client.matters.map((matter) => {
                  const matterKey = `${client.client_id}-${matter.case_id}`;
                  const isExpanded = expandedMatters[matterKey] ?? true;

                  return (
                    <div
                      key={matter.case_id}
                      className="bg-[#070b14] border border-slate-800/80 rounded-lg overflow-hidden"
                    >
                      {/* Matter Sub-Header */}
                      <div
                        onClick={() => toggleMatter(matterKey)}
                        className="p-3 bg-[#0a101f] hover:bg-[#0c1426] transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/60"
                      >
                        <div className="flex items-center gap-2.5">
                          <button className="text-slate-400 hover:text-white transition-all p-0.5">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                          <Briefcase className="w-4 h-4 text-amber-400" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white font-mono">
                                Matter: {matter.case_number}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                                  matter.case_type === 'Family Law'
                                    ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
                                    : matter.case_type === 'Immigration'
                                    ? 'bg-teal-900/40 text-teal-300 border border-teal-700/50'
                                    : 'bg-blue-900/40 text-blue-300 border border-blue-700/50'
                                }`}
                              >
                                {matter.case_type}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-mono">
                                {matter.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                              <span>Court: {matter.court_name || 'Superior Court'}</span>
                              <span>•</span>
                              <span className="text-slate-400">Vault: ./{matter.vault_dir}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-xs">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {matter.files.length} {matter.files.length === 1 ? 'file' : 'files'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRouteClientId(client.client_id);
                              setRouteCaseId(matter.case_id);
                              setShowRouteModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-all cursor-pointer"
                            title="Route file to this specific matter"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadClientId(client.client_id);
                              setUploadCaseId(matter.case_id);
                              setShowUploadModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-300 rounded hover:bg-slate-800 transition-all cursor-pointer"
                            title="Upload exhibit to matter"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* File Items Table inside Matter */}
                      {isExpanded && (
                        <div className="p-2.5">
                          {matter.files.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-500 font-mono space-y-1">
                              <p>No documents filed in this matter vault yet.</p>
                              <button
                                onClick={() => {
                                  setRouteClientId(client.client_id);
                                  setRouteCaseId(matter.case_id);
                                  setShowRouteModal(true);
                                }}
                                className="text-cyan-400 hover:underline text-[11px] font-bold"
                              >
                                + Route a court form or template here
                              </button>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left font-mono text-xs">
                                <thead>
                                  <tr className="text-slate-500 border-b border-slate-800 text-[11px]">
                                    <th className="pb-2 font-medium">Document / File</th>
                                    <th className="pb-2 font-medium">Format & Classification</th>
                                    <th className="pb-2 font-medium">Size</th>
                                    <th className="pb-2 font-medium text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                  {matter.files.map((file, idx) => {
                                    const isPdf = file.extension === 'pdf';
                                    const isXfdf = file.extension === 'xfdf';
                                    const isFilled = file.file_name.includes('_Filled');
                                    const formCodeMatch = file.file_name.split('_')[0];

                                    return (
                                      <tr
                                        key={idx}
                                        className="hover:bg-slate-900/50 transition-colors group"
                                      >
                                        <td className="py-2.5 pr-3">
                                          <div className="flex items-center gap-2">
                                            {isPdf ? (
                                              <FileCheck className={`w-4 h-4 shrink-0 ${isFilled ? 'text-emerald-400' : 'text-blue-400'}`} />
                                            ) : isXfdf ? (
                                              <FileText className="w-4 h-4 shrink-0 text-amber-400" />
                                            ) : (
                                              <FolderCheck className="w-4 h-4 shrink-0 text-slate-400" />
                                            )}
                                            <span className="font-bold text-slate-200 group-hover:text-cyan-300 transition-colors break-all">
                                              {file.file_name}
                                            </span>
                                          </div>
                                        </td>

                                        <td className="py-2.5 pr-3">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span
                                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                isFilled
                                                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50'
                                                  : isPdf
                                                  ? 'bg-blue-950/70 text-blue-300 border border-blue-700/50'
                                                  : isXfdf
                                                  ? 'bg-amber-950/70 text-amber-300 border border-amber-700/50'
                                                  : 'bg-slate-800 text-slate-300'
                                              }`}
                                            >
                                              {isFilled ? 'Filled Court PDF' : isPdf ? 'Court PDF' : isXfdf ? 'Adobe XFDF' : 'Document'}
                                            </span>
                                            {isXfdf && (
                                              <span className="text-[10px] text-slate-500">
                                                (1-Click Acrobat Import)
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        <td className="py-2.5 pr-3 text-slate-400 text-[11px]">
                                          {(file.size_bytes / 1024).toFixed(1)} KB
                                        </td>

                                        <td className="py-2.5 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            {/* In-App Viewer Button */}
                                            <button
                                              onClick={() =>
                                                onViewFile(
                                                  file.url,
                                                  file.file_name,
                                                  isPdf ? 'pdf' : isXfdf ? 'xfdf' : 'text'
                                                )
                                              }
                                              className="px-2 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                              title="Open in Document & XFDF Viewer"
                                            >
                                              <Eye className="w-3 h-3" />
                                              <span>View</span>
                                            </button>

                                            {/* Edit in Editor Button */}
                                            {onEditForm && formCodeMatch && (
                                              <button
                                                onClick={() =>
                                                  onEditForm(
                                                    formCodeMatch,
                                                    client.client_id,
                                                    matter.case_id
                                                  )
                                                }
                                                className="px-2 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 hover:text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                                title="Edit form fields in Form Editor"
                                              >
                                                <Edit3 className="w-3 h-3" />
                                                <span>Edit</span>
                                              </button>
                                            )}

                                            {/* Download Button */}
                                            <a
                                              href={file.url}
                                              download={file.file_name}
                                              className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-all cursor-pointer"
                                              title="Download original file"
                                            >
                                              <Download className="w-3 h-3" />
                                            </a>

                                            {/* Delete Button */}
                                            <button
                                              onClick={() => handleDeleteFile(file.path)}
                                              disabled={deletingPath === file.path}
                                              className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-950/40 transition-all cursor-pointer"
                                              title="Delete file from matter vault"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ROUTE FILE TO CLIENT MATTER */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showRouteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1222] border border-cyan-500/40 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Share2 className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                    Route Document to Client Matter
                  </h3>
                </div>
                <button
                  onClick={() => setShowRouteModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400 font-mono">
                Copies and routes the selected official court template or generated document directly into the target client&apos;s matter directory (<span className="text-cyan-300 font-semibold">output/&lt;type&gt;/&lt;docket&gt;/</span>) and records it into the database vault.
              </p>

              {routeSuccessMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{routeSuccessMsg}</span>
                </div>
              )}

              {routeErrorMsg && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-lg text-xs text-rose-300 font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{routeErrorMsg}</span>
                </div>
              )}

              <div className="space-y-3 font-mono text-xs">
                {/* Source File Selection */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Source File to Route:</label>
                  <select
                    value={routeSourcePath}
                    onChange={(e) => setRouteSourcePath(e.target.value)}
                    className="w-full p-2 bg-[#070b14] border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <optgroup label="Official Court Templates (templates/)">
                      {availableSources
                        .filter((s) => s.startsWith('templates/'))
                        .map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Generated Document Artifacts (output/)">
                      {availableSources
                        .filter((s) => s.startsWith('output/'))
                        .map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                {/* Target Client */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Target Client:</label>
                  <select
                    value={routeClientId}
                    onChange={(e) => {
                      const newId = parseInt(e.target.value, 10);
                      setRouteClientId(newId);
                      const targetC = clientFiles.find((c) => c.client_id === newId);
                      if (targetC && targetC.matters.length > 0) {
                        setRouteCaseId(targetC.matters[0].case_id);
                      }
                    }}
                    className="w-full p-2 bg-[#070b14] border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    {clientFiles.map((c) => (
                      <option key={c.client_id} value={c.client_id}>
                        {c.client_name} (ID: #{c.client_id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Matter / Case */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Target Case / Matter Docket:</label>
                  <select
                    value={routeCaseId}
                    onChange={(e) => setRouteCaseId(parseInt(e.target.value, 10))}
                    className="w-full p-2 bg-[#070b14] border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    {routeClientObj?.matters.map((m) => (
                      <option key={m.case_id} value={m.case_id}>
                        {m.case_number} — {m.case_type} ({m.vault_dir})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Custom Filename */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Custom Destination Filename (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FL-120_Custom_Filing.pdf (leave blank to keep source name)"
                    value={routeDestFilename}
                    onChange={(e) => setRouteDestFilename(e.target.value)}
                    className="w-full p-2 bg-[#070b14] border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setShowRouteModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRouteFile}
                  disabled={isRouting}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isRouting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  <span>Route & File to Client Matter</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: UPLOAD EXHIBIT DIRECTLY TO MATTER */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1222] border border-cyan-500/40 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Upload className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                    Upload Exhibit to Client Matter
                  </h3>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {uploadSuccessMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Target Client:</label>
                  <select
                    value={uploadClientId}
                    onChange={(e) => {
                      const newId = parseInt(e.target.value, 10);
                      setUploadClientId(newId);
                      const targetC = clientFiles.find((c) => c.client_id === newId);
                      if (targetC && targetC.matters.length > 0) {
                        setUploadCaseId(targetC.matters[0].case_id);
                      }
                    }}
                    className="w-full p-2 bg-[#070b14] border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    {clientFiles.map((c) => (
                      <option key={c.client_id} value={c.client_id}>
                        {c.client_name} (ID: #{c.client_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Target Matter Docket:</label>
                  <select
                    value={uploadCaseId}
                    onChange={(e) => setUploadCaseId(parseInt(e.target.value, 10))}
                    className="w-full p-2 bg-[#070b14] border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    {uploadClientObj?.matters.map((m) => (
                      <option key={m.case_id} value={m.case_id}>
                        {m.case_number} — {m.case_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Exhibit File Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Marriage_Certificate_Exhibit_A.pdf or Intake_Notes.txt"
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    className="w-full p-2 bg-[#070b14] border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">File Content / Notes:</label>
                  <textarea
                    rows={4}
                    placeholder="Enter document text, declaration text, or exhibit description..."
                    value={uploadFileContent}
                    onChange={(e) => setUploadFileContent(e.target.value)}
                    className="w-full p-2 bg-[#070b14] border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-500 focus:outline-none placeholder-slate-600 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadFile}
                  disabled={isUploading || !uploadFileName}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isUploading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Upload & Save to Matter Vault</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
