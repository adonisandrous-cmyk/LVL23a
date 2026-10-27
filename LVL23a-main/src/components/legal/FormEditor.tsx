import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Edit3,
  Save,
  Play,
  FileCheck,
  FileText,
  User,
  Briefcase,
  Layers,
  Code,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Share2,
  Sparkles
} from 'lucide-react';

interface FormEditorProps {
  initialFormName?: string;
  initialClientId?: number;
  initialCaseId?: number;
  onOpenViewer?: (url: string, fileName: string, type: 'pdf' | 'xfdf' | 'json' | 'text') => void;
  onOpenRouter?: () => void;
}

export default function FormEditor({
  initialFormName = 'FL-120',
  initialClientId = 1,
  initialCaseId = 1,
  onOpenViewer,
  onOpenRouter
}: FormEditorProps) {
  const [editorSubTab, setEditorSubTab] = useState<'fields' | 'mapping' | 'dossier'>('fields');

  // Relational options
  const [clients, setClients] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);

  // Selected values
  const [selectedForm, setSelectedForm] = useState<string>(initialFormName);
  const [selectedClientId, setSelectedClientId] = useState<number>(initialClientId);
  const [selectedCaseId, setSelectedCaseId] = useState<number>(initialCaseId);

  // Field Values state (Form Field Filler)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    client_first_name: '',
    client_last_name: '',
    client_DOB: '',
    client_phone: '',
    client_email: '',
    client_address: '',
    client_A_number: '',
    client_ssn: '',
    case_number: '',
    case_type: '',
    court_name: '',
    judge_name: ''
  });

  // Custom ad-hoc fields added by attorney
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);
  const [newCustomKey, setNewCustomKey] = useState<string>('');
  const [newCustomVal, setNewCustomVal] = useState<string>('');

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationResult, setGenerationResult] = useState<any | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Mapping Editor State
  const [mappingData, setMappingData] = useState<any>({ template: '', fields: {} });
  const [mappingJsonText, setMappingJsonText] = useState<string>('');
  const [mappingMode, setMappingMode] = useState<'table' | 'json'>('table');
  const [isSavingMapping, setIsSavingMapping] = useState<boolean>(false);
  const [mappingSaveSuccess, setMappingSaveSuccess] = useState<boolean>(false);

  // Client & Matter Dossier Editor State
  const [clientEditData, setClientEditData] = useState<any>({});
  const [caseEditData, setCaseEditData] = useState<any>({});
  const [isSavingDossier, setIsSavingDossier] = useState<boolean>(false);
  const [dossierSaveSuccess, setDossierSaveSuccess] = useState<boolean>(false);

  // Initial data fetch
  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        const [cRes, csRes, fRes] = await Promise.all([
          fetch('/api/v1/clients').then((r) => r.json()),
          fetch('/api/v1/cases').then((r) => r.json()),
          fetch('/api/v1/forms').then((r) => r.json())
        ]);

        if (cRes.success) setClients(cRes.data);
        if (csRes.success) setCases(csRes.data);
        if (fRes.success) setForms(fRes.data);
      } catch (err) {
        console.error('Error fetching editor prerequisites:', err);
      }
    };
    fetchPrerequisites();
  }, []);

  // Sync field values whenever client or case changes
  useEffect(() => {
    const client = clients.find((c) => c.id === selectedClientId);
    const cCase = cases.find((c) => c.id === selectedCaseId);

    if (client && cCase) {
      setFieldValues((prev) => ({
        ...prev,
        client_first_name: client.first_name || '',
        client_last_name: client.last_name || '',
        client_DOB: client.dob || '',
        client_phone: client.phone || '',
        client_email: client.email || '',
        client_address: `${client.address_line1 || ''} ${client.city || ''} ${client.state || ''} ${client.zip || ''}`.trim(),
        client_A_number: client.a_number || '',
        client_ssn: client.ssn || '',
        case_number: cCase.case_number || '',
        case_type: cCase.case_type || '',
        court_name: cCase.court_name || '',
        judge_name: cCase.judge_name || ''
      }));

      setClientEditData({ ...client });
      setCaseEditData({ ...cCase });
    }
  }, [selectedClientId, selectedCaseId, clients, cases]);

  // Load Mapping JSON whenever form changes
  useEffect(() => {
    const loadMapping = async () => {
      try {
        const res = await fetch(`/api/v1/forms/${selectedForm}/mapping`);
        const json = await res.json();
        if (json.success && json.data) {
          setMappingData(json.data);
          setMappingJsonText(JSON.stringify(json.data, null, 2));
        }
      } catch (err) {
        console.error('Error loading mapping:', err);
      }
    };
    if (selectedForm) {
      loadMapping();
    }
  }, [selectedForm]);

  const handleFieldChange = (key: string, val: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [key]: val
    }));
  };

  const handleAddCustomField = () => {
    if (!newCustomKey.trim()) return;
    setCustomFields((prev) => [...prev, { key: newCustomKey.trim(), value: newCustomVal.trim() }]);
    setFieldValues((prev) => ({
      ...prev,
      [newCustomKey.trim()]: newCustomVal.trim()
    }));
    setNewCustomKey('');
    setNewCustomVal('');
  };

  const handleRemoveCustomField = (index: number) => {
    const target = customFields[index];
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
    setFieldValues((prev) => {
      const copy = { ...prev };
      delete copy[target.key];
      return copy;
    });
  };

  // Live Re-generate Form & PDF
  const handleLiveReGenerate = async () => {
    try {
      setIsGenerating(true);
      setGenError(null);
      setGenerationResult(null);

      // Merge standard field values + custom fields
      const overrideFields = { ...fieldValues };
      customFields.forEach((cf) => {
        overrideFields[cf.key] = cf.value;
      });

      const res = await fetch('/api/v1/generate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_name: selectedForm,
          client_id: selectedClientId,
          case_id: selectedCaseId,
          override_fields: overrideFields
        })
      });

      const json = await res.json();
      if (json.status === 'success') {
        setGenerationResult(json);
      } else {
        setGenError(json.error || 'Failed to generate custom form.');
      }
    } catch (err: any) {
      setGenError(err.message || 'Generation network failure.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Mapping
  const handleSaveMapping = async () => {
    try {
      setIsSavingMapping(true);
      let payload = mappingData;
      if (mappingMode === 'json') {
        payload = JSON.parse(mappingJsonText);
        setMappingData(payload);
      }

      const res = await fetch(`/api/v1/forms/${selectedForm}/mapping`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping_data: payload })
      });
      const json = await res.json();
      if (json.success) {
        setMappingSaveSuccess(true);
        setTimeout(() => setMappingSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Save mapping error:', err);
    } finally {
      setIsSavingMapping(false);
    }
  };

  // Save Client & Matter Dossier changes directly to DB
  const handleSaveDossier = async () => {
    try {
      setIsSavingDossier(true);
      const [cRes, csRes] = await Promise.all([
        fetch(`/api/v1/clients/${selectedClientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientEditData)
        }),
        fetch(`/api/v1/cases/${selectedCaseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(caseEditData)
        })
      ]);

      if (cRes.ok && csRes.ok) {
        setDossierSaveSuccess(true);
        setTimeout(() => setDossierSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Save dossier error:', err);
    } finally {
      setIsSavingDossier(false);
    }
  };

  // Available client cases
  const availableCasesForClient = cases.filter((c) => c.client_id === selectedClientId);

  return (
    <div className="bg-[#090f1d] border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-6 p-6">
      {/* Top Banner */}
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center gap-2">
              <span>Court Form Field & Mapping Editor</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Live Re-Generation
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Modify form fields, declarative mappings, and matter intake. Real-time compilation into W3C XFDF and official court PDF.
            </p>
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center bg-[#070b14] border border-slate-800 rounded-lg p-1 font-mono text-xs">
          <button
            onClick={() => setEditorSubTab('fields')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              editorSubTab === 'fields'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-indigo-300" />
            <span>Form Field Values</span>
          </button>

          <button
            onClick={() => setEditorSubTab('mapping')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              editorSubTab === 'mapping'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-300" />
            <span>Mapping JSON</span>
          </button>

          <button
            onClick={() => setEditorSubTab('dossier')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              editorSubTab === 'dossier'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-300" />
            <span>Client & Matter</span>
          </button>
        </div>
      </div>

      {/* Primary Pickers: Form, Client, Case */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#070b14] border border-slate-800 p-4 rounded-xl font-mono text-xs">
        <div>
          <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Court Form:</span>
          </label>
          <select
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
            className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
          >
            {forms.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name} — {f.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Client:</span>
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              const newId = parseInt(e.target.value, 10);
              setSelectedClientId(newId);
              const targetCases = cases.filter((c) => c.client_id === newId);
              if (targetCases.length > 0) {
                setSelectedCaseId(targetCases[0].id);
              }
            }}
            className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name} (ID: #{c.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span>Matter / Docket:</span>
          </label>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(parseInt(e.target.value, 10))}
            className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
          >
            {availableCasesForClient.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} — {c.case_type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. FORM FIELD VALUES & LIVE RE-GENERATOR SUB-TAB */}
      {/* ------------------------------------------------------------- */}
      {editorSubTab === 'fields' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-lg font-mono text-xs">
            <div>
              <span className="text-white font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Active Form Template: {selectedForm}.pdf</span>
              </span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Edit field values below. Click &quot;Save & Live Re-Generate Form&quot; to compile new XFDF and flattened PDF into the client matter vault.
              </p>
            </div>

            <button
              onClick={handleLiveReGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-bold flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 text-indigo-200 fill-current" />
              )}
              <span>Save & Live Re-Generate Form</span>
            </button>
          </div>

          {/* Success Banner after generation */}
          {generationResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-950/60 border border-emerald-500/60 rounded-xl font-mono text-xs space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Court Form Re-Generated & Filed Successfully!</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                  {generationResult.field_count} fields populated
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 bg-[#070b14]/80 p-3 rounded-lg border border-emerald-900/40">
                <div>
                  <strong className="text-slate-400">Filled PDF:</strong>{' '}
                  <span className="text-emerald-400 break-all">{generationResult.filled_pdf_url}</span>
                </div>
                <div>
                  <strong className="text-slate-400">XFDF Payload:</strong>{' '}
                  <span className="text-amber-400 break-all">{generationResult.xfdf_url}</span>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <strong className="text-slate-400">Assigned Matter Vault:</strong>{' '}
                  <span className="text-cyan-300">{generationResult.matter_dir}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {onOpenViewer && (
                  <button
                    onClick={() =>
                      onOpenViewer(
                        generationResult.filled_pdf_url,
                        `${selectedForm}_Filled.pdf`,
                        'pdf'
                      )
                    }
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View in Document Viewer</span>
                  </button>
                )}

                <a
                  href={generationResult.filled_pdf_url}
                  download
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Filled PDF</span>
                </a>

                {onOpenRouter && (
                  <button
                    onClick={onOpenRouter}
                    className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Go to Client Matter Vault</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {genError && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-lg text-xs text-rose-300 font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{genError}</span>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="space-y-4 font-mono text-xs">
            {/* Section 1: Demographics */}
            <div className="bg-[#070b14] border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-cyan-400">
                <User className="w-3.5 h-3.5" />
                <span>1. Client Demographic Verification</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">First Name (client_first_name):</label>
                  <input
                    type="text"
                    value={fieldValues.client_first_name}
                    onChange={(e) => handleFieldChange('client_first_name', e.target.value)}
                    className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Last Name (client_last_name):</label>
                  <input
                    type="text"
                    value={fieldValues.client_last_name}
                    onChange={(e) => handleFieldChange('client_last_name', e.target.value)}
                    className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Date of Birth (client_DOB):</label>
                  <input
                    type="text"
                    value={fieldValues.client_DOB}
                    onChange={(e) => handleFieldChange('client_DOB', e.target.value)}
                    className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number (client_phone):</label>
                  <input
                    type="text"
                    value={fieldValues.client_phone}
                    onChange={(e) => handleFieldChange('client_phone', e.target.value)}
                    className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email Address (client_email):</label>
                  <input
                    type="text"
                    value={fieldValues.client_email}
                    onChange={(e) => handleFieldChange('client_email', e.target.value)}
                    className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Address & Identifiers */}
            <div className="bg-[#070b14] border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
                <Briefcase className="w-3.5 h-3.5" />
                <span>2. Address & Official Identifiers</span>
              </h3>
              <div>
                <label className="block text-slate-400 mb-1">Residential Address (client_address):</label>
                <input
                  type="text"
                  value={fieldValues.client_address}
                  onChange={(e) => handleFieldChange('client_address', e.target.value)}
                  className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 mb-1">Alien Registration Number (client_A_number):</label>
                  <input
                    type="text"
                    placeholder="e.g. A098765432"
                    value={fieldValues.client_A_number}
                    onChange={(e) => handleFieldChange('client_A_number', e.target.value)}
                    className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Social Security / Tax ID (client_ssn):</label>
                  <input
                    type="text"
                    placeholder="e.g. 123-45-6789"
                    value={fieldValues.client_ssn}
                    onChange={(e) => handleFieldChange('client_ssn', e.target.value)}
                    className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Matter & Docket Details */}
            <div className="bg-[#070b14] border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-purple-400">
                <FileCheck className="w-3.5 h-3.5" />
                <span>3. Case / Matter Docket & Court Information</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Docket / Case Number (case_number):</label>
                  <input
                    type="text"
                    value={fieldValues.case_number}
                    onChange={(e) => handleFieldChange('case_number', e.target.value)}
                    className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none font-bold text-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Practice Area / Type (case_type):</label>
                  <input
                    type="text"
                    value={fieldValues.case_type}
                    onChange={(e) => handleFieldChange('case_type', e.target.value)}
                    className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 mb-1">Court Name (court_name):</label>
                  <input
                    type="text"
                    value={fieldValues.court_name}
                    onChange={(e) => handleFieldChange('court_name', e.target.value)}
                    className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Presiding Judge (judge_name):</label>
                  <input
                    type="text"
                    value={fieldValues.judge_name}
                    onChange={(e) => handleFieldChange('judge_name', e.target.value)}
                    className="w-full p-2 bg-[#090f1d] border border-slate-700 rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Custom Ad-Hoc Fields */}
            <div className="bg-[#070b14] border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                  <Plus className="w-3.5 h-3.5" />
                  <span>4. Custom Form Fields & Overrides</span>
                </h3>
                <span className="text-[10px] text-slate-500">
                  Attorney ad-hoc fields for this filing
                </span>
              </div>

              {customFields.length > 0 && (
                <div className="space-y-2">
                  {customFields.map((cf, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cf.key}
                        disabled
                        className="w-1/3 p-1.5 bg-[#090f1d] border border-slate-700 rounded text-slate-300 font-mono text-xs"
                      />
                      <input
                        type="text"
                        value={cf.value}
                        onChange={(e) => {
                          const updated = [...customFields];
                          updated[idx].value = e.target.value;
                          setCustomFields(updated);
                          setFieldValues((prev) => ({
                            ...prev,
                            [cf.key]: e.target.value
                          }));
                        }}
                        className="flex-1 p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                      />
                      <button
                        onClick={() => handleRemoveCustomField(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                        title="Remove custom field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Field Key (e.g. HearingDate)"
                  value={newCustomKey}
                  onChange={(e) => setNewCustomKey(e.target.value)}
                  className="w-1/3 p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs placeholder-slate-600"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 10/24/2026 Dept 4)"
                  value={newCustomVal}
                  onChange={(e) => setNewCustomVal(e.target.value)}
                  className="flex-1 p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs placeholder-slate-600"
                />
                <button
                  onClick={handleAddCustomField}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold cursor-pointer"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. DECLARATIVE MAPPING CONFIGURATION SUB-TAB */}
      {/* ------------------------------------------------------------- */}
      {editorSubTab === 'mapping' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg">
            <div>
              <span className="text-white font-bold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Declarative Mapping: forms/{selectedForm}.mapping.json</span>
              </span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Maps Universal Database attributes directly to official court PDF form field tags.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMappingMode(mappingMode === 'table' ? 'json' : 'table')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold cursor-pointer"
              >
                {mappingMode === 'table' ? 'Switch to Code Editor' : 'Switch to Table'}
              </button>
              <button
                onClick={handleSaveMapping}
                disabled={isSavingMapping}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
              >
                {isSavingMapping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Mapping</span>
              </button>
            </div>
          </div>

          {mappingSaveSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Mapping configuration updated on disk and database synchronized!</span>
            </div>
          )}

          {mappingMode === 'table' ? (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#070b14]">
              <table className="w-full text-left">
                <thead className="bg-[#090f1d] text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Universal Database Key</th>
                    <th className="p-3">Official Court PDF Field Tag</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {Object.entries(mappingData.fields || {}).map(([uKey, pField]: [string, any]) => (
                    <tr key={uKey} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-bold text-cyan-300">{uKey}</td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={pField}
                          onChange={(e) => {
                            const updated = {
                              ...mappingData,
                              fields: {
                                ...mappingData.fields,
                                [uKey]: e.target.value
                              }
                            };
                            setMappingData(updated);
                            setMappingJsonText(JSON.stringify(updated, null, 2));
                          }}
                          className="w-full max-w-sm p-1.5 bg-[#090f1d] border border-slate-700 rounded text-emerald-300 font-mono text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            const copy = { ...mappingData.fields };
                            delete copy[uKey];
                            const updated = { ...mappingData, fields: copy };
                            setMappingData(updated);
                            setMappingJsonText(JSON.stringify(updated, null, 2));
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <textarea
              rows={16}
              value={mappingJsonText}
              onChange={(e) => setMappingJsonText(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono text-xs focus:border-amber-500 focus:outline-none"
            />
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. CLIENT & MATTER DOSSIER EDITOR SUB-TAB */}
      {/* ------------------------------------------------------------- */}
      {editorSubTab === 'dossier' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg">
            <div>
              <span className="text-white font-bold flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Client & Case Relational Database Records</span>
              </span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Directly updates the core PostgreSQL/SQLite tables (clients and cases).
              </p>
            </div>

            <button
              onClick={handleSaveDossier}
              disabled={isSavingDossier}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
            >
              {isSavingDossier ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Database Records</span>
            </button>
          </div>

          {dossierSaveSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Client and Case records successfully updated in the database!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Record Box */}
            <div className="bg-[#070b14] border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2 flex items-center gap-1.5 text-cyan-400">
                <User className="w-3.5 h-3.5" />
                <span>Client Table (ID: #{selectedClientId})</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">First Name:</label>
                  <input
                    type="text"
                    value={clientEditData.first_name || ''}
                    onChange={(e) => setClientEditData({ ...clientEditData, first_name: e.target.value })}
                    className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Last Name:</label>
                  <input
                    type="text"
                    value={clientEditData.last_name || ''}
                    onChange={(e) => setClientEditData({ ...clientEditData, last_name: e.target.value })}
                    className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Street Address:</label>
                <input
                  type="text"
                  value={clientEditData.address_line1 || ''}
                  onChange={(e) => setClientEditData({ ...clientEditData, address_line1: e.target.value })}
                  className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">City:</label>
                  <input
                    type="text"
                    value={clientEditData.city || ''}
                    onChange={(e) => setClientEditData({ ...clientEditData, city: e.target.value })}
                    className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">State:</label>
                  <input
                    type="text"
                    value={clientEditData.state || ''}
                    onChange={(e) => setClientEditData({ ...clientEditData, state: e.target.value })}
                    className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Zip:</label>
                  <input
                    type="text"
                    value={clientEditData.zip || ''}
                    onChange={(e) => setClientEditData({ ...clientEditData, zip: e.target.value })}
                    className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">A-Number:</label>
                  <input
                    type="text"
                    value={clientEditData.a_number || ''}
                    onChange={(e) => setClientEditData({ ...clientEditData, a_number: e.target.value })}
                    className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">SSN:</label>
                  <input
                    type="text"
                    value={clientEditData.ssn || ''}
                    onChange={(e) => setClientEditData({ ...clientEditData, ssn: e.target.value })}
                    className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Case Record Box */}
            <div className="bg-[#070b14] border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2 flex items-center gap-1.5 text-amber-400">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Cases Table (Case ID: #{selectedCaseId})</span>
              </h4>

              <div>
                <label className="block text-slate-400 mb-1">Case / Docket Number:</label>
                <input
                  type="text"
                  value={caseEditData.case_number || ''}
                  onChange={(e) => setCaseEditData({ ...caseEditData, case_number: e.target.value })}
                  className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs font-bold text-amber-300"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Practice Area / Case Type:</label>
                <input
                  type="text"
                  value={caseEditData.case_type || ''}
                  onChange={(e) => setCaseEditData({ ...caseEditData, case_type: e.target.value })}
                  className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Court Name:</label>
                <input
                  type="text"
                  value={caseEditData.court_name || ''}
                  onChange={(e) => setCaseEditData({ ...caseEditData, court_name: e.target.value })}
                  className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Judge Name:</label>
                <input
                  type="text"
                  value={caseEditData.judge_name || ''}
                  onChange={(e) => setCaseEditData({ ...caseEditData, judge_name: e.target.value })}
                  className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Case Status:</label>
                <select
                  value={caseEditData.status || 'Open'}
                  onChange={(e) => setCaseEditData({ ...caseEditData, status: e.target.value })}
                  className="w-full p-1.5 bg-[#090f1d] border border-slate-700 rounded text-white font-mono text-xs"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Filed">Filed</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
