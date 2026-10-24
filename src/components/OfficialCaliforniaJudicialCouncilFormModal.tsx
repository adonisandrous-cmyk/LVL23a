import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Scale,
  FileCheck2,
  FileText,
  Download,
  Copy,
  Check,
  CheckCircle2,
  RefreshCw,
  FolderPlus,
  Printer,
  ShieldCheck,
  FileCode,
  Calendar,
  User,
  Building2,
  MapPin,
  Send,
  Eye,
  Sliders,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Client, GeneratedDocument } from '../types';

export interface OfficialCaliforniaJudicialCouncilFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  clients?: Client[];
  initialFormCode?: 'FL-120' | 'FL-105' | 'FL-311' | 'FL-160' | 'FL-141' | string;
  onAddGeneratedDoc?: (doc: GeneratedDocument) => void;
  onExportToDrive?: (fileName: string, content: string, format: 'docx' | 'pdf') => void;
}

export interface FormValidationError {
  fieldKey: 'Court_CaseNumber' | 'Client_LastName' | 'Court_County' | 'Declarant_Name' | string;
  label: string;
  message: string;
}

export interface FL141FieldState {
  // Client Identity (4-Part Canonical Intake Mapping)
  clientFirstName: string;
  clientLastName: string;

  // Caption & Attorney / Party Without Attorney
  attorneyName: string;
  stateBarNo: string;
  firmName: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  fax: string;
  email: string;
  attorneyFor: string;

  // Superior Court of California
  courtCounty: string;
  courtStreet: string;
  courtMailing: string;
  courtCityZip: string;
  branchName: string;

  // Parties & Case Number
  petitionerName: string;
  respondentName: string;
  otherPartyName: string;
  caseNumber: string;

  // Declarant Identification (Item 1)
  declarantRole: 'Petitioner' | 'Respondent';

  // Declaration of Disclosure Status (Item 2 & 3)
  preliminaryServed: boolean;
  preliminaryDate: string;
  finalServed: boolean;
  finalDate: string;

  // Disclosures Provided (Item 4)
  scheduleAssetsDebtsServed: boolean; // FL-142 or FL-160
  incomeExpenseServed: boolean;       // FL-150
  incomeExpenseDate: string;
  taxReturnsServed: boolean;          // 2 years prior tax returns
  finalWaived: boolean;               // Fam. Code § 2105(d)/(e) waiver

  // Service Details (Item 5)
  serviceMethod: 'First-Class Mail' | 'Personal Delivery' | 'Overnight Delivery' | 'Electronic Service';
  personServedName: string;
  serviceAddress: string;
  serviceDate: string;

  // Jurat & Signature
  signatureDate: string;
  signatureCity: string;
  declarantName: string;
}

const SUPPORTED_FORMS = [
  {
    code: 'FL-141',
    title: 'Declaration Regarding Service of Declaration of Disclosure',
    badge: 'Mandatory Disclosure',
    statute: 'Fam. Code §§ 2104, 2105, 2106, 2112',
    category: 'Financial Disclosures'
  },
  {
    code: 'FL-120',
    title: 'Response — Marriage / Domestic Partnership',
    badge: 'Responsive Pleading',
    statute: 'Fam. Code § 2020',
    category: 'Initial Pleadings'
  },
  {
    code: 'FL-105',
    title: 'Declaration Under UCCJEA',
    badge: 'Child Jurisdiction',
    statute: 'Fam. Code § 3429',
    category: 'Children & Custody'
  },
  {
    code: 'FL-311',
    title: 'Child Custody and Visitation Application Attachment',
    badge: 'Custody Schedule',
    statute: 'Fam. Code § 3040',
    category: 'Children & Custody'
  },
  {
    code: 'FL-160',
    title: 'Property Declaration (Separate / Community Property)',
    badge: 'Asset Division',
    statute: 'Fam. Code § 2500',
    category: 'Financial Disclosures'
  }
];

