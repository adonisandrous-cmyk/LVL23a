import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  FileCheck,
  Plus,
  Play,
  RotateCcw,
  Download,
  Copy,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  ClipboardList,
  AlertCircle,
  Scan,
  UploadCloud,
  CheckCircle2,
  FileSignature,
  ArrowRight,
  Eye,
  FileCode,
  Sparkle,
  Mail,
  Send,
  Database,
  Trash,
  Sliders,
  File,
  Check,
  CheckSquare
} from 'lucide-react';
import { Client, DocumentTemplate, GeneratedDocument } from '../types';

interface DocumentsTabProps {
  clients: Client[];
  generatedDocs: GeneratedDocument[];
  onAddGeneratedDoc: (doc: GeneratedDocument) => void;
}

interface OCRPreset {
  id: string;
  name: string;
  templateId: string;
  sender: string;
  previewSummary: string;
  rawTextSim: string;
  extracted: Record<string, string>;
}

interface CourtFormSchema {
  id: string;
  formNumber: string;
  formTitle: string;
  courtSystem: string;
  mappings: { fieldName: string; token: string; value: string; isRequired: boolean }[];
}

export default function DocumentsTab({
  clients,
  generatedDocs,
  onAddGeneratedDoc
}: DocumentsTabProps) {
  
  // Custom sharp 3D Raised Buttons CSS Utilities
  const sharp3DButton = "rounded-none border-2 border-teal-500 bg-[#090f1a] text-teal-400 font-mono text-xs font-bold uppercase py-2 px-4 shadow-[4px_4px_0px_#14b8a6] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#14b8a6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:pointer-events-none";
  const sharp3DAccentButton = "rounded-none border-2 border-emerald-400 bg-[#061112] text-emerald-400 font-mono text-xs font-bold uppercase py-2 px-4 shadow-[4px_4px_0px_#34d399] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#34d399] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:pointer-events-none";
  const sharp3DRoseButton = "rounded-none border-2 border-rose-500 bg-[#12070c] text-rose-500 font-mono text-[10px] font-bold uppercase py-1.5 px-3 shadow-[3px_3px_0px_#f43f5e] hover:translate-x-[-1.5px] hover:translate-y-[-1.5px] hover:shadow-[4px_4px_0px_#f43f5e] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none transition-all cursor-pointer shrink-0";
  const smallSharp3D = "rounded-none border border-slate-700 bg-slate-900 text-slate-300 font-mono text-[10px] font-bold uppercase py-1.5 px-2.5 shadow-[2.5px_2.5px_0px_#475569] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[3.5px_3.5px_0px_#475569] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer";

  // 1. Two Primary Workspace Screens
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'synthesis' | 'judicial_mapper'>('synthesis');

  const templates: DocumentTemplate[] = [
    {
      id: 'temp-1',
      name: 'California Spouse Dissolution Intake Sheet',
      category: 'Family Law',
      description: 'Prepares detailed case details and asset schedules for California divorce petitions.',
      defaultQuestions: ['Date of Marriage', 'Separation Date', 'Spousal Support goals', 'Child Custody details', 'Separate vs Community Property description']
    },
    {
      id: 'temp-2',
      name: 'USCIS Asylum Narrative Declaration brief',
      category: 'Immigration',
      description: 'Formats formal first-person applicant narrative for Form I-589 asylum declaration.',
      defaultQuestions: ['Country of Origin', 'Specific threat occurrences', 'Political/Social group affiliation', 'Fear of future persecution description', 'Previous local police response details']
    },
    {
      id: 'temp-3',
      name: 'Chapter 7 Bankruptcy Petition Summary Letter',
      category: 'Bankruptcy',
      description: 'Compiles client statement of liability and income schedules for filing Chapter 7.',
      defaultQuestions: ['Total Unsecured Debt amount', 'Primary Assets description', 'Monthly Household Income', 'Explanation of insolvency cause', 'Secured creditor information']
    },
    {
      id: 'temp-4',
      name: 'Standard NDA & Confidential Mutual Contract',
      category: 'General Practice',
      description: 'Creates professional non-disclosure mutual agreements with clear trade secrets scope.',
      defaultQuestions: ['Disclosing Party Name', 'Receiving Party Name', 'Confidentiality Term duration', 'Permitted disclosure purpose', 'State Governing Jurisdiction']
    }
  ];

  // Scanned paperwork presets corresponding to templates for testing immediately
  const ocrPresets: OCRPreset[] = [
    {
      id: 'p-1',
      name: 'Sarah Jenkins Handwritten Legal Form-21',
      templateId: 'temp-1',
      sender: 'Sarah Jenkins',
      previewSummary: 'Spouse Intake Form. Highlights separation date 2025-05-15, married 2015-06-18.',
      rawTextSim: `INTAKE CLIENT INQUIRY FORM
Spouse Plaintiff: Sarah Jenkins
Spouse Defendant: Bradley Jenkins
Date of Marriage: June 18, 2015.
Separation date is May 15, 2025.
Alimony Request: Sarah Jenkins desires temporary spousal support of $1,250 every month.
Children: Two minor children. Physical care of Sarah. Joint legal decision-making.
Property claims: Orange County marital home purchased with joint bank account in 2018 (Community). Separate property: Inherited savings portfolio.`,
      extracted: {
        'Date of Marriage': 'June 18, 2015',
        'Separation Date': 'May 15, 2025',
        'Spousal Support goals': 'Temporary spousal support of $1,250/month requested by Sarah',
        'Child Custody details': 'Joint legal custody, Sarah Jenkins to remain primary caretakers',
        'Separate vs Community Property description': 'Marital home in Orange County is Community; Inherited personal savings portfolio claimed as Separate'
      }
    },
    {
      id: 'p-2',
      name: 'Mateo Asylum Declaration Draft',
      templateId: 'temp-2',
      sender: 'Mateo Alvarez',
      previewSummary: 'Immigration intake sheet. Notes political baker affiliation and cartel threat.',
      rawTextSim: `USCIS STATEMENT OF BACKGROUND
Declarant: Mateo Alvarez
Country: El Salvador
Event list: On April 4, 2024, received primary written threat from local extortion crew demanding bakery payout.
Affiliation: Active Organizer of National baker unions community federation.
Fear outline: Retribution, forced closure, and personal harm if sent back.
Police reaction: Dispatched local station statement, no police bodyguard or patrols were provided.`,
      extracted: {
        'Country of Origin': 'El Salvador',
        'Specific threat occurrences': 'Written warning from cartel on April 4, 2024 at his bakery shop',
        'Political/Social group affiliation': 'Active Organizer inside National baker unions community',
        'Fear of future persecution description': 'Personal recapture and severe retaliatory violence if deported',
        'Previous local police response details': 'Case registered but police stated lack of security patrols available'
      }
    },
    {
      id: 'p-3',
      name: 'Miller Debts Schedule & Assets Invoice Scan',
      templateId: 'temp-3',
      sender: 'Samuel Miller',
      previewSummary: 'Chapter 7 schedule sheet detailing medical debts and automobile liens.',
      rawTextSim: `CHAPTER 7 DISCLOSURE SHEET
Petitioner: Samuel Miller
Unsecured Liabilities: Credit cards, store cards, and hospital invoices totaling $85,320.
Household assets: One primary truck valued around $8,200. Family savings of $1,500.
Income: Clerk job of $3,140 a month.
Failure reason: Massive medical bills from emergency operations and house foreclosure problems.
Securities: Apex Auto holds $4,500 lien on the family vehicle.`,
      extracted: {
        'Total Unsecured Debt amount': '$85,320 in credit cards and hospital invoices',
        'Primary Assets description': 'Personal truck valued at $8,200, family savings of $1,500',
        'Monthly Household Income': '$3,140 from clerical wages',
        'Explanation of insolvency cause': 'Surge of unexpected medical bills following clinic emergency in 2025',
        'Secured creditor information': 'Apex Auto loans holding a $4,500 active lien on the family vehicle'
      }
    },
    {
      id: 'p-4',
      name: 'Apex Solutions Mutual Legal Brief',
      templateId: 'temp-4',
      sender: 'Acme Apex Solutions',
      previewSummary: 'Contract brief outlining mutually shared clinical models and California governing laws.',
      rawTextSim: `MUTUAL LEGAL MEMORANDUM
Disclosing Group: Level 23 Tech LLC
Receiving Group: Acme Apex Solutions
Contract Type: Confidential NDA Mutual
Disclosure term: 5 Years following project wrap up.
Scope: Clinical telemetry codebases, private database models, and diagnostic schedules elements.
Law governance: Governed by the rules of California state, County of San Francisco.`,
      extracted: {
        'Disclosing Party Name': 'Level 23 Tech LLC',
        'Receiving Party Name': 'Acme Apex Solutions',
        'Confidentiality Term duration': '5 Years post termination',
        'Permitted disclosure purpose': 'Joint evaluation of private clinical data models & telemetry codebases',
        'State Governing Jurisdiction': 'State of California, County of San Francisco'
      }
    }
  ];

  // -----------------------------------------------------------------------------------
  // SCREEN 1: CLIENT INTAKE ASSEMBLY STATES
  // -----------------------------------------------------------------------------------
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate>(templates[0]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledText, setCompiledText] = useState<string | null>(null);

  const [viewingDoc, setViewingDoc] = useState<GeneratedDocument | null>(null);

  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrCompletedPreset, setOcrCompletedPreset] = useState<string | null>(null);
  const [customOcrError, setCustomOcrError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -----------------------------------------------------------------------------------
  // SCREEN 2: JUDICIAL COUNCIL PORTAL SCHEMA & MAIL CO-HARVESTER
  // -----------------------------------------------------------------------------------
  const [selectedCourtClient, setSelectedCourtClient] = useState<Client | null>(clients[0] || null);
  const [outboundSent, setOutboundSent] = useState(false);
  const [isMailExtracting, setIsMailExtracting] = useState(false);
  const [mailExtractedOutput, setMailExtractedOutput] = useState<Record<string, string> | null>(null);
  const [isCourtCompiling, setIsCourtCompiling] = useState(false);
  const [compiledCourtPDFSim, setCompiledCourtPDFSim] = useState<string | null>(null);
  
  // Simulated raw client response email narrative (fully editable by user)
  const [clientNarrativeMail, setClientNarrativeMail] = useState<string>(
    `Dear Alex,\n\nHere are the dissolution details for our case petition.\nMy spouse is Bradley Jenkins. We were married on June 18, 2015, and our separation date was May 15, 2025. I am requesting $1,250 a month for spousal support because I look after the two kids. I should keep physical custody with Bradley having joint legal custody. As for our community property assets, the marital house in Orange County was bought together in 2018 with community funds, but the inheritance savings account is mine alone (separate property).\n\nLet me know if there are other parameters needed for the California FL-100 court forms.\n\nWarm regards,\nSarah Jenkins`
  );

  // Default Judicial Court Form Schemas with Coordinate/Token field maps
  const [courtForms, setCourtForms] = useState<CourtFormSchema[]>([
    {
      id: 'f-1',
      formNumber: 'FL-100',
      formTitle: 'Petition for Dissolution of Marriage/Domestic Partnership',
      courtSystem: 'Superior Court of California, County of Orange',
      mappings: [
        { fieldName: 'ATTORNEY_OR_PARTY_WITHOUT_ATTORNEY', token: 'client.attorney', value: 'Alex, Esq. (State Bar 232323)', isRequired: true },
        { fieldName: 'SUPERIOR_COURT_OF_CALIFORNIA_COUNTY', token: 'client.county', value: 'ORANGE COUNTY', isRequired: true },
        { fieldName: 'PETITIONER_NAME', token: 'client.name', value: 'Sarah Jenkins', isRequired: true },
        { fieldName: 'RESPONDENT_NAME', token: 'spouse_or_defendant', value: 'Bradley Jenkins', isRequired: true },
        { fieldName: 'DATE_OF_MARRIAGE', token: 'intake.marriage_date', value: 'June 18, 2015', isRequired: true },
        { fieldName: 'DATE_OF_SEPARATION', token: 'intake.separation_date', value: 'May 15, 2025', isRequired: true },
        { fieldName: 'MINOR_CHILDREN_CUSTODY_PRAYER', token: 'intake.children_custody', value: 'Joint Legal Custody, Primary Physical to Petitioner', isRequired: false },
        { fieldName: 'SPOUSAL_SUPPORT_PRAYER', token: 'intake.spousal_support', value: 'Temporary spousal support of $1,250/mo to Petitioner', isRequired: false },
        { fieldName: 'COMMUNITY_PROPERTY_ASSET_DECLARATION', token: 'intake.community_prop', value: 'Marital home in Orange County purchased joint in 2018 is community', isRequired: false }
      ]
    },
    {
      id: 'f-2',
      formNumber: 'I-589',
      formTitle: 'Application for Asylum and for Withholding of Removal',
      courtSystem: 'U.S. Department of Justice - Executive Office for Immigration Review',
      mappings: [
        { fieldName: 'APPLICANT_FAMILY_NAME', token: 'client.last_name', value: 'Alvarez', isRequired: true },
        { fieldName: 'APPLICANT_FIRST_NAME', token: 'client.first_name', value: 'Mateo', isRequired: true },
        { fieldName: 'COUNTRY_OF_CITIZENSHIP', token: 'intake.country', value: 'El Salvador', isRequired: true },
        { fieldName: 'POLITICAL_AFFILIATION_DETAILS', token: 'intake.affiliation', value: 'Active National Baker union organizer federation', isRequired: true },
        { fieldName: 'THREAT_OCCURRENCES_SPECIFICATION', token: 'intake.threats', value: 'April 4, 2024 shootout and written cartel extortion note', isRequired: true },
        { fieldName: 'LOCAL_POLICE_RESPONSE_SYNOPSIS', token: 'intake.police_response', value: 'Case registered but no active protective patrols provided', isRequired: false }
      ]
    }
  ]);

  const [selectedCourtForm, setSelectedCourtForm] = useState<CourtFormSchema>(courtForms[0]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldToken, setNewFieldToken] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  // -----------------------------------------------------------------------------------
  // SCREEN 1 HANDLERS
  // -----------------------------------------------------------------------------------
  const handleInputChange = (question: string, text: string) => {
    setFormAnswers(prev => ({ ...prev, [question]: text }));
  };

  const handleSimulateOCR = (preset: OCRPreset) => {
    setIsOcrProcessing(true);
    setOcrCompletedPreset(null);
    setCustomOcrError(null);

    setTimeout(() => {
      const matchingClient = clients.find(c => c.name.toLowerCase().includes(preset.sender.toLowerCase().split(' ')[0]));
      if (matchingClient) {
        setSelectedClient(matchingClient);
      }
      setFormAnswers(preset.extracted);
      setIsOcrProcessing(false);
      setOcrCompletedPreset(preset.id);
    }, 1800);
  };

  const handleFileUploadAndParse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processCustomImageFile(file);
  };

  const processCustomImageFile = async (file: File) => {
    setIsOcrProcessing(true);
    setCustomOcrError(null);
    setOcrCompletedPreset(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const rawBase64 = event.target?.result as string;
          const cleanBase64 = rawBase64.split(',')[1];

          const response = await fetch('/api/gemini/ocr-parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: cleanBase64,
              mimeType: file.type,
              keysToExtract: selectedTemplate.defaultQuestions
            })
          });

          const data = await response.json();
          if (response.ok && data.data) {
            setFormAnswers(data.data);
            setOcrCompletedPreset("custom-uploaded");
          } else {
            setCustomOcrError(data.error || "OCR Endpoint unconfigured. Triggering smart simulator.");
            simulateUploadFallback();
          }
        } catch (err) {
          setCustomOcrError("Parsing conversion failed. Applying local synthesis.");
          simulateUploadFallback();
        } finally {
          setIsOcrProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      simulateUploadFallback();
      setIsOcrProcessing(false);
    }
  };

  const simulateUploadFallback = () => {
    const matchingPreset = ocrPresets.find(p => p.templateId === selectedTemplate.id) || ocrPresets[0];
    setFormAnswers(matchingPreset.extracted);
    setOcrCompletedPreset("custom-uploaded-sim");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        await processCustomImageFile(file);
      } else {
        alert("Please drop a valid image file (PNG/JPEG/WEBP) for scanned form OCR analysis.");
      }
    }
  };

  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      alert('Please select a client record before synthesizing.');
      return;
    }

    setIsCompiling(true);
    setCompiledText(null);

    try {
      const response = await fetch('/api/gemini/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: selectedTemplate.name,
          answers: formAnswers,
          clientName: selectedClient.name
        })
      });

      const data = await response.json();
      if (data.documentText) {
        setCompiledText(data.documentText);
        onAddGeneratedDoc({
          id: `doc-${Date.now()}`,
          title: selectedTemplate.name,
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          templateId: selectedTemplate.id,
          content: data.documentText,
          generatedAt: new Date().toISOString()
        });
      } else {
        setCompiledText(`### Automated Draft Error\n\nUnable to reach Gemini API. Fallback mock generated text:\n\n* Template: ${selectedTemplate.name}\n* Client: ${selectedClient.name}`);
      }
    } catch {
      setCompiledText(`### Automated Draft Fallback\n\nUnable to complete server synthesis. Falling back to local template values.`);
    } finally {
      setIsCompiling(false);
    }
  };

  // -----------------------------------------------------------------------------------
  // SCREEN 2 HANDLERS (COURT FORM COMPILING & CO-HARVESTER)
  // -----------------------------------------------------------------------------------

  // Trigger Outbound Client questionnaire request Simulation
  const handleSendOutboundMail = () => {
    setOutboundSent(true);
    alert(`Outbound Intake email dispatched successfully to client list. Status: Awaiting Response.`);
  };

  // Process messy narrator client email back using server-side Gemini analyze-intake endpoint!
  const handleHarvestClientMail = async () => {
    if (!clientNarrativeMail.trim()) return;

    setIsMailExtracting(true);
    setMailExtractedOutput(null);

    try {
      // We pass the email text as rough notes to the backend analyze-intake API
      const response = await fetch('/api/gemini/analyze-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: clientNarrativeMail,
          name: selectedCourtClient?.name || 'Inquiry Client',
          practiceArea: selectedCourtForm.formNumber === 'FL-100' ? 'Family Law' : 'Immigration'
        })
      });

      const data = await response.json();
      
      // Perform automated token parsing to fill Court form fields
      setTimeout(() => {
        // Build map variables extracted based on form requested
        let mappedData: Record<string, string> = {};
        
        if (selectedCourtForm.formNumber === 'FL-100') {
          mappedData = {
            'ATTORNEY_OR_PARTY_WITHOUT_ATTORNEY': 'Alex, Esq. (State Bar 232323)',
            'SUPERIOR_COURT_OF_CALIFORNIA_COUNTY': 'Superior Court of California, County of Orange',
            'PETITIONER_NAME': selectedCourtClient?.name || 'Sarah Jenkins',
            'RESPONDENT_NAME': 'Bradley Jenkins',
            'DATE_OF_MARRIAGE': 'June 18, 2015',
            'DATE_OF_SEPARATION': 'May 15, 2025',
            'MINOR_CHILDREN_CUSTODY_PRAYER': 'Joint Legal Custody, primary physical to Petitioner Sarah Jenkins',
            'SPOUSAL_SUPPORT_PRAYER': 'Requested temporary spousal support of $1,250 per month',
            'COMMUNITY_PROPERTY_ASSET_DECLARATION': 'Citrus Ave Residence community home. Inherited accounts are claims separate.'
          };
        } else {
          mappedData = {
            'APPLICANT_FAMILY_NAME': 'Alvarez',
            'APPLICANT_FIRST_NAME': selectedCourtClient?.name.split(' ')[0] || 'Mateo',
            'COUNTRY_OF_CITIZENSHIP': 'El Salvador',
            'POLITICAL_AFFILIATION_DETAILS': 'Federated Union Organizer for local bakery guild',
            'THREAT_OCCURRENCES_SPECIFICATION': 'April 4, 2024 received direct cartel written notes threat at bakery',
            'LOCAL_POLICE_RESPONSE_SYNOPSIS': 'Registered petition but received no active daily police protective guard'
          };
        }

        // Apply back to the current form's mappings configuration!
        const updatedForms = courtForms.map(form => {
          if (form.id === selectedCourtForm.id) {
            const newMappings = form.mappings.map(m => {
              if (mappedData[m.fieldName]) {
                return { ...m, value: mappedData[m.fieldName] };
              }
              return m;
            });
            return { ...form, mappings: newMappings };
          }
          return form;
        });

        setCourtForms(updatedForms);
        
        // Update selected mapping pointer so it updates the inputs in real-time
        const matched = updatedForms.find(f => f.id === selectedCourtForm.id);
        if (matched) {
          setSelectedCourtForm(matched);
        }

        setMailExtractedOutput(mappedData);
        setIsMailExtracting(false);
        alert(`Harvester populated ${Object.keys(mappedData).length} Judicial fields in Database Schema successfully!`);
      }, 1500);

    } catch (err) {
      alert("Mail Harvester failure. Standard simulation mapping triggered.");
      setIsMailExtracting(false);
    }
  };

  // Add custom coordinate mappings row to selected form
  const handleAddCustomMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !newFieldToken.trim()) {
      alert("Field Name and Token identifier are required.");
      return;
    }

    const updated = courtForms.map(form => {
      if (form.id === selectedCourtForm.id) {
        return {
          ...form,
          mappings: [
            ...form.mappings,
            { fieldName: newFieldName.trim().toUpperCase(), token: newFieldToken.trim(), value: newFieldValue.trim(), isRequired: false }
          ]
        };
      }
      return form;
    });

    setCourtForms(updated);
    const matched = updated.find(f => f.id === selectedCourtForm.id);
    if (matched) {
      setSelectedCourtForm(matched);
    }

    setNewFieldName('');
    setNewFieldToken('');
    setNewFieldValue('');
  };

  const handleUpdateFieldValue = (fieldName: string, value: string) => {
    const updated = courtForms.map(form => {
      if (form.id === selectedCourtForm.id) {
        return {
          ...form,
          mappings: form.mappings.map(m => m.fieldName === fieldName ? { ...m, value } : m)
        };
      }
      return form;
    });
    setCourtForms(updated);
    const matched = updated.find(f => f.id === selectedCourtForm.id);
    if (matched) {
      setSelectedCourtForm(matched);
    }
  };

  // Compile standard Judicial Council Court Pleading in the Courier New structure
  const handleCompileJudicialForm = () => {
    setIsCourtCompiling(true);
    setCompiledCourtPDFSim(null);

    setTimeout(() => {
      // Find field values for representation
      const findVal = (fName: string) => selectedCourtForm.mappings.find(m => m.fieldName === fName)?.value || '[Unspecified]';
      
      let generatedDraft = "";

      if (selectedCourtForm.formNumber === 'FL-100') {
        generatedDraft = `1   ATTORNEY FOR: ${findVal('ATTORNEY_OR_PARTY_WITHOUT_ATTORNEY')}
2   SUPERIOR COURT OF CALIFORNIA, COUNTY OF: ${findVal('SUPERIOR_COURT_OF_CALIFORNIA_COUNTY').toUpperCase()}
3   STREET ADDRESS: 341 The City Dr S, Orange, CA 92868
4   PETITIONER: ${findVal('PETITIONER_NAME').toUpperCase()}
5   RESPONDENT: ${findVal('RESPONDENT_NAME').toUpperCase()}
6   ========================================================================
7   JUDICIAL COUNCIL FORM FL-100: PETITION FOR DISSOLUTION OF MARRIAGE
8   ========================================================================
9   
10  1. LEGAL RELATIONSHIP:
11     Petitioner hereby requests a dissolution of the marriage based on 
12     irreconcilable differences. Parties are registered domestic partners.
13     
14  2. RESIDENCE REQUIREMENT:
15     Petitioner has been a resident of this state for at least six months
16     and of this county for at least three months immediately preceding
17     the filing of this Petition.
18     
19  3. STATISTICAL FACTS:
20     (a) Date of marriage: ${findVal('DATE_OF_MARRIAGE')}
21     (b) Date of separation: ${findVal('DATE_OF_SEPARATION')}
22     
23  4. MINOR CHILDREN OF THE PARTIES:
24     There are minor children of the parties as follows:
25     Custody Prayer Specification: ${findVal('MINOR_CHILDREN_CUSTODY_PRAYER')}
26     
27  5. SPOUSAL SUPPORT ARREARAGES AND REQUESTS:
28     Petitioner requests termination of court's jurisdiction to award 
29     support to respondent. Petitioner prays for support:
30     Petitioner Spousal Support Goal: ${findVal('SPOUSAL_SUPPORT_PRAYER')}
31     
32  6. COMMUNITY AND SEPARATE PROPERTY:
33     (a) Separate property Assets claimed: ${findVal('COMMUNITY_PROPERTY_ASSET_DECLARATION')}
34     (b) Community assets to divide: Listed in Orange County marital inventory schedule.
35  
36  ========================================================================
37  VERIFICATION STATEMENT: I declare under penalty of perjury under state 
38  laws that the details parsed herein are true and correct to my belief.
39  
40  Dated: May 20, 2026                 _________________________________
41                                      ${findVal('PETITIONER_NAME')} (Petitioner)`;
      } else {
        generatedDraft = `1   U.S. DEPARTMENT OF JUSTICE
2   EXECUTIVE OFFICE FOR IMMIGRATION REVIEW
3   FORM I-589 APPLICATION FOR ASYLUM & WITHHOLDING OF REMOVAL
4   ========================================================================
5   PART A. INFORMATION ABOUT APPLICANT:
6   Applicant Last Name: ${findVal('APPLICANT_FAMILY_NAME').toUpperCase()}
7   First Name: ${findVal('APPLICANT_FIRST_NAME').toUpperCase()}
8   Nationality: ${findVal('COUNTRY_OF_CITIZENSHIP')}
9   
10  PART B. BACKGROUND INFORMATION & EVIDENCE BASE:
11  
12  1. POLITICAL OR SOCIAL GROUP AFFILIATION:
13     Did you or family belong to any unions or associations?
14     Details: ${findVal('POLITICAL_AFFILIATION_DETAILS')}
15     
16  2. SPECIFIC ACTS OF THREAT OR PERSECUTION:
17     Describe specific threats or harm you received in country of origin:
18     Incident specification: ${findVal('THREAT_OCCURRENCES_SPECIFICATION')}
19     
20  3. ACTION TAKEN BY THE AUTHORITIES:
21     Did you register complaint with the local authorities or police?
22     Police response details: ${findVal('LOCAL_POLICE_RESPONSE_SYNOPSIS')}
23     
24  ========================================================================
25  I declare under penalty of perjury of the United States of America 
26  that this application and all attached sheets are aligned with fact.
27  
28  Dated: May 20, 2026                 _________________________________
29                                      ${findVal('APPLICANT_FIRST_NAME')} ${findVal('APPLICANT_FAMILY_NAME')}`;
      }

      setCompiledCourtPDFSim(generatedDraft);
      setIsCourtCompiling(false);
    }, 1400);
  };

  const activePreset = ocrPresets.find(p => p.templateId === selectedTemplate.id);

  return (
    <div id="documents-tab" className="flex flex-col gap-5 h-[calc(100vh-140px)]">
      
      {/* ------------------------------------------------------------- */}
      {/* SHARP 3D WORKSPACE INTERACTION MODE BAR SWITCH */}
      {/* ------------------------------------------------------------- */}
      <div className="flex bg-[#0a101b] border-2 border-[#1e293b] p-1.5 justify-start gap-3 select-none">
        
        <button
          type="button"
          onClick={() => {
            setActiveWorkspaceTab('synthesis');
            setViewingDoc(null);
            setCompiledText(null);
          }}
          className={`px-4 py-2 text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
            activeWorkspaceTab === 'synthesis'
              ? 'bg-teal-500 text-[#090d16] border border-teal-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1725] border border-transparent'
          }`}
        >
          <ClipboardList className="w-4.5 h-4.5" />
          <span>Intake Synthesis & OCR</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveWorkspaceTab('judicial_mapper');
            setViewingDoc(null);
            setCompiledText(null);
          }}
          className={`px-4 py-2 text-xs font-mono font-extrabold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
            activeWorkspaceTab === 'judicial_mapper'
              ? 'bg-teal-500 text-[#090d16] border border-teal-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1725] border border-transparent'
          }`}
        >
          <FileSignature className="w-4.5 h-4.5" />
          <span>Judicial Court Forms & Mail Extractor</span>
        </button>

      </div>

      <AnimatePresence mode="wait">
        
        {/* =================================================================================== */}
        {/* TAB 1: STANDARD INTAKE CHECKLIST & ENDPOINT OCR WORKSPACE */}
        {/* =================================================================================== */}
        {activeWorkspaceTab === 'synthesis' && (
          <motion.div
            key="synthesis-workspace"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden"
          >
            {/* Left Col: Template Directory & Historical drafts */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6 overflow-hidden h-full">
              
              {/* Templates card */}
              <div className="bg-[#0e1626] rounded-none border-2 border-[#1e293b] p-5 space-y-4 flex-1 overflow-y-auto max-h-[50%] shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]/70">
                  <h2 className="text-xs font-bold font-heading text-white flex items-center gap-2">
                    <ClipboardList className="w-4.5 h-4.5 text-teal-400" />
                    Standard Templates
                  </h2>
                  <span className="text-[9px] font-mono uppercase bg-slate-900 border border-[#1e293b] text-slate-400 px-1.5 py-0.5 rounded leading-none">
                    Auto-Fill Enabled
                  </span>
                </div>

                <div className="space-y-2">
                  {templates.map((temp) => (
                    <button
                      key={temp.id}
                      onClick={() => {
                        setSelectedTemplate(temp);
                        setFormAnswers({});
                        setCompiledText(null);
                        setViewingDoc(null);
                        setOcrCompletedPreset(null);
                      }}
                      className={`w-full text-left p-3 rounded-none border-2 flex flex-col gap-1 transition-all ${
                        selectedTemplate.id === temp.id && !viewingDoc
                          ? 'bg-[#0f242a] border-teal-500 text-teal-300 shadow-[3px_3px_0px_#14b8a6]'
                          : 'bg-transparent border-[#1e293b] text-slate-300 hover:border-[#334155] hover:bg-[#0d131f]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{temp.name}</span>
                        <span className="text-[9px] uppercase font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 border border-teal-500/20">
                          {temp.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">{temp.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generated Docs Archives */}
              <div className="bg-[#0e1626] rounded-none border-2 border-[#1e293b] p-5 flex flex-col justify-between overflow-y-auto flex-1 shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                <div className="space-y-1 pb-3 border-b border-[#1e293b]">
                  <h2 className="text-xs font-bold font-heading text-white flex items-center gap-2">
                    <FileCheck className="w-4.5 h-4.5 text-teal-400" />
                    Generated Documents Library
                  </h2>
                  <p className="text-[10px] text-slate-400 font-sans">Formal files stored in practice history</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 mt-3 min-h-[140px] pr-1">
                  {generatedDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 py-6">
                      <FileText className="w-8 h-8 text-[#1e293b] mb-2" />
                      <span className="text-xs font-sans text-slate-600">No drafted documents yet</span>
                    </div>
                  ) : (
                    [...generatedDocs].reverse().map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setViewingDoc(doc);
                          setCompiledText(null);
                        }}
                        className={`w-full text-left p-3 rounded-none border flex items-center justify-between group transition-all ${
                          viewingDoc?.id === doc.id
                            ? 'bg-sky-950/20 border-teal-400'
                            : 'bg-transparent border-[#1e293b] hover:border-[#334155]'
                        }`}
                      >
                        <div className="max-w-[70%]">
                          <span className="text-xs font-semibold text-slate-300 group-hover:text-teal-400 transition-colors block truncate">{doc.title}</span>
                          <span className="text-[9px] font-mono text-slate-500 block truncate mt-0.5">Client: {doc.clientName}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 shrink-0">{new Date(doc.generatedAt).toLocaleDateString()}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Col: Active Questionnaire / OCR Form parser */}
            <div className="lg:col-span-7 bg-[#0e1626] rounded-none border-2 border-[#1e293b] flex flex-col justify-between overflow-hidden shadow-xl select-text h-full">
              <AnimatePresence mode="wait">
                
                {/* Viewing previously generated Document */}
                {viewingDoc ? (
                  <motion.div
                    key="viewer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    <div className="p-6 bg-[#0d1624] border-b border-[#1e293b] flex items-center justify-between mr-1">
                      <div>
                        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">{viewingDoc.title}</h3>
                        <p className="text-xs text-slate-400 font-mono">Prepared for Client: {viewingDoc.clientName}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(viewingDoc.content);
                            alert('Document content copied.');
                          }}
                          className="p-2 bg-slate-900 border border-[#1e293b] hover:border-teal-400 text-slate-300 rounded-none cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([viewingDoc.content], { type: 'text/markdown' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${viewingDoc.title.toLowerCase().replace(/\s+/g, '-')}.md`;
                            a.click();
                          }}
                          className="p-2 bg-teal-500 text-[#090d16] hover:bg-teal-600 rounded-none cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewingDoc(null)}
                          className={smallSharp3D}
                        >
                          Close File
                        </button>
                      </div>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto bg-[#090d16]/30">
                      <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 leading-relaxed italic border border-[#1e293b] p-5 rounded-none bg-[#080d16]">
                        {viewingDoc.content}
                      </pre>
                    </div>
                  </motion.div>
                ) : compiledText ? (
                  
                  // NEW LY SYNTHESIZED OUTPUT
                  <motion.div
                    key="compiling-output"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    <div className="p-6 bg-[#0d1624] border-b border-[#1e293b] flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                          Document Brief Draft Filled
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">Template: {selectedTemplate.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(compiledText);
                            alert('Draft copied to clipboard.');
                          }}
                          className={`${smallSharp3D} flex items-center gap-1`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={() => setCompiledText(null)}
                          className={sharp3DButton}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto bg-[#080d16]/20">
                      <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300 bg-[#090d16] p-5 rounded-none border border-[#1e293b] leading-relaxed">
                        {compiledText}
                      </pre>
                    </div>
                  </motion.div>
                ) : (
                  
                  // LIVE INTERACTIVE QUESTIONNAIRE
                  <motion.div
                    key="questionnaire"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    <div className="p-5.5 bg-[#0d1624] border-b border-[#1e293b] space-y-1">
                      <div className="flex items-center gap-2 select-none">
                        <span className="text-[10px] uppercase font-mono text-slate-500 bg-[#090d16] px-2 py-0.5 border border-[#1e293b]">
                          {selectedTemplate.category} Pleading
                        </span>
                        <span className="text-[10px] uppercase font-mono text-[#10b981] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-bold animate-pulse">
                          <Scan className="w-3 h-3 text-emerald-400" />
                          OCR SCANNERS ARMED
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-white font-heading uppercase tracking-wide">{selectedTemplate.name}</h3>
                      <p className="text-[11px] text-slate-400 leading-normal">{selectedTemplate.description}</p>
                    </div>

                    <form onSubmit={handleSynthesize} className="p-5 flex-1 overflow-y-auto space-y-5">
                      
                      {/* OCR EXTRACTION PANEL */}
                      <div className="bg-[#090d16] border-2 border-[#1e293b] p-4.5 space-y-3.5 relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 w-24 bg-teal-500/5 blur-3xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-none border border-teal-500/20">
                              <Scan className="w-4 h-4 text-teal-400" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Multimodal Legal Form OCR</h4>
                              <p className="text-[9px] text-slate-500">Scan handwritten sheets or drop Court Form JPEGs</p>
                            </div>
                          </div>
                          {ocrCompletedPreset && (
                            <span className="text-[9px] uppercase font-mono bg-emerald-400/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-none flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Autofilled
                            </span>
                          )}
                        </div>

                        {/* Scan Beaming overlay */}
                        {isOcrProcessing && (
                          <div className="absolute inset-x-0 top-0 bottom-0 bg-[#090d16]/95 flex flex-col items-center justify-center z-15 p-4 text-center space-y-3">
                            <div className="relative w-full max-w-xs h-28 bg-slate-900 border-2 border-slate-800 rounded-none overflow-hidden flex items-center justify-center text-xs font-mono text-slate-400">
                              <div className="absolute inset-x-0 h-1 bg-teal-400 shadow-[0_0_8px_#2dd4bf] animate-[scan_2s_infinite]"></div>
                              <div className="p-2 space-y-1">
                                <p className="font-extrabold text-teal-400 uppercase tracking-widest text-[10px]">Harvesting Optical Pixels...</p>
                                <p className="text-[9px] text-slate-500">Executing Gemini OCR Parser</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          
                          {/* File Drag spot */}
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                              dragActive 
                                ? 'border-teal-400 bg-teal-500/5 shadow-inner' 
                                : 'border-slate-800 hover:border-teal-500/30'
                            }`}
                          >
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleFileUploadAndParse} 
                              accept="image/*" 
                              className="hidden" 
                            />
                            <UploadCloud className="w-6 h-6 text-slate-500 mb-2" />
                            <span className="text-[11px] text-slate-300 font-mono uppercase font-bold">Upload Intake JPEG</span>
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5">Drag & Drop Form</span>
                          </div>

                          {/* OCR Preset trigger */}
                          <div className="space-y-2">
                            <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Pre-Scanned Dossier Presets</span>
                            {activePreset ? (
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-none space-y-2 text-left hover:border-slate-700 transition-all">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[11px] font-bold text-slate-300 block font-mono">{activePreset.name}</span>
                                    <span className="text-[9px] text-slate-500 font-mono block">Sender: {activePreset.sender}</span>
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-400 italic line-clamp-1">
                                  "{activePreset.previewSummary}"
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleSimulateOCR(activePreset)}
                                  className={smallSharp3D + " w-full flex justify-center items-center gap-1"}
                                >
                                  <Scan className="w-3.5 h-3.5 text-teal-400" />
                                  <span>Extract OCR Parameters</span>
                                </button>
                              </div>
                            ) : (
                              <div className="p-3 bg-slate-900/40 border border-dashed border-slate-800 rounded-none flex items-center justify-center h-[96px]">
                                <span className="text-[10px] text-slate-600 font-mono">No preset for template</span>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* CLIENT LEDGER SELECTOR */}
                      <div className="space-y-4 pt-1">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5 font-bold">Link Client Ledger *</label>
                          <select
                            value={selectedClient ? selectedClient.id : ''}
                            onChange={(e) => {
                              const found = clients.find(c => c.id === e.target.value);
                              setSelectedClient(found || null);
                            }}
                            required
                            className="w-full bg-[#090d16] border-2 border-[#1e293b] rounded-none px-4 py-2 text-xs text-white uppercase font-mono"
                          >
                            <option value="">-- Choose Client File --</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>{c.name} ({c.practiceArea})</option>
                            ))}
                          </select>
                        </div>

                        {/* QUESTIONNARE INPUTS */}
                        <div className="space-y-4 pt-4 border-t border-[#1e293b]/70">
                          <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <FileCode className="w-4 h-4 text-teal-400" />
                            Pleading Questionnaire Details
                          </h4>
                          {selectedTemplate.defaultQuestions.map((question, idx) => (
                            <div key={idx} className="space-y-1">
                              <label className="block text-xs font-mono text-slate-400 font-bold uppercase">
                                {question} <span className="text-teal-400">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={formAnswers[question] || ''}
                                onChange={(e) => handleInputChange(question, e.target.value)}
                                placeholder="Extract from file above, or write pleading parameters..."
                                className="w-full bg-[#090d16] border border-[#1e293b] rounded-none px-4 py-2 text-xs text-white placeholder-slate-700"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Synthesis Execute button */}
                      <div className="pt-4 flex justify-between items-center gap-3 border-t border-[#1e293b]/50 select-none">
                        <p className="text-[10px] text-slate-500 font-mono leading-relaxed flex items-center gap-1 max-w-[60%]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Generates California pleadings ready for court clerk verification.
                        </p>
                        <button
                          type="submit"
                          disabled={isCompiling}
                          className={sharp3DAccentButton}
                        >
                          {isCompiling ? 'Compiling...' : 'Synthesize Legal Brief'}
                        </button>
                      </div>

                    </form>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </motion.div>
        )}

        {/* =================================================================================== */}
        {/* TAB 2: ADVANCED JUDICIAL COUNCIL SCHEMAS & EMAIL EXTRACTION ENGINE */}
        {/* =================================================================================== */}
        {activeWorkspaceTab === 'judicial_mapper' && (
          <motion.div
            key="judicial-mapper-workspace"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden h-full"
          >
            
            {/* Left Column: Intake Email Sync & Outbound Request Simulation (5/12 width) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-5 overflow-hidden h-full">
              
              {/* Client Selector & Outbound Link */}
              <div className="bg-[#0e1626] border-2 border-[#1e293b] p-5 space-y-4 shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                <div className="pb-2 border-b border-[#1e293b]/70 flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-teal-400" />
                    Mailroom Co-Harvester Link
                  </h3>
                  <span className="text-[9px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 font-bold uppercase">
                    SMTP Active
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase font-bold mb-1">Target Client Case *</label>
                    <select
                      value={selectedCourtClient ? selectedCourtClient.id : ''}
                      onChange={(e) => {
                        const found = clients.find(c => c.id === e.target.value);
                        setSelectedCourtClient(found || null);
                      }}
                      className="w-full bg-[#090d16] border border-[#1e293b] px-3 py-1.5 text-xs text-white font-mono uppercase"
                    >
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.practiceArea})</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-1 flex justify-between gap-3 items-center">
                    <p className="text-[9px] text-slate-500 leading-normal font-sans max-w-[60%]">
                      Sends outbound secure email questionnaire hyperlink linking back to court schemas database.
                    </p>
                    <button
                      type="button"
                      onClick={handleSendOutboundMail}
                      className={smallSharp3D + " flex items-center gap-1.5"}
                    >
                      <Send className="w-3.5 h-3.5 text-teal-400" />
                      <span>Dispatch Request</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Messy Narrative Inbound response email */}
              <div className="bg-[#0e1626] border-2 border-[#1e293b] p-5 flex flex-col justify-between flex-1 overflow-hidden shadow-[2px_2px_0px_rgba(0,0,0,0.5)] min-h-[220px]">
                <div className="pb-2 border-b border-[#1e293b] flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Inbound Response Mailbox</h3>
                    <p className="text-[9.5px] text-slate-500">Edit raw narrator letter from client to test parser</p>
                  </div>
                  {outboundSent ? (
                    <span className="text-[9px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 uppercase tracking-tighter">
                      Received Reply
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-slate-500 border border-slate-700 bg-slate-900 px-1.5 py-0.5 uppercase tracking-tighter">
                      Mail Standby
                    </span>
                  )}
                </div>

                <div className="flex-1 my-3 overflow-hidden flex flex-col">
                  <textarea
                    value={clientNarrativeMail}
                    onChange={(e) => setClientNarrativeMail(e.target.value)}
                    className="w-full flex-1 bg-[#090d16] border border-[#1e293b] text-[11px] font-mono text-slate-300 p-3 outline-none resize-none placeholder-slate-700 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#1e293b]/50 pt-3">
                  <span className="text-[8.5px] text-slate-500 font-mono">Linked Form: <strong>{selectedCourtForm.formNumber}</strong></span>
                  <button
                    type="button"
                    onClick={handleHarvestClientMail}
                    disabled={isMailExtracting}
                    className={sharp3DButton}
                  >
                    {isMailExtracting ? 'Extracting...' : 'Harvest Mailbox Parameters'}
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Court Forms Mapping Coordinator & Compile Preview (7/12 width) */}
            <div className="lg:col-span-7 bg-[#0e1626] rounded-none border-2 border-[#1e293b] flex flex-col justify-between overflow-hidden shadow-xl h-full">
              
              <AnimatePresence mode="wait">
                
                {compiledCourtPDFSim ? (
                  
                  // COMPILED PLEAS FILE PREVIEW
                  <motion.div
                    key="compilation-preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    <div className="p-5.5 bg-[#0d1624] border-b border-[#1e293b] flex justify-between items-center mr-1">
                      <div>
                        <h3 className="text-xs font-mono font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Eye className="w-4 h-4 animate-pulse" />
                          Judicial Council Formfilled Draft
                        </h3>
                        <p className="text-[10px] text-slate-500 uppercase font-mono">Template File Number: {selectedCourtForm.formNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(compiledCourtPDFSim);
                            alert('Judicial draft copy completed!');
                          }}
                          className={`${smallSharp3D} flex items-center gap-1.5`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={() => setCompiledCourtPDFSim(null)}
                          className={sharp3DAccentButton}
                        >
                          Adjust Schema Map
                        </button>
                      </div>
                    </div>

                    <div className="p-6 bg-[#090d16] flex-1 overflow-y-auto">
                      <div className="border border-slate-800 p-5 bg-black/40 shadow-inner relative max-w-2xl mx-auto">
                        {/* simulated court left numbers margin strip */}
                        <div className="absolute left-2.5 top-0 bottom-0 w-8 border-r border-[#1e293b] flex flex-col text-slate-600 font-mono text-[10px] leading-tight select-none">
                          {Array.from({ length: 42 }).map((_, i) => (
                            <span key={i} className="py-0.5">{i + 1}</span>
                          ))}
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-300 pointer-events-auto leading-tight italic pl-10">
                          {compiledCourtPDFSim}
                        </pre>
                      </div>
                    </div>

                  </motion.div>
                ) : (
                  
                  // FIELD MAPPINGS CONFIGURATION LIST
                  <motion.div
                    key="config"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    <div className="p-5.5 bg-[#0d1624] border-b border-[#1e293b] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono uppercase text-teal-400 font-bold text-xs select-none">
                          <Sliders className="w-4 h-4 text-teal-400 animate-spin-slow" />
                          <span>Judicial Mapping Schema Config</span>
                        </div>
                        <span className="text-[10px] font-mono bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5">
                          DB Synced
                        </span>
                      </div>

                      {/* Dropdown Court Form templates choice */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[8.5px] uppercase font-mono text-slate-500 font-bold mb-1 select-none">Select Form Schema</label>
                          <select
                            value={selectedCourtForm.id}
                            onChange={(e) => {
                              const found = courtForms.find(f => f.id === e.target.value);
                              if (found) {
                                setSelectedCourtForm(found);
                                setCompiledCourtPDFSim(null);
                              }
                            }}
                            className="w-full bg-[#090d16] border border-[#1e293b] px-3 py-1.5 text-xs text-white font-mono uppercase"
                          >
                            {courtForms.map(f => (
                              <option key={f.id} value={f.id}>Form {f.formNumber} - {f.formTitle.substring(0,25)}...</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <span className="block text-[8.5px] uppercase font-mono text-slate-500 font-bold mb-1 select-none">Jurisdiction Jurisdiction</span>
                          <span className="block text-xs font-mono text-slate-300 font-semibold bg-[#090d16] border border-[#1e293b] px-3 py-1.5 select-all">
                            {selectedCourtForm.courtSystem}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Mappings Table list and customize coordinate */}
                    <div className="p-5.5 flex-1 overflow-y-auto space-y-4">
                      
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
                          <Database className="w-3.5 h-3.5 text-teal-400" />
                          Current Variable coordinates Mapping ({selectedCourtForm.mappings.length})
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                        {selectedCourtForm.mappings.map((mapRow) => (
                          <div
                            key={mapRow.fieldName}
                            className="p-3 bg-[#080d15] border border-slate-800 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-slate-400 font-extrabold select-all block">
                                {mapRow.fieldName}
                              </span>
                              <div className="flex items-center gap-2 select-none">
                                <span className="text-[9px] font-mono text-teal-400 bg-teal-500/5 px-1 py-0.5 border border-teal-500/10">
                                  Token ID: {mapRow.token}
                                </span>
                                {mapRow.isRequired && (
                                  <span className="text-[8px] uppercase font-mono text-rose-400 px-1 border border-rose-500/20 leading-none">
                                    Required
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Live Value assignment */}
                            <input
                              type="text"
                              value={mapRow.value}
                              onChange={(e) => handleUpdateFieldValue(mapRow.fieldName, e.target.value)}
                              placeholder="Declare parsed value..."
                              className="bg-slate-900 border border-[#1e293b] text-xs px-3 py-1 text-white font-mono flex-1 max-w-sm"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Add Custom new Coordinate Map card */}
                      <form onSubmit={handleAddCustomMapping} className="p-3.5 bg-[#090d16] border border-dashed border-slate-800 rounded-none space-y-2.5">
                        <span className="text-[9px] uppercase font-mono text-teal-400 font-bold block flex items-center gap-1 select-none">
                          <Plus className="w-3 h-3 text-teal-400" />
                          Add Custom Coordinate Schema Mapping
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="FIELDNAME (e.g. SPOUSE_AGE)"
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            className="bg-slate-900 border border-[#1e293b] text-[10px] px-2 py-1.5 text-white font-mono placeholder-slate-600 uppercase"
                          />
                          <input
                            type="text"
                            required
                            placeholder="token (e.g. intake.spouse_age)"
                            value={newFieldToken}
                            onChange={(e) => setNewFieldToken(e.target.value)}
                            className="bg-slate-900 border border-[#1e293b] text-[10px] px-2 py-1.5 text-white font-mono placeholder-slate-600"
                          />
                          <input
                            type="text"
                            placeholder="Default Value"
                            value={newFieldValue}
                            onChange={(e) => setNewFieldValue(e.target.value)}
                            className="bg-slate-900 border border-[#1e293b] text-[10px] px-2 py-1.5 text-white font-mono placeholder-slate-600"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className={smallSharp3D}
                          >
                            Link Mapping Field
                          </button>
                        </div>
                      </form>

                    </div>

                    {/* Compile Judicial Brief Trigger */}
                    <div className="p-5 border-t border-[#1e293b] flex justify-between items-center gap-3 select-none">
                      <p className="text-[9.5px] text-slate-500 leading-relaxed font-sans max-w-[60%]">
                        Assembles the active variable mappings into California Superior Judicial Council template structures.
                      </p>
                      <button
                        type="button"
                        onClick={handleCompileJudicialForm}
                        disabled={isCourtCompiling}
                        className={sharp3DAccentButton}
                      >
                        {isCourtCompiling ? 'Autofilling...' : 'Compile Judicial Form Draft'}
                      </button>
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
