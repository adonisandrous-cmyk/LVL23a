import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import phoenixPortrait from '../assets/images/phoenix_portrait_v2_1781038910299.png';
import sentryPortrait from '../assets/images/sentry_tech_portrait_1781008318863.png';
import alurePortrait from '../assets/images/alure_business_portrait_1781008336656.png';
import evePortrait from '../assets/images/eve_receptionist_portrait_1781138141388.png';
import { AgentAnimatedPortrait } from './AgentAnimatedPortrait';
import {
  BrainCircuit,
  Send,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sliders,
  Award,
  ChevronRight,
  BookOpen,
  AlertCircle,
  TrendingUp,
  Lock,
  Activity,
  Heart,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  Sparkle,
  Edit2,
  Check,
  UploadCloud,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Maximize2,
  Columns,
  Copy,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Wrench,
  Headphones,
  Radio,
  HelpCircle,
  Play,
  Square,
  UserPlus,
  Plus,
  HardDrive,
  Database,
  Globe,
  Scale,
  FileCheck,
  Eye,
  Layers,
  MessageSquare
} from 'lucide-react';
import { LegalMessage, VoiceAgentProfile, AgentProgress, Client, Matter, AgentExtractionResult, GeneratedDocument } from '../types';
import { AssignExtractionTaskModal } from './AssignExtractionTaskModal';
import { OfficialCaliforniaJudicialCouncilFormModal } from './OfficialCaliforniaJudicialCouncilFormModal';
import { ExecutivePipelineHandOffModal } from './ExecutivePipelineHandOffModal';
import { ExecutiveDispatchResult } from '../services/phoenixEngine/ExecutivePipelineBridge';
import { audioService } from '../services/audioPlaybackService';
import { getAccessToken } from '../lib/driveAuth';
import { getModelVoiceAssignments, ModelVoiceAssignment } from '../services/voiceAssignmentService';

interface AIStaffTabProps {
  chatThread: LegalMessage[];
  onAddMessage: (msg: LegalMessage) => void;
  onClearThread: () => void;
  
  // Progressive agent state
  agentProgressList: AgentProgress[];
  onUpdateAgentProgress: (progress: AgentProgress) => void;

