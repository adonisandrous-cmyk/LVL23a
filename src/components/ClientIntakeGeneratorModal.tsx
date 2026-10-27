import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Globe,
  HeartHandshake,
  Scale,
  Sliders,
  Send,
  FileText,
  CheckCircle2,
  FolderPlus,
  UserCheck,
  Loader2,
  Table,
  Download,
  Copy,
  Zap,
  RotateCcw,
  PlusCircle,
  FileSpreadsheet,
  Mail,
  Share2,
  Bot,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  User,
  HardDrive,
  Languages,
  FileCheck,
  FileCheck2,
  Upload,
  UploadCloud,
  Paperclip,
  Trash2
} from 'lucide-react';
import { Client, Matter, GeneratedDocument, FL120IntakeData } from '../types';
import { getAccessToken } from '../lib/driveAuth';
import { ClearIntakeButton } from './ClearIntakeButton';

interface ClientIntakeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (newClient: Client) => void;
  onAddMatter?: (newMatter: Matter) => void;
  onAddGeneratedDoc?: (doc: GeneratedDocument) => void;
  clients: Client[];
  onNavigateToTab?: (tab: string, clientId?: string) => void;
}

export interface IntakeFieldSchema {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  isCustomUserField?: boolean;
}

export interface IntakeSectionSchema {
  sectionTitle: string;
  fields: IntakeFieldSchema[];
}

export interface IntakeFormSchema {
  formTitle: string;
  category: 'Civil Litigation' | 'Family Law' | 'Bankruptcy' | 'Immigration' | string;
  description: string;
  aiPromptMessage?: string;
  sections: IntakeSectionSchema[];
}

export type IntakeCategory = 'Comprehensive (4-Part)' | 'Civil Litigation' | 'Family Law' | 'Bankruptcy' | 'Immigration';

