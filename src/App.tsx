import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  RefreshCw,
  Clock,
  Terminal,
  Server,
  Zap,
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  FileText,
  Volume2,
  Activity,
  Award,
  ChevronDown,
  Laptop,
  Monitor,
  Search,
  Keyboard,
  X,
  Maximize2,
  Minimize2,
  Cpu
} from 'lucide-react';

import { Client, Matter, ActivityLog, GeneratedDocument, LegalMessage, AgentProgress, ConsultationSession, EvidenceFile } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientsTab from './components/ClientsTab';
import MattersTab from './components/MattersTab';
import DocumentsTab from './components/DocumentsTab';
import AIStaffTab from './components/AIStaffTab';
import VoiceEngineTab from './components/VoiceEngineTab';
import SystemHealthTab from './components/SystemHealthTab';
import ConsultationsTab from './components/ConsultationsTab';
import BackupsTab, { ImportedState } from './components/BackupsTab';
import ResearchPortalDrawer from './components/ResearchPortalDrawer';
import ClientPortalTab from './components/ClientPortalTab';
import { Scale, BookOpen, Database, CloudOff, CloudLightning } from 'lucide-react';

import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, ensureAuthenticated, handleFirestoreError, OperationType } from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [systemConnected, setSystemConnected] = useState<boolean>(false);
  const [utcTime, setUtcTime] = useState<string>('');
  const [showResearchDrawer, setShowResearchDrawer] = useState<boolean>(false);

  // Firestore synchronization states
  const [dbSyncStatus, setDbSyncStatus] = useState<'offline' | 'connecting' | 'synced' | 'error'>('connecting');
  const [syncMessage, setSyncMessage] = useState<string>('Connecting to persistent cloud memory...');

  // Native desktop app simulation states
  const [isDesktopMode, setIsDesktopMode] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showShortcutsGuide, setShowShortcutsGuide] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [commandSearch, setCommandSearch] = useState<string>('');

  // Chronological Audit events
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    { id: 'log-1', type: 'system', message: 'Level 23 Secure Environment Bootstrapped.', timestamp: '12:56:29' },
    { id: 'log-2', type: 'system', message: 'IndexDB cache registers initialized.', timestamp: '12:56:30' }
  ]);

  // Master local client records
  const [clients, setClients] = useState<Client[]>([
    {
      id: 'c-1',
      name: 'Eleanor Vance',
      email: 'eleanor.vance@gmail.com',
      phone: '+1 (415) 304-9271',
      status: 'active',
      intakeNotes: `Client Eleanor Vance seeks assistance regarding joint custody dissolution under CA codes.
      Separation date was reported as April 10th. Marriage date was July 2nd, 2012. Two minor children are involved.
      She seeks spousal support limits audit and partition of cooperative townhouse asset.`,
      createdAt: '2026-04-10T14:22:00Z',
      practiceArea: 'Family Law'
    },
    {
      id: 'c-2',
      name: 'Mateo Rodriguez',
      email: 'm.rodriguez@fastmail.com',
      phone: '+1 (510) 902-8344',
      status: 'active',
      intakeNotes: `Mateo Rodriguez is applying for form I-589 Asylum.
      Country of Origin is El Salvador. He fled after receiving immediate threats for social-activist publications.
      Police reports show critical failure of protection, and he possesses documented correspondence of direct persecution risks.`,
      createdAt: '2026-04-15T09:45:00Z',
      practiceArea: 'Immigration'
    },
    {
      id: 'c-3',
      name: 'Samuel Miller',
      email: 'sam.miller@techcorp.io',
      phone: '+1 (650) 844-3011',
      status: 'pending',
      intakeNotes: `Samuel seeks to declare individual Chapter 7 Insolvency.
      Currently has $48,000 in unsecured consumer credit obligations. Monthly net home income is estimated at $3,100, which is below state median ranges.
      Primary assets consist of personal vehicle worth under $4,500. He wishes to avoid foreclosure actions.`,
      createdAt: '2026-05-18T11:10:00Z',
      practiceArea: 'Bankruptcy'
    }
  ]);

  // Master local legal matters
  const [matters, setMatters] = useState<Matter[]>([
    {
      id: 'm-1',
      title: 'Miller Chapter 7 Liquidation Petition Filing',
      caseNumber: 'L-4821-2026',
      clientId: 'c-3',
      clientName: 'Samuel Miller',
      practiceArea: 'Bankruptcy',
      status: 'pending',
      billingRate: 275,
      billedHours: 4,
      description: 'Preparing standard filing schedules A through J for Bankruptcy Court. Samuel represents low median individual income streams, demanding standard liquidation relief.',
      createdAt: '2026-05-18T11:15:00Z',
      tasks: [
        { id: 'mt-1', title: 'Open formal practice matter and establish files', completed: true, dueDate: '2026-05-18' },
        { id: 'mt-2', title: 'Verify absolute asset valuation index', completed: false, dueDate: '2026-05-25' },
        { id: 'mt-3', title: 'Compile credit counselling certificates', completed: false, dueDate: '2026-06-01' }
      ],
      riskAssessment: 'Standard unsecured debt level. No primary real estate prevents foreclosure complexity. Strong candidate for fast discharge.'
    },
    {
      id: 'm-2',
      title: 'I-589 Asylum Briefing representing Rodriguez',
      caseNumber: 'L-8973-2026',
      clientId: 'c-2',
      clientName: 'Mateo Rodriguez',
      practiceArea: 'Immigration',
      status: 'active',
      billingRate: 250,
      billedHours: 12,
      description: 'Assembling formal narrative declaration representing Rodriguez fleeing social targeted persecution. Verifying country of origin guidelines and arranging evidentiary reports.',
      createdAt: '2026-04-15T10:00:00Z',
      tasks: [
        { id: 'mt-4', title: 'Compile asylum narrative details', completed: true, dueDate: '2026-04-20' },
        { id: 'mt-5', title: 'Draft asylum Form I-589 petition', completed: true, dueDate: '2026-04-28' },
        { id: 'mt-6', title: 'Audit country of origin legal databases', completed: false, dueDate: '2026-05-30' },
        { id: 'mt-7', title: 'Coordinate interview mock session', completed: false, dueDate: '2026-06-10' }
      ],
      riskAssessment: 'Strong evidentiary brief with documented direct threats. Requires detailed chronological fact translation and credential checks.'
    }
  ]);

  // Master document generated state list
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);

  // Master legal AI messages thread
  const [chatThread, setChatThread] = useState<LegalMessage[]>([]);

  // Master client evidence files lists
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([
    {
      id: 'ev-1',
      name: 'CreditCard_Liabilities_SamuelMiller.pdf',
      size: '2.4 MB',
      mimeType: 'application/pdf',
      uploadedAt: '2026-05-18T11:20:00Z',
      clientId: 'c-3',
      clientName: 'Samuel Miller',
      matterId: 'm-1',
      matterTitle: 'Miller Chapter 7 Liquidation Petition Filing',
      fileCategory: 'Bankruptcy Assets & Debt Ledger',
      extractedClientName: 'Samuel Miller',
      duressLevel: 'Medium',
      summary: 'Comprehensive unsecured liabilities statement listing consumer credit cards and emergency hospital medical debt obligations.',
      extractedFacts: [
        'Total sum of unsecured claims is $85,320 across 4 distinct creditors.',
        'Emergency surgical treatment bills account for over 60% of outstanding debt.',
        'A $4,500 active loan lien operates against petitioner’s personal light truck.',
        'Household income evaluated is $3,140 net, placing client under bankruptcy state median limits.'
      ],
      rawTextSimulated: `ORANGE COUNTY BANKRUPTCY EVIDENCE AUDIT SHEET\n\nDebtor Applicant: Samuel Miller\nCase Filing Type: Chapter 13 vs Chapter 7 Liquidation Petition\n\nCREDITOR DEBT INDICES:\n1. APEX CREDIT REVOLVER - DEBT OUTSTANDING: $24,500\n2. EMER SURG RECONSTRUCTION (ORANGE COUNTY GENERAL HOSPITAL) - BAL: $51,120\n3. PERSONAL TRANSPORT UTILITY TRUCK - LIEN BALANCE VERIFIED: $4,500\n4. UNSECURED CONSUMER LINE CARDS (CHASE VISA CARD) - BAL: $9,700\n\nESTIMATED MONTHLY HOUSEHOLD NET INCOME: $3,140\n\nThis material lists unsecured obligations, household income details, and high-priority emergency surgeon bills which constitute materials of debt. Evaluated net income is placed safely under state median limits.`,
      status: 'scanned'
    },
    {
      id: 'ev-2',
      name: 'Cartel_Threat_Warning_MateoRodriguez.txt',
      size: '420 KB',
      mimeType: 'text/plain',
      uploadedAt: '2026-04-15T10:15:00Z',
      clientId: 'c-2',
      clientName: 'Mateo Rodriguez',
      matterId: 'm-2',
      matterTitle: 'I-589 Asylum Briefing representing Rodriguez',
      fileCategory: 'Immigration Persecution Warning',
      extractedClientName: 'Mateo Rodriguez',
      duressLevel: 'High',
      summary: 'Digitized document text depicting direct written extortion and physical safety warnings issued under cartel authority at his local bread depot.',
      extractedFacts: [
        'Primary extortion threat warning note received on April 4, 2024.',
        'Refusal to comply risks forced trade closure, physical intimidation or extreme direct harm.',
        'Claimant listed as active political baking guild organizer, establishing membership in a targeted social group.',
        'Local police response registered but explicitly lacked resources for physical protective watch.'
      ],
      rawTextSimulated: `TRANSCRIPTION OF EXTORTION THREAT DIRECTIVE RECOVERED ON APRIL 4, 2024\n\nRecipient: Mateo Rodriguez, Local Baker Union Organizer\nLocation of recovery: Regional bread product distribution deck\n\nTRANSCRIBED WARNING NOTATION:\n"This note serves as final notice: you must pay a monthly safety quota of $800 to our regional operations team. If you refuse to comply, we will shut down your bakery depot, and take immediate severe actions against your workplace. Do not contact any authorities."\n\nLAW ENFORCEMENT SYNOPSIS:\nClient petition was registered under municipal file #E-9482 on April 5, 2024. Local police officers issued a formal incident report acknowledging the extortion notes, but explicitly confirmed they lack standard protective guard assets or resources to schedule on-site patrols.`,
      status: 'scanned'
    },
    {
      id: 'ev-3',
      name: 'Marital_Home_Deed_OrangeCounty.docx',
      size: '4.8 MB',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedAt: '2026-04-10T14:30:00Z',
      clientId: 'c-1',
      clientName: 'Eleanor Vance',
      fileCategory: 'Property Title Deed',
      extractedClientName: 'Eleanor Vance',
      duressLevel: 'Low',
      summary: 'Certified Orange County residential deed outlining communal property share and separate inheritance allocations of Eleanor Vance and Bradley Vance.',
      extractedFacts: [
        'Townhouse title registered under joint names as community property in March 2018.',
        'Purchase supported by joint savings accounts, establishing marital assets guidelines CA Civ. Code.',
        'Separate account holdings portfolio established solely via personal family bequest, verified as separate property asset.'
      ],
      rawTextSimulated: `ORANGE COUNTY CLERK AND RECORDER APARTMENT LAND PROPERTY DEED EXCERPT\n\nRecording Date: March 14, 2018\nRecorded Book: CA-1829-948\n\nDECLARATION OF LAND TRANSFERS AND TITLES:\nMarital residence situated in Orange County is hereby registered as a community property estate under the joint legal names of Eleanor Vance and Bradley Vance.\n\nFINANCING MEMORANDUM DATA:\n- The purchase transaction of the apartment property was executed utilizing joint savings certificate accounts.\n- Personal portfolio holdings, municipal bonds, and the separate liquid reserve account are confirmed to be personal family bequests granted solely to Eleanor Vance. They operate as separate property assets and separate holdings portfolios.`,
      status: 'scanned'
    }
  ]);

  // 1. Progressive AI Agent Stance / Relationship HUD Metrics
  const [agentProgressList, setAgentProgressList] = useState<AgentProgress[]>([
    {
      agentId: 'ap-1',
      rapportScore: 12,
      personalityState: 'Reserved',
      interactionCount: 0,
      unlockedCapabilities: ['Pleadings Fact Extraction'],
      caseFamiliarity: 15,
      prosecutorialAggression: 80
    },
    {
      agentId: 'ap-2',
      rapportScore: 18,
      personalityState: 'Reserved',
      interactionCount: 0,
      unlockedCapabilities: ['Pleadings Fact Extraction'],
      caseFamiliarity: 10,
      prosecutorialAggression: 40
    },
    {
      agentId: 'ap-3',
      rapportScore: 30,
      personalityState: 'Collaborative',
      interactionCount: 0,
      unlockedCapabilities: ['Pleadings Fact Extraction', 'Jurisdictional Audit Scope'],
      caseFamiliarity: 35,
      prosecutorialAggression: 60
    },
    {
      agentId: 'ap-4',
      rapportScore: 40,
      personalityState: 'Trusting',
      interactionCount: 0,
      unlockedCapabilities: ['Pleadings Fact Extraction', 'Jurisdictional Audit Scope'],
      caseFamiliarity: 50,
      prosecutorialAggression: 35
    }
  ]);

  // 2. Active secure Jitsi consultation sessions logs
  const [consultations, setConsultations] = useState<ConsultationSession[]>([
    {
      id: 'call-1',
      clientId: 'c-3',
      clientName: 'Samuel Miller',
      roomName: 'L23-Chapter7-Miller',
      meetingType: 'Deposition',
      scheduledFor: '02:30 PM',
      status: 'concluded',
      notes: 'Reviewed unsecured creditor assets ledger. Verified no secondary foreclosure triggers are active.'
    }
  ]);

  // Periodically check api connection health
  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setSystemConnected(data.geminiConnected || false);
      } catch {
        setSystemConnected(false);
      }
    };
    checkApi();
    const inv = setInterval(checkApi, 25000);
    return () => clearInterval(inv);
  }, []);

  // Update real-time clock tracking
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Formatted exactly like '2026-05-20 20:44:17 UTC'
      const formatted = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      setUtcTime(formatted);
    };
    updateTime();
    const inv = setInterval(updateTime, 1000);
    return () => clearInterval(inv);
  }, []);

  // Persistent Storage and Sync Engine (Firestore)
  useEffect(() => {
    const syncFirestore = async () => {
      setDbSyncStatus('connecting');
      setSyncMessage('Connecting to persistent cloud memory...');
      try {
        await ensureAuthenticated();
        
        // Check if DB is already seeded by checking the 'clients' collection
        const clientsSnap = await getDocs(collection(db, 'clients')).catch(err => {
          handleFirestoreError(err, OperationType.LIST, 'clients');
          throw err;
        });
        
        if (clientsSnap.empty) {
          // DATABASE IS EMPTY -> SEED INITIAL STAGES
          setSyncMessage('Seeding cloud database with initial template records...');
          
          const batch = writeBatch(db);
          
          // Seed initial clients
          clients.forEach(c => {
            batch.set(doc(db, 'clients', c.id), c);
          });
          
          // Seed initial matters
          matters.forEach(m => {
            batch.set(doc(db, 'matters', m.id), m);
          });
          
          // Seed initial evidence files
          evidenceFiles.forEach(f => {
            batch.set(doc(db, 'evidenceFiles', f.id), f);
          });
          
          // Seed initial agent progress milestones
          agentProgressList.forEach(p => {
            batch.set(doc(db, 'agentProgressList', p.agentId), p);
          });
          
          // Seed initial consultations
          consultations.forEach(s => {
            batch.set(doc(db, 'consultations', s.id), s);
          });
          
          await batch.commit();
          addLog('system', 'First-time cloud run: Seeded Firestore persistent storage database.');
        } else {
          // DATABASE ALREADY HAS DATA -> HYDRATE LOCAL CACHE FROM THE CLOUD
          setSyncMessage('Syncing data from persistent cloud memory...');
          
          // Hydrate Clients
          const remoteClients: Client[] = [];
          clientsSnap.forEach(snap => {
            remoteClients.push(snap.data() as Client);
          });
          setClients(remoteClients);
          
          // Hydrate Matters
          const mattersSnap = await getDocs(collection(db, 'matters'));
          const remoteMatters: Matter[] = [];
          mattersSnap.forEach(snap => {
            remoteMatters.push(snap.data() as Matter);
          });
          setMatters(remoteMatters);
          
          // Hydrate Generated Documents
          const docsSnap = await getDocs(collection(db, 'generatedDocs'));
          const remoteDocs: GeneratedDocument[] = [];
          docsSnap.forEach(snap => {
            remoteDocs.push(snap.data() as GeneratedDocument);
          });
          setGeneratedDocs(remoteDocs);
          
          // Hydrate Evidence Files
          const evidenceSnap = await getDocs(collection(db, 'evidenceFiles'));
          const remoteEvidence: EvidenceFile[] = [];
          evidenceSnap.forEach(snap => {
            remoteEvidence.push(snap.data() as EvidenceFile);
          });
          setEvidenceFiles(remoteEvidence);
          
          // Hydrate Chat Thread
          const chatSnap = await getDocs(collection(db, 'chatThread'));
          const remoteChat: LegalMessage[] = [];
          chatSnap.forEach(snap => {
            remoteChat.push(snap.data() as LegalMessage);
          });
          setChatThread(remoteChat);
          
          // Hydrate Agent Progress
          const progressSnap = await getDocs(collection(db, 'agentProgressList'));
          const remoteProgress: AgentProgress[] = [];
          progressSnap.forEach(snap => {
            remoteProgress.push(snap.data() as AgentProgress);
          });
          if (remoteProgress.length > 0) {
            setAgentProgressList(remoteProgress);
          }
          
          // Hydrate Consultations
          const consultSnap = await getDocs(collection(db, 'consultations'));
          const remoteConsultations: ConsultationSession[] = [];
          consultSnap.forEach(snap => {
            remoteConsultations.push(snap.data() as ConsultationSession);
          });
          setConsultations(remoteConsultations);
          
          addLog('system', 'Workspace persistent storage synced with Firestore cloud database.');
        }
        setDbSyncStatus('synced');
        setSyncMessage('Persistent memory synced live');
      } catch (err: any) {
        console.error("Firestore sync failed:", err);
        setDbSyncStatus('error');
        setSyncMessage('Sync offline. Local memory active.');
        addLog('system', `Cloud Sync offline: operating in local fallback state (${err.message || 'database error'})`);
      }
    };
    
    syncFirestore();
  }, []);

  // Register desktop hotkeys and key-listeners (Electron level integration)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Search Palette: Ctrl + P / Alt + P
      if ((e.ctrlKey && e.key.toLowerCase() === 'p') || (e.altKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      
      // Shortcut Reference Help Dialog: Ctrl + I / Alt + I
      if ((e.ctrlKey && e.key.toLowerCase() === 'i') || (e.altKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        setShowShortcutsGuide(prev => !prev);
      }

      // Switch workspace screens with Alt + [1-9] keycodes
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        const tabs = ['dashboard', 'clients', 'matters', 'documents', 'staff', 'voice', 'consult', 'backups', 'diagnostic'];
        if (tabs[index]) {
          e.preventDefault();
          setActiveTab(tabs[index]);
          addLog('system', `App shortcut activated: View shifted to ${tabs[index].toUpperCase()}`);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addLog = (type: 'client' | 'matter' | 'document' | 'voice' | 'system', message: string) => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    setActivityLogs(prev => [
      ...prev,
      { id: `log-${Date.now()}`, type, message, timestamp }
    ]);
  };

  const clearLogs = () => {
    setActivityLogs([]);
  };

  const handleAddClient = (newClient: Omit<Client, 'id' | 'createdAt'>) => {
    const client: Client = {
      ...newClient,
      id: `c-${clients.length + 1}`,
      createdAt: new Date().toISOString()
    };
    setClients(prev => [...prev, client]);
    addLog('client', `New Client record created for ${client.name} (${client.practiceArea}).`);
    setDoc(doc(db, 'clients', client.id), client).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `clients/${client.id}`);
    });
  };

  const handleAddMatter = (newMatter: Omit<Matter, 'id' | 'createdAt'>) => {
    const matter: Matter = {
      ...newMatter,
      id: `m-${matters.length + 1}`,
      createdAt: new Date().toISOString()
    };
    setMatters(prev => [...prev, matter]);
    addLog('matter', `New Matter opened: ${matter.title} (${matter.caseNumber}) linked to ${matter.clientName}.`);
    setDoc(doc(db, 'matters', matter.id), matter).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `matters/${matter.id}`);
    });
  };

  const handleUpdateMatter = (updatedMatter: Matter) => {
    setMatters(prev => prev.map(m => m.id === updatedMatter.id ? updatedMatter : m));
    addLog('matter', `Matter case file ${updatedMatter.caseNumber} ("${updatedMatter.title}") details updated.`);
    setDoc(doc(db, 'matters', updatedMatter.id), updatedMatter).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `matters/${updatedMatter.id}`);
    });
  };

  const handleAddGeneratedDoc = (docData: GeneratedDocument) => {
    setGeneratedDocs(prev => [...prev, docData]);
    addLog('document', `AI automation drafted standard file: "${docData.title}" for Client ${docData.clientName}.`);
    setDoc(doc(db, 'generatedDocs', docData.id), docData).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `generatedDocs/${docData.id}`);
    });
  };

  const handleAddEvidenceFile = (file: EvidenceFile) => {
    setEvidenceFiles(prev => [...prev, file]);
    addLog('document', `New client evidence file compiled & OCR scanned: "${file.name}" for Client ${file.clientName}.`);
    setDoc(doc(db, 'evidenceFiles', file.id), file).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `evidenceFiles/${file.id}`);
    });
  };

  const handleAddMessage = (msg: LegalMessage) => {
    setChatThread(prev => [...prev, msg]);
    if (msg.sender === 'user') {
      addLog('system', `Consulted AI Specialist Agent: "${msg.agentName}" with case query.`);
    } else {
      addLog('system', `Legal Agent "${msg.agentName}" compiled response successfully.`);
    }
    setDoc(doc(db, 'chatThread', msg.id), msg).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `chatThread/${msg.id}`);
    });
  };

  const handleUpdateAgentProgress = (updatedProgress: AgentProgress) => {
    setAgentProgressList(prev => prev.map(p => p.agentId === updatedProgress.agentId ? updatedProgress : p));
    setDoc(doc(db, 'agentProgressList', updatedProgress.agentId), updatedProgress).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `agentProgressList/${updatedProgress.agentId}`);
    });
  };

  const handleAddConsultation = (session: ConsultationSession) => {
    setConsultations(prev => [...prev, session]);
    addLog('system', `Active video Room initialized: "${session.roomName}" representing Client ${session.clientName}`);
    setDoc(doc(db, 'consultations', session.id), session).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `consultations/${session.id}`);
    });
  };

  const handleUpdateConsultation = (updatedSession: ConsultationSession) => {
    setConsultations(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    if (updatedSession.status === 'concluded') {
      addLog('system', `Concluded Video Consultation loop with ${updatedSession.clientName}. Transcripts saved as reference notes.`);
    }
    setDoc(doc(db, 'consultations', updatedSession.id), updatedSession).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `consultations/${updatedSession.id}`);
    });
  };

  const handleDeleteConsultation = (id: string) => {
    setConsultations(prev => prev.filter(s => s.id !== id));
    addLog('system', 'Archived consultation session successfully removed from indexes.');
    deleteDoc(doc(db, 'consultations', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `consultations/${id}`);
    });
  };

  const handleRestoreState = async (state: ImportedState) => {
    if (state.clients) setClients(state.clients);
    if (state.matters) setMatters(state.matters);
    if (state.generatedDocs) setGeneratedDocs(state.generatedDocs);
    if (state.chatThread) setChatThread(state.chatThread);
    if (state.agentProgressList) setAgentProgressList(state.agentProgressList);
    if (state.consultations) setConsultations(state.consultations);
    addLog('system', 'Global System Mirror synced successfully. All clients, cases, and Progressive AI milestones rebuilt.');

    try {
      const batch = writeBatch(db);
      if (state.clients) {
        state.clients.forEach(c => batch.set(doc(db, 'clients', c.id), c));
      }
      if (state.matters) {
        state.matters.forEach(m => batch.set(doc(db, 'matters', m.id), m));
      }
      if (state.generatedDocs) {
        state.generatedDocs.forEach(d => batch.set(doc(db, 'generatedDocs', d.id), d));
      }
      if (state.chatThread) {
        state.chatThread.forEach(t => batch.set(doc(db, 'chatThread', t.id), t));
      }
      if (state.agentProgressList) {
        state.agentProgressList.forEach(p => batch.set(doc(db, 'agentProgressList', p.agentId), p));
      }
      if (state.consultations) {
        state.consultations.forEach(s => batch.set(doc(db, 'consultations', s.id), s));
      }
      await batch.commit();
      addLog('system', 'Cloud database synchronized with imported backup mirror.');
    } catch (err: any) {
      console.error("Backup sync to Firestore failed", err);
      addLog('system', `Cloud Sync error: failed to write restore payload (${err.message || 'database error'})`);
    }
  };

  const triggerSearchFromDashboard = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className={`flex flex-col h-screen w-screen bg-[#050912] font-sans overflow-hidden select-none relative ${isDesktopMode ? 'p-3' : ''}`}>
      
      {/* 1. If in Desktop Mode: Render Simulated macOS/Windows Native OS Top Menu Bar and Window Framing */}
      {isDesktopMode && (
        <div id="desktop-native-menubar" className="h-8 w-full bg-[#0d1525]/90 border border-[#1e293b] rounded-t-xl px-4 flex items-center justify-between text-xs text-slate-300 font-mono select-none select-text">
          <div className="flex items-center gap-4">
            <span className="font-bold text-teal-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Laptop className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              Level 23 Shell v2.4
            </span>
            <div className="flex gap-3 text-slate-400 text-[11px]">
              <button type="button" onClick={() => { setActiveTab('dashboard'); addLog('system', 'Workspace direct recall from Desktop toolbar'); }} className="hover:text-white cursor-pointer transition-colors bg-transparent border-none">File</button>
              <button type="button" onClick={() => setShowCommandPalette(true)} className="hover:text-white cursor-pointer transition-colors bg-transparent border-none">Edit</button>
              <button type="button" onClick={() => { setActiveTab('diagnostic'); addLog('system', 'System diagnostics recall from Desktop Menu'); }} className="hover:text-white cursor-pointer transition-colors bg-transparent border-none">Developer</button>
              <button type="button" onClick={() => setShowShortcutsGuide(true)} className="hover:text-white cursor-pointer transition-colors bg-transparent border-none">Shortcuts</button>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 hidden md:block">
            SQLite Daemon running on <span className="text-teal-400">127.0.0.1:2323</span> • Port: 3000
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-[10px]">Memory: 418 MB</span>
            <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              DAEMON LOCAL
            </span>
          </div>
        </div>
      )}

      {/* 2. Main Window Frame Container */}
      <div 
        id="desktop-window-container" 
        className={`flex flex-1 overflow-hidden bg-[#070b13] border-[#1e293b] ${
          isDesktopMode 
            ? 'border-x border-b rounded-b-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]' 
            : ''
        }`}
      >
        {/* If minimized inside simulated Desktop workspace */}
        {isMinimized ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center text-teal-400 shadow-2xl relative">
              <Laptop className="w-10 h-10 animate-bounce" />
              <span className="absolute top-2 right-2 w-3 h-3 bg-teal-400 rounded-full animate-ping"></span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Level 23 Workspace Minimized</h3>
              <p className="text-xs text-slate-500 font-mono">Running local daemon task loops in the system tray.</p>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="px-5 py-2 bg-teal-400 text-slate-950 text-xs font-bold font-mono uppercase rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none"
            >
              Restore Client Window
            </button>
          </div>
        ) : (
          <>
            {/* Sidebar Navigation */}
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              systemConnected={systemConnected}
              isDesktopMode={isDesktopMode}
              setIsDesktopMode={setIsDesktopMode}
              onOpenShortcuts={() => setShowShortcutsGuide(true)}
              onOpenResearch={() => {
                setShowResearchDrawer(true);
                addLog('system', 'Judicial research portal triggered from sidebar navigation hub.');
              }}
              onQuickIntake={() => {
                setActiveTab('clients');
                addLog('system', 'Quick client intake modal requested from toolbar.');
              }}
              onRefreshDiagnostic={() => addLog('system', 'Manual diagnostic audit rerun.')}
              utcTime={utcTime}
            />

            {/* Main Dynamic View Column */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
              
              {/* Top bar header */}
              <header className="h-16 px-8 bg-[#090d16] border-b border-[#1e293b] flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                  {/* Traffic Light simulated Mac/Windows window controlling circles if in Desktop Mode */}
                  {isDesktopMode && (
                    <div className="flex items-center gap-1.5 mr-3 border-r border-[#1e293b] pr-4 shrink-0 selection:bg-transparent">
                      <button 
                        type="button"
                        onClick={() => { setIsDesktopMode(false); addLog('system', 'Exited native Desktop workspace shell.'); }} 
                        className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors cursor-pointer border-none" 
                        title="Close window simulator (Returns to Web Mode)"
                      />
                      <button 
                        type="button"
                        onClick={() => setIsMinimized(true)} 
                        className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer border-none" 
                        title="Minimize workspace to Desktop Task tray"
                      />
                      <button 
                        type="button"
                        onClick={() => { setShowCommandPalette(true); addLog('system', 'Full command search palette triggered from traffic header.'); }} 
                        className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-pointer border-none" 
                        title="Open system search index manager"
                      />
                    </div>
                  )}
                  <span className="text-xs text-slate-400 font-medium font-sans">Practice Dashboard</span>
                  <span className="text-xs text-slate-600 font-mono">/</span>
                  <span className="text-xs text-teal-400 font-semibold font-mono uppercase tracking-wider">{activeTab}</span>
                </div>
                
                {/* Header Tray status tags */}
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setShowResearchDrawer(true);
                      addLog('system', 'Judicial research desk triggered from header tray.');
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#dfb76c]/15 to-[#b38627]/5 hover:from-[#dfb76c]/25 hover:to-[#b38627]/10 border border-[#dfb76c]/35 hover:border-[#dfb76c]/55 rounded-xl px-3.5 py-1.5 text-xs text-[#fae093] hover:text-[#fce093] transition-all font-sans cursor-pointer group shadow-[0_2px_8px_rgba(223,183,108,0.1)]"
                    title="Open California Forms, CourtListener, Google Scholar, Justia, FindLaw"
                  >
                    <Scale className="w-3.5 h-3.5 text-[#dfb76c] group-hover:rotate-12 transition-transform" />
                    <span>Judicial Desk</span>
                    <span className="hidden md:inline bg-[#fae093]/10 border border-[#fae093]/20 text-[9px] text-[#fae093] font-mono px-1 rounded uppercase">Research</span>
                  </button>

                  <button 
                    onClick={() => setShowCommandPalette(true)}
                    className="flex items-center gap-2 bg-[#0a1019] hover:bg-[#101726]/60 border border-[#1e293b] rounded-xl px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all font-sans cursor-pointer group"
                  >
                    <Search className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
                    <span className="text-slate-500 shrink-0">Command Palette</span>
                    <kbd className="hidden sm:inline bg-slate-900 border border-slate-800 text-[9px] px-1 rounded text-slate-500 font-mono leading-none">Ctrl+P</kbd>
                  </button>

                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#0f172a]/70 rounded-lg border border-[#1e293b] text-[11px] font-mono">
                    <Clock className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                    <span className="text-slate-400">{utcTime.split(' ')[1] || 'UTC'}</span>
                  </div>

                  {/* Firestore Cloud Persistent Sync status pill */}
                  <div 
                    className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-mono transition-all duration-300 select-none ${
                      dbSyncStatus === 'synced' 
                        ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' 
                        : dbSyncStatus === 'connecting'
                        ? 'bg-amber-500/10 border-amber-500/35 text-amber-400'
                        : 'bg-rose-500/10 border-rose-500/35 text-rose-400'
                    }`}
                    title={syncMessage}
                  >
                    {dbSyncStatus === 'synced' ? (
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                    ) : dbSyncStatus === 'connecting' ? (
                      <CloudLightning className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    ) : (
                      <CloudOff className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                    )}
                    <span className="hidden lg:inline">{syncMessage}</span>
                    <span className="inline lg:hidden">{dbSyncStatus === 'synced' ? 'Synced' : dbSyncStatus === 'connecting' ? 'Syncing...' : 'Offline'}</span>
                  </div>

                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase rounded bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
                    Alex (Design Lead)
                  </div>
                </div>
              </header>

              {/* Dynamic scroll view wrapper */}
              <div className="flex-1 overflow-y-auto p-8 relative">
                <AnimatePresence mode="wait">
                  
                  {activeTab === 'dashboard' && (
                    <Dashboard
                      key="dashboard"
                      clients={clients}
                      matters={matters}
                      generatedDocs={generatedDocs}
                      setActiveTab={setActiveTab}
                      triggerNewClient={() => {
                        setActiveTab('clients');
                      }}
                      triggerNewMatter={() => {
                        setActiveTab('matters');
                      }}
                      triggerGenerateDoc={() => {
                        setActiveTab('documents');
                      }}
                    />
                  )}

                  {activeTab === 'clients' && (
                    <ClientsTab
                      key="clients"
                      clients={clients}
                      onAddClient={handleAddClient}
                    />
                  )}

                  {activeTab === 'matters' && (
                    <MattersTab
                      key="matters"
                      matters={matters}
                      clients={clients}
                      onAddMatter={handleAddMatter}
                      onUpdateMatter={handleUpdateMatter}
                    />
                  )}

                  {activeTab === 'documents' && (
                    <DocumentsTab
                      key="documents"
                      clients={clients}
                      matters={matters}
                      generatedDocs={generatedDocs}
                      onAddGeneratedDoc={handleAddGeneratedDoc}
                      evidenceFiles={evidenceFiles}
                      onAddEvidenceFile={handleAddEvidenceFile}
                    />
                  )}

                  {activeTab === 'staff' && (
                    <AIStaffTab
                      key="staff"
                      chatThread={chatThread}
                      onAddMessage={handleAddMessage}
                      onClearThread={() => {
                        setChatThread([]);
                        addLog('system', 'Chat messages thread purged manually.');
                      }}
                      agentProgressList={agentProgressList}
                      onUpdateAgentProgress={handleUpdateAgentProgress}
                    />
                  )}

                  {activeTab === 'voice' && (
                    <VoiceEngineTab
                      key="voice"
                      systemConnected={systemConnected}
                    />
                  )}

                  {activeTab === 'consult' && (
                    <ConsultationsTab
                      key="consult"
                      clients={clients}
                      consultations={consultations}
                      onAddConsultation={handleAddConsultation}
                      onUpdateConsultation={handleUpdateConsultation}
                      onDeleteConsultation={handleDeleteConsultation}
                    />
                  )}

                  {activeTab === 'backups' && (
                    <BackupsTab
                      key="backups"
                      clients={clients}
                      matters={matters}
                      generatedDocs={generatedDocs}
                      chatThread={chatThread}
                      agentProgressList={agentProgressList}
                      consultations={consultations}
                      onRestoreState={handleRestoreState}
                      dbSyncStatus={dbSyncStatus}
                      syncMessage={syncMessage}
                    />
                  )}

                  {activeTab === 'diagnostic' && (
                    <SystemHealthTab
                      key="diagnostic"
                      logs={activityLogs}
                      onClearLogs={clearLogs}
                    />
                  )}

                  {activeTab === 'client_portal' && (
                    <ClientPortalTab
                      key="client_portal"
                      clients={clients}
                      matters={matters}
                      evidenceFiles={evidenceFiles}
                    />
                  )}

                </AnimatePresence>
              </div>
            </main>
          </>
        )}
      </div>

      {/* 3. Simulated Desktop App Bottom Status bar tray */}
      {isDesktopMode && !isMinimized && (
        <div id="desktop-local-status" className="h-6 w-full bg-[#050b13] px-5 border-t border-[#1e293b] rounded-b-xl flex items-center justify-between text-[9px] font-mono text-slate-500 uppercase select-none">
          <span>Client Frame Status: Buffered OK</span>
          <span>SQLite Database: 2.4 MB • Connected</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Cpu className="w-3 h-3 text-teal-400" />
            CPU Host Threads: 8 Core @ 42C
          </span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* GLOBAL MODALS: A. GLOBAL SEARCH COMMAND PALETTE */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showCommandPalette && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-start justify-center pt-24 z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ duration: 0.18 }}
              className="bg-[#0e1625] border border-[#1e293b] w-full max-w-lg rounded-2.5xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-[#1e293b] flex items-center gap-3 relative">
                <Search className="w-4 h-4 text-teal-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                  placeholder="Search workspace commands (e.g. docs, clients, voice)..."
                  className="w-full bg-transparent border-none outline-none text-white text-xs placeholder-slate-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => { setShowCommandPalette(false); setCommandSearch(''); }}
                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Matches list */}
              <div className="p-2 max-h-64 overflow-y-auto space-y-1">
                {[
                  { text: '🎯 Go To Dashboard overview', tab: 'dashboard' },
                  { text: '👥 Handle Case Client Ledger', tab: 'clients' },
                  { text: '💼 Review Legal Litigation Matters', tab: 'matters' },
                  { text: '📄 Synthesize Documents & run AI OCR Scanners', tab: 'documents' },
                  { text: '🧠 Consult Progressive Phoenix Staff', tab: 'staff' },
                  { text: '🔊 Open SPEECH Synthesis Engine', tab: 'voice' },
                  { text: '📹 Initiate Secure Peer Video Meetings', tab: 'consult' },
                  { text: '🔄 Sync Desktop, Ollama & Google Drive', tab: 'backups' },
                  { text: '👁️ Simulate secure read-only Client Portal', tab: 'client_portal' },
                  { text: '📟 Inspect System Diagnostics Logs', tab: 'diagnostic' },
                  { text: '🖥️ Toggle Electron Desktop App Mode', toggleDesktop: true },
                  { text: '🚪 Clear Auditing activity logs', runClear: true }
                ]
                  .filter(cmd => cmd.text.toLowerCase().includes(commandSearch.toLowerCase()))
                  .map((cmd, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (cmd.tab) setActiveTab(cmd.tab);
                        if (cmd.toggleDesktop) setIsDesktopMode(!isDesktopMode);
                        if (cmd.runClear) clearLogs();
                        setShowCommandPalette(false);
                        setCommandSearch('');
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-teal-500/10 hover:text-teal-400 flex items-center justify-between text-xs text-slate-300 font-sans transition-colors cursor-pointer bg-transparent border-none"
                    >
                      <span>{cmd.text}</span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-[#060a12] border border-slate-900/50 px-1 py-0.5 rounded leading-none shrink-0 ml-2">
                        Execute Action
                      </span>
                    </button>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* GLOBAL MODALS: B. DESKTOP KEYBOARD HOTKEY COMPENDIUM */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showShortcutsGuide && (
          <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b101c] border border-[#1e293b] w-full max-w-md rounded-2.5xl p-6 space-y-4 shadow-3xl text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-teal-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading animate-none">Desktop Key Hotkeys</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShortcutsGuide(false)}
                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Hotkey mappings grid view */}
              <div className="space-y-3.5 text-xs">
                <p className="text-[11px] text-slate-500 leading-normal font-sans">
                  The desktop client includes global shortcut listeners. Press these hotkeys from any sub-screen for immediate navigation control.
                </p>
                <div className="grid grid-cols-2 gap-3 font-sans pt-1">
                  {[
                    { keys: 'Alt + 1', action: 'Dashboard Screen' },
                    { keys: 'Alt + 2', action: 'Client Ledger' },
                    { keys: 'Alt + 3', action: 'Litigation Matters' },
                    { keys: 'Alt + 4', action: 'Document Automation' },
                    { keys: 'Alt + 5', action: 'Phoenix AI Staff' },
                    { keys: 'Alt + 6', action: 'Voice Dictation' },
                    { keys: 'Alt + 7', action: 'Video Consultation' },
                    { keys: 'Alt + 8', action: 'Sync & Backups' },
                    { keys: 'Alt + 9', action: 'Diagnostics Engine' },
                    { keys: 'Ctrl + P', action: 'Search Command Palette' },
                    { keys: 'Ctrl + I', action: 'Toggle Shortcut Manual' }
                  ].map((sh, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-900/60 border border-slate-800/70 rounded-xl">
                      <span className="text-slate-400 text-[10px]">{sh.action}</span>
                      <kbd className="bg-[#040810] border border-slate-700/50 text-[10.5px] text-teal-400 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                        {sh.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowShortcutsGuide(false)}
                  className="w-full py-2.5 bg-teal-400 hover:bg-teal-500 text-slate-950 font-bold font-mono text-xs uppercase rounded-xl transition-all cursor-pointer text-center border-none"
                >
                  Return to Active Practice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ResearchPortalDrawer
        isOpen={showResearchDrawer}
        onClose={() => setShowResearchDrawer(false)}
        clients={clients}
        matters={matters}
      />

    </div>
  );
}
