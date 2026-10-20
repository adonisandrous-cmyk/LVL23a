import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  Scale,
  FileText,
  BookOpen,
  Sliders,
  Globe,
  Download,
  ExternalLink,
  Lock,
  Check,
  Loader2,
  Building2,
  AlertCircle,
  FolderOpen,
  Info,
  Layers,
  Sparkles,
  Link2,
  Trash2,
  Copy,
  BookmarkPlus,
  CheckCircle2,
  Eye,
  EyeOff,
  Unlock
} from 'lucide-react';
import { Client, Matter } from '../types';
import { ALL_RESEARCH_COURT_FORMS, ResearchCourtForm as CourtForm } from '../data/legalFormsCatalog';
import { 
  saveHarvestedTemplate, 
  saveHarvestedCourtFormSchema, 
  triggerDirectCourtPdfDownload 
} from '../services/judicialFormHarvesterService';

interface ResearchPortalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  matters: Matter[];
}

export default function ResearchPortalDrawer({
  isOpen,
  onClose,
  clients,
  matters
}: ResearchPortalDrawerProps) {
  const [activeTab, setActiveTab] = useState<'forms' | 'courtlistener' | 'scholar' | 'justia' | 'findlaw'>('courtlistener');
  
  // -------------------------------------------------------------
  // Tab 1: Cal Court Forms States
  // -------------------------------------------------------------
  const [formSearch, setFormSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedForm, setSelectedForm] = useState<CourtForm | null>(null);
  const [prefilledData, setPrefilledData] = useState<any>(null);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [selectedClientForForm, setSelectedClientForForm] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Persisted Custom Court Forms State
  const [customForms, setCustomForms] = useState<CourtForm[]>(() => {
    const saved = localStorage.getItem('l23_custom_court_forms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Error loading custom forms from localStorage", e);
      }
    }
    return [];
  });

  // Dynamic custom CA form addition input states
  const [showAddCustomForm, setShowAddCustomForm] = useState(false);
  const [newFormCode, setNewFormCode] = useState('');
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormCategory, setNewFormCategory] = useState('Family Law');
  const [newFormUrl, setNewFormUrl] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const [newFormGuidelines, setNewFormGuidelines] = useState('');
  const [importedFormStatus, setImportedFormStatus] = useState<Record<string, string>>({});

  const handleImportFormAsTemplate = (form: CourtForm) => {
    try {
      const template = {
        id: `research-jc-${form.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: `CA ${form.code}: ${form.title}`,
        category: form.category || 'Family Law (CA)',
        description: `Official Judicial Council form ${form.code}. ${form.description}`,
        defaultQuestions: ['Client Name', 'Spouse Defendant Name', 'Filing County', 'Case Number', 'Relief Requested'],
        templateBody: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}
--------------------------------------------------------------------------------
PETITIONER / PLAINTIFF: {{Client Name}}
RESPONDENT / DEFENDANT: {{Spouse Defendant Name}}
CASE NUMBER: {{Case Number}}
ATTORNEY FOR: {{Attorney Name and Bar Number}}
COURT ADDRESS: {{Court Address}}
--------------------------------------------------------------------------------
FORM ${form.code.toUpperCase()}: ${form.title.toUpperCase()}
--------------------------------------------------------------------------------
PURPOSE: ${form.description}

1. RELIEF SOUGHT:
   {{Relief Requested}}

2. FACTUAL BASIS & STATUTORY GROUNDS:
   {{Factual Basis}}

I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct.

Date: {{Current Date}}
_____________________________________________
Signature of Declarant / Party
{{Client Name}}`
      };

      saveHarvestedTemplate(template);

      const targetClient = clients.find(c => c.id === selectedClientForForm) || clients[0];
      const schema = {
        id: `schema-${form.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        formNumber: form.code,
        formTitle: form.title,
        courtSystem: 'Superior Court of California',
        mappings: [
          { fieldName: 'ATTORNEY_OR_PARTY_WITHOUT_ATTORNEY', token: 'client.attorney', value: 'Alex, Esq. (State Bar 232323)', isRequired: true },
          { fieldName: 'SUPERIOR_COURT_OF_CALIFORNIA_COUNTY', token: 'client.county', value: (targetClient as any)?.county || 'ORANGE COUNTY', isRequired: true },
          { fieldName: 'PETITIONER_NAME', token: 'client.name', value: targetClient?.name || 'Jane Doe', isRequired: true },
          { fieldName: 'RESPONDENT_NAME', token: 'spouse_or_defendant', value: (targetClient as any)?.spouseName || 'John Doe', isRequired: true },
          { fieldName: 'CASE_NUMBER', token: 'client.caseNumber', value: (targetClient as any)?.caseNumber || 'FL-2026-99201', isRequired: true }
        ]
      };
      saveHarvestedCourtFormSchema(schema);

      setImportedFormStatus(prev => ({ ...prev, [form.code]: 'Template Saved & Mapped!' }));
      setTimeout(() => {
        setImportedFormStatus(prev => ({ ...prev, [form.code]: '' }));
      }, 3500);
    } catch (err: any) {
      alert('Failed to import template: ' + err.message);
    }
  };

  const defaultCourtForms: CourtForm[] = ALL_RESEARCH_COURT_FORMS;

  // Combined calCourtForms containing defaults & custom loaded items
  const calCourtForms: CourtForm[] = [...defaultCourtForms, ...customForms];

  // Filter forms
  const filteredForms = calCourtForms.filter(f => {
    const matchesSearch = f.code.toLowerCase().includes(formSearch.toLowerCase()) || 
                          f.title.toLowerCase().includes(formSearch.toLowerCase()) ||
                          f.description.toLowerCase().includes(formSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddCustomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormCode || !newFormTitle) return;

    const codeUpper = newFormCode.trim().toUpperCase();

    // Check if form with code already exists
    if (calCourtForms.some(f => f.code.toUpperCase() === codeUpper)) {
      alert(`A California court form with code "${codeUpper}" already exists!`);
      return;
    }

    const guidelinesArray = newFormGuidelines
      ? newFormGuidelines.split(/[\n,]+/).map(g => g.trim()).filter(Boolean)
      : [
          "Fill out all mandatory fields carefully.",
          "Check local Superior Court jurisdictional instructions for filing.",
          "Retain copies of filing receipts inside active user cases directory."
        ];

    const newForm: CourtForm = {
      code: codeUpper,
      title: newFormTitle.trim(),
      category: newFormCategory,
      pdfUrl: newFormUrl.trim() || "https://www.courts.ca.gov/forms.htm",
      description: newFormDescription.trim() || "Custom registered California Judicial Council form template.",
      guidelines: guidelinesArray
    };

    const updated = [...customForms, newForm];
    setCustomForms(updated);
    localStorage.setItem('l23_custom_court_forms', JSON.stringify(updated));

    // Clear and toggle
    setNewFormCode('');
    setNewFormTitle('');
    setNewFormUrl('');
    setNewFormDescription('');
    setNewFormGuidelines('');
    setShowAddCustomForm(false);
  };

  const handleDeleteCustomForm = (code: string) => {
    if (!confirm(`Are you sure you want to remove registered custom court form ${code}?`)) return;
    const updated = customForms.filter(f => f.code !== code);
    setCustomForms(updated);
    localStorage.setItem('l23_custom_court_forms', JSON.stringify(updated));
    if (selectedForm?.code === code) {
      setSelectedForm(null);
      setPrefilledData(null);
    }
  };

  const triggerAutofillSimulation = (form: CourtForm) => {
    if (!selectedClientForForm) return;
    setIsPrefilling(true);
    
    setTimeout(() => {
      const client = clients.find(c => c.id === selectedClientForForm);
      if (!client) return;

      const fl = (client as any).fl120Data;
      const notes = client.intakeNotes || "";

      // Extract client specific verified values
      let data: any = {
        clientName: client.name,
        clientPhone: client.phone || '',
        clientEmail: client.email || '',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        caseNumber: fl?.caseNumber || '',
        courtCounty: fl?.courtCounty || 'Superior Court of California, County of Orange',
        courtAddress: fl?.branchName || '',
      };

      if (form.code?.includes('120') || form.code === 'FL-100' || form.code?.toLowerCase().includes('response')) {
        const isResponse = form.code?.includes('120') || form.code?.toLowerCase().includes('response');
        data.petitionerName = fl?.petitionerName || '[PETITIONER_NAME]';
        data.respondentName = fl?.respondentName || client.name || '[RESPONDENT_NAME]';
        data.clientRole = isResponse ? 'Respondent' : 'Petitioner';
        data.jurisdictionalBasis = "California Family Code § 2320 (6 Months CA / 3 Months County verified)";
        data.countyFiling = fl?.courtCounty || "Superior Court of California";
        data.courtAddress = fl?.branchName || "";
        data.actionNature = `${fl?.proceedingType || 'Dissolution'} of Marriage (${fl?.legalGrounds || 'Irreconcilable Differences'})`;
        data.marriageDetails = `Date of Marriage: ${fl?.dateOfMarriage || '[MARRIAGE_DATE]'}. Date of Separation: ${fl?.dateOfSeparation || '[SEPARATION_DATE]'}.`;
        data.children = fl?.minorChildren && fl.minorChildren.length > 0
          ? fl.minorChildren.map((c: any) => `${c.name} (Born: ${c.birthdate}, Age ${c.age})`).join('; ') + '. UCCJEA FL-105 attached.'
          : "[MINOR_CHILDREN_LIST]";
        data.custodyRequested = `Legal: ${fl?.custodyLegal || 'Joint'} Custody. Physical: ${fl?.custodyPhysical || 'Joint'} Custody. Parenting Schedule: ${fl?.visitationRequested || 'Standard guideline schedule'}`;
        data.communalAssets = fl?.communityPropertyNotes || "[COMMUNITY_PROPERTY_SCHEDULE]";
        data.separateProperty = fl?.separatePropertyNotes || "[SEPARATE_PROPERTY_SCHEDULE]";
        data.spousalSupport = fl?.spousalSupportRequested === 'Reserve' 
          ? "Reserve jurisdiction over spousal support for Respondent; terminate authority to award to Petitioner (Fam. Code § 4336)."
          : "Subject to Fam. Code § 4320 statutory determination.";
      } else if (form.code === 'FL-105') {
        data.childrenDeclared = fl?.minorChildren && fl.minorChildren.length > 0
          ? fl.minorChildren.map((c: any) => `${c.name} (${c.birthdate})`).join(', ')
          : "[CHILDREN_DECLARED]";
        data.residenceHistory = "Continuous residence in California since birth with parents.";
        data.jurisdictionStatement = "California is the home state of the minor children under UCCJEA (Fam. Code § 3421).";
      } else if (form.code === 'FL-311') {
        data.parentingSchedule = fl?.visitationRequested || "Alternating parenting schedule.";
        data.holidaySchedule = "Alternating major national and religious holidays in odd/even years.";
        data.vacationSchedule = "Two (2) consecutive weeks of uninterrupted vacation time with 30-day advance written notice.";
      } else if (form.code === 'FL-150') {
        data.incomeEstimation = "Gross monthly income statements attached.";
        data.disputedCosts = "Mortgage, escrow, property taxes, and health coverage liabilities listed.";
      } else if (form.code === 'FL-160') {
        data.separatePropertyItems = fl?.separatePropertyNotes || "[SEPARATE_PROPERTY_ITEMS]";
        data.communityPropertyItems = fl?.communityPropertyNotes || "[COMMUNITY_PROPERTY_ITEMS]";
      } else {
        data.generalCase = `Matter referenced client file ${client.name} (Case No. ${fl?.caseNumber || '[CASE_NUMBER]'})`;
      }

      setPrefilledData(data);
      setIsPrefilling(false);
    }, 750);
  };

  // -------------------------------------------------------------
  // Tab 2: CourtListener States
  // -------------------------------------------------------------
  const [clQuery, setClQuery] = useState('');
  const [clType, setClType] = useState<'d' | 'f'>('d'); // 'd' docket, 'f' opinion
  const [clCourt, setClCourt] = useState('');
  const [clResults, setClResults] = useState<any[]>([]);
  const [isLoadingCl, setIsLoadingCl] = useState(false);
  const [clMessage, setClMessage] = useState('');
  const [isSimulatedData, setIsSimulatedData] = useState(true);
  const [selectedDocketDetail, setSelectedDocketDetail] = useState<any | null>(null);

  // AI-powered smart query formulation states
  const [aiSearchPrompt, setAiSearchPrompt] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [researchModel, setResearchModel] = useState<string>('default');

  // User manual token state
  const [customToken, setCustomToken] = useState(() => {
    return localStorage.getItem('courtlistener_user_token') || '';
  });
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [showCustomToken, setShowCustomToken] = useState(true);

  const handleSaveToken = () => {
    localStorage.setItem('courtlistener_user_token', customToken);
    setIsTokenSaved(true);
    setTimeout(() => setIsTokenSaved(false), 2000);
  };

  // User manual Apify state
  const [apifyTokenState, setApifyTokenState] = useState(() => {
    return localStorage.getItem('apify_user_token') || '';
  });
  const [isApifyTokenSaved, setIsApifyTokenSaved] = useState(false);
  const [showApifyToken, setShowApifyToken] = useState(true);

  const handleSaveApifyToken = () => {
    localStorage.setItem('apify_user_token', apifyTokenState);
    setIsApifyTokenSaved(true);
    setTimeout(() => setIsApifyTokenSaved(false), 2000);
  };

  const handleSearchCourtListener = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoadingCl(true);
    setClMessage('');
    setSelectedDocketDetail(null);

    try {
      const headers: any = {};
      const savedToken = localStorage.getItem('courtlistener_user_token');
      if (savedToken) {
        headers['x-courtlistener-token'] = savedToken;
      }
      const savedApifyToken = localStorage.getItem('apify_user_token');
      if (savedApifyToken) {
        headers['x-apify-token'] = savedApifyToken;
      }

      const response = await fetch(`/api/courtlistener/search?q=${encodeURIComponent(clQuery)}&type=${clType}&court=${encodeURIComponent(clCourt)}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Federated gateway returned status ${response.status}`);
      }

      const data = await response.json();
      setClResults(data.results || []);
      setIsSimulatedData(data.simulated || false);
      if (data.message) {
        setClMessage(data.message);
      }
    } catch (err: any) {
      console.error(err);
      setClMessage(`Search failed: ${err.message}. Showing local index backup.`);
    } finally {
      setIsLoadingCl(false);
    }
  };

  const handleAiFormulateSearch = async () => {
    if (!aiSearchPrompt.trim()) return;
    setIsAiSearching(true);
    setAiFeedback(null);
    try {
      const response = await fetch('/api/gemini/formulate-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          naturalQuery: aiSearchPrompt,
          currentCourt: clCourt,
          model: researchModel
        })
      });
      if (response.ok) {
        const data = await response.json();
        // Update states so user sees formulation in action!
        setClQuery(data.query || '');
        if (data.type === 'd' || data.type === 'f') {
          setClType(data.type);
        }
        if (data.court === 'ca' || data.court === 'nv' || data.court === 'cand' || data.court === 'cacd' || data.court === 'ca9' || data.court === '') {
          setClCourt(data.court);
        }
        setAiFeedback(data.explanation || 'Optimal search parameters selected and executed.');
        
        // Auto-run the search with formulated parameters!
        setTimeout(() => {
          const fetchFormulated = async () => {
            setIsLoadingCl(true);
            setClMessage('');
            setSelectedDocketDetail(null);
            try {
              const headers: any = {};
              const savedToken = localStorage.getItem('courtlistener_user_token');
              if (savedToken) headers['x-courtlistener-token'] = savedToken;
              const savedApifyToken = localStorage.getItem('apify_user_token');
              if (savedApifyToken) headers['x-apify-token'] = savedApifyToken;

              const clRes = await fetch(`/api/courtlistener/search?q=${encodeURIComponent(data.query || '')}&type=${data.type || 'd'}&court=${encodeURIComponent(data.court || '')}`, {
                headers
              });
              if (clRes.ok) {
                const searchData = await clRes.json();
                setClResults(searchData.results || []);
                setIsSimulatedData(searchData.simulated || false);
                if (searchData.message) {
                  setClMessage(searchData.message);
                }
              }
            } catch (err: any) {
              console.error(err);
            } finally {
              setIsLoadingCl(false);
            }
          };
          fetchFormulated();
        }, 150);

      } else {
        throw new Error('Server error formulating search query.');
      }
    } catch (err: any) {
      console.error(err);
      setAiFeedback(`Failed to connect to AI Search formulation. Error: ${err.message}`);
    } finally {
      setIsAiSearching(false);
    }
  };

  // Run initial search on mount (blank query returns our top-level high-fidelity legal cases)
  useEffect(() => {
    if (isOpen) {
      handleSearchCourtListener();
    }
  }, [isOpen]);

  // -------------------------------------------------------------
  // Tab 3: Google Scholar States
  // -------------------------------------------------------------
  const [scholarTopic, setScholarTopic] = useState('');
  const [scholarJurisdiction, setScholarJurisdiction] = useState('ca'); // ca or us
  const [scholarCitation, setScholarCitation] = useState('');
  const [scholarYear, setScholarYear] = useState('');

  const getGoogleScholarUrl = () => {
    let queryParts = [];
    if (scholarCitation) {
      queryParts.push(`"${scholarCitation}"`);
    } else {
      if (scholarTopic) queryParts.push(scholarTopic);
    }
    
    if (scholarYear) {
      queryParts.push(`y:${scholarYear}`);
    }

    const queryStr = encodeURIComponent(queryParts.join(' '));
    // Jurisdiction code filter 4 is typically CA State, 1 is Federal
    const courtFilter = scholarJurisdiction === 'ca' ? 'as_sdt=4' : 'as_sdt=6';
    return `https://scholar.google.com/scholar?q=${queryStr}&hl=en&${courtFilter}`;
  };

  // -------------------------------------------------------------
  // Tab 4: Justia States
  // -------------------------------------------------------------
  const [justiaQuery, setJustiaQuery] = useState('');
  const [justiaState, setJustiaState] = useState('california');
  const [justiaCategory, setJustiaCategory] = useState('family'); // family, bankruptcy, immigration, civil, custom
  const [customCategory, setCustomCategory] = useState('');

  const getJustiaUrl = () => {
    const activeCategory = justiaCategory === 'custom' ? customCategory : justiaCategory;
    const isBankruptcy = activeCategory?.toLowerCase() === 'bankruptcy';
    
    if (isBankruptcy) {
      const q = justiaQuery ? `bankruptcy ${justiaQuery}` : 'Chapter 7 Liquidation';
      return `https://law.justia.com/search?q=${encodeURIComponent(q)}`;
    }
    
    // Build combined search query supporting any category / subject
    let finalQuery = justiaQuery;
    if (activeCategory && activeCategory !== 'all') {
      finalQuery = justiaQuery ? `${activeCategory} ${justiaQuery}` : activeCategory;
    }
    
    if (!finalQuery) {
      return `https://law.justia.com/codes/${justiaState}`;
    }
    
    return `https://law.justia.com/search?q=${encodeURIComponent(finalQuery)}&location=${justiaState}`;
  };

  // -------------------------------------------------------------
  // Tab 5: FindLaw States
  // -------------------------------------------------------------
  const [findlawTopic, setFindlawTopic] = useState('');
  const [findlawState, setFindlawState] = useState('california');

  const getFindLawUrl = () => {
    if (!findlawTopic) {
      return `https://corporate.findlaw.com/law-library.html`;
    }
    return `https://search.findlaw.com/search/lpsearch.html?query=${encodeURIComponent(findlawTopic)}&state=${findlawState}`;
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent Backdrop Cover */}
          <div 
            id="research-drawer-backdrop"
            onClick={onClose}
            className="fixed inset-0 bg-[#020612]/75 backdrop-blur-xs z-40 transition-opacity duration-300 pointer-events-auto"
          />

          {/* Right Sliding Slate Panel */}
          <motion.div
            id="research-drawer-body"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#090e17] border-l border-[#1e293b] z-50 shadow-2xl flex flex-col pointer-events-auto overflow-hidden text-left"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#1e293b] bg-[#070b12] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#0e1625] border border-[#dfb76c]/30 rounded-lg">
                  <Scale className="w-5 h-5 text-[#dfb76c]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading leading-tight flex items-center gap-1.5">
                    Judicial Research Desk
                    <span className="text-[10px] bg-teal-500/10 border border-teal-500/25 text-teal-400 font-mono px-1 rounded-md leading-none lowercase">level 23 hub</span>
                  </h2>
                  <p className="text-[10px] text-slate-500 font-sans leading-none mt-1">
                    Multi-jurisdictional case law, California court forms, and docket search portal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 bg-[#0e1625] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Engagement Client Context Selector Bar */}
            <div className="px-4 py-2 bg-[#050912] border-b border-[#1e293b] flex items-center justify-between gap-3 text-xs font-mono shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                <span className="text-slate-300 font-bold uppercase text-[10.5px]">AI Engagement Target Client:</span>
              </div>
              <select
                value={selectedClientForForm}
                onChange={(e) => setSelectedClientForForm(e.target.value)}
                className="bg-[#0b1322] border border-amber-500/40 text-amber-300 font-bold px-2.5 py-1 rounded-lg text-xs outline-none focus:border-amber-400 cursor-pointer max-w-[260px]"
              >
                <option value="">-- Select Client for AI Context --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.practiceArea || 'General'})</option>
                ))}
              </select>
            </div>

            {/* Glowing Tab Indicator Dock */}
            <div className="flex border-b border-[#1e293b]/60 bg-[#060a10]/50 p-2 gap-1 overflow-x-auto select-none scrollbar-hide shrink-0">
              {[
                { id: 'courtlistener', label: 'CourtListener (Dockets)', icon: Globe },
                { id: 'forms', label: 'CA Court Forms', icon: FileText },
                { id: 'scholar', label: 'Google Scholar', icon: BookOpen },
                { id: 'justia', label: 'Justia Research', icon: Layers },
                { id: 'findlaw', label: 'FindLaw Portal', icon: Link2 }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setSelectedForm(null);
                      setPrefilledData(null);
                      setSelectedDocketDetail(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium font-sans whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#dfb76c]/10 text-[#fce093] border border-[#dfb76c]/30 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1523]/60 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Inner Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* ------------------------------------------------------------- */}
              {/* TAB: COURT LISTENER DOCKETS */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'courtlistener' && (
                <div id="tab-courtlistener-content" className="space-y-4">
                  {/* API Credentials Setup accordion-box */}
                  <div className="p-3 bg-[#0a0f19] border border-slate-800/80 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide font-bold">Personal API Credentials</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold uppercase ${customToken ? 'text-emerald-400' : 'text-[#dfb76c]/80 animate-pulse'}`}>
                        {customToken ? '● CourtListener Active' : '○ Local Mock Mode'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans leading-normal">
                      Input your Free Law Project CourtListener key below. Without a token, the desk automatically falls back to offline state and bankruptcy simulations unless Apify is enabled.
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type={showCustomToken ? "text" : "password"}
                          value={customToken}
                          onChange={(e) => setCustomToken(e.target.value)}
                          placeholder="Paste CourtListener API Token (e.g. e4a29a1b...)"
                          className="w-full bg-[#101726] border border-slate-800 rounded-lg px-2.5 pr-8 py-1.5 text-[11px] text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomToken(!showCustomToken)}
                          className="absolute right-2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                          title={showCustomToken ? "Hide token" : "Show token in plain text"}
                        >
                          {showCustomToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveToken}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 font-mono text-[10px] font-bold rounded-lg transition-colors border-none max-w-28 text-center"
                      >
                        {isTokenSaved ? 'Saved!' : 'Save Key'}
                      </button>
                    </div>

                    <div className="border-t border-slate-900 pt-2.5 mt-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide font-bold">Apify Scraper Connection</span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold uppercase ${apifyTokenState ? 'text-teal-400' : 'text-slate-600'}`}>
                          {apifyTokenState ? '● Apify Live' : '○ Off'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-sans leading-normal mb-1.5">
                        Don't have a CourtListener key? Use your Apify Token to crawl real-time court docket indexes securely using Apify's Google Search actor.
                      </p>
                      <div className="flex gap-2">
                        <div className="relative flex-1 flex items-center">
                          <input
                            type={showApifyToken ? "text" : "password"}
                            value={apifyTokenState}
                            onChange={(e) => setApifyTokenState(e.target.value)}
                            placeholder="Paste Apify API Token (e.g. apf_v2_...)"
                            className="w-full bg-[#101726] border border-slate-800 rounded-lg px-2.5 pr-8 py-1.5 text-[11px] text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApifyToken(!showApifyToken)}
                            className="absolute right-2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                            title={showApifyToken ? "Hide token" : "Show token in plain text"}
                          >
                            {showApifyToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveApifyToken}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 font-mono text-[10px] font-bold rounded-lg transition-colors border-none max-w-28 text-center"
                        >
                          {isApifyTokenSaved ? 'Saved!' : 'Save Key'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI Search Assistant Formulation Panel */}
                  <div className="p-3.5 bg-[#0a101d] border border-slate-800/80 rounded-xl space-y-3 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1 bg-[#1a2c3a] border-l border-b border-slate-800 rounded-bl-lg">
                      <span className="text-[8px] font-mono font-bold text-teal-400 uppercase tracking-widest px-1">Gemini Pro/Flash</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#dfb76c] animate-pulse" />
                      <div>
                        <h4 className="text-[11px] font-bold text-[#dfb76c] uppercase tracking-wider font-heading">AI Search Co-Counsel</h4>
                        <p className="text-[9px] text-slate-400 font-sans mt-0.5">
                          Formulate optimized legal queries, choose jurisdictions (e.g. Nevada State Courts), and automatic search on court database.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        value={aiSearchPrompt}
                        onChange={(e) => setAiSearchPrompt(e.target.value)}
                        placeholder="e.g., 'Find active contract or breach disputes in Washoe County, Nevada' or 'bankruptcy cases in CA Central districts'"
                        className="w-full bg-[#111928] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-700 min-h-[50px] font-sans resize-none"
                      />
                      
                      <div className="flex justify-between items-center gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-500 font-mono uppercase">Model:</span>
                          <select
                            value={researchModel}
                            onChange={(e) => setResearchModel(e.target.value)}
                            className="bg-[#070b13] border border-slate-800 rounded px-1.5 py-0.5 text-[9.5px] text-slate-300 font-mono focus:border-[#dfb76c] outline-none cursor-pointer"
                          >
                            <option value="default">Default Router</option>
                            <option value="openrouter-fusion">OR Fusion</option>
                            <option value="claude-3.7-sonnet">Claude 3.7</option>
                            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={handleAiFormulateSearch}
                          disabled={isAiSearching || !aiSearchPrompt.trim()}
                          className="px-4 py-1.5 bg-gradient-to-r from-[#dfb76c] to-[#fce093] disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-[#070b12] font-heading font-black text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border-none shadow-[0_2px_8px_rgba(223,183,108,0.1)] shrink-0"
                        >
                          {isAiSearching ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Reasoning...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              Advise & Search
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {aiFeedback && (
                      <div className="p-2.5 bg-[#0d1624] border border-slate-800 rounded-lg space-y-1 mt-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#dfb76c]" />
                          <span className="text-[9px] font-mono font-bold text-[#dfb76c] uppercase tracking-widest">AI Formulation Log</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans leading-normal">
                          {aiFeedback}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Search inputs form */}
                  <form onSubmit={handleSearchCourtListener} className="p-4 bg-[#0c1422] border border-slate-800/50 rounded-xl space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-[#dfb76c] uppercase tracking-wider font-heading">Docket Search Engine</h4>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <input 
                            type="radio" 
                            name="cl_type" 
                            checked={clType === 'd'} 
                            onChange={() => setClType('d')}
                            className="bg-[#0b101c]" 
                          />
                          Dockets
                        </label>
                        <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <input 
                            type="radio" 
                            name="cl_type" 
                            checked={clType === 'f'} 
                            onChange={() => setClType('f')}
                            className="bg-[#0b101c]" 
                          />
                          Opinions
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">State / Jurisdiction Filter</label>
                        <select
                          value={clCourt}
                          onChange={(e) => setClCourt(e.target.value)}
                          className="w-full bg-[#101726]/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 font-mono"
                        >
                          <option value="">All State & Federal (Global)</option>
                          <option value="ca">California Courts Only</option>
                          <option value="nv">Nevada Courts Only</option>
                          <option value="cand">U.S. Dist Court, Northern CA</option>
                          <option value="cacd">U.S. Dist Court, Central CA</option>
                          <option value="ca9">U.S. Appeals 9th Circuit</option>
                          <option value="ny">New York Courts</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">Search Keywords or litigant</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={clQuery}
                            onChange={(e) => setClQuery(e.target.value)}
                            placeholder="e.g. Vance, bankruptcy, Miller..."
                            className="w-full bg-[#101726]/80 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-slate-100 font-mono focus:outline-none"
                          />
                          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoadingCl}
                      className="w-full py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:opacity-95 text-[#070b12] font-heading font-black text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer border-none shadow-[0_3px_10px_rgba(20,184,166,0.15)]"
                    >
                      {isLoadingCl ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Indexing court database...
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          <span>Lookup Multi-State Court Dockets</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Status Banner */}
                  {clMessage && (
                    <div className="p-2 px-3 bg-[#0f172a] rounded-xl border border-slate-800/80 flex items-start gap-2 text-[10px]">
                      <AlertCircle className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.25 font-bold" />
                      <span className="text-slate-400 font-sans leading-normal">{clMessage}</span>
                    </div>
                  )}

                  {/* Results ledger index */}
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                      {clResults.length} Matched Case Records found
                    </h5>

                    {selectedDocketDetail ? (
                      /* Active Detailed Docket Viewer */
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0b101c] border border-teal-500/30 rounded-xl p-4 space-y-3.5 shadow-lg"
                      >
                        <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
                          <div>
                            <span className="text-[9px] font-mono text-[#dfb76c] uppercase tracking-wider font-bold">
                              {selectedDocketDetail.jurisdiction}
                            </span>
                            <h4 className="text-xs font-heading font-extrabold text-white">
                              {selectedDocketDetail.case_name}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                              Docket ID: <span className="font-mono text-slate-300 font-bold">{selectedDocketDetail.docket_number}</span> • Judge: {selectedDocketDetail.judge}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedDocketDetail(null)}
                            className="text-[9px] font-mono hover:text-white px-2 py-0.5 rounded border border-slate-800 hover:border-slate-700 bg-slate-900/60"
                          >
                            ← Back to List
                          </button>
                        </div>

                        <div className="space-y-2">
                          <h6 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Chronological Case Docket Ledger</h6>
                          <div className="relative border-l border-slate-800/80 pl-3.5 space-y-3 pt-1">
                            {selectedDocketDetail.entries.map((entry: any, index: number) => (
                              <div key={index} className="relative text-[11px] leading-relaxed">
                                {/* Chronological bubble node */}
                                <span className="absolute -left-[19.5px] top-1 w-2 h-2 rounded-full bg-teal-400 border border-[#090d16] shadow-[0_0_8px_rgba(45,212,191,0.6)]"></span>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 text-[9px] text-[#dfb76c] font-mono font-bold leading-none">
                                    <span>{entry.date}</span>
                                    <span>•</span>
                                    <span className="text-slate-500">Document {index + 1}</span>
                                  </div>
                                  <p className="text-slate-300 font-sans">{entry.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 flex gap-2">
                          <a
                            href="https://www.courtlistener.com/recap/"
                            target="_blank"
                            referrerPolicy="no-referrer"
                            className="flex-1 py-1.5 bg-[#101726] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-mono font-bold text-center flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                            Verify RECAP PDF Cloud
                          </a>
                        </div>
                      </motion.div>
                    ) : (
                      /* Docket Cards List */
                      <div className="space-y-2">
                        {clResults.map((doc, idx) => (
                          <div
                            key={doc.id || doc.docket_number || `cl-doc-${idx}`}
                            className="p-3 bg-[#0a0f1b]/90 hover:bg-[#0c1425] border border-slate-800/80 hover:border-[#dfb76c]/30 rounded-xl transition-all cursor-pointer space-y-2"
                            onClick={() => setSelectedDocketDetail(doc)}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.25 rounded-md leading-none uppercase">
                                {doc.jurisdiction}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 font-bold">
                                Filed: {doc.filed_date}
                              </span>
                            </div>

                            <div>
                              <h5 className="text-[11.5px] font-sans font-bold text-slate-200">
                                {doc.case_name}
                              </h5>
                              <p className="text-[10px] font-mono text-slate-400">
                                Case: <span className="text-[#dfb76c] font-bold">{doc.docket_number}</span> • Judge: {doc.judge || "N/A"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[9px] pt-1.5 border-t border-slate-800/50">
                              <span className="text-slate-500 font-sans italic">Status: {doc.status}</span>
                              <span className="text-teal-400 font-mono hover:underline flex items-center gap-0.5">
                                View Full Docket Entries ({doc.entries ? doc.entries.length : 0}) →
                              </span>
                            </div>
                          </div>
                        ))}

                        {clResults.length === 0 && (
                          <div className="p-8 text-center text-slate-600 font-sans text-xs">
                            No active matching litigation docket entries found. Try broadening your keywords!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'forms' && (
                <div id="tab-courtfoms-content" className="space-y-4">
                  {/* CA Official Court Forms Link Banner */}
                  <div className="p-4 bg-gradient-to-br from-[#0c1422] to-[#111c30] border border-slate-800 rounded-2xl space-y-3 shadow-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all duration-500" />
                    <div className="space-y-1 relative z-10 font-sans">
                      <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-[#dfb76c] shrink-0" />
                        <span>Official CA Judicial Council Forms Hub</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                        Find and configure any official California Judicial Council form from the primary state court directory. Once selected or downloaded, register its details and PDF resource link below to integrate it permanently into this live interactive desk!
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 relative z-10 pt-1">
                      <a
                        href="https://www.courts.ca.gov/forms.htm"
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="px-3 py-1.5 bg-[#dfb76c]/10 hover:bg-[#dfb76c]/20 border border-[#dfb76c]/30 text-[#fce093] rounded-lg font-mono text-[9px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3 text-[#dfb76c]" />
                        <span> courts.ca.gov Forms index</span>
                      </a>
                      <a
                        href="https://www.courts.ca.gov/formgroup.htm"
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-205 rounded-lg font-mono text-[9px] font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Browse Groups</span>
                      </a>
                    </div>
                  </div>

                  {/* Register Custom CA Court Form Expander panel */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/25">
                    <button
                      type="button"
                      onClick={() => setShowAddCustomForm(!showAddCustomForm)}
                      className="w-full px-4 py-3 bg-[#0d1524]/60 hover:bg-[#111b2e]/60 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-400" />
                        <span className="text-[11px] font-bold font-mono text-white uppercase tracking-wider">
                          {showAddCustomForm ? 'Collapse Registration Form' : 'Register Custom CA Court Form'}
                        </span>
                      </div>
                      <span className="text-teal-400 font-mono text-[10px] font-bold">
                        {showAddCustomForm ? '✕ Close' : '＋ Add Form Link'}
                      </span>
                    </button>

                    <AnimatePresence>
                      {showAddCustomForm && (
                        <motion.form
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          onSubmit={handleAddCustomFormSubmit}
                          className="p-4 bg-[#080d16] border-t border-slate-850 space-y-4 flex flex-col overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                                Form Code Identifier *
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. CIV-100"
                                value={newFormCode}
                                onChange={(e) => setNewFormCode(e.target.value)}
                                className="w-full bg-[#04060b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                                Category *
                              </label>
                              <select
                                value={newFormCategory}
                                onChange={(e) => setNewFormCategory(e.target.value)}
                                className="w-full bg-[#04060b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-400 font-sans"
                              >
                                <option value="Family Law">Family Law</option>
                                <option value="General Civil">General Civil</option>
                                <option value="Real Property">Real Property</option>
                                <option value="Federal / Immigration">Federal / Immigration</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                              Official Document Title *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Request for Entry of Default"
                              value={newFormTitle}
                              onChange={(e) => setNewFormTitle(e.target.value)}
                              className="w-full bg-[#04060b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 font-sans"
                            />
                          </div>

                          <div>
                            <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                              PDF Download Link / URL (Optional)
                            </label>
                            <input
                              type="url"
                              placeholder="https://www.courts.ca.gov/documents/civ100.pdf"
                              value={newFormUrl}
                              onChange={(e) => setNewFormUrl(e.target.value)}
                              className="w-full bg-[#04060b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                              Form Description Purpose
                            </label>
                            <textarea
                              rows={2}
                              value={newFormDescription}
                              onChange={(e) => setNewFormDescription(e.target.value)}
                              placeholder="Describe are there special liabilities, procedural requirements or declarations this document drafts..."
                              className="w-full bg-[#04060b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 font-sans resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                              Filing Action Guidelines (Delimiter commas or newlines)
                            </label>
                            <textarea
                              rows={2}
                              value={newFormGuidelines}
                              onChange={(e) => setNewFormGuidelines(e.target.value)}
                              placeholder="Step 1: fill out basic case title, Step 2: request spousal support checks..."
                              className="w-full bg-[#04060b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 font-sans resize-none"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/50">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddCustomForm(false);
                                setNewFormCode('');
                                setNewFormTitle('');
                                setNewFormUrl('');
                                setNewFormDescription('');
                                setNewFormGuidelines('');
                              }}
                              className="px-3.5 py-1.5 bg-[#0e1625] hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-lg text-[9.5px] font-mono font-bold cursor-pointer"
                            >
                              Reset
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 text-[#090d16] font-extrabold rounded-lg text-[9.5px] font-sans tracking-wide uppercase transition-all shadow-md cursor-pointer"
                            >
                              Register Form to Viewer
                            </button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Category filters */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">California Form Category</span>
                      <span className="text-[10px] text-slate-400 font-mono">{filteredForms.length} documents</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['All', ...Array.from(new Set(calCourtForms.map(f => f.category)))].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                            selectedCategory === cat
                              ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                              : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search and Selector Grid */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={formSearch}
                          onChange={(e) => setFormSearch(e.target.value)}
                          placeholder="Search California court forms by identifier or code (e.g. FL-150)..."
                          className="w-full bg-[#101726]/80 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-[11px] text-white font-mono placeholder:text-slate-600 focus:outline-none"
                        />
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      </div>
                      {selectedForm && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedForm(null);
                            setPrefilledData(null);
                          }}
                          className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg font-mono text-[9.5px] font-bold uppercase cursor-pointer shrink-0 transition-colors"
                        >
                          ✕ Clear Viewer
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {filteredForms.map((form) => {
                        const isCustomForm = customForms.some(cf => cf.code === form.code);
                        return (
                          <div
                            key={form.code}
                            className={`p-3 bg-slate-900/60 border rounded-xl transition-all flex flex-col justify-between ${
                              selectedForm?.code === form.code
                                ? 'border-[#dfb76c] bg-[#dfb76c]/5'
                                : 'border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11.5px] font-mono font-extrabold text-teal-400">{form.code}</span>
                                  <span className="text-[9px] font-mono bg-[#0c1322] border border-slate-850 px-1 py-0.25 text-slate-500 rounded uppercase font-bold">{form.category}</span>
                                  {isCustomForm && (
                                    <span className="text-[9.5px] font-mono bg-teal-500/10 border border-teal-500/25 text-teal-400 px-1.5 py-0.25 rounded font-extrabold leading-none uppercase">Custom Saved</span>
                                  )}
                                </div>
                                <h5 className="text-[12px] font-bold text-white font-sans mt-1">
                                  {form.title}
                                </h5>
                                <p className="text-[10px] text-slate-400 font-sans mt-1 leading-normal">
                                  {form.description}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (selectedForm?.code === form.code) {
                                      setSelectedForm(null);
                                      setPrefilledData(null);
                                    } else {
                                      setSelectedForm(form);
                                      setPrefilledData(null);
                                    }
                                  }}
                                  className={`px-2.5 py-1 border font-mono text-[9.5px] font-bold uppercase rounded-lg cursor-pointer transition-colors ${
                                    selectedForm?.code === form.code
                                      ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-550 text-rose-400'
                                      : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-[#dfb76c]'
                                  }`}
                                >
                                  {selectedForm?.code === form.code ? '✕ Close' : 'Details & Prefill'}
                                </button>
                                {isCustomForm && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomForm(form.code)}
                                    className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                                    title="Delete Custom Form"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                          {selectedForm?.code === form.code && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-3 text-[11px]"
                            >
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                                  How to File (California Guidelines):
                                </span>
                                <ul className="list-disc pl-4 space-y-1 text-slate-300 font-sans leading-relaxed">
                                  {form.guidelines.map((g, idx) => (
                                    <li key={idx}>{g}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* Automated prefill assistant */}
                              <div className="p-3.5 bg-[#050911] border border-slate-850 rounded-2xl space-y-3">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-mono text-[#dfb76c] uppercase tracking-wide font-extrabold flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-[#dfb76c] animate-pulse" />
                                      <span>Intelligent Court PDF prefill mapper</span>
                                    </label>
                                    <span className="text-[8px] text-teal-400 font-mono font-bold uppercase bg-teal-500/10 border border-teal-500/25 px-1.5 py-0.25 rounded">Active Binding</span>
                                  </div>
                                  <p className="text-[9.5px] text-slate-400 font-sans leading-normal">
                                    Official CA Judicial Council PDFs are state-secured documents. To draft: select any client dossier below to extract matched variables, click <strong className="text-white">Draft prefill</strong>, then copy values instantly into your downloaded form!
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex gap-2">
                                    <select
                                      value={selectedClientForForm}
                                      onChange={(e) => {
                                        setSelectedClientForForm(e.target.value);
                                        setPrefilledData(null); // reset when client changes
                                      }}
                                      className="flex-1 bg-[#101726]/80 border border-slate-800 rounded-lg px-2 text-[11px] text-slate-300 font-mono focus:outline-none"
                                    >
                                      <option value="">-- Click to Select Client --</option>
                                      {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.practiceArea})</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => triggerAutofillSimulation(form)}
                                      disabled={!selectedClientForForm || isPrefilling}
                                      className="px-4 py-1.5 bg-[#dfb76c] hover:bg-[#fae093] disabled:opacity-40 disabled:hover:bg-[#dfb76c] text-[#070b13] font-black font-mono text-[9.5px] uppercase rounded-lg transition-all border-none cursor-pointer flex items-center gap-1.5 shrink-0"
                                    >
                                      {isPrefilling ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          <span>Mapping...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3 h-3" />
                                          <span>Draft prefill</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {/* Step details helper to ensure complete clarity */}
                                  {!prefilledData && !isPrefilling && (
                                    <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-900/60 flex items-center gap-2 text-[9px] text-slate-500 font-mono">
                                      <Info className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                      <span>Select target client above to synchronize file metadata with form {form.code}.</span>
                                    </div>
                                  )}
                                </div>

                                {prefilledData && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-[#0c1220] border border-slate-800/80 rounded-xl space-y-2.5 leading-normal"
                                  >
                                    <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
                                      <h6 className="text-[9px] text-[#dfb76c] font-mono uppercase font-bold tracking-wider flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5 text-teal-400" />
                                        <span>Synthesized Fields Map ({clients.find(c => c.id === selectedClientForForm)?.name})</span>
                                      </h6>
                                      <span className="text-[8px] text-slate-500 font-mono uppercase">{prefilledData.timestamp}</span>
                                    </div>

                                    {/* Copyable variables structure */}
                                    <div className="space-y-2">
                                      {[
                                        { key: 'rep', label: 'ATTORNEY / REPRESENTATIVE', val: 'Phoenix Desk Pro Se Assistant' },
                                        { key: 'petitioner', label: 'PETITIONER / PARTY NAME', val: prefilledData.clientName },
                                        { key: 'contact', label: 'CONTACT INFO (Phone & Email)', val: `${prefilledData.clientPhone} | ${prefilledData.clientEmail}` },
                                        prefilledData.marriageDetails ? { key: 'marriage', label: 'MARRIAGE DATE & TIMELINE (Div. 5)', val: prefilledData.marriageDetails } : null,
                                        prefilledData.children ? { key: 'children', label: 'MINOR CHILDREN DETAILS (Div. 5.c)', val: prefilledData.children } : null,
                                        prefilledData.communalAssets ? { key: 'assets', label: 'COMMUNITY PROPERTY DECLARATIONS', val: prefilledData.communalAssets } : null,
                                        prefilledData.incomeEstimation ? { key: 'income', label: 'GROSS MONTHLY INCOME ESTIMATION', val: prefilledData.incomeEstimation } : null,
                                        prefilledData.disputedCosts ? { key: 'duress', label: 'ITEMIZED LIABILITIES / EXPENSES', val: prefilledData.disputedCosts } : null,
                                        prefilledData.originCountry ? { key: 'origin', label: 'COUNTRY OF ORIGINAL PERSECUTION', val: prefilledData.originCountry } : null,
                                        prefilledData.evidence ? { key: 'evidence', label: 'SUPPORTING EXAMINED EVIDENCE FILE', val: prefilledData.evidence } : null,
                                        prefilledData.generalCase ? { key: 'general', label: 'GENERAL COURT BRIEF REFERENTIAL', val: prefilledData.generalCase } : null,
                                      ].filter(Boolean).map((field: any) => (
                                        <div key={field.key} className="bg-[#050911]/80 rounded-lg p-2 border border-slate-900 flex justify-between items-start gap-3 group/field">
                                          <div className="space-y-0.5 min-w-0">
                                            <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-wider block font-bold">{field.label}</span>
                                            <p className="text-[10px] text-slate-200 font-sans break-words">{field.val}</p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              navigator.clipboard.writeText(field.val);
                                              setCopiedField(field.key);
                                              setTimeout(() => setCopiedField(null), 1800);
                                            }}
                                            className={`px-2 py-1 rounded border text-[8.5px] font-mono font-bold uppercase transition-all shrink-0 flex items-center gap-1 cursor-pointer select-none ${
                                              copiedField === field.key
                                                ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                                                : 'bg-slate-950 border-slate-850 text-[#dfb76c] hover:bg-slate-900 group-hover/field:border-[#dfb76c]/40'
                                            }`}
                                          >
                                            {copiedField === field.key ? (
                                              <>
                                                <Check className="w-2.5 h-2.5 text-teal-400" />
                                                <span>Copied</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-2.5 h-2.5" />
                                                <span>Copy</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="pt-1.5 border-t border-slate-850/60 flex items-center gap-1.5 text-[9px] text-[#dfb76c] font-sans">
                                      <span className="animate-pulse">✨</span>
                                      <span>Click <strong className="text-white">Copy</strong> on any variable, then paste directly into the respective field of your CA Court PDF form!</span>
                                    </div>
                                  </motion.div>
                                )}
                              </div>

                              {/* Download & Template Actions */}
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => triggerDirectCourtPdfDownload(form.pdfUrl || 'https://www.courts.ca.gov/forms.htm', `${form.code}_JudicialCouncil`)}
                                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 rounded-xl font-mono text-[10px] font-bold uppercase text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-teal-400" />
                                  <span>Download Blank PDF</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleImportFormAsTemplate(form)}
                                  className="flex-1 py-2 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 rounded-xl font-mono text-[10px] font-black uppercase text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <BookmarkPlus className="w-3.5 h-3.5 text-teal-400" />
                                  <span>{importedFormStatus[form.code] || 'Save as Template & Map'}</span>
                                </button>

                                <a
                                  href={form.pdfUrl || 'https://www.courts.ca.gov/forms.htm'}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  className="px-3 py-2 bg-gradient-to-r from-[#dfb76c]/10 to-[#dfb76c]/5 hover:from-[#dfb76c]/15 hover:to-[#dfb76c]/10 border border-[#dfb76c]/40 hover:border-[#dfb76c]/70 text-[#fbd890] rounded-xl font-mono text-[10px] font-black uppercase text-center flex items-center justify-center gap-1.5 group cursor-pointer transition-all"
                                  title="Open in courts.ca.gov"
                                >
                                  <span>courts.ca.gov</span>
                                  <Link2 className="w-3 h-3 text-[#dfb76c]" />
                                </a>
                              </div>
                            </motion.div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB: GOOGLE SCHOLAR CASE LAW */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'scholar' && (
                <div id="tab-scholar-content" className="space-y-4">
                  <div className="p-3 bg-[#0a0f19] border border-slate-800/80 rounded-xl space-y-1.5 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-400 font-sans leading-normal">
                      The Google Scholar research portal facilitates locating binding judicial precedents, federal regulations, and judicial evaluations. The builder below constructs advanced query strings specifically targeted to retrieve California State (CA Supreme/Appellate) or federal precedent law!
                    </p>
                  </div>

                  <div className="p-4 bg-[#0c1422] border border-slate-800/60 rounded-xl space-y-3 shadow-md">
                    <h4 className="text-[11px] font-mono text-[#dfb76c] uppercase tracking-wider font-extrabold">Query Builder Dashboard</h4>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">Target Court Jurisdiction</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-300">
                            <input
                              type="radio"
                              name="sch_jur"
                              value="ca"
                              checked={scholarJurisdiction === 'ca'}
                              onChange={() => setScholarJurisdiction('ca')}
                            />
                            California State Courts
                          </label>
                          <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-300">
                            <input
                              type="radio"
                              name="sch_jur"
                              value="us"
                              checked={scholarJurisdiction === 'us'}
                              onChange={() => setScholarJurisdiction('us')}
                            />
                            Federal Circuits / Supreme Court
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">Specific Law Citation</label>
                          <input
                            type="text"
                            value={scholarCitation}
                            onChange={(e) => setScholarCitation(e.target.value)}
                            placeholder="e.g. CA Civil Code 4320"
                            className="w-full bg-[#101726]/85 border border-slate-805 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">Filing Year / Limit</label>
                          <input
                            type="text"
                            value={scholarYear}
                            onChange={(e) => setScholarYear(e.target.value)}
                            placeholder="e.g. 2018"
                            className="w-full bg-[#101726]/85 border border-slate-805 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">Case Keywords / Subject Matter</label>
                        <textarea
                          rows={2}
                          value={scholarTopic}
                          onChange={(e) => setScholarTopic(e.target.value)}
                          placeholder="e.g. 'marital residence' partition separation community property"
                          className="w-full bg-[#101726]/85 border border-slate-805 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-sans focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/50 space-y-2">
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                        <span>Compiled Query Reference:</span>
                        <span className="text-[#dfb76c] font-bold">Safe External Redirection</span>
                      </div>
                      <div className="p-2 bg-slate-950 rounded text-[10px] font-mono text-slate-400 select-all truncate">
                        {scholarCitation || scholarTopic ? (
                          `https://scholar.google.com/scholar...q=${scholarCitation ? `"${scholarCitation}"` : ''} ${scholarTopic} ${scholarYear ? `y:${scholarYear}` : ''}`
                        ) : (
                          'No parameters defined. Tap Google Research below to open default library.'
                        )}
                      </div>

                      <a
                        href={getGoogleScholarUrl()}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-[#dfb76c]/30 text-[#dfb76c] hover:text-[#fce093] font-heading font-black text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer leading-tight"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Launch Google Scholar Search</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB: JUSTIA RESEARCH */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'justia' && (
                <div id="tab-justia-content" className="space-y-4">
                  <div className="p-3 bg-[#0a0f19] border border-slate-800/80 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-extrabold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#dfb76c]" />
                      Justia Jurisprudence Portal
                    </span>
                    <p className="text-[10px] text-slate-500 font-sans leading-normal">
                      Justia catalogs comprehensive legal code files, local county guidelines, and lawyer directories. Target California or Federal codes directly below.
                    </p>
                  </div>

                  <div className="p-4 bg-[#0c1422] border border-slate-800/60 rounded-xl space-y-3.5 shadow-md">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">State Focus</label>
                        <input
                          type="text"
                          value={justiaState}
                          onChange={(e) => setJustiaState(e.target.value)}
                          placeholder="california"
                          className="w-full bg-[#101726] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">Category Subject</label>
                        <select
                          value={justiaCategory}
                          onChange={(e) => setJustiaCategory(e.target.value)}
                          className="w-full bg-[#101726] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-slate-700"
                        >
                          <option value="family">Family Law</option>
                          <option value="bankruptcy">Bankruptcy Law</option>
                          <option value="civil">General Civil & Litigation</option>
                          <option value="immigration">Immigration / Asylum</option>
                          <option value="criminal">Criminal Law</option>
                          <option value="probate">Probate, Wills & Trusts</option>
                          <option value="property">Real Property & Landlord</option>
                          <option value="labor">Labor & Employment</option>
                          <option value="tax">Tax Code Regulations</option>
                          <option value="corporate">Corporate & Contracts</option>
                          <option value="custom">★ Custom / Other Area...</option>
                        </select>
                      </div>
                    </div>

                    {justiaCategory === 'custom' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1"
                      >
                        <label className="block text-[9px] font-mono text-amber-500 uppercase font-bold">Custom Practice or Statutory Area Name</label>
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="e.g. Maritime Law, Intellectual Property, Environmental..."
                          className="w-full bg-[#101726] border border-amber-500/30 focus:border-amber-500/60 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-100 placeholder:text-slate-600 focus:outline-none font-sans"
                        />
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">Target Keyword Search</label>
                      <input
                        type="text"
                        value={justiaQuery}
                        onChange={(e) => setJustiaQuery(e.target.value)}
                        placeholder="e.g. partition of townhouse, asylum I-589..."
                        className="w-full bg-[#101726] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-sans"
                      />
                    </div>

                    <a
                      href={getJustiaUrl()}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-[#dfb76c]/30 text-[#dfb76c] font-heading font-black text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all leading-tight text-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                      <span>Search on Justia Portal</span>
                    </a>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB: FINDLAW PORTAL */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'findlaw' && (
                <div id="tab-findlaw-content" className="space-y-4">
                  <div className="p-3 bg-[#0a0f19] border border-slate-800/80 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-extrabold">FindLaw Practice Notes</span>
                    <p className="text-[10px] text-slate-500 font-sans leading-normal">
                      Quickly discover articles on procedural statutes, court guidelines, and attorney briefs in FindLaw's library.
                    </p>
                  </div>

                  <div className="p-4 bg-[#0c1422] border border-[#1e293b] rounded-xl space-y-3.5 shadow-md text-left">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">Filing State</label>
                        <input
                          type="text"
                          value={findlawState}
                          onChange={(e) => setFindlawState(e.target.value)}
                          placeholder="california"
                          className="w-full bg-[#101726] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">Procedural Topic</label>
                        <input
                          type="text"
                          value={findlawTopic}
                          onChange={(e) => setFindlawTopic(e.target.value)}
                          placeholder="e.g. child support guidelines"
                          className="w-full bg-[#101726]/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-sans"
                        />
                      </div>
                    </div>

                    <a
                      href={getFindLawUrl()}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-[#dfb76c]/30 text-[#dfb76c] font-heading font-black text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all text-center leading-tight"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                      <span>Execute FindLaw Search</span>
                    </a>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Legal notice */}
            <div className="p-4 bg-[#060a11] border-t border-[#1e293b]/70 flex items-center justify-between text-[9px] font-mono text-slate-500 select-none shrink-0 uppercase">
              <span>Jurisdictional Desk v3.1</span>
              <span>Secure Grounding Layer Buffered</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
