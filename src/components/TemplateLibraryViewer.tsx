import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scale,
  Search,
  Filter,
  FileText,
  User,
  Building2,
  Calendar,
  Sparkles,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Printer,
  ChevronDown,
  FileCode,
  ShieldCheck,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { Client, Matter, GeneratedDocument } from '../types';

export interface TemplateLibraryViewerProps {
  clients: Client[];
  matters?: Matter[];
  initialMatterType?: string;
  initialFormCode?: string;
  initialClientId?: string;
  onAddGeneratedDoc?: (doc: GeneratedDocument) => void;
  onNavigateToTab?: (tab: string, clientId?: string) => void;
}

export type MatterTypeFilter =
  | 'All'
  | 'Family Law'
  | 'Civil Litigation'
  | 'Immigration'
  | 'Bankruptcy'
  | 'General Practice';

export interface GenericTemplateMeta {
  code: string;
  title: string;
  practiceArea: 'Family Law' | 'Civil Litigation' | 'Immigration' | 'Bankruptcy' | 'General Practice';
  category: string;
  description: string;
  standardPleading?: boolean;
}

// Clean, universal templates without state-specific form codes or instructional references
export const UNIVERSAL_TEMPLATES: GenericTemplateMeta[] = [
  // Family Law
  {
    code: 'PET-01',
    title: 'Petition for Dissolution / Legal Separation',
    practiceArea: 'Family Law',
    category: 'Initial Pleadings',
    description: 'Initial petition establishing jurisdictional residency and marital breakdown claims.',
    standardPleading: true
  },
  {
    code: 'RESP-01',
    title: 'Response & General Appearance',
    practiceArea: 'Family Law',
    category: 'Responsive Pleadings',
    description: 'Formal responsive appearance asserting defenses, admissions, and affirmative prayers for relief.',
    standardPleading: true
  },
  {
    code: 'CUST-01',
    title: 'Child Custody & Parenting Plan Declaration',
    practiceArea: 'Family Law',
    category: 'Custody & Visitation',
    description: 'Parenting plan declaration detailing legal custody, physical schedules, and child jurisdiction.',
    standardPleading: true
  },
  {
    code: 'VIS-01',
    title: 'Parenting Schedule & Holiday Visitation Schedule',
    practiceArea: 'Family Law',
    category: 'Custody & Visitation',
    description: 'Itemized timeshare attachment specifying weekday, weekend, holiday, and vacation schedules.'
  },
  {
    code: 'DISC-01',
    title: 'Declaration of Service of Mandatory Disclosures',
    practiceArea: 'Family Law',
    category: 'Financial Disclosures',
    description: 'Formal declaration certifying service of preliminary and final financial disclosures.',
    standardPleading: true
  },
  {
    code: 'FIN-01',
    title: 'Schedule of Community & Separate Assets and Debts',
    practiceArea: 'Family Law',
    category: 'Financial Disclosures',
    description: 'Itemized financial disclosure categorizing real estate, bank accounts, vehicles, and liabilities.'
  },
  {
    code: 'INC-01',
    title: 'Income and Expense Declaration',
    practiceArea: 'Family Law',
    category: 'Financial Disclosures',
    description: 'Statement of gross monthly earnings, payroll withholdings, and itemized household expenses.'
  },
  {
    code: 'MOT-01',
    title: 'Notice of Motion & Request for Temporary Orders',
    practiceArea: 'Family Law',
    category: 'Motions & Hearings',
    description: 'Application for temporary pendente lite orders for support, custody, or exclusive property use.'
  },

  // Civil Litigation
  {
    code: 'ANS-01',
    title: 'General Answer & Statutory Affirmative Defenses',
    practiceArea: 'Civil Litigation',
    category: 'Responsive Pleadings',
    description: 'Verified answer containing general denial and asserted affirmative defenses.',
    standardPleading: true
  },
  {
    code: 'TORT-01',
    title: 'Answer to Complaint (Tort & Damages)',
    practiceArea: 'Civil Litigation',
    category: 'Responsive Pleadings',
    description: 'Responsive answer pleading comparative fault, failure to mitigate, and damage apportionment.'
  },
  {
    code: 'CMS-01',
    title: 'Case Management Statement',
    practiceArea: 'Civil Litigation',
    category: 'Court Conferences',
    description: 'Statement summarizing service status, discovery plan, trial estimate, and dispute resolution.',
    standardPleading: true
  },
  {
    code: 'DEF-01',
    title: 'Request for Entry of Default Judgment',
    practiceArea: 'Civil Litigation',
    category: 'Court Motions',
    description: 'Application for clerk or court default judgment after responsive deadline expiration.'
  },
  {
    code: 'POS-01',
    title: 'Proof of Service (Personal, Mail & Electronic)',
    practiceArea: 'Civil Litigation',
    category: 'Service of Process',
    description: 'Declaration of service by non-party declarant verifying proper delivery of pleadings.',
    standardPleading: true
  },

  // Immigration
  {
    code: 'ASY-01',
    title: 'Application for Defensive Asylum & Withholding of Removal',
    practiceArea: 'Immigration',
    category: 'Court Petitions',
    description: 'Statutory application for asylum, withholding of removal, and protective relief.',
    standardPleading: true
  },
  {
    code: 'EAD-01',
    title: 'Application for Employment Authorization',
    practiceArea: 'Immigration',
    category: 'Benefit Applications',
    description: 'Application for work authorization document based on pending proceedings or qualified status.'
  },
  {
    code: 'AOS-01',
    title: 'Application for Adjustment of Status',
    practiceArea: 'Immigration',
    category: 'Benefit Applications',
    description: 'Statutory petition to register permanent residence and adjust immigrant status.'
  },
  {
    code: 'REL-01',
    title: 'Application for Cancellation of Removal',
    practiceArea: 'Immigration',
    category: 'Court Petitions',
    description: 'Formal court application alleging physical presence, moral character, and exceptional hardship.',
    standardPleading: true
  },
  {
    code: 'ADDR-01',
    title: 'Notice of Change of Address',
    practiceArea: 'Immigration',
    category: 'Court Notices',
    description: 'Statutory notification of address change submitted to the immigration court.'
  },

  // Bankruptcy
  {
    code: 'BK-01',
    title: 'Voluntary Debtor Petition for Bankruptcy Relief',
    practiceArea: 'Bankruptcy',
    category: 'Initial Petitions',
    description: 'Voluntary petition commencing debtor case and invoking automatic stay protections.',
    standardPleading: true
  },
  {
    code: 'BK-SCH-A',
    title: 'Schedule of Real & Personal Property',
    practiceArea: 'Bankruptcy',
    category: 'Schedules',
    description: 'Comprehensive itemized schedule of all debtor real estate, personalty, and intangible rights.'
  },
  {
    code: 'BK-EXEMPT',
    title: 'Schedule of Claimed Statutory Exemptions',
    practiceArea: 'Bankruptcy',
    category: 'Exemptions',
    description: 'Schedule electing statutory homestead and personal property exemptions from creditor claims.',
    standardPleading: true
  },
  {
    code: 'BK-SEC',
    title: 'Schedule of Secured Creditor Claims',
    practiceArea: 'Bankruptcy',
    category: 'Creditor Schedules',
    description: 'Listing of lenders and lienholders holding security interests in debtor collateral.'
  },
  {
    code: 'BK-MEANS',
    title: 'Debtor Means Test Determination & Income Statement',
    practiceArea: 'Bankruptcy',
    category: 'Financial Analysis',
    description: 'Calculation comparing current monthly income against applicable median household benchmarks.'
  },

  // General Practice
  {
    code: 'INTAKE-01',
    title: 'Universal Client Intake Questionnaire',
    practiceArea: 'General Practice',
    category: 'Client Intake',
    description: 'Comprehensive intake document recording client identity, opposing party, court venue, and claims.',
    standardPleading: true
  },
  {
    code: 'RET-01',
    title: 'Legal Services Retainer & Representation Agreement',
    practiceArea: 'General Practice',
    category: 'Contracts & Retainers',
    description: 'Written fee contract detailing scope of representation, hourly rates, and client trust accounting.',
    standardPleading: true
  },
  {
    code: 'WVR-01',
    title: 'Application for Waiver of Court Filing Fees',
    practiceArea: 'General Practice',
    category: 'Court Filings',
    description: 'Financial application requesting waiver of court filing fees and statutory costs.'
  },
  {
    code: 'POA-01',
    title: 'Statutory Durable Power of Attorney',
    practiceArea: 'General Practice',
    category: 'Estate Planning',
    description: 'Legal instrument appointing an agent for financial, banking, and business transactions.'
  },
  {
    code: 'PROT-01',
    title: 'Petition for Civil Protective / Restraining Order',
    practiceArea: 'General Practice',
    category: 'Court Petitions',
    description: 'Formal petition seeking emergency orders against harassment, stalking, or unlawful interference.'
  }
];

