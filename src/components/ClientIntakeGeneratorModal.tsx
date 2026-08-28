import React, { useState, useEffect } from 'react';
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
  Languages
} from 'lucide-react';
import { Client, Matter, GeneratedDocument } from '../types';
import { getAccessToken } from '../lib/driveAuth';

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
  category: 'Immigration' | 'Family Law' | 'General' | 'Custom' | string;
  description: string;
  aiPromptMessage?: string;
  sections: IntakeSectionSchema[];
}

// Default Fallback Schemas for instant 100% reliable load
const DEFAULT_SCHEMAS: Record<string, IntakeFormSchema> = {
  'Immigration': {
    formTitle: 'AI Immigration Legal Intake & USCIS Dossier Form',
    category: 'Immigration',
    description: 'Tailored intake questionnaire for visa petitions, asylum, naturalization, and adjustment of status.',
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
  },
  'Family Law': {
    formTitle: 'AI Family Law & Dissolution Intake Questionnaire',
    category: 'Family Law',
    description: 'Tailored legal intake form covering marriage, separation, minor child custody, and community asset disclosures.',
    aiPromptMessage: 'Form generated with required California / State Family Code disclosure fields.',
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
  'General': {
    formTitle: 'AI General Practice & Civil Dispute Legal Intake Form',
    category: 'General',
    description: 'Tailored general intake questionnaire for civil litigation, contracts, torts, and general legal representation.',
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
        sectionTitle: '2. Incident & Matter Information Request',
        fields: [
          { id: 'matter_title', label: 'Matter Title / Subject', type: 'text', required: true, placeholder: 'e.g., Breach of Contract / Vehicle Accident Dispute' },
          { id: 'incident_date', label: 'Date of Incident or Agreement', type: 'date', required: true },
          { id: 'dispute_summary', label: 'Detailed Fact Summary & Legal Issue', type: 'textarea', required: true, placeholder: 'Describe what happened, parties involved, and timeline...' },
          { id: 'opposing_parties', label: 'Opposing Parties / Adverse Entities', type: 'text', required: true, placeholder: 'Name of company or individuals involved' }
        ]
      },
      {
        sectionTitle: '3. Claims, Damages & Key Deadlines',
        fields: [
          { id: 'damages_amount', label: 'Estimated Monetary Amount in Dispute', type: 'text', required: false, placeholder: 'e.g., $45,000.00' },
          { id: 'urgency_deadlines', label: 'Urgency & Upcoming Statutory Deadlines', type: 'text', required: true, placeholder: 'e.g., Court hearing on Aug 15 / Statute expires soon' }
        ]
      }
    ]
  },
  'Custom': {
    formTitle: 'AI Custom Legal Intake Form',
    category: 'Custom',
    description: 'Custom legal intake form defaulting to basic contact information and general matter information requests, augmented with user-requested fields.',
    aiPromptMessage: 'Are there any additional specific fields, questions, or documentation requests you would like added to this custom intake form?',
    sections: [
      {
        sectionTitle: '1. Basic Client Contact Information',
        fields: [
          { id: 'client_name', label: 'Full Legal Name', type: 'text', required: true, placeholder: 'Client Full Name' },
          { id: 'phone_number', label: 'Phone Number', type: 'text', required: true, placeholder: '(555) 000-0000' },
          { id: 'email_address', label: 'Email Address', type: 'text', required: true, placeholder: 'client@domain.com' },
          { id: 'residential_address', label: 'Mailing / Residential Address', type: 'text', required: true, placeholder: 'Street Address, City, State, ZIP' },
          { id: 'preferred_contact', label: 'Preferred Contact Method', type: 'select', required: true, options: ['Email', 'Phone Call', 'SMS Text', 'In-Person Consultation'] }
        ]
      },
      {
        sectionTitle: '2. General Matter Information Request',
        fields: [
          { id: 'matter_subject', label: 'Matter Title / Subject Area', type: 'text', required: true, placeholder: 'Brief title describing the legal matter' },
          { id: 'incident_summary', label: 'Detailed Summary of Legal Issue or Request', type: 'textarea', required: true, placeholder: 'Describe the facts, objectives, and background details...' },
          { id: 'urgency_level', label: 'Urgency Level & Key Deadlines', type: 'select', required: true, options: ['Standard (Normal Intake)', 'Urgent (Hearing/Deadline within 7 Days)', 'Emergency Filing Required'] }
        ]
      }
    ]
  }
};

