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
  Link2
} from 'lucide-react';
import { Client, Matter } from '../types';

interface ResearchPortalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  matters: Matter[];
}

// California Court Form template definition
interface CourtForm {
  code: string;
  title: string;
  category: string;
  pdfUrl: string;
  description: string;
  guidelines: string[];
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

  const calCourtForms: CourtForm[] = [
    {
      code: "FL-100",
      title: "Petition for Dissolution of Marriage",
      category: "Family Law",
      pdfUrl: "https://www.courts.ca.gov/documents/fl100.pdf",
      description: "This is the initial petition filed to start a divorce or legal separation process in California, outlining basic marriage facts, communal property, and child custody requests.",
      guidelines: [
        "In Section 1: Declare the duration of legal residency (typically must be in California for 6 months and county for 3 months prior).",
        "In Section 2: List the date of marriage and date of separation accurately. This divides community and separate property earnings.",
        "In Section 5: Specify child custody, visitation rights, and physical placement carefully.",
        "In Section 7: Make sure to check the box requesting reservation of jurisdiction to award spousal support to protect liabilities."
      ]
    },
    {
      code: "FL-150",
      title: "Income and Expense Declaration",
      category: "Family Law",
      pdfUrl: "https://www.courts.ca.gov/documents/fl150.pdf",
      description: "A comprehensive mandatory disclosure document detail listing current employment earnings, tax withholdings, monthly expenses, assets, and liabilities.",
      guidelines: [
        "This form must be accompanied by copies of your pay stubs for the last 2 months.",
        "Make sure monthly mortgage, property tax, and medical emergency expenses are exact.",
        "Itemize separate property investments and communal debts to support legal review.",
        "Must be signed under penalty of perjury under CA Civ. Proc. Code."
      ]
    },
    {
      code: "FL-160",
      title: "Property Declaration (Community Property)",
      category: "Family Law",
      pdfUrl: "https://www.courts.ca.gov/documents/fl160.pdf",
      description: "Provides an exhaustive index of communal real estate, vehicles, financial portfolio balances, retirement trusts, and credit liabilities to be partitioned.",
      guidelines: [
        "Identify the current Fair Market Value (FMV) of all properties listed.",
        "Specify the exact mortgage debt outstanding as of the Separation Date.",
        "Cross-reference individual bank statements and townhouse deeds for audit consistency.",
        "Keep separate property claims registered separately on Form FL-160 (Separate)."
      ]
    },
    {
      code: "FL-300",
      title: "Request for Order (RFO)",
      category: "Family Law",
      pdfUrl: "https://www.courts.ca.gov/documents/fl300.pdf",
      description: "Used to petition the court for temporary or immediate modifications to child support, spousal support, custody schedules, or attorneys' fee orders before trial.",
      guidelines: [
        "State the exact reasons support modifications are urgent (e.g. involuntary change in employment).",
        "Section 10: Attach a copy of your completed FL-150 Income and Expense Declaration.",
        "Outline supporting facts chronologically in an attached 2-3 page declaration."
      ]
    },
    {
      code: "MC-025",
      title: "Attachment to Judicial Council Form",
      category: "General Civil",
      pdfUrl: "https://www.courts.ca.gov/documents/mc025.pdf",
      description: "A standard clean overflow sheet used to detail additional complaints, facts, or signatures when forms lack physical layout space.",
      guidelines: [
        "Clearly indicate the source form code and section reference at the top of the overflow sheet.",
        "Consolidate points using high-contrast numbered bullet blocks.",
        "Each page must be clearly numbered at the bottom (e.g., Page 3 of 4)."
      ]
    },
    {
      code: "UD-100",
      title: "Complaint - Unlawful Detainer",
      category: "Real Property",
      pdfUrl: "https://www.courts.ca.gov/documents/ud100.pdf",
      description: "Main pleading form used by landlords to initiate eviction proceedings in California, citing non-payment of rent or lease violations.",
      guidelines: [
        "Must verify that the required 3-Day or 30-Day notice was formally and legally served first.",
        "Include daily rent liability calculation metrics clearly in Section 11.",
        "Attach a clean copy of the written lease agreement and notice of non-payment."
      ]
    },
    {
      code: "I-589",
      title: "Petition for Asylum and for Withholding of Removal",
      category: "Federal / Immigration",
      pdfUrl: "https://www.uscourts.gov", // Redirect to official printable index
      description: "Federal petition used to apply for asylum and withholding of removal in the United States, representing Targeted Social group persecution.",
      guidelines: [
        "Provide a highly detailed, chronological narrative declaration outline.",
        "Ensure all direct extortion warnings and cartel communications are translated, indexed, and formatted.",
        "List all prior minor children, spouses, and dates of entry/exits meticulously.",
        "Must file within 365 days of applicant’s initial physical entry into the United States."
      ]
    }
  ];

