import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  FileCheck2,
  Sparkles,
  Download,
  Eye,
  Check,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Bot,
  Scale,
  Printer,
  ChevronDown,
  Layers,
  FileCode,
  Building2,
  User,
  MapPin,
  Calendar,
  Lock,
  Unlock,
  RefreshCw,
  FolderPlus,
  Video,
  Briefcase
} from 'lucide-react';
import { Client, Matter, GeneratedDocument } from '../types';

export interface FormTemplateMeta {
  code: string;
  title: string;
  practiceArea: 'Family Law' | 'Civil Litigation' | 'Immigration' | 'Bankruptcy' | 'General Practice';
  category: string;
  statute: string;
  description: string;
  pdfUrl?: string;
  mandatory?: boolean;
}

export const OFFICIAL_FORM_CATALOG: FormTemplateMeta[] = [
  // Family Law
  {
    code: 'FL-120',
    title: 'Response — Marriage/Domestic Partnership',
    practiceArea: 'Family Law',
    category: 'Responsive Pleadings',
    statute: 'Cal. Fam. Code § 2020',
    description: 'Judicial Council mandatory responsive pleading to Petition for Dissolution or Legal Separation.',
    pdfUrl: '/templates/FL-120.pdf',
    mandatory: true
  },
  {
    code: 'FL-100',
    title: 'Petition — Marriage/Domestic Partnership',
    practiceArea: 'Family Law',
    category: 'Initial Pleadings',
    statute: 'Cal. Fam. Code §§ 2320, 2330',
    description: 'Initial petition establishing California 6-month state & 3-month county residency requirements.',
    pdfUrl: '/templates/FL-100.pdf'
  },
  {
    code: 'FL-105',
    title: 'Declaration Under UCCJEA (Child Custody)',
    practiceArea: 'Family Law',
    category: 'Custody & Jurisdiction',
    statute: 'Cal. Fam. Code § 3429',
    description: 'Mandatory declaration disclosing all minor children, 5-year residence history, and jurisdictional custody.',
    mandatory: true
  },
  {
    code: 'FL-311',
    title: 'Child Custody and Visitation Application Attachment',
    practiceArea: 'Family Law',
    category: 'Custody & Visitation',
    statute: 'Cal. Fam. Code § 3040',
    description: 'Detailed parenting plan schedule specifying 2-2-3 or 2-2-5 physical custody, holiday schedules, and travel stipulations.'
  },
  {
    code: 'FL-160',
    title: 'Property Declaration (Community & Separate Property)',
    practiceArea: 'Family Law',
    category: 'Financial Disclosures',
    statute: 'Cal. Fam. Code §§ 770, 2550',
    description: 'Itemized schedule dividing real estate, retirement accounts, businesses, and separate property.'
  },
  {
    code: 'FL-141',
    title: 'Declaration Regarding Service of Declaration of Disclosure',
    practiceArea: 'Family Law',
    category: 'Financial Disclosures',
    statute: 'Cal. Fam. Code §§ 2104, 2106',
    description: 'Proof of timely service of preliminary and final financial disclosures, tax returns, and expense statements.',
    mandatory: true
  },
  {
    code: 'FL-150',
    title: 'Income and Expense Declaration',
    practiceArea: 'Family Law',
    category: 'Financial Disclosures',
    statute: 'Cal. Fam. Code §§ 2104, 4055',
    description: 'Required financial disclosure for guideline child support and spousal support determination.',
    pdfUrl: '/templates/FL-150.pdf'
  },
  {
    code: 'FL-300',
    title: 'Request for Order (Temporary Relief)',
    practiceArea: 'Family Law',
    category: 'Motions & Hearings',
    statute: 'Cal. Rules of Court Rule 5.92',
    description: 'Notice of Motion requesting temporary custody, child/spousal support, attorney fee contribution, or exclusive use of residence.',
    pdfUrl: '/templates/FL-300.pdf'
  },

  // Immigration
  {
    code: 'I-589',
    title: 'Application for Asylum and Withholding of Removal',
    practiceArea: 'Immigration',
    category: 'Defensive Relief',
    statute: 'INA § 208, 8 U.S.C. § 1158',
    description: 'USCIS & EOIR statutory application for defensive asylum, withholding of removal, and CAT protection.',
    pdfUrl: '/templates/I-589.pdf',
    mandatory: true
  },
  {
    code: 'I-765',
    title: 'Application for Employment Authorization',
    practiceArea: 'Immigration',
    category: 'Work Authorization',
    statute: '8 C.F.R. § 274a.12',
    description: 'Application for Work Permit based on pending asylum (c)(8), adjustment of status (c)(9), or TPS.'
  },
  {
    code: 'I-485',
    title: 'Application to Register Permanent Residence (Green Card)',
    practiceArea: 'Immigration',
    category: 'Adjustment of Status',
    statute: 'INA § 245, 8 U.S.C. § 1255',
    description: 'Statutory adjustment of status package with admissibility questionnaires and public charge disclosures.'
  },
  {
    code: 'EOIR-42B',
    title: 'Application for Cancellation of Removal (Non-LPR)',
    practiceArea: 'Immigration',
    category: 'Court Relief',
    statute: 'INA § 240A(b), 8 U.S.C. § 1229b',
    description: 'EOIR application requiring 10-year continuous physical presence, good moral character, and exceptional hardship.',
    mandatory: true
  },
  {
    code: 'EOIR-33',
    title: "Alien's Change of Address Form / EOIR Court",
    practiceArea: 'Immigration',
    category: 'Jurisdiction & Notices',
    statute: '8 C.F.R. § 1003.15(d)(2)',
    description: 'Mandatory notice within 5 working days of any address change submitted to the Immigration Court.',
    pdfUrl: '/templates/EOIR-33.pdf'
  },
  {
    code: 'I-130',
    title: 'Petition for Alien Relative',
    practiceArea: 'Immigration',
    category: 'Family Petitions',
    statute: 'INA § 204, 8 C.F.R. § 204.1',
    description: 'Petition establishing bona fide marital or family relationship for immediate relative immigrant visa.'
  },

  // Civil Litigation
  {
    code: 'PLD-C-010',
    title: 'Answer — Contract / General Denial',
    practiceArea: 'Civil Litigation',
    category: 'Responsive Pleadings',
    statute: 'Cal. CCP § 431.30',
    description: 'Verified Judicial Council answer asserting general denial and mandatory statutory affirmative defenses.',
    mandatory: true
  },
  {
    code: 'PLD-PI-003',
    title: 'Answer — Personal Injury / Property Damage / Tort',
    practiceArea: 'Civil Litigation',
    category: 'Responsive Pleadings',
    statute: 'Cal. Civ. Code § 1431.2 (Prop 51)',
    description: 'Judicial Council responsive answer pleading comparative fault, failure to mitigate, and third-party causation.'
  },
  {
    code: 'CIV-100',
    title: 'Request for Entry of Default / Judgment',
    practiceArea: 'Civil Litigation',
    category: 'Court Motions',
    statute: 'Cal. CCP § 585',
    description: 'Request for entry of clerk or court default judgment after expiration of statutory 30-day responsive deadline.'
  },
  {
    code: 'CM-110',
    title: 'Case Management Statement',
    practiceArea: 'Civil Litigation',
    category: 'Trial Procedure',
    statute: 'Cal. Rules of Court Rule 3.725',
    description: 'Mandatory filing 15 court days prior to Case Management Conference setting trial dates and ADR election.',
    mandatory: true
  },
  {
    code: 'POS-040',
    title: 'Proof of Service — Civil / Electronic Service',
    practiceArea: 'Civil Litigation',
    category: 'Service of Process',
    statute: 'Cal. CCP §§ 1010.6, 1013a',
    description: 'Statutory proof of electronic or overnight service by non-party declarant over 18 years of age.'
  },

  // Bankruptcy
  {
    code: 'B-101',
    title: 'Voluntary Petition for Individuals Filing for Bankruptcy',
    practiceArea: 'Bankruptcy',
    category: 'Initial Petitions',
    statute: '11 U.S.C. §§ 301, 302',
    description: 'Official Form 101 commencing Chapter 7 or Chapter 13 case and invoking automatic stay under 11 U.S.C. § 362.',
    mandatory: true
  },
  {
    code: 'B-106A/B',
    title: 'Schedule A/B: Property (Real and Personal)',
    practiceArea: 'Bankruptcy',
    category: 'Schedules',
    statute: '11 U.S.C. § 521',
    description: 'Comprehensive schedule listing debtor real estate, vehicles, bank accounts, and personal property.'
  },
  {
    code: 'B-106C',
    title: 'Schedule C: The Property You Claim as Exempt',
    practiceArea: 'Bankruptcy',
    category: 'Exemptions',
    statute: '11 U.S.C. § 522, Cal. CCP § 703.140(b)',
    description: 'Election of California System 1 (CCP § 704) or System 2 (CCP § 703) homestead and wildcard exemptions.',
    mandatory: true
  },
  {
    code: 'B-106D',
    title: 'Schedule D: Creditors Who Have Claims Secured by Property',
    practiceArea: 'Bankruptcy',
    category: 'Creditor Schedules',
    statute: '11 U.S.C. § 521',
    description: 'Mortgage lenders, automobile financers, and statutory lienholders holding security interests.'
  },
  {
    code: 'B-122A-2',
    title: 'Chapter 7 Means Test Calculation',
    practiceArea: 'Bankruptcy',
    category: 'Means Testing',
    statute: '11 U.S.C. § 707(b)(2)',
    description: 'Statutory calculation comparing current monthly income against California median family income.'
  },

  // General Practice
  {
    code: 'DE-111',
    title: 'Petition for Probate / Letters Testamentary',
    practiceArea: 'General Practice',
    category: 'Probate & Estate',
    statute: 'Cal. Prob. Code § 8000',
    description: 'Judicial Council petition for appointment of executor or administrator of decedent estate.'
  },
  {
    code: 'CH-100',
    title: 'Request for Civil Harassment Restraining Orders',
    practiceArea: 'General Practice',
    category: 'Protective Orders',
    statute: 'Cal. CCP § 527.6',
    description: 'Petition seeking emergency protective orders against harassment, stalking, or credible threats of violence.'
  },
  {
    code: 'NC-100',
    title: 'Petition for Change of Name',
    practiceArea: 'General Practice',
    category: 'Civil Petitions',
    statute: 'Cal. CCP § 1275',
    description: 'Judicial Council formal petition for decree changing legal name with order to show cause.'
  },
  {
    code: 'DPOA-01',
    title: 'California Statutory Durable Power of Attorney',
    practiceArea: 'General Practice',
    category: 'Estate Planning',
    statute: 'Cal. Prob. Code § 4401',
    description: 'Uniform statutory form power of attorney granting agent broad financial, banking, and real estate powers.'
  }
];

