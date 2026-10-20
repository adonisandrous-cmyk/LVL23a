import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  Scale,
  Sparkles,
  ArrowRight,
  RefreshCw,
  X,
  FileCheck,
  Building2,
  User,
  HardDrive,
  Sliders,
  Layers,
  Check,
  ChevronDown
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Client, Matter } from '../types';

export interface ExtractedFormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'unknown';
  mappedTo: string;
  confidence: 'exact' | 'high' | 'manual';
  sampleValue?: string;
}

export interface IngestedTemplateSummary {
  formCode: string;
  title: string;
  fileName: string;
  fieldCount: number;
  matterFolderPath: string;
  mappingPath: string;
  fileSize: number;
  timestamp: string;
}

export interface TemplateUploaderProps {
  clients: Client[];
  matters?: Matter[];
  activeMatterId?: string;
  activeClientId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onTemplateIngested?: (result: IngestedTemplateSummary) => void;
}

// Canonical Legal tech mapping keys based on the established 4-part schema
const CANONICAL_LEGAL_FIELDS: Array<{ key: string; label: string; group: string }> = [
  // Part 1: Personal (Self)
  { key: 'Client_FirstName', label: 'Client First Name', group: 'Part 1: Personal' },
  { key: 'Client_LastName', label: 'Client Last Name', group: 'Part 1: Personal' },
  { key: 'Client_DOB', label: 'Client Date of Birth', group: 'Part 1: Personal' },
  { key: 'Client_Address_Street', label: 'Client Street Address', group: 'Part 1: Personal' },
  { key: 'Client_Address_CityStateZip', label: 'Client City, State, ZIP', group: 'Part 1: Personal' },
  { key: 'Client_Phone', label: 'Client Phone Number', group: 'Part 1: Personal' },
  { key: 'Client_Email', label: 'Client Email Address', group: 'Part 1: Personal' },

  // Part 2: Opposing Party / Co-Parent
  { key: 'Other_FirstName', label: 'Opposing Party First Name', group: 'Part 2: Opposing' },
  { key: 'Other_LastName', label: 'Opposing Party Last Name', group: 'Part 2: Opposing' },
  { key: 'Other_Address_Street', label: 'Opposing Street Address', group: 'Part 2: Opposing' },
  { key: 'Other_Address_CityStateZip', label: 'Opposing City, State, ZIP', group: 'Part 2: Opposing' },
  { key: 'Other_Phone', label: 'Opposing Phone', group: 'Part 2: Opposing' },
  { key: 'Other_Email', label: 'Opposing Email', group: 'Part 2: Opposing' },

  // Part 3: Court Info
  { key: 'Court_Name', label: 'Court Name', group: 'Part 3: Court Info' },
  { key: 'Court_County', label: 'Court County / Jurisdiction', group: 'Part 3: Court Info' },
  { key: 'Court_CaseNumber', label: 'Case Number (Docket #)', group: 'Part 3: Court Info' },
  { key: 'Court_OpposingParty_FullName', label: 'Opposing Party Full Name', group: 'Part 3: Court Info' },
  { key: 'Court_HearingDates', label: 'Hearing Dates & Times', group: 'Part 3: Court Info' },
  { key: 'Court_JudgeName', label: "Judge's Name", group: 'Part 3: Court Info' },

  // Part 4: Incident & Relief
  { key: 'Case_AssistanceType', label: 'Type of Legal Assistance', group: 'Part 4: Relief' },
  { key: 'Case_IncidentDescription', label: 'What Happened / Pleading Narrative', group: 'Part 4: Relief' }
];

