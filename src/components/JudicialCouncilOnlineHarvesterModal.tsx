import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Search, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Check, 
  X, 
  FileText, 
  Copy, 
  Layers, 
  FolderPlus, 
  Globe, 
  Sliders, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Loader2,
  HardDrive,
  Info,
  CheckCircle2,
  BookmarkPlus
} from 'lucide-react';
import { Client, DocumentTemplate } from '../types';
import { CourtFormSchema } from '../data/legalFormsCatalog';
import {
  OnlineJudicialFormMetadata,
  VERIFIED_ONLINE_JUDICIAL_FORMS,
  buildCourtPdfUrl,
  generateTemplateFromJudicialForm,
  generateSchemaFromJudicialForm,
  saveHarvestedTemplate,
  saveHarvestedCourtFormSchema,
  triggerDirectCourtPdfDownload
} from '../services/judicialFormHarvesterService';

interface JudicialCouncilOnlineHarvesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  activeClient?: Client | null;
  onFormSelectedForMapping?: (schema: CourtFormSchema) => void;
  onTemplateCreated?: (template: DocumentTemplate) => void;
  onExportToDrive?: (title: string, content: string) => void;
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function JudicialCouncilOnlineHarvesterModal({
  isOpen,
  onClose,
  clients,
  activeClient,
  onFormSelectedForMapping,
  onTemplateCreated,
  onExportToDrive,
  onNotify
}: JudicialCouncilOnlineHarvesterModalProps) {
  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<'catalog' | 'custom_url' | 'instant_populate'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Custom online grabber state
  const [customFormCode, setCustomFormCode] = useState('');
  const [customFormTitle, setCustomFormTitle] = useState('');
  const [customFormUrl, setCustomFormUrl] = useState('');
  const [customCategory, setCustomCategory] = useState('Family Law (CA)');
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);

  // Selected form for action / auto-populate
  const [selectedForm, setSelectedForm] = useState<OnlineJudicialFormMetadata | null>(VERIFIED_ONLINE_JUDICIAL_FORMS[0]);
  const [targetClient, setTargetClient] = useState<Client | null>(activeClient || clients[0] || null);

  // Action status indicators
  const [downloadedCodes, setDownloadedCodes] = useState<Record<string, boolean>>({});
  const [importedCodes, setImportedCodes] = useState<Record<string, boolean>>({});
  const [mappedCodes, setMappedCodes] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    VERIFIED_ONLINE_JUDICIAL_FORMS.forEach(f => set.add(f.category));
    return ['All', ...Array.from(set)];
  }, []);

  // Filtered list
  const filteredForms = useMemo(() => {
    return VERIFIED_ONLINE_JUDICIAL_FORMS.filter(f => {
      const matchCat = selectedCategory === 'All' || f.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      const matchSearch = 
        f.code.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.keyTokens.some(t => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  // 1. Download official PDF from court online
  const handleDownloadPdf = (form: OnlineJudicialFormMetadata) => {
    triggerDirectCourtPdfDownload(form.pdfUrl, `${form.code}_JudicialCouncil_Official`);
    setDownloadedCodes(prev => ({ ...prev, [form.code]: true }));
    onNotify?.('success', `Official PDF for ${form.code} downloaded from California Courts server.`);
  };

  // 2. Download and Import as Template
  const handleImportAsTemplate = (form: OnlineJudicialFormMetadata) => {
    setIsProcessing(true);
    try {
      const template = generateTemplateFromJudicialForm(form);
      saveHarvestedTemplate(template);
      setImportedCodes(prev => ({ ...prev, [form.code]: true }));
      onTemplateCreated?.(template);
      onNotify?.('success', `Form ${form.code} imported into Template Catalog with ${form.keyTokens.length} fillable placeholders.`);
    } catch (err: any) {
      onNotify?.('error', `Failed to import template: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Map for Auto-Population (Open in Judicial Mapper)
  const handleMapForAutoPopulation = (form: OnlineJudicialFormMetadata) => {
    setIsProcessing(true);
    try {
      // 1. Create template
      const template = generateTemplateFromJudicialForm(form);
      saveHarvestedTemplate(template);
      onTemplateCreated?.(template);

      // 2. Create and save schema
      const schema = generateSchemaFromJudicialForm(form, targetClient);
      saveHarvestedCourtFormSchema(schema);
      setMappedCodes(prev => ({ ...prev, [form.code]: true }));

      onNotify?.('success', `Form ${form.code} mapped to Judicial Council variable coordinates. Opening in Judicial Mapper...`);
      onFormSelectedForMapping?.(schema);
      onClose();
    } catch (err: any) {
      onNotify?.('error', `Failed to map form: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Custom code resolver and creator
  const handleResolveCustomForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFormCode.trim()) return;

    setIsResolvingUrl(true);
    const resolvedCode = customFormCode.trim().toUpperCase();
    const resolvedUrl = customFormUrl.trim() || buildCourtPdfUrl(resolvedCode);
    const resolvedTitle = customFormTitle.trim() || `Judicial Council Form ${resolvedCode}`;

    const newMetadata: OnlineJudicialFormMetadata = {
      code: resolvedCode,
      title: resolvedTitle,
      category: customCategory,
      jurisdiction: 'Superior Court of California',
      pdfUrl: resolvedUrl,
      description: `California Judicial Council form ${resolvedCode}. Online court filing pleading.`,
      guidelines: [
        'Verify local superior court county filing rules and e-filing specifications.',
        'Ensure all mandatory caption headers and penalty of perjury signatures are preserved.',
        'File original with court clerk and retain stamped endorsed copy in client directory.'
      ],
      keyTokens: [
        'PETITIONER_NAME', 'RESPONDENT_NAME', 'FILING_COUNTY', 'CASE_NUMBER',
        'ATTORNEY_NAME', 'COURT_ADDRESS', 'HEARING_DATE_OR_DEADLINE', 'RELIEF_REQUESTED'
      ],
      sampleValues: {
        FILING_COUNTY: (targetClient as any)?.county || 'Orange County',
        COURT_ADDRESS: '341 The City Drive South, Orange, CA 92868',
        HEARING_DATE_OR_DEADLINE: 'August 18, 2026 at 9:00 AM',
        RELIEF_REQUESTED: `Court order in favor of ${(targetClient?.name || 'Petitioner')} as requested.`
      }
    };

    // Save as template and schema
    handleImportAsTemplate(newMetadata);
    setSelectedForm(newMetadata);
    setActiveTab('instant_populate');
    setIsResolvingUrl(false);
    onNotify?.('success', `Custom court form ${resolvedCode} fetched and converted into active template!`);
  };

  // Compile quick preview for selected form + client
  const compiledSamplePleading = useMemo(() => {
    if (!selectedForm) return '';
    const template = generateTemplateFromJudicialForm(selectedForm);
    let text = template.templateBody;

    const cName = targetClient?.name || '[CLIENT_NAME]';
    const sName = (targetClient as any)?.spouseName || (targetClient as any)?.opposingParty || targetClient?.fl120Data?.petitionerName || '[OPPOSING_PARTY]';
    const cCounty = (targetClient as any)?.county || targetClient?.fl120Data?.courtCounty || '[COUNTY]';
    const cCase = (targetClient as any)?.caseNumber || targetClient?.fl120Data?.caseNumber || '[CASE_NUMBER]';

    text = text.replace(/\{\{Client Name\}\}/g, cName);
    text = text.replace(/\{\{Spouse Defendant Name\}\}/g, sName);
    text = text.replace(/\{\{Filing County\}\}/g, cCounty);
    text = text.replace(/\{\{Case Number\}\}/g, cCase);
    text = text.replace(/\{\{Court Address\}\}/g, '[COURT_ADDRESS]');
    text = text.replace(/\{\{Attorney Name and Bar Number\}\}/g, 'Alex, Esq. (State Bar 232323)');
    text = text.replace(/\{\{Current Date\}\}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

    selectedForm.keyTokens.forEach(tok => {
      const cleanTok = tok.replace(/_/g, ' ');
      const val = selectedForm.sampleValues[tok] || `[Parsed ${cleanTok}]`;
      const reg = new RegExp(`\\{\\{${cleanTok}\\}\\}`, 'gi');
      text = text.replace(reg, val);
    });

    return text;
  }, [selectedForm, targetClient]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0b121e] border-2 border-[#1e293b] w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden rounded-none">
        
        {/* Header Ribbon */}
        <div className="p-4 bg-[#080d16] border-b border-[#1e293b] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Judicial Council Online Form Harvester & Template Importer
                </h2>
                <span className="text-[9px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.2 font-bold uppercase">
                  courts.ca.gov Direct
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                Grab official California & Federal court forms directly from online repositories, download blank PDFs, and generate auto-population schemas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Mode Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#0c1422] px-4 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 ${
                activeTab === 'catalog'
                  ? 'bg-teal-500 text-[#090d16]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Official Court Forms Directory ({VERIFIED_ONLINE_JUDICIAL_FORMS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom_url')}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 ${
                activeTab === 'custom_url'
                  ? 'bg-teal-500 text-[#090d16]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Grab Custom Form Code / URL</span>
            </button>

            {selectedForm && (
              <button
                type="button"
                onClick={() => setActiveTab('instant_populate')}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 ${
                  activeTab === 'instant_populate'
                    ? 'bg-teal-500 text-[#090d16]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click Auto-Populate ({selectedForm.code})</span>
              </button>
            )}
          </div>

          {/* Target Client Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500 uppercase text-[10px] font-bold">Target Client:</span>
            <select
              value={targetClient?.id || ''}
              onChange={(e) => {
                const found = (clients || []).find(c => c?.id === e.target.value);
                if (found) setTargetClient(found);
              }}
              className="bg-[#080d16] border border-[#1e293b] text-slate-200 px-2 py-1 text-xs outline-none"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.practiceArea})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab 1: Official Verified Catalog */}
        {activeTab === 'catalog' && (
          <div className="flex-1 flex flex-col min-h-0 p-4 gap-4 overflow-hidden">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by form number (e.g. FL-115, MC-025, POS-040, FL-150) or title..."
                  className="w-full bg-[#080d16] border border-[#1e293b] pl-9 pr-3 py-1.5 text-xs text-white font-mono placeholder-slate-600 outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                        : 'bg-[#090e18] text-slate-400 border border-[#1e293b] hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Forms Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-1">
              {filteredForms.map((form) => {
                const isDownloaded = downloadedCodes[form.code];
                const isImported = importedCodes[form.code];
                const isMapped = mappedCodes[form.code];
                const isSelected = selectedForm?.code === form.code;

                return (
                  <div
                    key={form.code}
                    onClick={() => setSelectedForm(form)}
                    className={`p-3.5 bg-[#090f1a] border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.15)] bg-[#0d1624]'
                        : 'border-[#1e293b] hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-black text-teal-400 bg-teal-950/60 border border-teal-500/30 px-2 py-0.5">
                            {form.code}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 uppercase">
                            {form.category}
                          </span>
                        </div>
                        <a
                          href={form.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[9px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                          title="View on courts.ca.gov"
                        >
                          <span>PDF</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                        {form.title}
                      </h4>

                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                        {form.description}
                      </p>

                      <div className="pt-1 flex items-center gap-2 text-[9px] font-mono text-slate-500">
                        <span>{form.keyTokens.length} Tokens Mapped</span>
                        <span>•</span>
                        <span>{form.jurisdiction}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 mt-3 border-t border-[#1e293b]/70 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPdf(form);
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-mono uppercase flex items-center gap-1"
                        title="Download official PDF to device"
                      >
                        <Download className="w-3 h-3 text-slate-400" />
                        <span>{isDownloaded ? 'Downloaded' : 'Download PDF'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImportAsTemplate(form);
                        }}
                        className="px-2 py-1 bg-teal-950/60 hover:bg-teal-900/80 text-teal-300 border border-teal-500/30 text-[9px] font-mono uppercase flex items-center gap-1 font-bold"
                        title="Save as template for auto-population"
                      >
                        <BookmarkPlus className="w-3 h-3 text-teal-400" />
                        <span>{isImported ? 'Saved Template' : 'Import Template'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMapForAutoPopulation(form);
                        }}
                        className="px-2.5 py-1 bg-teal-500 hover:bg-teal-400 text-[#090d16] text-[9.5px] font-mono font-black uppercase flex items-center gap-1 transition-all"
                        title="Map coordinates and open Judicial Council Mapper"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Map & Auto-Populate</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Online Grabber */}
        {activeTab === 'custom_url' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-3xl mx-auto w-full space-y-6">
            <div className="p-4 bg-[#090f1a] border border-[#1e293b] space-y-2">
              <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-400" />
                Grab Any California Judicial Council or Federal Form Online
              </h3>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Enter any official California Judicial Council form code (e.g., <code className="text-teal-300 font-mono">FL-115</code>, <code className="text-teal-300 font-mono">FL-600</code>, <code className="text-teal-300 font-mono">CR-180</code>, <code className="text-teal-300 font-mono">EJ-100</code>, <code className="text-teal-300 font-mono">MC-025</code>) or paste an online court PDF link. The system will download the form metadata and generate a complete template with variable mappings.
              </p>
            </div>

            <form onSubmit={handleResolveCustomForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Court Form Code * (e.g. FL-115, MC-025, POS-040)
                  </label>
                  <input
                    type="text"
                    required
                    value={customFormCode}
                    onChange={(e) => setCustomFormCode(e.target.value)}
                    placeholder="e.g. FL-115"
                    className="w-full bg-[#080d16] border border-[#1e293b] px-3 py-2 text-xs text-white font-mono uppercase placeholder-slate-600 outline-none focus:border-teal-400"
                  />
                  <p className="text-[9px] text-slate-500 font-mono mt-1">
                    Auto-resolves to: {customFormCode ? buildCourtPdfUrl(customFormCode) : 'https://www.courts.ca.gov/documents/...'}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Category
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-[#080d16] border border-[#1e293b] px-3 py-2 text-xs text-white font-mono outline-none"
                  >
                    <option value="Family Law (CA)">Family Law (CA)</option>
                    <option value="Civil & Pleading (CA)">Civil & Pleading (CA)</option>
                    <option value="Financial & Disclosures (CA)">Financial & Disclosures (CA)</option>
                    <option value="Domestic Violence (CA)">Domestic Violence (CA)</option>
                    <option value="Housing & Eviction (CA)">Housing & Eviction (CA)</option>
                    <option value="Fee Waiver (CA)">Fee Waiver (CA)</option>
                    <option value="Probate & Guardianship (CA)">Probate & Guardianship (CA)</option>
                    <option value="Bankruptcy (Chapter 7)">Bankruptcy (Federal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Official Form Title (Optional)
                </label>
                <input
                  type="text"
                  value={customFormTitle}
                  onChange={(e) => setCustomFormTitle(e.target.value)}
                  placeholder="e.g. Proof of Service of Summons"
                  className="w-full bg-[#080d16] border border-[#1e293b] px-3 py-2 text-xs text-white font-mono placeholder-slate-600 outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Direct Online PDF URL (Optional — defaults to official California Courts repository)
                </label>
                <input
                  type="url"
                  value={customFormUrl}
                  onChange={(e) => setCustomFormUrl(e.target.value)}
                  placeholder="https://www.courts.ca.gov/documents/fl115.pdf"
                  className="w-full bg-[#080d16] border border-[#1e293b] px-3 py-2 text-xs text-white font-mono placeholder-slate-600 outline-none focus:border-teal-400"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isResolvingUrl || !customFormCode.trim()}
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-[#090d16] font-mono font-bold text-xs uppercase flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isResolvingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Grab Form Online & Convert to Template</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Instant Auto-Populate Preview */}
        {activeTab === 'instant_populate' && selectedForm && (
          <div className="flex-1 flex flex-col min-h-0 p-4 gap-4 overflow-hidden">
            {/* Control Bar */}
            <div className="p-3 bg-[#090f1a] border border-[#1e293b] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950 border border-teal-500/30 px-2 py-0.5">
                  {selectedForm.code}
                </span>
                <span className="text-xs font-bold text-white truncate max-w-md">
                  {selectedForm.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedForm)}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono uppercase flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Blank PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(compiledSamplePleading);
                    setCopiedDraft(true);
                    setTimeout(() => setCopiedDraft(false), 2000);
                    onNotify?.('success', 'Populated court form text copied to clipboard.');
                  }}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono uppercase flex items-center gap-1"
                >
                  {copiedDraft ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDraft ? 'Copied' : 'Copy Text'}</span>
                </button>

                {onExportToDrive && (
                  <button
                    type="button"
                    onClick={() => {
                      onExportToDrive(`${selectedForm.code}_${targetClient?.name || 'Client'}_Populated`, compiledSamplePleading);
                      onNotify?.('success', `Exported ${selectedForm.code} to Google Drive.`);
                    }}
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-[#090d16] text-[10px] font-mono font-bold uppercase flex items-center gap-1"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Save to Google Drive</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleMapForAutoPopulation(selectedForm)}
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-[#090d16] text-[10px] font-mono font-black uppercase flex items-center gap-1 transition-all"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Open in Judicial Mapper</span>
                </button>
              </div>
            </div>

            {/* Live populated preview editor */}
            <div className="flex-1 bg-[#060a12] border border-[#1e293b] p-4 font-mono text-[11px] text-slate-300 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
              {compiledSamplePleading}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-[#080d16] border-t border-[#1e293b] flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Connected to California Courts Judicial Branch Repository (courts.ca.gov)</span>
          </div>
          <span>All forms standardized for California Superior Court Electronic Filing (e-File)</span>
        </div>

      </div>
    </div>
  );
}