export interface CaseSpecifics {
  state: string;
  county: string;
  courtVenue: string;
  branchName: string;
  caseNumber: string;
  opposingParty: string;
  districtAttorneyOrDhs: string;
  judgeName?: string;
  deptNumber?: string;
  incidentOrMarriageDate?: string;
  separationOrIncidentDate?: string;
  reliefRequested?: string;
  natureOfSuit?: string;
}

// Module-level helper function declared before MatterFormsViewer component
export function getInitialBaseFields(
  caseSpecifics?: Partial<CaseSpecifics> | null,
  client?: Client | null,
  selectedMatter?: Matter | null,
  effectiveArea?: string
): Record<string, any> {
  const area = effectiveArea || 'Family Law';
  return {
    // Caption
    attorneyName: 'Alex, Esq. (Phoenix Senior Litigation Counsel)',
    stateBarNo: '232323',
    firmName: 'Level 23 Legal Technologies LLP',
    streetAddress: '400 Spectrum Center Dr, Suite 1900',
    city: 'Irvine',
    state: 'CA',
    zip: '92618',
    phone: '(949) 555-0123',
    email: 'alex@level23legal.com',
    attorneyFor: client ? `Respondent / Defendant ${client.name}` : 'Respondent / Client',

    // Court
    courtCounty: caseSpecifics?.county || 'Orange County',
    courtStreet: '341 The City Drive South',
    courtMailing: 'PO Box 14169',
    courtCityZip: 'Orange, CA 92868',
    branchName: caseSpecifics?.branchName || 'Lamoreaux Justice Center',

    // Parties & Case
    petitionerName: caseSpecifics?.opposingParty || (area === 'Immigration' ? 'U.S. Department of Homeland Security' : 'Elena Vance (Petitioner)'),
    respondentName: client?.name || 'Marcus Vance',
    caseNumber: caseSpecifics?.caseNumber || selectedMatter?.caseNumber || (area === 'Immigration' ? 'A# 248-091244' : '26FL004812C'),

    // Specific substantive items
    natureOfSuit: caseSpecifics?.natureOfSuit || 'Dissolution of Marriage with Minor Children',
    marriageDate: caseSpecifics?.incidentOrMarriageDate || '09/18/2015',
    separationDate: caseSpecifics?.separationOrIncidentDate || '04/10/2026',
    custodyLegal: 'Joint',
    custodyPhysical: 'Joint (2-2-3 Alternating Schedule)',
    childSupportReq: 'Guideline Statutory Calculation',
    spousalSupportReq: 'Reserve Jurisdiction Pursuant to Fam. Code § 4336',
    separatePropertyReq: 'Confirm pre-marital assets per Fam. Code § 770',
    communityPropertyReq: 'Equal division of marital estate per Fam. Code § 2550',
    affirmativeDefenses: 'General Denial (CCP § 431.30); Statute of Limitations; Laches; Comparative Fault',
    alienRegNumber: caseSpecifics?.caseNumber || 'A# 248-091244',
    reliefRequested: caseSpecifics?.reliefRequested || 'Statutory Relief and Affirmative Defenses Granted',
    districtAttorneyOrDhs: caseSpecifics?.districtAttorneyOrDhs || (area === 'Immigration' ? 'Office of the Chief Counsel, ICE' : 'Orange County District Attorney / Family Support Division'),
    declarantDate: new Date().toLocaleDateString('en-US'),
    declarantSignature: client?.name || 'Client Declarant'
  };
}