export const TemplateUploader: React.FC<TemplateUploaderProps> = ({
  clients,
  matters = [],
  activeMatterId,
  activeClientId,
  isOpen = true,
  onClose,
  onTemplateIngested
}) => {
  // Target Selection
  const [selectedClientId, setSelectedClientId] = useState<string>(activeClientId || clients[0]?.id || '');
  const [selectedMatterId, setSelectedMatterId] = useState<string>(activeMatterId || matters[0]?.id || 'MATTER-2026-001');

  // File & Ingestion state
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [formCodeOverride, setFormCodeOverride] = useState<string>('');
  const [detectedFields, setDetectedFields] = useState<ExtractedFormField[]>([]);
  const [completedIngestions, setCompletedIngestions] = useState<IngestedTemplateSummary[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Client & Matter Records for live field value preview
  const activeClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  const activeMatter = useMemo(() => {
    return matters.find(m => m.id === selectedMatterId) || matters[0] || null;
  }, [matters, selectedMatterId]);

  // Derive client record value for a canonical key
  const getMatterValueForCanonicalKey = (canonicalKey: string): string => {
    if (!activeClient && !activeMatter) return '';
    const flData = activeClient?.fl120Data;

    switch (canonicalKey) {
      case 'Client_FirstName':
        return activeClient?.name?.trim().split(/\s+/)[0] || '';
      case 'Client_LastName': {
        const parts = activeClient?.name?.trim().split(/\s+/) || [];
        return parts.length > 1 ? parts.slice(1).join(' ') : (activeClient?.name || '');
      }
      case 'Client_Phone':
        return activeClient?.phone || '';
      case 'Client_Email':
        return activeClient?.email || '';
      case 'Client_Address_Street':
        return '742 Evergreen Terrace';
      case 'Client_Address_CityStateZip':
        return 'San Francisco, CA 94107';
      case 'Court_CaseNumber':
        return activeMatter?.caseNumber || flData?.caseNumber || 'FDI-24-789012';
      case 'Court_County':
        return activeMatter?.courtVenue || flData?.courtCounty || 'San Francisco';
      case 'Court_OpposingParty_FullName':
        return flData?.petitionerName || '';
      case 'Court_JudgeName':
        return 'Hon. Katherine Feinstein';
      case 'Court_HearingDates':
        return 'November 14, 2026 at 9:00 AM, Dept 403';
      case 'Case_AssistanceType':
        return activeMatter?.practiceArea || 'Family Law - Dissolution';
      default:
        return '';
    }
  };

  // Heuristic matching linking AcroForm name to canonical key
  const matchAcroFormKeyToCanonical = (fieldName: string): { key: string; confidence: 'exact' | 'high' | 'manual' } => {
    const lower = fieldName.toLowerCase();

    if (lower.includes('casenumber') || lower.includes('case_no') || lower.includes('docket')) {
      return { key: 'Court_CaseNumber', confidence: 'exact' };
    }
    if (lower.includes('courtcounty') || lower.includes('crtcounty') || lower.includes('county')) {
      return { key: 'Court_County', confidence: 'exact' };
    }
    if (lower.includes('petitioner') || lower.includes('party1') || lower.includes('plaintiff')) {
      return { key: 'Court_OpposingParty_FullName', confidence: 'high' };
    }
    if (lower.includes('attyname') || lower.includes('attorney') || lower.includes('declarantname')) {
      return { key: 'Client_LastName', confidence: 'high' };
    }
    if (lower.includes('phone') || lower.includes('telephone')) {
      return { key: 'Client_Phone', confidence: 'exact' };
    }
    if (lower.includes('email')) {
      return { key: 'Client_Email', confidence: 'exact' };
    }
    if (lower.includes('street') || lower.includes('address')) {
      return { key: 'Client_Address_Street', confidence: 'high' };
    }
    if (lower.includes('city') || lower.includes('zip') || lower.includes('state')) {
      return { key: 'Client_Address_CityStateZip', confidence: 'high' };
    }
    if (lower.includes('judge')) {
      return { key: 'Court_JudgeName', confidence: 'exact' };
    }
    if (lower.includes('hearing') || lower.includes('date')) {
      return { key: 'Court_HearingDates', confidence: 'high' };
    }

    return { key: '', confidence: 'manual' };
  };

  // Handle incoming files
  const handleFilesSelected = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => 
      f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.docx')
    );

    if (validFiles.length === 0) {
      setErrorNotice('Please select valid .pdf or .docx legal template files.');
      return;
    }

    setQueuedFiles(prev => [...prev, ...validFiles]);
    setErrorNotice(null);

    // Automatically inspect the first file
    if (validFiles.length > 0) {
      inspectPdfTemplate(validFiles[0]);
    }
  };

  // Inspect and parse PDF AcroForm fields
  const inspectPdfTemplate = async (file: File) => {
    setIsParsing(true);
    setErrorNotice(null);

    // Auto-detect Judicial Council code (e.g. FL-150, FL-320)
    const match = file.name.match(/(FL|FW|DV|JV|MC|SUM|POS)-?\s*(\d+)/i);
    const detectedCode = match ? `${match[1].toUpperCase()}-${match[2]}` : file.name.replace(/\.(pdf|docx)$/i, '');
    setFormCodeOverride(detectedCode);

    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const form = pdfDoc.getForm();
        const fields = form.getFields();

        const parsedFields: ExtractedFormField[] = fields.map((f: any) => {
          const name = f.getName();
          const constructorName = f.constructor?.name || '';
          let type: ExtractedFormField['type'] = 'text';
          if (constructorName.includes('CheckBox')) type = 'checkbox';
          else if (constructorName.includes('Radio')) type = 'radio';
          else if (constructorName.includes('Dropdown') || constructorName.includes('Option')) type = 'dropdown';

          const matchResult = matchAcroFormKeyToCanonical(name);
          const sampleVal = matchResult.key ? getMatterValueForCanonicalKey(matchResult.key) : '';

          return {
            name,
            type,
            mappedTo: matchResult.key,
            confidence: matchResult.confidence,
            sampleValue: sampleVal
          };
        });

        setDetectedFields(parsedFields);
      } else {
        // DOCX placeholder fields extraction
        setDetectedFields([
          { name: '{{CLIENT_NAME}}', type: 'text', mappedTo: 'Client_LastName', confidence: 'exact', sampleValue: '[CLIENT_NAME]' },
          { name: '{{CASE_NUMBER}}', type: 'text', mappedTo: 'Court_CaseNumber', confidence: 'exact', sampleValue: '[CASE_NUMBER]' },
          { name: '{{COURT_COUNTY}}', type: 'text', mappedTo: 'Court_County', confidence: 'exact', sampleValue: '[COUNTY]' },
          { name: '{{OPPOSING_PARTY}}', type: 'text', mappedTo: 'Court_OpposingParty_FullName', confidence: 'exact', sampleValue: '[OPPOSING_PARTY]' }
        ]);
      }
    } catch (err: any) {
      console.warn('Direct client parsing error:', err);
      setErrorNotice(`Notice: Could not parse interactive AcroForms in ${file.name}. Server-side ingestion will process as static template.`);
    } finally {
      setIsParsing(false);
    }
  };

  // Update field mapping
  const handleFieldMappingChange = (index: number, newCanonicalKey: string) => {
    setDetectedFields(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        mappedTo: newCanonicalKey,
        confidence: 'manual',
        sampleValue: getMatterValueForCanonicalKey(newCanonicalKey)
      };
      return updated;
    });
  };

  // Upload and file to Cloud Run Matter Directory
  const handleIngestAndFileCurrent = async () => {
    if (queuedFiles.length === 0) return;
    const currentFile = queuedFiles[activeFileIndex];
    if (!currentFile) return;

    setIsUploading(true);
    setErrorNotice(null);

    const effectiveCode = formCodeOverride.trim() || currentFile.name.replace(/\.(pdf|docx)$/i, '');

    // Build declarative mapping dictionary
    const fieldMap: Record<string, string> = {};
    detectedFields.forEach(f => {
      if (f.mappedTo) {
        fieldMap[f.mappedTo] = f.name;
      }
    });

    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('matterId', selectedMatterId);
    formData.append('clientId', selectedClientId);
    formData.append('formCodeOverride', effectiveCode);
    formData.append('category', 'Family Law');
    formData.append('mappingsJson', JSON.stringify({
      form_id: effectiveCode,
      jurisdiction: 'California Judicial Council',
      title: currentFile.name.replace(/\.(pdf|docx)$/i, ''),
      matter_id: selectedMatterId,
      client_id: selectedClientId,
      mappings: fieldMap
    }));

    try {
      const res = await fetch('/api/templates/ingest', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server error ingesting template');
      }

      const summary: IngestedTemplateSummary = {
        formCode: data.formCode,
        title: currentFile.name.replace(/\.(pdf|docx)$/i, ''),
        fileName: currentFile.name,
        fieldCount: data.fieldCount || detectedFields.length,
        matterFolderPath: data.matterFolderPath,
        mappingPath: data.mappingPath,
        fileSize: currentFile.size,
        timestamp: new Date().toLocaleTimeString()
      };

      setCompletedIngestions(prev => [summary, ...prev]);
      setSuccessNotice(`Successfully ingested ${summary.formCode} into Cloud Run folder: ${summary.matterFolderPath}`);
      if (onTemplateIngested) {
        onTemplateIngested(summary);
      }

      // If more files exist in queue, advance
      if (activeFileIndex < queuedFiles.length - 1) {
        const nextIndex = activeFileIndex + 1;
        setActiveFileIndex(nextIndex);
        inspectPdfTemplate(queuedFiles[nextIndex]);
      }
    } catch (err: any) {
      console.error('Ingestion error:', err);
      setErrorNotice(err.message || 'Failed to file document into Cloud Storage folder.');
    } finally {
      setIsUploading(false);
    }
  };

  // Ingest all queued files sequentially (Batch Mode)
  const handleBatchIngestAll = async () => {
    if (queuedFiles.length === 0) return;
    setIsUploading(true);
    setErrorNotice(null);

    for (let i = 0; i < queuedFiles.length; i++) {
      const file = queuedFiles[i];
      setActiveFileIndex(i);

      const match = file.name.match(/(FL|FW|DV|JV|MC|SUM|POS)-?\s*(\d+)/i);
      const code = match ? `${match[1].toUpperCase()}-${match[2]}` : file.name.replace(/\.(pdf|docx)$/i, '');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('matterId', selectedMatterId);
      formData.append('clientId', selectedClientId);
      formData.append('formCodeOverride', code);
      formData.append('category', 'Family Law');

      try {
        const res = await fetch('/api/templates/ingest', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          const summary: IngestedTemplateSummary = {
            formCode: data.formCode,
            title: file.name,
            fileName: file.name,
            fieldCount: data.fieldCount || 0,
            matterFolderPath: data.matterFolderPath,
            mappingPath: data.mappingPath,
            fileSize: file.size,
            timestamp: new Date().toLocaleTimeString()
          };
          setCompletedIngestions(prev => [summary, ...prev]);
          if (onTemplateIngested) onTemplateIngested(summary);
        }
      } catch (err) {
        console.warn(`Error ingesting ${file.name} in batch:`, err);
      }
    }

    setIsUploading(false);
    setSuccessNotice(`Batch filed ${queuedFiles.length} family law forms into Matter #${selectedMatterId} Cloud Storage.`);
  };

  if (!isOpen) return null;

  const currentFile = queuedFiles[activeFileIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        className="w-full max-w-6xl rounded-2xl bg-[#070b14] border border-slate-800 text-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Ribbon */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0c1324] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Template & Motion Ingestion Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Cloud Run Filer
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Parse AcroForms, map fields to Matter Record, and automatically file into Matter Folder on Cloud Run
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Uploader"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Matter & Target Selection Ribbon */}
        <div className="px-6 py-3 bg-[#050811] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Matter Selector */}
            <div className="flex items-center gap-1.5 bg-[#0a1020] px-3 py-1.5 rounded-xl border border-slate-800">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-400 font-mono">Target Matter:</span>
              <select
                value={selectedMatterId}
                onChange={(e) => setSelectedMatterId(e.target.value)}
                className="bg-transparent text-xs text-amber-300 font-bold focus:outline-none"
              >
                {matters.length > 0 ? (
                  matters.map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.title} ({m.caseNumber || m.id})
                    </option>
                  ))
                ) : (
                  <option value="MATTER-2026-001" className="bg-slate-900 text-white">
                    Matter #2026-001 (Dissolution of Marriage)
                  </option>
                )}
              </select>
            </div>

            {/* Client Selector */}
            <div className="flex items-center gap-1.5 bg-[#0a1020] px-3 py-1.5 rounded-xl border border-slate-800">
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[11px] text-slate-400 font-mono">Client:</span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-transparent text-xs text-teal-300 font-bold focus:outline-none"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cloud Run Destination Badge */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-500">Destination:</span>
            <code className="text-indigo-300 text-[11px]">/matters/{selectedMatterId}/templates/</code>
          </div>
        </div>

        {/* Notices */}
        {errorNotice && (
          <div className="bg-rose-950/70 border-b border-rose-500/40 px-6 py-2.5 text-xs text-rose-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button onClick={() => setErrorNotice(null)} className="text-rose-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successNotice && (
          <div className="bg-emerald-950/70 border-b border-emerald-500/40 px-6 py-2.5 text-xs text-emerald-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button onClick={() => setSuccessNotice(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dropzone Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-slate-700 hover:border-teal-500/60 rounded-2xl p-6 text-center cursor-pointer transition-all bg-[#050811]/60 hover:bg-slate-900/30 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Drop Family Law Forms (PDF / DOCX) or Click to Browse
            </h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Supports bulk upload (e.g. FL-110, FL-115, FL-130, FL-140, FL-142, FL-150, FL-160, FL-300, FL-320).
              Interactive AcroForm fields will be parsed and mapped automatically.
            </p>
          </div>

          {/* Queue & Active Template Inspector */}
          {queuedFiles.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Queued Files List */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Queued Documents ({queuedFiles.length})</span>
                  {queuedFiles.length > 1 && (
                    <button
                      onClick={handleBatchIngestAll}
                      disabled={isUploading}
                      className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 font-bold transition-colors cursor-pointer"
                    >
                      {isUploading ? 'Filing Batch...' : 'Batch File All'}
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
                  {queuedFiles.map((file, idx) => {
                    const isActive = idx === activeFileIndex;
                    const match = file.name.match(/(FL|FW|DV|JV|MC|SUM|POS)-?\s*(\d+)/i);
                    const code = match ? `${match[1].toUpperCase()}-${match[2]}` : 'FORM';

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setActiveFileIndex(idx);
                          inspectPdfTemplate(file);
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isActive
                            ? 'bg-teal-950/40 border-teal-500/50 text-white shadow-md'
                            : 'bg-[#0a0f1d] border-slate-800 text-slate-400 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                          <div className="min-w-0">
                            <span className="font-bold font-mono text-white block truncate">{file.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {(file.size / 1024).toFixed(1)} KB • Code: {code}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {code}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: AcroForm Inspector & Canonical Field Mapping */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                          {formCodeOverride || 'CUSTOM'}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate max-w-sm">
                          {currentFile?.name}
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                        {isParsing ? 'Parsing AcroForm tree...' : `${detectedFields.length} AcroForm fields extracted`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formCodeOverride}
                        onChange={(e) => setFormCodeOverride(e.target.value)}
                        placeholder="Form Code (e.g. FL-150)"
                        className="bg-[#050811] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                        title="Form Identifier Code"
                      />

                      <button
                        onClick={handleIngestAndFileCurrent}
                        disabled={isUploading || isParsing}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer disabled:opacity-50"
                      >
                        <FolderPlus className="w-4 h-4 text-slate-950" />
                        <span>{isUploading ? 'Filing...' : 'Ingest & File to Matter'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Mapping Grid Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Field Mapping Rules (AcroForm Target &rarr; Canonical Matter Key)</span>
                      <span className="text-teal-400 font-semibold">
                        {detectedFields.filter(f => f.mappedTo).length} / {detectedFields.length} Mapped
                      </span>
                    </div>

                    <div className="max-h-[38vh] overflow-y-auto border border-slate-800 rounded-xl bg-[#050811]">
                      {detectedFields.length > 0 ? (
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-[#0a0f1d] text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                            <tr>
                              <th className="p-2.5">PDF Field Path</th>
                              <th className="p-2.5">Type</th>
                              <th className="p-2.5">Target Matter Field</th>
                              <th className="p-2.5">Current Matter Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {detectedFields.map((field, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-2.5 text-slate-300 text-[11px] truncate max-w-[220px]" title={field.name}>
                                  {field.name}
                                </td>
                                <td className="p-2.5 text-[10px]">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                                    {field.type}
                                  </span>
                                </td>
                                <td className="p-2.5">
                                  <select
                                    value={field.mappedTo}
                                    onChange={(e) => handleFieldMappingChange(idx, e.target.value)}
                                    className="w-full bg-[#070b14] border border-slate-700 rounded px-2 py-1 text-[11px] text-amber-300 focus:outline-none focus:border-amber-400"
                                  >
                                    <option value="">-- Unmapped --</option>
                                    {CANONICAL_LEGAL_FIELDS.map(cf => (
                                      <option key={cf.key} value={cf.key}>
                                        {cf.key} ({cf.label})
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-2.5 text-[11px] text-emerald-400 truncate max-w-[200px]" title={field.sampleValue}>
                                  {field.sampleValue || <span className="text-slate-600 italic">None</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-8 text-center text-xs text-slate-500 font-mono">
                          {isParsing ? 'Inspecting document AcroForms...' : 'No form fields detected in document.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completed Ingestions History */}
          {completedIngestions.length > 0 && (
            <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Filed to Cloud Run Storage ({completedIngestions.length})</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {completedIngestions.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#050811] border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-mono">{item.formCode}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{item.timestamp}</span>
                    </div>
                    <div className="text-[10.5px] text-slate-400 truncate">{item.title}</div>
                    <div className="text-[10px] font-mono text-teal-400 bg-teal-950/40 p-1.5 rounded border border-teal-500/20 truncate">
                      {item.matterFolderPath}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0c1324] flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-400 font-mono">
            Pipeline Architecture: <span className="text-teal-400">Universal DB &rarr; Mapping JSON &rarr; XFDF Generator &rarr; Official Unaltered PDF</span>
          </div>

          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