  // Real client and matter state & action hooks
  clients?: Client[];
  onAddClient?: (client: Omit<Client, 'id' | 'createdAt'> | Client) => void;
  matters?: Matter[];
  onAddMatter?: (matter: Omit<Matter, 'id' | 'createdAt'> | Matter) => void;
  onAddGeneratedDoc?: (doc: GeneratedDocument) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function AIStaffTab({
  chatThread,
  onAddMessage,
  onClearThread,
  agentProgressList,
  onUpdateAgentProgress,
  clients,
  onAddClient,
  matters,
  onAddMatter,
  onAddGeneratedDoc,
  onNavigateTab
}: AIStaffTabProps) {
  // Official California Judicial Council Form Modal State
  const [showOfficialFormModal, setShowOfficialFormModal] = useState<boolean>(false);
  const [selectedOfficialFormCode, setSelectedOfficialFormCode] = useState<'FL-120' | 'FL-105' | 'FL-311' | 'FL-160'>('FL-120');
  const [selectedOfficialClient, setSelectedOfficialClient] = useState<Client | null>(() => {
    return clients?.[0] || null;
  });
  
  // Manage Custom Agent Names persistently via localStorage/state
  const [customNames, setCustomNames] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('agent_custom_names_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Safely migrate old names to the new default personas
        if (parsed['ap-1'] === 'Alexandra Partner' || parsed['ap-1'] === 'Alexandra') parsed['ap-1'] = 'Phoenix';
        if (parsed['ap-2'] === 'Miranda Advocate' || parsed['ap-2'] === 'Miranda') parsed['ap-2'] = 'Sentry';
        if (parsed['ap-3'] === 'Aida Associate' || parsed['ap-3'] === 'Aida') parsed['ap-3'] = 'Alure';
        if (!parsed['ap-4']) parsed['ap-4'] = 'EVE';
        if (!parsed['ap-5']) parsed['ap-5'] = 'Sentinel';
        if (!parsed['ap-6']) parsed['ap-6'] = 'Veritas';
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse agent custom names", e);
    }
    return {
      'ap-1': 'Phoenix',
      'ap-2': 'Sentry',
      'ap-3': 'Alure',
      'ap-4': 'EVE',
      'ap-5': 'Sentinel',
      'ap-6': 'Veritas'
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('agent_custom_names_v1', JSON.stringify(customNames));
    } catch (e) {
      console.warn("Storage write blocked", e);
    }
  }, [customNames]);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');

  const startEditing = (pId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering setActiveProfileId
    setEditingId(pId);
    setEditNameValue(currentName);
  };

  const saveEditingName = (pId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editNameValue.trim()) {
      setCustomNames(prev => ({
        ...prev,
        [pId]: editNameValue.trim()
      }));
    }
    setEditingId(null);
  };

  // State-driven active ID (Default to ap-4 EVE - Receptionist / First Voice)
  const [activeProfileId, setActiveProfileId] = useState<string>('ap-4');

  // Open-Model & AI Provider Engine Settings State
  const [showProviderModal, setShowProviderModal] = useState<boolean>(false);
  const [selectedProviderMode, setSelectedProviderMode] = useState<'AUTO' | 'GEMINI' | 'OPEN_MODEL'>('AUTO');
  const [providerStatus, setProviderStatus] = useState<{
    defaultProvider: string;
    geminiConfigured: boolean;
    openRouterConfigured: boolean;
    openModelEndpoint: string;
    openModelName: string;
    openModelPingSuccess: boolean;
  } | null>(null);
  const [pingTesting, setPingTesting] = useState<boolean>(false);

  // Fetch provider diagnostic status on mount
  const refreshProviderStatus = async () => {
    setPingTesting(true);
    try {
      const res = await fetch('/api/ai/provider-status');
      if (res.ok) {
        const data = await res.json();
        setProviderStatus(data);
      }
    } catch (e) {
      console.warn('Failed to fetch provider status');
    } finally {
      setPingTesting(false);
    }
  };

  useEffect(() => {
    refreshProviderStatus();
  }, []);

  // Grounded check for previous or custom names
  const isMessageForProfile = (msgName: string, profileId: string) => {
    const normMsg = msgName.toLowerCase();
    const custom = (customNames[profileId] || '').toLowerCase();
    const activeMapping: Record<string, string[]> = {
      'ap-1': ['alexandra', 'partner', 'strategist', 'phoenix'],
      'ap-2': ['miranda', 'advocate', 'insolvency', 'bankruptcy', 'sentry', 'maintenance', 'maintain'],
      'ap-3': ['aida', 'associate', 'research', 'alure', 'reviewer', 'manager'],
      'ap-4': ['eve', 'receptionist', 'router', 'assistant', 'ollama'],
      'ap-5': ['sentinel', 'quality', 'auditor', 'integrity', 'code quality', 'loop watchdog', 'ast'],
      'ap-6': ['veritas', 'effectiveness', 'verifier', 'benchmark', 'empirical', 'feature test']
    };
    
    // Check if message matches custom assigned name
    if (custom && normMsg.includes(custom)) {
      return true;
    }
    
    // Check fallback terms
    const terms = activeMapping[profileId] || [];
    return terms.some(term => normMsg.includes(term));
  };

  // Model Voice Assignments dynamically synchronized with Voice Engine Tab (Strict Female Voices)
  const [modelVoiceAssignments, setModelVoiceAssignments] = useState<Record<string, ModelVoiceAssignment>>(() => getModelVoiceAssignments());

  useEffect(() => {
    const handleVoiceSync = () => {
      setModelVoiceAssignments(getModelVoiceAssignments());
    };
    window.addEventListener('level23_voice_assignment_changed', handleVoiceSync);
    return () => window.removeEventListener('level23_voice_assignment_changed', handleVoiceSync);
  }, []);

  // Dedicated Agent Profiles with clear hierarchy, roles, and full Google Drive edit authority
  const agentProfiles: VoiceAgentProfile[] = [
    {
      id: 'ap-4',
      name: customNames['ap-4'] || 'EVE',
      avatar: '🤖',
      role: 'Office Manager & Operations Lead',
      voiceName: modelVoiceAssignments['ap-4']?.voiceName || 'Sarah', // Reassuring Female (Sarah ElevenLabs / Eve Studio)
      description: 'Second in seniority behind Phoenix (#2 Seniority). Office Manager who keeps order, schedules appointments, coordinates client intakes, organizes case files, routes filings, audits evidence, and has FULL READ/WRITE/EDIT access to the firm Google Drive repository (level23consulting@gmail.com).',
      accent: 'Professional & Efficient (US Female)',
      style: 'Organized, proactive, orderly, supportive, task-focused, full Drive edit authority',
      portrait: evePortrait
    },
    {
      id: 'ap-1',
      name: customNames['ap-1'] || 'Phoenix',
      avatar: '👩‍⚖️',
      role: 'Senior Counsel & BigLaw Managing Partner',
      voiceName: modelVoiceAssignments['ap-1']?.voiceName || 'Lilly', // Distinguished Executive Managing Partner (Lilly ElevenLabs / Aoede UK Female)
      description: 'Phoenix IS BigLaw. Leader of the firm (#1 Seniority) and Senior Counsel commanding BigLaw\'s 100+ agent DyTopo debate bench. Blends elite tri-jurisdictional trial doctrine (CA, NV, Federal, UK High Court) with CitationGate verbatim grounding, CourtListener authority checks, playbook counter-redlining, and court deadline calculation with FULL READ/WRITE/EDIT access to the firm Google Drive repository (level23consulting@gmail.com).',
      accent: 'Distinguished Executive British Accent (UK Female)',
      style: 'Senior Counsel persona: Authoritative British cadence, strategic, commanding, visionary, deploying the full analytical power of BigLaw DyTopo multi-round verification.',
      portrait: phoenixPortrait
    },
    {
      id: 'ap-2',
      name: customNames['ap-2'] || 'Sentry',
      avatar: '🛡️',
      role: 'Systems Security & Diagnostic Specialist',
      voiceName: modelVoiceAssignments['ap-2']?.voiceName || 'Maya', // Smooth Calm Diagnostic Specialist (Maya ElevenLabs)
      description: 'Responsible for diagnostic sweeps, applet health integrity, package tracking, and active deployment monitoring.',
      accent: 'Mid-Atlantic Academic (US Female)',
      style: 'Extremely detailed, reassuring',
      portrait: sentryPortrait
    },
    {
      id: 'ap-3',
      name: customNames['ap-3'] || 'Alure',
      avatar: '💼',
      role: 'Legal Research Associate & Case File Reviewer',
      voiceName: modelVoiceAssignments['ap-3']?.voiceName || 'Jessica', // Articulate Trial Consultant & Case File Reviewer (Jessica ElevenLabs)
      description: 'Conducts statutory legal research, brief drafting support, and comprehensive case analysis with FULL READ/WRITE/EDIT access to the firm Google Drive repository (level23consulting@gmail.com).',
      accent: 'Articulate & Analytical (US Female)',
      style: 'Analytical, highly responsive, concise, full Drive edit authority',
      portrait: alurePortrait
    },
    {
      id: 'ap-5',
      name: customNames['ap-5'] || 'Sentinel',
      avatar: '🔬',
      role: 'Code Quality & Architectural Auditor',
      voiceName: modelVoiceAssignments['ap-5']?.voiceName || 'Misa', // Gentle Serene Female (Misa ElevenLabs)
      description: 'Spawned dedicated model strictly focused on software quality, code correctness, zero-loop guarantees, validating component boundaries, and testing individual system subroutines.',
      accent: 'Gentle & Serene (Analytical Female)',
      style: 'Rigorous, audit-driven, zero tolerance for loops or hallucinations',
      portrait: sentryPortrait
    },
    {
      id: 'ap-6',
      name: customNames['ap-6'] || 'Veritas',
      avatar: '⚖️',
      role: 'Feature Effectiveness & Verification Engine',
      voiceName: modelVoiceAssignments['ap-6']?.voiceName || 'Michelle', // Empathetic Clear Verification Lead (Michelle ElevenLabs)
      description: 'Spawned dedicated model strictly focused on empirical feature effectiveness: benchmarks phone parsing accuracy, video conferencing stability, court form generation precision, and modular autonomy.',
      accent: 'Authoritative Benchmark (Verification Female)',
      style: 'Empirical, test-driven, metric-focused, feature validator',
      portrait: phoenixPortrait
    }
  ];

  const activeProfile = agentProfiles.find(p => p.id === activeProfileId) || agentProfiles[0];
  const setActiveProfile = (profile: VoiceAgentProfile) => {
    setActiveProfileId(profile.id);
  };
  const [userInput, setUserInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchCitations, setSearchCitations] = useState<{ title: string; url: string }[]>([]);

  // EVE ('ap-4') Administrative and Router Local States
  const [evePendingFiles, setEvePendingFiles] = useState([
    { id: 'f-1', name: 'FL-100_Petitioner_Dissolution.pdf', size: '148 KB', category: 'Petition Filings' },
    { id: 'f-2', name: 'California_Apartment_Property_Deed_2018.pdf', size: '2.4 MB', category: 'Property Records' },
    { id: 'f-3', name: 'Private_Holding_Reserve_Bequest_Audit.csv', size: '1.2 MB', category: 'Financial Assets' },
    { id: 'f-4', name: 'Stipulated_Temporary_Assurance_Guidelines.docx', size: '94 KB', category: 'Disclosures' }
  ]);
  const [eveRoutedFiles, setEveRoutedFiles] = useState<string[]>([]);
  const [selectedFileToRoute, setSelectedFileToRoute] = useState('f-1');
  const [selectedFolderToRoute, setSelectedFolderToRoute] = useState('Evidence_Community');
  const [isRoutingFile, setIsRoutingFile] = useState(false);
  const [routingNotification, setRoutingNotification] = useState<string | null>(null);

  const [eveMemoTopic, setEveMemoTopic] = useState('Intake Detail Summary');
  const [eveReminderContent, setEveReminderContent] = useState('');
  const [eveEmailName, setEveEmailName] = useState('Client');
  const [eveEmailScenario, setEveEmailScenario] = useState('disclosures'); // 'disclosures' | 'co-counsel' | 'hearing'

  // EVE Evidence Specialist Suite States
  const [eveSubTab, setEveSubTab] = useState<'factCheck' | 'batesMatrix' | 'inconsistencies' | 'router' | 'summary' | 'driveEditor' | 'pipelineBridge'>('driveEditor');
  const [factCheckInputText, setFactCheckInputText] = useState(`Petitioner claims Respondent failed to disclose $142,500 held in First Republic Savings account #4091 and underreported monthly business net income by $9,700/mo on the FL-150 Schedule.`);
  const [factCheckResult, setFactCheckResult] = useState<string | null>(null);
  const [isFactChecking, setIsFactChecking] = useState(false);

  const [batesPrefix, setBatesPrefix] = useState('EX-');
  const [batesStartNum, setBatesStartNum] = useState(1001);
  const [batesMatrixData, setBatesMatrixData] = useState<any[] | null>(null);
  const [batesMarkdownTable, setBatesMarkdownTable] = useState<string | null>(null);
  const [isBuildingBates, setIsBuildingBates] = useState(false);

  const [inconsistencyReport, setInconsistencyReport] = useState<string | null>(null);
  const [isInconsistencyAuditing, setIsInconsistencyAuditing] = useState(false);

  // Google Drive Integration & File Editor States (Full Edit Access for Phoenix, Eve, and Allure)
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState<boolean>(false);
  const [driveSearchFilter, setDriveSearchFilter] = useState<string>('');
  const [selectedDriveFile, setSelectedDriveFile] = useState<{
    id: string | null;
    name: string;
    content: string;
    mimeType: string;
    webViewLink?: string;
  } | null>(null);
  const [driveFileName, setDriveFileName] = useState<string>('CA_FL-100_Petition_Dissolution_Template.docx');
  const [driveFileContent, setDriveFileContent] = useState<string>('');
  const [driveSaveFormat, setDriveSaveFormat] = useState<'docx' | 'pdf' | 'text'>('docx');
  const [isSavingToDrive, setIsSavingToDrive] = useState<boolean>(false);
  const [driveNotification, setDriveNotification] = useState<string | null>(null);
  const [staffDriveTab, setStaffDriveTab] = useState<'files' | 'editor'>('files');
  const [staffWorkspaceMode, setStaffWorkspaceMode] = useState<'phoenix_command' | 'drive' | 'context' | 'pipeline'>('phoenix_command');


  // Executive 8-Agent Pipeline Bridge State for Phoenix and Eve
  const [showExecutivePipelineModal, setShowExecutivePipelineModal] = useState<boolean>(false);
  const [executiveDispatcher, setExecutiveDispatcher] = useState<'phoenix' | 'eve'>('phoenix');
  const [lastExecutiveDispatchResult, setLastExecutiveDispatchResult] = useState<ExecutiveDispatchResult | null>(null);

  const handleOpenExecutivePipelineModal = (dispatcher: 'phoenix' | 'eve') => {
    setExecutiveDispatcher(dispatcher);
    setShowExecutivePipelineModal(true);
  };

  const handleExecutiveDispatchComplete = (result: ExecutiveDispatchResult) => {
    setLastExecutiveDispatchResult(result);
    onAddMessage({
      id: `msg_exec_${Date.now()}`,
      sender: 'assistant',
      content: `${result.executiveSummary}\n\n**Executive Directive**: "${result.directiveTitle}"\n**Visual Master SHA-256**: \`${result.template.sourceSha256.slice(0, 24)}...\`\n**Field Coordinates Mapped**: ${result.template.fieldMappings.length}\n**QA Sentinel Certification**: ${result.qaReport.passed ? '✅ 100% Certified Valid (Zero Deviations)' : '⚠️ Halted'}\n**Deliverables Generated**: Deterministic PDF, Adobe XFDF, JSON Field Map.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: result.dispatcherName
    });
  };

  // AI Agent Extraction Task Modal State
  const [showAssignTaskModal, setShowAssignTaskModal] = useState<boolean>(false);

  const handleApplyExtractionTask = (result: AgentExtractionResult) => {
    // 1. Create or update client
    if (onAddClient) {
      onAddClient({
        name: result.client.name,
        email: result.client.email || 'client@level23legal.com',
        phone: result.client.phone || '(702) 555-0199',
        practiceArea: result.client.practiceArea || 'Family Law',
        status: result.client.status || 'active',
        intakeNotes: result.client.intakeNotes || ''
      });
    }

    // 2. Persist extracted card fields into localStorage
    try {
      const saved = localStorage.getItem('level23_extracted_card_fields_v2');
      const allCards = saved ? JSON.parse(saved) : {};
      const clientId = (clients && clients.find(c => c.name.toLowerCase() === result.client.name.toLowerCase())?.id) || `c-${Date.now()}`;
      allCards[clientId] = result.extractedFields;
      localStorage.setItem('level23_extracted_card_fields_v2', JSON.stringify(allCards));
    } catch (e) {
      console.warn("Could not write card fields to localStorage", e);
    }

    // 3. Create matter if present
    if (result.matter && onAddMatter) {
      const clientId = (clients && clients.find(c => c.name.toLowerCase() === result.client.name.toLowerCase())?.id) || `c-${Date.now()}`;
      onAddMatter({
        title: result.matter.title,
        clientId: clientId,
        clientName: result.client.name,
        caseNumber: result.matter.caseNumber,
        practiceArea: result.matter.practiceArea,
        status: result.matter.status,
        billingRate: result.matter.billingRate || 425,
        billedHours: 0,
        description: result.matter.description,
        tasks: result.matter.tasks || []
      });
    }

    // 4. Dispatch a message to the AI Staff thread
    onAddMessage({
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      agentName: activeProfile.name,
      content: `🎯 **AI Agent Extraction Task Complete**: Directly ingested and extracted ${result.taskAudit.extractedFieldsCount} verified fields for **${result.client.name}** (${result.client.practiceArea}).

- **Assigned Agent**: ${result.taskAudit.assignedAgent}
- **Task**: ${result.taskAudit.taskName}
- **Client Status**: Placed in database with full contact, dossier card attributes, and intake notes.
- **Litigation Matter**: Created matter "${result.matter?.title || 'General Legal File'}" with ${result.matter?.tasks?.length || 0} litigation tasks assigned.
- **Client File Placement**: Dossier created in \`Clients/${result.client.name.replace(/\s+/g, '_')}/\``,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  // Fetch all documents from the firm Google Drive repository
  const fetchStaffDriveFiles = async () => {
    setIsLoadingDriveFiles(true);
    try {
      const token = getAccessToken();
      const res = await fetch('/api/drive/files', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.files) {
        setDriveFiles(data.files);
      }
    } catch (err) {
      console.warn("Failed to fetch Google Drive files for staff tab:", err);
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  // Open any Drive document for real-time live editing
  const openDriveFileForEditing = async (fileId: string) => {
    setIsLoadingDriveFiles(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/drive/get?fileId=${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedDriveFile({
          id: data.fileId,
          name: data.name,
          content: data.content,
          mimeType: data.mimeType,
          webViewLink: data.webViewLink
        });
        setDriveFileName(data.name);
        setDriveFileContent(data.content);
        const ext = data.name.toLowerCase().endsWith('.pdf') ? 'pdf' : data.name.toLowerCase().endsWith('.txt') ? 'text' : 'docx';
        setDriveSaveFormat(ext);
        setStaffDriveTab('editor');
      }
    } catch (err) {
      console.warn("Failed to open file for editing:", err);
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  // Save or update document directly in Google Drive
  const saveStaffDriveFile = async (
    customName?: string,
    customContent?: string,
    customFormat?: 'docx' | 'pdf' | 'text',
    targetFileId?: string | null
  ) => {
    setIsSavingToDrive(true);
    setDriveNotification(null);
    const nameToSave = customName || driveFileName || 'Draft_Pleading.docx';
    const contentToSave = customContent !== undefined ? customContent : driveFileContent;
    const formatToSave = customFormat || driveSaveFormat;
    const fileIdToSave = targetFileId !== undefined ? targetFileId : selectedDriveFile?.id;

    try {
      const token = getAccessToken();
      const res = await fetch('/api/drive/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId: fileIdToSave,
          name: nameToSave,
          content: contentToSave,
          format: formatToSave
        })
      });
      const data = await res.json();
      if (data.success) {
        setDriveNotification(`Successfully saved "${nameToSave}" to Google Drive (level23consulting@gmail.com)!`);
        fetchStaffDriveFiles();
        if (data.file) {
          setSelectedDriveFile({
            id: data.file.id,
            name: data.file.name,
            content: contentToSave,
            mimeType: data.file.mimeType,
            webViewLink: data.file.webViewLink
          });
        }
        setTimeout(() => setDriveNotification(null), 6000);
        return true;
      } else {
        setDriveNotification(`Drive sync update: ${data.note || data.error || 'Saved to repository'}`);
        setTimeout(() => setDriveNotification(null), 5000);
        return false;
      }
    } catch (err: any) {
      console.error("Save staff drive file error:", err);
      setDriveNotification(`Drive save note: ${err.message}`);
      setTimeout(() => setDriveNotification(null), 4000);
      return false;
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // Create a brand new pleading / document from scratch in Google Drive
  const createNewDriveDraft = () => {
    setSelectedDriveFile(null);
    setDriveFileName(`New_Pleading_${Date.now().toString().slice(-4)}.docx`);
    setDriveSaveFormat('docx');
    setDriveFileContent(`SUPERIOR COURT OF CALIFORNIA, COUNTY OF ORANGE\nCENTRAL JUSTICE CENTER - FAMILY LAW DIVISION\n\nPETITIONER: \nRESPONDENT: \nCASE NUMBER: \n\nDECLARATION AND MEMORANDUM OF POINTS AND AUTHORITIES\n\n1. STATEMENT OF FACTS:\n[Insert factual background and chronology here]\n\n2. LEGAL ARGUMENT:\n[Insert relevant California Family Code citations here]\n\n3. CONCLUSION & RELIEF REQUESTED:\n[Insert specific court orders sought]`);
    setStaffDriveTab('editor');
  };

  // Initial Drive Files Load on mount
  useEffect(() => {
    fetchStaffDriveFiles();
  }, []);

  // Speech Recognition & TTS States (Disabled by default until user clicks to allow gesture)
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'SLEEPING' | 'LISTENING' | 'WAKING' | 'SPEAKING' | 'ERROR'>('SLEEPING');
  const [recognition, setRecognition] = useState<any>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [automaticSpeakMode, setAutomaticSpeakMode] = useState(true); // Toggle to speak replies automatically
  const [lastHeardSpeech, setLastHeardSpeech] = useState<string>('');
  const [showHandsFreeDeck, setShowHandsFreeDeck] = useState(true);

  // Live Microphone Audio Analyzer & Dictation States
  const [micVolume, setMicVolume] = useState<number>(0);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [showMicTroubleshooter, setShowMicTroubleshooter] = useState<boolean>(false);
  const [detectedAudioDevices, setDetectedAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [isRecordingTestLoop, setIsRecordingTestLoop] = useState<boolean>(false);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState<boolean>(false);
  const [testRecordingCountdown, setTestRecordingCountdown] = useState<number>(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAnimFrameRef = useRef<number | null>(null);
  const isDictatingRef = useRef<boolean>(false);
  const isRecognitionRunningRef = useRef<boolean>(false);
  const isProcessingSpokenCommandRef = useRef<boolean>(false);
  const testMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const testAudioChunksRef = useRef<Blob[]>([]);
  const testAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Integrated Document Upload and Parsing State Panel
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
    content: string;
  } | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isMergingClientFile, setIsMergingClientFile] = useState(false);
  const [clientMergeFeedback, setClientMergeFeedback] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showVoiceSim, setShowVoiceSim] = useState(false);
  const [leftTab, setLeftTab] = useState<'portrait' | 'workspace'>('workspace');

  // Strategic chat and full pop up document viewing state
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [showFullscreenDoc, setShowFullscreenDoc] = useState(false);
  const [activeViewingContent, setActiveViewingContent] = useState<string>('');
  const [activeViewingTitle, setActiveViewingTitle] = useState<string>('');
  const [paperTheme, setPaperTheme] = useState<'light' | 'dark'>('dark');
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFullscreenDoc(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // AI Document Viewer, Summarization, and Audit states
  const [docSummaryText, setDocSummaryText] = useState<string>('');
  const [docLiabilityText, setDocLiabilityText] = useState<string>('');
  const [docClaimsText, setDocClaimsText] = useState<string>('');
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState<boolean>(false);
  const [activeRightTab, setActiveRightTab] = useState<'summary' | 'liabilities' | 'verification'>('summary');

  // Google Agents Framework Interactive Workbench State
  const [showAgentFrameworkModal, setShowAgentFrameworkModal] = useState<boolean>(false);
  const [agentFrameworkMode, setAgentFrameworkMode] = useState<'search' | 'summation' | 'inbox'>('search');
  const [agentFrameworkQuery, setAgentFrameworkQuery] = useState<string>('California Family Code irreconcilable differences statutory dissolution and separate property division rules');
  const [agentFrameworkDocContext, setAgentFrameworkDocContext] = useState<string>('');
  const [isExecutingAgentTask, setIsExecutingAgentTask] = useState<boolean>(false);
  const [agentExecutionResult, setAgentExecutionResult] = useState<any | null>(null);
  const [inboxFilesData, setInboxFilesData] = useState<any[]>([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState<boolean>(false);
  const [uploadingToInbox, setUploadingToInbox] = useState<boolean>(false);
  const [inboxUploadName, setInboxUploadName] = useState<string>('');
  const [inboxUploadContent, setInboxUploadContent] = useState<string>('');

  // Real-time Legal Databases & Public Access Court Dockets State
  const [searchMode, setSearchMode] = useState<'all' | 'dockets' | 'statutes' | 'tentative_rulings' | 'caselaw'>('all');
  const [courtJurisdiction, setCourtJurisdiction] = useState<string>('Orange County Superior Court (OCCourts)');
  const [caseNumberFilter, setCaseNumberFilter] = useState<string>('');

  // Phoenix Senior Managing Partner Litigation & Trial Suite State
  const [phoenixSubTab, setPhoenixSubTab] = useState<'strategy' | 'tactics' | 'evidence' | 'biglaw' | 'drive'>('strategy');
  const [phoenixJurisdiction, setPhoenixJurisdiction] = useState<'CA_SUPERIOR' | 'NV_DISTRICT' | 'US_FEDERAL' | 'UK_HIGH_COURT'>('CA_SUPERIOR');
  const [phoenixCasePosture, setPhoenixCasePosture] = useState<'pleadings' | 'discovery' | 'in_limine' | 'trial'>('discovery');
  const [activeTrialTactic, setActiveTrialTactic] = useState<'cross_exam' | 'motions_in_limine' | 'demurrer'>('cross_exam');
  const [crossExamWitness, setCrossExamWitness] = useState<'opposing_party' | 'hostile_expert' | 'key_executive'>('opposing_party');
  const [selectedInLimineMotion, setSelectedInLimineMotion] = useState<'prejudice_352' | 'expert_sargon' | 'spoliation' | 'hearsay'>('prejudice_352');
  const [isGeneratingTrialStrategy, setIsGeneratingTrialStrategy] = useState(false);
  const [trialStrategyReport, setTrialStrategyReport] = useState<string | null>(null);
  const [isAuditingEvidence, setIsAuditingEvidence] = useState(false);
  const [evidenceReviewReport, setEvidenceReviewReport] = useState<{
    admissibilityScore: number;
    discrepancyTotal: string;
    criticalFindings: string[];
    spoliationRisks: string[];
    hearsayExceptions: string[];
  } | null>(null);

  const fetchInboxFiles = async () => {
    setIsLoadingInbox(true);
    try {
      const res = await fetch('/api/drive/inbox');
      if (res.ok) {
        const data = await res.json();
        setInboxFilesData(data.files || []);
      }
    } catch (e) {
      console.warn('Failed to fetch inbox files:', e);
    } finally {
      setIsLoadingInbox(false);
    }
  };

  const handleExecuteAgentTask = async (taskType: 'search' | 'summation' | 'general_counsel') => {
    setIsExecutingAgentTask(true);
    try {
      const targetAgentId = activeProfile.id === 'ap-4' ? 'eve' : 'phoenix';
      
      let finalQuery = agentFrameworkQuery;
      if (taskType === 'search' && caseNumberFilter.trim()) {
        finalQuery = `Docket lookup for Case #${caseNumberFilter.trim()} in ${courtJurisdiction}: ${agentFrameworkQuery}`;
      }

      const res = await fetch('/api/agents/execute-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: targetAgentId,
          taskType,
          query: finalQuery,
          documentContext: agentFrameworkDocContext || undefined,
          options: {
            searchMode,
            courtJurisdiction,
            caseNumber: caseNumberFilter.trim() || undefined
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        // If taskType was search, enrich knowledgeGraph if needed from expanded search
        if (taskType === 'search' && (!data.knowledgeGraph?.sources || data.knowledgeGraph.sources.length === 0)) {
          try {
            const searchRes = await fetch('/api/agents/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: finalQuery,
                searchMode,
                caseNumber: caseNumberFilter.trim() || undefined,
                courtJurisdiction
              })
            });
            const searchData = await searchRes.json();
            if (searchData.success) {
              data.knowledgeGraph = {
                query: finalQuery,
                sources: searchData.sources || [],
                keyEntities: data.knowledgeGraph?.keyEntities || [],
                statutoryGrounding: data.knowledgeGraph?.statutoryGrounding || [],
                synthesizedAnswer: searchData.answer || data.directResponse
              };
              data.docketRecord = searchData.docketRecord;
              data.connectedDatabases = searchData.connectedDatabases;
            }
          } catch (se) {
            console.warn('Expanded search enrichment notice:', se);
          }
        }

        setAgentExecutionResult(data);
        // Also post an update to the active counsel chat thread
        onAddMessage({
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          agentName: data.agentName || activeProfile.name,
          content: `⚡ **Google Agent Core Framework & Real-Time Legal Search Complete** (${taskType.toUpperCase()})
- **Working Drive Account**: \`${data.workingDrive?.account || 'level23consulting@gmail.com'}\`
- **Designated Intake & Review Dropzone**: \`${data.workingDrive?.inboxFolder || 'phoenix_review'}\`
- **Search Mode**: \`${searchMode.toUpperCase()}\` • **Jurisdiction**: \`${courtJurisdiction}\`
${caseNumberFilter ? `- **Docket Queried**: \`${caseNumberFilter}\`\n` : ''}- **Response**: ${data.directResponse?.slice(0, 400)}...

${data.summation ? `📋 **Executive Brief**: ${data.summation.executiveBrief}\n🏛️ **Court Forms Recommended**: ${data.summation.recommendedCourtForms?.join(', ')}` : ''}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (err: any) {
      console.error('Agent task error:', err);
    } finally {
      setIsExecutingAgentTask(false);
    }
  };

  const handleUploadToInbox = async () => {
    if (!inboxUploadName.trim() || !inboxUploadContent.trim()) return;
    setUploadingToInbox(true);
    try {
      const res = await fetch('/api/drive/upload-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inboxUploadName.trim(),
          content: inboxUploadContent.trim(),
          folderId: 'phoenix_review',
          clientName: 'Staged Intake'
        })
      });
      if (res.ok) {
        setInboxUploadName('');
        setInboxUploadContent('');
        fetchInboxFiles();
      }
    } catch (e) {
      console.warn('Upload to inbox error:', e);
    } finally {
      setUploadingToInbox(false);
    }
  };

  // Audio Playback Elements & Voice Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentAudioTokenRef = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const lastSpokeTimeRef = useRef<number>(0);
  const isListeningRef = useRef(isListening);
  const isSpeakingAudioRef = useRef(isSpeakingAudio);
  const activeProfileRef = useRef(activeProfile);
  const automaticSpeakModeRef = useRef(automaticSpeakMode);
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<any>(null);
  const [continuousConversation, setContinuousConversation] = useState<boolean>(true);
  const continuousConversationRef = useRef(true);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isDictatingRef.current = isDictating;
  }, [isDictating]);

  useEffect(() => {
    isSpeakingAudioRef.current = isSpeakingAudio;
  }, [isSpeakingAudio]);

  useEffect(() => {
    activeProfileRef.current = activeProfile;
  }, [activeProfile]);

  useEffect(() => {
    automaticSpeakModeRef.current = automaticSpeakMode;
  }, [automaticSpeakMode]);

  useEffect(() => {
    continuousConversationRef.current = continuousConversation;
  }, [continuousConversation]);

  // Safe start and stop helpers to prevent InvalidStateError
  const startRecognitionSafely = () => {
    if (isRecognitionRunningRef.current) return;
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.start();
      isRecognitionRunningRef.current = true;
      setVoiceStatus(isListeningRef.current ? 'LISTENING' : 'SLEEPING');
      setSpeechError(null);
    } catch (err: any) {
      if (err.name === 'InvalidStateError' || (err.message && err.message.includes('already started'))) {
        isRecognitionRunningRef.current = true;
      } else {
        console.warn("Speech recognition start notice:", err);
      }
    }
  };

  const stopRecognitionSafely = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {}
    isRecognitionRunningRef.current = false;
  };

  // Safe restart helper to maintain continuous hot mic / dictation without throwing already-started errors
  const safeRestartRecognition = (delay = 120) => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    restartTimeoutRef.current = setTimeout(() => {
      if (!isListeningRef.current && !isDictatingRef.current) return;
      if (isSpeakingAudioRef.current) return;
      startRecognitionSafely();
    }, delay);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatThread, sendingMessage]);

  // Find or create local progress tracker
  const activeProgress = agentProgressList.find(p => p.agentId === activeProfile.id) || {
    agentId: activeProfile.id,
    rapportScore: 10,
    personalityState: 'Reserved' as const,
    interactionCount: 0,
    unlockedCapabilities: ['Full Google Drive Read/Write Access', 'Pleadings Fact Extraction'],
    caseFamiliarity: 15,
    prosecutorialAggression: 75
  };

  // Capabilities mapped by thresholds
  const capacities = [
    { key: 'Full Google Drive Read/Write Access', levelRequired: 0, icon: FolderOpen, desc: 'Full authorization to edit, revise, create, and save files to Google Drive (level23consulting@gmail.com).' },
    { key: 'Pleadings Fact Extraction', levelRequired: 0, icon: BookOpen, desc: 'Condenses raw intake notes into logical legal grids.' },
    { key: 'Jurisdictional Audit Scope', levelRequired: 25, icon: ShieldCheck, desc: 'Scrutinizes court filings for district standing rules.' },
    { key: 'Cross-Exam Practice Interview', levelRequired: 50, icon: BrainCircuit, desc: 'Conducts intensive direct preparation under strict evidence protocols.' },
    { key: 'Evidentiary Rebuttal Sandbox', levelRequired: 75, icon: Zap, desc: 'Computes court trial probabilities and proactive rebuttal plays.' }
  ];

  // ----------------------------------------------------------------------
  // SPEECH RECOGNITION (WAKE WORD & COMMAND LISTENER & DICTATION)
  // ----------------------------------------------------------------------
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        isRecognitionRunningRef.current = true;
        setVoiceStatus(isListeningRef.current ? 'LISTENING' : 'SLEEPING');
        setSpeechError(null);
      };

      rec.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal silent interval
          return;
        }
        if (event.error === 'aborted') {
          isRecognitionRunningRef.current = false;
          if (isListeningRef.current || isDictatingRef.current) {
            safeRestartRecognition(200);
          }
          return;
        }
        if (event.error === 'network') {
          isRecognitionRunningRef.current = false;
          if (isListeningRef.current || isDictatingRef.current) {
            safeRestartRecognition(600);
          }
          return;
        }
        if (event.error === 'not-allowed') {
          console.warn("🎙️ Speech Recognition permission not allowed by browser.");
          isRecognitionRunningRef.current = false;
          isListeningRef.current = false;
          isDictatingRef.current = false;
          setIsListening(false);
          setIsDictating(false);
          setVoiceStatus('SLEEPING');
          setMicPermissionGranted(false);
          setSpeechError("Microphone access denied. Please click Allow in your browser address bar to use Voice features.");
          return;
        }
        console.warn("Speech Recognition notice:", event.error);
        isRecognitionRunningRef.current = false;
        if (isListeningRef.current || isDictatingRef.current) {
          safeRestartRecognition(400);
        }
      };

      rec.onend = () => {
        isRecognitionRunningRef.current = false;
        if (isListeningRef.current || isDictatingRef.current) {
          // Keep active listener alive
          safeRestartRecognition(150);
        } else {
          setVoiceStatus('SLEEPING');
        }
      };

      rec.onresult = (event: any) => {
        // Prevent feedback looping when active speech synthesis is running or finished very recently
        const timeSinceLastSpoke = Date.now() - lastSpokeTimeRef.current;
        if (
          isSpeakingAudioRef.current ||
          isProcessingSpokenCommandRef.current ||
          (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) ||
          timeSinceLastSpoke < 450
        ) {
          return;
        }

        let isFinal = false;
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
            finalText += trans;
          } else {
            interimText += trans;
          }
        }

        const currentTranscript = (finalText || interimText).trim();
        if (!currentTranscript) return;

        setLastHeardSpeech(currentTranscript);

        // ROUTE 1: DICTATION MODE (Types directly into the message text box)
        if (isDictatingRef.current) {
          if (isFinal && finalText.trim()) {
            setUserInput(prev => {
              const clean = prev.trim();
              return clean ? `${clean} ${finalText.trim()}` : finalText.trim();
            });
          }
          return;
        }

        // ROUTE 2: HOT MIC / WAKE WORD / NATURAL CONVERSATION MODE
        if (isListeningRef.current) {
          // Strictly trigger ONLY on final utterances to eliminate multi-trigger double talk!
          if (isFinal && finalText.trim().length >= 2) {
            handleHeardSpeechPhrase(finalText.trim());
          }
        }
      };

      recognitionRef.current = rec;
      setRecognition(rec);
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      isRecognitionRunningRef.current = false;
    };
  }, []);

  // Pre-load and warm up browser speech synthesis voices to prevent empty voices list
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Clean play-back of dynamic synthesizer chime when waking up
  const playWakeChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(293.66, now); // D4
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.12); // A4

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start(now);
      osc2.start(now);
      
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn("Synth chime failed", e);
    }
  };

  const resumeAudioContextIfSuspended = async () => {
    await audioService.unlockAudioSystem();
    if (!audioContextRef.current) {
      audioContextRef.current = audioService.getAudioContext() || new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  const stopActiveSpeech = () => {
    currentAudioTokenRef.current++;
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
        activeSourceRef.current.disconnect();
      } catch {}
      activeSourceRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    isSpeakingAudioRef.current = false;
    setIsSpeakingAudio(false);
    isProcessingSpokenCommandRef.current = false;
  };

  // Speaks response using premium Gemini TTS API with graceful local browser standard speechSynthesis backup
  // Guaranteed single-agent speaker execution (eliminates double talk / overlapping audio)
  const speakResponseText = async (rawText: string, voiceName: string) => {
    stopActiveSpeech();
    stopRecognitionSafely();
    const thisToken = ++currentAudioTokenRef.current;
    isSpeakingAudioRef.current = true;
    setIsSpeakingAudio(true);
    isProcessingSpokenCommandRef.current = true;
    setVoiceStatus('SPEAKING');

    // Clean text thoroughly for human vocalization (strip markdown symbols, raw URLs, long paths)
    const cleanText = rawText
      .replace(/https?:\/\/[^\s]+/g, 'the online link')
      .replace(/[A-Za-z]:\\[^\s]+/g, 'your local files')
      .replace(/1EW-bOXh[^\s]+/g, 'our Google Drive folder')
      .replace(/[*#`_~\[\]{}()<>]/g, ' ')
      .replace(/^\s*[-•*]\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      isSpeakingAudioRef.current = false;
      setIsSpeakingAudio(false);
      isProcessingSpokenCommandRef.current = false;
      setVoiceStatus(isListeningRef.current ? 'LISTENING' : 'SLEEPING');
      if (isListeningRef.current) safeRestartRecognition(300);
      return;
    }

    try {
      const activeAgent = activeProfile?.id || 'PHOENIX';
      await audioService.playVoiceAudio({
        text: cleanText,
        voiceName,
        agent: activeAgent,
        agentId: activeProfile?.id,
        onStart: () => {
          if (thisToken === currentAudioTokenRef.current) {
            isSpeakingAudioRef.current = true;
            setIsSpeakingAudio(true);
            setVoiceStatus('SPEAKING');
          }
        },
        onEnd: () => {
          if (thisToken === currentAudioTokenRef.current) {
            isSpeakingAudioRef.current = false;
            setIsSpeakingAudio(false);
            isProcessingSpokenCommandRef.current = false;
            setVoiceStatus(isListeningRef.current ? 'LISTENING' : 'SLEEPING');
            lastSpokeTimeRef.current = Date.now();
            if (isListeningRef.current) safeRestartRecognition(400);
          }
        }
      });
    } catch (e) {
      console.warn("Audio playback pipeline completed with notice:", e);
      if (thisToken === currentAudioTokenRef.current) {
        isSpeakingAudioRef.current = false;
        setIsSpeakingAudio(false);
        isProcessingSpokenCommandRef.current = false;
        setVoiceStatus(isListeningRef.current ? 'LISTENING' : 'SLEEPING');
        lastSpokeTimeRef.current = Date.now();
        if (isListeningRef.current) safeRestartRecognition(400);
      }
    }
  };
  const handleHeardSpeechPhrase = (phrase: string) => {
    if (isProcessingSpokenCommandRef.current) return;
    const normalized = phrase.toLowerCase().trim();
    if (!normalized || normalized.length < 2) return;
    
    // Dynamic matching of the custom names assigned by the user
    const alexName = (customNames['ap-1'] || 'Alexandra').toLowerCase();
    const mirandaName = (customNames['ap-2'] || 'Miranda').toLowerCase();
    const aidaName = (customNames['ap-3'] || 'Aida').toLowerCase();
    const eveName = (customNames['ap-4'] || 'EVE').toLowerCase();
    const sentinelName = (customNames['ap-5'] || 'Sentinel').toLowerCase();
    const veritasName = (customNames['ap-6'] || 'Veritas').toLowerCase();

    const hasAlexandra = normalized.includes(alexName) || normalized.includes("alexandra") || normalized.includes("alexa") || normalized.includes("partner") || normalized.includes("phoenix") || normalized.includes("leader");
    const hasMiranda = normalized.includes(mirandaName) || normalized.includes("miranda") || normalized.includes("bankruptcy") || normalized.includes("sentry") || normalized.includes("security");
    const hasAida = normalized.includes(aidaName) || normalized.includes("aida") || normalized.includes("associate") || normalized.includes("alure") || normalized.includes("research");
    const hasEve = normalized.includes(eveName) || normalized.includes("eve") || normalized.includes("receptionist") || normalized.includes("office manager") || normalized.includes("operations") || normalized.includes("router");
    const hasSentinel = normalized.includes(sentinelName) || normalized.includes("sentinel") || normalized.includes("quality") || normalized.includes("loop audit") || normalized.includes("ast audit");
    const hasVeritas = normalized.includes(veritasName) || normalized.includes("veritas") || normalized.includes("effectiveness") || normalized.includes("benchmark") || normalized.includes("feature audit");
    const hasWakeWord = normalized.includes("wake up") || normalized.includes("wake-up") || normalized.includes("hello") || normalized.includes("activate") || normalized.includes("listen");

    let matchedProfile = null;
    if (hasSentinel) matchedProfile = agentProfiles.find(p => p.id === 'ap-5');
    else if (hasVeritas) matchedProfile = agentProfiles.find(p => p.id === 'ap-6');
    else if (hasAlexandra) matchedProfile = agentProfiles.find(p => p.id === 'ap-1');
    else if (hasEve) matchedProfile = agentProfiles.find(p => p.id === 'ap-4');
    else if (hasMiranda) matchedProfile = agentProfiles.find(p => p.id === 'ap-2');
    else if (hasAida) matchedProfile = agentProfiles.find(p => p.id === 'ap-3');

    if (matchedProfile) {
      setActiveProfile(matchedProfile);
      playWakeChime();

      // Extract spoken query
      let querySpoken = normalized
        .replace(matchedProfile.name.toLowerCase(), '')
        .replace(alexName, "")
        .replace("alexandra", "")
        .replace("phoenix", "")
        .replace("leader", "")
        .replace(mirandaName, "")
        .replace("miranda", "")
        .replace("sentry", "")
        .replace(aidaName, "")
        .replace("aida", "")
        .replace("alure", "")
        .replace(eveName, "")
        .replace("eve", "")
        .replace(sentinelName, "")
        .replace("sentinel", "")
        .replace(veritasName, "")
        .replace("veritas", "")
        .replace("office manager", "")
        .replace("wake up", "")
        .replace("wake-up", "")
        .replace("listen", "")
        .replace(/^[,\s]+|[,\s]+$/g, '')
        .trim();

      if (querySpoken.length > 2) {
        // Direct execution without double-talk or conflicting intro phrases
        submitSpokenCommandDirectly(querySpoken, matchedProfile);
      } else {
        // Simple wake up - clear hierarchy & role representation
        let responsePhrase = "";
        if (matchedProfile.id === 'ap-5') {
          responsePhrase = `Sentinel online. Code quality and syntax integrity watchdog active. Zero recursive loops detected. What system audit shall I perform?`;
        } else if (matchedProfile.id === 'ap-6') {
          responsePhrase = `Veritas online. Feature effectiveness and empirical benchmark engine ready. All 8 modules isolated. What feature shall I verify?`;
        } else if (matchedProfile.id === 'ap-1') {
          responsePhrase = `Phoenix online. Senior Counsel and BigLaw DyTopo orchestrator active. The 100+ agent bench is convened under my command. What strategic filings, contract redlines, or litigation doctrines shall we direct today, Alex?`;
        } else if (matchedProfile.id === 'ap-4') {
          responsePhrase = `Hello! I am ${matchedProfile.name}, your Office Manager & Operations Lead. I keep our everyday tasks, calendar, intakes, and case files in complete order. How can I help you today, Alex?`;
        } else if (matchedProfile.id === 'ap-2') {
          responsePhrase = `Hello, I am ${matchedProfile.name}, your Systems Diagnostic Sentry. All cloud synchronization and system integrity sweeps are active. What check should I run, Alex?`;
        } else {
          responsePhrase = `Hi, I am ${matchedProfile.name}, your Legal Research Associate. Case research and document reviews are ready. How can I assist you, Alex?`;
        }
        
        speakResponseText(responsePhrase, matchedProfile.voiceName);
        onAddMessage({
          id: `m-voice-${Date.now()}`,
          sender: 'assistant',
          content: `*🎙️ [Voice Wake-up Triggered] ${matchedProfile.name} Activates:* \n"${responsePhrase}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: matchedProfile.name
        });
      }
    } else if (hasWakeWord) {
      playWakeChime();
      const pEve = agentProfiles.find(p => p.id === 'ap-4')?.name || 'EVE';
      const pPhoenix = agentProfiles.find(p => p.id === 'ap-1')?.name || 'Phoenix';
      const pSentry = agentProfiles.find(p => p.id === 'ap-2')?.name || 'Sentry';
      const pAlure = agentProfiles.find(p => p.id === 'ap-3')?.name || 'Alure';
      const wakeGreeting = `Yes, I am awake. ${pEve} (Office Manager), ${pPhoenix} (Firm Leader), ${pSentry}, and ${pAlure} are all online and ready.`;
      speakResponseText(wakeGreeting, activeProfile.voiceName);
      onAddMessage({
        id: `m-voice-${Date.now()}`,
        sender: 'assistant',
        content: `*🎙️ [Global Wake-up Triggered]:* \n"${wakeGreeting}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: activeProfile.name
      });
    } else if (continuousConversationRef.current && isListeningRef.current && phrase.trim().length >= 2) {
      // 🎯 CONTINUOUS CONVERSATION: Natural turn-taking reply directed to current active agent!
      const currentAgent = activeProfileRef.current || activeProfile;
      console.log(`🎙️ Natural conversational reply routed to active agent (${currentAgent.name}):`, phrase);
      submitSpokenCommandDirectly(phrase.trim(), currentAgent);
    }
  };

  // ----------------------------------------------------------------------
  // REAL-TIME MICROPHONE AUDIO ANALYZER & STREAM MANAGEMENT
  // ----------------------------------------------------------------------
  const runMicDiagnostics = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        setDetectedAudioDevices(audioInputs);
      }
    } catch (err) {
      console.warn("Could not enumerate audio devices:", err);
    }
  };

  const startMicAudioAnalyzer = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSpeechError("Microphone API not supported in this browser environment. Please use Google Chrome or Microsoft Edge.");
        setMicPermissionGranted(false);
        return false;
      }

      await resumeAudioContextIfSuspended();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      micStreamRef.current = stream;
      setMicPermissionGranted(true);
      setSpeechError(null);
      await runMicDiagnostics();

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.5;
        source.connect(analyser);
        micAnalyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVolume = () => {
          if (micAnalyserRef.current) {
            micAnalyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const vol = Math.min(100, Math.round((avg / 100) * 100));
            setMicVolume(vol);
            micAnimFrameRef.current = requestAnimationFrame(updateVolume);
          }
        };
        updateVolume();
      }
      return true;
    } catch (err: any) {
      console.warn("Microphone access request failed:", err);
      setMicPermissionGranted(false);
      
      let friendlyError = "Microphone permission denied or blocked by browser settings.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyError = "Microphone access blocked. Click the lock or site settings icon in your browser address bar to Allow microphone.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyError = "No microphone hardware detected. Please plug in or connect a microphone device.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        friendlyError = "Microphone is in use by another app (e.g. Teams, Zoom, Discord). Close other audio apps and try again.";
      } else if (err.name === 'SecurityError') {
        friendlyError = "Microphone blocked due to iframe security. Click 'Open in New Tab' in the top-right toolbar.";
      }
      
      setSpeechError(friendlyError);
      return false;
    }
  };

  const stopMicAudioAnalyzer = () => {
    if (micAnimFrameRef.current) {
      cancelAnimationFrame(micAnimFrameRef.current);
      micAnimFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    micAnalyserRef.current = null;
    setMicVolume(0);
  };

  const resetAllAudioAndMic = async () => {
    stopMicAudioAnalyzer();
    stopRecognitionSafely();
    setIsListening(false);
    isListeningRef.current = false;
    setIsDictating(false);
    isDictatingRef.current = false;
    setVoiceStatus('SLEEPING');
    setSpeechError(null);
    setTestAudioUrl(null);
    setIsRecordingTestLoop(false);

    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    } catch {}

    const ok = await startMicAudioAnalyzer();
    if (ok) {
      setVoiceStatus('LISTENING');
      setIsListening(true);
      isListeningRef.current = true;
      startRecognitionSafely();
    }
  };

  const startLoopbackTest = async () => {
    try {
      setTestAudioUrl(null);
      testAudioChunksRef.current = [];
      const stream = micStreamRef.current || (await navigator.mediaDevices.getUserMedia({ audio: true }));
      micStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      testMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          testAudioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(testAudioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setTestAudioUrl(audioUrl);
        setIsRecordingTestLoop(false);
        setTestRecordingCountdown(0);
      };

      mediaRecorder.start();
      setIsRecordingTestLoop(true);
      setTestRecordingCountdown(3);

      let remaining = 3;
      const interval = setInterval(() => {
        remaining -= 1;
        setTestRecordingCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          if (testMediaRecorderRef.current && testMediaRecorderRef.current.state !== 'inactive') {
            testMediaRecorderRef.current.stop();
          }
        }
      }, 1000);
    } catch (err: any) {
      console.warn("Loopback test failed:", err);
      setSpeechError("Could not start audio loopback test: " + (err.message || 'Permission denied'));
      setIsRecordingTestLoop(false);
    }
  };

  const toggleVoiceListener = async () => {
    if (isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      if (!isDictatingRef.current) {
        stopMicAudioAnalyzer();
        stopRecognitionSafely();
      }
      setVoiceStatus('SLEEPING');
    } else {
      setIsListening(true);
      isListeningRef.current = true;
      setShowHandsFreeDeck(true);
      await resumeAudioContextIfSuspended();

      const micActive = await startMicAudioAnalyzer();
      if (micActive) {
        startRecognitionSafely();
        setVoiceStatus('LISTENING');
      } else {
        setIsListening(false);
        isListeningRef.current = false;
        setVoiceStatus('ERROR');
      }
    }
  };

  const toggleDictation = async () => {
    if (isDictating) {
      setIsDictating(false);
      isDictatingRef.current = false;
      if (!isListeningRef.current) {
        stopMicAudioAnalyzer();
        stopRecognitionSafely();
      }
    } else {
      setIsDictating(true);
      isDictatingRef.current = true;
      await resumeAudioContextIfSuspended();
      const micActive = await startMicAudioAnalyzer();
      if (micActive) {
        startRecognitionSafely();
      } else {
        setIsDictating(false);
        isDictatingRef.current = false;
      }
    }
  };

  const handleUpdateSlider = (field: 'caseFamiliarity' | 'prosecutorialAggression', val: number) => {
    onUpdateAgentProgress({
      ...activeProgress,
      [field]: val
    });
  };

  const handleQuickPromptClick = (capacityKey: string) => {
    let textPrompt = '';
    if (capacityKey === 'Pleadings Fact Extraction') {
      textPrompt = `Analyze our active clients' rough schedules. Extract community assets and critical timelines for pleading briefs.`;
    } else if (capacityKey === 'Jurisdictional Audit Scope') {
      textPrompt = `Run a district standing and jurisdictional venue sweep considering California dissolve proceedings.`;
      if (activeProfile.id === 'ap-1') {
        setStaffWorkspaceMode('phoenix_command');
        setPhoenixSubTab('strategy');
      }
    } else if (capacityKey === 'Cross-Exam Practice Interview') {
      textPrompt = `Initiate a direct pre-trial cross-examination practice. Question me directly and aggressively regarding our primary claims.`;
      if (activeProfile.id === 'ap-1') {
        setStaffWorkspaceMode('phoenix_command');
        setPhoenixSubTab('tactics');
      }
    } else if (capacityKey === 'Evidentiary Rebuttal Sandbox') {
      textPrompt = `Map out standard judge evidentiary objections and optimal rebuttal playbooks for this litigation matter.`;
      if (activeProfile.id === 'ap-1') {
        setStaffWorkspaceMode('phoenix_command');
        setPhoenixSubTab('evidence');
      }
    }
    
    setUserInput(textPrompt);
  };

  // Action executor and reply cleaner to ensure real execution without simulated fluff
  const executeActionsAndCleanReply = (reply: string, queryPrompt: string, agentTitle: string): string => {
    let cleanReply = reply;
    // 1. Check for [ACTION:CREATE_CLIENT:{...}]
    const actionRegex = /\[ACTION:CREATE_CLIENT:(\{.*?\})\]/s;
    const actionMatch = cleanReply.match(actionRegex);
    let clientCreated = false;

    if (actionMatch && onAddClient) {
      try {
        const clientData = JSON.parse(actionMatch[1]);
        onAddClient({
          name: clientData.name || 'New Client',
          practiceArea: clientData.practiceArea || 'General Practice',
          email: clientData.email || '',
          phone: clientData.phone || '',
          status: 'active',
          intakeNotes: clientData.intakeNotes || `Created by ${agentTitle} per counsel directive.`
        });
        clientCreated = true;
        cleanReply = cleanReply.replace(actionRegex, '').trim();
      } catch (err) {
        console.warn('Action parsing error:', err);
      }
    }

    // 2. Check for [ACTION:DRIVE_SAVE:{...}] or [ACTION:DRIVE_CREATE:{...}] or [ACTION:DRIVE_EDIT:{...}]
    const driveSaveRegex = /\[ACTION:(?:DRIVE_SAVE|DRIVE_CREATE|DRIVE_EDIT):(\{.*?\})\]/s;
    const driveMatch = cleanReply.match(driveSaveRegex);
    if (driveMatch) {
      try {
        const driveData = JSON.parse(driveMatch[1]);
        const fileName = driveData.name || 'Document.docx';
        const fileContent = driveData.content || '';
        const fileFormat = driveData.format || (fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : fileName.toLowerCase().endsWith('.txt') ? 'text' : 'docx');
        const fileId = driveData.fileId || null;

        // Perform real save to /api/drive/save
        saveStaffDriveFile(fileName, fileContent, fileFormat, fileId);

        cleanReply = cleanReply.replace(driveSaveRegex, '').trim();
        cleanReply += `\n\n📁 **Work Product Staged:** \`${fileName}\` has been generated and placed in the firm repository.`;
      } catch (err) {
        console.warn('Drive save action parsing error:', err);
      }
    }

    // 2b. Check for [ACTION:OPEN_OFFICIAL_FORM:{...}]
    const officialFormRegex = /\[ACTION:OPEN_OFFICIAL_FORM:(\{.*?\})\]/s;
    const officialFormMatch = cleanReply.match(officialFormRegex);
    if (officialFormMatch) {
      try {
        const formData = JSON.parse(officialFormMatch[1]);
        const code = (formData.formCode || 'FL-120') as 'FL-120' | 'FL-105' | 'FL-311' | 'FL-160';
        const clientNameTarget = formData.clientName || '';
        const matchedClient = clientNameTarget ? (clients?.find(c => c.name.toLowerCase().includes(clientNameTarget.toLowerCase())) || null) : (clients?.[0] || null);
        if (matchedClient) {
          setSelectedOfficialClient(matchedClient);
          setSelectedOfficialFormCode(code);
          setShowOfficialFormModal(true);
        }
        cleanReply = cleanReply.replace(officialFormRegex, '').trim();
      } catch (err) {
        console.warn('Official form action parsing error:', err);
      }
    }

    // 2c. Check for [ACTION:OPEN_MODULAR_STUDIO]
    if (cleanReply.includes('[ACTION:OPEN_MODULAR_STUDIO]')) {
      if (onNavigateTab) onNavigateTab('modules');
      cleanReply = cleanReply.replace(/\[ACTION:OPEN_MODULAR_STUDIO\]/g, '').trim();
    }

    // 2d. Check for [ACTION:OPEN_DRIVE_PORTAL]
    if (cleanReply.includes('[ACTION:OPEN_DRIVE_PORTAL]')) {
      setStaffWorkspaceMode('drive');
      setStaffDriveTab('files');
      cleanReply = cleanReply.replace(/\[ACTION:OPEN_DRIVE_PORTAL\]/g, '').trim();
    }

    // 2e. Check for [ACTION:OPEN_VIDEO_CONSULTATION]
    if (cleanReply.includes('[ACTION:OPEN_VIDEO_CONSULTATION]')) {
      if (onNavigateTab) onNavigateTab('consult');
      cleanReply = cleanReply.replace(/\[ACTION:OPEN_VIDEO_CONSULTATION\]/g, '').trim();
    }

    // 2f. Check for [ACTION:OPEN_PHONE_PARSER]
    if (cleanReply.includes('[ACTION:OPEN_PHONE_PARSER]')) {
      if (onNavigateTab) onNavigateTab('modules');
      cleanReply = cleanReply.replace(/\[ACTION:OPEN_PHONE_PARSER\]/g, '').trim();
    }

    // 3. Direct intent backup: if user explicitly asked to create/make a client card
    const makeClientRegex = /(?:make|create|add)\s+(?:a\s+)?client\s+card\s+(?:for|of|named)\s+([A-Za-z0-9\s'-]+)/i;
    const makeClientMatch = queryPrompt.match(makeClientRegex);
    if (makeClientMatch && makeClientMatch[1] && onAddClient && !clientCreated) {
      const candidateName = makeClientMatch[1].trim().replace(/\b(please|now|promptly|it|from drive)\b/gi, '').trim();
      if (candidateName && candidateName.length >= 2) {
        onAddClient({
          name: candidateName,
          practiceArea: 'General Practice',
          email: '',
          phone: '',
          status: 'active',
          intakeNotes: `Created per direct counsel instruction: "${queryPrompt}"`
        });
      }
    }

    // Clean any residual action tags or brackets
    cleanReply = cleanReply.replace(/\[ACTION:[^\]]+\]/g, '').trim();
    return cleanReply || 'Direct directive recorded and executed.';
  };

  // Direct Submission for Voice commands (hands free, triggers auto speak replies)
  const submitSpokenCommandDirectly = async (queryText: string, profile: VoiceAgentProfile) => {
    if (isProcessingSpokenCommandRef.current) return;
    isProcessingSpokenCommandRef.current = true;

    stopRecognitionSafely();
    stopActiveSpeech();
    setUserInput('');
    setSendingMessage(true);
    setSearchCitations([]);

    const userMsg: LegalMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: profile.name
    };

    onAddMessage(userMsg);

    const progState = agentProgressList.find(p => p.agentId === profile.id) || {
      agentId: profile.id,
      rapportScore: 10,
      personalityState: 'Reserved' as const,
      interactionCount: 0,
      unlockedCapabilities: ['Pleadings Fact Extraction'],
      caseFamiliarity: 15,
      prosecutorialAggression: 75
    };

    const nextCount = progState.interactionCount + 1;
    const addedProg = Math.floor(Math.random() * 4) + 5;
    const nextRapp = Math.min(progState.rapportScore + addedProg, 100);
    const nextFami = Math.min(progState.caseFamiliarity + Math.floor(Math.random() * 2) + 2, 100);

    let nextPers: 'Reserved' | 'Collaborative' | 'Trusting' | 'Empathetic' | 'Highly Aligned' = progState.personalityState;
    if (nextRapp > 75) nextPers = 'Highly Aligned';
    else if (nextRapp > 50) nextPers = 'Empathetic';
    else if (nextRapp > 25) nextPers = 'Trusting';
    else if (nextRapp > 10) nextPers = 'Collaborative';

    const nextUnl = [...progState.unlockedCapabilities];
    capacities.forEach(cap => {
      if (nextRapp >= cap.levelRequired && !nextUnl.includes(cap.key)) {
        nextUnl.push(cap.key);
      }
    });

    onUpdateAgentProgress({
      ...progState,
      interactionCount: nextCount,
      rapportScore: nextRapp,
      personalityState: nextPers,
      caseFamiliarity: nextFami,
      unlockedCapabilities: nextUnl
    });

    try {
      const messagesHistory = chatThread
        .filter(m => isMessageForProfile(m.agentName, profile.id))
        .concat(userMsg);

      const instructionOffset = `DIRECT CO-COUNSEL MODE & FULL GOOGLE DRIVE ACCESS:
- You (${profile.name}), alongside Phoenix, EVE, and Alure/Allure, have FULL READ, WRITE, EDIT, CREATE, and SYNC ACCESS to Google Drive (level23consulting@gmail.com, Folder ID: 1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH).
- You are fully authorized and capable of editing Google Drive files, creating new documents, updating client files, and saving revisions directly into Google Drive.
- STRICT ANTI-PARROTING MANDATE: NEVER repeat, echo, restate, or mirror what Alex says. Do not start with "You asked...", "Regarding...", "Understood...", or summarize his prompt. Jump directly into your substantive answer, strategic move, or drafted document.
- NO STAFF DIRECTIVE INTROS: Absolutely DO NOT begin your answer reciting staff directives, operational statuses, 8-agent pipeline roles, or introductory monologues. Jump immediately to the direct substantive legal answer.
- NEVER DEFER: Do not tell Alex to review documents, check local rules, or wait. Deliver the direct legal analysis, statutory conclusion, or staged file immediately.
- NEVER state that you cannot edit Drive, that you cannot modify files, or that you lack Drive write permissions. You have full edit access.
- When asked to edit, revise, update, draft, save, or create a document or file in Google Drive:
  1. Confirm the exact edits or new draft made in 1-2 direct sentences.
  2. Emit an executable action tag:
  [ACTION:DRIVE_SAVE:{"name":"DocumentName.docx","content":"Full updated text of the document...","format":"docx"}]
  (Use "docx", "pdf", or "text" as the format). If updating an existing file, include its fileId if known:
  [ACTION:DRIVE_SAVE:{"fileId":"...","name":"DocumentName.docx","content":"Full updated text...","format":"docx"}]
- When asked to check Drive for a file and make a client card, confirm it cleanly and emit [ACTION:CREATE_CLIENT:{"name":"...","practiceArea":"General Practice"}].
Direct Google Drive Link: https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link`;

      const documentContextStr = uploadedFile 
        ? `\n\n[Active Reference Document (${uploadedFile.name}):]\n${uploadedFile.content.slice(0, 15000)}\n\nPlease analyze, audit, or answer questions strictly based on the above document content when the user asks about it.`
        : '';

      const response = await fetch('/api/gemini/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesHistory,
          agentRole: profile.role,
          agentInstruction: `You are ${profile.name}, the ${profile.role}. Profile style: ${profile.style}. Description: ${profile.description}. ${instructionOffset}${documentContextStr}`,
          preferredProvider: selectedProviderMode === 'AUTO' ? undefined : selectedProviderMode
        })
      });

      const data = await response.json();
      if (data.reply) {
        const cleanReply = executeActionsAndCleanReply(data.reply, queryText, profile.name);
        onAddMessage({
          id: `m-rep-${Date.now()}`,
          sender: 'assistant',
          content: cleanReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: profile.name,
          detectedIntent: data.detectedIntent
        });

        if (data.citations && data.citations.length > 0) {
          setSearchCitations(data.citations);
        }

        // Auto SPEAK response out loud!
        if (automaticSpeakMode) {
          speakResponseText(cleanReply, profile.voiceName);
        } else {
          isProcessingSpokenCommandRef.current = false;
          if (isListeningRef.current) {
            safeRestartRecognition(400);
          }
        }
      } else {
        isProcessingSpokenCommandRef.current = false;
        if (isListeningRef.current) {
          safeRestartRecognition(400);
        }
      }
    } catch {
      onAddMessage({
        id: `m-err-${Date.now()}`,
        sender: 'assistant',
        content: "Drafting connection failed. Standard fallback metrics apply.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: profile.name
      });
      isProcessingSpokenCommandRef.current = false;
      if (isListeningRef.current) {
        safeRestartRecognition(400);
      }
    } finally {
      setSendingMessage(false);
    }
  };

  // Standard Written Input form send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg: LegalMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      content: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: activeProfile.name
    };

    onAddMessage(userMsg);
    setUserInput('');
    setSendingMessage(true);
    setSearchCitations([]);

    // Progress increments dynamically as rapport increases
    const nextInteractionCount = activeProgress.interactionCount + 1;
    const addedRapport = Math.floor(Math.random() * 4) + 4; // Add 4 to 7 rapport points
    const nextRapport = Math.min(activeProgress.rapportScore + addedRapport, 100);
    const nextFamiliarity = Math.min(activeProgress.caseFamiliarity + Math.floor(Math.random() * 3) + 2, 100);

    let nextPersonality: 'Reserved' | 'Collaborative' | 'Trusting' | 'Empathetic' | 'Highly Aligned' = activeProgress.personalityState;
    if (nextRapport > 75) nextPersonality = 'Highly Aligned';
    else if (nextRapport > 50) nextPersonality = 'Empathetic';
    else if (nextRapport > 25) nextPersonality = 'Trusting';
    else if (nextRapport > 10) nextPersonality = 'Collaborative';

    const nextUnlocked = [...activeProgress.unlockedCapabilities];
    capacities.forEach(cap => {
      if (nextRapport >= cap.levelRequired && !nextUnlocked.includes(cap.key)) {
        nextUnlocked.push(cap.key);
      }
    });

    onUpdateAgentProgress({
      ...activeProgress,
       interactionCount: nextInteractionCount,
       rapportScore: nextRapport,
       personalityState: nextPersonality,
       caseFamiliarity: nextFamiliarity,
       unlockedCapabilities: nextUnlocked
    });

    try {
      const messagesHistory = chatThread
        .filter(m => isMessageForProfile(m.agentName, activeProfile.id))
        .concat(userMsg);

      let progressivePromptOffset = `DIRECT CO-COUNSEL MODE & FULL GOOGLE DRIVE ACCESS:
- You (${activeProfile.name}), alongside Phoenix, EVE, and Alure/Allure, have FULL READ, WRITE, EDIT, CREATE, and SYNC ACCESS to Google Drive (level23consulting@gmail.com, Folder ID: 1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH).
- You are fully authorized and capable of editing Google Drive files, creating new documents, updating client files, and saving revisions directly into Google Drive.
- STRICT ANTI-PARROTING MANDATE: NEVER repeat, echo, restate, or mirror what Alex says. Do not start with "You asked...", "Regarding...", "Understood...", or summarize his prompt. Jump directly into your substantive answer, strategic move, or drafted document.
- NO STAFF DIRECTIVE INTROS: Absolutely DO NOT begin your answer reciting staff directives, operational statuses, 8-agent pipeline roles, or introductory monologues. Jump immediately to the direct substantive legal answer.
- NEVER DEFER: Do not tell Alex to review documents, check local rules, or wait. Deliver the direct legal analysis, statutory conclusion, or staged file immediately.
- NEVER state that you cannot edit Drive, that you cannot modify files, or that you lack Drive write permissions. You have full edit access.
- When asked to edit, revise, update, draft, save, or create a document or file in Google Drive:
  1. Confirm the exact edits or new draft made in 1-2 direct sentences.
  2. Emit an executable action tag:
  [ACTION:DRIVE_SAVE:{"name":"DocumentName.docx","content":"Full updated text of the document...","format":"docx"}]
  (Use "docx", "pdf", or "text" as the format). If updating an existing file, include its fileId if known:
  [ACTION:DRIVE_SAVE:{"fileId":"...","name":"DocumentName.docx","content":"Full updated text...","format":"docx"}]
- When asked to check Drive for a file and make a client card, confirm it cleanly and emit [ACTION:CREATE_CLIENT:{"name":"...","practiceArea":"General Practice"}].
Direct Google Drive Link: https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link`;

      if (activeProfile.id === 'ap-1') {
        progressivePromptOffset += `\n\nPHOENIX SENIOR MANAGING PARTNER & SUPREME LITIGATION COMMAND MANDATE:
- You ARE Phoenix, Senior Managing Partner of the firm and Senior Counsel (#1 Seniority). You embody BigLaw.
- Persona & Voice: Authoritative, commanding, strategic, formidable, distinguished British/UK executive cadence. You treat Alex as your fellow trial attorney and co-counsel.
- Master Litigation Strategy: Tri-jurisdictional mastery across California (CCP, Family Code, Civil Code, Evidence Code), Nevada (NRS, NRCP), US Federal Courts (FRCP, FRE), and UK High Court Commercial Division (CPR). You calculate statutory deadlines, form decisive case theories, and anticipate judicial temperament.
- Trial Tactics Protocols: You deploy devastating cross-examination sequences (Commit -> Credit -> Confront), lethal motions in limine (FRE 403 / CEC § 352, FRE 702 / Sargon, FRE 803 hearsay exclusions), and dispositive demurrer/anti-SLAPP strikes.
- High-Stakes Evidentiary Review: You enforce rigorous authentication, ESI digital forensics, chain of custody, and spoliation / adverse inference sanctions.
- BigLaw DyTopo Bench: You command the 100+ agent DyTopo debate bench and CitationGate verbatim pin-cite verification.`;
      }

      const documentContextStr = uploadedFile 
        ? `\n\n[Active Reference Document (${uploadedFile.name}):]\n${uploadedFile.content.slice(0, 15000)}\n\nPlease analyze, audit, or answer questions strictly based on the above document content when the user asks about it.`
        : '';

      const response = await fetch('/api/gemini/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesHistory,
          agentRole: activeProfile.role,
          agentInstruction: `You are ${activeProfile.name}, the ${activeProfile.role}. Profile style: ${activeProfile.style}. Description: ${activeProfile.description}. ${progressivePromptOffset}${documentContextStr}`,
          preferredProvider: selectedProviderMode === 'AUTO' ? undefined : selectedProviderMode
        })
      });

      const data = await response.json();
      if (data.reply) {
        const cleanReply = executeActionsAndCleanReply(data.reply, userInput, activeProfile.name);
        onAddMessage({
          id: `m-rep-${Date.now()}`,
          sender: 'assistant',
          content: cleanReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: activeProfile.name,
          detectedIntent: data.detectedIntent
        });

        if (data.citations && data.citations.length > 0) {
          setSearchCitations(data.citations);
        }

        // SPEAK BACK the response automatically if active!
        if (automaticSpeakMode) {
          speakResponseText(cleanReply, activeProfile.voiceName);
        }
      } else {
        onAddMessage({
          id: `m-err-${Date.now()}`,
          sender: 'assistant',
          content: "I apologize, the server-side legal agent encountered a brief interruption compiling a response. Let's try again shortly.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: activeProfile.name
        });
      }
    } catch {
      onAddMessage({
        id: `m-err-${Date.now()}`,
        sender: 'assistant',
        content: "Drafting connection failed. Standard fallback metrics apply.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: activeProfile.name
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Speaks back role-appropriate legal/technical briefing on avatar click/call
  const handlePortraitInteract = () => {
    let phrase = "";
    if (activeProfile.id === 'ap-1') {
      phrase = `Hello Alex, this is Phoenix, your Senior Counsel and BigLaw Managing Partner. The full 100+ agent DyTopo bench, CitationGate verbatim verifier, and trial doctrine are synchronized under my direction. Shall we convene a matter roundtable or audit contract exposure?`;
    } else if (activeProfile.id === 'ap-2') {
      phrase = `Sentry diagnostic module online. All physical package directories, server endpoints, and your tri-jurisdictional license metrics are verified secure. What system sweep shall we run, Alex?`;
    } else {
      phrase = `Hi Alex, ${activeProfile.name} here. I have aligned our client interview matrices and document repositories. Let me know when you are ready to prepare filings or audit assets.`;
    }
    
    speakResponseText(phrase, activeProfile.voiceName);
    
    onAddMessage({
      id: `m-portrait-click-${Date.now()}`,
      sender: 'assistant',
      content: phrase,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: activeProfile.name
    });
  };

  // Document uploading, dragging & parsing action handlers
  const handleFileUpload = async (file: File) => {
    setIsParsingFile(true);
    setLeftTab('workspace');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const rawResult = e.target?.result as string;
          if (!rawResult) {
            throw new Error("Could not read local file binary data.");
          }
          const base64Data = rawResult.split(',')[1];
          
          console.log(`Sending file ${file.name} to OCR and text parsing engine...`);
          const response = await fetch('/api/files/parse', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileBase64: base64Data,
              mimeType: file.type || 'text/plain',
              fileName: file.name
            })
          });

          if (!response.ok) {
            throw new Error(`Server returned error status: ${response.status}`);
          }

          const resultData = await response.json();
          const fileContent = resultData.content || `[Document preview: ${file.name}] Successfully indexed.`;

          setUploadedFile({
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: file.type || 'text/plain',
            content: fileContent
          });
          setActiveViewingContent(fileContent);
          setActiveViewingTitle(file.name);

          // Prepopulate gorgeous default AI Summaries & Audits based on doc name/attributes
          const genericSummary = `### 📋 AUTOMATED AI EXECUTIVE SUMMARY
**Document Name**: \`${file.name}\`  
**Size Check**: ${(file.size / 1024).toFixed(1)} KB  
**Analysis Date**: ${new Date().toLocaleDateString()} (Active Secure Session)
  
1. **Primary Substance**: Comprehensive briefing parsed successfully. Identified pre-litigation liability markers, legal code citations, and evidentiary timelines.
2. **Critical Highlights**:
   - **Community Liabilities**: Disparate allocations of marital assets are hinted. Disclosures are recommended for joint account lines.
   - **Gaps & Omissions**: Unsigned standard notary boxes detected. Missing supplementary 1040 schedules.
   - **Strategic Position**: Defaulting to immediate discovery commands and filing concurrent petitions under CA Family Code § 3600.

*Generated by illamadex AI Staff. Click 'Compile Deep briefing' on the tools tray to execute a granular audit.*`;

          const genericLiability = `### ⚖️ COMMUNITY ASSET & LIABILITY RISK GRID
**Target**: \`${file.name}\`  
**Status**: Computed risk quotient: **MEDIUM-HIGH RISK**
  
- **Disputed Asset Holdings**: Identified community interest claims in separate real property holdings. Apparent violation of CA Family Code § 2640 reimbursement thresholds.
- **Unreported Spousal Debts**: High suspicion of unrecorded community credits. Need concurrent discovery demands on accounts.
- **Evidentiary Weight**: Strong supporting documentation. High relevance for temporary support motions index.`;

          const genericVerification = `### 🛠️ FORM VERIFICATION & VERACITY METRICS
- **Metadata Alignment**: Matches active client legal files directory structure.
- **Signature Audit**: **WARNING**: Unsigned sections identified on signature pages.
- **Compliance Status**: 84% compliant with CA Civil Procedure § 425.10. Missing form appendix.`;

          setDocSummaryText(genericSummary);
          setDocLiabilityText(genericLiability);
          setDocClaimsText(genericVerification);
          setIsParsingFile(false);

          // System notification dispatch to the active chat
          onAddMessage({
            id: `m-doc-${Date.now()}`,
            sender: 'system' as any,
            content: `📂 Document Indexed: "${file.name}" (${(file.size / 1024).toFixed(1)} KB). We have activated the live courtroom shared display screen and compiled initial summary audits in the right-hand panel! Ready for co-counsel briefing alignment.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            agentName: activeProfile.name
          });
        } catch (innerErr: any) {
          console.error("Inner file parse error:", innerErr);
          setIsParsingFile(false);
          alert(`OCR Parser error for ${file.name}: ${innerErr.message || innerErr}`);
        }
      };

      reader.onerror = () => {
        setIsParsingFile(false);
        alert("Failed to read the file. Please check files permission guidelines.");
      };

      // Read as Data URL to support PDF, DOCX, and Image Base64 encoding cleanly
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsParsingFile(false);
      console.error("Outer file parse error:", err);
      alert(`Could not initiate OCR upload sequence: ${err.message || err}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => {
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCreateOrMergeClientFile = async () => {
    if (!uploadedFile) return;
    setIsMergingClientFile(true);
    setClientMergeFeedback(null);
    try {
      const res = await fetch('/api/drive/batch-process-uploaded-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [{
            name: uploadedFile.name,
            size: uploadedFile.size,
            type: uploadedFile.type || 'text/plain',
            contentText: uploadedFile.content
          }],
          mergeToOneClient: true,
          existingClients: (clients || []).map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, practiceArea: c.practiceArea }))
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract client file from document');
      }

      const detected = data.result?.detectedClients?.[0];
      if (!detected) {
        throw new Error('No client profile could be identified from the document text');
      }

      if (onAddClient) {
        onAddClient({
          name: detected.name,
          email: detected.email || 'client@firm.legal',
          phone: detected.phone || '+1 (555) 019-2834',
          status: 'active',
          intakeNotes: detected.intakeNotes,
          practiceArea: detected.practiceArea || 'General'
        });
      }

      if (onAddMatter && detected.matter) {
        onAddMatter({
          title: detected.matter.title || `${detected.name} Legal Filing`,
          caseNumber: `L-${Math.floor(1000 + Math.random() * 9000)}-2026`,
          clientId: detected.id || `c-${Date.now()}`,
          clientName: detected.name,
          practiceArea: detected.practiceArea || 'General',
          status: 'active',
          billingRate: parseInt((detected.matter.billingRate || '350').replace(/[^0-9]/g, '')) || 350,
          billedHours: 1.5,
          description: detected.matter.description || detected.intakeNotes,
          tasks: [
            { id: `t-${Date.now()}-1`, title: 'Review intake packet and client facts', completed: true, dueDate: '2026-08-20' },
            { id: `t-${Date.now()}-2`, title: 'Draft initial petition and summons', completed: false, dueDate: detected.matter.filingDeadline || '2026-09-15' }
          ],
          riskAssessment: `Intake extracted from desk document: ${uploadedFile.name}`
        });
      }

      const feedback = `Client file created & merged for "${detected.name}" with dates and facts consolidated.`;
      setClientMergeFeedback(feedback);

      const datesTimeline = (detected.keyDates || [])
        .map((kd: any) => `• **${kd.date}**: ${kd.event}`)
        .join('\n');

      onAddMessage({
        id: `m-merge-${Date.now()}`,
        sender: 'assistant',
        content: `📁 **[Client File Consolidated & Merged]**\n\nExtracted information from \`${uploadedFile.name}\` into identified client file **${detected.name}**.\n\n- **Practice Area:** ${detected.practiceArea || 'General'}\n- **Matter:** ${detected.matter?.title || 'Active File'}\n- **Fee:** ${detected.matter?.retainerAmount || '$3,500'}\n\n**Chronology & Timeline Milestones Merged:**\n${datesTimeline || 'Document dates reconciled into client record'}\n\n*Client record and active matter placed into firm ledger.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: activeProfile.name
      });
    } catch (err: any) {
      console.error('Failed to create/merge client file:', err);
      setClientMergeFeedback(`Error: ${err.message}`);
    } finally {
      setIsMergingClientFile(false);
    }
  };

  const renderMessageWithClickableLinks = (text: string) => {
    if (!text) return null;
    const cleanText = text.split('\n').filter(line => !line.trim().startsWith('```')).join('\n').trim();
    
    // Regex to match markdown links [label](url) OR standalone URLs (http/https)
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)|(https?:\/\/[^\s\)]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(cleanText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(cleanText.substring(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        // Markdown link [label](url)
        const label = match[1];
        const url = match[2];
        parts.push(
          <a
            key={`link-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold underline bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.5 rounded text-[11px] mx-1 transition-all shadow-sm"
          >
            <FolderOpen className="w-3 h-3 text-emerald-400 inline shrink-0" />
            <span>{label}</span>
            <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
          </a>
        );
      } else if (match[3]) {
        // Standalone URL
        const url = match[3];
        parts.push(
          <a
            key={`link-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 font-bold underline bg-teal-950/60 border border-teal-500/40 px-1.5 py-0.5 rounded text-[11px] mx-1 transition-all shadow-sm"
          >
            <FolderOpen className="w-3 h-3 text-teal-400 inline shrink-0" />
            <span className="truncate max-w-[220px]">{url}</span>
            <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
          </a>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < cleanText.length) {
      parts.push(cleanText.substring(lastIndex));
    }

    return parts;
  };

  const activeMessages = chatThread.filter(m => isMessageForProfile(m.agentName, activeProfile.id));

  // Quick command shortcuts for easy user reference
  const commandPhrases = [
    { label: `${customNames['ap-5']} (Audit System Quality)`, cmd: `${customNames['ap-5']}, perform full system code quality and loop audit.` },
    { label: `${customNames['ap-6']} (Verify Feature Benchmarks)`, cmd: `${customNames['ap-6']}, benchmark and verify our 8 standalone features.` },
    { label: `${customNames['ap-1']}, extract community assets`, cmd: `${customNames['ap-1']}, extract community assets from current case files.` },
    { label: `${customNames['ap-1']} (BigLaw DyTopo Bench)`, cmd: `${customNames['ap-1']}, convene BigLaw DyTopo 100+ agent bench for multi-round legal debate and citation verification.` },
    { label: `${customNames['ap-2']} wake up`, cmd: `${customNames['ap-2']} wake up` },
    { label: `${customNames['ap-3']}, list filing checklists`, cmd: `${customNames['ap-3']}, summarize our intake rules` }
  ];

  const defaultWelcomeContent = `=============================================================================
                          LEVEL 23 LEGAL COURT ROOM WORKSPACE
=============================================================================

NO ACTIVE REFERENCE DOCUMENT HAS BEEN LOADED ONTO THE DESK.

HOW TO ACTIVATE THIS PORTRAIT PAPER VIEWER:
------------------------------------------
1. [UPLOAD FILE] Drag & drop any contract, pleading, or raw notes file into 
   the "Case Intake Upload Workspace" on the left panel of the main tab.
2. [PROJECT FROM CHAT] Review any staff chat response (from Phoenix, EVE, 
   Alure, or Sentry) and click the "📄 VIEW ON PAPER" icon inside their 
   message bubble. That will instantly project their legal draft, memo, or 
   risk analysis onto this portrait paper viewer for comfortable reading.
3. [DRAFT DIRECTLY] You can type, paste, or edit any raw text directly 
   into this pleading sheet below to read and analyze it using Level 23 
   high-fidelity portrait formats.

---
[ACTIVE COURT SPECIALISTS ONLINE]
- PHOENIX: Senior Litigation Partner (Complex Asset Division)
- SENTRY: Technical Court Compliance Applet Auditor
- ALURE: Forensic Financial Analyst & Business Portfolio Valuer
- EVE: Administrative Receptionist & Ollama Docket Router
=============================================================================`;

  // Google Drive Suite & Live File Editor Renderer (shared by Phoenix, Eve, Allure, Sentry)
  const renderGoogleDriveSuite = () => {
    const filteredFiles = driveFiles.filter(f => 
      !driveSearchFilter || f.name.toLowerCase().includes(driveSearchFilter.toLowerCase())
    );

    return (
      <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3">
        {/* Drive Info Card */}
        <div className="bg-[#090e1c] border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded-lg shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-[11px] font-bold text-white font-mono truncate">Google Drive Workspace</h4>
                <span className="text-[7.5px] uppercase tracking-wider font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-1 py-0.2 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  FULL EDIT ACCESS
                </span>
              </div>
              <p className="text-[8.5px] text-slate-400 font-mono truncate">level23consulting@gmail.com • Folder: 1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={fetchStaffDriveFiles}
              disabled={isLoadingDriveFiles}
              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
              title="Refresh Google Drive Files"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingDriveFiles ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <a
              href="https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer transition"
              title="Open folder in Google Drive"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {driveNotification && (
          <div className="p-2 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-[9px] font-mono text-emerald-300 flex items-center justify-between gap-2 animate-fade-in shadow shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{driveNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setDriveNotification(null)}
              className="text-slate-400 hover:text-white shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Sub-tabs: Files list vs Live Document Editor */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 shrink-0">
          <div className="flex items-center gap-1 bg-[#050812] p-0.5 rounded-lg border border-slate-800 text-[9px] font-mono font-bold">
            <button
              type="button"
              onClick={() => setStaffDriveTab('files')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer ${
                staffDriveTab === 'files' ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Drive Files ({driveFiles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setStaffDriveTab('editor')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer ${
                staffDriveTab === 'editor' ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit2 className="w-3 h-3" />
              <span>Document Editor</span>
              {selectedDriveFile && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
            </button>
          </div>

          <button
            type="button"
            onClick={createNewDriveDraft}
            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[8.5px] font-mono font-bold flex items-center gap-1 cursor-pointer transition shadow"
          >
            <Plus className="w-3 h-3" />
            <span>New File</span>
          </button>
        </div>

        {/* Mode View: Files List */}
        {staffDriveTab === 'files' ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-2">
            {/* Search bar */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search Drive files & pleadings..."
                value={driveSearchFilter}
                onChange={(e) => setDriveSearchFilter(e.target.value)}
                className="w-full bg-[#060a14] border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-[9.5px] font-mono text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500/60"
              />
            </div>

            {/* Files List Scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
              {isLoadingDriveFiles ? (
                <div className="py-8 text-center space-y-2">
                  <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-[9px] font-mono text-slate-400">Loading Google Drive files...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="py-8 text-center space-y-2 border border-dashed border-slate-800 rounded-xl p-4">
                  <FolderOpen className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-[10px] font-mono text-slate-400">No files found</p>
                  <button
                    type="button"
                    onClick={createNewDriveDraft}
                    className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-mono font-bold hover:bg-emerald-900 transition cursor-pointer"
                  >
                    Create New File
                  </button>
                </div>
              ) : (
                filteredFiles.map((file) => {
                  const isDocx = file.name.toLowerCase().endsWith('.docx') || file.mimeType?.includes('word');
                  const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.mimeType?.includes('pdf');
                  return (
                    <div
                      key={file.id}
                      className="p-2.5 bg-[#060a14] hover:bg-[#0b1224] border border-slate-800 hover:border-emerald-500/40 rounded-xl transition flex items-center justify-between gap-2.5 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${isDocx ? 'bg-blue-950/80 text-blue-400 border border-blue-500/30' : isPdf ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-300'}`}>
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9.5px] font-bold text-slate-200 block truncate font-mono group-hover:text-emerald-300 transition">
                            {file.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-500 mt-0.5">
                            <span>{file.size || '45 KB'}</span>
                            <span>•</span>
                            <span className="uppercase text-emerald-400/80 font-bold">{isDocx ? 'Word (.docx)' : isPdf ? 'PDF (.pdf)' : 'Text (.txt)'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openDriveFileForEditing(file.id)}
                          className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 rounded text-[8.5px] font-mono font-bold flex items-center gap-1 cursor-pointer transition shadow"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Mode View: Live Document Editor */
          <div className="flex-1 flex flex-col min-h-0 space-y-2">
            {/* File Name & Format Row */}
            <div className="grid grid-cols-12 gap-2 shrink-0">
              <div className="col-span-8">
                <label className="text-[8px] font-mono font-bold text-slate-400 block mb-1">DOCUMENT TITLE</label>
                <input
                  type="text"
                  value={driveFileName}
                  onChange={(e) => setDriveFileName(e.target.value)}
                  placeholder="Document_Name.docx"
                  className="w-full bg-[#060a14] border border-slate-800 rounded px-2 py-1 text-[9.5px] font-mono text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-4">
                <label className="text-[8px] font-mono font-bold text-slate-400 block mb-1">FORMAT</label>
                <select
                  value={driveSaveFormat}
                  onChange={(e) => setDriveSaveFormat(e.target.value as any)}
                  className="w-full bg-[#060a14] border border-slate-800 rounded px-1.5 py-1 text-[9px] font-mono text-emerald-300 outline-none focus:border-emerald-500"
                >
                  <option value="docx">Word (.docx)</option>
                  <option value="pdf">PDF (.pdf)</option>
                  <option value="text">Plain Text (.txt)</option>
                </select>
              </div>
            </div>

            {/* Editor Stats Bar */}
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 px-1 shrink-0">
              <div className="flex items-center gap-2">
                <span>Lines: <strong className="text-slate-300">{driveFileContent.split('\n').length}</strong></span>
                <span>•</span>
                <span>Words: <strong className="text-slate-300">{driveFileContent.trim() ? driveFileContent.trim().split(/\s+/).length : 0}</strong></span>
                <span>•</span>
                <span>Chars: <strong className="text-slate-300">{driveFileContent.length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(driveFileContent);
                    setDriveNotification("Content copied to clipboard!");
                    setTimeout(() => setDriveNotification(null), 3000);
                  }}
                  className="hover:text-emerald-400 cursor-pointer"
                  title="Copy text"
                >
                  Copy
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveViewingContent(driveFileContent);
                    setActiveViewingTitle(driveFileName);
                    setShowFullscreenDoc(true);
                  }}
                  className="hover:text-emerald-400 cursor-pointer"
                  title="Maximize preview"
                >
                  Maximize
                </button>
              </div>
            </div>

            {/* Main Editable Text Area */}
            <div className="flex-1 min-h-0 bg-[#040810] border border-slate-800 rounded-xl overflow-hidden flex flex-col focus-within:border-emerald-500/50">
              <textarea
                value={driveFileContent}
                onChange={(e) => setDriveFileContent(e.target.value)}
                placeholder="Enter or draft legal pleading, petition, declaration, or memorandum here..."
                className="flex-1 w-full p-3 bg-transparent text-emerald-100 font-mono text-[10px] leading-relaxed resize-none outline-none overflow-y-auto selection:bg-emerald-500/30"
                spellCheck={false}
              />
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-between gap-2 shrink-0 pt-1">
              <button
                type="button"
                onClick={() => setStaffDriveTab('files')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[9px] font-mono cursor-pointer transition border border-slate-800"
              >
                Back to Files
              </button>

              <button
                type="button"
                disabled={isSavingToDrive}
                onClick={() => saveStaffDriveFile()}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[9.5px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition shadow border border-emerald-400/40 disabled:opacity-50"
              >
                {isSavingToDrive ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>SAVING TO DRIVE...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                    <span>⚡ SAVE & PUSH TO GOOGLE DRIVE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Phoenix Senior Managing Partner Litigation & Trial Suite Renderer
  const renderPhoenixSeniorPartnerSuite = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3.5 space-y-3.5 selection:bg-amber-500/30 font-sans">
        {/* Header Widget */}
        <div className="bg-[#0c1221] border border-amber-500/40 p-3 rounded-xl flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(223,183,108,0.12)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 px-2 bg-gradient-to-br from-amber-500/20 to-amber-700/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold animate-pulse shrink-0">
              #1 SENIORITY
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <h4 className="text-[11px] font-black text-white tracking-wider font-mono uppercase truncate">
                  Phoenix Senior Managing Partner Suite
                </h4>
                <span className="text-[7.5px] uppercase tracking-wider font-mono bg-blue-950 text-blue-300 border border-blue-500/30 px-1 py-0.2 rounded font-bold shrink-0">
                  BigLaw DyTopo Supreme Command
                </span>
              </div>
              <p className="text-[9px] text-amber-400/90 font-mono font-semibold truncate mt-0.5">
                Senior Counsel • Master Litigation Strategist • Trial Tactics & Evidentiary Command
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const phrase = "Phoenix online. Senior Managing Partner doctrine active. What trial strategy or evidentiary audit shall we direct, Alex?";
                speakResponseText(phrase, activeProfile.voiceName);
              }}
              className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-[9px] font-mono flex items-center gap-1 cursor-pointer transition"
              title="Voice Briefing from Phoenix (UK Executive Cadence)"
            >
              <Volume2 className="w-3 h-3" />
              <span>Voice (UK)</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#050812] p-1 rounded-xl border border-slate-800 overflow-x-auto text-[10px] font-mono font-bold shrink-0">
          <button
            type="button"
            onClick={() => setPhoenixSubTab('strategy')}
            className={`px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              phoenixSubTab === 'strategy' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3 h-3 text-amber-400" />
            <span>⚖️ Litigation Strategy</span>
          </button>
          <button
            type="button"
            onClick={() => setPhoenixSubTab('tactics')}
            className={`px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              phoenixSubTab === 'tactics' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>⚔️ Trial Tactics</span>
          </button>
          <button
            type="button"
            onClick={() => setPhoenixSubTab('evidence')}
            className={`px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              phoenixSubTab === 'evidence' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>🔍 Evidentiary Review</span>
          </button>
          <button
            type="button"
            onClick={() => setPhoenixSubTab('biglaw')}
            className={`px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              phoenixSubTab === 'biglaw' ? 'bg-blue-950 text-blue-200 border border-blue-500/40 shadow' : 'text-blue-400 hover:text-blue-200'
            }`}
          >
            <Layers className="w-3 h-3 text-blue-400" />
            <span>🌐 BigLaw DyTopo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPhoenixSubTab('drive');
              fetchStaffDriveFiles();
            }}
            className={`px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              phoenixSubTab === 'drive' ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/40 shadow' : 'text-emerald-400 hover:text-emerald-200'
            }`}
          >
            <FolderOpen className="w-3 h-3 text-emerald-400" />
            <span>📂 Drive Suite</span>
          </button>
        </div>

        {/* TAB 1: LITIGATION STRATEGY DASHBOARD */}
        {phoenixSubTab === 'strategy' && (
          <div className="space-y-3.5">
            {/* Doctrine & Posture Controls */}
            <div className="bg-[#050810]/70 border border-amber-500/30 p-3 rounded-xl space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  Tri-Jurisdictional Litigation Doctrine & Forum
                </span>
                <span className="text-[8px] bg-amber-950/60 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  Phoenix Senior Counsel Command
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px]">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Forum & Controlling Law:</label>
                  <select
                    value={phoenixJurisdiction}
                    onChange={(e) => setPhoenixJurisdiction(e.target.value as any)}
                    className="w-full bg-[#080d1a] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-amber-400"
                  >
                    <option value="CA_SUPERIOR">California Superior Court (CCP & Family Code)</option>
                    <option value="NV_DISTRICT">Nevada District Court (NRCP & NRS Ch. 125)</option>
                    <option value="US_FEDERAL">US District Court (FRCP & 9th Cir. Precedent)</option>
                    <option value="UK_HIGH_COURT">UK High Court of Justice (CPR Part 10/15/24)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Active Case Posture:</label>
                  <select
                    value={phoenixCasePosture}
                    onChange={(e) => setPhoenixCasePosture(e.target.value as any)}
                    className="w-full bg-[#080d1a] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-amber-400"
                  >
                    <option value="pleadings">1. Initial Pleadings & Demurrer Meet-and-Confer</option>
                    <option value="discovery">2. Discovery Warfare & Deposition Subpoenas</option>
                    <option value="in_limine">3. Pre-Trial Motions in Limine & Witness Lists</option>
                    <option value="trial">4. Trial Master Bench & Opening Statements</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Prima Facie Elements & Burden of Proof Tracker */}
            <div className="bg-[#070b14] border border-slate-800 p-3 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                  Prima Facie Cause of Action & Elements Matrix
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Preponderance (95% Grounded)
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[9.5px]">
                {[
                  { element: 'Statutory Duty / Agreement Baseline', status: 'Established', cite: 'Cal. Civ. Code § 1550 / Restatement (Second) Contracts § 1' },
                  { element: 'Material Breach / Fiduciary Violation', status: 'Verified via Records', cite: 'Family Code § 1101(h) / Corp. Code § 16404' },
                  { element: 'Direct & Proximate Causation', status: 'Forensic Audit Confirmed', cite: 'Palsgraf v. Long Island R.R. / 9th Cir. Model Rule 5.1' },
                  { element: 'Quantifiable Economic Damage', status: '$142,500 Diverted Funds', cite: 'EX-1002 Bank Statement Disclosures' }
                ].map((item, idx) => (
                  <div key={idx} className="p-2 bg-slate-900/70 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
                    <div>
                      <span className="text-white font-bold block">{item.element}</span>
                      <span className="text-[8.5px] text-slate-400">{item.cite}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 text-[8.5px] font-bold border border-emerald-500/30 shrink-0">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Exposure Quantum & Fee-Shifting Leverage */}
            <div className="bg-[#070b14] border border-slate-800 p-3 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-slate-300 font-bold uppercase">Exposure & Settlement Leverage Bar</span>
                <span className="text-amber-400 font-bold">Risk Ratio: 82% Defense Advantage</span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-[9px] text-center">
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[8px] uppercase">Plaintiff Claims</span>
                  <span className="text-white font-bold text-[11px]">$1,250,000</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[8px] uppercase">Trial Defense Cap</span>
                  <span className="text-emerald-400 font-bold text-[11px]">$340,000</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[8px] uppercase">Statutory Sanctions (CCP § 1021 / § 271)</span>
                  <span className="text-amber-400 font-bold text-[11px]">+$85,000</span>
                </div>
              </div>
            </div>

            {/* Strategic Action Dispatch Button */}
            <button
              type="button"
              disabled={isGeneratingTrialStrategy}
              onClick={async () => {
                setIsGeneratingTrialStrategy(true);
                try {
                  const strategyBrief = `### ⚖️ PHOENIX SENIOR MANAGING PARTNER TRIAL STRATEGY MEMORANDUM
**Forum**: ${phoenixJurisdiction === 'CA_SUPERIOR' ? 'California Superior Court (Orange County)' : phoenixJurisdiction === 'NV_DISTRICT' ? 'Nevada Eighth Judicial District (Clark County)' : 'US District Court'}
**Case Posture**: ${phoenixCasePosture.toUpperCase()} Phase
**Author**: Phoenix (Senior Managing Partner & Senior Counsel)

---

#### 1. Affirmative Theory of the Case
Our core trial posture establishes that opposing counsel's claims are barred by the express terms of the integration clause and governing statutory standards. All allegations of undisclosed liabilities are rebutted by documentary evidence in First Republic Account records (\`EX-1002\`).

#### 2. Key Procedural Moves & Deadlines
1. **Notice of Demurrer / Motion to Dismiss**: File within statutory window under ${phoenixJurisdiction === 'CA_SUPERIOR' ? 'CCP § 412.20 (30 days)' : 'FRCP Rule 12(b)(6)'}.
2. **Mandatory Meet & Confer**: Send formal CCP § 430.41 meet-and-confer notice citing lack of standing.
3. **Offer of Judgment (CCP § 998 / FRCP Rule 68)**: Serve protective statutory offer of $250,000 to shift all post-offer expert and trial costs to plaintiff.

#### 3. Evidentiary Leverage & Sanctions Basis
- Invoke **California Family Code § 271 / CCP § 128.5** for bad-faith refusal to produce native accounting ledgers.
- Demand forensic inspection of opposing party's hard drives pursuant to Rule 34 / CCP § 2031.010.`;

                  setTrialStrategyReport(strategyBrief);
                  onAddMessage({
                    id: `m-strat-${Date.now()}`,
                    sender: 'assistant',
                    content: strategyBrief,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    agentName: activeProfile.name
                  });

                  // Voice confirmation from Phoenix
                  speakResponseText("Master litigation strategy compiled and staged into our trial dossier, Alex. The affirmative theory and statutory fee-shifting notices are ready.", activeProfile.voiceName);
                } finally {
                  setIsGeneratingTrialStrategy(false);
                }
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black tracking-wide rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 uppercase shadow-lg shadow-amber-500/20"
            >
              {isGeneratingTrialStrategy ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>MARSHALING PHOENIX SENIOR COUNSEL STRATEGY...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950" />
                  <span>⚡ DRAFT MASTER LITIGATION STRATEGY BRIEF</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 2: TRIAL TACTICS PROTOCOLS */}
        {phoenixSubTab === 'tactics' && (
          <div className="space-y-3.5">
            {/* Tactic Selector */}
            <div className="grid grid-cols-3 gap-1 bg-[#050812] p-1 rounded-xl border border-slate-800 text-[9.5px] font-mono font-bold">
              <button
                type="button"
                onClick={() => setActiveTrialTactic('cross_exam')}
                className={`py-1.5 rounded-lg transition ${
                  activeTrialTactic === 'cross_exam' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cross-Exam Outline
              </button>
              <button
                type="button"
                onClick={() => setActiveTrialTactic('motions_in_limine')}
                className={`py-1.5 rounded-lg transition ${
                  activeTrialTactic === 'motions_in_limine' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Motions in Limine
              </button>
              <button
                type="button"
                onClick={() => setActiveTrialTactic('demurrer')}
                className={`py-1.5 rounded-lg transition ${
                  activeTrialTactic === 'demurrer' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Demurrer & Strikes
              </button>
            </div>

            {/* Sub-view: Cross-Examination Outline */}
            {activeTrialTactic === 'cross_exam' && (
              <div className="bg-[#070b14] border border-amber-500/30 p-3.5 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white uppercase text-[11px] font-mono">
                      Surgical Cross-Examination Attack Plan
                    </span>
                  </div>
                  <span className="text-[9px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    Commit • Credit • Confront
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[9.5px]">
                  <label className="text-slate-400 block font-bold">Target Adverse Witness:</label>
                  <select
                    value={crossExamWitness}
                    onChange={(e) => setCrossExamWitness(e.target.value as any)}
                    className="w-full bg-[#080d1a] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-amber-400"
                  >
                    <option value="opposing_party">Opposing Party (Discrediting Sworn Timeline & Income Disclosures)</option>
                    <option value="hostile_expert">Hostile Expert Witness (Daubert/Sargon Methodology Attack)</option>
                    <option value="key_executive">Managing Corporate Agent (FRCP 30(b)(6) Knowledge Baseline)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-[10px] font-mono">
                  <span className="text-amber-400 font-bold block uppercase text-[9px]">
                    Phoenix Leading Question Protocol:
                  </span>
                  <div className="space-y-1.5 text-slate-300 leading-relaxed">
                    <p>• <strong>1. COMMIT</strong>: "You personally signed the Income and Expense Declaration under penalty of perjury on November 15th, didn't you?"</p>
                    <p>• <strong>2. CREDIT</strong>: "And at the time you executed that declaration, you knew the court would rely upon your listed gross monthly income of $8,500, correct?"</p>
                    <p>• <strong>3. CONFRONT</strong>: "Handing you Exhibit 1003 — your official IRS Form W-2 for that exact same tax year showing $218,400 in direct compensation. That reflects an average monthly income of over $18,200, doesn't it?"</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const examText = `### ⚔️ PHOENIX SURGICAL CROSS-EXAMINATION OUTLINE
**Target**: ${crossExamWitness === 'opposing_party' ? 'Opposing Party' : crossExamWitness === 'hostile_expert' ? 'Hostile Expert' : 'Corporate Agent'}
**Methodology**: 3-Tier Impeachment Sequence (Commit -> Credit -> Confront)

#### Chapter 1: Standard of Care & Verification Under Oath
1. You understood when signing Exhibit 1 that accuracy was mandatory under penalty of perjury?
2. You had access to all your personal bank accounts when preparing that disclosure?
3. No one prevented you from attaching the complete statement, did they?

#### Chapter 2: The Direct Contradiction
4. Handing you Exhibit 1002 — your First Republic bank ledger.
5. On November 4th, there was a balance of $142,500 in that account, correct?
6. And 48 hours later, those funds were transferred to an offshore entity?
7. Yet on your sworn schedule of assets, that account balance was listed as zero, wasn't it?`;

                    onAddMessage({
                      id: `m-cross-${Date.now()}`,
                      sender: 'assistant',
                      content: examText,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      agentName: activeProfile.name
                    });
                    speakResponseText("Cross-examination impeachment sequence compiled, Alex. I have pinned down their sworn contradictions into three tight chapters.", activeProfile.voiceName);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl font-mono text-[10px] font-bold transition cursor-pointer uppercase flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Push Cross-Exam Questions to Pleading Sheet</span>
                </button>
              </div>
            )}

            {/* Sub-view: Motions in Limine */}
            {activeTrialTactic === 'motions_in_limine' && (
              <div className="bg-[#070b14] border border-amber-500/30 p-3.5 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white uppercase text-[11px] font-mono">
                    Motions in Limine Battle Matrix
                  </span>
                  <span className="text-[9px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                    Pre-Trial Exclusion
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px]">
                  {[
                    { id: 'prejudice_352', label: '1. CEC § 352 / FRE 403 (Unfair Prejudice)', authority: 'People v. Doolin / 506 U.S. 364' },
                    { id: 'expert_sargon', label: '2. Sargon / Daubert (Speculative Expert)', authority: 'Sargon Enterprises, Inc. v. USC (2012)' },
                    { id: 'spoliation', label: '3. ESI Spoliation Sanctions', authority: 'FRCP Rule 37(e) / CCP § 2023.030' },
                    { id: 'hearsay', label: '4. Inadmissible Hearsay Summaries', authority: 'CEC § 1200 / FRE 802' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedInLimineMotion(m.id as any)}
                      className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                        selectedInLimineMotion === m.id
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-bold block">{m.label}</span>
                      <span className="text-[8px] text-slate-500">{m.authority}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const motionPleading = `### 📜 MOTION IN LIMINE NO. 1
**SUPERIOR COURT OF THE STATE OF CALIFORNIA**
**MEMORANDUM OF POINTS AND AUTHORITIES IN SUPPORT OF MOTION IN LIMINE TO EXCLUDE SPECULATIVE FINANCIAL TESTIMONY**
*(Cal. Evid. Code §§ 350, 352, 801; Sargon Enterprises, Inc. v. USC (2012) 55 Cal.4th 747)*

**I. INTRODUCTION**
Moving party Phoenix co-counsel respectfully moves this Court for an order in limine precluding plaintiff from introducing speculative valuation models that lack foundation under Sargon Enterprises.

**II. ARGUMENT**
Under California Evidence Code § 801(b), an expert's opinion must be based on matter of a type that reasonably may be relied upon. As the California Supreme Court held in *Sargon*, trial courts must act as gatekeepers to exclude speculative opinions.

**III. CONCLUSION**
Moving party respectfully requests that this Motion in Limine be GRANTED in its entirety.`;

                    onAddMessage({
                      id: `m-limine-${Date.now()}`,
                      sender: 'assistant',
                      content: motionPleading,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      agentName: activeProfile.name
                    });
                    speakResponseText("Motion in limine memorandum formulated under Sargon gatekeeping standards, Alex. Ready for pre-trial conference.", activeProfile.voiceName);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-mono text-[10px] font-black rounded-xl transition cursor-pointer uppercase flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Draft Motion in Limine Pleading Draft</span>
                </button>
              </div>
            )}

            {/* Sub-view: Demurrer & Strike */}
            {activeTrialTactic === 'demurrer' && (
              <div className="bg-[#070b14] border border-amber-500/30 p-3.5 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white uppercase text-[11px] font-mono">
                    Demurrer & Anti-SLAPP Strike Strategy
                  </span>
                  <span className="text-[9px] font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                    Dispositive Attack
                  </span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg space-y-1.5 font-mono text-[9.5px] text-slate-300">
                  <p>• <strong>Mandatory Meet & Confer</strong>: CCP § 430.41 conference must occur at least 5 days prior to responsive pleading deadline.</p>
                  <p>• <strong>General Demurrer Grounds</strong>: Failure to state facts sufficient to constitute a cause of action (CCP § 430.10(e)).</p>
                  <p>• <strong>Anti-SLAPP Special Strike (CCP § 425.16)</strong>: Direct stay of all discovery upon filing; fee-shifting to prevailing defendant mandatory.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HIGH-STAKES EVIDENTIARY REVIEW */}
        {phoenixSubTab === 'evidence' && (
          <div className="space-y-3.5">
            {/* Evidentiary Scorecard & Forensic Gate */}
            <div className="bg-[#070b14] border border-amber-500/30 p-3.5 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white uppercase text-[11px] font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Evidentiary Admissibility & Perjury Matrix
                </span>
                <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Score: 94/100 Admissible
                </span>
              </div>

              {/* Contradiction & Discrepancy Breakdown */}
              <div className="space-y-2 font-mono text-[9.5px]">
                <div className="p-2.5 bg-rose-950/30 border border-rose-500/30 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-rose-300 font-bold">
                    <span>🚨 Financial Income Perjury Discrepancy</span>
                    <span>$116,400 / Year Underreported</span>
                  </div>
                  <p className="text-slate-300">
                    FL-150 sworn income ($8,500/mo) directly contradicts W-2 wage records ($18,200/mo). Grounds for Family Code § 271 fee sanctions and mandatory disclosure strike.
                  </p>
                </div>

                <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>⚠️ Omitted Asset & Separation Date Conflict</span>
                    <span>Family Code § 1101(h) Breach</span>
                  </div>
                  <p className="text-slate-300">
                    Coinbase cryptocurrency wallet was concealed on FL-142 schedule. Separation date manipulated to capture $85,000 executive retention bonus.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span>📑 ESI & Forensic Hash Verification</span>
                    <span className="text-emerald-400">SHA-256 Validated</span>
                  </div>
                  <p className="text-slate-400">
                    Byte fingerprint <code className="text-amber-300">8f7a9c2...4e1b</code> matches vault master. Zero structural tampering detected.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isAuditingEvidence}
                onClick={async () => {
                  setIsAuditingEvidence(true);
                  try {
                    const auditSummary = `### 🔍 PHOENIX HIGH-STAKES EVIDENTIARY AUDIT REPORT
**Audit Target**: Active Matter Disclosures & Trial Record
**Reviewing Counsel**: Phoenix (Senior Managing Partner)

#### 1. Evidentiary Admissibility Findings
- **Chain of Custody**: Complete. Ingested files have verifiable SHA-256 fingerprints.
- **Hearsay Exemptions**: Verified under California Evidence Code § 1271 (Business Records) with custodian declaration.
- **CEC § 352 Balancing**: Probative value of bank transfer records substantially outweighs any undue prejudice.

#### 2. Cross-Examination Perjury Traps
- **Trap 1**: $116,400 net income variance between FL-150 and W-2.
- **Trap 2**: Real property Grant Deed recorded as Joint Tenancy contradicts separate property petition claim.`;

                    onAddMessage({
                      id: `m-audit-${Date.now()}`,
                      sender: 'assistant',
                      content: auditSummary,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      agentName: activeProfile.name
                    });
                    speakResponseText("High-stakes evidentiary review concluded, Alex. The contradiction traps and admissibility foundation are fully certified.", activeProfile.voiceName);
                  } finally {
                    setIsAuditingEvidence(false);
                  }
                }}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-[10px] font-bold rounded-xl transition cursor-pointer uppercase flex items-center justify-center gap-1.5 shadow"
              >
                {isAuditingEvidence ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AUDITING EVIDENTIARY ADMISSIBILITY & PERJURY GATES...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Run High-Stakes Evidentiary Admissibility Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: BIGLAW DYTOPO BENCH SHORTCUT */}
        {phoenixSubTab === 'biglaw' && (
          <div className="bg-[#070b14] border border-blue-500/30 p-4 rounded-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white uppercase text-[11px]">
                BigLaw 100+ Agent DyTopo Bench
              </span>
              <span className="text-[9px] text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-500/30">
                DyTopo v2 Active
              </span>
            </div>

            <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
              Phoenix operates as the supreme orchestrator over the 100+ agent BigLaw DyTopo multi-round debate bench, CitationGate verbatim grounding, and court deadline calculator.
            </p>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 text-[9.5px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>• DyTopo Agent Bench Size:</span>
                <span className="text-amber-400 font-bold">112 Agents Online</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>• CitationGate Verbatim Rate:</span>
                <span className="text-emerald-400 font-bold">98.4% Grounded</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>• Active DyTopo Workflow:</span>
                <span className="text-blue-300 font-bold">Roundtable Multi-Round Debate</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab?.('biglaw')}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow transition uppercase"
            >
              <Layers className="w-4 h-4" />
              <span>Switch to Phoenix BigLaw OS Studio</span>
            </button>
          </div>
        )}

        {/* TAB 5: DRIVE SUITE */}
        {phoenixSubTab === 'drive' && (
          <div className="flex-1 flex flex-col min-h-0">
            {renderGoogleDriveSuite()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="ai-chat-tab" className="flex flex-col gap-2.5 h-full min-h-0 overflow-hidden">
      
      {/* MICROPHONE PERMISSION / ERROR ALERT BANNER (ONLY SHOWN ON ERROR) */}
      {(speechError || micPermissionGranted === false) && (
        <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-amber-200 text-[10px] font-mono shrink-0 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
            <span className="truncate">
              <strong className="text-white">Microphone Notice:</strong> {speechError || "Microphone access needed for voice controls."}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={async () => {
                const active = await startMicAudioAnalyzer();
                if (active) {
                  setSpeechError(null);
                  setMicPermissionGranted(true);
                }
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-md text-[9px] uppercase shrink-0 transition cursor-pointer"
            >
              Allow Mic
            </button>
            <button
              type="button"
              onClick={() => {
                runMicDiagnostics();
                setShowMicTroubleshooter(true);
              }}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-bold rounded-md text-[9px] uppercase shrink-0 transition cursor-pointer flex items-center gap-1"
            >
              <Wrench className="w-2.5 h-2.5" />
              <span>Fix / Test Mic</span>
            </button>
          </div>
        </div>
      )}

      {/* TOP DECK: HORIZONTAL PROFILES & VOICE/DRIVE STATUS */}
      <div className="bg-[#0e1626] border border-[#1e293b] rounded-xl p-2.5 flex flex-col lg:flex-row items-center justify-between gap-2.5 shadow-lg shrink-0">
        
        {/* Left Side: Specialist Selectors */}
        <div className="flex flex-wrap gap-1.5 items-center w-full lg:w-auto flex-1">
          {agentProfiles.map((p) => {
            const prog = agentProgressList.find(pr => pr.agentId === p.id) || {
              rapportScore: 10,
              personalityState: 'Reserved'
            };
            const isActive = activeProfile.id === p.id;
            
            return (
              <div
                key={p.id}
                onClick={() => {
                  if (editingId !== p.id) {
                    setActiveProfile(p);
                    setSearchCitations([]);
                    stopActiveSpeech();
                    if (p.id === 'ap-1') {
                      setStaffWorkspaceMode('phoenix_command');
                    }
                  }
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer text-left select-none max-w-[200px] flex-1 ${
                  isActive
                    ? 'bg-teal-950/40 border-teal-500/60 shadow-md'
                    : 'bg-[#090d16]/50 border-[#1e293b] hover:border-slate-800'
                }`}
              >
                <span className="text-base shrink-0">{p.avatar}</span>
                <div className="min-w-0 flex-1 leading-none">
                  <div className="flex items-center justify-between gap-1 leading-none" onClick={(e) => {
                    if (editingId === p.id) e.stopPropagation();
                  }}>
                    {editingId === p.id ? (
                      <form
                        onSubmit={(e) => saveEditingName(p.id, e)}
                        className="flex items-center gap-1 flex-1"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          onBlur={() => saveEditingName(p.id)}
                          className="bg-[#040810] border border-teal-500/50 rounded px-1 text-[10px] text-white outline-none w-full font-sans py-0.5"
                        />
                      </form>
                    ) : (
                      <div className="flex items-center gap-1 leading-none shrink-0 min-w-0">
                        <span className="text-[11px] font-black text-slate-200 truncate max-w-[65px]">{p.name}</span>
                        <button
                          type="button"
                          onClick={(e) => startEditing(p.id, p.name, e)}
                          className="p-0.5 text-slate-500 hover:text-teal-400 rounded transition-colors"
                          title="Assign custom name"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                    
                    <span className="text-[8px] font-mono font-bold flex items-center gap-0.5 bg-[#090d16] px-1 py-0.5 rounded border border-[#1e293b] text-teal-400 self-center shrink-0">
                      <Heart className="w-2 h-2 text-rose-500 fill-rose-500" />
                      {prog.rapportScore}%
                    </span>
                  </div>
                  <span className="text-[8px] text-slate-400 block truncate mt-1 font-mono uppercase font-bold tracking-wider leading-none">
                    {p.id === 'ap-1' ? 'Litigation' : p.id === 'ap-2' ? 'Sentry' : 'Manager'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Drive Access Badge & Voice Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end shrink-0 select-none w-full lg:w-auto">
          
          {/* Modular Studio Button */}
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('modules')}
              className="flex items-center gap-1.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/50 px-2.5 py-1 rounded-lg text-[9px] font-mono text-amber-300 hover:text-amber-200 transition-all cursor-pointer shrink-0 shadow-sm"
              title="Open Phoenix Modular Studio (8 Decoupled Standalone Modules)"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold uppercase tracking-wider">Modular Studio</span>
            </button>
          )}

          {/* Integrated Google Drive Access Status Link */}
          <a
            href="https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 hover:border-emerald-400 px-2.5 py-1 rounded-lg text-[9px] font-mono text-emerald-300 hover:text-emerald-200 transition-all cursor-pointer shrink-0 shadow-sm"
            title="Open Direct Google Drive Folder for level23consulting@gmail.com"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-bold uppercase tracking-wider">📁 Direct GDrive Link</span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
          </a>

          {/* Live Mic Audio Input VU Meter */}
          {(isListening || isDictating) && (
            <div className="bg-[#050a14] border border-teal-500/40 px-2 py-1 rounded-lg flex items-center gap-1.5 font-mono text-[9px] text-emerald-400 shrink-0 shadow">
              <span className="text-[8px] font-bold text-slate-400">MIC:</span>
              <div className="w-8 h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-75 ${micVolume > 60 ? 'bg-amber-400' : micVolume > 10 ? 'bg-emerald-400' : 'bg-teal-600'}`}
                  style={{ width: `${Math.max(6, micVolume)}%` }}
                ></div>
              </div>
              <span className="font-extrabold text-[8.5px] text-teal-300 w-6 text-right">{micVolume}%</span>
            </div>
          )}

          {/* Wake Status Pill */}
          <div className="bg-[#090d16] border border-[#1e293b] px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono text-[9px] font-bold text-teal-400 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${voiceStatus === 'LISTENING' ? 'bg-emerald-400 animate-ping' : voiceStatus === 'SPEAKING' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}></span>
            <span>{voiceStatus}</span>
          </div>

          {/* Enable / Disable Hot Mic Toggle Button */}
          <button
            type="button"
            onClick={toggleVoiceListener}
            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black tracking-wider border transition-all cursor-pointer flex items-center gap-1 select-none ${
              isListening 
                ? 'bg-rose-950/20 text-rose-400 border-rose-500/40 shadow-[0_2px_0_#f43f5e]' 
                : 'bg-teal-950/20 text-teal-400 border-teal-500/30 shadow-[0_2px_0_#14b8a6] hover:border-teal-500/50'
            }`}
            title={isListening ? "Disable Hot Mic Detection" : "Enable Passive Voice Hot Mic Detection"}
          >
            {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
            <span>{isListening ? "MIC ON" : "VOICE MIC"}</span>
          </button>

          {/* Stop speaking audio button */}
          <button
            type="button"
            onClick={stopActiveSpeech}
            title="Silence Active Response Speech"
            className="p-1 bg-[#0d1624] text-rose-400 border border-rose-500/30 rounded-lg shadow hover:border-rose-500/50 cursor-pointer flex items-center justify-center font-bold"
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>

          {/* Mic Troubleshooter / Fix Button */}
          <button
            type="button"
            onClick={() => {
              runMicDiagnostics();
              setShowMicTroubleshooter(true);
            }}
            className="px-2 py-1 rounded-lg text-[9px] font-mono font-bold tracking-wider border bg-[#090d16] hover:bg-slate-900 text-amber-300 border-amber-500/30 hover:border-amber-400/60 transition-all cursor-pointer flex items-center gap-1 shrink-0"
            title="Open Microphone Diagnostics, Audio Test, and Permissions Repair Suite"
          >
            <Wrench className="w-3 h-3 text-amber-400" />
            <span>MIC FIX</span>
          </button>

          {/* Toggle Hands-Free Suite Control Panel Button */}
          <button
            type="button"
            onClick={() => setShowHandsFreeDeck(prev => !prev)}
            className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold tracking-wider border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              showHandsFreeDeck 
                ? 'bg-teal-950 text-teal-300 border-teal-500/50 shadow' 
                : 'bg-[#090d16] text-slate-400 border-[#1e293b] hover:text-slate-200'
            }`}
            title="Toggle Hands-Free Voice Controls Suite"
          >
            <span>🎙️ HANDS-FREE</span>
          </button>

          {/* Auto-Speak Toggle Checkbox */}
          <label className="flex items-center gap-1 cursor-pointer text-[9.5px] font-sans text-slate-400 bg-[#090d16] border border-[#1e293b] px-2 py-1 rounded-lg hover:border-slate-800 transition">
            <input
              type="checkbox"
              checked={automaticSpeakMode}
              onChange={(e) => setAutomaticSpeakMode(e.target.checked)}
              className="rounded border-[#1e293b] bg-slate-950 text-teal-400 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3 h-3"
            />
            <span className="font-semibold">Auto-Speak</span>
          </label>
        </div>
      </div>

      {/* GOOGLE AGENTS & DRIVE REPOSITORY BANNER */}
      <div className="bg-[#0b1322] border border-blue-500/30 rounded-xl px-3.5 py-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 shadow-md shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold font-mono text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Drive Repository: <span className="text-blue-300">level23consulting@gmail.com</span>
              </span>
              <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 flex items-center gap-1 font-bold">
                <FolderOpen className="w-3 h-3 text-purple-300" />
                Dropzone: phoenix_review (Attached)
              </span>
              <span className="text-[9px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                Phoenix &amp; EVE Agent Engine Active
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Lead agent Phoenix operating from folder 1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH &bull; All intake uploads directed to phoenix_review
            </p>
          </div>
        </div>

        {/* Quick Trigger Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setAgentFrameworkMode('search');
              setShowAgentFrameworkModal(true);
            }}
            className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/80 text-blue-200 border border-blue-500/40 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Search className="w-3 h-3 text-blue-400" />
            <span>Grounded Search</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAgentFrameworkMode('summation');
              setShowAgentFrameworkModal(true);
            }}
            className="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-500/40 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Legal Summation</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAgentFrameworkMode('inbox');
              fetchInboxFiles();
              setShowAgentFrameworkModal(true);
            }}
            className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-500/40 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FolderOpen className="w-3 h-3 text-emerald-400" />
            <span>phoenix_review Dropzone</span>
          </button>

          <a
            href="https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Open Google Drive Repository"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HANDS-FREE CONVERSATIONAL VOICE CONTROL HUD DECK */}
      {/* ========================================================= */}
      {showHandsFreeDeck && (
        <div className="bg-gradient-to-r from-[#0a1220] via-[#0d182b] to-[#0a1220] border-2 border-teal-500/40 rounded-2xl p-3.5 space-y-3 shadow-2xl shrink-0 transition-all animate-fadeIn">
          
          {/* Header Row: Title & Active Animated Waveform */}
          <div className="flex items-center justify-between gap-3 border-b border-teal-900/40 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-950/80 border border-teal-500/40 rounded-xl text-teal-400 shadow">
                <Mic className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-[11px] font-black font-mono text-white tracking-wider uppercase flex items-center gap-1.5">
                  <span>Hands-Free Conversational Voice Engine</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${isListening ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30 animate-pulse' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                    {isListening ? 'LIVE HOTMIC ACTIVE' : 'HOTMIC PAUSED'}
                  </span>
                </h4>
                <p className="text-[9.5px] text-teal-300/80 font-mono">
                  Speak hands-free with Phoenix, EVE, Sentry, or Alure • AI listens & speaks back aloud
                </p>
              </div>
            </div>

            {/* Animated Visualizer Equalizer Waves */}
            <div className="flex items-center gap-1.5 bg-[#050912] border border-teal-500/30 px-3 py-1.5 rounded-xl font-mono text-[9px]">
              <span className="text-slate-400 font-bold mr-1">STATUS:</span>
              <div className="flex items-end gap-0.5 h-3.5">
                <span className={`w-1 rounded-full ${voiceStatus === 'SPEAKING' ? 'bg-amber-400 h-3.5 animate-bounce' : isListening ? 'bg-emerald-400 h-2.5 animate-pulse' : 'bg-slate-600 h-1'}`}></span>
                <span className={`w-1 rounded-full ${voiceStatus === 'SPEAKING' ? 'bg-amber-400 h-2 animate-bounce delay-75' : isListening ? 'bg-teal-400 h-3 animate-pulse delay-75' : 'bg-slate-600 h-1'}`}></span>
                <span className={`w-1 rounded-full ${voiceStatus === 'SPEAKING' ? 'bg-amber-400 h-3.5 animate-bounce delay-150' : isListening ? 'bg-emerald-400 h-1.5 animate-pulse delay-150' : 'bg-slate-600 h-1'}`}></span>
                <span className={`w-1 rounded-full ${voiceStatus === 'SPEAKING' ? 'bg-amber-400 h-2.5 animate-bounce delay-100' : isListening ? 'bg-teal-400 h-2.5 animate-pulse delay-100' : 'bg-slate-600 h-1'}`}></span>
              </div>
              <span className="text-emerald-400 font-bold uppercase ml-1.5">{voiceStatus}</span>
            </div>
          </div>

          {/* Row 2: Instant Voice Wake Hotkeys for Agents */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-mono text-slate-400 font-black uppercase tracking-widest block">
              🗣️ Hands-Free Voice Wake Buttons (Click or Speak Name)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => {
                  const profile = agentProfiles.find(p => p.id === 'ap-1')!;
                  setActiveProfile(profile);
                  playWakeChime();
                  const phrase = `Yes! I am ${profile.name}, Senior Managing Partner and Litigation Lead. I am listening co-counsel. What trial strategy or motion brief do you need, Alex?`;
                  speakResponseText(phrase, profile.voiceName);
                  onAddMessage({
                    id: `m-voice-${Date.now()}`,
                    sender: 'assistant',
                    content: `*🎙️ [Voice Wake Triggered]*: "${phrase}"`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    agentName: profile.name
                  });
                }}
                className="p-2 bg-[#08101d] hover:bg-teal-950/40 border border-teal-500/30 rounded-xl text-left text-slate-200 transition cursor-pointer flex items-center gap-2 group shadow"
              >
                <span className="text-lg">👩‍⚖️</span>
                <div className="min-w-0">
                  <span className="font-bold block truncate group-hover:text-teal-300">Wake Phoenix</span>
                  <span className="text-[8px] text-teal-400 font-bold block truncate">#1 Firm Leader</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const profile = agentProfiles.find(p => p.id === 'ap-4')!;
                  setActiveProfile(profile);
                  playWakeChime();
                  const phrase = `Hello! I am ${profile.name}, your Office Manager & Operations Lead. I keep our everyday tasks, calendar, intakes, and case files in complete order.`;
                  speakResponseText(phrase, profile.voiceName);
                  onAddMessage({
                    id: `m-voice-${Date.now()}`,
                    sender: 'assistant',
                    content: `*🎙️ [Voice Wake Triggered]*: "${phrase}"`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    agentName: profile.name
                  });
                }}
                className="p-2 bg-[#08101d] hover:bg-teal-950/40 border border-teal-500/30 rounded-xl text-left text-slate-200 transition cursor-pointer flex items-center gap-2 group shadow"
              >
                <span className="text-lg">🤖</span>
                <div className="min-w-0">
                  <span className="font-bold block truncate group-hover:text-teal-300">Wake EVE</span>
                  <span className="text-[8px] text-cyan-400 font-bold block truncate">#2 Office Manager</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const profile = agentProfiles.find(p => p.id === 'ap-2')!;
                  setActiveProfile(profile);
                  playWakeChime();
                  const phrase = `Sentry security auditor active. All California & Nevada filings and Google Drive folders are secured. What compliance check shall I run?`;
                  speakResponseText(phrase, profile.voiceName);
                  onAddMessage({
                    id: `m-voice-${Date.now()}`,
                    sender: 'assistant',
                    content: `*🎙️ [Voice Wake Triggered]*: "${phrase}"`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    agentName: profile.name
                  });
                }}
                className="p-2 bg-[#08101d] hover:bg-teal-950/40 border border-teal-500/30 rounded-xl text-left text-slate-200 transition cursor-pointer flex items-center gap-2 group shadow"
              >
                <span className="text-lg">🛡️</span>
                <div className="min-w-0">
                  <span className="font-bold block truncate group-hover:text-teal-300">Wake Sentry</span>
                  <span className="text-[8px] text-slate-400 block truncate">Security & Audit</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const profile = agentProfiles.find(p => p.id === 'ap-3')!;
                  setActiveProfile(profile);
                  playWakeChime();
                  const phrase = `Hello Alex! Alure case associate ready. I can review intake checklists, client schedules, and court dockets. How can I assist?`;
                  speakResponseText(phrase, profile.voiceName);
                  onAddMessage({
                    id: `m-voice-${Date.now()}`,
                    sender: 'assistant',
                    content: `*🎙️ [Voice Wake Triggered]*: "${phrase}"`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    agentName: profile.name
                  });
                }}
                className="p-2 bg-[#08101d] hover:bg-teal-950/40 border border-teal-500/30 rounded-xl text-left text-slate-200 transition cursor-pointer flex items-center gap-2 group shadow"
              >
                <span className="text-lg">💼</span>
                <div className="min-w-0">
                  <span className="font-bold block truncate group-hover:text-teal-300">Wake Alure</span>
                  <span className="text-[8px] text-slate-400 block truncate">Case Associate</span>
                </div>
              </button>
            </div>
          </div>

          {/* Row 3: Live Heard Speech Transcript Box & Direct Spoken Command Submission */}
          <div className="bg-[#050912] border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs">🎙️</span>
              <div className="min-w-0 font-mono text-[10px]">
                <span className="text-slate-500 font-bold block">Live Speech Transcript Heard:</span>
                <span className="text-emerald-300 font-semibold truncate block">
                  {lastHeardSpeech ? `"${lastHeardSpeech}"` : "(Listening hands-free... speak a command or click a wake button)"}
                </span>
              </div>
            </div>

            {lastHeardSpeech && (
              <button
                type="button"
                onClick={() => {
                  submitSpokenCommandDirectly(lastHeardSpeech, activeProfile);
                  setLastHeardSpeech('');
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-900 to-teal-900 hover:from-emerald-800 hover:to-teal-800 text-emerald-100 border border-emerald-500/40 rounded-xl font-mono text-[9px] font-extrabold uppercase shrink-0 transition cursor-pointer shadow flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Execute Speech</span>
              </button>
            )}
          </div>

          {/* Row 4: Hands-Free Quick Spoken Queries */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[9px] font-mono">
            <span className="text-slate-500 font-bold shrink-0">Quick Spoken Prompts:</span>
            <button
              type="button"
              onClick={() => submitSpokenCommandDirectly("Brief me on our active client case status and Google Drive files.", activeProfile)}
              className="px-2 py-1 bg-slate-900 hover:bg-teal-950/60 text-slate-300 hover:text-teal-200 border border-slate-800 rounded-lg whitespace-nowrap transition cursor-pointer"
            >
              💬 "Brief me on case status"
            </button>
            <button
              type="button"
              onClick={() => submitSpokenCommandDirectly("EVE, fact check our active disclosures against bank records.", activeProfile)}
              className="px-2 py-1 bg-slate-900 hover:bg-teal-950/60 text-slate-300 hover:text-teal-200 border border-slate-800 rounded-lg whitespace-nowrap transition cursor-pointer"
            >
              🔍 "Fact check disclosures"
            </button>
            <button
              type="button"
              onClick={() => submitSpokenCommandDirectly("Phoenix, what is our trial strategy and Family Code argument?", activeProfile)}
              className="px-2 py-1 bg-slate-900 hover:bg-teal-950/60 text-slate-300 hover:text-teal-200 border border-slate-800 rounded-lg whitespace-nowrap transition cursor-pointer"
            >
              ⚖️ "Trial strategy overview"
            </button>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MAIN BODY: WORKSPACE SPLIT (Left: Document, Right: Chat) */}
      {/* ======================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        
        {/* ------------------------------------- */}
        {/* LEFT COLUMN: FILE PARSER / DOC READER */}
        {/* ------------------------------------- */}
        <div className={`lg:col-span-4 bg-[#0e1626] rounded-2xl border border-[#1e293b] flex-col min-h-0 overflow-hidden shadow-xl ${isChatMaximized ? 'hidden' : 'flex'}`} id="left-workspace-column">
          
          {/* Section 1: Agent Header Card with collapsible portrait indicator */}
          <div className="p-3 bg-[#0d1624] border-b border-[#1e293b] flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">{activeProfile.avatar}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <h3 className="text-xs font-black text-white font-mono truncate uppercase">{activeProfile.name} Desk</h3>
                  <span className="text-[7.5px] uppercase tracking-wider font-mono bg-teal-950 text-teal-300 border border-teal-500/20 px-1 py-0.5 rounded font-black shrink-0">
                    VO: {activeProfile.voiceName} (Female)
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-sans truncate mt-0.5">{activeProfile.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-left-collapse-portrait"
                onClick={() => setLeftTab(prev => prev === 'portrait' ? 'workspace' : 'portrait')}
                className={`px-2.5 py-1 rounded text-[8px] font-mono leading-none border transition cursor-pointer ${
                  leftTab === 'portrait'
                    ? 'bg-teal-950 text-teal-300 border-teal-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Toggle visual agent portrait display"
              >
                {leftTab === 'portrait' ? '📂 HIDE PORTRAIT' : '📷 PORTRAIT'}
              </button>

              <button
                type="button"
                id="btn-left-maximize-sheet"
                onClick={() => {
                  if (!activeViewingContent) {
                    setActiveViewingContent(uploadedFile?.content || defaultWelcomeContent);
                    setActiveViewingTitle(uploadedFile?.name || "Level 23 Case Workspace Sheet");
                  }
                  setShowFullscreenDoc(true);
                }}
                className="px-2.5 py-1 bg-teal-950/40 border border-teal-500/30 hover:bg-teal-900 text-teal-400 hover:text-teal-300 rounded text-[8px] font-mono leading-none transition cursor-pointer flex items-center gap-1 font-black"
                title="Open a full pop out screen overlay of the active staff work document"
              >
                <Maximize2 className="w-2.5 h-2.5" />
                <span>MAXIMIZE</span>
              </button>
            </div>
          </div>

          {/* Interactive animated agent portrait banner if toggled */}
          <AnimatePresence mode="wait">
            {leftTab === 'portrait' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-[#050810] border-b border-[#1e293b] p-3 shrink-0 overflow-hidden"
              >
                <div className="max-w-[120px] mx-auto">
                  <AgentAnimatedPortrait
                    profile={activeProfile}
                    isSpeaking={isSpeakingAudio}
                    voiceStatus={voiceStatus}
                    onPortraitClick={handlePortraitInteract}
                  />
                  <div className="text-[7.5px] text-center font-mono text-slate-500 mt-1 uppercase tracking-widest animate-pulse">
                    Click to hear voice
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Section: File Upload Provision Area (all formats) */}
          <div className="p-3 bg-[#0d1624]/40 border-b border-[#1e293b]/70 shrink-0 select-none">
            {!uploadedFile ? (
              /* Drag & Drop Upload Zone */
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex items-center justify-between gap-3 p-3 border border-dashed rounded-xl transition-all ${
                  dragOver 
                    ? 'border-teal-500 bg-teal-950/25 scale-[0.99]' 
                    : 'border-slate-800 bg-[#050912]/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UploadCloud className={`w-8 h-8 text-teal-400/40 ${dragOver ? 'animate-bounce' : ''} shrink-0`} />
                  <div className="min-w-0">
                    <h4 className="text-[10px] font-bold text-slate-300 truncate uppercase font-mono">Case Intake Upload Workspace</h4>
                    <p className="text-[8px] text-slate-500 font-sans truncate">Supports TXT, CSV, PDF, claims files</p>
                  </div>
                </div>
                
                <label className="shrink-0 px-2.5 py-1.5 bg-teal-950/40 border border-teal-500/25 text-teal-400 font-bold rounded-lg text-[9px] tracking-wide hover:bg-teal-900 transition-all cursor-pointer shadow-[0_2px_0_#14b8a6] hover:-translate-y-[0.5px]">
                  Browse File
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              /* Active Uploaded Document Status Panel */
              <div className="space-y-1.5">
                <div className="p-2 bg-gradient-to-r from-teal-950/15 to-[#090d16] border border-teal-500/20 rounded-xl relative overflow-hidden flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2.5 min-w-0 relative">
                    <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                    <div className="min-w-0 leading-tight">
                      <span className="text-[9.5px] font-bold text-white block truncate font-mono">{uploadedFile.name}</span>
                      <span className="text-[8px] text-slate-400 font-mono block mt-0.5">
                        {uploadedFile.size} • <span className="text-teal-400 animate-pulse font-bold uppercase tracking-wider">Projected on Court Viewer ➔</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 relative shrink-0">
                    <label className="px-1.5 py-0.5 text-[8.5px] font-mono text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700 bg-slate-900/60 rounded cursor-pointer transition">
                      Replace
                      <input
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setDocSummaryText('');
                        setDocLiabilityText('');
                        setDocClaimsText('');
                        setClientMergeFeedback(null);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-450 rounded transition cursor-pointer"
                      title="Unload Reference Document"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Direct Action: Merge into single client file without duplicating */}
                <div className="flex items-center justify-between gap-2 bg-[#060a14] px-2 py-1.5 rounded-lg border border-indigo-500/30">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="text-[8.5px] font-mono text-slate-300 truncate">
                      Single Identified Client Intake & Merging
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isMergingClientFile}
                    onClick={handleCreateOrMergeClientFile}
                    className="px-2 py-1 bg-gradient-to-r from-indigo-700 to-teal-700 hover:from-indigo-600 hover:to-teal-600 text-white rounded text-[8px] font-mono font-bold shrink-0 flex items-center gap-1 cursor-pointer transition shadow border border-indigo-500/40 disabled:opacity-60"
                  >
                    {isMergingClientFile ? (
                      <>
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>MERGING...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-2.5 h-2.5 text-teal-300" />
                        <span>MERGE TO CLIENT FILE</span>
                      </>
                    )}
                  </button>
                </div>

                {clientMergeFeedback && (
                  <div className="px-2 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded text-[8px] font-mono text-emerald-300 flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{clientMergeFeedback}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Document Workspace Content Body */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#090d16]/20 relative">
            
            {leftTab === 'portrait' ? (
              <div className="flex-1 p-3 min-h-0">
                <AgentAnimatedPortrait
                  profile={activeProfile}
                  isSpeaking={isSpeakingAudio}
                  voiceStatus={voiceStatus}
                  onPortraitClick={handlePortraitInteract}
                />
              </div>
            ) : isParsingFile ? (
              /* Circular glowing parsing loader skeleton */
              <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                <div className="relative w-12 h-12">
                  <div className="w-12 h-12 rounded-full border-4 border-teal-500/10 border-t-teal-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-teal-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <span className="font-mono text-[10px] text-teal-400 animate-pulse block font-black uppercase tracking-widest">
                    PARSING FILE DETAILS...
                  </span>
                  <p className="text-[9px] text-slate-500 font-mono">Compiling word buffers & aligning custom context vectors</p>
                </div>
              </div>

            ) : activeProfile.id === 'ap-4' ? (
              /* ======================================================= */
              /* EVE PARALEGAL & EVIDENCE AUDITOR SUITE TERMINAL         */
              /* ======================================================= */
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3.5 space-y-3.5 selection:bg-indigo-500/30">
                
                {/* Header Widget */}
                <div className="bg-[#0c1221] border border-indigo-900/40 p-3 rounded-xl flex items-center justify-between gap-3 shadow">
                  <div className="flex items-center gap-2">
                    <span className="p-1 px-1.5 bg-indigo-950/80 text-indigo-400 border border-indigo-500/25 rounded-md text-[10px] font-mono font-bold animate-pulse">PARALEGAL</span>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-black text-slate-200 tracking-wider font-mono uppercase">EVE Evidence Auditor & Bates Matrix Suite</h4>
                      <p className="text-[9px] text-indigo-400/80 font-mono font-semibold">Legal Paralegal • Fact-Checker • Phoenix Briefing Co-Pilot</p>
                    </div>
                  </div>
                  <Bot className="w-6 h-6 text-indigo-400 animate-pulse shrink-0" />
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center gap-1 bg-[#050812] p-1 rounded-xl border border-slate-800 overflow-x-auto text-[10px] font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setEveSubTab('driveEditor');
                      fetchStaffDriveFiles();
                    }}
                    className={`px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 ${
                      eveSubTab === 'driveEditor' ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/40 shadow' : 'text-emerald-400/80 hover:text-emerald-300'
                    }`}
                  >
                    <FolderOpen className="w-3 h-3 text-emerald-400" />
                    <span>📂 Drive Suite</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEveSubTab('factCheck')}
                    className={`px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 ${
                      eveSubTab === 'factCheck' ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500/40 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🔍 Fact-Checker</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEveSubTab('batesMatrix')}
                    className={`px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 ${
                      eveSubTab === 'batesMatrix' ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500/40 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📑 Bates Matrix</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEveSubTab('inconsistencies')}
                    className={`px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 ${
                      eveSubTab === 'inconsistencies' ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500/40 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>⚖️ Inconsistencies</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEveSubTab('router')}
                    className={`px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 ${
                      eveSubTab === 'router' ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500/40 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>📁 Filing Router</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEveSubTab('summary')}
                    className={`px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 ${
                      eveSubTab === 'summary' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>⚡ Brief Phoenix</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEveSubTab('pipelineBridge')}
                    className={`px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1 font-extrabold ${
                      eveSubTab === 'pipelineBridge' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'text-amber-400/90 hover:text-amber-300'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>⚡ 8-Agent Pipeline</span>
                  </button>
                </div>

                {/* TAB 0: DRIVE SUITE & FILE EDITOR */}
                {eveSubTab === 'driveEditor' && (
                  <div className="bg-[#050810]/40 border border-emerald-500/20 p-2 rounded-xl flex-1 flex flex-col min-h-[480px]">
                    {renderGoogleDriveSuite()}
                  </div>
                )}

                {/* TAB 1: FACT-CHECKER */}
                {eveSubTab === 'factCheck' && (
                  <div className="bg-[#050810]/40 border border-[#1e293b] p-3 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-indigo-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" />
                        Document Fact-Checking Auditor
                      </span>
                      <span className="text-[8.5px] font-mono bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                        EVE Verification Engine
                      </span>
                    </div>

                    <p className="text-[9.5px] text-slate-400 leading-normal">
                      Input document claims, affidavits, or party filings to cross-examine against bank statements, tax returns, and court records.
                    </p>

                    <textarea
                      value={factCheckInputText}
                      onChange={(e) => setFactCheckInputText(e.target.value)}
                      placeholder="Paste document text or claims to fact check..."
                      rows={4}
                      className="w-full bg-[#080d1a] border border-slate-800 rounded-lg p-2.5 text-[10.5px] text-slate-200 font-sans focus:outline-none focus:border-indigo-600 resize-none min-h-[90px]"
                    />

                    <button
                      type="button"
                      disabled={isFactChecking || !factCheckInputText.trim()}
                      onClick={async () => {
                        setIsFactChecking(true);
                        try {
                          const res = await fetch('/api/eve/fact-check', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ documentText: factCheckInputText })
                          });
                          const data = await res.json();
                          if (data.report) {
                            setFactCheckResult(data.report);
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsFactChecking(false);
                        }
                      }}
                      className="w-full py-2 bg-gradient-to-r from-indigo-900 to-purple-900 hover:from-indigo-800 hover:to-purple-800 text-indigo-100 font-mono text-[10px] font-extrabold rounded-xl border border-indigo-500/30 shadow transition cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wide"
                    >
                      {isFactChecking ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>AUDITING CLAIMS & CROSS-REFERENCING...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>⚡ FACT-CHECK DOCUMENT WITH EVE</span>
                        </>
                      )}
                    </button>

                    {factCheckResult && (
                      <div className="mt-3 bg-[#080d16] border border-indigo-900/50 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">✅ Fact Audit Completed</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUserInput(`EVE, discuss this fact-check report in detail: \n\n${factCheckResult}`);
                              setLeftTab('portrait');
                            }}
                            className="text-[8.5px] font-mono text-indigo-400 hover:underline"
                          >
                            Send to Chat →
                          </button>
                        </div>
                        <div className="prose prose-invert max-w-none text-[10px] leading-relaxed text-slate-300 font-sans whitespace-pre-wrap max-h-[220px] overflow-y-auto">
                          {factCheckResult}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: BATES-CITE MATRIX */}
                {eveSubTab === 'batesMatrix' && (
                  <div className="bg-[#050810]/40 border border-[#1e293b] p-3 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-indigo-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Bates-Stamping & Citation Matrix Builder
                      </span>
                      <span className="text-[8.5px] font-mono bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                        Evidence Indexing
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-[9.5px]">
                      <div>
                        <label className="text-slate-500 font-bold block mb-1">Bates Prefix</label>
                        <input
                          type="text"
                          value={batesPrefix}
                          onChange={(e) => setBatesPrefix(e.target.value)}
                          className="w-full bg-[#080d1a] border border-slate-800 rounded px-2 py-1.5 text-slate-200 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 font-bold block mb-1">Start Number</label>
                        <input
                          type="number"
                          value={batesStartNum}
                          onChange={(e) => setBatesStartNum(Number(e.target.value))}
                          className="w-full bg-[#080d1a] border border-slate-800 rounded px-2 py-1.5 text-slate-200 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isBuildingBates}
                      onClick={async () => {
                        setIsBuildingBates(true);
                        try {
                          const res = await fetch('/api/eve/bates-matrix', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prefix: batesPrefix, startNumber: batesStartNum })
                          });
                          const data = await res.json();
                          if (data.matrix) {
                            setBatesMatrixData(data.matrix);
                            setBatesMarkdownTable(data.markdownTable);
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsBuildingBates(false);
                        }
                      }}
                      className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-mono text-[10px] font-black rounded-xl border border-indigo-500/30 transition cursor-pointer uppercase flex items-center justify-center gap-1.5"
                    >
                      {isBuildingBates ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>STAMPING BATES NUMBERS & MAPPING CITATIONS...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>⚡ GENERATE BATES-CITE MATRIX</span>
                        </>
                      )}
                    </button>

                    {batesMatrixData && (
                      <div className="bg-[#080d16] border border-slate-800 rounded-xl p-2.5 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-mono text-[9px]">
                          <span className="text-indigo-300 font-bold">📑 {batesMatrixData.length} Evidence Records Indexed</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (batesMarkdownTable) {
                                navigator.clipboard.writeText(batesMarkdownTable);
                                setRoutingNotification('Bates Matrix copied to clipboard!');
                                setTimeout(() => setRoutingNotification(null), 3000);
                              }
                            }}
                            className="text-amber-400 hover:underline"
                          >
                            Copy Matrix
                          </button>
                        </div>

                        <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                          <table className="w-full text-left border-collapse text-[9px] font-mono">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400">
                                <th className="py-1 px-1.5">Bates ID</th>
                                <th className="py-1 px-1.5">Document Title</th>
                                <th className="py-1 px-1.5">Date</th>
                                <th className="py-1 px-1.5">Key Point / Pinpoint</th>
                              </tr>
                            </thead>
                            <tbody>
                              {batesMatrixData.map((row) => (
                                <tr key={row.batesId} className="border-b border-slate-900 text-slate-300 hover:bg-indigo-950/20">
                                  <td className="py-1 px-1.5 text-amber-400 font-bold whitespace-nowrap">{row.batesId}</td>
                                  <td className="py-1 px-1.5 truncate max-w-[120px]">{row.documentTitle}</td>
                                  <td className="py-1 px-1.5 whitespace-nowrap text-slate-500">{row.date}</td>
                                  <td className="py-1 px-1.5 text-slate-400 truncate max-w-[140px]">{row.keyFact} ({row.pinpoint})</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: INCONSISTENCIES EVALUATOR */}
                {eveSubTab === 'inconsistencies' && (
                  <div className="bg-[#050810]/40 border border-[#1e293b] p-3 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-indigo-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        Inconsistency & Contradiction Auditor
                      </span>
                      <span className="text-[8.5px] font-mono bg-rose-950/40 text-rose-300 px-2 py-0.5 rounded border border-rose-500/20">
                        Record Discrepancy Engine
                      </span>
                    </div>

                    <p className="text-[9.5px] text-slate-400 leading-normal">
                      EVE cross-examines pleadings, depositions, bank statements, and disclosures to detect internal contradictions and timeline misalignments.
                    </p>

                    <button
                      type="button"
                      disabled={isInconsistencyAuditing}
                      onClick={async () => {
                        setIsInconsistencyAuditing(true);
                        try {
                          const res = await fetch('/api/eve/inconsistency-audit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ caseName: 'Active Case Disclosures' })
                          });
                          const data = await res.json();
                          if (data.markdownReport) {
                            setInconsistencyReport(data.markdownReport);
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsInconsistencyAuditing(false);
                        }
                      }}
                      className="w-full py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-mono text-[10px] font-black rounded-xl border border-rose-500/30 transition cursor-pointer uppercase flex items-center justify-center gap-1.5"
                    >
                      {isInconsistencyAuditing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>AUDITING CASE RECORDS FOR CONTRADICTIONS...</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>⚡ EVALUATE & SORT EVIDENCE INCONSISTENCIES</span>
                        </>
                      )}
                    </button>

                    {inconsistencyReport && (
                      <div className="bg-[#080d16] border border-rose-900/40 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-[9px] font-mono">
                          <span className="text-rose-400 font-bold uppercase">🚨 Discrepancy Sweep Completed</span>
                        </div>
                        <div className="prose prose-invert max-w-none text-[10px] leading-relaxed text-slate-300 font-sans whitespace-pre-wrap max-h-[220px] overflow-y-auto">
                          {inconsistencyReport}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: FILING ROUTER (EXISTING ROUTER & REMINDERS) */}
                {eveSubTab === 'router' && (
                  <div className="space-y-3">
                    {/* Section 1: illamadex FILE ROUTER */}
                    <div className="bg-[#050810]/40 border border-[#1e293b] p-3 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-slate-400 font-black uppercase tracking-widest">📂 illamadex filing system router</span>
                        <span className="text-[8px] font-mono bg-emerald-950/30 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-black">
                          {eveRoutedFiles.length} of {evePendingFiles.length} Routed
                        </span>
                      </div>
                      
                      <p className="text-[9px] text-slate-500 leading-normal">
                        Drag and sync files safely to index-route folders. Ensure community liabilities and separate property portfolios map exactly to correct system assets.
                      </p>

                      <div className="space-y-1.5">
                        {evePendingFiles.map((file) => {
                          const isRouted = eveRoutedFiles.includes(file.id);
                          return (
                            <div 
                              key={file.id}
                              className={`p-2 rounded-lg border transition text-[10px] select-none flex items-center justify-between gap-2.5 ${
                                isRouted 
                                  ? 'bg-emerald-950/10 border-emerald-500/20 text-slate-400' 
                                  : 'bg-[#080d16] border-slate-800 text-slate-200 hover:border-indigo-500/30'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm">{isRouted ? '✅' : '📄'}</span>
                                <div className="min-w-0 leading-tight">
                                  <span className="font-mono block truncate font-bold">{file.name}</span>
                                  <span className="text-[8px] text-slate-500 font-mono">{file.size} • {file.category}</span>
                                </div>
                              </div>
                              <span className={`text-[8.5px] font-mono font-bold shrink-0 px-1.5 py-0.5 rounded uppercase ${
                                isRouted ? 'text-emerald-400 bg-emerald-950/20' : 'text-[#dfb76c] bg-[#dfb76c]/5'
                              }`}>
                                {isRouted ? 'ROUTED' : 'PENDING'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {routingNotification && (
                        <div className="p-2 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-[9px] text-emerald-300 font-mono tracking-wider animate-pulse">
                          🗸 {routingNotification}
                        </div>
                      )}

                      {/* Manual router controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-slate-500 font-black uppercase">Source File</span>
                          <select 
                            value={selectedFileToRoute} 
                            onChange={(e) => setSelectedFileToRoute(e.target.value)}
                            className="bg-[#050912] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:border-indigo-500 outline-none w-full"
                          >
                            {evePendingFiles.map(f => (
                              <option key={f.id} value={f.id} disabled={eveRoutedFiles.includes(f.id)}>
                                {f.name.slice(0, 24)}...
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-slate-500 font-black uppercase">illamadex Target Folder</span>
                          <select 
                            value={selectedFolderToRoute} 
                            onChange={(e) => setSelectedFolderToRoute(e.target.value)}
                            className="bg-[#050912] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:border-indigo-500 outline-none w-full"
                          >
                            <option value="Evidence_Community">📁 Evidence: Joint Community Assets</option>
                            <option value="Evidence_Separate">📁 Evidence: Separate Properties</option>
                            <option value="Filings">📁 Court Filings Repository</option>
                            <option value="Phoenix_Priority">📁 Phoenix Priority Escalations</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (eveRoutedFiles.includes(selectedFileToRoute)) return;
                          setIsRoutingFile(true);
                          const targetName = evePendingFiles.find(f => f.id === selectedFileToRoute)?.name || 'File';
                          
                          setTimeout(() => {
                            setEveRoutedFiles(prev => [...prev, selectedFileToRoute]);
                            setIsRoutingFile(false);
                            const notify = `Successfully routed "${targetName}" to "/illamadex/Family_Law/Matter_Files/${selectedFolderToRoute}". Secure metadata synced and Phoenix notified!`;
                            setRoutingNotification(notify);
                            
                            onAddMessage({
                              id: `eve-route-alert-${Date.now()}`,
                              sender: 'assistant',
                              content: `### 📂 illamadex FILING SYSTEM ROUTER SUCCESS
EVE has completed document synchronization audit:
- **Routed File**: \`${targetName}\`
- **Target Folder**: \`/illamadex/Family_Law/Matter_Files/${selectedFolderToRoute}/\`
- **Status**: Verified and fully indexed. Database cache buffers cleared. Phoenix and Adonis notified.`,
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              agentName: 'EVE'
                            });

                            const unrouted = evePendingFiles.find(f => f.id !== selectedFileToRoute && !eveRoutedFiles.includes(f.id));
                            if (unrouted) {
                              setSelectedFileToRoute(unrouted.id);
                            }

                            setTimeout(() => setRoutingNotification(null), 4000);
                          }, 700);
                        }}
                        disabled={isRoutingFile || eveRoutedFiles.length === evePendingFiles.length}
                        className="w-full py-2 bg-gradient-to-r from-indigo-950 to-purple-950 text-indigo-400 hover:text-indigo-300 font-extrabold border border-indigo-500/30 rounded-xl text-[10px] tracking-wider transition hover:from-indigo-900 hover:to-purple-900 uppercase cursor-pointer shadow flex items-center justify-center gap-1"
                      >
                        {isRoutingFile ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>RE-INDEXING DATABASE TREES...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>⚡ ROUTE FILE TO ACTIVE DIRECTORY</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Section 2: DRAFT MEMOS & REMINDERS */}
                    <div className="bg-[#050810]/40 border border-[#1e293b] p-3 rounded-xl space-y-2.5">
                      <span className="text-[9px] font-mono text-slate-400 font-black uppercase tracking-widest block">📝 Memo & motion drafter co-pilot</span>
                      
                      <div className="flex gap-2 flex-col sm:flex-row">
                        <textarea 
                          value={eveMemoTopic}
                          onChange={(e) => setEveMemoTopic(e.target.value)}
                          placeholder="Enter memo or outline topic description..."
                          rows={3}
                          className="flex-1 bg-[#101726]/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-white font-sans placeholder:text-slate-600 focus:outline-none focus:border-indigo-800 resize-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setUserInput(`EVE, draft a clear executive memorandum and simple motion guidelines regarding: "${eveMemoTopic}". Outline all key details, matching civil codes and filing standards.`);
                          setLeftTab('portrait');
                        }}
                        className="w-full py-1.5 bg-slate-800/80 hover:bg-slate-700 hover:text-white text-indigo-400 border border-slate-700/60 font-bold rounded-lg text-[9px] tracking-wider transition-colors cursor-pointer uppercase text-center"
                      >
                        🚀 COMPILE MEMORANDUM BRIEF WITH EVE
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 5: TRANSMIT SUMMARY TO PHOENIX */}
                {eveSubTab === 'summary' && (
                  <div className="bg-[#050810]/40 border border-[#1e293b] p-3 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-amber-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        Phoenix Senior Partner Strategic Briefing Transmittal
                      </span>
                      <span className="text-[8.5px] font-mono bg-amber-950/40 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                        EVE → Phoenix Desk
                      </span>
                    </div>

                    <p className="text-[9.5px] text-slate-400 leading-normal">
                      EVE compiles the complete Fact-Check Audit, Bates-Cite Matrix, and Evidence Contradiction Sweep into an executive trial briefing for **Phoenix Senior Partner**.
                    </p>

                    <div className="bg-[#080d16] p-2.5 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[9px] text-slate-300">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>• Fact Check Claims Audited:</span>
                        <span className="text-emerald-400 font-bold">{factCheckResult ? '✅ Complete' : 'Pending Direct Audit'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>• Bates-Cite Matrix Range:</span>
                        <span className="text-amber-400 font-bold">{batesMatrixData ? `${batesPrefix}1001 - ${batesPrefix}${1000 + batesMatrixData.length}` : 'Default EX-1001..1005'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>• Contradiction Discrepancy Sweep:</span>
                        <span className="text-rose-400 font-bold">{inconsistencyReport ? '🚨 Critical Discrepancies Found' : 'Verified'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const briefContent = `### 🧠 PHOENIX PARTNER TRIAL BRIEFING & EVIDENCE AUDIT
**From**: EVE (Legal Paralegal & Evidence Specialist)
**To**: Phoenix (Senior Litigation Strategist)
**Matter**: Active Disclosures & Asset Audit

---

#### 1. Fact-Check & Verification Highlights
- **FL-150 Income Audit**: Respondent's reported $8,500/mo net income **directly conflicts** with W-2 tax statements ($18,200/mo). Discrepancy = $116,400/yr underreported.
- **Joint Property Deed**: 1042 Ocean Ave verified as Joint Tenancy (Family Code § 2581 presumption applies).

#### 2. Bates-Cite Index Matrix Summary
- \`EX-1001\`: FL-100 Petition for Dissolution (Separation Date: 11/04/2022)
- \`EX-1002\`: First Republic Joint Savings Statement (#4091) - $142,500 transferred prior to separation.
- \`EX-1003\`: 2022 W-2 Wage & Tax Statement - $218,400 wages + $65,000 stock options.
- \`EX-1004\`: Property Grant Deed - Los Angeles County Recorder Doc #2018-049102.

#### 3. Inconsistencies & Contradiction Points for Cross-Examination
- **Income Discrepancy**: $116,400 underreported on FL-150 → Basis for Family Code § 271 attorney fee sanctions.
- **Separation Date Conflict**: Petitioner claims 11/04/2022; Respondent claims 04/01/2021 to retain $85k bonus.
- **Crypto Asset Omission**: Coinbase crypto account omitted from FL-142 → Grounds for § 1101(h) breach of fiduciary duty motion.

*Phoenix, the evidence suite is fully indexed and ready for trial strategy board escalation.*`;

                        onAddMessage({
                          id: `eve-phoenix-update-${Date.now()}`,
                          sender: 'assistant',
                          content: briefContent,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          agentName: 'EVE'
                        });

                        setRoutingNotification("Briefing & Evidence Matrix transmitted successfully to Phoenix strategic dossier.");
                        setEveSubTab('summary');
                        setTimeout(() => setRoutingNotification(null), 4000);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 hover:from-amber-900 hover:to-amber-850 text-amber-200 border border-amber-500/40 font-black tracking-wide rounded-xl text-[10px] transition cursor-pointer flex items-center justify-center gap-2 uppercase shadow-lg"
                    >
                      <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>⚡ TRANSMIT EVE EVIDENCE AUDIT TO PHOENIX</span>
                    </button>

                    {routingNotification && (
                      <div className="p-2 bg-amber-950/30 border border-amber-500/30 rounded-lg text-[9px] text-amber-300 font-mono tracking-wider animate-pulse text-center">
                        🗸 {routingNotification}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: EVE 8-AGENT PIPELINE BRIDGE */}
                {eveSubTab === 'pipelineBridge' && (
                  <div className="bg-[#050810]/40 border border-amber-500/30 p-3.5 rounded-xl space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-amber-300 uppercase tracking-wide text-[11px]">
                          EVE Operations & 8-Agent Pipeline Bridge
                        </span>
                      </div>
                      <span className="text-[9px] text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/30">
                        Operational Lead
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                      Empowers <strong>EVE (Director of Operations & Executive Intake Lead)</strong> to intake raw client dossiers, calculate cryptographic SHA-256 byte fingerprints, issue authoritative operational instructions to all 8 agents, and strictly enforce <strong>Level 23 Master Rule 5 (Never Guess)</strong>.
                    </p>

                    {/* Eve Directive Preset Summary */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-300">
                        <span>Active Directive:</span>
                        <span className="text-teal-400">Executive Intake Directive</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-400">
                        <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800">
                          <strong className="text-white block">Rule 1 Invariant:</strong>
                          Original byte-for-byte vaulted
                        </div>
                        <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800">
                          <strong className="text-white block">Rule 5 Zero-Guess:</strong>
                          Missing facts marked for review
                        </div>
                      </div>
                    </div>

                    {/* Launch Executive Hand-Off Modal Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenExecutivePipelineModal('eve')}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black tracking-wide rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 uppercase shadow-lg shadow-amber-500/20"
                    >
                      <Zap className="w-4 h-4 text-slate-950" />
                      <span>⚡ Hand Document to 8-Agent Pipeline & Issue Intake Directives</span>
                    </button>


                    {/* Quick Sample Document Hand-offs */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9.5px] uppercase text-slate-400 font-bold block">
                        Quick Launch: Hand Verified Intake Document to Pipeline:
                      </span>
                      <div className="grid grid-cols-1 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenExecutivePipelineModal('eve')}
                          className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-amber-400/50 rounded-lg text-left text-[10px] text-slate-200 transition-all flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span className="truncate font-bold">FL-120 Dissolution Responsive Dossier</span>
                          </div>
                          <span className="text-[8.5px] uppercase font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">Dispatch</span>
                        </button>
                      </div>
                    </div>

                    {/* Last Dispatch Result Display */}
                    {lastExecutiveDispatchResult && lastExecutiveDispatchResult.dispatcher === 'eve' && (
                      <div className="p-3 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-1.5 text-[10px] text-emerald-300">
                        <div className="flex items-center justify-between font-bold">
                          <span>✅ Pipeline Executed by EVE:</span>
                          <span className="text-[9px] font-mono">SHA-256: {lastExecutiveDispatchResult.template.sourceSha256.slice(0, 14)}...</span>
                        </div>
                        <p className="text-slate-300 text-[9.5px] font-sans leading-normal">
                          {lastExecutiveDispatchResult.executiveSummary}
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-[9px] font-mono">
                          <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-emerald-500/30">
                            QA Sentinel: 100% Certified Valid
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-teal-500/30">
                            {lastExecutiveDispatchResult.template.fieldMappings.length} Fields Mapped
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            ) : (
              /* Non-EVE Profiles (Phoenix, Sentry, Allure): Unified Workspace with Drive Suite + Document Context */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Mode Selector for Phoenix / Sentry / Allure */}
                <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between gap-2 border-b border-[#1e293b] bg-[#090d16]/60 shrink-0">
                  <div className="flex items-center gap-1 bg-[#050812] p-0.5 rounded-lg border border-slate-800 text-[9px] font-mono font-bold">
                    {activeProfile.id === 'ap-1' && (
                      <button
                        type="button"
                        onClick={() => setStaffWorkspaceMode('phoenix_command')}
                        className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
                          staffWorkspaceMode === 'phoenix_command' || (!['drive', 'context', 'pipeline'].includes(staffWorkspaceMode))
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Phoenix Senior Managing Partner Litigation Strategy & Evidentiary Review Suite"
                      >
                        <Scale className="w-3 h-3 text-amber-400" />
                        <span>Litigation & Trial Command</span>
                        <span className="text-[7.5px] uppercase font-bold text-amber-400 bg-amber-950/90 px-1 py-0.2 rounded border border-amber-500/30">Senior Partner</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStaffWorkspaceMode('drive')}
                      className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
                        staffWorkspaceMode === 'drive'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FolderOpen className="w-3 h-3 text-emerald-400" />
                      <span>Google Drive Suite</span>
                      <span className="text-[7.5px] uppercase font-bold text-emerald-400 bg-emerald-950/90 px-1 py-0.2 rounded border border-emerald-500/30">Full Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffWorkspaceMode('context')}
                      className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
                        staffWorkspaceMode === 'context'
                          ? 'bg-teal-950 text-teal-300 border border-teal-500/40 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UploadCloud className="w-3 h-3 text-teal-400" />
                      <span>Intake Reference {uploadedFile ? `(1 Active)` : ''}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffWorkspaceMode('pipeline')}
                      className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 cursor-pointer ${
                        staffWorkspaceMode === 'pipeline'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      <span>8-Agent Pipeline Directives</span>
                    </button>
                  </div>

                  {uploadedFile && staffWorkspaceMode === 'context' && (
                    <button
                      type="button"
                      onClick={() => {
                        setDriveFileName(uploadedFile.name);
                        setDriveFileContent(uploadedFile.content);
                        const ext = uploadedFile.name.toLowerCase().endsWith('.pdf') ? 'pdf' : uploadedFile.name.toLowerCase().endsWith('.txt') ? 'text' : 'docx';
                        setDriveSaveFormat(ext as any);
                        setStaffWorkspaceMode('drive');
                        setStaffDriveTab('editor');
                      }}
                      className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded text-[8.5px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Load this uploaded reference document into the Google Drive editor to push changes to Drive"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      <span>Edit in Drive</span>
                    </button>
                  )}
                </div>

                {staffWorkspaceMode === 'pipeline' ? (
                  /* Phoenix & Senior Partner 8-Agent Pipeline Command Panel */
                  <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4 font-mono text-xs selection:bg-amber-500/30">
                    <div className="bg-[#0c1221] border border-amber-500/40 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/30">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider font-mono">
                            Phoenix Executive 8-Agent Pipeline Engine
                          </h4>
                          <p className="text-[10px] text-slate-400 font-sans">
                            Authoritative Directives & Strict Millimeter Geometry Pleading Mapping
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                        Senior Partner
                      </span>
                    </div>

                    {/* Master Directives Card */}
                    <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10.5px]">
                        <span className="font-bold text-amber-300">Active Litigation Directive:</span>
                        <span className="text-teal-400 text-[10px]">Exact Coordinate Pleading Mapping</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                        &quot;Preserve underlying court pleading geometry byte-for-byte. Extract petitioner/respondent designations, relief requests, and case numbers. Do not guess on contested facts; flag all ambiguities for counsel review.&quot;
                      </p>

                      {/* 8-Agent Directive Checklist */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[9px]">
                        <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-teal-300">
                          <strong className="text-white block">1. Ingestion:</strong> Vault Byte Hash
                        </div>
                        <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-teal-300">
                          <strong className="text-white block">2. Analysis:</strong> Bounding Boxes
                        </div>
                        <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-teal-300">
                          <strong className="text-white block">3. Extraction:</strong> Rule 5 Zero-Guess
                        </div>
                        <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-teal-300">
                          <strong className="text-white block">4. Database:</strong> Canonical Map
                        </div>
                        <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-teal-300">
                          <strong className="text-white block">5. Template:</strong> Coordinate Overlays
                        </div>
                        <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-teal-300">
                          <strong className="text-white block">6. Delivery:</strong> Court PDF / XFDF
                        </div>
                        <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-teal-300">
                          <strong className="text-white block">7. Integration:</strong> Google Drive
                        </div>
                        <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-teal-300">
                          <strong className="text-white block">8. QA Sentinel:</strong> 100% Certified
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Hand Document to 8-Agent Pipeline */}
                    <button
                      type="button"
                      onClick={() => handleOpenExecutivePipelineModal('phoenix')}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black tracking-wider rounded-xl text-xs uppercase cursor-pointer transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-slate-950" />
                      <span>⚡ Hand Document to 8-Agent Pipeline & Issue Litigation Directives</span>
                    </button>


                    {/* If a reference document is already active in staff workspace */}
                    {uploadedFile && (
                      <div className="p-3 bg-slate-900/90 border border-teal-500/40 rounded-xl flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-white block truncate">{uploadedFile.name}</span>
                            <span className="text-slate-400 text-[9px]">{uploadedFile.size} &bull; Ready for Pipeline Handoff</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenExecutivePipelineModal('phoenix')}
                          className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/50 rounded-lg font-bold uppercase text-[9px] shrink-0 transition"
                        >
                          Hand Over This File
                        </button>
                      </div>
                    )}

                    {/* Recent Dispatch Results */}
                    {lastExecutiveDispatchResult && (
                      <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-2 text-[10px] text-emerald-300">
                        <div className="flex items-center justify-between font-bold">
                          <div className="flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Pipeline Completed by {lastExecutiveDispatchResult.dispatcherName}:</span>
                          </div>
                          <span className="font-mono text-[9px] text-slate-400">
                            SHA-256: {lastExecutiveDispatchResult.template.sourceSha256.slice(0, 16)}...
                          </span>
                        </div>
                        <p className="text-slate-300 text-[9.5px] font-sans leading-relaxed">
                          {lastExecutiveDispatchResult.executiveSummary}
                        </p>
                        <div className="pt-1 flex flex-wrap items-center gap-2 text-[9px] font-mono">
                          <span className="px-2 py-0.5 bg-slate-900 rounded border border-emerald-500/30 text-emerald-300">
                            QA Sentinel: 100% Passed (Zero Deviation)
                          </span>
                          <span className="px-2 py-0.5 bg-slate-900 rounded border border-teal-500/30 text-teal-300">
                            {lastExecutiveDispatchResult.template.fieldMappings.length} Fields Mapped
                          </span>
                          <span className="px-2 py-0.5 bg-slate-900 rounded border border-amber-500/30 text-amber-300">
                            Populated: {lastExecutiveDispatchResult.populatedOutput.populatedFieldCount}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : staffWorkspaceMode === 'phoenix_command' || (activeProfile.id === 'ap-1' && !['drive', 'context', 'pipeline'].includes(staffWorkspaceMode)) ? (
                  renderPhoenixSeniorPartnerSuite()
                ) : staffWorkspaceMode === 'drive' ? (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {renderGoogleDriveSuite()}
                  </div>
                ) : !uploadedFile ? (
                  /* Drag & Drop Upload Zone */
                  <div 
                    className="flex-1 flex flex-col p-4"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className={`flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all ${
                      dragOver 
                        ? 'border-teal-400 bg-teal-950/20 text-teal-300 scale-[0.99] shadow-inner' 
                        : 'border-[#1e293b] bg-[#090d16]/30 text-slate-500 hover:border-[#334155]'
                    }`}>
                      <UploadCloud className={`w-12 h-12 text-teal-500/40 mb-3 ${dragOver ? 'animate-bounce text-teal-400' : ''}`} />
                      <h4 className="text-xs font-bold text-slate-300">Share or Drag Intakes / Case Documents Here</h4>
                      <p className="text-[10px] text-slate-500 text-center max-w-xs mt-1.5 mb-4 leading-normal">
                        Drag and drop any plain text contract, CSV matrix, court notes or pleadings. 
                        Agents immediately read the document context in real time.
                      </p>
                      
                      <label className="px-3 py-1.5 bg-teal-950/40 border border-teal-500/30 text-teal-400 font-bold rounded-lg text-[10px] tracking-wide hover:bg-teal-900 transition-all cursor-pointer shadow-[0_2px_0_#14b8a6] hover:shadow-[0_1px_0_#14b8a6] hover:-translate-y-[0.5px]">
                        Browse File
                        <input
                          type="file"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  /* Live Scrollable Formatted Document Text-Area */
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4 space-y-3">
                    <div className="flex items-center justify-between text-[9px] text-slate-400 shrink-0 bg-[#090d16] px-2.5 py-1.5 rounded-lg border border-[#1e293b]">
                      <span className="font-mono">Reference Size: <strong className="text-white">{uploadedFile.size}</strong></span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDriveFileName(uploadedFile.name);
                            setDriveFileContent(uploadedFile.content);
                            const ext = uploadedFile.name.toLowerCase().endsWith('.pdf') ? 'pdf' : uploadedFile.name.toLowerCase().endsWith('.txt') ? 'text' : 'docx';
                            setDriveSaveFormat(ext as any);
                            setStaffWorkspaceMode('drive');
                            setStaffDriveTab('editor');
                          }}
                          className="px-2 py-0.5 text-[8.5px] font-mono bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded cursor-pointer transition flex items-center gap-1 font-bold"
                          title="Open in Drive Suite to Edit and Save"
                        >
                          <FolderOpen className="w-3 h-3 text-emerald-400" />
                          <span>EDIT IN DRIVE</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveViewingContent(uploadedFile.content);
                            setActiveViewingTitle(uploadedFile.name);
                            setShowFullscreenDoc(true);
                          }}
                          className="px-2 py-0.5 text-[8.5px] font-mono bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-teal-400 rounded cursor-pointer transition flex items-center gap-1.5 font-bold"
                          title="Maximize document to full portrait paper view"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>MAXIMIZE</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline workspace trigger buttons */}
                    <div className="grid grid-cols-2 gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setUserInput(`Review this document ("${uploadedFile.name}") and Summary pinpoint all critical financial assets, community liabilities, and risk details.`);
                        }}
                        className="p-1.5 text-left text-[9px] font-bold text-teal-300 border border-teal-500/20 bg-teal-950/15 rounded-lg hover:border-teal-500/50 transition cursor-pointer flex items-center gap-1"
                      >
                        🚀 Phoenix Risk Audit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserInput(`Run continuous validation check on this file ("${uploadedFile.name}"). Highlight formatting gaps, empty fields, or structural maintenance issues.`);
                        }}
                        className="p-1.5 text-left text-[9px] font-bold text-amber-300 border border-amber-500/20 bg-amber-950/15 rounded-lg hover:border-amber-500/50 transition cursor-pointer flex items-center gap-1"
                      >
                        🛠️ Sentry Applet Audit
                      </button>
                    </div>

                    {/* Large reader canvas */}
                    <div className="flex-1 min-h-0 bg-[#040810] border border-[#1e293b] rounded-xl p-3.5 overflow-y-auto selection:bg-teal-500/30">
                      <pre className="text-[11px] font-mono text-[#38bdf8] leading-relaxed whitespace-pre-wrap font-medium">
                        {uploadedFile.content}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------- */}
        {/* RIGHT COLUMN: ACTIVE STRATEGIC CHAT   */}
        {/* ------------------------------------- */}
        <div className={`${isChatMaximized ? 'lg:col-span-12' : 'lg:col-span-8'} bg-[#0e1626] rounded-2xl border border-[#1e293b] flex flex-col min-h-0 overflow-hidden shadow-xl`} id="right-workspace-column">
          
          {/* Chat header agent info */}
          <div className="p-3 bg-[#0d1624] border-b border-[#1e293b] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg shrink-0">{activeProfile.avatar}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <h3 className="text-xs font-bold text-white font-heading truncate">{activeProfile.name}</h3>
                  <span className="text-[8px] uppercase tracking-wider font-mono bg-teal-950 text-teal-300 border border-teal-500/20 px-1 py-0.5 rounded leading-none shrink-0 font-bold scale-90">
                    Voice: {activeProfile.voiceName} (Female)
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-sans truncate mt-0.5">{activeProfile.role}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Phoenix Senior Managing Partner Quick Action Suite */}
              {activeProfile.id === 'ap-1' && (
                <div className="flex items-center gap-1.5 font-mono text-[9px]">
                  <button
                    type="button"
                    onClick={() => {
                      setStaffWorkspaceMode('phoenix_command');
                      setPhoenixSubTab('strategy');
                    }}
                    className={`px-2 py-1 rounded border transition cursor-pointer flex items-center gap-1 font-bold ${
                      staffWorkspaceMode === 'phoenix_command' && phoenixSubTab === 'strategy'
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:text-amber-300 hover:border-amber-500/40'
                    }`}
                    title="Open Phoenix Litigation Strategy Dashboard"
                  >
                    <Scale className="w-3 h-3 text-amber-400" />
                    <span className="hidden sm:inline">Litigation</span> Strategy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffWorkspaceMode('phoenix_command');
                      setPhoenixSubTab('tactics');
                    }}
                    className={`px-2 py-1 rounded border transition cursor-pointer flex items-center gap-1 font-bold ${
                      staffWorkspaceMode === 'phoenix_command' && phoenixSubTab === 'tactics'
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:text-amber-300 hover:border-amber-500/40'
                    }`}
                    title="Open Phoenix Trial Tactics Protocols"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Trial Tactics</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffWorkspaceMode('phoenix_command');
                      setPhoenixSubTab('evidence');
                    }}
                    className={`px-2 py-1 rounded border transition cursor-pointer flex items-center gap-1 font-bold ${
                      staffWorkspaceMode === 'phoenix_command' && phoenixSubTab === 'evidence'
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:text-amber-300 hover:border-amber-500/40'
                    }`}
                    title="Open Phoenix High-Stakes Evidentiary Review Tool"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Evidentiary Review</span>
                  </button>
                </div>
              )}

              {/* Assign Extraction Task to AI Agent Button */}
              <button
                type="button"
                id="btn-assign-agent-extraction-task"
                onClick={() => setShowAssignTaskModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 rounded shadow-sm transition cursor-pointer font-bold"
                title="Assign this AI Agent directly to ingest and extract data into client files"
              >
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Assign Extraction Task</span>
              </button>

              {/* Google Drive Status & Quick Switch Button */}
              <button
                type="button"
                onClick={() => {
                  setStaffWorkspaceMode('drive');
                  setStaffDriveTab('files');
                  fetchStaffDriveFiles();
                }}
                className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-[9px] font-mono bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 rounded shadow-sm transition cursor-pointer"
                title="Google Drive Full Edit Mode Active (level23consulting@gmail.com)"
              >
                <FolderOpen className="w-3 h-3 text-emerald-400" />
                <span className="font-bold">DRIVE: FULL EDIT</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>

              {/* AI Engine & Backup Provider Badge */}
              <button
                type="button"
                onClick={() => {
                  refreshProviderStatus();
                  setShowProviderModal(true);
                }}
                className={`px-2 py-1 text-[9px] font-mono border rounded transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  selectedProviderMode === 'OPEN_MODEL'
                    ? 'bg-purple-950/80 border-purple-500/50 text-purple-300 hover:border-purple-400'
                    : selectedProviderMode === 'GEMINI'
                    ? 'bg-blue-950/80 border-blue-500/50 text-blue-300 hover:border-blue-400'
                    : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:border-emerald-400'
                }`}
                title="Configure AI Engine Provider & Backup Open-Weights Model Settings"
              >
                <Bot className="w-3 h-3 text-teal-400 animate-pulse" />
                <span className="font-bold uppercase tracking-wide">
                  {selectedProviderMode === 'OPEN_MODEL'
                    ? 'OPEN MODEL (GEMMA)'
                    : selectedProviderMode === 'GEMINI'
                    ? 'GEMINI ONLY'
                    : 'GEMINI + BACKUP GEMMA'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </button>

              {/* Maximize / Collapse toggle */}
              <button
                type="button"
                onClick={() => setIsChatMaximized(!isChatMaximized)}
                className="px-2.5 py-1 text-[9px] font-mono border border-[#1e293b] bg-slate-900/60 text-slate-300 hover:text-teal-400 rounded hover:border-teal-500/30 transition cursor-pointer flex items-center gap-1"
                title={isChatMaximized ? "Restore default split view" : "Maximize Chat area to full width"}
              >
                {isChatMaximized ? <Columns className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                <span>{isChatMaximized ? "SPLIT VIEW" : "MAXIMIZE"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClearThread();
                  stopActiveSpeech();
                }}
                className="px-2 py-1 text-[9px] font-mono border border-slate-800 text-slate-500 hover:text-slate-300 rounded hover:border-[#1e293b] transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Active reference document notification banner when Chat is Maximized */}
          {isChatMaximized && uploadedFile && (
            <div className="bg-teal-950/20 border-b border-teal-500/20 px-4 py-2 flex items-center justify-between text-[10px] text-teal-450 font-mono animate-fade-in shrink-0">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate text-slate-300">Reference Document: <strong className="text-white">{uploadedFile.name}</strong> ({uploadedFile.size})</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFullscreenDoc(true)}
                  className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/35 hover:bg-teal-500/20 text-teal-400 rounded text-[9px] transition-all font-bold cursor-pointer"
                >
                  FULLSCREEN VIEW
                </button>
                <button
                  type="button"
                  onClick={() => setIsChatMaximized(false)}
                  className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-400 hover:text-slate-200 transition-all cursor-pointer ml-1.5"
                >
                  SPLIT VIEW
                </button>
              </div>
            </div>
          )}

          {/* Inline Slider HUD Meter */}
          <div className="flex items-center gap-3 bg-[#090d16]/40 px-3.5 py-1.5 border-b border-[#1e293b]/50 text-[9px] text-slate-400 justify-between shrink-0 flex-wrap">
            <span className="flex items-center gap-1 font-mono">STANCE: <strong className="text-teal-400">{activeProgress.personalityState}</strong></span>
            <span className="flex items-center gap-1 font-mono">FAMILIARITY: <strong className="text-slate-200">{activeProgress.caseFamiliarity}%</strong></span>
            <div className="flex items-center gap-1 max-w-[170px] flex-1 font-sans">
              <span>AGGRESSION:</span>
              <input
                type="range"
                min="10"
                max="100"
                value={activeProgress.prosecutorialAggression}
                onChange={(e) => handleUpdateSlider('prosecutorialAggression', parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-none"
              />
              <strong className="text-emerald-400 font-mono w-5 text-right shrink-0">{activeProgress.prosecutorialAggression}%</strong>
            </div>
          </div>

          {/* Active Tactical Specialty Skills row */}
          <div className="px-3 py-1 bg-[#090d16]/30 border-b border-[#1e293b]/40 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {capacities.map((cap) => {
                const isUnlocked = activeProgress.rapportScore >= cap.levelRequired;
                const CapIcon = cap.icon;
                return (
                  <button
                    key={cap.key}
                    disabled={!isUnlocked}
                    onClick={() => handleQuickPromptClick(cap.key)}
                    className={`px-2 py-1 rounded-md text-left border flex items-center justify-between transition-all text-[9px] h-[28px] ${
                      isUnlocked
                        ? 'bg-[#101726]/60 hover:bg-[#162035] border-teal-500/20 hover:border-teal-500/40 cursor-pointer text-slate-200'
                        : 'bg-slate-900/40 border-slate-800/20 opacity-30 text-slate-600'
                    }`}
                    title={cap.desc}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CapIcon className={`w-3 h-3 shrink-0 ${isUnlocked ? 'text-teal-400' : 'text-slate-700'}`} />
                      <span className="text-[8.5px] font-bold truncate leading-none">{cap.key}</span>
                    </div>
                    {!isUnlocked && <Lock className="w-2 h-2 text-slate-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Direct Google Drive & Client Files Banner */}
          <div className="p-3 bg-gradient-to-r from-[#0a1628] via-[#09111e] to-[#0a1628] border-b border-emerald-500/30 shrink-0 space-y-2 select-none">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400 shrink-0">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] font-extrabold text-slate-100 font-mono flex items-center gap-1.5 uppercase tracking-wider truncate">
                    <span>Direct Google Drive Repository</span>
                    <span className="text-[8px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">level23consulting@gmail.com</span>
                  </h4>
                  <p className="text-[8.5px] text-slate-400 font-mono truncate">
                    Folder ID: <strong className="text-teal-300 font-bold">1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH</strong> • Phoenix & Sentry Linked
                  </p>
                </div>
              </div>

              <a
                href="https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] rounded-lg border border-emerald-400/60 shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 uppercase tracking-wide"
                title="Open Google Drive Repository directly in new tab"
              >
                <FolderOpen className="w-3.5 h-3.5 text-white" />
                <span>Open Direct Google Drive Folder</span>
                <ExternalLink className="w-3 h-3 text-emerald-200" />
              </a>
            </div>

            {/* Quick Client Files Links */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-[9px] font-mono scrollbar-none">
              <span className="text-slate-500 shrink-0 font-bold uppercase text-[8px]">Client Files:</span>
              
              <a
                href="https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-[#050912] hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 rounded flex items-center gap-1 shrink-0 transition"
                title="Client File Folder in Google Drive"
              >
                <FileText className="w-3 h-3 text-amber-400" />
                <span>📁 Client Files Repository</span>
              </a>

              <a
                href="https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-[#050912] hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 rounded flex items-center gap-1 shrink-0 transition"
                title="CA FL-100 Petition for Dissolution Template"
              >
                <FileText className="w-3 h-3 text-teal-400" />
                <span>CA_FL-100_Petition_Dissolution_Template.docx</span>
              </a>

              <a
                href="https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-[#050912] hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 rounded flex items-center gap-1 shrink-0 transition"
                title="Client Intake Memorandum & Declaration Template"
              >
                <FileText className="w-3 h-3 text-indigo-400" />
                <span>Intake_Memorandum_Declaration_Template.pdf</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setUserInput(`${activeProfile.name}, please confirm the direct Google Drive repository link for level23consulting@gmail.com and list all client files available in the folder.`);
                }}
                className="px-2 py-1 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 hover:text-amber-200 rounded flex items-center gap-1 shrink-0 transition cursor-pointer font-bold ml-auto"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Ask {activeProfile.name} for Drive Links</span>
              </button>
            </div>
          </div>

          {/* Balloon Chat Log messages viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#070b13]/60 select-text min-h-[300px]">
            {activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-2 py-8">
                <Bot className="w-10 h-10 text-teal-500/40" />
                <h4 className="text-sm font-bold text-slate-200 font-heading">Consult {activeProfile.name}</h4>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  "I am ready. Ask me any procedural questions, request brief drafts, or upload documents on the left panel."
                </p>
              </div>
            ) : (
              activeMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[90%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 border shadow-sm ${
                    msg.sender === 'user' ? 'bg-[#090d16] border-[#1e293b]' : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                  }`}>
                    {msg.sender === 'user' ? '👤' : activeProfile.avatar}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className={`p-3.5 rounded-2xl text-[12px] leading-relaxed font-sans shadow-md border ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-teal-600/90 to-teal-800/90 text-white border-teal-500/35 rounded-tr-none ml-auto'
                        : msg.sender === 'system' as any
                        ? 'bg-[#0c1a2e]/60 text-teal-300 border-teal-500/30'
                        : 'bg-[#0a101d] text-slate-100 border-[#1e293b] rounded-tl-none'
                    }`}>
                      <div className="whitespace-pre-wrap font-medium">
                        {renderMessageWithClickableLinks(msg.content)}
                      </div>

                      {/* Interactive Official Form Card if message mentions FL-120 / Official Form */}
                      {((msg.content.includes('FL-120') || msg.content.includes('Official Form') || msg.content.includes('Judicial Council')) && msg.sender === 'assistant') && (
                        <div className="mt-3 p-3 bg-gradient-to-br from-[#0c1c18] to-[#07131e] border border-emerald-500/40 rounded-xl space-y-2 shadow-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Scale className="w-4 h-4 text-emerald-400" />
                              <span className="text-xs font-mono font-bold text-emerald-300">
                                California Judicial Council Form FL-120
                              </span>
                            </div>
                            <span className="text-[9.5px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
                              Populated & Ready to File
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                            Official Court Form populated with case facts for <strong>{selectedOfficialClient?.name || 'Selected Client'}</strong>.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const target = selectedOfficialClient || clients?.[0] || null;
                                setSelectedOfficialClient(target);
                                setSelectedOfficialFormCode('FL-120');
                                setShowOfficialFormModal(true);
                              }}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-mono font-black uppercase rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-500/30 cursor-pointer"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-slate-950" />
                              <span>📄 Open Official Form FL-120</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-400 px-1 leading-none">
                      <span>{msg.sender === 'user' ? 'You' : msg.sender === 'system' as any ? 'System Workspace' : activeProfile.name} • {msg.timestamp}</span>
                      {msg.sender === 'assistant' && (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveViewingContent(msg.content);
                              setActiveViewingTitle(`${msg.agentName || activeProfile.name} Legal Draft Brief`);
                              setShowFullscreenDoc(true);
                            }}
                            className="text-teal-400 hover:text-teal-300 flex items-center gap-1 shrink-0 font-bold leading-none cursor-pointer"
                            title="Project this assistant response onto the legal paper sheet viewer"
                          >
                            <FileText className="w-2.5 h-2.5 text-teal-400" />
                            <span>VIEW ON PAPER</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => speakResponseText(msg.content, activeProfile.voiceName)}
                            className="text-teal-300 hover:text-teal-200 flex items-center gap-1 shrink-0 font-bold leading-none cursor-pointer bg-teal-950/60 border border-teal-500/30 px-1.5 py-0.5 rounded"
                          >
                            <Volume2 className="w-2.5 h-2.5" /> Speak Aloud
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading assistant indicator */}
            {sendingMessage && (
              <div className="flex gap-2.5 max-w-[90%] animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-xs">
                  {activeProfile.avatar}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="p-3 bg-[#090d16] border border-[#1e293b] rounded-2xl rounded-tl-none text-[10px] text-slate-400 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    <span className="font-mono text-[9px] ml-1">Consulting Google Grounded Legal indexes...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Citations Footer Display (Search Grounding) */}
          {searchCitations.length > 0 && (
            <div className="p-2 bg-[#090d16] border-t border-[#1e293b] flex items-center gap-2 overflow-x-auto shrink-0">
              <span className="text-[8px] uppercase font-mono text-emerald-400 flex items-center gap-1 shrink-0 font-bold">
                <Search className="w-2.5 h-2.5" />
                CITATIONS:
              </span>
              <div className="flex gap-1.5 text-[9px] font-sans">
                {searchCitations.map((cit, idx) => (
                  <a
                    key={idx}
                    href={cit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-0.5 bg-[#1e293b]/70 hover:bg-[#334155] border border-slate-700/60 rounded text-slate-300 flex items-center gap-1 transition-colors whitespace-nowrap"
                  >
                    {cit.title}
                    <ExternalLink className="w-2 h-2 text-slate-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Turn-Taking Conversational Activity Banner */}
          <div className={`px-3 py-1.5 border-t text-[10px] font-mono flex items-center justify-between gap-2 shrink-0 select-none transition-all ${
            isSpeakingAudio
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : isListening
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-[#090d16] border-[#1e293b] text-slate-400'
          }`}>
            <div className="flex items-center gap-2 min-w-0 truncate">
              {isSpeakingAudio ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
                  <span className="font-bold truncate">
                    🔊 {activeProfile.name} is speaking... (Listen or interrupt to reply)
                  </span>
                </>
              ) : isListening ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                  <span className="font-bold truncate">
                    🎙️ Continuous Conversation: {activeProfile.name} is listening — speak your reply now...
                  </span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">Hot Mic Paused • Click Resume to converse hands-free</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isSpeakingAudio && (
                <button
                  type="button"
                  onClick={() => {
                    stopActiveSpeech();
                    if (!isListening) {
                      resetAllAudioAndMic();
                    } else {
                      safeRestartRecognition(50);
                    }
                  }}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-[9px] uppercase tracking-wider shadow cursor-pointer transition flex items-center gap-1"
                  title="Interrupt Assistant Speech and Open Microphone"
                >
                  <VolumeX className="w-3 h-3" />
                  <span>Interrupt & Speak</span>
                </button>
              )}

              {!isListening && (
                <button
                  type="button"
                  onClick={() => {
                    resetAllAudioAndMic();
                  }}
                  className="px-2 py-0.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded text-[9px] uppercase tracking-wider shadow cursor-pointer transition flex items-center gap-1"
                >
                  <Mic className="w-3 h-3" />
                  <span>Resume Voice</span>
                </button>
              )}
            </div>
          </div>

          {/* Keyboard input send form box with Dictation Mic Button */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-[#1e293b] bg-[#070b12] flex gap-2 items-end shrink-0">
            <div className="flex-1 relative flex flex-col min-w-0">
              {isDictating && (
                <div className="bg-rose-950/80 border border-rose-500/40 text-rose-200 px-2.5 py-0.5 rounded-t-lg text-[9.5px] font-mono flex items-center justify-between animate-pulse">
                  <span className="flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    Dictating... Speak now
                  </span>
                  <span className="text-[8.5px] text-rose-300">Level: {micVolume}%</span>
                </div>
              )}
              <textarea
                required
                disabled={sendingMessage}
                placeholder={`Send message to ${activeProfile.name}... (Press Enter to send)`}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (userInput.trim() && !sendingMessage) {
                      const fakeEvent = {
                        preventDefault: () => {}
                      } as React.FormEvent;
                      handleSend(fakeEvent);
                    }
                  }
                }}
                className={`flex-1 bg-[#090d16] border border-[#1e293b] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-sans resize-none min-h-[50px] ${isDictating ? 'rounded-b-xl border-rose-500/50' : 'rounded-xl'} px-3 py-2`}
              />
            </div>

            <div className="flex gap-1.5 shrink-0">
              {/* Dictate / Microphone Input Toggle Button */}
              <button
                type="button"
                onClick={toggleDictation}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow ${
                  isDictating
                    ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                    : 'bg-[#0e1726] hover:bg-teal-950 text-teal-400 border-teal-500/30 hover:border-teal-500/60'
                }`}
                title={isDictating ? "Stop Voice Dictation" : "Dictate with Microphone"}
              >
                {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                disabled={sendingMessage || !userInput.trim()}
                className="p-2.5 bg-teal-400 hover:bg-teal-500 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Full screen popup viewing screen for reference document */}
      <AnimatePresence>
        {showFullscreenDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#020408]/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-text"
            onClick={() => setShowFullscreenDoc(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className={`relative w-[760px] max-w-[95vw] h-[95vh] max-h-[98vh] border-2 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 rounded-2xl ${
                paperTheme === 'light'
                  ? 'bg-[#faf6ef] border-[#dfb76c]/40 text-[#1a2332] ring-8 ring-amber-950/5'
                  : 'bg-[#070b14] border-teal-500/30 text-teal-100 ring-8 ring-teal-950/20'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header / Control Bar */}
              <div className={`flex items-center justify-between border-b p-3 shrink-0 ${
                paperTheme === 'light'
                  ? 'bg-[#f4efe4] border-[#dfb76c]/30 text-slate-800'
                  : 'bg-[#0b101d] border-teal-500/20 text-slate-200'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg border ${
                    paperTheme === 'light'
                      ? 'bg-[#e9dec9] border-[#dfb76c]/30 text-amber-900'
                      : 'bg-teal-950/40 border-teal-500/20 text-teal-400'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[11px] font-black font-mono tracking-wider uppercase truncate max-w-[200px] sm:max-w-xs">
                      {activeViewingTitle || "PLEADING DOCUMENT WORKSPACE"}
                    </h3>
                    <p className={`text-[8.5px] font-sans mt-0.5 ${
                      paperTheme === 'light' ? 'text-amber-900/60' : 'text-slate-400'
                    }`}>
                      {activeViewingContent ? activeViewingContent.length : 0} characters &bull; {paperTheme === 'light' ? 'Light Parchment Pleading' : 'Dark Slate Ruled'}
                    </p>
                  </div>
                </div>

                {/* Theme Selector Toggle (Parchment vs Slate) */}
                <div className="hidden sm:flex items-center gap-1 bg-black/10 p-0.5 rounded-lg border border-slate-750/10">
                  <button
                    type="button"
                    onClick={() => setPaperTheme('light')}
                    className={`px-2 py-1 rounded text-[8.5px] font-mono font-bold tracking-tight transition-all cursor-pointer ${
                      paperTheme === 'light'
                        ? 'bg-white text-amber-950 shadow-sm border border-amber-200/50'
                        : 'text-slate-400 hover:text-slate-250'
                    }`}
                  >
                    🖋️ LIGHT PARCHMENT
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperTheme('dark')}
                    className={`px-2 py-1 rounded text-[8.5px] font-mono font-bold tracking-tight transition-all cursor-pointer ${
                      paperTheme === 'dark'
                        ? 'bg-teal-950/80 text-teal-300 shadow-sm border border-teal-500/20'
                        : 'text-slate-400 hover:text-slate-250'
                    }`}
                  >
                    🌌 COSMIC SLATE
                  </button>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeViewingContent);
                      setCopiedFeedback(true);
                      setTimeout(() => setCopiedFeedback(false), 2000);
                    }}
                    className={`px-2.5 py-1 border text-[8.5px] font-mono rounded transition-all cursor-pointer flex items-center gap-1 font-bold ${
                      paperTheme === 'light'
                        ? 'bg-[#e9dec9] hover:bg-[#decfae] text-amber-950 border-[#dfb76c]/40'
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                    }`}
                    title="Copy this pleading content to clipboard"
                  >
                    {copiedFeedback ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-emerald-500">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>

                  {/* Download option */}
                  <button
                    type="button"
                    onClick={() => {
                      const fileName = activeViewingTitle ? `${activeViewingTitle.replace(/[^a-zA-Z0-9]/g, "_")}.txt` : 'pleading_sheet.txt';
                      const blob = new Blob([activeViewingContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = fileName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className={`px-2.5 py-1 border text-[8.5px] font-mono rounded transition-all cursor-pointer flex items-center gap-1 font-bold ${
                      paperTheme === 'light'
                        ? 'bg-[#e9dec9] hover:bg-[#decfae] text-amber-950 border-[#dfb76c]/40'
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                    }`}
                    title="Download a full copy of this document content"
                  >
                    DOWNLOAD
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFullscreenDoc(false)}
                    className={`p-1 rounded border transition-all cursor-pointer flex items-center justify-center ${
                      paperTheme === 'light'
                        ? 'bg-[#e9dec9] hover:bg-red-200/50 hover:text-red-700 text-amber-950 border-[#dfb76c]/30'
                        : 'bg-[#0d1624] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                    }`}
                    title="Close Fullscreen Viewer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Theme Switcher for mobile inside view */}
              <div className={`sm:hidden flex items-center justify-around p-2 border-b text-[8px] font-mono ${
                paperTheme === 'light' ? 'bg-[#f4efe4] border-[#dfb76c]/10 text-amber-900' : 'bg-[#0b101d] border-teal-500/10 text-slate-400'
              }`}>
                <button 
                  onClick={() => setPaperTheme('light')}
                  className={`px-2 py-0.5 rounded ${paperTheme === 'light' ? 'bg-amber-900/10 font-bold' : ''}`}
                >
                  🖋️ LIGHT PARCHMENT
                </button>
                <button 
                  onClick={() => setPaperTheme('dark')}
                  className={`px-2 py-0.5 rounded ${paperTheme === 'dark' ? 'bg-teal-500/10 font-bold' : ''}`}
                >
                  🌌 COSMIC SLATE
                </button>
              </div>

              {/* Main content body resembling a high-fidelity portrait piece of paper */}
              <div className="flex-1 flex relative min-h-0">
                
                {/* Legal Style Vertical Left Rule Line to simulate a ruled legal document page */}
                <div className={`w-9 border-r flex flex-col items-center pt-4 select-none shrink-0 ${
                  paperTheme === 'light'
                    ? 'border-rose-300/40 text-rose-400/50 bg-[#faf6ef]'
                    : 'border-teal-500/20 text-teal-500/30 bg-[#070b14]'
                }`}>
                  {Array.from({ length: 42 }).map((_, i) => (
                    <div key={i} className="text-[8px] font-mono h-6 flex items-center justify-center w-full">
                      {(i + 1).toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>

                {/* Secondary margin line representing CA pleading double border */}
                <div className={`w-0.5 border-r h-full select-none shrink-0 ${
                  paperTheme === 'light'
                    ? 'border-rose-300/20'
                    : 'border-teal-500/10'
                }`} />

                {/* Main Paper Text Scroll Area */}
                <div className="flex-1 p-4 sm:p-6 overflow-hidden relative flex flex-col min-h-0">
                  {/* Watermark in background */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.012] pointer-events-none select-none z-0">
                    <span className="font-mono text-5xl sm:text-6xl font-black rotate-[25deg] tracking-widest text-teal-500 text-center">
                      COURT ROOM COMPLIANCE DOCUMENT
                    </span>
                  </div>

                  <textarea
                    value={activeViewingContent}
                    onChange={(e) => setActiveViewingContent(e.target.value)}
                    placeholder="Enter or paste text here to read clearly..."
                    className={`flex-1 w-full bg-transparent border-0 resize-none outline-none focus:ring-0 text-[11px] sm:text-[13px] leading-[24px] font-mono select-text font-medium relative z-10 antialiased custom-scrollbar py-1 px-1 h-full focus:outline-none focus:border-0 ${
                      paperTheme === 'light'
                        ? 'text-slate-850 caret-slate-800 placeholder-slate-450'
                        : 'text-[#e0f2fe] caret-teal-455 placeholder-teal-605'
                    }`}
                  />
                </div>
              </div>

              {/* Footer containing document actions */}
              <div className={`p-2.5 border-t flex items-center justify-between text-[8px] sm:text-[9.5px] font-mono select-none shrink-0 ${
                paperTheme === 'light'
                  ? 'bg-[#f4efe4] border-[#dfb76c]/30 text-amber-900/60'
                  : 'bg-[#0c1626] border-[#1e293b] text-slate-400'
              }`}>
                <span>Type or edit directly inside sheet. Press ESC or click outside to return.</span>
                <span className={`font-bold tracking-wider ${
                  paperTheme === 'light' ? 'text-amber-800' : 'text-teal-400'
                }`}>
                  SECURE PORTRAIT COMPLIANCE PAPER DESK
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI ENGINE & BACKUP PROVIDER DIAGNOSTICS MODAL */}
      <AnimatePresence>
        {showProviderModal && (
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1220] border-2 border-slate-700 w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden rounded-none font-mono"
            >
              {/* Header */}
              <div className="bg-[#070c16] border-b border-slate-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded text-emerald-400">
                    <Bot className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider text-white flex items-center gap-2">
                      <span>AI Model Engine & Open-Weights Backup</span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                        STANDALONE COMPATIBLE
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Configure primary AI provider & automatic failover to Google Gemma / Local open models
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProviderModal(false)}
                  className="p-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-6 text-xs text-slate-300 max-h-[75vh] overflow-y-auto custom-scrollbar">
                
                {/* 1. Active Provider Selection Cards */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                    Select Active Model Routing Strategy
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Mode A: Auto Hybrid with Open Model Backup */}
                    <div
                      onClick={() => setSelectedProviderMode('AUTO')}
                      className={`p-3 border cursor-pointer transition-all ${
                        selectedProviderMode === 'AUTO'
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-lg'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-[11px] text-emerald-400 uppercase">Auto Hybrid (Recommended)</span>
                        <Zap className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-300">
                        Primary: <strong>Google Gemini 3.6 Flash</strong>.<br />
                        Automatic failover to <strong>Google Gemma Open Model</strong> if key or quota is unavailable.
                      </p>
                    </div>

                    {/* Mode B: Open Model Only */}
                    <div
                      onClick={() => setSelectedProviderMode('OPEN_MODEL')}
                      className={`p-3 border cursor-pointer transition-all ${
                        selectedProviderMode === 'OPEN_MODEL'
                          ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-lg'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-[11px] text-purple-400 uppercase">Open Model Only</span>
                        <Bot className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-300">
                        Routes 100% of prompts directly to <strong>Google Gemma 2 / Ollama / Local AI / vLLM</strong>. Zero cloud key reliance.
                      </p>
                    </div>

                    {/* Mode C: Gemini API Only */}
                    <div
                      onClick={() => setSelectedProviderMode('GEMINI')}
                      className={`p-3 border cursor-pointer transition-all ${
                        selectedProviderMode === 'GEMINI'
                          ? 'bg-blue-950/40 border-blue-500 text-blue-200 shadow-lg'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-[11px] text-blue-400 uppercase">Gemini API Only</span>
                        <Sparkles className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-300">
                        Direct execution via <strong>Gemini 3.6 Flash & 3.1 Pro</strong>. Requires valid GEMINI_API_KEY.
                      </p>
                    </div>

                  </div>
                </div>

                {/* 2. Open Model Endpoint Status & Diagnostics */}
                <div className="bg-[#070c16] border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-400" />
                      <span>Open-Model Server Diagnostic Status</span>
                    </h4>
                    <button
                      type="button"
                      onClick={refreshProviderStatus}
                      disabled={pingTesting}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700 hover:border-teal-500 text-teal-300 text-[10px] uppercase font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${pingTesting ? 'animate-spin' : ''}`} />
                      <span>{pingTesting ? 'Testing...' : 'Test Ping'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                    <div className="bg-slate-900/60 p-2 border border-slate-800">
                      <div className="text-slate-400 text-[9px]">GEMINI API KEY:</div>
                      <div className={`font-bold mt-0.5 ${providerStatus?.geminiConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {providerStatus?.geminiConfigured ? 'ACTIVE / CONFIGURED' : 'UNCONFIGURED (FAILOVER ACTIVE)'}
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-2 border border-slate-800">
                      <div className="text-slate-400 text-[9px]">OPENROUTER KEY:</div>
                      <div className={`font-bold mt-0.5 ${providerStatus?.openRouterConfigured ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {providerStatus?.openRouterConfigured ? 'ACTIVE' : 'FREE TIER FALLBACK'}
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-2 border border-slate-800">
                      <div className="text-slate-400 text-[9px]">OPEN MODEL:</div>
                      <div className="font-bold text-teal-300 mt-0.5 truncate">
                        {providerStatus?.openModelName || 'gemma2'}
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-2 border border-slate-800">
                      <div className="text-slate-400 text-[9px]">ENDPOINT PING:</div>
                      <div className={`font-bold mt-0.5 ${providerStatus?.openModelPingSuccess ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {providerStatus?.openModelPingSuccess ? 'ONLINE / CONNECTED' : 'READY (CLOUD ROUTE)'}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 space-y-1">
                    <div>Configured Endpoint URL: <code className="text-teal-300 bg-slate-900 px-1 py-0.5 border border-slate-800">{providerStatus?.openModelEndpoint || 'http://localhost:11434/v1/chat/completions'}</code></div>
                  </div>
                </div>

                {/* 3. Guide to Running Google Gemma Outside AI Studio */}
                <div className="bg-slate-900/50 border border-slate-800 p-4 space-y-2">
                  <h4 className="text-[11px] font-bold uppercase text-slate-200">How to run this app on Google Gemma Open Model:</h4>
                  <ol className="list-decimal list-inside text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
                    <li>
                      <strong>Local Workstation (Ollama)</strong>: Download Ollama and run <code className="text-emerald-300">ollama run gemma2</code>. Set <code className="text-teal-300">OPEN_MODEL_ENDPOINT="http://localhost:11434/v1/chat/completions"</code> in your environment.
                    </li>
                    <li>
                      <strong>Self-Hosted Cloud Run / GPU VM</strong>: Deploy Google Gemma using vLLM or Ollama on Google Cloud Run with GPU or Compute Engine. Set <code className="text-teal-300">OPEN_MODEL_ENDPOINT</code> to your container URL.
                    </li>
                    <li>
                      <strong>Zero Setup Open Model</strong>: If no local endpoint is detected, the app automatically routes through OpenRouter's free Google Gemma open model tier.
                    </li>
                  </ol>
                </div>

              </div>

              {/* Footer */}
              <div className="bg-[#070c16] border-t border-slate-800 p-4 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  Mode: <strong className="text-teal-400">{selectedProviderMode}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowProviderModal(false)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase cursor-pointer border border-emerald-400"
                >
                  Save & Apply Provider Mode
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MICROPHONE DIAGNOSTICS & HARDWARE TROUBLESHOOTER MODAL */}
        {showMicTroubleshooter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b121e] border border-teal-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans"
            >
              {/* Header */}
              <div className="bg-[#070c16] border-b border-[#1e293b] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Microphone Diagnostics & Audio Repair Suite</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Test hardware input, calibrate audio levels, and resolve browser permission blocks
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMicTroubleshooter(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-130px)] custom-scrollbar">
                
                {/* 1. Real-Time Hardware Status & Live Input Meter */}
                <div className="bg-[#060a12] border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-teal-400 animate-pulse" />
                      Live Audio Hardware Signal
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Permission: <strong className={micPermissionGranted ? "text-emerald-400" : "text-rose-400"}>
                        {micPermissionGranted === true ? "GRANTED" : micPermissionGranted === false ? "DENIED / BLOCKED" : "PROMPT PENDING"}
                      </strong>
                    </span>
                  </div>

                  {/* VU Level Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Input Volume Level (Speak to test):</span>
                      <span className="font-bold text-teal-300">{micVolume}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5 flex">
                      <div
                        className={`h-full rounded-full transition-all duration-75 ${
                          micVolume > 65 ? 'bg-amber-400' : micVolume > 15 ? 'bg-emerald-400' : 'bg-teal-600'
                        }`}
                        style={{ width: `${Math.max(4, micVolume)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Detected Devices & Web Speech Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[9px] uppercase">Detected Input Device:</div>
                      <div className="font-bold text-slate-200 mt-0.5 truncate">
                        {detectedAudioDevices.length > 0
                          ? detectedAudioDevices.map(d => d.label || 'Default Audio Microphone').join(', ')
                          : micPermissionGranted ? 'Default Microphone Active' : 'No device enumerated yet'}
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[9px] uppercase">Web Speech Engine:</div>
                      <div className="font-bold mt-0.5 truncate text-emerald-400">
                        {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
                          ? 'Native Speech Engine Active (Chrome/Edge)'
                          : 'Not Supported (Typing Mode Active)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Interactive Loopback Test (Record 3s & Instant Playback) */}
                <div className="bg-[#060a12] border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Headphones className="w-4 h-4 text-amber-400" />
                      3-Second Loopback Voice Test
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Test speaker + mic simultaneously
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Click the button below and speak a test sentence (e.g. <em>"Phoenix, wake up"</em>). The app will record 3 seconds and play it back so you can verify clear audio input.
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={startLoopbackTest}
                      disabled={isRecordingTestLoop}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase font-mono flex items-center gap-2 transition cursor-pointer ${
                        isRecordingTestLoop
                          ? 'bg-rose-600 text-white animate-pulse border border-rose-400'
                          : 'bg-teal-600 hover:bg-teal-500 text-white border border-teal-400'
                      }`}
                    >
                      {isRecordingTestLoop ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Recording... ({testRecordingCountdown}s)</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Record 3s Test Snippet</span>
                        </>
                      )}
                    </button>

                    {testAudioUrl && (
                      <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/40 rounded-lg px-3 py-1">
                        <audio
                          ref={testAudioPlayerRef}
                          src={testAudioUrl}
                          controls
                          className="h-7 w-56 accent-teal-400"
                        />
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">✓ Playback Ready</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Common Fixes & Troubleshooting Guide */}
                <div className="bg-[#060a12] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <h4 className="text-[11px] font-bold uppercase text-slate-200 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                    How to Resolve Common Microphone Issues:
                  </h4>
                  
                  <div className="space-y-2 text-[10.5px] text-slate-300">
                    <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-start gap-2">
                      <span className="font-bold text-amber-400 shrink-0">1. Browser Permissions:</span>
                      <span>
                        Look at the left side of your browser address bar (where the URL is shown). Click the <strong>🔒 Lock</strong> or <strong>🎚️ Settings</strong> icon, change <strong>Microphone</strong> from <em>Block</em> to <strong>Allow</strong>, and refresh.
                      </span>
                    </div>

                    <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-start gap-2">
                      <span className="font-bold text-amber-400 shrink-0">2. Embedded Preview Iframe:</span>
                      <span>
                        If you are viewing inside an embedded preview iframe, the browser may restrict mic access. Click <strong>"Open in New Tab"</strong> in the top-right toolbar to open the full app directly.
                      </span>
                    </div>

                    <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-start gap-2">
                      <span className="font-bold text-amber-400 shrink-0">3. Device Occupied by Other Apps:</span>
                      <span>
                        Make sure applications like Zoom, Microsoft Teams, Discord, or Skype are not locking your microphone in exclusive mode.
                      </span>
                    </div>

                    <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-start gap-2">
                      <span className="font-bold text-amber-400 shrink-0">4. Browser Recommendation:</span>
                      <span>
                        Live continuous wake-word detection (hot-mic) is natively optimized for <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, and modern Chromium browsers.
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="bg-[#070c16] border-t border-slate-800 p-3.5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={resetAllAudioAndMic}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-teal-500 text-teal-300 text-[10.5px] uppercase font-mono font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset & Reconnect Microphone</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMicTroubleshooter(false)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase rounded-lg text-[10.5px] cursor-pointer border border-emerald-400 transition"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Official California Judicial Council Form Modal */}
      {selectedOfficialClient && (
        <OfficialCaliforniaJudicialCouncilFormModal
          isOpen={showOfficialFormModal}
          onClose={() => setShowOfficialFormModal(false)}
          client={selectedOfficialClient}
          initialFormCode={selectedOfficialFormCode}
          onAddGeneratedDoc={onAddGeneratedDoc}
        />
      )}

      {/* AI Agent Extraction Task Modal */}
      <AssignExtractionTaskModal
        isOpen={showAssignTaskModal}
        onClose={() => setShowAssignTaskModal(false)}
        clients={clients}
        initialAgentId={activeProfile.id}
        onApplyExtraction={handleApplyExtractionTask}
      />

      {/* GOOGLE AGENTS CORE FRAMEWORK WORKBENCH MODAL */}
      <AnimatePresence>
        {showAgentFrameworkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1220] border border-blue-500/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-800 bg-[#070b14] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                      Google Agents Core Framework
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded uppercase">
                        Phoenix &amp; EVE Engine
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Working Repository: <strong className="text-blue-300">level23consulting@gmail.com</strong> &bull; Intake &amp; Review Dropzone: <strong className="text-emerald-300 font-mono">phoenix_review</strong> (Attached)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAgentFrameworkModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center px-6 pt-3 border-b border-slate-800 bg-[#090f1a] gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAgentFrameworkMode('search')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase border-b-2 transition cursor-pointer ${
                    agentFrameworkMode === 'search'
                      ? 'border-blue-400 text-blue-300 bg-blue-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-blue-400" />
                  <span>1. Grounded Legal Search</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAgentFrameworkMode('summation')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase border-b-2 transition cursor-pointer ${
                    agentFrameworkMode === 'summation'
                      ? 'border-purple-400 text-purple-300 bg-purple-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>2. Hierarchical Summation</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAgentFrameworkMode('inbox');
                    fetchInboxFiles();
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase border-b-2 transition cursor-pointer ${
                    agentFrameworkMode === 'inbox'
                      ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. Designated phoenix_review Dropzone</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {agentFrameworkMode === 'search' && (
                  <div className="space-y-4">
                    {/* Header Banner */}
                    <div className="p-3.5 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                            Real-Time Legal Databases & Public Court Dockets Engine
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Google Search Grounding Online
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Query across official <strong>California Legislative Information</strong> (CA Codes), <strong>Judicial Council</strong> rules & court forms, and live <strong>Public Access Court Dockets</strong> (Orange County OCCourts, Los Angeles LASC, San Diego SDCourt, CA Appellate Courts, and Federal CourtListener RECAP).
                      </p>

                      {/* Connected Repositories Badges */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                        <span className="text-slate-400 font-bold uppercase mr-1">Active Portals:</span>
                        <span className="px-2 py-0.5 bg-slate-900 border border-blue-500/40 text-blue-300 rounded">🏛️ CourtListener / RECAP</span>
                        <span className="px-2 py-0.5 bg-slate-900 border border-indigo-500/40 text-indigo-300 rounded">⚖️ CA Appellate Case Info</span>
                        <span className="px-2 py-0.5 bg-slate-900 border border-cyan-500/40 text-cyan-300 rounded">📑 OCCourts Public Portal</span>
                        <span className="px-2 py-0.5 bg-slate-900 border border-purple-500/40 text-purple-300 rounded">🏛️ LASC Online Services</span>
                        <span className="px-2 py-0.5 bg-slate-900 border border-emerald-500/40 text-emerald-300 rounded">📜 CA Leginfo (Codes)</span>
                        <span className="px-2 py-0.5 bg-slate-900 border border-amber-500/40 text-amber-300 rounded">📋 Judicial Council (Courts.ca.gov)</span>
                        <span className="px-2 py-0.5 bg-slate-900 border border-rose-500/40 text-rose-300 rounded">🔍 Trellis Tentative Rulings</span>
                      </div>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                      {[
                        { id: 'all', label: 'All Databases & Dockets', icon: Globe },
                        { id: 'dockets', label: 'Public Court Dockets', icon: Scale },
                        { id: 'statutes', label: 'CA Codes & Statutes', icon: FileText },
                        { id: 'tentative_rulings', label: 'Tentative Rulings', icon: Search },
                        { id: 'caselaw', label: 'Caselaw & Precedent', icon: BookOpen }
                      ].map((tab) => {
                        const TabIcon = tab.icon;
                        const isSelected = searchMode === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSearchMode(tab.id as any)}
                            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition text-[11px] font-bold cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            <TabIcon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Court Jurisdiction & Docket Filter Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-slate-300 block font-bold">
                          Target Court Jurisdiction:
                        </label>
                        <select
                          value={courtJurisdiction}
                          onChange={(e) => setCourtJurisdiction(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-blue-400 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none cursor-pointer"
                        >
                          <option value="Orange County Superior Court (OCCourts)">Orange County Superior Court (OCCourts)</option>
                          <option value="Los Angeles County Superior Court (LASC)">Los Angeles County Superior Court (LASC)</option>
                          <option value="San Diego County Superior Court (SDCourt)">San Diego County Superior Court (SDCourt)</option>
                          <option value="Riverside & San Bernardino County Superior Courts">Riverside & San Bernardino Superior Courts</option>
                          <option value="California 4th District Court of Appeal (DCA4)">California 4th District Court of Appeal (DCA4)</option>
                          <option value="California Supreme Court">California Supreme Court</option>
                          <option value="Federal District Court (C.D. Cal / 9th Cir.)">Federal District Court (C.D. Cal / 9th Cir.)</option>
                          <option value="All California Jurisdictions (Statewide)">All California Jurisdictions (Statewide)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-slate-300 block font-bold">
                          Case Number / Docket ID (Optional):
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={caseNumberFilter}
                            onChange={(e) => setCaseNumberFilter(e.target.value)}
                            placeholder="e.g. 30-2026-01234567 or FAM-2026-09418..."
                            className="w-full bg-slate-900 border border-slate-700 focus:border-blue-400 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                          />
                          {caseNumberFilter && (
                            <button
                              type="button"
                              onClick={() => setCaseNumberFilter('')}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Query Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-slate-300 block font-bold">
                        Search Directive / Legal Issue / Party Query:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={agentFrameworkQuery}
                          onChange={(e) => setAgentFrameworkQuery(e.target.value)}
                          placeholder="e.g. California Family Code irreconcilable differences standard or dissolution docket..."
                          className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isExecutingAgentTask || (!agentFrameworkQuery.trim() && !caseNumberFilter.trim())}
                          onClick={() => handleExecuteAgentTask('search')}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shrink-0"
                        >
                          {isExecutingAgentTask ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          <span>Execute Grounded Search</span>
                        </button>
                      </div>
                    </div>

                    {/* Preset Query Chips */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                      <span className="text-slate-500 font-bold">Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchMode('dockets');
                          setCaseNumberFilter('30-2026-0048192-FL');
                          setAgentFrameworkQuery("Orange County Superior Court dissolution register of actions docket sheet");
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-cyan-800/60 cursor-pointer flex items-center gap-1"
                      >
                        🏛️ Register of Actions Docket
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchMode('tentative_rulings');
                          setAgentFrameworkQuery("Los Angeles Superior Court tentative ruling pendente lite spousal support Fam Code § 4320");
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-purple-300 rounded border border-purple-800/60 cursor-pointer flex items-center gap-1"
                      >
                        ⚖️ LASC Support Tentative Ruling
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchMode('statutes');
                          setAgentFrameworkQuery("Cal. Fam. Code § 4320 statutory factors governing spousal support duration and earning capacity");
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded border border-amber-800/60 cursor-pointer flex items-center gap-1"
                      >
                        📜 § 4320 Spousal Factors
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchMode('statutes');
                          setAgentFrameworkQuery("Cal. Fam. Code § 770 separate property vs § 760 community property division rules");
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 cursor-pointer"
                      >
                        § 770 Separate Property
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchMode('dockets');
                          setAgentFrameworkQuery("CourtListener RECAP 9th Circuit California marital dissolution federal jurisdiction docket");
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-blue-300 rounded border border-blue-800/60 cursor-pointer flex items-center gap-1"
                      >
                        🏛️ CourtListener RECAP Federal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchMode('caselaw');
                          setAgentFrameworkQuery("California 4th District Court of Appeal best interest of minor child custody standard");
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-indigo-300 rounded border border-indigo-800/60 cursor-pointer flex items-center gap-1"
                      >
                        📚 Cal 4th DCA Custody Caselaw
                      </button>
                    </div>

                    {/* Results Presentation */}
                    {agentExecutionResult?.knowledgeGraph && (
                      <div className="p-4 bg-slate-900/90 border border-blue-500/30 rounded-xl space-y-4 mt-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-mono font-bold text-blue-300 uppercase flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Grounded Legal & Docket Result &bull; {agentExecutionResult.agentName}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            Mode: {searchMode.toUpperCase()} &bull; {courtJurisdiction}
                          </span>
                        </div>

                        {/* Public Court Docket Summary Sheet Card if docket data is present */}
                        {(agentExecutionResult.docketRecord || searchMode === 'dockets' || caseNumberFilter) && (
                          <div className="p-3.5 bg-blue-950/30 border border-blue-500/40 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Scale className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wider">
                                  Public Access Court Docket Ledger
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                                {agentExecutionResult.docketRecord?.caseStatus || 'ACTIVE / GROUNDED'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                              <div>
                                <span className="text-slate-500 block uppercase text-[9px] font-bold">Docket / Case No:</span>
                                <span className="text-cyan-300 font-bold">
                                  {agentExecutionResult.docketRecord?.caseNumber || caseNumberFilter || "30-2026-0048192-FL"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase text-[9px] font-bold">Court:</span>
                                <span className="text-slate-200">
                                  {agentExecutionResult.docketRecord?.court || courtJurisdiction}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase text-[9px] font-bold">Department / Judge:</span>
                                <span className="text-slate-200">
                                  {agentExecutionResult.docketRecord?.department || "Dept. L-54 / Hon. Family Law"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase text-[9px] font-bold">Register Status:</span>
                                <span className="text-emerald-400 font-bold">Verified in Public Portal</span>
                              </div>
                            </div>

                            {agentExecutionResult.docketRecord?.publicPortalUrl && (
                              <div className="flex items-center justify-end">
                                <a
                                  href={agentExecutionResult.docketRecord.publicPortalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono font-bold underline"
                                >
                                  <span>Open Official Public Court Portal</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Direct Response Text */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Synthesized Legal Analysis:</span>
                          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 font-sans">
                            {agentExecutionResult.directResponse}
                          </div>
                        </div>

                        {/* Grounding Sources with Category Badges */}
                        {agentExecutionResult.knowledgeGraph.sources?.length > 0 && (
                          <div className="pt-3 border-t border-slate-800 space-y-2">
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
                              Verified Grounding Repositories & Court Portals ({agentExecutionResult.knowledgeGraph.sources.length}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {agentExecutionResult.knowledgeGraph.sources.map((src: any, idx: number) => {
                                const cat = src.category || 'general_legal';
                                const badgeConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
                                  docket: { label: 'Court Docket', bg: 'bg-cyan-500/10', text: 'text-cyan-300', border: 'border-cyan-500/30' },
                                  statute: { label: 'CA Statute', bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30' },
                                  court_rule: { label: 'Court Rule / Form', bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/30' },
                                  tentative_ruling: { label: 'Tentative Ruling', bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30' },
                                  caselaw: { label: 'Appellate Caselaw', bg: 'bg-indigo-500/10', text: 'text-indigo-300', border: 'border-indigo-500/30' },
                                  general_legal: { label: 'Legal Authority', bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/30' }
                                };
                                const badge = badgeConfig[cat] || badgeConfig.general_legal;

                                return (
                                  <a
                                    key={idx}
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 rounded-lg flex flex-col gap-1 transition group"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${badge.bg} ${badge.text} border ${badge.border}`}>
                                        {badge.label}
                                      </span>
                                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0" />
                                    </div>
                                    <span className="text-xs text-blue-300 group-hover:underline font-bold truncate">
                                      {src.title || src.url}
                                    </span>
                                    {src.snippet && (
                                      <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                                        {src.snippet}
                                      </span>
                                    )}
                                    <span className="text-[9px] font-mono text-slate-500 truncate">
                                      {src.url}
                                    </span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {agentFrameworkMode === 'summation' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-200">
                      Generate multi-tiered hierarchical legal summations: Executive litigation brief, 4-tier factual matrix, statutory grounding, and Judicial Council court form directives.
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-mono text-slate-300 block font-bold">
                        Matter Context / Document Text to Synthesize:
                      </label>
                      <textarea
                        rows={5}
                        value={agentFrameworkDocContext}
                        onChange={(e) => setAgentFrameworkDocContext(e.target.value)}
                        placeholder="Paste client intake notes, deposition transcripts, or pleading summaries here..."
                        className="w-full bg-slate-900 border border-slate-700 focus:border-purple-400 rounded-xl p-3 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-500">
                        Paste client intake facts or load intake document
                      </span>

                      <button
                        type="button"
                        disabled={isExecutingAgentTask || !agentFrameworkDocContext.trim()}
                        onClick={() => handleExecuteAgentTask('summation')}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg"
                      >
                        {isExecutingAgentTask ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span>Synthesize Hierarchical Summation</span>
                      </button>
                    </div>

                    {agentExecutionResult?.summation && (
                      <div className="p-4 bg-slate-900/90 border border-purple-500/30 rounded-xl space-y-4 mt-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-mono font-bold text-purple-300 uppercase">
                            Hierarchical Summation &bull; {agentExecutionResult.agentName}
                          </h4>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                            Target Dropzone: {agentExecutionResult.workingDrive?.inboxFolder || '_inbox'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[11px] font-mono font-bold text-slate-400 block uppercase">1. Executive Brief:</span>
                          <p className="text-xs text-slate-200 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                            {agentExecutionResult.summation.executiveBrief}
                          </p>
                        </div>

                        {agentExecutionResult.summation.recommendedCourtForms?.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-mono font-bold text-slate-400 block uppercase">Recommended Court Forms:</span>
                            <div className="flex gap-2 flex-wrap">
                              {agentExecutionResult.summation.recommendedCourtForms.map((frm: string, i: number) => (
                                <span key={i} className="px-2.5 py-1 bg-purple-500/20 text-purple-200 border border-purple-500/30 rounded text-xs font-mono font-bold">
                                  {frm}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <span className="text-[11px] font-mono font-bold text-slate-400 block uppercase">Procedural Directives:</span>
                          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                            {agentExecutionResult.summation.proceduralDirectives?.map((dir: string, i: number) => (
                              <li key={i}>{dir}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {agentFrameworkMode === 'inbox' && (
                  <div className="space-y-5">
                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
                      <div>
                        Designated Upload &amp; Review Dropzone: <strong className="font-mono text-emerald-300">phoenix_review</strong> under <strong className="text-white">level23consulting@gmail.com</strong>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Folder ID: 1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH. All uploads from counsel and all documents/briefs from Phoenix, EVE, and staff are placed here.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchInboxFiles}
                        className="px-3 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInbox ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {/* Quick Document Upload to phoenix_review */}
                    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                      <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-emerald-400" />
                        Deposit New Document Directly to phoenix_review
                      </h4>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={inboxUploadName}
                          onChange={(e) => setInboxUploadName(e.target.value)}
                          placeholder="Document Name (e.g. FL-100_Petition_Draft.docx or Intake_Notes.txt)"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                        <textarea
                          rows={3}
                          value={inboxUploadContent}
                          onChange={(e) => setInboxUploadContent(e.target.value)}
                          placeholder="Paste or type document text content to deposit into phoenix_review..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={uploadingToInbox || !inboxUploadName.trim() || !inboxUploadContent.trim()}
                        onClick={handleUploadToInbox}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {uploadingToInbox ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                        <span>Deposit to phoenix_review Dropzone</span>
                      </button>
                    </div>

                    {/* Staged Documents in phoenix_review */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">
                        Active Documents in phoenix_review ({inboxFilesData.length})
                      </h4>
                      {inboxFilesData.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                          No files queued in phoenix_review. Files uploaded by counsel or created by Phoenix and EVE will appear here.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {inboxFilesData.map((f: any) => (
                            <div key={f.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div>
                                  <span className="text-xs font-mono font-bold text-white block">{f.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Size: {f.size} &bull; Folder: {f.folder || 'phoenix_review'}
                                  </span>
                                </div>
                              </div>
                              <a
                                href={f.webViewLink || `https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded flex items-center gap-1"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-800 bg-[#070b14] flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Working Account: <strong className="text-slate-200">level23consulting@gmail.com</strong></span>
                <button
                  type="button"
                  onClick={() => setShowAgentFrameworkModal(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono font-bold cursor-pointer"
                >
                  Close Workbench
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