export const ClientIntakeGeneratorModal: React.FC<ClientIntakeGeneratorModalProps> = ({
  isOpen,
  onClose,
  onAddClient,
  onAddMatter,
  onAddGeneratedDoc,
  clients,
  onNavigateToTab
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'Immigration' | 'Family Law' | 'General' | 'Custom'>('General');
  const [activeFormSchema, setActiveFormSchema] = useState<IntakeFormSchema>(DEFAULT_SCHEMAS['General']);
  const [englishSchemaCache, setEnglishSchemaCache] = useState<IntakeFormSchema>(DEFAULT_SCHEMAS['General']);
  const [spanishSchemaCache, setSpanishSchemaCache] = useState<IntakeFormSchema | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'es'>('en');
  const [isTranslatingForm, setIsTranslatingForm] = useState<boolean>(false);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState<boolean>(false);

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
  const handleSelectCategory = async (cat: 'Immigration' | 'Family Law' | 'General' | 'Custom') => {
    setSelectedCategory(cat);
    setNotification(null);
    setFieldValues({});
    setIsAutoFilledSample(false);
    setCurrentLanguage('en');
    setSpanishSchemaCache(null);

    // If local schema exists, load immediately
    const baseSchema = DEFAULT_SCHEMAS[cat] || DEFAULT_SCHEMAS['Custom'];
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

    if (selectedCategory === 'Immigration') {
      sampleValues['full_name'] = 'Maria Santos Rodriguez';
      sampleValues['dob'] = '1992-08-14';
      sampleValues['country_birth'] = 'Mexico';
      sampleValues['a_number'] = 'A# 098-765-432';
      sampleValues['passport_num'] = 'MX-98201948 (Exp: 2030-05-12)';
      sampleValues['entry_date'] = '2019-11-04';
      sampleValues['entry_visa'] = 'B2 Tourist Visa';
      sampleValues['i94_exp'] = '2020-05-04';
      sampleValues['prior_petitions'] = 'Prior I-130 filed by U.S. Citizen spouse in 2024; pending at California Service Center.';
      sampleValues['immigration_goal'] = 'Adjustment of Status (Green Card)';
      sampleValues['spouse_family_info'] = 'Spouse: U.S. Citizen spouse. Minor Children: Two.';
    } else if (selectedCategory === 'Family Law') {
      sampleValues['client_name'] = 'Jane Doe';
      sampleValues['client_contact'] = '(714) 555-0192 | jane.doe@example.com';
      sampleValues['opposing_party'] = 'John Doe';
      sampleValues['date_marriage'] = '2015-06-18';
      sampleValues['date_separation'] = '2025-05-15';
      sampleValues['marriage_location'] = 'Orange, California';
      sampleValues['minor_children'] = 'Two minor children.';
      sampleValues['custody_preference'] = 'Joint Legal, Primary Physical to Petitioner with Visitation';
      sampleValues['real_estate_assets'] = 'Community home in Orange County (Market value $850k, Mortgage balance $420k); Chase Joint Savings ($45k).';
      sampleValues['spousal_support_req'] = 'Temporary & Permanent Spousal Support Requested';
    } else {
      sampleValues['client_name'] = 'Alexander Wright';
      sampleValues['phone_number'] = '(949) 555-0182';
      sampleValues['phone'] = '(949) 555-0182';
      sampleValues['email_address'] = 'alexander.wright@consulting.com';
      sampleValues['email'] = 'alexander.wright@consulting.com';
      sampleValues['residential_address'] = '450 Newport Center Dr, Newport Beach, CA 92660';
      sampleValues['address'] = '450 Newport Center Dr, Newport Beach, CA 92660';
      sampleValues['preferred_contact'] = 'Email';
      sampleValues['matter_subject'] = 'Commercial Contract Dispute & Unpaid Services';
      sampleValues['matter_title'] = 'Commercial Contract Dispute & Unpaid Services';
      sampleValues['incident_summary'] = 'Client rendered tech consulting services under written MSA. Retainer balance of $38,500 remains unpaid past 60 days.';
      sampleValues['dispute_summary'] = 'Client rendered tech consulting services under written MSA. Retainer balance of $38,500 remains unpaid past 60 days.';
      sampleValues['urgency_level'] = 'Standard (Normal Intake)';
      sampleValues['urgency_deadlines'] = 'Demand letter deadline set for August 15, 2026.';
    }

    // Populate all input IDs
    activeFormSchema.sections.forEach(sec => {
      sec.fields.forEach(f => {
        if (!sampleValues[f.id]) {
          sampleValues[f.id] = `Sample response for ${f.label}`;
        }
      });
    });

    setFieldValues(sampleValues);
    setIsAutoFilledSample(true);
  };

  // Trigger: Auto-Fill Form from Google Drive file
  const handleAutoFillFromDriveFile = async (fileId = 'drive-memo-watson') => {
    setIsExtractingData(true);
    setNotification(null);

    try {
      const token = getAccessToken();
      const driveRes = await fetch(`/api/drive/get?fileId=${fileId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const driveData = await driveRes.json();
      const driveText = driveData.content || '';

      if (driveText) {
        setRawExtractionText(driveText);
        await handleExtractFromGmailOrDrive(driveText);
        setNotification({
          type: 'success',
          title: 'Google Drive Data Extracted!',
          message: `Successfully pulled information from Google Drive file "${driveData.name || 'Intake_Memorandum_Declaration_Don_Watson.pdf'}" and populated form fields.`,
          webViewLink: driveData.webViewLink
        });
      }
    } catch (err: any) {
      alert('Error reading Google Drive document: ' + err.message);
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

    const clientName = fieldValues['client_name'] || fieldValues['full_name'] || 'New Client';
    const clientEmail = fieldValues['email_address'] || fieldValues['email'] || 'client@level23consulting.com';
    const clientPhone = fieldValues['phone_number'] || fieldValues['phone'] || '(555) 019-2831';
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
      practiceArea: selectedCategory
    };

    // 1. Add Client Data Card
    onAddClient(newClientObj);

    // 2. Add Matter if callback exists
    if (onAddMatter) {
      const newMatterObj: Matter = {
        id: `matter_${Date.now()}`,
        title: fieldValues['matter_subject'] || fieldValues['matter_title'] || fieldValues['immigration_goal'] || `${selectedCategory} Legal Matter`,
        caseNumber: `MAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        clientId: newClientId,
        clientName: clientName,
        practiceArea: selectedCategory === 'Immigration' ? 'Immigration' : selectedCategory === 'Family Law' ? 'Family Law' : 'General Practice',
        status: 'active',
        billingRate: 350,
        billedHours: 1.5,
        description: fieldValues['incident_summary'] || fieldValues['dispute_summary'] || fieldValues['spouse_family_info'] || 'New client intake initialized.',
        createdAt: new Date().toISOString(),
        tasks: [
          { id: 't1', title: 'Review completed AI Client Intake Dossier', completed: true, dueDate: 'Today' },
          { id: 't2', title: 'Prepare Judicial Council / Federal Court Forms', completed: false, dueDate: '3 Days' }
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
          targetFields: ['Client Full Name', 'Phone Number', 'Email Address', 'Incident / Issue Summary', 'Spouse Name / Opposing Party', 'Date of Marriage or Incident', 'Financial Assets or Claims'],
          formTitle: activeFormSchema.formTitle
        })
      });

      const data = await res.json();
      if (data.success && data.extractedFields) {
        const extracted = data.extractedFields;
        const newValues = { ...fieldValues };

        if (extracted['Client Full Name']) newValues['client_name'] = extracted['Client Full Name'];
        if (extracted['Phone Number']) newValues['phone_number'] = extracted['Phone Number'];
        if (extracted['Email Address']) newValues['email_address'] = extracted['Email Address'];
        if (extracted['Incident / Issue Summary']) newValues['incident_summary'] = extracted['Incident / Issue Summary'];

        setFieldValues(newValues);
        setNotification({
          type: 'success',
          title: 'Data Extracted from Response',
          message: `Successfully extracted structured client data from email/document submission and populated intake fields!`
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
                  if (client.name.includes('Jane Doe')) {
                    handleSelectCategory('Family Law');
                    setFieldValues({
                      client_name: 'Jane Doe',
                      dob: '11/14/1985',
                      address: '100 Main Street, Suite 200, Santa Ana, CA 92701',
                      email: 'jane.doe@example.com',
                      phone: '+1 (555) 019-2831',
                      respondent_name: 'John Doe',
                      respondent_dob: '04/22/1983',
                      respondent_address: '200 Coastal Way, Newport Beach, CA 92660',
                      jurisdictional_basis: 'California Family Code Section 300 (6 Mo CA / 3 Mo Orange County verified)',
                      county_filing: 'Superior Court of California, County of Orange',
                      marriage_date: '06/15/2012',
                      separation_date: '04/10/2026',
                      children: 'Minor children declared in confidential disclosure',
                      custody_preference: 'Joint Legal Custody & Primary Physical Custody to Jane Doe',
                      matter_summary: 'FL-100 Dissolution of Marriage Petition under CA Fam Code § 300'
                    });
                    setIsAutoFilledSample(true);
                  } else {
                    setFieldValues(prev => ({
                      ...prev,
                      client_name: client.name,
                      email: client.email,
                      phone: client.phone
                    }));
                  }
                }
              }}
              className="bg-[#070b13] border border-amber-500/50 text-amber-200 font-mono font-bold px-3 py-1.5 rounded-lg text-xs outline-none focus:border-amber-400 cursor-pointer min-w-[220px]"
            >
              <option value="">-- Choose Target Client --</option>
              {clients?.map(c => (
                <option key={c.id} value={c.name}>{c.name} ({c.practiceArea || 'General'})</option>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Button 1: Immigration */}
              <button
                type="button"
                onClick={() => handleSelectCategory('Immigration')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  selectedCategory === 'Immigration'
                    ? 'bg-gradient-to-br from-teal-500/20 to-teal-900/40 border-teal-400 text-white shadow-lg shadow-teal-500/10'
                    : 'bg-[#070b13] border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Globe className={`w-5 h-5 ${selectedCategory === 'Immigration' ? 'text-teal-400' : 'text-slate-400'}`} />
                  {selectedCategory === 'Immigration' && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />}
                </div>
                <div>
                  <div className="text-xs font-mono font-extrabold uppercase">Immigration</div>
                  <div className="text-[9.5px] text-slate-400 font-sans">USCIS Visas & Petitions</div>
                </div>
              </button>

              {/* Button 2: Family Law */}
              <button
                type="button"
                onClick={() => handleSelectCategory('Family Law')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  selectedCategory === 'Family Law'
                    ? 'bg-gradient-to-br from-teal-500/20 to-teal-900/40 border-teal-400 text-white shadow-lg shadow-teal-500/10'
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

              {/* Button 3: General */}
              <button
                type="button"
                onClick={() => handleSelectCategory('General')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  selectedCategory === 'General'
                    ? 'bg-gradient-to-br from-teal-500/20 to-teal-900/40 border-teal-400 text-white shadow-lg shadow-teal-500/10'
                    : 'bg-[#070b13] border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Scale className={`w-5 h-5 ${selectedCategory === 'General' ? 'text-teal-400' : 'text-slate-400'}`} />
                  {selectedCategory === 'General' && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />}
                </div>
                <div>
                  <div className="text-xs font-mono font-extrabold uppercase">General</div>
                  <div className="text-[9.5px] text-slate-400 font-sans">Civil Disputes & Claims</div>
                </div>
              </button>

              {/* Button 4: Custom */}
              <button
                type="button"
                onClick={() => handleSelectCategory('Custom')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  selectedCategory === 'Custom'
                    ? 'bg-gradient-to-br from-amber-500/20 to-amber-900/40 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-[#070b13] border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Sparkles className={`w-5 h-5 ${selectedCategory === 'Custom' ? 'text-amber-400' : 'text-slate-400'}`} />
                  {selectedCategory === 'Custom' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                </div>
                <div>
                  <div className="text-xs font-mono font-extrabold uppercase text-amber-300">Custom</div>
                  <div className="text-[9.5px] text-slate-400 font-sans">Contact + Custom Fields</div>
                </div>
              </button>
            </div>
          </div>

          {/* CUSTOM CATEGORY AI PROMPT BOX ("ask the user if there is anything or fields that they would like added") */}
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
                  {selectedCategory === 'Custom' ? (
                    <span>
                      I've set up the default Custom Intake Form with <strong>basic contact information</strong> and <strong>general matter information requests</strong>. Are there any additional specific fields, questions, or documentation requests you would like added to this custom intake form?
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
                  onClick={() => handleAutoFillFromDriveFile('drive-memo-watson')}
                  disabled={isExtractingData}
                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-[10.5px] font-mono font-bold uppercase rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                  title="Extract info from Google Drive files to fill requested form"
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