export const OfficialCaliforniaJudicialCouncilFormModal: React.FC<OfficialCaliforniaJudicialCouncilFormModalProps> = ({
  isOpen,
  onClose,
  client,
  clients,
  initialFormCode = 'FL-141',
  onAddGeneratedDoc,
  onExportToDrive
}) => {
  const [selectedFormCode, setSelectedFormCode] = useState<string>(initialFormCode);
  const [activeTab, setActiveTab] = useState<'editor' | 'pleading' | 'xfdf'>('editor');
  const [selectedClient, setSelectedClient] = useState<Client | null>(client);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Sync initial form code when modal opens or prop changes
  useEffect(() => {
    if (initialFormCode) {
      setSelectedFormCode(initialFormCode);
    }
  }, [initialFormCode]);

  useEffect(() => {
    if (client) {
      setSelectedClient(client);
    }
  }, [client]);

  // Default state builder for FL-141 based on client dossier
  const buildInitialFL141State = (c: Client | null): FL141FieldState => {
    const flData = c?.fl120Data;
    const clientName = c?.name || '';
    const nameTokens = clientName.trim().split(/\s+/).filter(Boolean);
    const parsedFirstName = nameTokens[0] || '';
    const parsedLastName = nameTokens.length > 1 ? nameTokens.slice(1).join(' ') : (nameTokens[0] || '');

    const clientPhone = c?.phone || '';
    const clientEmail = c?.email || '';
    const caseNum = flData?.caseNumber || '';
    const county = flData?.courtCounty || '';
    const respondent = flData?.respondentName || clientName;
    const petitioner = flData?.petitionerName || '';
    const today = new Date().toISOString().split('T')[0];

    return {
      clientFirstName: parsedFirstName,
      clientLastName: parsedLastName,

      attorneyName: '',
      stateBarNo: '',
      firmName: '',
      streetAddress: '742 Evergreen Terrace',
      city: 'San Francisco',
      state: 'CA',
      zip: '94107',
      phone: clientPhone,
      fax: '',
      email: clientEmail,
      attorneyFor: 'Respondent in Pro Per',

      courtCounty: county,
      courtStreet: '400 McAllister Street, Room 103',
      courtMailing: '400 McAllister Street, Room 103',
      courtCityZip: 'San Francisco, CA 94102',
      branchName: 'Civic Center Courthouse',

      petitionerName: petitioner,
      respondentName: respondent,
      otherPartyName: '',
      caseNumber: caseNum,

      declarantRole: 'Respondent',

      preliminaryServed: true,
      preliminaryDate: today,
      finalServed: false,
      finalDate: '',

      scheduleAssetsDebtsServed: true,
      incomeExpenseServed: true,
      incomeExpenseDate: today,
      taxReturnsServed: true,
      finalWaived: false,

      serviceMethod: 'First-Class Mail',
      personServedName: petitioner,
      serviceAddress: '1200 Market Street, Suite 400, San Francisco, CA 94102',
      serviceDate: today,

      signatureDate: today,
      signatureCity: county,
      declarantName: respondent
    };
  };

  const [fl141State, setFl141State] = useState<FL141FieldState>(() => buildInitialFL141State(selectedClient));
  const [attemptedGeneration, setAttemptedGeneration] = useState(false);
  const [warningToast, setWarningToast] = useState<{ message: string; missingFields: string[] } | null>(null);

  // Validation function enforcing mandatory fields before document generation
  const validateFormFields = (): { isValid: boolean; missingFields: string[] } => {
    const missing: string[] = [];

    // 1. Check Client_LastName
    const effectiveLastName = fl141State.clientLastName?.trim() || 
      (selectedClient?.name ? selectedClient.name.trim().split(/\s+/).slice(1).join(' ') : '') ||
      (fl141State.declarantName ? fl141State.declarantName.trim().split(/\s+/).slice(1).join(' ') : '');
    if (!effectiveLastName) {
      missing.push('Client Last Name');
    }

    // 2. Check Court_CaseNumber
    if (!fl141State.caseNumber || !fl141State.caseNumber.trim()) {
      missing.push('Court Case Number');
    }

    // 3. Check Court_County
    if (!fl141State.courtCounty || !fl141State.courtCounty.trim()) {
      missing.push('Court County');
    }

    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  };

  // Re-sync whenever selected client changes
  useEffect(() => {
    if (selectedClient) {
      setFl141State(buildInitialFL141State(selectedClient));
    }
  }, [selectedClient]);

  const handleResetToDossier = () => {
    setFl141State(buildInitialFL141State(selectedClient));
    setAttemptedGeneration(false);
    setWarningToast(null);
    setSaveSuccessNotice('Form fields refreshed from client dossier.');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  // Compile legal pleading text representation for FL-141
  const compiledPleadingText = useMemo(() => {
    const isPet = fl141State.declarantRole === 'Petitioner';
    const isResp = fl141State.declarantRole === 'Respondent';

    return `================================================================================
CALIFORNIA JUDICIAL COUNCIL FORM FL-141 (REV. JULY 1, 2013)
DECLARATION REGARDING SERVICE OF DECLARATION OF DISCLOSURE AND INCOME AND EXPENSE DECLARATION
Statutory Authority: California Family Code §§ 2104, 2105, 2106, 2112
================================================================================

1. ATTORNEY OR PARTY WITHOUT ATTORNEY:
   Name: ${fl141State.attorneyName || fl141State.declarantName}
   State Bar Number: ${fl141State.stateBarNo || 'N/A (In Pro Per)'}
   Firm Name: ${fl141State.firmName || 'Self-Represented Party'}
   Address: ${fl141State.streetAddress}, ${fl141State.city}, ${fl141State.state} ${fl141State.zip}
   Telephone: ${fl141State.phone} | Fax: ${fl141State.fax || 'N/A'}
   Email: ${fl141State.email}
   Attorney For: ${fl141State.attorneyFor || (isPet ? 'Petitioner' : 'Respondent')}

2. SUPERIOR COURT OF CALIFORNIA, COUNTY OF ${fl141State.courtCounty.toUpperCase()}
   Street Address: ${fl141State.courtStreet}
   Mailing Address: ${fl141State.courtMailing}
   City and Zip Code: ${fl141State.courtCityZip}
   Branch Name: ${fl141State.branchName}

   PETITIONER: ${fl141State.petitionerName}
   RESPONDENT: ${fl141State.respondentName}
   CASE NUMBER: ${fl141State.caseNumber}

--------------------------------------------------------------------------------
DECLARATION PURSUANT TO FAMILY CODE § 2106
--------------------------------------------------------------------------------
1. I am the [${isPet ? 'X' : ' '}] Petitioner  [${isResp ? 'X' : ' '}] Respondent in this matter.

2. PRELIMINARY DECLARATION OF DISCLOSURE (Fam. Code § 2104):
   [${fl141State.preliminaryServed ? 'X' : ' '}] The Preliminary Declaration of Disclosure and current Income and Expense
       Declaration (FL-150) were served on the other party on: ${fl141State.preliminaryDate || '[Pending Date]'}.

3. FINAL DECLARATION OF DISCLOSURE (Fam. Code § 2105):
   [${fl141State.finalServed ? 'X' : ' '}] The Final Declaration of Disclosure and current Income and Expense
       Declaration (FL-150) were served on the other party on: ${fl141State.finalDate || '[Pending Date]'}.
   [${fl141State.finalWaived ? 'X' : ' '}] The parties have mutually waived the Final Declaration of Disclosure
       pursuant to Family Code Section 2105(d) or (e).

4. ATTACHMENTS AND ACCOMPANYING DISCLOSURES SERVED:
   [${fl141State.scheduleAssetsDebtsServed ? 'X' : ' '}] Schedule of Assets and Debts (Form FL-142) or Property Declaration (Form FL-160)
   [${fl141State.incomeExpenseServed ? 'X' : ' '}] Income and Expense Declaration (Form FL-150) served on ${fl141State.incomeExpenseDate}
   [${fl141State.taxReturnsServed ? 'X' : ' '}] All tax returns filed by the declarant in the two years prior to service

5. SERVICE VERIFICATION (Fam. Code § 2106):
   Service of the foregoing disclosure documents was executed as follows:
   Method of Service: [X] ${fl141State.serviceMethod}
   Party Served: ${fl141State.personServedName}
   Address Where Served: ${fl141State.serviceAddress}
   Date of Service: ${fl141State.serviceDate}

--------------------------------------------------------------------------------
JURAT & PENALTY OF PERJURY
--------------------------------------------------------------------------------
I declare under penalty of perjury under the laws of the State of California that
the foregoing is true and correct.

Date: ${fl141State.signatureDate}
Place of Signing: ${fl141State.signatureCity}, California

___________________________________________
${fl141State.declarantName}
(Declarant / ${fl141State.declarantRole})
================================================================================
CONFIDENTIAL - CALIFORNIA JUDICIAL COUNCIL AUTOMATION PIPELINE (PHOENIX ENGINE)
`;
  }, [fl141State]);

  // Compile W3C compliant XFDF for 1-click Adobe Acrobat injection
  const compiledXfdf = useMemo(() => {
    const isPet = fl141State.declarantRole === 'Petitioner';
    const isResp = fl141State.declarantRole === 'Respondent';

    const mappings: Record<string, string> = {
      'FL-141[0].Page1[0].AttyInfo[0].AttyName_ft[0]': fl141State.attorneyName || fl141State.declarantName,
      'FL-141[0].Page1[0].AttyInfo[0].BarNo_ft[0]': fl141State.stateBarNo,
      'FL-141[0].Page1[0].AttyInfo[0].AttyFirm_ft[0]': fl141State.firmName,
      'FL-141[0].Page1[0].AttyInfo[0].AttyStreet_ft[0]': fl141State.streetAddress,
      'FL-141[0].Page1[0].AttyInfo[0].AttyCity_ft[0]': fl141State.city,
      'FL-141[0].Page1[0].AttyInfo[0].AttyState_ft[0]': fl141State.state,
      'FL-141[0].Page1[0].AttyInfo[0].AttyZip_ft[0]': fl141State.zip,
      'FL-141[0].Page1[0].AttyInfo[0].Phone_ft[0]': fl141State.phone,
      'FL-141[0].Page1[0].AttyInfo[0].Email_ft[0]': fl141State.email,
      'FL-141[0].Page1[0].AttyInfo[0].AttyFor_ft[0]': fl141State.attorneyFor,

      'FL-141[0].Page1[0].CourtInfo[0].CrtCounty_ft[0]': fl141State.courtCounty.toUpperCase(),
      'FL-141[0].Page1[0].CourtInfo[0].Street_ft[0]': fl141State.courtStreet,
      'FL-141[0].Page1[0].CourtInfo[0].MailingAdd_ft[0]': fl141State.courtMailing,
      'FL-141[0].Page1[0].CourtInfo[0].CityZip_ft[0]': fl141State.courtCityZip,
      'FL-141[0].Page1[0].CourtInfo[0].Branch_ft[0]': fl141State.branchName,

      'FL-141[0].Page1[0].TitlePartyName[0].Petitioner_1_ft[0]': fl141State.petitionerName,
      'FL-141[0].Page1[0].TitlePartyName[0].Respondent_ft[0]': fl141State.respondentName,
      'FL-141[0].Page1[0].CaseNumber[0].CaseNumber_ft[0]': fl141State.caseNumber,

      'FL-141[0].Page1[0].Declarant[0].Petitioner_cb[0]': isPet ? 'Yes' : 'Off',
      'FL-141[0].Page1[0].Declarant[0].Respondent_cb[0]': isResp ? 'Yes' : 'Off',

      'FL-141[0].Page1[0].Disclosures[0].Preliminary_cb[0]': fl141State.preliminaryServed ? 'Yes' : 'Off',
      'FL-141[0].Page1[0].Disclosures[0].PrelimDate_dt[0]': fl141State.preliminaryDate,
      'FL-141[0].Page1[0].Disclosures[0].Final_cb[0]': fl141State.finalServed ? 'Yes' : 'Off',
      'FL-141[0].Page1[0].Disclosures[0].FinalDate_dt[0]': fl141State.finalDate,
      'FL-141[0].Page1[0].Disclosures[0].IncomeExpense_cb[0]': fl141State.incomeExpenseServed ? 'Yes' : 'Off',
      'FL-141[0].Page1[0].Disclosures[0].ScheduleAssets_cb[0]': fl141State.scheduleAssetsDebtsServed ? 'Yes' : 'Off',
      'FL-141[0].Page1[0].Disclosures[0].TaxReturns_cb[0]': fl141State.taxReturnsServed ? 'Yes' : 'Off',
      'FL-141[0].Page1[0].Disclosures[0].FinalWaived_cb[0]': fl141State.finalWaived ? 'Yes' : 'Off',

      'FL-141[0].Page1[0].Service[0].Personal_cb[0]': fl141State.serviceMethod === 'Personal Delivery' ? 'Yes' : 'Off',
      'FL-141[0].Page1[0].Service[0].Mail_cb[0]': fl141State.serviceMethod === 'First-Class Mail' ? 'Yes' : 'Off',
      'FL-141[0].Page1[0].Service[0].Overnight_cb[0]': fl141State.serviceMethod === 'Overnight Delivery' ? 'Yes' : 'Off',
      'FL-141[0].Page1[0].Service[0].Electronic_cb[0]': fl141State.serviceMethod === 'Electronic Service' ? 'Yes' : 'Off',

      'FL-141[0].Page1[0].Service[0].ServedOnName_ft[0]': fl141State.personServedName,
      'FL-141[0].Page1[0].Service[0].ServedAddress_ft[0]': fl141State.serviceAddress,
      'FL-141[0].Page1[0].Service[0].ServiceDate_dt[0]': fl141State.serviceDate,

      'FL-141[0].Page1[0].SignatureDate_dt[0]': fl141State.signatureDate,
      'FL-141[0].Page1[0].SignaturePlace_ft[0]': fl141State.signatureCity,
      'FL-141[0].Page1[0].DeclarantName_ft[0]': fl141State.declarantName,
      'FL-141[0].Page1[0].Signature_ft[0]': fl141State.declarantName
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">\n  <fields>\n`;
    for (const [k, v] of Object.entries(mappings)) {
      xml += `    <field name="${k}"><value>${v}</value></field>\n`;
    }
    xml += `  </fields>\n  <f href="templates/FL-141.pdf"/>\n</xfdf>`;
    return xml;
  }, [fl141State]);

  // Actions
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(label);
    setTimeout(() => setCopiedStatus(null), 2500);
  };

  // Raw Generation Logic
  const handleDownloadXfdfRaw = () => {
    const blob = new Blob([compiledXfdf], { type: 'application/vnd.adobe.xfdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FL-141_Declaration_of_Disclosure_${fl141State.declarantName.replace(/\s+/g, '_')}.xfdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSaveSuccessNotice('XFDF Form Payload exported successfully.');
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  const handleSaveToClientDocsRaw = () => {
    if (onAddGeneratedDoc && selectedClient) {
      const doc: GeneratedDocument = {
        id: `fl141_${Date.now()}`,
        title: `FL-141 Declaration Regarding Service of Disclosure (${fl141State.declarantRole})`,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        templateId: 'FL-141',
        content: compiledPleadingText,
        generatedAt: new Date().toISOString()
      };
      onAddGeneratedDoc(doc);
      setSaveSuccessNotice(`Saved FL-141 to ${selectedClient.name}'s document repository.`);
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    }
  };

  const handlePrintRaw = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>FL-141 Declaration Regarding Service of Disclosure</title>
            <style>
              body { font-family: monospace; font-size: 11px; white-space: pre-wrap; padding: 24px; color: #111; line-height: 1.35; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>${compiledPleadingText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  // Validated Action Handlers
  const handleGenerateDocument = async (actionType: 'download_xfdf' | 'save_docs' | 'print' = 'save_docs') => {
    // 1. Validation Layer
    const missingFields: string[] = [];
    const effectiveLastName = fl141State.clientLastName?.trim() || 
      (selectedClient?.name ? selectedClient.name.trim().split(/\s+/).slice(1).join(' ') : '') ||
      (fl141State.declarantName ? fl141State.declarantName.trim().split(/\s+/).slice(1).join(' ') : '');

    if (!effectiveLastName) missingFields.push("Client Last Name");
    if (!fl141State.caseNumber || !fl141State.caseNumber.trim()) missingFields.push("Court Case Number");

    if (missingFields.length > 0) {
      setAttemptedGeneration(true);
      setWarningToast({
        message: `Generation Halted: Missing required fields (${missingFields.join(", ")}).`,
        missingFields
      });
      if (activeTab !== 'editor') {
        setActiveTab('editor');
      }
      return; // Stop execution
    }

    // 2. Proceed to Local PDF / XFDF Generation
    try {
      setSaveSuccessNotice("Initializing PDF Engine & Compiling AcroForm...");
      if (actionType === 'download_xfdf') {
        handleDownloadXfdfRaw();
      } else if (actionType === 'save_docs') {
        handleSaveToClientDocsRaw();
      } else if (actionType === 'print') {
        handlePrintRaw();
      }
    } catch (error) {
      setWarningToast({
        message: "Generation failed. Check the engine logs.",
        missingFields: []
      });
    }
  };

  const handleDownloadXfdf = () => handleGenerateDocument('download_xfdf');
  const handleSaveToClientDocs = () => handleGenerateDocument('save_docs');
  const handlePrint = () => handleGenerateDocument('print');

  if (!isOpen) return null;

  const currentFormMeta = SUPPORTED_FORMS.find(f => f.code === selectedFormCode) || SUPPORTED_FORMS[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-5xl rounded-2xl bg-[#080d19] border border-slate-800 text-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-[#0c1324] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    California Judicial Council Form Automation
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Phoenix Pipeline
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Universal Relational Mapping & XFDF Generator • Official Unaltered Forms Catalog
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {clients && clients.length > 0 && (
                <div className="flex items-center gap-1.5 mr-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedClient?.id || ''}
                    onChange={(e) => {
                      const found = (clients || []).find(c => c?.id === e.target.value);
                      if (found) setSelectedClient(found);
                    }}
                    className="bg-[#050811] border border-slate-700 rounded-lg text-xs px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Selection Bar */}
          <div className="px-6 py-2.5 bg-[#050811] border-b border-slate-800 flex items-center gap-2 overflow-x-auto flex-shrink-0">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mr-1">Active Form:</span>
            {SUPPORTED_FORMS.map((form) => {
              const isActive = selectedFormCode === form.code;
              return (
                <button
                  key={form.code}
                  onClick={() => setSelectedFormCode(form.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/10'
                      : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="font-mono font-bold">{form.code}</span>
                  <span className="text-[11px] opacity-80 hidden sm:inline">{form.title.split(' ')[0]}</span>
                  {isActive && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {form.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Form Metadata Sub-Header */}
          <div className="px-6 py-3 bg-[#0a1020] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-extrabold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                {currentFormMeta.code}
              </span>
              <div>
                <div className="text-xs font-semibold text-white">{currentFormMeta.title}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {currentFormMeta.statute} • California Judicial Council Official Form
                </div>
              </div>
            </div>

            {/* View Tab Buttons */}
            <div className="flex items-center gap-1 bg-[#050811] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'editor'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Field Mappings</span>
              </button>
              <button
                onClick={() => setActiveTab('pleading')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'pleading'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Pleading View</span>
              </button>
              <button
                onClick={() => setActiveTab('xfdf')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'xfdf'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>XFDF Schema</span>
              </button>
            </div>
          </div>

          {/* Warning Toast Notification */}
          <AnimatePresence>
            {warningToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-amber-950/95 border-b-2 border-amber-500 px-6 py-3 text-xs text-amber-200 flex items-center justify-between shadow-2xl z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block tracking-wide">{warningToast.message}</span>
                    {warningToast.missingFields.length > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-amber-300/80">Required fields to populate:</span>
                        {warningToast.missingFields.map(f => (
                          <span key={f} className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-[10px] font-mono font-bold text-rose-300">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setWarningToast(null)}
                  className="p-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-800 text-amber-300 hover:text-white transition-colors cursor-pointer"
                  title="Dismiss warning"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Banner */}
          {saveSuccessNotice && (
            <div className="bg-emerald-950/70 border-b border-emerald-500/30 px-6 py-2 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{saveSuccessNotice}</span>
            </div>
          )}

          {/* Modal Main Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedFormCode === 'FL-141' ? (
              <>
                {/* TAB 1: FIELD EDITOR */}
                {activeTab === 'editor' && (
                  <div className="space-y-6">
                    {/* Synchronize Toolbar */}
                    <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-medium text-slate-300">
                          Automated Mapping Active: Connecting Universal DB to FL-141 AcroForm
                        </span>
                      </div>
                      <button
                        onClick={handleResetToDossier}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                        <span>Re-Sync Dossier</span>
                      </button>
                    </div>

                    {/* Section 1: Caption & Attorney */}
                    <div className="bg-[#0b101e] rounded-xl border border-slate-800 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>1. Caption & Legal Representation</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Page 1 Caption Header</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Client First Name (Client_FirstName)</label>
                          <input
                            type="text"
                            value={fl141State.clientFirstName}
                            onChange={(e) => setFl141State({ ...fl141State, clientFirstName: e.target.value })}
                            placeholder="e.g. Christopher"
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                            <span>Client Last Name (Client_LastName)</span>
                            <span className="text-rose-400 text-[10px] font-mono font-bold">* REQUIRED</span>
                          </label>
                          <input
                            type="text"
                            value={fl141State.clientLastName}
                            onChange={(e) => setFl141State({ ...fl141State, clientLastName: e.target.value })}
                            placeholder="e.g. Smith"
                            className={`w-full bg-[#050811] border rounded-lg p-2 text-slate-100 focus:outline-none transition-all ${
                              attemptedGeneration && !fl141State.clientLastName?.trim()
                                ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/20'
                                : 'border-slate-700 focus:border-amber-400'
                            }`}
                          />
                          {attemptedGeneration && !fl141State.clientLastName?.trim() && (
                            <span className="text-[10px] text-rose-400 font-mono mt-1 block flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-400" /> Missing required field: Client_LastName
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Attorney or Self-Rep Name</label>
                          <input
                            type="text"
                            value={fl141State.attorneyName}
                            onChange={(e) => setFl141State({ ...fl141State, attorneyName: e.target.value })}
                            placeholder={fl141State.declarantName}
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">State Bar Number</label>
                          <input
                            type="text"
                            value={fl141State.stateBarNo}
                            onChange={(e) => setFl141State({ ...fl141State, stateBarNo: e.target.value })}
                            placeholder="e.g. 294812 (or 'Pro Per')"
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Attorney For</label>
                          <input
                            type="text"
                            value={fl141State.attorneyFor}
                            onChange={(e) => setFl141State({ ...fl141State, attorneyFor: e.target.value })}
                            placeholder="Respondent in Pro Per"
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Street Address</label>
                          <input
                            type="text"
                            value={fl141State.streetAddress}
                            onChange={(e) => setFl141State({ ...fl141State, streetAddress: e.target.value })}
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">City, State, ZIP</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={fl141State.city}
                              onChange={(e) => setFl141State({ ...fl141State, city: e.target.value })}
                              placeholder="City"
                              className="w-1/2 bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                            />
                            <input
                              type="text"
                              value={fl141State.state}
                              onChange={(e) => setFl141State({ ...fl141State, state: e.target.value })}
                              className="w-1/4 bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                            />
                            <input
                              type="text"
                              value={fl141State.zip}
                              onChange={(e) => setFl141State({ ...fl141State, zip: e.target.value })}
                              placeholder="ZIP"
                              className="w-1/4 bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Telephone & Email</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={fl141State.phone}
                              onChange={(e) => setFl141State({ ...fl141State, phone: e.target.value })}
                              placeholder="Phone"
                              className="w-1/2 bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                            />
                            <input
                              type="email"
                              value={fl141State.email}
                              onChange={(e) => setFl141State({ ...fl141State, email: e.target.value })}
                              placeholder="Email"
                              className="w-1/2 bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Court Venue & Case Number */}
                    <div className="bg-[#0b101e] rounded-xl border border-slate-800 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>2. Court Jurisdiction & Matter Title</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">California Superior Court</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">County of Venue</label>
                          <input
                            type="text"
                            value={fl141State.courtCounty}
                            onChange={(e) => setFl141State({ ...fl141State, courtCounty: e.target.value })}
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400 uppercase font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Branch Name</label>
                          <input
                            type="text"
                            value={fl141State.branchName}
                            onChange={(e) => setFl141State({ ...fl141State, branchName: e.target.value })}
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Court Physical Address</label>
                          <input
                            type="text"
                            value={fl141State.courtStreet}
                            onChange={(e) => setFl141State({ ...fl141State, courtStreet: e.target.value })}
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Court City & ZIP</label>
                          <input
                            type="text"
                            value={fl141State.courtCityZip}
                            onChange={(e) => setFl141State({ ...fl141State, courtCityZip: e.target.value })}
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Petitioner Legal Name</label>
                          <input
                            type="text"
                            value={fl141State.petitionerName}
                            onChange={(e) => setFl141State({ ...fl141State, petitionerName: e.target.value })}
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Respondent Legal Name</label>
                          <input
                            type="text"
                            value={fl141State.respondentName}
                            onChange={(e) => setFl141State({ ...fl141State, respondentName: e.target.value })}
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                            <span>Case Number (Court_CaseNumber)</span>
                            <span className="text-rose-400 text-[10px] font-mono font-bold">* REQUIRED</span>
                          </label>
                          <input
                            type="text"
                            value={fl141State.caseNumber}
                            onChange={(e) => setFl141State({ ...fl141State, caseNumber: e.target.value })}
                            placeholder="e.g. FDI-24-789012"
                            className={`w-full bg-[#050811] border rounded-lg p-2 text-amber-300 font-mono font-bold focus:outline-none transition-all ${
                              attemptedGeneration && !fl141State.caseNumber?.trim()
                                ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/20'
                                : 'border-slate-700 focus:border-amber-400'
                            }`}
                          />
                          {attemptedGeneration && !fl141State.caseNumber?.trim() && (
                            <span className="text-[10px] text-rose-400 font-mono mt-1 block flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-400" /> Missing required field: Court_CaseNumber
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Declarant Role</label>
                          <div className="flex gap-2 pt-1">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                              <input
                                type="radio"
                                name="declarantRole"
                                checked={fl141State.declarantRole === 'Petitioner'}
                                onChange={() => setFl141State({ ...fl141State, declarantRole: 'Petitioner' })}
                                className="accent-amber-400"
                              />
                              <span>Petitioner</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                              <input
                                type="radio"
                                name="declarantRole"
                                checked={fl141State.declarantRole === 'Respondent'}
                                onChange={() => setFl141State({ ...fl141State, declarantRole: 'Respondent' })}
                                className="accent-amber-400"
                              />
                              <span>Respondent</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Disclosures Inventory */}
                    <div className="bg-[#0b101e] rounded-xl border border-slate-800 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>3. Declaration of Disclosure Status (Fam. Code §§ 2104, 2105)</span>
                        </div>
                        <span className="text-[10px] text-indigo-400 font-mono">Statutory Checkpoints</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Preliminary Disclosure */}
                        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                          <label className="flex items-center gap-2 font-medium text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fl141State.preliminaryServed}
                              onChange={(e) => setFl141State({ ...fl141State, preliminaryServed: e.target.checked })}
                              className="accent-amber-400 w-4 h-4 rounded"
                            />
                            <span className="text-amber-300">Item 2: Preliminary Declaration of Disclosure Served</span>
                          </label>
                          <p className="text-[11px] text-slate-400 pl-6">
                            Preliminary Declaration and current Income and Expense Declaration (FL-150) served on other party.
                          </p>
                          {fl141State.preliminaryServed && (
                            <div className="pl-6 pt-1 flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">Date Served:</span>
                              <input
                                type="date"
                                value={fl141State.preliminaryDate}
                                onChange={(e) => setFl141State({ ...fl141State, preliminaryDate: e.target.value })}
                                className="bg-[#050811] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                              />
                            </div>
                          )}
                        </div>

                        {/* Final Disclosure */}
                        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                          <label className="flex items-center gap-2 font-medium text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fl141State.finalServed}
                              onChange={(e) => setFl141State({ ...fl141State, finalServed: e.target.checked })}
                              className="accent-amber-400 w-4 h-4 rounded"
                            />
                            <span className="text-indigo-300">Item 3: Final Declaration of Disclosure Served</span>
                          </label>
                          <p className="text-[11px] text-slate-400 pl-6">
                            Final Declaration and current Income and Expense Declaration (FL-150) served.
                          </p>
                          {fl141State.finalServed && (
                            <div className="pl-6 pt-1 flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">Date Served:</span>
                              <input
                                type="date"
                                value={fl141State.finalDate}
                                onChange={(e) => setFl141State({ ...fl141State, finalDate: e.target.value })}
                                className="bg-[#050811] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Associated Statutory Documents */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 text-xs">
                        <label className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700">
                          <input
                            type="checkbox"
                            checked={fl141State.scheduleAssetsDebtsServed}
                            onChange={(e) => setFl141State({ ...fl141State, scheduleAssetsDebtsServed: e.target.checked })}
                            className="accent-amber-400 w-3.5 h-3.5 rounded"
                          />
                          <span className="text-slate-300">Schedule of Assets/Debts (FL-142 / FL-160)</span>
                        </label>

                        <label className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700">
                          <input
                            type="checkbox"
                            checked={fl141State.incomeExpenseServed}
                            onChange={(e) => setFl141State({ ...fl141State, incomeExpenseServed: e.target.checked })}
                            className="accent-amber-400 w-3.5 h-3.5 rounded"
                          />
                          <span className="text-slate-300">Income & Expense Declaration (FL-150)</span>
                        </label>

                        <label className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700">
                          <input
                            type="checkbox"
                            checked={fl141State.taxReturnsServed}
                            onChange={(e) => setFl141State({ ...fl141State, taxReturnsServed: e.target.checked })}
                            className="accent-amber-400 w-3.5 h-3.5 rounded"
                          />
                          <span className="text-slate-300">Tax Returns (Prior 2 Years)</span>
                        </label>
                      </div>

                      {/* Mutual Waiver */}
                      <div className="pt-2">
                        <label className="p-2.5 rounded-lg bg-slate-900/30 border border-slate-800/80 flex items-center gap-2 cursor-pointer hover:border-slate-700 text-xs">
                          <input
                            type="checkbox"
                            checked={fl141State.finalWaived}
                            onChange={(e) => setFl141State({ ...fl141State, finalWaived: e.target.checked })}
                            className="accent-amber-400 w-3.5 h-3.5 rounded"
                          />
                          <span className="text-slate-400">
                            Mutual Statutory Waiver of Final Declaration of Disclosure pursuant to Fam. Code § 2105(d)/(e)
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Section 4: Service Verification & Execution */}
                    <div className="bg-[#0b101e] rounded-xl border border-slate-800 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                          <Send className="w-3.5 h-3.5" />
                          <span>4. Service Verification & Jurat Execution</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Family Code § 2106 Proof</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Method of Service</label>
                          <select
                            value={fl141State.serviceMethod}
                            onChange={(e: any) => setFl141State({ ...fl141State, serviceMethod: e.target.value })}
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          >
                            <option value="First-Class Mail">First-Class Mail (Postage Prepaid)</option>
                            <option value="Personal Delivery">Personal Delivery (Hand Delivered)</option>
                            <option value="Overnight Delivery">Overnight Express Delivery</option>
                            <option value="Electronic Service">Electronic Service (Consent on File)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Person Served</label>
                          <input
                            type="text"
                            value={fl141State.personServedName}
                            onChange={(e) => setFl141State({ ...fl141State, personServedName: e.target.value })}
                            placeholder="Recipient full name"
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] text-slate-400 mb-1">Service Address</label>
                          <input
                            type="text"
                            value={fl141State.serviceAddress}
                            onChange={(e) => setFl141State({ ...fl141State, serviceAddress: e.target.value })}
                            placeholder="Physical or mailing location where service was executed"
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Date of Service</label>
                          <input
                            type="date"
                            value={fl141State.serviceDate}
                            onChange={(e) => setFl141State({ ...fl141State, serviceDate: e.target.value })}
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Date of Jurat Signature</label>
                          <input
                            type="date"
                            value={fl141State.signatureDate}
                            onChange={(e) => setFl141State({ ...fl141State, signatureDate: e.target.value })}
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">City of Signing</label>
                          <input
                            type="text"
                            value={fl141State.signatureCity}
                            onChange={(e) => setFl141State({ ...fl141State, signatureCity: e.target.value })}
                            placeholder="e.g. San Francisco"
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Declarant Printed Name</label>
                          <input
                            type="text"
                            value={fl141State.declarantName}
                            onChange={(e) => setFl141State({ ...fl141State, declarantName: e.target.value })}
                            className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-400 font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PLEADING VIEW */}
                {activeTab === 'pleading' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Official California Court Pleading Preview (Monospace Legal Formatting)</span>
                      <button
                        onClick={() => handleCopy(compiledPleadingText, 'pleading')}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors"
                      >
                        {copiedStatus === 'pleading' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedStatus === 'pleading' ? 'Copied Pleading' : 'Copy Text'}</span>
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-[#04060d] border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto select-all max-h-[58vh]">
                      {compiledPleadingText}
                    </pre>
                  </div>
                )}

                {/* TAB 3: XFDF SCHEMA & MAPPING */}
                {activeTab === 'xfdf' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-amber-400" />
                        <span>W3C & Adobe Acrobat Compliant XFDF Payload (Points to templates/FL-141.pdf)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(compiledXfdf, 'xfdf')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors"
                        >
                          {copiedStatus === 'xfdf' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedStatus === 'xfdf' ? 'Copied XFDF' : 'Copy XML'}</span>
                        </button>
                        <button
                          onClick={handleDownloadXfdf}
                          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .xfdf</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[11px] font-mono font-bold text-slate-400 mb-1.5 uppercase">
                          Declarative Mapping Config (forms/FL-141.mapping.json)
                        </div>
                        <div className="p-3 rounded-xl bg-[#04060d] border border-slate-800 font-mono text-[10.5px] text-amber-300/90 max-h-[52vh] overflow-y-auto space-y-1">
                          <div className="text-slate-500">// Universal DB Path &gt; AcroForm Target</div>
                          <div>"attorney.name" &rarr; AttyInfo[0].AttyName_ft[0]</div>
                          <div>"attorney.bar_number" &rarr; AttyInfo[0].BarNo_ft[0]</div>
                          <div>"case.county" &rarr; CourtInfo[0].CrtCounty_ft[0] (UPPER)</div>
                          <div>"case.court_street" &rarr; CourtInfo[0].Street_ft[0]</div>
                          <div>"case.case_number" &rarr; CaseNumber[0].CaseNumber_ft[0]</div>
                          <div>"case.title_petitioner" &rarr; TitlePartyName[0].Petitioner_1_ft[0]</div>
                          <div>"case.title_respondent" &rarr; TitlePartyName[0].Respondent_ft[0]</div>
                          <div>"disclosure.declarant_role" &rarr; Declarant[0].Respondent_cb[0] (/Yes)</div>
                          <div>"disclosure.preliminary_served" &rarr; Disclosures[0].Preliminary_cb[0] (/Yes)</div>
                          <div>"disclosure.preliminary_date" &rarr; Disclosures[0].PrelimDate_dt[0]</div>
                          <div>"disclosure.service_method" &rarr; Service[0].Mail_cb[0] (/Yes)</div>
                          <div>"disclosure.person_served" &rarr; Service[0].ServedOnName_ft[0]</div>
                          <div>"disclosure.service_address" &rarr; Service[0].ServedAddress_ft[0]</div>
                          <div>"disclosure.signature_date" &rarr; SignatureDate_dt[0]</div>
                          <div>"disclosure.signature" &rarr; Signature_ft[0]</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-mono font-bold text-slate-400 mb-1.5 uppercase">
                          Generated XML Stream (Target: templates/FL-141.pdf)
                        </div>
                        <pre className="p-3 rounded-xl bg-[#04060d] border border-slate-800 font-mono text-[10.5px] text-slate-300 max-h-[52vh] overflow-y-auto">
                          {compiledXfdf}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Alternate Forms Placeholder within Catalog */
              <div className="p-8 text-center space-y-4 bg-[#0a0f1d] rounded-2xl border border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {currentFormMeta.code} — {currentFormMeta.title}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Standard California Judicial Council AcroForm template registered in the Phoenix pipeline.
                    Switch to FL-141 for disclosure service declaration automation or select another template.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setSelectedFormCode('FL-141')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/10"
                  >
                    Switch to FL-141 Declaration of Disclosure
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-4 border-t border-slate-800 bg-[#0c1324] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Declaration</span>
              </button>

              <button
                onClick={handleDownloadXfdf}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download XFDF</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                Close
              </button>

              <button
                onClick={handleSaveToClientDocs}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-slate-950" />
                <span>Save to Client Dossier</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
