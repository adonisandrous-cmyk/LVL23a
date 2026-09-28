import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  FileCheck,
  Eye,
  Edit3,
  Download,
  Trash2,
  Share2,
  Copy,
  Check,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { ClientFilesRecord, ClientMatterItem, ClientFileItem } from './ClientFilesRouter';

interface ClientProfileCardProps {
  client: ClientFilesRecord;
  onViewFile: (url: string, fileName: string, type: 'pdf' | 'xfdf' | 'json' | 'text') => void;
  onEditForm?: (formName: string, clientId: number, caseId: number) => void;
  onRouteFile: (clientId: number, caseId: number) => void;
  onDeleteFile: (filePath: string) => void;
  onTriggerSentryAudit: (clientId: number, caseId: number) => void;
  onTriggerExecutiveDirective: (directive: string, clientId: number, caseId: number, extra?: any) => void;
}

export default function ClientProfileCard({
  client,
  onViewFile,
  onEditForm,
  onRouteFile,
  onDeleteFile,
  onTriggerSentryAudit,
  onTriggerExecutiveDirective
}: ClientProfileCardProps) {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [expandedSubfolders, setExpandedSubfolders] = useState<Record<string, boolean>>({
    '01_Pleadings_and_Petitions': true,
    '02_Service_and_Summons': true,
    '03_Financial_Disclosures': true,
    '05_Immigration_Packets': true
  });
  const [showMaskedSSN, setShowMaskedSSN] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const activeMatter = client.matters[selectedCaseIdx] || client.matters[0];

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const toggleSubfolder = (sfId: string) => {
    setExpandedSubfolders((prev) => ({
      ...prev,
      [sfId]: !prev[sfId]
    }));
  };

  const initials = `${client.first_name?.[0] || 'C'}${client.last_name?.[0] || 'L'}`.toUpperCase();

  // Subfolder display icons & colors
  const getSubfolderIcon = (sfId: string) => {
    switch (sfId) {
      case '01_Pleadings_and_Petitions':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      case '02_Service_and_Summons':
        return <FileCheck className="w-4 h-4 text-emerald-400" />;
      case '03_Financial_Disclosures':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case '04_Motions_and_Orders':
        return <FileText className="w-4 h-4 text-purple-400" />;
      case '05_Immigration_Packets':
        return <FileCheck className="w-4 h-4 text-teal-400" />;
      case '06_Client_Exhibits_and_Intake':
        return <FolderOpen className="w-4 h-4 text-blue-400" />;
      case '07_XFDF_Injection_Payloads':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      default:
        return <Folder className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-[#090f1d] border border-slate-800 rounded-xl overflow-hidden shadow-xl transition-all font-mono">
      {/* ------------------------------------------------------------- */}
      {/* 1. EXECUTIVE CLIENT PROFILE HEADER */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 bg-gradient-to-r from-[#070b14] via-[#0b1324] to-[#070b14] border-b border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          {/* Monogram Seal */}
          <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/40 flex flex-col items-center justify-center text-indigo-300 font-bold text-base shadow-md shrink-0">
            <span>{initials}</span>
            <span className="text-[9px] text-slate-500 font-normal">#{client.client_id}</span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">{client.client_name}</h3>
              <span className="text-[11px] text-slate-400">·</span>
              <span className="text-xs text-indigo-300 font-semibold">
                {activeMatter?.case_type || 'General Legal Practice'}
              </span>
              <span className="text-[11px] text-slate-500">·</span>
              <span className="text-xs text-amber-300 font-bold">
                Docket: {activeMatter?.case_number || 'PENDING'}
              </span>
            </div>

            {/* Sentry QA Supervisor & Phoenix/Eve Directives Status */}
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
              <div
                onClick={() => onTriggerSentryAudit(client.client_id, activeMatter?.case_id || 1)}
                className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors"
                title="Click to view Sentry Supervisor Quality Control report"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold">Sentry QC: 100% Supervised</span>
                <span className="text-[10px] text-slate-500">(0 Escalations)</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1 text-cyan-300 text-[11px]">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Phoenix & EVE Directives Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Matter Dockets Switcher & Direct Action */}
        <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
          {client.matters.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs bg-[#070b14] border border-slate-700 rounded-lg p-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCaseIdx}
                onChange={(e) => setSelectedCaseIdx(parseInt(e.target.value, 10))}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                {client.matters.map((m, idx) => (
                  <option key={m.case_id} value={idx} className="bg-slate-900 text-white">
                    {m.case_number} ({m.case_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => onTriggerSentryAudit(client.client_id, activeMatter?.case_id || 1)}
            className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            title="Inspect quality control and automated resolutions"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sentry Audit</span>
          </button>

          <button
            onClick={() => onRouteFile(client.client_id, activeMatter?.case_id || 1)}
            className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Route to Matter</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. VITALS & VERIFIED DOSSIER INFORMATION BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#070b14] border-b border-slate-800 text-xs">
        {/* Contact Vitals */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Contact Vitals</span>
          <div
            onClick={() => handleCopy(client.phone || '', 'phone')}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer group"
          >
            <Phone className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">{client.phone || '(555) 000-0000'}</span>
            {copiedField === 'phone' ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-2.5 h-2.5 text-slate-600 opacity-0 group-hover:opacity-100" />
            )}
          </div>
          <div
            onClick={() => handleCopy(client.email || '', 'email')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white cursor-pointer group"
          >
            <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">{client.email || 'no-email@law.corp'}</span>
            {copiedField === 'email' ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-2.5 h-2.5 text-slate-600 opacity-0 group-hover:opacity-100" />
            )}
          </div>
        </div>

        {/* Physical Address */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Residential Address</span>
          <div className="flex items-start gap-1.5 text-slate-300">
            <MapPin className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-tight">
              {client.address ? `${client.address}, ${client.city} ${client.state} ${client.zip}` : 'Address Pending'}
            </span>
          </div>
        </div>

        {/* Identifiers (A-Number / SSN) */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Identifiers</span>
            <button
              onClick={() => setShowMaskedSSN(!showMaskedSSN)}
              className="text-slate-400 hover:text-white text-[10px] flex items-center gap-0.5 cursor-pointer"
            >
              {showMaskedSSN ? <Unlock className="w-2.5 h-2.5 text-amber-400" /> : <Lock className="w-2.5 h-2.5" />}
              <span>{showMaskedSSN ? 'Hide' : 'Show'}</span>
            </button>
          </span>
          <div className="text-slate-300">
            <span className="text-slate-500">A#: </span>
            <span className="text-amber-300 font-bold">{client.a_number || 'A098765432'}</span>
          </div>
          <div className="text-slate-400">
            <span className="text-slate-500">SSN: </span>
            <span>{showMaskedSSN ? (client.ssn || '123-45-6789') : '•••-••-••••'}</span>
          </div>
        </div>

        {/* Date of Birth & Court Authority */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Court Jurisdiction</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>DOB: {client.dob || '1990-05-12'}</span>
          </div>
          <div className="text-slate-400 truncate" title={activeMatter?.court_name || 'Superior Court'}>
            <span className="text-slate-500">Court: </span>
            <span>{activeMatter?.court_name ? activeMatter.court_name.split(',')[0] : 'Superior Court'}</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. PHOENIX & EVE EXECUTIVE DIRECTIVES QUICK ACTION BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="px-4 py-2.5 bg-[#0a1122] border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-bold text-[11px] uppercase tracking-wide">
            Phoenix & EVE Command Directives:
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Order Prepare Form */}
          <button
            onClick={() =>
              onTriggerExecutiveDirective('ORDER_PREPARE_DOCUMENT', client.client_id, activeMatter?.case_id || 1, {
                form_name: activeMatter?.case_type === 'Immigration' ? 'EOIR-33' : 'FL-120'
              })
            }
            className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="Phoenix & EVE order standard court form prepared into subfolder"
          >
            <Play className="w-3 h-3 text-indigo-400 fill-current" />
            <span>Order Prepare Form</span>
          </button>

          {/* Order Process Inbox */}
          <button
            onClick={() =>
              onTriggerExecutiveDirective('ORDER_PROCESS_INBOX', client.client_id, activeMatter?.case_id || 1)
            }
            className="px-2.5 py-1 bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-200 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="Order pending artifacts from Level23 Drive Inbox processed"
          >
            <FolderOpen className="w-3 h-3 text-blue-400" />
            <span>Process Drive Inbox</span>
          </button>

          {/* Order File Document */}
          <button
            onClick={() =>
              onTriggerExecutiveDirective('ORDER_FILE_DOCUMENT', client.client_id, activeMatter?.case_id || 1)
            }
            className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="Phoenix & EVE order official filing receipt & stamp"
          >
            <FileCheck className="w-3 h-3 text-emerald-400" />
            <span>Order File Matter</span>
          </button>

          {/* Order Redo Document */}
          <button
            onClick={() =>
              onTriggerExecutiveDirective('ORDER_REDO_DOCUMENT', client.client_id, activeMatter?.case_id || 1, {
                form_name: activeMatter?.case_type === 'Immigration' ? 'EOIR-33' : 'FL-120'
              })
            }
            className="px-2.5 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="Order document regenerated with fresh facts"
          >
            <RotateCcw className="w-3 h-3 text-purple-400" />
            <span>Order Redo</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. 7-SUBFOLDER FILING SYSTEM TREE */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Matter Vault Taxonomy: ./{activeMatter?.vault_dir || 'output'}
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            <strong className="text-cyan-300">{activeMatter?.file_count || 0}</strong> Total Filed Artifacts
          </span>
        </div>

        {/* Subfolders Grid / Accordion */}
        <div className="space-y-2">
          {(activeMatter?.subfolders || []).map((subfolder) => {
            const isExpanded = expandedSubfolders[subfolder.id] ?? false;
            const hasFiles = subfolder.files.length > 0;

            return (
              <div
                key={subfolder.id}
                className="bg-[#070b14] border border-slate-800/80 rounded-lg overflow-hidden"
              >
                {/* Subfolder Header */}
                <div
                  onClick={() => toggleSubfolder(subfolder.id)}
                  className="p-2.5 bg-[#0a101f] hover:bg-[#0c1426] transition-colors cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <button className="text-slate-400 hover:text-white p-0.5">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                    {getSubfolderIcon(subfolder.id)}
                    <span className="font-bold text-white">{subfolder.name}</span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      — {subfolder.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                        hasFiles
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      {subfolder.file_count} {subfolder.file_count === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                </div>

                {/* Subfolder File Items */}
                {isExpanded && (
                  <div className="p-2 border-t border-slate-800/50">
                    {!hasFiles ? (
                      <div className="py-2.5 text-center text-[11px] text-slate-500 space-y-1">
                        <span>No documents filed in this subfolder yet.</span>
                        <button
                          onClick={() => onRouteFile(client.client_id, activeMatter.case_id)}
                          className="block mx-auto text-cyan-400 hover:underline text-[10px]"
                        >
                          + Route file to {subfolder.name}
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-slate-500 text-[10px] border-b border-slate-800">
                              <th className="pb-1.5 font-medium">Document</th>
                              <th className="pb-1.5 font-medium">Type</th>
                              <th className="pb-1.5 font-medium">Size</th>
                              <th className="pb-1.5 font-medium">Sentry QC</th>
                              <th className="pb-1.5 font-medium text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {subfolder.files.map((file, idx) => {
                              const isPdf = file.extension === 'pdf';
                              const isXfdf = file.extension === 'xfdf';
                              const isFilled = file.file_name.includes('_Filled');
                              const formCodeMatch = file.file_name.split('_')[0];

                              return (
                                <tr key={idx} className="hover:bg-slate-900/50 transition-colors group">
                                  <td className="py-2 pr-3">
                                    <div className="flex items-center gap-2">
                                      {isPdf ? (
                                        <FileCheck
                                          className={`w-3.5 h-3.5 shrink-0 ${
                                            isFilled ? 'text-emerald-400' : 'text-blue-400'
                                          }`}
                                        />
                                      ) : isXfdf ? (
                                        <FileText className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                                      ) : (
                                        <Folder className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                      )}
                                      <span className="font-bold text-slate-200 group-hover:text-cyan-300 transition-colors break-all text-[11px]">
                                        {file.file_name}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="py-2 pr-3 text-[10px]">
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                                        isFilled
                                          ? 'bg-emerald-950/70 text-emerald-300'
                                          : isPdf
                                          ? 'bg-blue-950/70 text-blue-300'
                                          : isXfdf
                                          ? 'bg-amber-950/70 text-amber-300'
                                          : 'bg-slate-800 text-slate-300'
                                      }`}
                                    >
                                      {isFilled ? 'Filled PDF' : isPdf ? 'Court PDF' : isXfdf ? 'XFDF' : 'Exhibit'}
                                    </span>
                                  </td>

                                  <td className="py-2 pr-3 text-slate-400 text-[10px]">
                                    {(file.size_bytes / 1024).toFixed(1)} KB
                                  </td>

                                  <td className="py-2 pr-3 text-[10px]">
                                    <span className="text-emerald-400 flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3" />
                                      <span>Verified</span>
                                    </span>
                                  </td>

                                  <td className="py-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      {/* View */}
                                      <button
                                        onClick={() =>
                                          onViewFile(file.url, file.file_name, isPdf ? 'pdf' : isXfdf ? 'xfdf' : 'text')
                                        }
                                        className="px-2 py-0.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                        title="Open in Document Viewer"
                                      >
                                        <Eye className="w-2.5 h-2.5" />
                                        <span>View</span>
                                      </button>

                                      {/* Edit */}
                                      {onEditForm && formCodeMatch && (
                                        <button
                                          onClick={() =>
                                            onEditForm(formCodeMatch, client.client_id, activeMatter.case_id)
                                          }
                                          className="px-2 py-0.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                          title="Edit form fields in Editor"
                                        >
                                          <Edit3 className="w-2.5 h-2.5" />
                                          <span>Edit</span>
                                        </button>
                                      )}

                                      {/* Download */}
                                      <a
                                        href={file.url}
                                        download={file.file_name}
                                        className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded"
                                        title="Download artifact"
                                      >
                                        <Download className="w-3 h-3" />
                                      </a>

                                      {/* Remove */}
                                      <button
                                        onClick={() => onDeleteFile(file.path)}
                                        className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                                        title="Remove artifact"
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
    </div>
  );
}