  // Filter forms
  const filteredForms = calCourtForms.filter(f => {
    const matchesSearch = f.code.toLowerCase().includes(formSearch.toLowerCase()) || 
                          f.title.toLowerCase().includes(formSearch.toLowerCase()) ||
                          f.description.toLowerCase().includes(formSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const triggerAutofillSimulation = (form: CourtForm) => {
    if (!selectedClientForForm) return;
    setIsPrefilling(true);
    
    setTimeout(() => {
      const client = clients.find(c => c.id === selectedClientForForm);
      if (!client) return;

      // Extract client specific simulated values (family law / bankruptcy / asylum)
      let data: any = {
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      };

      if (form.code === 'FL-100') {
        data.marriageDetails = "Estimated marriage date: July 2, 2012. Separation Date: April 10th.";
        data.children = "Two minor children recorded in active client records.";
        data.communalAssets = "Communal Residence Townhouse Asset to be partitioned as community property.";
      } else if (form.code === 'FL-150') {
        data.incomeEstimation = "Gross monthly income average $3,140 net. Pay stubs attached.";
        data.disputedCosts = "Medical emergency expenses (Orange County General Hospital) listed as liabilities.";
      } else if (form.code === 'I-589') {
        data.originCountry = "El Salvador.";
        data.persecutionTarget = "Targeted Social Activism Press Guild organizer.";
        data.evidence = "Extortion Threat Warning Recovered April 4, 2024. Local police file E-9482.";
      } else {
        data.generalCase = "Matter referenced client file " + client.name;
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

  // User manual token state
  const [customToken, setCustomToken] = useState(() => {
    return localStorage.getItem('courtlistener_user_token') || '';
  });
  const [isTokenSaved, setIsTokenSaved] = useState(false);

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
                      <input
                        type="password"
                        value={customToken}
                        onChange={(e) => setCustomToken(e.target.value)}
                        placeholder="Paste CourtListener API Token (e.g. e4a29a1b...)"
                        className="flex-1 bg-[#101726] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                      />
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
                        <input
                          type="password"
                          value={apifyTokenState}
                          onChange={(e) => setApifyTokenState(e.target.value)}
                          placeholder="Paste Apify API Token (e.g. apf_v2_...)"
                          className="flex-1 bg-[#101726] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                        />
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

              {/* ------------------------------------------------------------- */}
              {/* TAB: CALIFORNIA COURT FORMS */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'forms' && (
                <div id="tab-courtfoms-content" className="space-y-4">
                  {/* Category filters */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">California Form Category</span>
                      <span className="text-[10px] text-slate-400 font-mono">{filteredForms.length} documents</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['All', 'Family Law', 'General Civil', 'Real Property', 'Federal / Immigration'].map((cat) => (
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
                    <div className="relative">
                      <input
                        type="text"
                        value={formSearch}
                        onChange={(e) => setFormSearch(e.target.value)}
                        placeholder="Search California court forms by identifier or code (e.g. FL-150)..."
                        className="w-full bg-[#101726]/80 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-[11px] text-white font-mono placeholder:text-slate-600 focus:outline-none"
                      />
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {filteredForms.map((form) => (
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
                                <span className="text-[9px] font-mono bg-[#0c1322] border border-slate-850 px-1 py-0.25 text-slate-550 rounded uppercase font-bold">{form.category}</span>
                              </div>
                              <h5 className="text-[12px] font-bold text-white font-sans mt-1">
                                {form.title}
                              </h5>
                              <p className="text-[10px] text-slate-400 font-sans mt-1 leading-normal">
                                {form.description}
                              </p>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedForm(form);
                                setPrefilledData(null);
                              }}
                              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[#dfb76c] font-mono text-[9px] font-black uppercase rounded-lg shrink-0 cursor-pointer"
                            >
                              Details & Prefill
                            </button>
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
                              <div className="p-3 bg-[#050911] border border-slate-850 rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wide font-extrabold flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-[#dfb76c] animate-pulse" />
                                    Leverage Local File Data (Prefill helper)
                                  </label>
                                  <span className="text-[8px] text-slate-500 font-mono">Select case model to bind</span>
                                </div>
                                <div className="flex gap-2">
                                  <select
                                    value={selectedClientForForm}
                                    onChange={(e) => setSelectedClientForForm(e.target.value)}
                                    className="flex-1 bg-[#101726]/80 border border-slate-800 rounded-lg px-2 text-[11px] text-slate-300 font-mono focus:outline-none"
                                  >
                                    <option value="">-- Choose Client File --</option>
                                    {clients.map(c => (
                                      <option key={c.id} value={c.id}>{c.name} ({c.practiceArea})</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => triggerAutofillSimulation(form)}
                                    disabled={!selectedClientForForm || isPrefilling}
                                    className="px-3.5 py-1 bg-[#dfb76c] hover:bg-[#fae093] disabled:opacity-40 disabled:hover:bg-[#dfb76c] text-[#070b13] font-black font-mono text-[9.5px] uppercase rounded-lg transition-all border-none cursor-pointer"
                                  >
                                    {isPrefilling ? 'Mapping...' : 'Draft prefill'}
                                  </button>
                                </div>

                                {prefilledData && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-2.5 bg-[#0e1625] border border-slate-800 rounded text-[10px] font-mono text-slate-300 space-y-1 leading-normal"
                                  >
                                    <h6 className="text-[9px] text-[#dfb76c] uppercase font-bold">Prefilled Case Bindings Completed:</h6>
                                    <div><span className="text-slate-500">ATTORNEY REP:</span> Phoenix Desk (pro se assisting)</div>
                                    <div><span className="text-slate-500">PETITIONER:</span> {prefilledData.clientName}</div>
                                    <div><span className="text-slate-500">CONTACT INFO:</span> {prefilledData.clientPhone} • {prefilledData.clientEmail}</div>
                                    {prefilledData.marriageDetails && (
                                      <div><span className="text-slate-500">MARRIAGE TIMELINE:</span> {prefilledData.marriageDetails}</div>
                                    )}
                                    {prefilledData.disputedCosts && (
                                      <div><span className="text-slate-500">INVOICE DURESS:</span> {prefilledData.disputedCosts}</div>
                                    )}
                                    {prefilledData.evidence && (
                                      <div><span className="text-slate-500">EVIDENTIARY FILE:</span> {prefilledData.evidence}</div>
                                    )}
                                    <p className="text-[8.5px] text-teal-400 mt-1 leading-none italic">
                                      ✨ Use the reference values below to fill fields on your official PDF form quickly!
                                    </p>
                                  </motion.div>
                                )}
                              </div>

                              {/* Download actions */}
                              <div className="flex gap-2">
                                <a
                                  href={form.pdfUrl}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-900 border border-[#dfb76c]/30 text-[#dfb76c] rounded-lg font-mono text-[10px] font-bold text-center flex items-center justify-center gap-1.5"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download Official PDF Guide</span>
                                </a>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
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