export const TemplateLibraryViewer: React.FC<TemplateLibraryViewerProps> = ({
  clients = [],
  matters = [],
  initialMatterType = 'All',
  initialFormCode,
  initialClientId,
  onAddGeneratedDoc
}) => {
  // 1. Matter Type Filter
  const [selectedMatterType, setSelectedMatterType] = useState<MatterTypeFilter>(
    (initialMatterType as MatterTypeFilter) || 'All'
  );

  // 2. Search & Category Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');

  // 3. Form Selection
  const [selectedFormCode, setSelectedFormCode] = useState<string>(
    initialFormCode || 'RESP-01'
  );

  // 4. Client Selection
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (initialClientId) return initialClientId;
    return clients[0]?.id || '';
  });

  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState<boolean>(false);
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');

  // Active Client
  const activeClient = useMemo(() => {
    return (clients || []).find(c => c?.id === selectedClientId) || clients?.[0] || null;
  }, [clients, selectedClientId]);

  // Active Matter for Active Client
  const activeMatter = useMemo(() => {
    if (!activeClient) return (matters || [])[0] || null;
    return (matters || []).find(m => m?.clientId === activeClient?.id) || (matters || [])[0] || null;
  }, [activeClient, matters]);

  // Active Form Metadata
  const activeForm = useMemo(() => {
    return (
      UNIVERSAL_TEMPLATES.find(f => f?.code === selectedFormCode) ||
      UNIVERSAL_TEMPLATES[0]
    );
  }, [selectedFormCode]);

  // Filtered Templates List
  const filteredTemplates = useMemo(() => {
    return UNIVERSAL_TEMPLATES.filter(template => {
      if (selectedMatterType !== 'All' && template.practiceArea !== selectedMatterType) {
        return false;
      }
      if (selectedSubCategory !== 'All' && template.category !== selectedSubCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = template.code.toLowerCase().includes(q);
        const matchTitle = template.title.toLowerCase().includes(q);
        const matchDesc = template.description.toLowerCase().includes(q);
        const matchCat = template.category.toLowerCase().includes(q);
        return matchCode || matchTitle || matchDesc || matchCat;
      }
      return true;
    });
  }, [selectedMatterType, selectedSubCategory, searchQuery]);

  // Subcategories for current filter
  const availableSubCategories = useMemo(() => {
    const list = UNIVERSAL_TEMPLATES.filter(
      t => selectedMatterType === 'All' || t.practiceArea === selectedMatterType
    ).map(t => t.category);
    return ['All', ...Array.from(new Set(list))];
  }, [selectedMatterType]);

  // Helper to dynamically build populated fields from the selected client and matter without fake placeholders
  function buildAutoPopulatedFields(
    c: Client | null,
    m: Matter | null,
    form: GenericTemplateMeta
  ): Record<string, string> {
    const clientName = c?.name || '';
    const clientAddress = c?.address || '';
    const clientPhone = c?.phone || '';
    const clientEmail = c?.email || '';

    const opposingName = m?.opposingParty || c?.fl120Data?.petitionerName || '';
    const caseNumber = m?.caseNumber || c?.fl120Data?.caseNumber || '';
    const courtVenue = m?.courtVenue || c?.fl120Data?.courtCounty || '';
    const branchName = c?.fl120Data?.branchName || '';

    return {
      // Caption
      attorneyName: 'Counsel of Record',
      firmName: 'Law Offices of Counsel',
      attorneyFor: clientName ? `Attorney for ${clientName}` : '',

      // Client (Self) Information
      clientFullName: clientName,
      clientAddress: clientAddress,
      clientPhone: clientPhone,
      clientEmail: clientEmail,
      clientPracticeArea: c?.practiceArea || form.practiceArea,

      // Opposing Party
      opposingFullName: opposingName,
      opposingAddress: '',

      // Court Information
      courtVenue: courtVenue,
      courtBranch: branchName,
      caseNumber: caseNumber,

      // Substantive Declarations
      matterTitle: m?.title || (clientName ? `${clientName} — ${form.title}` : form.title),
      dateOfIncidentOrFiling: c?.fl120Data?.dateOfMarriage || (m?.createdAt ? new Date(m.createdAt).toLocaleDateString() : ''),
      relevantDateSecondary: c?.fl120Data?.dateOfSeparation || '',
      reliefRequested: c?.intakeNotes || m?.description || '',
      affirmativeDefenses: 'General denial of adverse allegations and reservation of all statutory defenses.',

      // Verification & Certification
      declarantDate: new Date().toLocaleDateString(),
      declarantSignature: clientName
    };
  }

  // Auto-Populated Form Fields State
  const [formFields, setFormFields] = useState<Record<string, string>>(() => {
    return buildAutoPopulatedFields(activeClient, activeMatter, activeForm);
  });

  const [populationNotice, setPopulationNotice] = useState<string | null>(null);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'form' | 'table' | 'text'>('form');

  // Re-populate whenever active client or active template changes
  useEffect(() => {
    if (activeClient) {
      const populated = buildAutoPopulatedFields(activeClient, activeMatter, activeForm);
      setFormFields(populated);
      setPopulationNotice(`Auto-populated with ${activeClient.name}'s information`);
      const timer = setTimeout(() => setPopulationNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [activeClient, activeMatter, activeForm]);

  const handleFieldChange = (key: string, value: string) => {
    setFormFields(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsClientDropdownOpen(false);
  };

  const filteredDropdownClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    const q = clientSearchQuery.toLowerCase();
    return clients.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.practiceArea.toLowerCase().includes(q)
    );
  }, [clients, clientSearchQuery]);

  // Export handling
  const handleExport = (format: 'pdf' | 'docx' | 'print') => {
    const clientFileName = activeClient?.name ? activeClient.name.replace(/\s+/g, '_') : 'Client';
    const fileName = `${activeForm.code}_${clientFileName}.${format === 'docx' ? 'docx' : 'pdf'}`;

    const textContent = `================================================================================
COURT TEMPLATE & LEGAL FILING
TEMPLATE: ${activeForm.code} — ${activeForm.title}
PRACTICE AREA: ${activeForm.practiceArea}
CLIENT: ${formFields.clientFullName}
================================================================================
CAPTION:
${formFields.attorneyName}
${formFields.firmName}
${formFields.attorneyFor}

COURT VENUE & CASE:
Court: ${formFields.courtVenue}
Branch: ${formFields.courtBranch}
Case Number: ${formFields.caseNumber}

PARTIES:
Opposing Party: ${formFields.opposingFullName}
Client / Moving Party: ${formFields.clientFullName}
Address: ${formFields.clientAddress}
Phone: ${formFields.clientPhone}
Email: ${formFields.clientEmail}

SUBSTANTIVE DECLARATION & RELIEF:
Subject: ${formFields.matterTitle}
Relevant Date: ${formFields.dateOfIncidentOrFiling}
Secondary Date: ${formFields.relevantDateSecondary}
Relief Requested: ${formFields.reliefRequested}
Defenses: ${formFields.affirmativeDefenses}

VERIFICATION:
I declare under penalty of perjury that the foregoing is true and correct.
Executed on: ${formFields.declarantDate}
Signed: /s/ ${formFields.declarantSignature}
`;

    if (format === 'print') {
      window.print();
      return;
    }

    if (onAddGeneratedDoc && activeClient) {
      const newDoc: GeneratedDocument = {
        id: `gen-${Date.now()}`,
        clientId: activeClient.id,
        clientName: activeClient.name,
        templateId: activeForm.code,
        title: `${activeForm.code} — ${activeForm.title}`,
        generatedAt: new Date().toLocaleDateString(),
        content: textContent,
        version: 1
      };
      onAddGeneratedDoc(newDoc);
    }

    const blobType = format === 'pdf' ? 'application/pdf' : 'text/plain';
    const blob = new Blob([textContent], { type: blobType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setPopulationNotice(`Saved & downloaded "${fileName}"`);
    setTimeout(() => setPopulationNotice(null), 4000);
  };

  const handleCopyText = () => {
    const summary = `${activeForm.code}: ${activeForm.title}\nClient: ${formFields.clientFullName}\nCase: ${formFields.caseNumber}\nCourt: ${formFields.courtVenue}\nRelief: ${formFields.reliefRequested}`;
    navigator.clipboard.writeText(summary);
    setCopiedStatus('Copied to clipboard');
    setTimeout(() => setCopiedStatus(null), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b14] text-slate-200 overflow-hidden select-text">
      {/* 1. TOP HEADER & MATTER TYPE FILTER BAR */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0d1627] via-[#09101f] to-[#070b14] border-b border-slate-800 shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white font-heading">
                Template & Court Form Library
              </h1>
              <p className="text-xs text-slate-400">
                Filter by matter type, view templates, and select a client to auto-populate.
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 self-start sm:self-center">
            <span className="text-teal-400 font-bold">{filteredTemplates.length}</span> templates available
          </div>
        </div>

        {/* MATTER TYPE FILTER PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-teal-400" />
            <span>Matter Type:</span>
          </span>
          {(['All', 'Family Law', 'Civil Litigation', 'Immigration', 'Bankruptcy', 'General Practice'] as MatterTypeFilter[]).map(type => {
            const count =
              type === 'All'
                ? UNIVERSAL_TEMPLATES.length
                : UNIVERSAL_TEMPLATES.filter(f => f.practiceArea === type).length;
            const isSelected = selectedMatterType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setSelectedMatterType(type);
                  setSelectedSubCategory('All');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>{type}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-teal-950/30 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN SPLIT-VIEW (LEFT: TEMPLATES CATALOG | RIGHT: VIEWER) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: TEMPLATE CATALOG (5 cols) */}
        <div className="lg:col-span-5 border-r border-slate-800 flex flex-col min-h-0 bg-[#090e1a]/80">
          
          {/* Search and Category Row */}
          <div className="p-3 border-b border-slate-800/80 space-y-2 bg-[#080d17]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search templates by title, code, or keyword..."
                className="w-full bg-[#050811] border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 font-sans focus:outline-none focus:border-teal-500/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0">Category:</span>
              <select
                value={selectedSubCategory}
                onChange={e => setSelectedSubCategory(e.target.value)}
                className="bg-[#050811] border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono w-full truncate focus:outline-none focus:border-teal-500/50"
              >
                {availableSubCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TEMPLATE CARDS LIST */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredTemplates.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No templates match your filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMatterType('All');
                    setSelectedSubCategory('All');
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-teal-300 text-xs font-mono"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredTemplates.map(template => {
                const isSelected = selectedFormCode === template.code;
                return (
                  <div
                    key={template.code}
                    onClick={() => setSelectedFormCode(template.code)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-gradient-to-r from-teal-950/40 to-slate-900 border-teal-500/60 shadow-lg shadow-teal-950/30 ring-1 ring-teal-500/30'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                          isSelected
                            ? 'bg-teal-500 text-slate-950'
                            : 'bg-slate-800 text-teal-300 border border-slate-700'
                        }`}
                      >
                        {template.code}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                        {template.practiceArea}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                      {template.title}
                    </h3>

                    <p className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{template.category}</span>
                      <span className="text-teal-400 flex items-center gap-1 font-semibold">
                        <span>{isSelected ? 'Viewing' : 'Open'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: THE TEMPLATE VIEWER & CLIENT AUTO-POPULATION (7 cols) */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-[#090d18] overflow-hidden">
          
          {/* CLIENT SELECTOR BAR */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-teal-950/40 via-[#0a1222] to-slate-900 border-b border-teal-500/20 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              {/* CLIENT DROPDOWN */}
              <div className="relative flex-1">
                <span className="text-[10px] font-mono uppercase font-bold text-teal-400 block mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Select Client to Auto-Populate Template:</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className="w-full bg-[#050811] hover:bg-slate-900 border border-teal-500/40 hover:border-teal-400 rounded-xl px-3.5 py-2 text-left flex items-center justify-between gap-2 transition-all cursor-pointer shadow-md"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0 font-bold text-xs">
                      {activeClient?.name ? activeClient.name.charAt(0) : '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                        <span>{activeClient?.name || 'Select a Client'}</span>
                        {activeClient?.practiceArea && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-800">
                            {activeClient.practiceArea}
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] font-mono text-slate-400 truncate">
                        {activeClient?.address || activeClient?.email || 'No address specified'}
                      </div>
                    </div>
                  </div>

                  <ChevronDown className="w-4 h-4 text-teal-400 shrink-0" />
                </button>

                {/* DROPDOWN MENU */}
                <AnimatePresence>
                  {isClientDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#090e1c] border border-teal-500/40 rounded-2xl shadow-2xl overflow-hidden p-2 space-y-1.5 max-h-80 flex flex-col"
                    >
                      <div className="p-1">
                        <input
                          type="text"
                          value={clientSearchQuery}
                          onChange={e => setClientSearchQuery(e.target.value)}
                          placeholder="Search clients..."
                          className="w-full bg-[#04070e] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-sans focus:outline-none focus:border-teal-500/60"
                          autoFocus
                        />
                      </div>

                      <div className="overflow-y-auto flex-1 space-y-1 max-h-56 pr-1">
                        {filteredDropdownClients.map(c => {
                          const isCurrent = c.id === selectedClientId;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectClient(c.id)}
                              className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                isCurrent
                                  ? 'bg-teal-500/20 text-white border border-teal-500/40'
                                  : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold flex items-center gap-1.5">
                                  <span>{c.name}</span>
                                  <span className="text-[9.5px] font-mono text-slate-400 bg-slate-900 px-1 rounded">
                                    {c.practiceArea}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                                  {c.address || c.email}
                                </div>
                              </div>
                              {isCurrent && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    const populated = buildAutoPopulatedFields(activeClient, activeMatter, activeForm);
                    setFormFields(populated);
                    setPopulationNotice(`Re-populated with ${activeClient?.name || 'Client'}'s data`);
                    setTimeout(() => setPopulationNotice(null), 3000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Re-Populate</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* CONFIRMATION NOTIFICATION */}
            <AnimatePresence>
              {populationNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-2.5 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{populationNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPopulationNotice(null)}
                    className="text-emerald-400 hover:text-white"
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* VIEWER HEADER */}
          <div className="px-4 py-2.5 bg-[#080d19] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
                {activeForm.code}
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-white truncate font-heading">
                {activeForm.title}
              </h2>
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewTab('form')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                  viewTab === 'form'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Form View
              </button>
              <button
                type="button"
                onClick={() => setViewTab('table')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                  viewTab === 'table'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mapped Fields
              </button>
              <button
                type="button"
                onClick={() => setViewTab('text')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                  viewTab === 'text'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pleading Text
              </button>
            </div>
          </div>

          {/* VIEWER BODY */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            
            {/* 1. FORM VIEW */}
            {viewTab === 'form' && (
              <div className="max-w-3xl mx-auto bg-[#0a0f1e] border border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xl">
                
                {/* HEADING */}
                <div className="border-b border-slate-700 pb-3 text-center space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                    COURT PLEADING & FILING TEMPLATE
                  </div>
                  <div className="text-base sm:text-lg font-bold text-white font-heading">
                    {activeForm.code} — {activeForm.title}
                  </div>
                </div>

                {/* CAPTION & COURT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-teal-400 font-bold block">
                      ATTORNEY / PARTY INFORMATION:
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Attorney Name:</span>
                      <input
                        type="text"
                        value={formFields.attorneyName}
                        onChange={e => handleFieldChange('attorneyName', e.target.value)}
                        className="w-full bg-[#050811] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Firm Name:</span>
                      <input
                        type="text"
                        value={formFields.firmName}
                        onChange={e => handleFieldChange('firmName', e.target.value)}
                        className="w-full bg-[#050811] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Attorney For:</span>
                      <input
                        type="text"
                        value={formFields.attorneyFor}
                        onChange={e => handleFieldChange('attorneyFor', e.target.value)}
                        className="w-full bg-[#050811] border border-teal-500/40 rounded-lg px-2.5 py-1 text-xs text-teal-300 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-teal-400 font-bold block">
                      COURT VENUE & DOCKET:
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Court Venue / County:</span>
                      <input
                        type="text"
                        value={formFields.courtVenue}
                        onChange={e => handleFieldChange('courtVenue', e.target.value)}
                        placeholder="Court Jurisdiction"
                        className="w-full bg-[#050811] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Branch Location:</span>
                      <input
                        type="text"
                        value={formFields.courtBranch}
                        onChange={e => handleFieldChange('courtBranch', e.target.value)}
                        placeholder="Branch Venue"
                        className="w-full bg-[#050811] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Case Number:</span>
                      <input
                        type="text"
                        value={formFields.caseNumber}
                        onChange={e => handleFieldChange('caseNumber', e.target.value)}
                        placeholder="Case Docket Number"
                        className="w-full bg-[#050811] border border-teal-500/40 rounded-lg px-2.5 py-1 text-xs text-teal-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* PARTIES */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">OPPOSING PARTY:</span>
                      <input
                        type="text"
                        value={formFields.opposingFullName}
                        onChange={e => handleFieldChange('opposingFullName', e.target.value)}
                        placeholder="Opposing Party Legal Name"
                        className="w-full bg-[#050811] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-teal-400 font-bold block">
                        CLIENT / MOVING PARTY:
                      </span>
                      <input
                        type="text"
                        value={formFields.clientFullName}
                        onChange={e => handleFieldChange('clientFullName', e.target.value)}
                        placeholder="Client Full Legal Name"
                        className="w-full bg-[#050811] border border-teal-500/50 rounded-lg px-2.5 py-1.5 text-xs text-teal-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-[9.5px] font-mono text-slate-400 block">Address:</span>
                      <input
                        type="text"
                        value={formFields.clientAddress}
                        onChange={e => handleFieldChange('clientAddress', e.target.value)}
                        placeholder="Street Address, City, State, Zip"
                        className="w-full bg-[#050811] border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-mono text-slate-400 block">Phone:</span>
                      <input
                        type="text"
                        value={formFields.clientPhone}
                        onChange={e => handleFieldChange('clientPhone', e.target.value)}
                        placeholder="Phone Number"
                        className="w-full bg-[#050811] border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-mono text-slate-400 block">Email:</span>
                      <input
                        type="text"
                        value={formFields.clientEmail}
                        onChange={e => handleFieldChange('clientEmail', e.target.value)}
                        placeholder="Email Address"
                        className="w-full bg-[#050811] border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* SUBSTANTIVE FACTS & RELIEF */}
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono border-b border-slate-800 pb-1">
                    STATEMENT OF FACTS & RELIEF PRAYED
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10.5px] font-mono text-slate-400 block mb-1">
                        Incident / Marriage / Filing Date:
                      </span>
                      <input
                        type="text"
                        value={formFields.dateOfIncidentOrFiling}
                        onChange={e => handleFieldChange('dateOfIncidentOrFiling', e.target.value)}
                        placeholder="Date (YYYY-MM-DD)"
                        className="w-full bg-[#050811] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10.5px] font-mono text-slate-400 block mb-1">
                        Secondary / Separation / Breach Date:
                      </span>
                      <input
                        type="text"
                        value={formFields.relevantDateSecondary}
                        onChange={e => handleFieldChange('relevantDateSecondary', e.target.value)}
                        placeholder="Date (YYYY-MM-DD)"
                        className="w-full bg-[#050811] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10.5px] font-mono text-slate-400 block mb-1">
                      Relief Requested / Claims:
                    </span>
                    <textarea
                      rows={3}
                      value={formFields.reliefRequested}
                      onChange={e => handleFieldChange('reliefRequested', e.target.value)}
                      placeholder="Specify requested relief, orders, or remedies..."
                      className="w-full bg-[#050811] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[10.5px] font-mono text-slate-400 block mb-1">
                      Asserted Defenses:
                    </span>
                    <textarea
                      rows={2}
                      value={formFields.affirmativeDefenses}
                      onChange={e => handleFieldChange('affirmativeDefenses', e.target.value)}
                      placeholder="Affirmative defenses or responsive claims..."
                      className="w-full bg-[#050811] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* SIGNATURE BLOCK */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <p className="text-[10.5px] font-sans text-slate-400 italic">
                    I declare under penalty of perjury that the foregoing is true and correct.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Date:</span>
                      <div className="text-xs font-mono text-white mt-1">
                        {formFields.declarantDate}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-teal-400 block">Signature:</span>
                      <div className="text-xs font-mono font-bold text-teal-300 mt-1">
                        /s/ {formFields.declarantSignature || 'Client Signature'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 2. MAPPED FIELDS TABLE */}
            {viewTab === 'table' && (
              <div className="max-w-3xl mx-auto space-y-3">
                <div className="text-xs font-mono uppercase text-teal-400 font-bold">
                  Mapped Fields for {activeForm.code} ({formFields.clientFullName || 'Selected Client'}):
                </div>

                <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#090e1c]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                      <tr>
                        <th className="p-3">Field</th>
                        <th className="p-3">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {Object.entries(formFields).map(([key, val]) => (
                        <tr key={key} className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-teal-400 w-1/3">{key}</td>
                          <td className="p-3 text-slate-200">{val || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. PLEADING TEXT */}
            {viewTab === 'text' && (
              <div className="max-w-3xl mx-auto space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-teal-400 font-bold">
                    Pleading Text View:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-teal-300 hover:bg-slate-700 text-xs font-mono flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedStatus || 'Copy'}</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-[#04070e] border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
{`================================================================================
${activeForm.code}: ${activeForm.title}
================================================================================
CAPTION:
${formFields.attorneyName}
${formFields.firmName}
${formFields.attorneyFor}

VENUE & CASE:
${formFields.courtVenue} • ${formFields.courtBranch}
Case Number: ${formFields.caseNumber}

PARTIES:
Moving Party / Client: ${formFields.clientFullName}
Opposing Party: ${formFields.opposingFullName}

FACTS & CLAIMS:
${formFields.matterTitle}
Date of Incident / Filing: ${formFields.dateOfIncidentOrFiling}
Relief Requested: ${formFields.reliefRequested}
Defenses: ${formFields.affirmativeDefenses}

Executed on ${formFields.declarantDate}
/s/ ${formFields.declarantSignature}`}
                </div>
              </div>
            )}

          </div>

          {/* BOTTOM ACTIONS */}
          <div className="p-3.5 bg-[#070b14] border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs font-mono text-slate-400">
              Template: {activeForm.code} • Category: {activeForm.category}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExport('print')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={() => handleExport('docx')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Export DOCX</span>
              </button>

              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold text-xs font-heading flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save to File & Download</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TemplateLibraryViewer;