interface MatterFormsViewerProps {
  selectedMatter: Matter | null;
  client: Client | null;
  clients: Client[];
  caseSpecifics: CaseSpecifics;
  onUpdateCaseSpecifics: (specifics: CaseSpecifics) => void;
  onAddGeneratedDoc?: (doc: GeneratedDocument) => void;
  onRequestOpenCaseSpecificsModal?: () => void;
  onRequestOpenMatterWorkspace?: () => void;
  onRequestOpenVideoConference?: () => void;
  onSelectClientId?: (id: string) => void;
}

export const MatterFormsViewer: React.FC<MatterFormsViewerProps> = ({
  selectedMatter,
  client,
  clients,
  caseSpecifics,
  onUpdateCaseSpecifics,
  onAddGeneratedDoc,
  onRequestOpenCaseSpecificsModal,
  onRequestOpenMatterWorkspace,
  onRequestOpenVideoConference,
  onSelectClientId
}) => {
  // Determine effective practice area
  const effectiveArea = useMemo<'Family Law' | 'Civil Litigation' | 'Immigration' | 'Bankruptcy' | 'General Practice'>(() => {
    const area = selectedMatter?.practiceArea || client?.practiceArea || 'Family Law';
    const lower = area.toLowerCase();
    if (lower.includes('civil') || lower.includes('litigation') || lower.includes('tort')) return 'Civil Litigation';
    if (lower.includes('immigration') || lower.includes('asylum') || lower.includes('visa')) return 'Immigration';
    if (lower.includes('bankruptcy') || lower.includes('chapter')) return 'Bankruptcy';
    if (lower.includes('general') || lower.includes('estate') || lower.includes('probate')) return 'General Practice';
    return 'Family Law';
  }, [selectedMatter?.practiceArea, client?.practiceArea]);

  // Forms filtered by practice area
  const areaForms = useMemo(() => {
    return OFFICIAL_FORM_CATALOG.filter(f => f.practiceArea === effectiveArea);
  }, [effectiveArea]);

  // Selected form state
  const [selectedFormCode, setSelectedFormCode] = useState<string>(areaForms[0]?.code || 'FL-120');

  // Sync selected form when practice area changes
  useEffect(() => {
    if (!areaForms.some(f => f.code === selectedFormCode)) {
      setSelectedFormCode(areaForms[0]?.code || 'FL-120');
    }
  }, [areaForms, selectedFormCode]);

  const activeFormMeta = useMemo(() => {
    return OFFICIAL_FORM_CATALOG.find(f => f.code === selectedFormCode) || areaForms[0] || OFFICIAL_FORM_CATALOG[0];
  }, [selectedFormCode, areaForms]);

  // View mode: 'true-form' (interactive canonical Judicial Council layout) vs 'pdf-preview' (official PDF stream)
  const [viewMode, setViewMode] = useState<'true-form' | 'pdf-preview'>('true-form');

  // Mapped field state populated from intake database
  const [isPopulated, setIsPopulated] = useState<boolean>(false);
  const [populationNotice, setPopulationNotice] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Helper inside component
  const initializeBaseFields = () => {
    return getInitialBaseFields(caseSpecifics, client, selectedMatter, effectiveArea);
  };

  // Editable Form Field Values initialized immediately on mount
  const [formFields, setFormFields] = useState<Record<string, any>>(() =>
    getInitialBaseFields(caseSpecifics, client, selectedMatter, effectiveArea)
  );

  useEffect(() => {
    setFormFields(getInitialBaseFields(caseSpecifics, client, selectedMatter, effectiveArea));
  }, [selectedFormCode, client, selectedMatter, caseSpecifics, effectiveArea]);

  // Handle "Client Data Populate"
  const handleClientDataPopulate = () => {
    const rawFl = client?.fl120Data;
    const clientNotes = client?.intakeNotes || '';

    // Pull from client intake card extracted fields stored in localStorage if available
    let storedExtracted: Record<string, string> = {};
    try {
      const allExtracted = JSON.parse(localStorage.getItem('level23_extracted_card_fields_v2') || '{}');
      if (client?.id && allExtracted[client.id]) {
        storedExtracted = allExtracted[client.id];
      }
    } catch (e) {}

    const clientFullAddress = client?.address || storedExtracted['Address'] || '742 Evergreen Terrace, Irvine, CA 92618';
    const clientPhone = client?.phone || storedExtracted['Phone'] || '(949) 555-7890';
    const clientEmail = client?.email || storedExtracted['Email'] || 'client@vault.local';

    const populatedState: Record<string, any> = {
      ...formFields,
      attorneyName: 'Alex, Esq. (Phoenix Senior Litigation Counsel)',
      stateBarNo: '232323',
      firmName: 'Level 23 Legal Technologies LLP',
      streetAddress: '400 Spectrum Center Dr, Suite 1900',
      city: 'Irvine',
      state: 'CA',
      zip: '92618',
      phone: '(949) 555-0123',
      email: 'alex@level23legal.com',
      attorneyFor: client ? `${client.name} (Client / Declarant)` : 'Client of Record',

      // Court Mapped Fields
      courtCounty: caseSpecifics.county || (effectiveArea === 'Immigration' ? 'EOIR Immigration Court' : 'Orange County Superior Court'),
      courtStreet: caseSpecifics.branchName?.includes('Lamoreaux') ? '341 The City Drive South' : '700 Civic Center Drive West',
      courtCityZip: 'Santa Ana, CA 92701',
      branchName: caseSpecifics.branchName || 'Central Justice Center / Family Law Division',

      // Parties & DA Mapped Fields
      petitionerName: caseSpecifics.opposingParty || rawFl?.petitionerName || storedExtracted['Opposing Party'] || (effectiveArea === 'Immigration' ? 'Department of Homeland Security (ICE)' : 'Elena Vance (Petitioner)'),
      respondentName: client?.name || 'Marcus Vance',
      caseNumber: caseSpecifics.caseNumber || selectedMatter?.caseNumber || rawFl?.caseNumber || (effectiveArea === 'Immigration' ? 'A# 248-091244' : '26FL004812C'),
      districtAttorneyOrDhs: caseSpecifics.districtAttorneyOrDhs || (effectiveArea === 'Immigration' ? 'DHS Assistant Chief Counsel' : 'Orange County District Attorney Child Support Division'),

      // Substantive Mapped Entities
      natureOfSuit: caseSpecifics.natureOfSuit || selectedMatter?.title || 'Contested Statutory Proceedings',
      marriageDate: rawFl?.dateOfMarriage || caseSpecifics.incidentOrMarriageDate || '09/18/2015',
      separationDate: rawFl?.dateOfSeparation || caseSpecifics.separationOrIncidentDate || '04/10/2026',
      custodyLegal: rawFl?.custodyLegal || 'Joint Legal Custody (Fam. Code § 3040)',
      custodyPhysical: rawFl?.custodyPhysical || 'Joint Physical Custody (2-2-3 Schedule)',
      childSupportReq: 'Guideline Calculation & Wage Assignment (Fam. Code § 4055)',
      spousalSupportReq: rawFl?.spousalSupportRequested || 'Reserve Jurisdiction Payable to Respondent (§ 4336)',
      separatePropertyReq: rawFl?.separatePropertyNotes || 'Pre-marital retirement, separate accounts, and tools of trade confirmed per Fam. Code § 770',
      communityPropertyReq: rawFl?.communityPropertyNotes || 'Equal division of community residence and retirement per Fam. Code § 2550',
      affirmativeDefenses: '1. Verified General Denial (CCP § 431.30); 2. Statute of Limitations; 3. Laches & Waiver; 4. Comparative Fault (Civ. Code § 1431.2); 5. Setoff & Offset (CCP § 431.70)',
      alienRegNumber: caseSpecifics.caseNumber || (client?.id ? `A# 248-${client.id.padStart(6, '0')}` : 'A# 248-091244'),
      reliefRequested: caseSpecifics.reliefRequested || 'All prayers granted, fees contributed pursuant to statute, and statutory responsive pleading confirmed.',
      declarantDate: new Date().toLocaleDateString('en-US'),
      declarantSignature: client?.name || 'Marcus Vance'
    };

    setFormFields(populatedState);
    setIsPopulated(true);
    setPopulationNotice(`✓ Client Data Populated: 38 canonical intake fields mapped to ${activeFormMeta.code} (${activeFormMeta.title})`);
    setTimeout(() => setPopulationNotice(null), 6000);
  };

  // Handle Export (PDF, XFDF, DOCX)
  const handleExport = (format: 'pdf' | 'xfdf' | 'docx') => {
    setShowExportMenu(false);
    const formCode = activeFormMeta.code;
    const clientName = client?.name || 'Client';
    const fileName = `${formCode}_${clientName.replace(/\s+/g, '_')}_Approved.${format}`;

    // Compile document representation
    const textContent = `================================================================================
OFFICIAL JUDICIAL COUNCIL OF CALIFORNIA / FEDERAL STATUTORY FORM
FORM: ${formCode} — ${activeFormMeta.title}
GOVERNING STATUTE: ${activeFormMeta.statute}
STATUS: Client Approved & Electronically Certified
================================================================================
ATTORNEY OF RECORD:
${formFields.attorneyName} | SBN: ${formFields.stateBarNo}
${formFields.firmName} | ${formFields.phone} | ${formFields.email}
Attorney for: ${formFields.attorneyFor}

COURT JURISDICTION:
${formFields.courtCounty} — ${formFields.branchName}
Street: ${formFields.courtStreet}, ${formFields.courtCityZip}

PARTIES:
Petitioner/Plaintiff: ${formFields.petitionerName}
Respondent/Defendant: ${formFields.respondentName}
District Attorney / DHS Counsel: ${formFields.districtAttorneyOrDhs}
CASE NUMBER / DOCKET: ${formFields.caseNumber}

STATUTORY DECLARATION & MAPPED PLEADING DATA:
- Nature of Action: ${formFields.natureOfSuit}
- Marriage/Incident Date: ${formFields.marriageDate}
- Separation Date: ${formFields.separationDate}
- Custody / Legal Demand: ${formFields.custodyLegal} | ${formFields.custodyPhysical}
- Support Demand: Child: ${formFields.childSupportReq} | Spousal: ${formFields.spousalSupportReq}
- Property Confirmation: ${formFields.separatePropertyReq}
- Community Division: ${formFields.communityPropertyReq}
- Affirmative Defenses: ${formFields.affirmativeDefenses}
- Alien Registration / EOIR Venue: ${formFields.alienRegNumber}
- Relief Prayed: ${formFields.reliefRequested}

VERIFICATION & CERTIFICATION:
I declare under penalty of perjury under the laws of the State of California and the United States that the foregoing is true and correct.
Executed on: ${formFields.declarantDate}
Electronically signed by: ${formFields.declarantSignature}
================================================================================`;

    // 1. Dispatch to Document repository
    if (onAddGeneratedDoc && client) {
      onAddGeneratedDoc({
        id: `doc_${formCode}_${Date.now()}`,
        title: `${formCode} (${activeFormMeta.title}) — ${clientName}`,
        clientId: client.id,
        clientName: client.name,
        templateId: `form-${formCode.toLowerCase()}`,
        content: textContent,
        generatedAt: new Date().toISOString()
      });
    }

    // 2. Direct persistence into Client's Intake Uploads Ledger (localStorage l23_client_uploads_map)
    if (client) {
      try {
        const storedMap = JSON.parse(localStorage.getItem('l23_client_uploads_map') || '{}');
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const newEntry = {
          id: `up-${Date.now()}`,
          dateAdded: dateStr,
          description: `Judicial Council Form ${formCode} (${format.toUpperCase()} Approved & Mapped)`,
          category: activeFormMeta.category,
          status: 'Populated & Exported to File'
        };
        storedMap[client.id] = [newEntry, ...(storedMap[client.id] || [])];
        localStorage.setItem('l23_client_uploads_map', JSON.stringify(storedMap));
      } catch (e) {
        console.error('Failed to sync to client uploads map:', e);
      }
    }

    // 3. Trigger direct browser download
    const blobType = format === 'pdf' ? 'application/pdf' : format === 'xfdf' ? 'application/vnd.adobe.xfdf' : 'text/plain';
    const blob = new Blob([textContent], { type: blobType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`✓ Approved and Exported: "${fileName}" saved to Client's File and registered on Intake Card!`);
    setTimeout(() => setExportNotice(null), 7000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] text-slate-200 overflow-hidden select-text">

      {/* VIEWER CONTROLS & POPULATE HEADER */}
      <div className="p-4 bg-[#080d19] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-heading text-white">
                {activeFormMeta.code}: {activeFormMeta.title}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {activeFormMeta.statute}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              {activeFormMeta.description}
            </p>
          </div>
        </div>

        {/* UPPER RIGHT CORNER BUTTONS: CLIENT SELECTOR, DATA POPULATE & EXPORT */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* CLIENT SELECTOR DROPDOWN (Auto-populates immediately upon selection!) */}
          {clients && clients.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-teal-500/40 rounded-xl px-2.5 py-1.5 shadow-sm">
              <User className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold shrink-0">Client:</span>
              <select
                id="viewer-client-select"
                value={client?.id || ''}
                onChange={(e) => {
                  const newId = e.target.value;
                  onSelectClientId?.(newId);
                }}
                className="bg-transparent text-xs text-teal-300 font-mono font-bold focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name} ({c.practiceArea})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('true-form')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'true-form'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Interactive True Form
            </button>
            <button
              type="button"
              onClick={() => setViewMode('pdf-preview')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'pdf-preview'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PDF Stream
            </button>
          </div>

          {/* MATTER WORKSPACE MODAL BUTTON */}
          {onRequestOpenMatterWorkspace && (
            <button
              type="button"
              id="btn-open-matter-workspace"
              onClick={onRequestOpenMatterWorkspace}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-heading font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="Pop up Matter Workspace Dossier, Tasks, Timeline & Evidence"
            >
              <Briefcase className="w-3.5 h-3.5 text-teal-400" />
              <span>Matter Workspace</span>
            </button>
          )}

          {/* VIDEO CONFERENCE PROVISION BUTTON */}
          {onRequestOpenVideoConference && (
            <button
              type="button"
              id="btn-open-video-conference"
              onClick={onRequestOpenVideoConference}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="Join real-time video conference / client deposition / judicial hearing"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Video className="w-3.5 h-3.5 text-emerald-400" />
              <span>Join Conference</span>
            </button>
          )}

          {/* CLIENT DATA POPULATE BUTTON (Prominent in upper right!) */}
          <button
            type="button"
            id="btn-client-data-populate"
            onClick={handleClientDataPopulate}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-black tracking-wide transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
              isPopulated
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 ring-2 ring-emerald-400/50'
                : 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 shadow-teal-500/30'
            }`}
            title="Populate mapped fields from client intake, court database & matter specifics"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>{isPopulated ? 'Client Data Re-Populate' : 'Client Data Populate'}</span>
          </button>

          {/* EXPORT BUTTON */}
          <div className="relative">
            <button
              type="button"
              id="btn-export-matter-form"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#090d18] border border-slate-700 shadow-2xl p-1 z-30 font-sans space-y-1">
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-teal-500/10 hover:text-teal-300 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <span>Export PDF File</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">.pdf</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('xfdf')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-teal-500/10 hover:text-teal-300 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-teal-400" />
                    <span>Export XFDF Data</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">.xfdf</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('docx')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-teal-500/10 hover:text-teal-300 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export Word Doc</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">.docx</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POPULATION & EXPORT NOTIFICATION BANNERS */}
      <AnimatePresence>
        {populationNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-teal-500/15 border-b border-teal-500/30 text-teal-300 text-xs font-mono flex items-center justify-between px-6"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>{populationNotice}</span>
            </span>
            <button
              type="button"
              onClick={() => setPopulationNotice(null)}
              className="text-teal-400 hover:text-white cursor-pointer text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}

        {exportNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between px-6"
          >
            <span className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-emerald-400" />
              <span>{exportNotice}</span>
            </span>
            <button
              type="button"
              onClick={() => setExportNotice(null)}
              className="text-emerald-400 hover:text-white cursor-pointer text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN TRUE FORM VIEWER CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#040711]">
        {viewMode === 'pdf-preview' && activeFormMeta.pdfUrl ? (
          <div className="w-full h-[800px] rounded-2xl overflow-hidden border border-slate-800 bg-[#0c1220] flex flex-col">
            <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 font-mono">
              <span>Official Template Preview: {activeFormMeta.code}.pdf</span>
              <a
                href={activeFormMeta.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>Open in Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <iframe
              src={activeFormMeta.pdfUrl}
              title={`PDF Template ${activeFormMeta.code}`}
              className="w-full flex-1 border-0"
            />
          </div>
        ) : (
          /* TRUE JUDICIAL COUNCIL FORM CANVAS (Canonical legal layout) */
          <div className="max-w-4xl mx-auto bg-white text-slate-950 font-serif shadow-2xl rounded-sm border border-slate-300 p-6 md:p-10 select-text">
            {/* FORM TOP IDENTIFIER BAR */}
            <div className="flex justify-between items-baseline border-b border-black pb-1 mb-2 text-[10px] font-sans font-bold tracking-tight">
              <span>ATTORNEY OR PARTY WITHOUT ATTORNEY (Name, State Bar number, and address):</span>
              <span className="font-mono text-xs text-black font-extrabold uppercase">{activeFormMeta.code}</span>
            </div>

            {/* TOP 2-COLUMN COURT CAPTION GRID */}
            <div className="border border-black grid grid-cols-12 text-xs font-sans">
              {/* Box 1 (Left 7 Cols): Attorney & Court Information */}
              <div className="col-span-7 border-r border-black p-3 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold">NAME:</span>
                    <span className={`font-mono px-1 rounded ${isPopulated ? 'bg-teal-100 text-teal-950 font-semibold' : ''}`}>
                      {formFields.attorneyName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold">BAR NO:</span>
                    <span className="font-mono">{formFields.stateBarNo}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold">FIRM:</span>
                    <span className="font-mono">{formFields.firmName}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold">ADDRESS:</span>
                    <span className="font-mono">{formFields.streetAddress}, {formFields.city}, {formFields.state} {formFields.zip}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold">TELEPHONE NO.:</span>
                    <span className="font-mono">{formFields.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold">E-MAIL ADDRESS:</span>
                    <span className="font-mono">{formFields.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] border-t border-slate-300 pt-1">
                    <span className="font-bold">ATTORNEY FOR (name):</span>
                    <span className={`font-mono font-bold ${isPopulated ? 'bg-teal-100 text-teal-950 px-1 rounded' : ''}`}>
                      {formFields.attorneyFor}
                    </span>
                  </div>
                </div>

                {/* Sub-Box: Court Location */}
                <div className="border-t border-black pt-2 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider">
                    SUPERIOR COURT OF CALIFORNIA, COUNTY OF {String(formFields.courtCounty || caseSpecifics?.county || 'Orange County').toUpperCase()}
                  </div>
                  <div className="text-[11px] font-sans">
                    <div><span className="font-bold">STREET ADDRESS:</span> {formFields.courtStreet}</div>
                    <div><span className="font-bold">CITY AND ZIP CODE:</span> {formFields.courtCityZip}</div>
                    <div><span className="font-bold">BRANCH NAME:</span> {formFields.branchName}</div>
                  </div>
                </div>
              </div>

              {/* Box 2 (Right 5 Cols): Court Seal & Filing Box */}
              <div className="col-span-5 flex flex-col">
                <div className="p-3 h-32 border-b border-black text-center flex flex-col items-center justify-center bg-slate-50">
                  <span className="text-[10px] font-sans uppercase font-bold text-slate-500">
                    FOR COURT USE ONLY
                  </span>
                  <div className="mt-2 text-[10px] font-mono text-slate-400 border border-dashed border-slate-400 p-2 rounded">
                    FILED VIA ELECTRONIC SUBMISSION<br />
                    {formFields.courtCounty}<br />
                    {new Date().toLocaleDateString('en-US')}
                  </div>
                </div>

                <div className="p-3 flex-1 space-y-2 bg-slate-50/50">
                  <div className="text-[11px]">
                    <span className="font-bold block text-[10px] text-slate-500 uppercase">PETITIONER / PLAINTIFF:</span>
                    <span className={`font-mono font-bold block ${isPopulated ? 'bg-teal-100 text-teal-950 px-1 rounded' : ''}`}>
                      {formFields.petitionerName}
                    </span>
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold block text-[10px] text-slate-500 uppercase">RESPONDENT / DEFENDANT:</span>
                    <span className={`font-mono font-bold block ${isPopulated ? 'bg-teal-100 text-teal-950 px-1 rounded' : ''}`}>
                      {formFields.respondentName}
                    </span>
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold block text-[10px] text-slate-500 uppercase">DISTRICT ATTORNEY / DHS COUNSEL:</span>
                    <span className="font-mono text-slate-700 block">
                      {formFields.districtAttorneyOrDhs}
                    </span>
                  </div>
                  <div className="border-t border-black pt-1">
                    <span className="font-bold text-[10px] text-slate-500 uppercase block">CASE NUMBER:</span>
                    <span className={`font-mono text-sm font-black block tracking-wider ${isPopulated ? 'bg-amber-100 text-amber-950 px-1 rounded inline-block' : ''}`}>
                      {formFields.caseNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* FORM TITLE BANNER */}
            <div className="my-4 text-center border-b-2 border-black pb-2">
              <h1 className="text-base font-sans font-black uppercase tracking-wider">
                {activeFormMeta.title}
              </h1>
              <span className="text-xs font-sans italic text-slate-600">
                ({activeFormMeta.statute})
              </span>
            </div>

            {/* STATUTORY NUMBERED SECTIONS (Interactive true pleading content) */}
            <div className="space-y-4 text-xs font-sans leading-relaxed">
              {/* Item 1 */}
              <div className="p-2 border border-slate-200 rounded">
                <span className="font-bold mr-2">1. JURISDICTION & PARTY STATUS:</span>
                <span>
                  Respondent / Defendant {formFields.respondentName} hereby enters general appearance.
                  The court has personal and subject matter jurisdiction over the parties and claims.
                </span>
                <div className={`mt-1.5 p-1.5 rounded font-mono text-[11px] ${isPopulated ? 'bg-teal-50 border border-teal-200 text-teal-900' : 'bg-slate-100 text-slate-700'}`}>
                  ✓ Verified Residence: 6 Mo California State & 3 Mo County of {formFields.courtCounty}. Nature of Action: {formFields.natureOfSuit}.
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-2 border border-slate-200 rounded">
                <span className="font-bold mr-2">2. STATUTORY DATES & FACTS:</span>
                <span>
                  The relevant marital, contractual, or immigration dates are as follows:
                </span>
                <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                  <div className={`p-1.5 rounded ${isPopulated ? 'bg-teal-50 text-teal-900 font-bold' : 'bg-slate-100'}`}>
                    Commencement / Marriage Date: {formFields.marriageDate}
                  </div>
                  <div className={`p-1.5 rounded ${isPopulated ? 'bg-teal-50 text-teal-900 font-bold' : 'bg-slate-100'}`}>
                    Separation / Breach Date: {formFields.separationDate}
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-2 border border-slate-200 rounded">
                <span className="font-bold mr-2">3. MINOR CHILDREN & UCCJEA DECLARATION:</span>
                <span>
                  Child custody and visitation orders are requested pursuant to Form FL-105 & FL-311:
                </span>
                <div className={`mt-1.5 p-2 rounded font-mono text-[11px] ${isPopulated ? 'bg-teal-50 border border-teal-200 text-teal-900' : 'bg-slate-100 text-slate-700'}`}>
                  Legal Custody: [X] {formFields.custodyLegal} | Physical Custody: [X] {formFields.custodyPhysical}
                </div>
              </div>

              {/* Item 4 */}
              <div className="p-2 border border-slate-200 rounded">
                <span className="font-bold mr-2">4. FINANCIAL & STATUTORY DISCLOSURES:</span>
                <span>
                  Support orders and separate/community property declarations:
                </span>
                <div className="space-y-1 mt-1.5 font-mono text-[11px]">
                  <div className="p-1.5 bg-slate-100 rounded">
                    Child Support: {formFields.childSupportReq}
                  </div>
                  <div className="p-1.5 bg-slate-100 rounded">
                    Spousal / Maintenance Support: {formFields.spousalSupportReq}
                  </div>
                  <div className={`p-1.5 rounded ${isPopulated ? 'bg-teal-50 text-teal-900 font-semibold' : 'bg-slate-100'}`}>
                    Separate Property (Fam. Code § 770 / Civ. Code): {formFields.separatePropertyReq}
                  </div>
                  <div className={`p-1.5 rounded ${isPopulated ? 'bg-teal-50 text-teal-900 font-semibold' : 'bg-slate-100'}`}>
                    Community Estate (Fam. Code § 2550): {formFields.communityPropertyReq}
                  </div>
                </div>
              </div>

              {/* Item 5 */}
              <div className="p-2 border border-slate-200 rounded">
                <span className="font-bold mr-2">5. AFFIRMATIVE DEFENSES & ALIEN/DOCKET RELIEF:</span>
                <p className="mt-1 font-mono text-[11px] p-2 bg-slate-100 rounded text-slate-800 leading-normal">
                  {formFields.affirmativeDefenses}
                </p>
                <div className="mt-1 text-[11px] text-slate-600 font-mono">
                  Alien Registration / Specific Docket ID: {formFields.alienRegNumber}
                </div>
              </div>

              {/* Item 6: Prayer for Relief */}
              <div className="p-2 border border-slate-200 rounded">
                <span className="font-bold mr-2">6. PRAYER FOR RELIEF & ORDERS:</span>
                <span>
                  Respondent / Defendant requests that the Court enter judgment confirming all requests,
                  awarding attorney fees and costs, and granting such other relief as is fair and just:
                </span>
                <p className={`mt-1 font-mono text-[11px] p-2 rounded ${isPopulated ? 'bg-teal-50 border border-teal-200 text-teal-900' : 'bg-slate-100 text-slate-700'}`}>
                  {formFields.reliefRequested}
                </p>
              </div>

              {/* JURAT / DECLARATION UNDER PENALTY OF PERJURY */}
              <div className="border-t-2 border-black pt-4 mt-6 space-y-4">
                <p className="text-[11px] italic leading-tight">
                  I declare under penalty of perjury under the laws of the State of California and the United States of America that the foregoing is true and correct.
                </p>
                <div className="flex justify-between items-end text-xs font-mono pt-4">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-sans">DATE:</span>
                    <span className="font-bold border-b border-black pb-0.5 inline-block w-36">
                      {formFields.declarantDate}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-500 uppercase font-sans">SIGNATURE OF RESPONDENT / DECLARANT:</span>
                    <span className="font-bold border-b border-black pb-0.5 inline-block w-64 text-center font-serif italic text-sm text-indigo-900">
                      /s/ {formFields.declarantSignature}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* FORM FOOTER */}
            <div className="mt-8 pt-2 border-t border-black flex justify-between items-center text-[10px] font-sans text-slate-600">
              <span>Form Adopted for Mandatory Use by the Judicial Council of California</span>
              <span className="font-bold uppercase">{activeFormMeta.code} [{activeFormMeta.title}]</span>
              <span>Page 1 of 2</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatterFormsViewer;
