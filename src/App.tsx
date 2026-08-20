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
import { INITIAL_CLIENTS_ROSTER, INITIAL_MATTERS_ROSTER } from './data/initialClients';
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
import GoogleWorkspaceTab from './components/GoogleWorkspaceTab';
import { ClientIntakeGeneratorModal } from './components/ClientIntakeGeneratorModal';
import OmniUploadModal from './components/OmniUploadModal';
import GoogleTranslateBar from './components/GoogleTranslateBar';
import ZenEntranceView from './components/ZenEntranceView';
import { Scale, BookOpen, Database, CloudOff, CloudLightning, Lock, Unlock, UploadCloud, Languages } from 'lucide-react';
import { startPeriodicDriveSync } from './services/driveSyncService';

import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db, ensureAuthenticated, handleFirestoreError, OperationType } from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isZenEntranceMode, setIsZenEntranceMode] = useState<boolean>(true);
  const [systemConnected, setSystemConnected] = useState<boolean>(false);
  const [utcTime, setUtcTime] = useState<string>('');
  const [showResearchDrawer, setShowResearchDrawer] = useState<boolean>(false);
  const [showClientIntakeGeneratorModal, setShowClientIntakeGeneratorModal] = useState<boolean>(false);
  const [showOmniUploadModal, setShowOmniUploadModal] = useState<boolean>(false);
  const [currentAppLanguage, setCurrentAppLanguage] = useState<string>('en');

  // Firestore synchronization states
  const [dbSyncStatus, setDbSyncStatus] = useState<'offline' | 'connecting' | 'synced' | 'error'>('connecting');
  const [syncMessage, setSyncMessage] = useState<string>('Connecting to persistent cloud memory...');

  // Storage Lock states
  const [isStorageLocked, setIsStorageLocked] = useState<boolean>(() => localStorage.getItem('isStorageLocked') === 'true');
  const [storagePin, setStoragePin] = useState<string>(() => localStorage.getItem('storagePin') || '1234'); // default standard PIN
  const [showLockModal, setShowLockModal] = useState<boolean>(false);
  const [lockModalMode, setLockModalMode] = useState<'lock' | 'unlock' | 'change-pin'>('lock');
  const [pinInput, setPinInput] = useState<string>('');
  const [lockError, setLockError] = useState<string>('');
  const [storageLockedToast, setStorageLockedToast] = useState<string | null>(null);

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

  // Master local client records with local persistence
  const [clients, setClients] = useState<Client[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('l23_persistent_clients_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error('Error loading persistent clients:', e);
      }
    }
    return INITIAL_CLIENTS_ROSTER;
  });

  // Master local legal matters with local persistence
  const [matters, setMatters] = useState<Matter[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('l23_persistent_matters_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error('Error loading persistent matters:', e);
      }
    }
    return INITIAL_MATTERS_ROSTER;
  });

  // Master document generated state list with local persistence
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('l23_persistent_docs_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error('Error loading persistent docs:', e);
      }
    }
    return [
      {
        id: 'doc-watson-fl100',
        title: 'FL-100 Petition for Dissolution of Marriage — Don Watson',
        clientId: 'c-0',
        clientName: 'Don Watson',
        templateId: 'fl_100_dissolution',
        content: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF ORANGE
341 The City Drive South, Orange, CA 92868
CASE NUMBER: FL-2026-09281

========================================================================
PETITION FOR DISSOLUTION OF MARRIAGE (FL-100) & INTAKE COVER SHEET
========================================================================

1. ATTORNEY FOR / UNREPRESENTED PETITIONER DETAILS:
   - Full Legal Name: Don Watson (Petitioner)
   - Date of Birth: November 14, 1982
   - Residential Address: 1420 Newport Center Dr, Suite 500, Newport Beach, CA 92660
   - Email: don.watson@watsontech.com | Phone: +1 (949) 555-0198
   - Occupation: Chief Technology Officer, WatsonTech Systems Inc.

2. RESPONDENT DETAILS:
   - Full Legal Name: Clara Watson (Respondent)
   - Date of Birth: April 22, 1985
   - Residential Address: 780 Coast Hwy, Laguna Beach, CA 92651
   - Email: clara.watson@gmail.com | Phone: +1 (949) 555-0812

3. JURISDICTIONAL DECLARATION (CA Family Code § 300):
   - Petitioner has been a resident of California for at least 6 months and of Orange County for at least 3 months immediately preceding the filing of this Petition.
   - Nature of Action: Dissolution of Marriage (Divorce)

4. STATISTICAL FACTS OF MARRIAGE:
   - Date of Marriage: June 15, 2012 (City of Newport Beach, County of Orange, CA)
   - Date of Separation: April 10, 2026
   - Length of Marriage: 13 Years, 9 Months

5. MINOR CHILDREN OF THE MARRIAGE:
   a. Ethan Watson (Date of Birth: August 10, 2016)
   b. Chloe Watson (Date of Birth: December 5, 2019)
   - Custody Requested: Joint Legal Custody to both parents; Primary Physical Custody to Petitioner Don Watson with structured weekend visitation to Respondent.

6. MARITAL PROPERTY & FINANCIAL RELIEF REQUESTED:
   a. Equal partition of community real property situated at 1420 Newport Center Dr, Newport Beach, CA.
   b. Confirmation of pre-marital tech patents and inheritance accounts as separate property of Don Watson.
   c. Audit and determination of spousal support obligations.
   d. Issuance of FL-110 Summons with Bates citation indexing.

VERIFICATION DECLARATION UNDER PENALTY OF PERJURY:
I declare under penalty of perjury under the laws of the State of California that the foregoing facts, party information, and jurisdictional basis are true and correct.

Filing Date: June 1, 2026
Petitioner Signature: Don Watson`,
        generatedAt: '2026-06-01T09:00:00Z'
      }
    ];
  });

  // Master legal AI messages thread
  const [chatThread, setChatThread] = useState<LegalMessage[]>([]);

  // Master client evidence files lists with local persistence
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('l23_persistent_evidence_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error('Error loading persistent evidence:', e);
      }
    }
    return [
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
    ];
  });

  // Master client directory pagination states
  const [lastClientSnapshot, setLastClientSnapshot] = useState<any>(null);
  const [hasMoreClients, setHasMoreClients] = useState<boolean>(false);
  const [clientsPageSize] = useState<number>(50); // Generous buffer to show all clients
  const [isLoadingMoreClients, setIsLoadingMoreClients] = useState<boolean>(false);

  // Dynamic pagination function to load more clients from cloud on demand
  const loadMoreClients = async () => {
    if (isLoadingMoreClients || !hasMoreClients) return;
    setIsLoadingMoreClients(true);
    addLog('system', 'Requesting client directory from cloud database...');
    try {
      const clientsRef = collection(db, 'clients');
      let q;
      if (lastClientSnapshot) {
        q = query(clientsRef, orderBy('name'), startAfter(lastClientSnapshot), limit(clientsPageSize));
      } else {
        q = query(clientsRef, orderBy('name'), limit(clientsPageSize));
      }
      const snap = await getDocs(q);
      if (!snap.empty) {
        const nextClients: Client[] = [];
        snap.forEach(docSnap => {
          nextClients.push(docSnap.data() as Client);
        });
        setClients(prev => {
          const map = new Map<string, Client>();
          prev.forEach(c => map.set(c.id, c));
          nextClients.forEach(c => map.set(c.id, c));
          return Array.from(map.values());
        });
        setLastClientSnapshot(snap.docs[snap.docs.length - 1]);
        if (snap.docs.length < clientsPageSize) {
          setHasMoreClients(false);
          addLog('system', `Loaded all ${snap.docs.length} remaining clients. Complete client directory synced.`);
        } else {
          addLog('system', `Successfully cached ${snap.docs.length} client directory records.`);
        }
      } else {
        setHasMoreClients(false);
        addLog('system', 'Client directory scan completed.');
      }
    } catch (err: any) {
      console.error("On-demand paginated scan failed:", err);
      addLog('system', `Client scan error: ${err.message || 'database exception'}`);
    } finally {
      setIsLoadingMoreClients(false);
    }
  };

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
  const [consultations, setConsultations] = useState<ConsultationSession[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('l23_persistent_consultations_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return [
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
    ];
  });

  // AUTO-SAVE PERSISTENCE HOOKS: Guarantee zero data loss when app updates or reloads
  useEffect(() => {
    if (typeof window !== 'undefined' && clients.length > 0) {
      localStorage.setItem('l23_persistent_clients_v2', JSON.stringify(clients));
    }
  }, [clients]);

  useEffect(() => {
    if (typeof window !== 'undefined' && matters.length > 0) {
      localStorage.setItem('l23_persistent_matters_v2', JSON.stringify(matters));
    }
  }, [matters]);

  useEffect(() => {
    if (typeof window !== 'undefined' && generatedDocs.length > 0) {
      localStorage.setItem('l23_persistent_docs_v2', JSON.stringify(generatedDocs));
    }
  }, [generatedDocs]);

  useEffect(() => {
    if (typeof window !== 'undefined' && evidenceFiles.length > 0) {
      localStorage.setItem('l23_persistent_evidence_v2', JSON.stringify(evidenceFiles));
    }
  }, [evidenceFiles]);

  useEffect(() => {
    if (typeof window !== 'undefined' && consultations.length > 0) {
      localStorage.setItem('l23_persistent_consultations_v2', JSON.stringify(consultations));
    }
  }, [consultations]);

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

  // Initialize background Google Drive synchronization task for level23consulting@gmail.com
  useEffect(() => {
    const stopSync = startPeriodicDriveSync(60000, '1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH');
    return () => stopSync();
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
        
        // Check if DB is already seeded using a fast single-record limit query
        const clientsCheckSnap = await getDocs(query(collection(db, 'clients'), limit(1))).catch(err => {
          handleFirestoreError(err, OperationType.LIST, 'clients');
          throw err;
        });
        
        if (clientsCheckSnap.empty) {
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
          
          // HYDRATE AND MERGE CLIENTS: Retrieve all remote client documents
          const clientsSnap = await getDocs(collection(db, 'clients')).catch(err => {
            handleFirestoreError(err, OperationType.LIST, 'clients');
            throw err;
          });
          
          const remoteClients: Client[] = [];
          clientsSnap.forEach(snap => {
            remoteClients.push(snap.data() as Client);
          });

          // Merge local clients with remote clients without losing any
          setClients(prev => {
            const map = new Map<string, Client>();
            // Add all current/initial clients
            prev.forEach(c => map.set(c.id, c));
            // Layer in all remote Firestore clients
            remoteClients.forEach(c => map.set(c.id, c));
            return Array.from(map.values());
          });
          
          setHasMoreClients(false);
          
          // Hydrate Matters
          const mattersSnap = await getDocs(collection(db, 'matters'));
          const remoteMatters: Matter[] = [];
          mattersSnap.forEach(snap => {
            remoteMatters.push(snap.data() as Matter);
          });
          setMatters(prev => {
            const map = new Map<string, Matter>();
            prev.forEach(m => map.set(m.id, m));
            remoteMatters.forEach(m => map.set(m.id, m));
            return Array.from(map.values());
          });
          
          // Hydrate Generated Documents
          const docsSnap = await getDocs(collection(db, 'generatedDocs'));
          const remoteDocs: GeneratedDocument[] = [];
          docsSnap.forEach(snap => {
            remoteDocs.push(snap.data() as GeneratedDocument);
          });
          if (remoteDocs.length > 0) {
            setGeneratedDocs(prev => {
              const map = new Map<string, GeneratedDocument>();
              prev.forEach(d => map.set(d.id, d));
              remoteDocs.forEach(d => map.set(d.id, d));
              return Array.from(map.values());
            });
          }
          
          // Hydrate Evidence Files
          const evidenceSnap = await getDocs(collection(db, 'evidenceFiles'));
          const remoteEvidence: EvidenceFile[] = [];
          evidenceSnap.forEach(snap => {
            remoteEvidence.push(snap.data() as EvidenceFile);
          });
          if (remoteEvidence.length > 0) {
            setEvidenceFiles(prev => {
              const map = new Map<string, EvidenceFile>();
              prev.forEach(e => map.set(e.id, e));
              remoteEvidence.forEach(e => map.set(e.id, e));
              return Array.from(map.values());
            });
          }
          
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
          if (remoteConsultations.length > 0) {
            setConsultations(prev => {
              const map = new Map<string, ConsultationSession>();
              prev.forEach(s => map.set(s.id, s));
              remoteConsultations.forEach(s => map.set(s.id, s));
              return Array.from(map.values());
            });
          }
          
          addLog('system', `Workspace persistent cloud storage verified. ${remoteClients.length} clients loaded from Firestore.`);
        }
        setDbSyncStatus('synced');
        setSyncMessage('Persistent memory synced live');
      } catch (err: any) {
        console.error("Firestore sync failed:", err);
        setDbSyncStatus('error');
        setSyncMessage('Sync offline. Local memory active.');
        addLog('system', `Cloud Sync operating in resilient local mode (${err.message || 'database status'})`);
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
    const uniqueId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setActivityLogs(prev => [
      ...prev,
      { id: uniqueId, type, message, timestamp }
    ]);
  };

  const clearLogs = () => {
    setActivityLogs([]);
  };

  const checkStorageLocked = (actionName: string): boolean => {
    if (isStorageLocked) {
      addLog('system', `⚠️ BLOCKED: Storage is WRITE-LOCKED. Attempted to: ${actionName}.`);
      setStorageLockedToast(`Storage is Write-Locked. Cannot ${actionName}.`);
      setTimeout(() => setStorageLockedToast(null), 4500);
      return true;
    }
    return false;
  };

  const handleAddClient = (newClient: Omit<Client, 'id' | 'createdAt'> | Client) => {
    if (checkStorageLocked('add new client profile')) return;
    const client: Client = {
      ...newClient,
      id: (newClient as any).id || `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: (newClient as any).createdAt || new Date().toISOString()
    };
    setClients(prev => {
      const filtered = prev.filter(c => c.id !== client.id);
      return [client, ...filtered];
    });
    addLog('client', `Client record confirmed: ${client.name} (${client.practiceArea || 'General'}).`);
    setDoc(doc(db, 'clients', client.id), client).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `clients/${client.id}`);
    });
  };

  const handleAddMatter = (newMatter: Omit<Matter, 'id' | 'createdAt'> | Matter) => {
    if (checkStorageLocked('open new legal case matter')) return;
    const matter: Matter = {
      ...newMatter,
      id: (newMatter as any).id || `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: (newMatter as any).createdAt || new Date().toISOString()
    };
    setMatters(prev => {
      const filtered = prev.filter(m => m.id !== matter.id);
      return [matter, ...filtered];
    });
    addLog('matter', `New Matter opened: ${matter.title} (${matter.caseNumber}) linked to ${matter.clientName}.`);
    setDoc(doc(db, 'matters', matter.id), matter).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `matters/${matter.id}`);
    });
  };

  const handleUpdateMatter = (updatedMatter: Matter) => {
    if (checkStorageLocked('update case file details')) return;
    setMatters(prev => prev.map(m => m.id === updatedMatter.id ? updatedMatter : m));
    addLog('matter', `Matter case file ${updatedMatter.caseNumber} ("${updatedMatter.title}") details updated.`);
    setDoc(doc(db, 'matters', updatedMatter.id), updatedMatter).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `matters/${updatedMatter.id}`);
    });
  };

  const handleAddGeneratedDoc = (docData: GeneratedDocument) => {
    if (checkStorageLocked('save generated legal document')) return;
    setGeneratedDocs(prev => {
      const filtered = prev.filter(d => d.id !== docData.id);
      return [docData, ...filtered];
    });
    addLog('document', `Legal document saved: "${docData.title}" for Client ${docData.clientName}.`);
    setDoc(doc(db, 'generatedDocs', docData.id), docData).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `generatedDocs/${docData.id}`);
    });
  };

  const handleAddEvidenceFile = (file: EvidenceFile) => {
    if (checkStorageLocked('register client evidence file')) return;
    setEvidenceFiles(prev => {
      const filtered = prev.filter(f => f.id !== file.id);
      return [file, ...filtered];
    });
    addLog('document', `Client evidence file indexed & OCR scanned: "${file.name}" for Client ${file.clientName}.`);
    setDoc(doc(db, 'evidenceFiles', file.id), file).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `evidenceFiles/${file.id}`);
    });
  };

  const handleAddMessage = (msg: LegalMessage) => {
    if (checkStorageLocked('post chat message')) return;
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

  const handleSendZenMessage = async (userPrompt: string, agentName: 'PHOENIX' | 'EVE') => {
    const userMsg: LegalMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: 'Alex'
    };
    handleAddMessage(userMsg);

    const historyForApi = chatThread.concat(userMsg).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.content
    }));

    try {
      const res = await fetch('/api/gemini/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          agentRole: agentName === 'PHOENIX' ? 'Lead Co-Counsel' : 'Senior Practice AI Specialist',
          agentInstruction: `You are ${agentName}, senior AI legal specialist for Level 23 Consulting. The user Alex is co-counsel. Connected Google account: level23consulting@gmail.com.`
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: LegalMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          content: data.reply || 'Analysis completed successfully.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: agentName
        };
        handleAddMessage(botMsg);
      } else {
        const fallbackMsg: LegalMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          content: `I have received and logged your request regarding "${userPrompt.slice(0, 40)}...". All active files for level23consulting@gmail.com are accessible. Would you like me to open the active practice workspace dashboard for you?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: agentName
        };
        handleAddMessage(fallbackMsg);
      }
    } catch (e) {
      const fallbackMsg: LegalMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        content: `Request processed. Ready to assist with clients, matters, or pleadings for level23consulting@gmail.com.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: agentName
      };
      handleAddMessage(fallbackMsg);
    }
  };

  const handleUpdateAgentProgress = (updatedProgress: AgentProgress) => {
    if (checkStorageLocked('update AI agent capability level')) return;
    setAgentProgressList(prev => prev.map(p => p.agentId === updatedProgress.agentId ? updatedProgress : p));
    setDoc(doc(db, 'agentProgressList', updatedProgress.agentId), updatedProgress).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `agentProgressList/${updatedProgress.agentId}`);
    });
  };

  const handleAddConsultation = (session: ConsultationSession) => {
    if (checkStorageLocked('initialize video consultation room')) return;
    setConsultations(prev => [...prev, session]);
    addLog('system', `Active video Room initialized: "${session.roomName}" representing Client ${session.clientName}`);
    setDoc(doc(db, 'consultations', session.id), session).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `consultations/${session.id}`);
    });
  };

  const handleUpdateConsultation = (updatedSession: ConsultationSession) => {
    if (checkStorageLocked('update consultation details')) return;
    setConsultations(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    if (updatedSession.status === 'concluded') {
      addLog('system', `Concluded Video Consultation loop with ${updatedSession.clientName}. Transcripts saved as reference notes.`);
    }
    setDoc(doc(db, 'consultations', updatedSession.id), updatedSession).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `consultations/${updatedSession.id}`);
    });
  };

  const handleDeleteConsultation = (id: string) => {
    if (checkStorageLocked('archive/remove consultation session')) return;
    setConsultations(prev => prev.filter(s => s.id !== id));
    addLog('system', 'Archived consultation session successfully removed from indexes.');
    deleteDoc(doc(db, 'consultations', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `consultations/${id}`);
    });
  };

  const handleRestoreState = async (state: ImportedState) => {
    if (checkStorageLocked('restore backup database mirror')) return;
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

  const handleToggleStorageLock = () => {
    if (isStorageLocked) {
      setLockModalMode('unlock');
      setPinInput('');
      setLockError('');
      setShowLockModal(true);
    } else {
      if (storagePin && storagePin !== '1234') {
        setLockModalMode('lock');
        setPinInput('');
        setLockError('');
        setShowLockModal(true);
      } else {
        // If it's the default PIN '1234' or empty, let them set or confirm
        setLockModalMode('change-pin');
        setPinInput('');
        setLockError('');
        setShowLockModal(true);
      }
    }
  };

  const handleConfirmLockAction = () => {
    if (lockModalMode === 'unlock') {
      if (pinInput === storagePin) {
        setIsStorageLocked(false);
        localStorage.setItem('isStorageLocked', 'false');
        setShowLockModal(false);
        addLog('system', '🔓 Storage unlocked. Write & Sync permissions restored to local cache and Firestore cloud.');
      } else {
        setLockError('Incorrect Security PIN. Please try again.');
      }
    } else if (lockModalMode === 'lock') {
      if (pinInput === storagePin) {
        setIsStorageLocked(true);
        localStorage.setItem('isStorageLocked', 'true');
        setShowLockModal(false);
        addLog('system', '🔒 Storage write-locked. No local or cloud mutations allowed.');
      } else {
        setLockError('Incorrect Security PIN. Please try again.');
      }
    } else if (lockModalMode === 'change-pin') {
      if (pinInput.length < 4) {
        setLockError('PIN must be at least 4 digits.');
        return;
      }
      setStoragePin(pinInput);
      localStorage.setItem('storagePin', pinInput);
      setIsStorageLocked(true);
      localStorage.setItem('isStorageLocked', 'true');
      setShowLockModal(false);
      addLog('system', `🔒 Storage write-locked with custom security PIN: ${pinInput.replace(/./g, '*')}`);
    }
  };

  return isZenEntranceMode ? (
    <ZenEntranceView
      onActivateWorkspace={(targetTab) => {
        if (targetTab) setActiveTab(targetTab);
        setIsZenEntranceMode(false);
      }}
      chatThread={chatThread}
      onSendMessage={handleSendZenMessage}
      clients={clients}
      matters={matters}
      generatedDocs={generatedDocs}
      systemConnected={systemConnected}
      dbSyncStatus={dbSyncStatus}
    />
  ) : (
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
              onOpenOmniUpload={() => {
                setShowOmniUploadModal(true);
                addLog('system', 'Omni-Upload and Bilingual Hub modal triggered.');
              }}
              onOpenResearch={() => {
                setShowResearchDrawer(true);
                addLog('system', 'Judicial research portal triggered from sidebar navigation hub.');
              }}
              onQuickIntake={() => {
                setShowClientIntakeGeneratorModal(true);
                addLog('system', 'Client Intake Generator modal requested from sidebar navigation.');
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
                <div className="flex items-center gap-3">
                  {/* Universal Document Upload & Spanish Hub Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowOmniUploadModal(true);
                      addLog('system', 'Universal document upload and Spanish translation center opened.');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 border border-purple-500/50 hover:border-purple-400 text-purple-200 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                    title="Upload client intake sheets, evidence, contracts and translate to Spanish / extract to English"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                    <span className="hidden sm:inline">Upload Docs</span>
                    <span className="bg-purple-500/20 text-purple-300 text-[9px] px-1 py-0.5 rounded border border-purple-500/30">ES/EN</span>
                  </button>

                  {/* Google Translate bar in header */}
                  <GoogleTranslateBar
                    currentLanguage={currentAppLanguage}
                    onLanguageChange={(lang) => {
                      setCurrentAppLanguage(lang);
                      addLog('system', `Global language perspective switched to: ${lang.toUpperCase()}`);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setIsZenEntranceMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-sm"
                    title="Return to Phoenix AI Conversational Entrance Screen"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="hidden sm:inline">Zen AI Entrance</span>
                  </button>

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

                  {/* Storage security write-lock status pill */}
                  <button
                    onClick={handleToggleStorageLock}
                    className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-mono transition-all duration-300 select-none cursor-pointer hover:bg-slate-800/40 ${
                      isStorageLocked
                        ? 'bg-rose-500/15 border-rose-500/45 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)] animate-pulse'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}
                    title={isStorageLocked ? "Storage is Write-Locked (Click to unlock)" : "Storage is Active (Click to lock)"}
                  >
                    {isStorageLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                        <span>Storage Locked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="opacity-85">Storage Open</span>
                      </>
                    )}
                  </button>

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
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative min-h-0">
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

                  {activeTab === 'workspace' && (
                    <GoogleWorkspaceTab
                      key="workspace"
                      onNotify={(_type, msg) => addLog('system', `[Workspace] ${msg}`)}
                    />
                  )}

                  {activeTab === 'clients' && (
                    <ClientsTab
                      key="clients"
                      clients={clients}
                      onAddClient={handleAddClient}
                      loadMoreClients={loadMoreClients}
                      hasMoreClients={hasMoreClients}
                      isLoadingMoreClients={isLoadingMoreClients}
                      onOpenOmniUpload={() => setShowOmniUploadModal(true)}
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
                      isStorageLocked={isStorageLocked}
                      onToggleStorageLock={handleToggleStorageLock}
                      storagePin={storagePin}
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
                  { text: '✨ Google Workspace Hub (Gmail, Calendar, Tasks, Forms, Meet, Keep)', tab: 'workspace' },
                  { text: '✉️ Check and Compose Gmail messages', tab: 'workspace' },
                  { text: '📅 Schedule Google Calendar Hearings & Events', tab: 'workspace' },
                  { text: '✅ Manage Google Tasks & Litigation Deadlines', tab: 'workspace' },
                  { text: '📝 Google Forms Intake Questionnaires', tab: 'workspace' },
                  { text: '📹 Launch Google Meet Video Conference Space', tab: 'workspace' },
                  { text: '📌 Case Scratchpad & Google Keep Notes', tab: 'workspace' },
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

      {/* ------------------------------------------------------------- */}
      {/* GLOBAL MODALS: C. STORAGE SECURITY WRITE-LOCK GATEWAY */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showLockModal && (
          <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b101c] border border-[#1e293b] w-full max-w-sm rounded-2.5xl p-6 space-y-4 shadow-3xl text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-rose-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                    {lockModalMode === 'unlock' && 'Unlock Storage Cache'}
                    {lockModalMode === 'lock' && 'Lock Storage Cache'}
                    {lockModalMode === 'change-pin' && 'Set Security PIN & Lock'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLockModal(false)}
                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <p className="text-[11px] text-slate-400 leading-normal font-sans">
                  {lockModalMode === 'unlock' && 'Enter your 4-digit Security PIN to restore write and remote synchronization permissions.'}
                  {lockModalMode === 'lock' && 'Confirm your 4-digit Security PIN to seal all local database files and Firestore indexes.'}
                  {lockModalMode === 'change-pin' && 'Establish a personalized 4-digit Security PIN (default is 1234). This PIN is stored in secure local sandboxes and will be requested to authorize future cache modifications.'}
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Security PIN Code</label>
                  <input
                    type="password"
                    maxLength={8}
                    value={pinInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPinInput(val);
                      setLockError('');
                    }}
                    placeholder="••••"
                    className="w-full bg-[#060a12] border border-[#1e293b] rounded-xl px-3 py-2.5 text-center text-xl font-mono text-teal-400 focus:outline-none focus:border-teal-500/50"
                  />
                  {lockError && (
                    <p className="text-[10px] font-mono text-rose-400">{lockError}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowLockModal(false)}
                  className="flex-1 py-2.5 bg-[#060a12] border border-[#1e293b] text-slate-400 hover:text-white rounded-xl text-xs font-bold font-mono uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLockAction}
                  disabled={!pinInput}
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-bold font-mono text-xs uppercase rounded-xl transition-all cursor-pointer"
                >
                  {lockModalMode === 'unlock' && 'Unlock Cache'}
                  {lockModalMode === 'lock' && 'Lock Cache'}
                  {lockModalMode === 'change-pin' && 'Set & Lock'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TRANSIENT STORAGE LOCKED FLOATING NOTIFICATION BANNER */}
      <AnimatePresence>
        {storageLockedToast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 bg-rose-500/15 border border-rose-500/40 text-rose-300 font-sans font-bold text-xs rounded-full flex items-center gap-2 shadow-[0_10px_25px_-5px_rgba(244,63,94,0.3)] backdrop-blur-md"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>{storageLockedToast}</span>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">LOCKED</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ResearchPortalDrawer
        isOpen={showResearchDrawer}
        onClose={() => setShowResearchDrawer(false)}
        clients={clients}
        matters={matters}
      />

      {/* Client Intake Generator Modal */}
      <ClientIntakeGeneratorModal
        isOpen={showClientIntakeGeneratorModal}
        onClose={() => setShowClientIntakeGeneratorModal(false)}
        onAddClient={(newClient) => {
          setClients(prev => [newClient, ...prev]);
          addLog('client', `New Client Data Card created: ${newClient.name}`);
        }}
        onAddMatter={(newMatter) => {
          setMatters(prev => [newMatter, ...prev]);
          addLog('matter', `New Matter record opened: ${newMatter.title}`);
        }}
        onAddGeneratedDoc={(doc) => {
          setGeneratedDocs(prev => [doc, ...prev]);
          addLog('document', `Intake document record saved: ${doc.title}`);
        }}
        clients={clients}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
        }}
      />

      {/* Universal Document Upload & Spanish/English AI Hub Modal */}
      <OmniUploadModal
        isOpen={showOmniUploadModal}
        onClose={() => setShowOmniUploadModal(false)}
        clients={clients}
        matters={matters}
        onAddClient={(newClient) => {
          handleAddClient(newClient);
        }}
        onAddMatter={(newMatter) => {
          handleAddMatter(newMatter);
        }}
        onAddEvidenceFile={(file) => {
          handleAddEvidenceFile(file);
        }}
        onAddGeneratedDoc={(doc) => {
          handleAddGeneratedDoc(doc);
        }}
        onNotify={(type, message) => {
          addLog(type, message);
        }}
        onOpenIntakeModal={() => {
          setShowOmniUploadModal(false);
          setShowClientIntakeGeneratorModal(true);
        }}
      />

    </div>
  );
}