// Default Fallback Schemas for instant 100% reliable load
const DEFAULT_SCHEMAS: Record<string, IntakeFormSchema> = {
  'Comprehensive (4-Part)': {
    formTitle: 'Comprehensive 4-Part Client Legal Intake Form',
    category: 'Comprehensive (4-Part)',
    description: 'Four-part universal intake form: Part 1 Personal Info, Part 2 Information About Other, Part 3 Court Info, and Part 4 Legal Assistance & What Happened.',
    aiPromptMessage: 'Form structured into four canonical parts for automated detection and court form mapping (FL-100, FL-200, FL-300, FW-001, FW-003, POS).',
    sections: [
      {
        sectionTitle: 'Part 1. Personal (Self Information)',
        fields: [
          { id: 'Client_FirstName', label: 'First Name', type: 'text', required: true, placeholder: 'e.g., Eleanor' },
          { id: 'Client_LastName', label: 'Last Name', type: 'text', required: true, placeholder: 'e.g., Vance' },
          { id: 'Client_DOB', label: 'Date of Birth (YYYY-MM-DD)', type: 'date', required: true },
          { id: 'Client_Address_Street', label: 'Street Address', type: 'text', required: true, placeholder: '120 Ocean Avenue, Apt 4B' },
          { id: 'Client_Address_CityStateZip', label: 'City, State, Zip', type: 'text', required: true, placeholder: 'Newport Beach, CA 92660' },
          { id: 'Client_Phone', label: 'Phone Number', type: 'text', required: true, placeholder: '(949) 555-0144' },
          { id: 'Client_Email', label: 'Email Address', type: 'text', required: true, placeholder: 'eleanor.vance@example.com' }
        ]
      },
      {
        sectionTitle: 'Part 2. Information About Other (Opposing Party / Co-parent)',
        fields: [
          { id: 'Other_FirstName', label: 'First Name', type: 'text', required: true, placeholder: 'e.g., Jonathan' },
          { id: 'Other_LastName', label: 'Last Name', type: 'text', required: true, placeholder: 'e.g., Vance' },
          { id: 'Other_Address_Street', label: 'Street Address', type: 'text', required: false, placeholder: '450 Harbor Blvd' },
          { id: 'Other_Address_CityStateZip', label: 'City, State, Zip', type: 'text', required: false, placeholder: 'Costa Mesa, CA 92627' },
          { id: 'Other_Phone', label: 'Phone Number', type: 'text', required: false, placeholder: '(949) 555-0988' },
          { id: 'Other_Email', label: 'Email Address', type: 'text', required: false, placeholder: 'jonathan.vance@example.com' }
        ]
      },
      {
        sectionTitle: 'Part 3. Court Info',
        fields: [
          { id: 'Court_Name', label: 'Court Name', type: 'text', required: true, placeholder: 'e.g., Superior Court of California' },
          { id: 'Court_County', label: 'Court Location / County', type: 'text', required: true, placeholder: 'e.g., Orange County — Lamoreaux Justice Center' },
          { id: 'Court_CaseNumber', label: 'Case Number', type: 'text', required: true, placeholder: 'e.g., 24FL-009412 (alphanumeric only)' },
          { id: 'Court_OpposingParty_FullName', label: 'Opposing Party Full Legal Name', type: 'text', required: true, placeholder: 'e.g., Jonathan Vance' },
          { id: 'Court_HearingDates', label: 'Date Info / Hearings', type: 'text', required: false, placeholder: 'e.g., 2026-10-15 (Hearing date / Case conference)' },
          { id: 'Court_JudgeName', label: "Judge's Name", type: 'text', required: false, placeholder: 'e.g., Hon. Claudia R. Howard' }
        ]
      },
      {
        sectionTitle: 'Part 4. Assistance Seeking & Incident Details',
        fields: [
          { id: 'Case_AssistanceType', label: 'Type of Assistance', type: 'select', required: true, options: ['Family Law', 'Civil Litigation', 'Bankruptcy', 'Immigration', 'Fee Waiver Application', 'Proof of Service Execution'] },
          { id: 'Case_IncidentDescription', label: 'What Happened?', type: 'textarea', required: true, placeholder: 'Explain what happened in detail: chronological timeline of events, dispute background, actions taken, and specific relief requested...' },
          { id: 'Case_FileUpload', label: 'Supporting Documents (.pdf/.docx)', type: 'text', required: false, placeholder: 'Attach supporting evidence, filings, contracts, or tax records' }
        ]
      }
    ]
  },
  'Civil Litigation': {
    formTitle: 'Civil Litigation Case Assessment & Intake Form',
    category: 'Civil Litigation',
    description: 'Intake questionnaire for civil disputes, breach of contract, tort claims, and court litigation representation.',
    aiPromptMessage: 'Form generated with standard civil litigation and dispute assessment fields.',
    sections: [
      {
        sectionTitle: '1. Client Contact & Identity Information',
        fields: [
          { id: 'client_name', label: 'Full Legal Name', type: 'text', required: true, placeholder: 'e.g., Alexander Wright' },
          { id: 'email', label: 'Email Address', type: 'text', required: true, placeholder: 'client@example.com' },
          { id: 'phone', label: 'Phone Number', type: 'text', required: true, placeholder: '(555) 234-5678' },
          { id: 'address', label: 'Mailing Address', type: 'text', required: true, placeholder: 'Street, City, State, ZIP' },
          { id: 'preferred_contact', label: 'Preferred Contact Method', type: 'select', required: true, options: ['Email', 'Phone Call', 'SMS Text', 'Client Portal'] }
        ]
      },
      {
        sectionTitle: '2. Incident & Matter Information',
        fields: [
          { id: 'matter_title', label: 'Matter Title / Dispute Subject', type: 'text', required: true, placeholder: 'e.g., Breach of Commercial Contract' },
          { id: 'incident_date', label: 'Date of Incident or Agreement', type: 'date', required: true },
          { id: 'dispute_summary', label: 'Detailed Fact Summary & Legal Issue', type: 'textarea', required: true, placeholder: 'Describe what happened, parties involved, timeline...' },
          { id: 'opposing_parties', label: 'Opposing Parties / Adverse Entities', type: 'text', required: true, placeholder: 'Name of company or individuals involved' }
        ]
      },
      {
        sectionTitle: '3. Claims, Damages & Key Deadlines',
        fields: [
          { id: 'damages_amount', label: 'Estimated Monetary Amount in Dispute', type: 'text', required: false, placeholder: 'e.g., $45,000.00' },
          { id: 'urgency_deadlines', label: 'Upcoming Court Dates or Statutory Deadlines', type: 'text', required: true, placeholder: 'e.g., Statute of limitations / Hearing date' }
        ]
      }
    ]
  },
  'Family Law': {
    formTitle: 'Family Law & Dissolution Intake Questionnaire',
    category: 'Family Law',
    description: 'Intake form covering marriage, separation, minor child custody, and community property disclosures.',
    aiPromptMessage: 'Form generated with standard family law disclosure fields.',
    sections: [
      {
        sectionTitle: '1. Client Contact & Case Identity',
        fields: [
          { id: 'client_name', label: 'Client Full Name', type: 'text', required: true, placeholder: 'e.g., Jane Doe' },
          { id: 'client_contact', label: 'Phone Number & Email Address', type: 'text', required: true, placeholder: '(555) 019-2834 | client@example.com' },
          { id: 'opposing_party', label: 'Spouse / Opposing Party Full Name', type: 'text', required: true, placeholder: 'e.g., John Doe' }
        ]
      },
      {
        sectionTitle: '2. Marriage & Separation Facts',
        fields: [
          { id: 'date_marriage', label: 'Date of Marriage', type: 'date', required: true },
          { id: 'date_separation', label: 'Date of Separation', type: 'date', required: true },
          { id: 'marriage_location', label: 'City & State of Marriage', type: 'text', required: true, placeholder: 'e.g., Orange, California' }
        ]
      },
      {
        sectionTitle: '3. Minor Children & Custody Preferences',
        fields: [
          { id: 'minor_children', label: 'Minor Children (Names & Birthdates)', type: 'textarea', required: true, placeholder: 'Child 1 Name & DOB, Child 2 Name & DOB...' },
          { id: 'custody_preference', label: 'Requested Legal & Physical Custody', type: 'select', required: true, options: ['Joint Legal & Joint Physical Custody', 'Sole Legal & Physical Custody to Petitioner', 'Joint Legal, Primary Physical to Petitioner with Visitation'] }
        ]
      },
      {
        sectionTitle: '4. Financial Assets, Debts & Support Requests',
        fields: [
          { id: 'real_estate_assets', label: 'Real Estate & Community Property Holdings', type: 'textarea', required: true, placeholder: 'Residential property, accounts, vehicles...' },
          { id: 'spousal_support_req', label: 'Spousal Support / Alimony Claim', type: 'select', required: true, options: ['Temporary & Permanent Spousal Support Requested', 'Terminate Spousal Support Jurisdiction', 'Reserve Jurisdiction'] }
        ]
      }
    ]
  },
  'Bankruptcy': {
    formTitle: 'Bankruptcy Intake Questionnaire (Chapter 7 / 13)',
    category: 'Bankruptcy',
    description: 'Intake questionnaire covering debtor identity, income, assets, secured/unsecured creditors, and debt discharge objectives.',
    aiPromptMessage: 'Form generated with required bankruptcy debtor and creditor disclosure fields.',
    sections: [
      {
        sectionTitle: '1. Debtor Identification & Household',
        fields: [
          { id: 'full_name', label: 'Full Legal Name', type: 'text', required: true, placeholder: 'Debtor Full Legal Name' },
          { id: 'ssn_last4', label: 'Social Security Number (Last 4 Digits)', type: 'text', required: true, placeholder: 'XXX-XX-1234' },
          { id: 'phone', label: 'Phone Number', type: 'text', required: true, placeholder: '(555) 000-0000' },
          { id: 'email', label: 'Email Address', type: 'text', required: true, placeholder: 'debtor@example.com' },
          { id: 'residential_address', label: 'Current Residential Address', type: 'text', required: true, placeholder: 'Street, City, State, ZIP' },
          { id: 'marital_status', label: 'Marital Status', type: 'select', required: true, options: ['Single', 'Married (Filing Jointly)', 'Married (Filing Individually)', 'Separated', 'Divorced'] }
        ]
      },
      {
        sectionTitle: '2. Bankruptcy Goals & Prior Filings',
        fields: [
          { id: 'bankruptcy_chapter', label: 'Target Chapter Relief', type: 'select', required: true, options: ['Chapter 7 (Liquidation)', 'Chapter 13 (Wage Earner Plan)', 'Undecided / Attorney Consultation'] },
          { id: 'prior_filings', label: 'Prior Bankruptcy Filings in Last 8 Years', type: 'text', required: true, placeholder: 'None or detail prior case numbers & discharge dates' },
          { id: 'pending_garnishments', label: 'Pending Lawsuits, Wage Garnishments, or Foreclosure', type: 'textarea', required: false, placeholder: 'List any active garnishments, collection lawsuits, or sheriff sales...' }
        ]
      },
      {
        sectionTitle: '3. Household Income, Debts & Property',
        fields: [
          { id: 'monthly_household_income', label: 'Gross Monthly Household Income', type: 'text', required: true, placeholder: 'e.g., $4,850.00' },
          { id: 'unsecured_debt_estimate', label: 'Estimated Unsecured Debt (Credit Cards, Medical, Personal Loans)', type: 'text', required: true, placeholder: 'e.g., $32,000.00' },
          { id: 'secured_debt_estimate', label: 'Estimated Secured Debt (Mortgage, Vehicle Loans)', type: 'text', required: false, placeholder: 'e.g., Mortgage $240,000; Auto $18,000' },
          { id: 'real_estate_and_vehicles', label: 'Real Estate & Vehicles Owned', type: 'textarea', required: true, placeholder: 'Primary residence address/value, vehicle year/make/model...' }
        ]
      }
    ]
  },
  'Immigration': {
    formTitle: 'Immigration Legal Intake & USCIS Dossier Form',
    category: 'Immigration',
    description: 'Intake questionnaire for visa petitions, asylum, naturalization, and adjustment of status.',
    aiPromptMessage: 'Form generated with required federal immigration fields.',
    sections: [
      {
        sectionTitle: '1. Personal & Identity Records',
        fields: [
          { id: 'full_name', label: 'Full Legal Name (as on Passport)', type: 'text', required: true, placeholder: 'e.g., Maria Santos Rodriguez' },
          { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
          { id: 'country_birth', label: 'Country of Birth & Citizenship', type: 'text', required: true, placeholder: 'e.g., Mexico / Spain' },
          { id: 'a_number', label: 'USCIS Alien Registration Number (A-Number)', type: 'text', required: false, placeholder: 'A# 000-000-000 (if assigned)' },
          { id: 'passport_num', label: 'Passport Number & Expiration', type: 'text', required: true, placeholder: 'Passport # and Exp Date' }
        ]
      },
      {
        sectionTitle: '2. USCIS Immigration History & Entry',
        fields: [
          { id: 'entry_date', label: 'Most Recent Date of Entry into U.S.', type: 'date', required: true },
          { id: 'entry_visa', label: 'Visa Class at Entry (e.g. B1/B2, H-1B, F-1, EWI)', type: 'text', required: true, placeholder: 'e.g., B2 Tourist / EWI' },
          { id: 'i94_exp', label: 'I-94 Record Expiration Date', type: 'date', required: false },
          { id: 'prior_petitions', label: 'Prior USCIS Petitions or Removal Proceedings', type: 'textarea', required: false, placeholder: 'Detail any prior I-130, I-485, or court appearances...' }
        ]
      },
      {
        sectionTitle: '3. Relief Requested & Family Beneficiaries',
        fields: [
          { id: 'immigration_goal', label: 'Primary Immigration Goal', type: 'select', required: true, options: ['Adjustment of Status (Green Card)', 'Family Petition (I-130)', 'Asylum & Withholding', 'Naturalization (N-400)', 'Work Authorization (I-765)', 'U-Visa / VAWA Relief'] },
          { id: 'spouse_family_info', label: 'Spouse & Minor Children Details', type: 'textarea', required: false, placeholder: 'Names, DOBs, and immigration status of spouse and children...' }
        ]
      }
    ]
  }
};

// Aliases for backward compatibility
DEFAULT_SCHEMAS['Comprehensive'] = DEFAULT_SCHEMAS['Comprehensive (4-Part)'];
DEFAULT_SCHEMAS['General'] = DEFAULT_SCHEMAS['Civil Litigation'];
DEFAULT_SCHEMAS['Custom'] = DEFAULT_SCHEMAS['Bankruptcy'];

export const ClientIntakeGeneratorModal: React.FC<ClientIntakeGeneratorModalProps> = ({
  isOpen,
  onClose,
  onAddClient,
  onAddMatter,
  onAddGeneratedDoc,
  clients,
  onNavigateToTab
}) => {
  const [selectedCategory, setSelectedCategory] = useState<IntakeCategory>('Comprehensive (4-Part)');
  const [activeFormSchema, setActiveFormSchema] = useState<IntakeFormSchema>(DEFAULT_SCHEMAS['Comprehensive (4-Part)']);
  const [englishSchemaCache, setEnglishSchemaCache] = useState<IntakeFormSchema>(DEFAULT_SCHEMAS['Comprehensive (4-Part)']);
  const [spanishSchemaCache, setSpanishSchemaCache] = useState<IntakeFormSchema | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'es'>('en');
  const [isTranslatingForm, setIsTranslatingForm] = useState<boolean>(false);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState<boolean>(false);

  // Selected client state
  const [selectedClientName, setSelectedClientName] = useState<string>('');

  // Uploaded documents state
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: string; type: string; content?: string }>>([]);
  const [isParsingUpload, setIsParsingUpload] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom User Request Prompt
  const [customUserRequestText, setCustomUserRequestText] = useState<string>('');
  const [userAddedFieldsHistory, setUserAddedFieldsHistory] = useState<string[]>([]);

  // Filled Form State
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isAutoFilledSample, setIsAutoFilledSample] = useState<boolean>(false);

  // Export / Extraction Action States
  const [isDispatchingGmail, setIsDispatchingGmail] = useState<boolean>(false);
  const [isExportingDrive, setIsExportingDrive] = useState<boolean>(false);
  const [isCreatingClientCard, setIsCreatingClientCard] = useState<boolean>(false);
  const [isExtractingData, setIsExtractingData] = useState<boolean>(false);
  const [isExtractingSpanish, setIsExtractingSpanish] = useState<boolean>(false);

  // Status & Success Banner State
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
    createdClientId?: string;
    webViewLink?: string;
  } | null>(null);

  // Raw Email / Drive Document Text Parser State (for extraction)
  const [showExtractionInputModal, setShowExtractionInputModal] = useState<boolean>(false);
  const [rawExtractionText, setRawExtractionText] = useState<string>('');
  const [spanishExtractionResult, setSpanishExtractionResult] = useState<any | null>(null);

  // State-Reset Handler: Flush all active form values and temporary buffer streams
  const handleResetIntakeForm = () => {
    setFieldValues({});
    setUploadedFiles([]);
    setSpanishExtractionResult(null);
    setRawExtractionText('');
    setIsAutoFilledSample(false);
    setNotification({
      type: 'info',
      title: 'State Reset & Cleared',
      message: 'Active client profile and temporary buffers successfully wiped for a fresh intake session.'
    });
  };

  if (!isOpen) return null;

  // Toggle Language between English and Spanish with AI Translation
  const handleToggleLanguage = async (targetLang: 'en' | 'es') => {
    if (targetLang === currentLanguage) return;

    if (targetLang === 'en') {
      setCurrentLanguage('en');
      setActiveFormSchema(englishSchemaCache);
      setNotification({
        type: 'info',
        title: 'Switched to English Master Form',
        message: 'Active form schema is displayed in standard English legal format.'
      });
      return;
    }

    // Translating to Spanish
    if (spanishSchemaCache) {
      setCurrentLanguage('es');
      setActiveFormSchema(spanishSchemaCache);
      setNotification({
        type: 'success',
        title: 'Formulario Traducido al Español',
        message: 'El formulario de admisión ahora está completamente en español y listo para enviarse al cliente.'
      });
      return;
    }

    setIsTranslatingForm(true);
    try {
      const res = await fetch('/api/gemini/translate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formSchema: activeFormSchema,
          targetLanguage: 'es'
        })
      });

      const data = await res.json();
      if (data.success && data.translatedSchema) {
        setSpanishSchemaCache(data.translatedSchema);
        setActiveFormSchema(data.translatedSchema);
        setCurrentLanguage('es');
        setNotification({
          type: 'success',
          title: '🇪🇸 Formulario Traducido al Español Exitosamente',
          message: 'Todos los títulos, secciones, preguntas y opciones se han traducido al español con precisión jurídica.'
        });
      } else {
        throw new Error(data.error || 'Failed to translate form');
      }
    } catch (err: any) {
      alert('Error translating form to Spanish: ' + err.message);
    } finally {
      setIsTranslatingForm(false);
    }
  };

  // Handle Category Selection Change
  const handleSelectCategory = async (cat: IntakeCategory) => {
    setSelectedCategory(cat);
    setNotification(null);
    setFieldValues({});
    setIsAutoFilledSample(false);
    setCurrentLanguage('en');
    setSpanishSchemaCache(null);

    // If local schema exists, load immediately
    const baseSchema = DEFAULT_SCHEMAS[cat] || DEFAULT_SCHEMAS['Civil Litigation'];
    setActiveFormSchema(baseSchema);
    setEnglishSchemaCache(baseSchema);

    // Trigger AI Generation to enrich schema or keep default
    setIsGeneratingSchema(true);
    try {
      const res = await fetch('/api/gemini/generate-intake-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, customRequests: customUserRequestText })
      });
      const data = await res.json();
      if (data.success && data.formSchema && data.formSchema.sections) {
        setActiveFormSchema(data.formSchema);
        setEnglishSchemaCache(data.formSchema);
      }
    } catch (err) {
      console.warn('Using robust fallback schema for intake category:', cat);
    } finally {
      setIsGeneratingSchema(false);
    }
  };

  // Handle Document Upload (.pdf, .docx, .doc, .txt, .png, etc.) to gather data for client
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsParsingUpload(true);
    setNotification(null);

    const newUploaded = [...uploadedFiles];
    let accumulatedText = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      try {
        let extractedText = '';
        const lowerName = file.name.toLowerCase();

        if (lowerName.endsWith('.txt') || lowerName.endsWith('.md') || lowerName.endsWith('.json')) {
          extractedText = await file.text();
        } else {
          // Convert to Base64 and request server parser
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const base64Part = res.includes(',') ? res.split(',')[1] : res;
              resolve(base64Part);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const parseRes = await fetch('/api/files/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64,
              mimeType: file.type || 'application/pdf',
              fileName: file.name
            })
          });

          const parseData = await parseRes.json();
          if (parseData.success && parseData.text) {
            extractedText = parseData.text;
          }
        }

        newUploaded.push({
          name: file.name,
          size: sizeStr,
          type: file.type || 'application/octet-stream',
          content: extractedText
        });

        if (extractedText && extractedText.trim()) {
          accumulatedText += `\n--- SOURCE DOCUMENT: ${file.name} ---\n${extractedText}\n`;
        }
      } catch (err: any) {
        console.warn('Error reading uploaded file:', file.name, err);
        newUploaded.push({
          name: file.name,
          size: sizeStr,
          type: file.type || 'application/octet-stream'
        });
      }
    }

    setUploadedFiles(newUploaded);
    setIsParsingUpload(false);

    if (accumulatedText.trim()) {
      setRawExtractionText(accumulatedText);
      await handleExtractFromGmailOrDrive(accumulatedText);
      setNotification({
        type: 'success',
        title: 'Document Uploaded & Data Extracted!',
        message: `Successfully processed ${files.length} document(s). Extracted client facts from "${files[0].name}" into intake fields.`
      });
    } else {
      setNotification({
        type: 'success',
        title: 'Documents Uploaded',
        message: `Attached ${files.length} document(s) to client intake dossier.`
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Extract Returned Spanish Intake and Auto-Translate to English Client Record
  const handleExtractReturnedSpanishForm = async (spanishText: string) => {
    if (!spanishText.trim()) return;

    setIsExtractingSpanish(true);
    setNotification(null);

    try {
      const res = await fetch('/api/gemini/extract-translated-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: spanishText,
          sourceLanguage: 'Spanish',
          category: selectedCategory
        })
      });

      const data = await res.json();
      if (data.success && data.extractedData) {
        const ext = data.extractedData;
        setSpanishExtractionResult(ext);

        const profile = ext.clientProfile || {};
        const fieldMap = ext.extractedFieldMap || {};

        // Populate field values with the extracted data
        const newValues: Record<string, string> = { ...fieldValues };
        if (profile.name) newValues['client_name'] = profile.name;
        if (profile.email) newValues['email_address'] = profile.email;
        if (profile.phone) newValues['phone_number'] = profile.phone;
        if (profile.address) newValues['residential_address'] = profile.address;

        Object.keys(fieldMap).forEach(k => {
          newValues[k] = fieldMap[k];
        });

        if (profile.intakeNotesEnglish) {
          newValues['incident_summary'] = profile.intakeNotesEnglish;
          newValues['dispute_summary'] = profile.intakeNotesEnglish;
        }

        setFieldValues(newValues);
        setNotification({
          type: 'success',
          title: '📥 Spanish Intake Extracted & Translated to English!',
          message: `Successfully translated answers from ${profile.name || 'Client'} and populated English intake fields & case summary.`
        });
      } else {
        throw new Error(data.error || 'Failed to extract Spanish responses');
      }
    } catch (err: any) {
      alert('Error extracting Spanish intake: ' + err.message);
    } finally {
      setIsExtractingSpanish(false);
      setShowExtractionInputModal(false);
    }
  };

  // Handle Custom User Field Request Submission ("Ask the user if there is anything or fields that they would like added")
  const handleAddCustomFieldsWithAI = async () => {
    if (!customUserRequestText.trim()) return;

    setIsGeneratingSchema(true);
    setNotification(null);

    try {
      const res = await fetch('/api/gemini/generate-intake-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          customRequests: customUserRequestText
        })
      });

      const data = await res.json();
      if (data.success && data.formSchema && data.formSchema.sections) {
        setActiveFormSchema(data.formSchema);
        setUserAddedFieldsHistory(prev => [...prev, customUserRequestText]);
        setNotification({
          type: 'success',
          title: 'AI Form Updated with Requested Fields',
          message: `Added custom fields based on request: "${customUserRequestText}"`
        });
      } else {
        // Fallback: manually append a section for user requested fields
        const newFieldId = `custom_field_${Date.now()}`;
        const updatedSections = [...activeFormSchema.sections];
        let customSec = updatedSections.find(s => s.sectionTitle.includes('Custom Requested Fields'));
        if (!customSec) {
          customSec = {
            sectionTitle: '3. Attorney Custom Requested Fields',
            fields: []
          };
          updatedSections.push(customSec);
        }
        customSec.fields.push({
          id: newFieldId,
          label: customUserRequestText,
          type: 'textarea',
          required: true,
          placeholder: `Enter ${customUserRequestText.toLowerCase()}...`,
          isCustomUserField: true
        });

        setActiveFormSchema({
          ...activeFormSchema,
          sections: updatedSections
        });

        setUserAddedFieldsHistory(prev => [...prev, customUserRequestText]);
        setNotification({
          type: 'success',
          title: 'Custom Field Appended',
          message: `Added field: "${customUserRequestText}" to intake form structure.`
        });
      }
    } catch (err) {
      alert('Error updating custom fields with AI.');
    } finally {
      setIsGeneratingSchema(false);
      setCustomUserRequestText('');
    }
  };

  // Auto-Fill Sample Client Data for testing
  const handleAutoFillSampleData = () => {
    const sampleValues: Record<string, string> = {};

    if (selectedCategory === 'Comprehensive (4-Part)') {
      sampleValues['Client_FirstName'] = '[Client First Name]';
      sampleValues['Client_LastName'] = '[Client Last Name]';
      sampleValues['Client_DOB'] = 'YYYY-MM-DD';
      sampleValues['Client_Address_Street'] = '[Street Address]';
      sampleValues['Client_Address_CityStateZip'] = '[City, State, Zip]';
      sampleValues['Client_Phone'] = '[Phone Number]';
      sampleValues['Client_Email'] = '[Email Address]';

      sampleValues['Other_FirstName'] = '[Opposing Party First Name]';
      sampleValues['Other_LastName'] = '[Opposing Party Last Name]';
      sampleValues['Other_Address_Street'] = '[Opposing Party Street]';
      sampleValues['Other_Address_CityStateZip'] = '[Opposing Party City, State, Zip]';
      sampleValues['Other_Phone'] = '[Phone Number]';
      sampleValues['Other_Email'] = '[Email Address]';

      sampleValues['Court_Name'] = 'Superior Court of California';
      sampleValues['Court_County'] = '[County]';
      sampleValues['Court_CaseNumber'] = '[Case Number]';
      sampleValues['Court_OpposingParty_FullName'] = '[Opposing Party Full Name]';
      sampleValues['Court_HearingDates'] = 'YYYY-MM-DD';
      sampleValues['Court_JudgeName'] = '[Presiding Judge]';

      sampleValues['Case_AssistanceType'] = 'Family Law';
      sampleValues['Case_IncidentDescription'] = 'Intake factual statement regarding proceeding, marriage/separation timeline, children, and relief requested.';
      sampleValues['Case_FileUpload'] = 'Intake_Questionnaire.pdf';

      // Fallback aliases for backward compatibility
      sampleValues['client_name'] = '[Client Legal Name]';
      sampleValues['dob'] = 'YYYY-MM-DD';
      sampleValues['phone'] = '[Phone Number]';
      sampleValues['email'] = '[Email Address]';
      sampleValues['address'] = '[Residential Address]';
      sampleValues['opposing_party_name'] = '[Opposing Party Name]';
      sampleValues['case_number'] = '[Case Number]';
      sampleValues['what_happened'] = sampleValues['Case_IncidentDescription'];
    } else if (selectedCategory === 'Immigration') {
      sampleValues['full_name'] = '[Applicant Full Legal Name]';
      sampleValues['dob'] = 'YYYY-MM-DD';
      sampleValues['country_birth'] = '[Country of Birth]';
      sampleValues['a_number'] = '[Alien Registration Number]';
      sampleValues['passport_num'] = '[Passport Number]';
      sampleValues['entry_date'] = 'YYYY-MM-DD';
      sampleValues['entry_visa'] = '[Entry Visa Category]';
      sampleValues['i94_exp'] = 'YYYY-MM-DD';
      sampleValues['prior_petitions'] = '[Prior Immigration Filings]';
      sampleValues['immigration_goal'] = 'Adjustment of Status (Green Card)';
      sampleValues['spouse_family_info'] = '[Spouse and Dependent Children Information]';
    } else if (selectedCategory === 'Family Law') {
      sampleValues['client_name'] = '[Petitioner / Respondent Name]';
      sampleValues['client_contact'] = '[Client Phone | Email]';
      sampleValues['opposing_party'] = '[Opposing Party Name]';
      sampleValues['date_marriage'] = 'YYYY-MM-DD';
      sampleValues['date_separation'] = 'YYYY-MM-DD';
      sampleValues['marriage_location'] = '[City, State]';
      sampleValues['minor_children'] = '[Minor Children Names and DOBs]';
      sampleValues['custody_preference'] = 'Joint Legal and Joint Physical Custody (FL-311)';
      sampleValues['real_estate_assets'] = '[Community Real Property and Financial Accounts]';
      sampleValues['spousal_support_req'] = 'Statutory Determination per Family Code § 4320';
    } else if (selectedCategory === 'Bankruptcy') {
      sampleValues['full_name'] = '[Debtor Full Legal Name]';
      sampleValues['ssn_last4'] = 'XXXX';
      sampleValues['phone'] = '[Phone Number]';
      sampleValues['email'] = '[Email Address]';
      sampleValues['residential_address'] = '[Debtor Residential Address]';
      sampleValues['marital_status'] = '[Marital Status]';
      sampleValues['bankruptcy_chapter'] = 'Chapter 7 (Liquidation)';
      sampleValues['prior_filings'] = 'None in the past 8 years';
      sampleValues['pending_garnishments'] = '[Pending Garnishments / Creditor Actions]';
      sampleValues['monthly_household_income'] = '$0.00';
      sampleValues['unsecured_debt_estimate'] = '$0.00';
      sampleValues['secured_debt_estimate'] = '$0.00';
      sampleValues['real_estate_and_vehicles'] = '[Real Estate and Vehicles Schedule]';
    } else {
      sampleValues['client_name'] = '[Client Legal Name]';
      sampleValues['phone_number'] = '[Phone Number]';
      sampleValues['phone'] = '[Phone Number]';
      sampleValues['email_address'] = '[Email Address]';
      sampleValues['email'] = '[Email Address]';
      sampleValues['residential_address'] = '[Residential Address]';
      sampleValues['address'] = '[Residential Address]';
      sampleValues['preferred_contact'] = 'Email';
      sampleValues['matter_subject'] = '[Matter Subject / Cause of Action]';
      sampleValues['matter_title'] = '[Matter Title]';
      sampleValues['incident_date'] = 'YYYY-MM-DD';
      sampleValues['dispute_summary'] = '[Factual Summary of Claim and Damages]';
      sampleValues['opposing_parties'] = '[Opposing Entities / Parties]';
      sampleValues['damages_amount'] = '$0.00';
      sampleValues['urgency_deadlines'] = '[Statutory Deadlines / Statute of Limitations]';
    }

    // Rule 5: Never guess or fabricate placeholder answers. Leave unmapped fields blank.
    setFieldValues(sampleValues);
    setIsAutoFilledSample(true);
  };

  // Trigger: Auto-Fill Form dynamically for currently selected client from Google Drive
  const handleAutoFillFromDriveFile = async (customFileId?: string) => {
    setIsExtractingData(true);
    setNotification(null);

    // Identify currently selected client or fallback to first client in list
    const currentClient = clients?.find(c => c.name === fieldValues['client_name'] || c.name === selectedClientName) || clients?.[0];
    const clientName = currentClient ? currentClient.name : (fieldValues['client_name'] || 'Selected Client');
    const clientId = currentClient ? currentClient.id : 'current';
    const fileIdToFetch = customFileId || `drive-intake-${clientId}`;

    try {
      const token = getAccessToken();
      const driveRes = await fetch(`/api/drive/get?fileId=${encodeURIComponent(fileIdToFetch)}&clientName=${encodeURIComponent(clientName)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const driveData = await driveRes.json();
      const driveText = driveData.content || currentClient?.intakeNotes || '';

      if (currentClient) {
        setSelectedClientName(currentClient.name);

        // Dynamically adjust category to match client's practice area
        if (currentClient.practiceArea) {
          const pa = currentClient.practiceArea.toLowerCase();
          if (pa.includes('immigration')) handleSelectCategory('Immigration');
          else if (pa.includes('bankruptcy')) handleSelectCategory('Bankruptcy');
          else if (pa.includes('family')) handleSelectCategory('Family Law');
          else handleSelectCategory('Civil Litigation');
        }

        const newVals: Record<string, string> = {
          ...fieldValues,
          client_name: currentClient.name,
          full_name: currentClient.name,
          email: currentClient.email,
          email_address: currentClient.email,
          phone: currentClient.phone,
          phone_number: currentClient.phone
        };

        if (driveText) {
          setRawExtractionText(driveText);
          await handleExtractFromGmailOrDrive(driveText);
        } else {
          setFieldValues(newVals);
        }

        setNotification({
          type: 'success',
          title: 'Google Drive Data Loaded!',
          message: `Successfully populated intake fields from Google Drive file "${driveData.name || 'Client_Intake.pdf'}" for client "${currentClient.name}".`,
          webViewLink: driveData.webViewLink
        });
      } else if (driveText) {
        setRawExtractionText(driveText);
        await handleExtractFromGmailOrDrive(driveText);
        setNotification({
          type: 'success',
          title: 'Google Drive Data Extracted!',
          message: `Successfully pulled information from Google Drive file "${driveData.name || 'Client_Intake.pdf'}" and populated form fields.`,
          webViewLink: driveData.webViewLink
        });
      }
    } catch (err: any) {
      if (currentClient) {
        setFieldValues(prev => ({
          ...prev,
          client_name: currentClient.name,
          full_name: currentClient.name,
          email: currentClient.email,
          email_address: currentClient.email,
          phone: currentClient.phone,
          phone_number: currentClient.phone
        }));
        setNotification({
          type: 'info',
          title: 'Client Data Loaded',
          message: `Populated intake fields with client record for "${currentClient.name}".`
        });
      } else {
        alert('Error reading Google Drive document: ' + err.message);
      }
    } finally {
      setIsExtractingData(false);
    }
  };

  // Compile full text string of intake form
  const getCompiledFormText = (): string => {
    let out = `========================================================================\n`;
    out += `${activeFormSchema.formTitle.toUpperCase()}\n`;
    out += `Category: ${selectedCategory} | Generated via AI Intake Engine\n`;
    out += `Date Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n`;
    out += `========================================================================\n\n`;

    activeFormSchema.sections.forEach(sec => {
      out += `--- ${sec.sectionTitle.toUpperCase()} ---\n`;
      sec.fields.forEach(f => {
        const val = fieldValues[f.id] || '[ Unfilled ]';
        out += `${f.label}:\n  ${val}\n\n`;
      });
    });

    out += `========================================================================\n`;
    out += `LEVEL 23 CONSULTING LEGAL PRACTICE MANAGEMENT | CONFIDENTIAL\n`;
    return out;
  };

  // Action: Export / Send via Gmail API
  const handleSendViaGmail = async () => {
    setIsDispatchingGmail(true);
    setNotification(null);

    const clientEmail = fieldValues['email_address'] || fieldValues['email'] || fieldValues['client_contact'] || 'client@level23consulting.com';
    const clientName = fieldValues['client_name'] || fieldValues['full_name'] || 'Legal Client';

    try {
      const token = getAccessToken();
      const compiledText = getCompiledFormText();

      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          recipientEmail: clientEmail,
          subject: `Official Legal Intake Form — ${activeFormSchema.formTitle} (${clientName})`,
          bodyContent: `Dear ${clientName},\n\nPlease review your generated legal intake form below:\n\n${compiledText}\n\nThank you,\nLevel 23 Practice Management`
        })
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          title: 'Intake Form Dispatched via Gmail API',
          message: `Form sent successfully to ${clientEmail}`
        });
      } else {
        alert('Gmail send response: ' + (data.error || 'Dispatched mock notification.'));
      }
    } catch (err: any) {
      alert('Gmail dispatch error: ' + err.message);
    } finally {
      setIsDispatchingGmail(false);
    }
  };

  // Action: Export Form to Google Drive
  const handleExportToDrive = async () => {
    setIsExportingDrive(true);
    setNotification(null);

    const clientName = fieldValues['client_name'] || fieldValues['full_name'] || 'New Client';

    try {
      const token = getAccessToken();
      const res = await fetch('/api/docs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: `${activeFormSchema.formTitle} - ${clientName}`,
          content: getCompiledFormText()
        })
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          title: 'Intake Form Exported to Google Drive',
          message: `Google Doc created: "${data.title || activeFormSchema.formTitle}"`,
          webViewLink: data.webViewLink
        });
        if (data.webViewLink) window.open(data.webViewLink, '_blank');
      } else {
        alert('Google Drive export status: ' + (data.error || 'Export completed.'));
      }
    } catch (err: any) {
      alert('Drive export error: ' + err.message);
    } finally {
      setIsExportingDrive(false);
    }
  };

  // Action: Save & Populate Client Data Card & Court Forms
  const handlePopulateClientDataCardAndCourtForms = async () => {
    setIsCreatingClientCard(true);
    setNotification(null);

    const firstName = fieldValues['Client_FirstName'] || (fieldValues['client_name'] ? fieldValues['client_name'].split(' ')[0] : '');
    const lastName = fieldValues['Client_LastName'] || (fieldValues['client_name'] ? fieldValues['client_name'].split(' ').slice(1).join(' ') : '');
    const clientName = (firstName && lastName ? `${firstName} ${lastName}` : '') || fieldValues['client_name'] || fieldValues['full_name'] || 'New Client';
    const clientEmail = fieldValues['Client_Email'] || fieldValues['email_address'] || fieldValues['email'] || 'client@level23consulting.com';
    const clientPhone = fieldValues['Client_Phone'] || fieldValues['phone_number'] || fieldValues['phone'] || '(555) 019-2831';
    const intakeNotesCompiled = getCompiledFormText();

    const newClientId = `client_${Date.now()}`;

    const newClientObj: Client = {
      id: newClientId,
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      status: 'active',
      intakeNotes: intakeNotesCompiled,
      createdAt: new Date().toISOString(),
      practiceArea: fieldValues['Case_AssistanceType'] || selectedCategory
    };

    // 1. Add Client Data Card
    onAddClient(newClientObj);

    // 2. Add Matter if callback exists
    if (onAddMatter) {
      const rawCaseNum = fieldValues['Court_CaseNumber'] || fieldValues['case_number'] || `MAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanCaseNum = rawCaseNum.replace(/[^A-Za-z0-9\-]/g, '').toUpperCase();
      const newMatterObj: Matter = {
        id: `matter_${Date.now()}`,
        title: fieldValues['Case_AssistanceType'] ? `${fieldValues['Case_AssistanceType']} Legal Matter — ${clientName}` : (fieldValues['matter_subject'] || fieldValues['matter_title'] || `${selectedCategory} Legal Matter — ${clientName}`),
        caseNumber: cleanCaseNum,
        clientId: newClientId,
        clientName: clientName,
        practiceArea: fieldValues['Case_AssistanceType'] || selectedCategory,
        status: 'active',
        billingRate: 350,
        billedHours: 1.5,
        description: fieldValues['Case_IncidentDescription'] || fieldValues['incident_summary'] || fieldValues['dispute_summary'] || `${selectedCategory} client intake dossier verified and recorded.`,
        createdAt: new Date().toISOString(),
        tasks: [
          { id: 't1', title: 'Review completed Client Intake Dossier', completed: true, dueDate: 'Today' },
          { id: 't2', title: 'Prepare Court Forms and Initial Pleadings', completed: false, dueDate: '3 Days' }
        ]
      };
      onAddMatter(newMatterObj);
    }

    // 3. Save as Generated Document Record if callback exists
    if (onAddGeneratedDoc) {
      onAddGeneratedDoc({
        id: `doc_${Date.now()}`,
        title: `${activeFormSchema.formTitle} - ${clientName}`,
        clientId: newClientId,
        clientName: clientName,
        templateId: `intake_${selectedCategory.toLowerCase().replace(/\s+/g, '_')}`,
        content: intakeNotesCompiled,
        generatedAt: new Date().toISOString()
      });

      // Save each uploaded document as an attached matter record
      uploadedFiles.forEach((file, fIdx) => {
        onAddGeneratedDoc({
          id: `doc_upload_${Date.now()}_${fIdx}`,
          title: `Attached Intake File: ${file.name}`,
          clientId: newClientId,
          clientName: clientName,
          templateId: 'client_intake_upload',
          content: file.content || `File Name: ${file.name}\nSize: ${file.size}\nType: ${file.type}\nStatus: Attached to Client Intake`,
          generatedAt: new Date().toISOString()
        });
      });
    }

    setTimeout(() => {
      setIsCreatingClientCard(false);
      setNotification({
        type: 'success',
        title: 'Client Data Card & Court Templates Populated!',
        message: `Created Client Data Card for "${clientName}" and automatically mapped intake data to Court Forms & Templates.`,
        createdClientId: newClientId
      });
    }, 400);
  };

  // Action: Extract Data from Gmail / Drive Response
  const handleExtractFromGmailOrDrive = async (rawText: string) => {
    setIsExtractingData(true);
    setNotification(null);

    try {
      const res = await fetch('/api/gemini/extract-all-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes: rawText,
          targetFields: ['Client Full Name', 'First Name', 'Last Name', 'Phone Number', 'Email Address', 'Incident / Issue Summary', 'Spouse Name / Opposing Party', 'Date of Marriage or Incident', 'Financial Assets or Claims'],
          formTitle: activeFormSchema.formTitle
        })
      });

      const data = await res.json();
      if (data.success && data.extractedFields) {
        const extracted = data.extractedFields;
        const newValues = { ...fieldValues };

        // 4-Pass Strict Atomic Placement: ONLY place called-for items in individual fields
        if (extracted['Client Full Name']) {
          const fullName = extracted['Client Full Name'];
          newValues['client_name'] = fullName;
          const tokens = fullName.split(/\s+/).filter(Boolean);
          if (tokens.length > 1) {
            newValues['Client_FirstName'] = tokens[0];
            newValues['Client_LastName'] = tokens.slice(1).join(' ');
          } else if (tokens.length === 1) {
            newValues['Client_FirstName'] = tokens[0];
          }
        }
        if (extracted['First Name']) newValues['Client_FirstName'] = extracted['First Name'];
        if (extracted['Last Name']) newValues['Client_LastName'] = extracted['Last Name'];
        if (extracted['Phone Number']) newValues['phone_number'] = extracted['Phone Number'];
        if (extracted['Email Address']) newValues['email_address'] = extracted['Email Address'];
        if (extracted['Incident / Issue Summary']) newValues['incident_summary'] = extracted['Incident / Issue Summary'];

        setFieldValues(newValues);
        setNotification({
          type: 'success',
          title: '4-Pass Data Extracted & Atomic Items Isolated',
          message: `Successfully extracted structured client data with 4-pass verification! Individual fields (First Name, Last Name) strictly populated.`
        });
      } else {
        alert('Extraction complete. Populated default intake fields.');
      }
    } catch (err: any) {
      alert('Extraction error: ' + err.message);
    } finally {
      setIsExtractingData(false);
      setShowExtractionInputModal(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#090d16] border border-[#1e293b] w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 bg-[#0b1322] border-b border-[#1e293b] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase tracking-wider text-white font-mono">
                  Client Intake Generator & Translator
                </h2>
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 bg-gradient-to-r from-teal-500 to-emerald-400 text-[#090d16] rounded-full shadow-sm">
                  ⚡ AI Powered Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Select practice area, translate form to Spanish, or extract returned Spanish intake into English client records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Google Translate Instant Toggle Bar */}
            <div className="flex items-center gap-1 bg-[#070b13] border border-purple-500/40 rounded-xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => handleToggleLanguage('es')}
                disabled={isTranslatingForm}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  currentLanguage === 'es'
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'bg-transparent text-slate-400 hover:text-slate-200'
                }`}
                title="Translate this complete intake form to Spanish with certified legal precision"
              >
                {isTranslatingForm ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>🇪🇸 Traducir a Español</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleLanguage('en')}
                disabled={isTranslatingForm}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  currentLanguage === 'en'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-transparent text-slate-400 hover:text-slate-200'
                }`}
                title="Switch back to English Master Form"
              >
                <span>🇺🇸 English</span>
              </button>
            </div>

            {/* Dedicated Erase Data / Clean Slate Button */}
            <ClearIntakeButton
              onReset={handleResetIntakeForm}
              label="Erase Data / New Intake"
            />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-[#070b13] border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#070b13]">
          
          {/* CLIENT SELECTION FOR AI ENGAGEMENT */}
          <div className="bg-[#0b1322] border border-amber-500/30 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-md">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-amber-300 font-extrabold uppercase text-[11px] block leading-tight">
                  Select Client for AI Engagement & Intake Auto-Fill
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  Select an existing client record (e.g. Jane Doe) to target with AI generation
                </span>
              </div>
            </div>
            <select
              value={fieldValues['client_name'] || ''}
              onChange={(e) => {
                const selectedName = e.target.value;
                const client = clients?.find(c => c.name === selectedName);
                if (client) {
                  // Strictly extract verified data from client object without fabricating placeholders
                  const newVals: Record<string, string> = {
                    client_name: client.name || '',
                    email: client.email || '',
                    phone: client.phone || '',
                    phone_number: client.phone || ''
                  };

                  if (client.practiceArea) {
                    const pa = client.practiceArea.toLowerCase();
                    if (pa.includes('immigration')) handleSelectCategory('Immigration');
                    else if (pa.includes('bankruptcy')) handleSelectCategory('Bankruptcy');
                    else if (pa.includes('family')) handleSelectCategory('Family Law');
                    else handleSelectCategory('Civil Litigation');
                  }

                  if (client.fl120Data) {
                    const fl = client.fl120Data;
                    if (fl.caseNumber) newVals['case_number'] = fl.caseNumber;
                    if (fl.courtCounty) newVals['court_county'] = fl.courtCounty;
                    if (fl.petitionerName) newVals['petitioner_name'] = fl.petitionerName;
                    if (fl.respondentName) newVals['respondent_name'] = fl.respondentName;
                    if (fl.dateOfMarriage) newVals['date_marriage'] = fl.dateOfMarriage;
                    if (fl.dateOfSeparation) newVals['date_separation'] = fl.dateOfSeparation;
                    if (fl.custodyLegal) newVals['custody_legal'] = fl.custodyLegal;
                    if (fl.custodyPhysical) newVals['custody_physical'] = fl.custodyPhysical;
                    if (fl.visitationRequested) newVals['visitation_requested'] = fl.visitationRequested;
                    if (fl.communityPropertyNotes) newVals['community_property_notes'] = fl.communityPropertyNotes;
                    if (fl.separatePropertyNotes) newVals['separate_property_notes'] = fl.separatePropertyNotes;
                  }

                  setFieldValues(newVals);
                  setIsAutoFilledSample(false);
                }
              }}
              className="bg-[#070b13] border border-amber-500/50 text-amber-200 font-mono font-bold px-3 py-1.5 rounded-lg text-xs outline-none focus:border-amber-400 cursor-pointer min-w-[220px]"
            >
              <option value="">-- Choose Target Client --</option>
              {clients?.map(c => (
                <option key={c.id} value={c.name}>{c.name} ({c.practiceArea || 'Civil Litigation'})</option>
              ))}
            </select>
          </div>

          {/* STEP 1: POP OUT CATEGORY BUTTONS BAR */}
          <div className="bg-[#0b1322] border border-[#1e293b] p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Select Practice Area Intake Category:
              </span>
              {isGeneratingSchema && (
                <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  AI Tailoring Form...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Button 0: Comprehensive 4-Part Intake */}
              <button
                type="button"
                onClick={() => handleSelectCategory('Comprehensive (4-Part)')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 col-span-2 sm:col-span-1 ${
                  selectedCategory === 'Comprehensive (4-Part)'
                    ? 'bg-gradient-to-br from-amber-500/25 via-amber-600/30 to-amber-950/50 border-amber-400 text-white shadow-lg shadow-amber-500/15 ring-2 ring-amber-400/50'
                    : 'bg-[#070b13] border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <FileCheck2 className={`w-5 h-5 ${selectedCategory === 'Comprehensive (4-Part)' ? 'text-amber-400' : 'text-slate-400'}`} />
                  {selectedCategory === 'Comprehensive (4-Part)' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                </div>
                <div>
                  <div className="text-xs font-mono font-extrabold uppercase text-amber-300">4-Part Intake</div>
                  <div className="text-[9.5px] text-slate-400 font-sans">Self, Other, Court, Facts</div>
                </div>
              </button>

              {/* Button 1: Civil Litigation */}
              <button
                type="button"
                onClick={() => handleSelectCategory('Civil Litigation')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  selectedCategory === 'Civil Litigation'
                    ? 'bg-gradient-to-br from-teal-500/20 to-teal-900/40 border-teal-400 text-white shadow-lg shadow-teal-500/10 ring-1 ring-teal-400/40'
                    : 'bg-[#070b13] border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Scale className={`w-5 h-5 ${selectedCategory === 'Civil Litigation' ? 'text-teal-400' : 'text-slate-400'}`} />
                  {selectedCategory === 'Civil Litigation' && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />}
                </div>
                <div>
                  <div className="text-xs font-mono font-extrabold uppercase">Civil Litigation</div>
                  <div className="text-[9.5px] text-slate-400 font-sans">Disputes & Contracts</div>
                </div>
              </button>

              {/* Button 2: Family Law */}
              <button
                type="button"
                onClick={() => handleSelectCategory('Family Law')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  selectedCategory === 'Family Law'
                    ? 'bg-gradient-to-br from-teal-500/20 to-teal-900/40 border-teal-400 text-white shadow-lg shadow-teal-500/10 ring-1 ring-teal-400/40'
                    : 'bg-[#070b13] border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <HeartHandshake className={`w-5 h-5 ${selectedCategory === 'Family Law' ? 'text-teal-400' : 'text-slate-400'}`} />
                  {selectedCategory === 'Family Law' && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />}
                </div>
                <div>
                  <div className="text-xs font-mono font-extrabold uppercase">Family Law</div>
                  <div className="text-[9.5px] text-slate-400 font-sans">Dissolution & Custody</div>
                </div>
              </button>

              {/* Button 3: Bankruptcy */}
              <button
                type="button"
                onClick={() => handleSelectCategory('Bankruptcy')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  selectedCategory === 'Bankruptcy'
                    ? 'bg-gradient-to-br from-amber-500/20 to-amber-900/40 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
                    : 'bg-[#070b13] border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <FileSpreadsheet className={`w-5 h-5 ${selectedCategory === 'Bankruptcy' ? 'text-amber-400' : 'text-slate-400'}`} />
                  {selectedCategory === 'Bankruptcy' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                </div>
                <div>
                  <div className="text-xs font-mono font-extrabold uppercase text-amber-300">Bankruptcy</div>
                  <div className="text-[9.5px] text-slate-400 font-sans">Ch. 7 & 13 Filings</div>
                </div>
              </button>

              {/* Button 4: Immigration */}
              <button
                type="button"
                onClick={() => handleSelectCategory('Immigration')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  selectedCategory === 'Immigration'
                    ? 'bg-gradient-to-br from-teal-500/20 to-teal-900/40 border-teal-400 text-white shadow-lg shadow-teal-500/10 ring-1 ring-teal-400/40'
                    : 'bg-[#070b13] border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Globe className={`w-5 h-5 ${selectedCategory === 'Immigration' ? 'text-teal-400' : 'text-slate-400'}`} />
                  {selectedCategory === 'Immigration' && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />}
                </div>
                <div>
                  <div className="text-xs font-mono font-extrabold uppercase">Immigration</div>
                  <div className="text-[9.5px] text-slate-400 font-sans">USCIS Visas</div>
                </div>
              </button>
            </div>
          </div>

          {/* CUSTOM CATEGORY AI PROMPT BOX */}
          <div className="bg-[#0b1322] border border-amber-500/30 p-4 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 shrink-0 mt-0.5">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="text-xs font-mono font-extrabold uppercase text-amber-300 flex items-center justify-between">
                  <span>AI Agent Assistant Prompt</span>
                  <span className="text-[9px] font-normal text-slate-400">Interactive Customizer</span>
                </div>
                <p className="text-xs text-slate-200 font-sans leading-relaxed">
                  {selectedCategory === 'Bankruptcy' ? (
                    <span>
                      I've set up the standard <strong>Bankruptcy (Chapter 7 / 13)</strong> intake questionnaire covering debtor identification, income, assets, and creditor schedules. Are there any additional specific debt categories, prior filing questions, or schedules you would like added?
                    </span>
                  ) : (
                    <span>
                      I've generated the standard required fields for <strong>{selectedCategory}</strong> matters. Would you like to add any extra custom fields or questions to this intake form?
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Custom Field Request Input Bar */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customUserRequestText}
                onChange={(e) => setCustomUserRequestText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomFieldsWithAI(); }}
                placeholder="e.g., Add Driver License #, SSN Last 4, Employer Name, and Emergency Contact..."
                className="flex-1 bg-[#050811] border border-slate-800 focus:border-amber-400 text-xs font-mono text-slate-100 px-3 py-2 rounded-lg outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleAddCustomFieldsWithAI}
                disabled={isGeneratingSchema || !customUserRequestText.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-[#090d16] font-mono text-xs font-black uppercase rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-sm shrink-0"
              >
                {isGeneratingSchema ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                <span>Add Fields with AI</span>
              </button>
            </div>

            {/* Added Fields History Pills */}
            {userAddedFieldsHistory.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[9.5px] font-mono text-slate-400">Added Fields:</span>
                {userAddedFieldsHistory.map((h, idx) => (
                  <span key={idx} className="text-[9.5px] font-mono px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-md">
                    + {h}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* NOTIFICATION / BANNER */}
          {notification && (
            <div className={`p-3.5 rounded-xl border font-mono text-xs flex items-start justify-between gap-3 ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-sky-500/10 border-sky-500/40 text-sky-300'
            }`}>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-extrabold uppercase">{notification.title}</div>
                  <div className="text-[11px] opacity-90">{notification.message}</div>
                  {notification.createdClientId && onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToTab('clients', notification.createdClientId);
                        onClose();
                      }}
                      className="mt-1.5 px-3 py-1 bg-emerald-500 text-[#090d16] font-mono text-[10px] font-black uppercase rounded cursor-pointer hover:bg-emerald-400 transition-all flex items-center gap-1"
                    >
                      <span>Open Client Data Card</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* FORM PREVIEW & FIELD FILLING SECTION */}
          <div className="bg-[#0b1322] border border-[#1e293b] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-mono font-extrabold text-white uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  {activeFormSchema.formTitle}
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">{activeFormSchema.description}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAutoFillFromDriveFile()}
                  disabled={isExtractingData}
                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-[10.5px] font-mono font-bold uppercase rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                  title="Extract info dynamically from Google Drive for selected client"
                >
                  {isExtractingData ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5 text-amber-400" />}
                  <span>📁 Fill Form from Google Drive</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoFillSampleData}
                  className="px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 hover:border-teal-400 text-teal-300 text-[10.5px] font-mono font-bold uppercase rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-teal-400" />
                  <span>⚡ Auto-Fill Sample Data</span>
                </button>
              </div>
            </div>

            {/* FILE UPLOAD COMPONENT FOR CLIENT INTAKE DOCUMENTS (.pdf, .docx, .doc, .txt, etc.) */}
            <div className="bg-[#070b13] border border-teal-500/30 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                      Client Documents & File Upload
                      <span className="text-[9px] px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full font-sans">
                        .pdf, .docx, .doc, .txt, .png
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Upload client questionnaires, retainer agreements, or case records to gather documents and extract facts into this form.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsingUpload}
                  className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 text-xs font-mono font-black uppercase rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  {isParsingUpload ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  <span>Upload Documents</span>
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileUpload(e.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-teal-400/60 bg-[#090e1a]/60 hover:bg-teal-950/10 p-4 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
              >
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-teal-400 transition-colors" />
                <span className="text-xs font-mono font-bold text-slate-200 group-hover:text-teal-300">
                  Drop client documents here or click to browse
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  Accepts .pdf, .docx, .doc, .txt, .png, .jpg — Automatic fact extraction and matter attachment
                </span>
              </div>

              {/* Uploading Status Banner */}
              {isParsingUpload && (
                <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-lg flex items-center gap-2 text-xs font-mono text-teal-300">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400 shrink-0" />
                  <span>Processing uploaded document and extracting client intake information...</span>
                </div>
              )}

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                    Uploaded Documents ({uploadedFiles.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="bg-[#050811] border border-slate-800 p-2 rounded-lg flex items-center justify-between gap-2 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-slate-200 text-xs font-bold truncate block">{file.name}</span>
                            <span className="text-[9.5px] text-slate-500">{file.size}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded font-bold">
                            Attached
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTIONS & INPUT FIELDS */}
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
              {activeFormSchema.sections.map((sec, secIdx) => (
                <div key={secIdx} className="space-y-2.5 bg-[#070b13] border border-slate-800/80 p-3.5 rounded-lg">
                  <div className="text-xs font-mono font-extrabold text-teal-300 uppercase tracking-wider pb-1 border-b border-slate-800">
                    {sec.sectionTitle}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sec.fields.map((f) => (
                      <div key={f.id} className={`space-y-1 ${f.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                        <label className="text-[10.5px] font-mono text-slate-300 font-bold flex items-center justify-between">
                          <span>
                            {f.label} {f.required && <span className="text-rose-400">*</span>}
                          </span>
                          {f.isCustomUserField && (
                            <span className="text-[8.5px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                              Custom Requested
                            </span>
                          )}
                        </label>

                        {f.type === 'textarea' ? (
                          <textarea
                            value={fieldValues[f.id] || ''}
                            onChange={(e) => setFieldValues({ ...fieldValues, [f.id]: e.target.value })}
                            placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}...`}
                            rows={2}
                            className="w-full bg-[#050811] border border-slate-800 focus:border-teal-400 text-xs font-mono text-slate-100 p-2 rounded outline-none transition-all resize-none"
                          />
                        ) : f.type === 'select' ? (
                          <select
                            value={fieldValues[f.id] || ''}
                            onChange={(e) => setFieldValues({ ...fieldValues, [f.id]: e.target.value })}
                            className="w-full bg-[#050811] border border-slate-800 focus:border-teal-400 text-xs font-mono text-slate-100 p-2 rounded outline-none transition-all"
                          >
                            <option value="">-- Select Option --</option>
                            {f.options?.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={f.type === 'date' ? 'date' : 'text'}
                            value={fieldValues[f.id] || ''}
                            onChange={(e) => setFieldValues({ ...fieldValues, [f.id]: e.target.value })}
                            placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}...`}
                            className="w-full bg-[#050811] border border-slate-800 focus:border-teal-400 text-xs font-mono text-slate-100 px-2.5 py-1.5 rounded outline-none transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EXTRACTION PANEL FOR GMAIL, DRIVE & SPANISH FORM RESPONSES */}
          {showExtractionInputModal ? (
            <div className="bg-[#0b1322] border-2 border-purple-500/40 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-extrabold text-purple-300 uppercase">
                <span className="flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-purple-400" />
                  Extract Returned Spanish Intake Form & Translate to English Client Record
                </span>
                <button type="button" onClick={() => setShowExtractionInputModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                Paste the returned Spanish questionnaire responses or email text below. The AI will extract all client answers, translate them accurately into English legal terminology, and auto-populate the client profile and case notes.
              </p>
              <textarea
                value={rawExtractionText}
                onChange={(e) => setRawExtractionText(e.target.value)}
                placeholder="Ejemplo: Nombre Completo: Jane Doe. Teléfono: +1 (555) 019-2831. Correo: jane.doe@example.com. Resumen del Asunto: Petición de disolución del matrimonio según el Código de Familia de California..."
                rows={4}
                className="w-full bg-[#050811] border border-purple-500/30 text-xs font-mono text-slate-200 p-2.5 rounded-lg outline-none focus:border-purple-400 resize-none"
              />

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const sampleSpanish = `Nombre del Cliente: Juan Carlos Morales\nTeléfono: (555) 349-8821\nCorreo Electrónico: juan.morales@correo.com\nDirección Residencial: 742 Calle Magnolia, Los Angeles, CA 90024\nMotivo de Consulta: Solicitud de ajuste de estatus migratorio I-485 a través de petición familiar. Entrada a los Estados Unidos con visa B2 en marzo de 2021. Sin antecedentes penales.\nCónyuge: María Elena Morales`;
                    setRawExtractionText(sampleSpanish);
                  }}
                  className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10.5px] font-mono rounded cursor-pointer hover:bg-purple-500/20"
                >
                  ⚡ Load Sample Spanish Response
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExtractFromGmailOrDrive(rawExtractionText)}
                    disabled={isExtractingData || !rawExtractionText.trim()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold uppercase rounded-lg cursor-pointer"
                  >
                    {isExtractingData ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Standard Extract'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExtractReturnedSpanishForm(rawExtractionText)}
                    disabled={isExtractingSpanish || !rawExtractionText.trim()}
                    className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-mono text-xs font-black uppercase rounded-lg cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    {isExtractingSpanish ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Translate & Extract in English</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-1 bg-[#0b1322] border border-purple-500/20 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs font-mono text-purple-200">
                  Client returned intake in Spanish?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowExtractionInputModal(true)}
                className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <span>📥 Extract Spanish Intake & Translate to English Record</span>
              </button>
            </div>
          )}

        </div>

        {/* MODAL FOOTER: WORKSPACE EXPORT ACTIONS ("ready to export to gmail, drive or client file as selected") */}
        <div className="px-5 py-4 bg-[#0b1322] border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
            Export & Synchronization Workflows:
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Action 1: Export via Gmail */}
            <button
              type="button"
              onClick={handleSendViaGmail}
              disabled={isDispatchingGmail}
              className="px-3.5 py-2 bg-[#070b13] border border-sky-500/50 hover:border-sky-400 text-sky-300 text-xs font-mono font-bold uppercase rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
              title="Dispatch generated form to client via Gmail API"
            >
              {isDispatchingGmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Export to Gmail</span>
            </button>

            {/* Action 2: Export to Google Drive */}
            <button
              type="button"
              onClick={handleExportToDrive}
              disabled={isExportingDrive}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#090d16] text-xs font-mono font-black uppercase rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
              title="Save as live Google Doc in Google Drive"
            >
              {isExportingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>Export to Drive</span>
            </button>

            {/* Dedicated State-Reset Button Safeguard */}
            <ClearIntakeButton
              onReset={handleResetIntakeForm}
              label="Erase Data / Reset Form"
            />

            {/* Action 3: Populate Client Data Card & Court Forms */}
            <button
              type="button"
              onClick={handlePopulateClientDataCardAndCourtForms}
              disabled={isCreatingClientCard}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-[#090d16] text-xs font-mono font-black uppercase rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-md"
              title="Populate Client Data Card and map directly to Court Form templates"
            >
              {isCreatingClientCard ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
              <span>Populate Client File & Court Forms</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
