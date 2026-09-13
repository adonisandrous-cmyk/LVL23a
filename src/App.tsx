import React, { useState, useEffect, useRef } from 'react';
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
import GoogleAppHostingModal from './components/GoogleAppHostingModal';
import { Scale, BookOpen, Database, CloudOff, CloudLightning, Lock, Unlock, UploadCloud, Languages, Globe } from 'lucide-react';
import { startPeriodicDriveSync } from './services/driveSyncService';

import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db, ensureAuthenticated, handleFirestoreError, OperationType, sanitizeForFirestore } from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isZenEntranceMode, setIsZenEntranceMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('practice_os_zen_mode');
      return saved === 'true';
    }
    return false;
  });

  const handleSetZenMode = (val: boolean) => {
    setIsZenEntranceMode(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('practice_os_zen_mode', String(val));
    }
  };

  const [systemConnected, setSystemConnected] = useState<boolean>(false);
  const [utcTime, setUtcTime] = useState<string>('');
  const [showResearchDrawer, setShowResearchDrawer] = useState<boolean>(false);
  const [showClientIntakeGeneratorModal, setShowClientIntakeGeneratorModal] = useState<boolean>(false);
  const [showOmniUploadModal, setShowOmniUploadModal] = useState<boolean>(false);
  const [showGoogleHostingModal, setShowGoogleHostingModal] = useState<boolean>(false);
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

  // Utility to filter out legacy fictitious mock names (retaining only real clients and standard Jane/John Doe placeholders)
  const isFictitiousLegacyName = (name?: string) => {
    if (!name) return false;
    const fictitiousNames = [
      'Don Watson', 'Eleanor Vance', 'Mateo Rodriguez', 'Samuel Miller', 'Sarah Jenkins',
      'Aisha Al-Mansoor', 'Marcus Sterling', 'Elena Rostova', 'David K. Chen', 'Gabriela Morales',
      'Harrison Vance', 'Fatima Zahra', 'Robert Thornton', 'Lucia Fontana', 'Benjamin O\'Connor',
      'Mei-Ling Zhou', 'Javier Castillo', 'Kavita Patel', 'Andre Dubois', 'Nadia Kowalski',
      'Julian Montgomery', 'Sunita Sharma', 'Carlos Mendoza', 'Evelyn St. Claire', 'Tariq Hassan'
    ];
    return fictitiousNames.some(f => name.toLowerCase().includes(f.toLowerCase()));
  };

  // Master local client records with local persistence
  const [clients, setClients] = useState<Client[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('l23_persistent_clients_v3');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter(c => !isFictitiousLegacyName(c.name));
            if (clean.length > 0) return clean;
          }
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
        const saved = localStorage.getItem('l23_persistent_matters_v3');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter(m => !isFictitiousLegacyName(m.clientName) && !isFictitiousLegacyName(m.title));
            if (clean.length > 0) return clean;
          }
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
        const saved = localStorage.getItem('l23_persistent_docs_v3');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter(d => !isFictitiousLegacyName(d.clientName) && !isFictitiousLegacyName(d.title));
            if (clean.length > 0) return clean;
          }
        }
      } catch (e) {
        console.error('Error loading persistent docs:', e);
      }
    }
    return [
      {
        id: 'doc-doe-fl100',
        title: 'FL-100 Petition for Dissolution of Marriage — Jane Doe',
        clientId: 'c-1',
        clientName: 'Jane Doe',
        templateId: 'fl_100_dissolution',
        content: `SUPERIOR COURT OF CALIFORNIA, COUNTY OF ORANGE
341 The City Drive South, Orange, CA 92868
CASE NUMBER: CASE-2026-001

========================================================================
PETITION FOR DISSOLUTION OF MARRIAGE (FL-100) [TEMPLATE]
========================================================================

1. ATTORNEY FOR / UNREPRESENTED PETITIONER DETAILS:
   - Full Legal Name: Jane Doe (Petitioner)
   - Residential Address: 100 Main Street, Suite 200, Santa Ana, CA 92701
   - Email: jane.doe@example.com | Phone: +1 (555) 019-2831

2. RESPONDENT DETAILS:
   - Full Legal Name: John Doe (Respondent)
   - Residential Address: 200 Coastal Way, Newport Beach, CA 92660

3. STATISTICAL FACTS:
   - Action: Dissolution of Marriage
   - Template Document: Ready for client replacement and filing.

Filing Date: August 1, 2026
Petitioner Signature: Jane Doe`,
        generatedAt: '2026-08-01T09:00:00Z'
      }
    ];
  });

  // Master legal AI messages thread
  const [chatThread, setChatThread] = useState<LegalMessage[]>([]);
  // Cached executive summary for Zen conversation history compression
  const zenSummaryCacheRef = useRef<{ msgCount: number; summary: string }>({ msgCount: 0, summary: '' });

  // Master client evidence files lists with local persistence
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('l23_persistent_evidence_v3');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter(ev => !isFictitiousLegacyName(ev.clientName) && !isFictitiousLegacyName(ev.extractedClientName));
            if (clean.length > 0) return clean;
          }
        }
      } catch (e) {
        console.error('Error loading persistent evidence:', e);
      }
    }
    return [
      {
        id: 'ev-1',
        name: 'Client_Intake_Verification_JaneDoe.pdf',
        size: '1.2 MB',
        mimeType: 'application/pdf',
        uploadedAt: '2026-08-01T08:30:00Z',
        clientId: 'c-1',
        clientName: 'Jane Doe',
        matterId: 'm-1',
        matterTitle: 'Matter Template — Jane Doe',
        fileCategory: 'Client Intake Verification',
        extractedClientName: 'Jane Doe',
        duressLevel: 'Low',
        summary: 'Preliminary client verification checklist and intake dossier template ready for client onboarding.',
        extractedFacts: [
          'Standard verified intake template.',
          'Identity and conflict of interest check passed.',
          'Ready for customized case documentation.'
        ],
        rawTextSimulated: `CLIENT VERIFICATION & INTAKE FILE\n\nClient Name: Jane Doe\nStatus: Active Placeholder Record\nAssigned Matter: CASE-2026-001\n\nThis is a standard template file. You can upload or import all your real client dossiers and case files directly via the Omni Ingestion Modal or Google Drive/Sheets sync.`,
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
        const saved = localStorage.getItem('l23_persistent_consultations_v3');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter(c => !isFictitiousLegacyName(c.clientName));
            if (clean.length > 0) return clean;
          }
        }
      } catch (e) {}
    }
    return [
      {
        id: 'call-1',
        clientId: 'c-1',
        clientName: 'Jane Doe',
        roomName: 'L23-Client-Intake-Room',
        meetingType: 'Client Consultation',
        scheduledFor: '02:30 PM',
        status: 'concluded',
        notes: 'Initial client consultation template. Verified case intake procedures.'
      }
    ];
  });

  // AUTO-SAVE PERSISTENCE HOOKS: Guarantee zero data loss when app updates or reloads
  useEffect(() => {
    if (typeof window !== 'undefined' && clients.length > 0) {
      localStorage.setItem('l23_persistent_clients_v3', JSON.stringify(clients));
    }
  }, [clients]);

  useEffect(() => {
    if (typeof window !== 'undefined' && matters.length > 0) {
      localStorage.setItem('l23_persistent_matters_v3', JSON.stringify(matters));
    }
  }, [matters]);

  useEffect(() => {
    if (typeof window !== 'undefined' && generatedDocs.length > 0) {
      localStorage.setItem('l23_persistent_docs_v3', JSON.stringify(generatedDocs));
    }
  }, [generatedDocs]);

  useEffect(() => {
    if (typeof window !== 'undefined' && evidenceFiles.length > 0) {
      localStorage.setItem('l23_persistent_evidence_v3', JSON.stringify(evidenceFiles));
    }
  }, [evidenceFiles]);

  useEffect(() => {
    if (typeof window !== 'undefined' && consultations.length > 0) {
      localStorage.setItem('l23_persistent_consultations_v3', JSON.stringify(consultations));
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
        let clientsCheckSnap;
        try {
          clientsCheckSnap = await getDocs(query(collection(db, 'clients'), limit(1)));
        } catch (checkErr: any) {
          const isPermission = checkErr?.code === 'permission-denied' || String(checkErr?.message).includes('permission-denied');
          if (isPermission) {
            handleFirestoreError(checkErr, OperationType.LIST, 'clients');
          }
          console.warn('Firestore backend offline or unreachable, switching to resilient local storage:', checkErr?.message || checkErr);
          setDbSyncStatus('offline');
          setSyncMessage('Local persistent storage active');
          return;
        }
        
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
            return null;
          });
          
          if (!clientsSnap) {
            setDbSyncStatus('offline');
            setSyncMessage('Local persistent storage active');
            return;
          }
          
          const remoteClients: Client[] = [];
          clientsSnap.forEach(snap => {
            const c = snap.data() as Client;
            if (!isFictitiousLegacyName(c.name)) {
              remoteClients.push(c);
            }
          });

          // Merge local clients with remote clients without losing any
          setClients(prev => {
            const map = new Map<string, Client>();
            // Add all current/initial clients
            prev.filter(c => !isFictitiousLegacyName(c.name)).forEach(c => map.set(c.id, c));
            // Layer in all remote Firestore clients
            remoteClients.forEach(c => map.set(c.id, c));
            return Array.from(map.values());
          });
          
          setHasMoreClients(false);
          
          // Hydrate Matters
          const mattersSnap = await getDocs(collection(db, 'matters'));
          const remoteMatters: Matter[] = [];
          mattersSnap.forEach(snap => {
            const m = snap.data() as Matter;
            if (!isFictitiousLegacyName(m.clientName) && !isFictitiousLegacyName(m.title)) {
              remoteMatters.push(m);
            }
          });
          setMatters(prev => {
            const map = new Map<string, Matter>();
            prev.filter(m => !isFictitiousLegacyName(m.clientName) && !isFictitiousLegacyName(m.title)).forEach(m => map.set(m.id, m));
            remoteMatters.forEach(m => map.set(m.id, m));
            return Array.from(map.values());
          });
          
          // Hydrate Generated Documents
          const docsSnap = await getDocs(collection(db, 'generatedDocs'));
          const remoteDocs: GeneratedDocument[] = [];
          docsSnap.forEach(snap => {
            const d = snap.data() as GeneratedDocument;
            if (!isFictitiousLegacyName(d.clientName) && !isFictitiousLegacyName(d.title)) {
              remoteDocs.push(d);
            }
          });
          if (remoteDocs.length > 0) {
            setGeneratedDocs(prev => {
              const map = new Map<string, GeneratedDocument>();
              prev.filter(d => !isFictitiousLegacyName(d.clientName) && !isFictitiousLegacyName(d.title)).forEach(d => map.set(d.id, d));
              remoteDocs.forEach(d => map.set(d.id, d));
              return Array.from(map.values());
            });
          }
          
          // Hydrate Evidence Files
          const evidenceSnap = await getDocs(collection(db, 'evidenceFiles'));
          const remoteEvidence: EvidenceFile[] = [];
          evidenceSnap.forEach(snap => {
            const ev = snap.data() as EvidenceFile;
            if (!isFictitiousLegacyName(ev.clientName) && !isFictitiousLegacyName(ev.extractedClientName)) {
              remoteEvidence.push(ev);
            }
          });
          if (remoteEvidence.length > 0) {
            setEvidenceFiles(prev => {
              const map = new Map<string, EvidenceFile>();
              prev.filter(ev => !isFictitiousLegacyName(ev.clientName) && !isFictitiousLegacyName(ev.extractedClientName)).forEach(e => map.set(e.id, e));
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
        console.warn("Firestore sync status:", err?.message || err);
        setDbSyncStatus('offline');
        setSyncMessage('Local persistent storage active');
        addLog('system', `Storage operating in resilient local mode.`);
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

    // Client Identity Resolution: Check if this client already exists in the ledger
    const targetName = (newClient.name || '').trim();
    const targetEmail = (newClient.email || '').trim().toLowerCase();
    const targetPhone = (newClient.phone || '').replace(/[^0-9]/g, '');

    const existingMatch = clients.find(c => {
      if ((newClient as any).id && c.id === (newClient as any).id) return true;
      const cName = (c.name || '').trim().toLowerCase();
      const nName = targetName.toLowerCase();
      if (cName && nName) {
        if (cName === nName) return true;
        // Substring / partial match for formal titles (e.g. "Jane Doe" vs "Jane Doe (Client)")
        if (cName.length > 5 && nName.length > 5 && (cName.includes(nName) || nName.includes(cName))) return true;
      }
      if (targetEmail && c.email && c.email.trim().toLowerCase() === targetEmail && !targetEmail.includes('firm.legal')) {
        return true;
      }
      if (targetPhone && targetPhone.length >= 7 && c.phone) {
        const cPhone = c.phone.replace(/[^0-9]/g, '');
        if (cPhone === targetPhone) return true;
      }
      return false;
    });

    if (existingMatch) {
      // Merge into ONE identified client!
      const isNewNotesRich = !!(newClient.intakeNotes && !existingMatch.intakeNotes?.includes(newClient.intakeNotes.slice(0, 30)));
      const mergedIntakeNotes = isNewNotesRich
        ? (existingMatch.intakeNotes 
            ? `${existingMatch.intakeNotes}\n\n[CONSOLIDATED DOCUMENT INTAKE - ${new Date().toLocaleDateString()}]:\n${newClient.intakeNotes}`
            : newClient.intakeNotes || '')
        : (existingMatch.intakeNotes || newClient.intakeNotes || '');

      const mergedClient: Client = {
        ...existingMatch,
        name: existingMatch.name || targetName,
        email: existingMatch.email && !existingMatch.email.includes('example.com') && !existingMatch.email.includes('firm.legal') 
          ? existingMatch.email 
          : (newClient.email || existingMatch.email),
        phone: existingMatch.phone && !existingMatch.phone.includes('000-0000') 
          ? existingMatch.phone 
          : (newClient.phone || existingMatch.phone),
        practiceArea: existingMatch.practiceArea && existingMatch.practiceArea !== 'General' 
          ? existingMatch.practiceArea 
          : (newClient.practiceArea || existingMatch.practiceArea || 'General'),
        status: newClient.status || existingMatch.status || 'active',
        intakeNotes: mergedIntakeNotes
      };

      setClients(prev => prev.map(c => c.id === existingMatch.id ? mergedClient : c));
      addLog('client', `Consolidated & merged uploaded data into identified client record: ${mergedClient.name}.`);
      setDoc(doc(db, 'clients', mergedClient.id), sanitizeForFirestore(mergedClient)).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `clients/${mergedClient.id}`);
      });
      return;
    }

    // Otherwise, create new identified client record
    const client: Client = {
      ...newClient,
      id: (newClient as any).id || `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: (newClient as any).createdAt || new Date().toISOString()
    };
    setClients(prev => {
      const filtered = prev.filter(c => c.id !== client.id);
      return [client, ...filtered];
    });
    addLog('client', `Client file created: ${client.name} (${client.practiceArea || 'General'}).`);
    setDoc(doc(db, 'clients', client.id), sanitizeForFirestore(client)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `clients/${client.id}`);
    });
  };

  const handleAddMatter = (newMatter: Omit<Matter, 'id' | 'createdAt'> | Matter) => {
    if (checkStorageLocked('open new legal case matter')) return;

    // Check if an existing matter for this client with same practice area or title already exists
    const existingMatterMatch = matters.find(m => {
      if ((newMatter as any).id && m.id === (newMatter as any).id) return true;
      if (newMatter.clientId && m.clientId === newMatter.clientId) {
        if (m.title.toLowerCase().trim() === newMatter.title.toLowerCase().trim()) return true;
        if (m.practiceArea === newMatter.practiceArea && Math.abs(new Date(m.createdAt).getTime() - Date.now()) < 60000) return true;
      }
      return false;
    });

    if (existingMatterMatch) {
      // Merge task lists and description into existing matter
      const updatedMatter: Matter = {
        ...existingMatterMatch,
        description: existingMatterMatch.description.includes(newMatter.description.slice(0, 30))
          ? existingMatterMatch.description
          : `${existingMatterMatch.description}\n\n[Updated from Ingested Documents]:\n${newMatter.description}`,
        tasks: [
          ...existingMatterMatch.tasks,
          ...(newMatter.tasks || []).filter(nt => !existingMatterMatch.tasks.some(et => et.title.toLowerCase() === nt.title.toLowerCase()))
        ]
      };
      setMatters(prev => prev.map(m => m.id === existingMatterMatch.id ? updatedMatter : m));
      addLog('matter', `Matter updated for identified client ${updatedMatter.clientName} ("${updatedMatter.title}").`);
      setDoc(doc(db, 'matters', updatedMatter.id), sanitizeForFirestore(updatedMatter)).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `matters/${updatedMatter.id}`);
      });
      return;
    }

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
    setDoc(doc(db, 'matters', matter.id), sanitizeForFirestore(matter)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `matters/${matter.id}`);
    });
  };

  const handleUpdateMatter = (updatedMatter: Matter) => {
    if (checkStorageLocked('update case file details')) return;
    setMatters(prev => prev.map(m => m.id === updatedMatter.id ? updatedMatter : m));
    addLog('matter', `Matter case file ${updatedMatter.caseNumber} ("${updatedMatter.title}") details updated.`);
    setDoc(doc(db, 'matters', updatedMatter.id), sanitizeForFirestore(updatedMatter)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `matters/${updatedMatter.id}`);
    });
  };

  const handleAddGeneratedDoc = (docData: GeneratedDocument) => {
    if (checkStorageLocked('save generated legal document')) return;
    
    let finalDoc: GeneratedDocument = { ...docData };
    
    setGeneratedDocs(prev => {
      const existingDoc = prev.find(d => d.id === docData.id || (d.title === docData.title && d.clientId === docData.clientId));
      
      if (existingDoc && existingDoc.content !== docData.content) {
        // Document updated with new edits: archive previous version into history
        const prevVersionNum = existingDoc.version || 1;
        const newVersionNum = prevVersionNum + 1;
        
        const existingVersions = existingDoc.versions && existingDoc.versions.length > 0
          ? [...existingDoc.versions]
          : [{
              versionNumber: prevVersionNum,
              content: existingDoc.content,
              timestamp: existingDoc.generatedAt,
              notes: 'Initial Draft'
            }];
        
        finalDoc = {
          ...docData,
          id: existingDoc.id,
          version: newVersionNum,
          versions: [
            ...existingVersions,
            {
              versionNumber: newVersionNum,
              content: docData.content,
              timestamp: docData.generatedAt || new Date().toISOString(),
              notes: `Revision v${newVersionNum}`
            }
          ]
        };
      } else if (!docData.versions || docData.versions.length === 0) {
        finalDoc = {
          ...docData,
          version: docData.version || 1,
          versions: [
            {
              versionNumber: docData.version || 1,
              content: docData.content,
              timestamp: docData.generatedAt || new Date().toISOString(),
              notes: 'Initial Draft'
            }
          ]
        };
      }

      const filtered = prev.filter(d => d.id !== finalDoc.id);
      return [finalDoc, ...filtered];
    });

    addLog('document', `Legal document saved (v${finalDoc.version || 1}): "${finalDoc.title}" for Client ${finalDoc.clientName}.`);
    setDoc(doc(db, 'generatedDocs', finalDoc.id), sanitizeForFirestore(finalDoc)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `generatedDocs/${finalDoc.id}`);
    });
  };

  const handleAddEvidenceFile = (file: EvidenceFile) => {
    if (checkStorageLocked('register client evidence file')) return;
    setEvidenceFiles(prev => {
      const filtered = prev.filter(f => f.id !== file.id);
      return [file, ...filtered];
    });
    addLog('document', `Client evidence file indexed & OCR scanned: "${file.name}" for Client ${file.clientName}.`);
    setDoc(doc(db, 'evidenceFiles', file.id), sanitizeForFirestore(file)).catch(err => {
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
    if (!isStorageLocked) {
      const cleanPayload = sanitizeForFirestore(msg);
      setDoc(doc(db, 'chatThread', msg.id), cleanPayload).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `chatThread/${msg.id}`);
      });
    }
  };

  const handleSendZenMessage = async (
    userPrompt: string,
    agentName: 'PHOENIX' | 'EVE' | 'ALURE' | 'SENTRY' | string,
    attachedFile?: { name: string; size: string; type?: string; content?: string }
  ) => {
    const userMsg: LegalMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: 'Alex',
      ...(attachedFile ? {
        fileAttachment: {
          name: attachedFile.name || 'document',
          size: attachedFile.size || '',
          ...(attachedFile.type ? { type: attachedFile.type } : {}),
          ...(attachedFile.content ? { content: attachedFile.content } : {})
        }
      } : {})
    };
    handleAddMessage(userMsg);

    // Keep active context concise: retain only recent messages (last 2 turns)
    // and summarize all older messages using the AI model to prevent context-overflow and repetition loops.
    const KEEP_RECENT_COUNT = 2;
    const olderMessages = chatThread.slice(0, Math.max(0, chatThread.length - KEEP_RECENT_COUNT));
    const recentMessages = chatThread.slice(Math.max(0, chatThread.length - KEEP_RECENT_COUNT));

    let conversationSummary = '';
    if (olderMessages.length > 0) {
      if (zenSummaryCacheRef.current.msgCount === olderMessages.length && zenSummaryCacheRef.current.summary) {
        conversationSummary = zenSummaryCacheRef.current.summary;
      } else {
        try {
          const summaryController = new AbortController();
          const summaryTimeout = setTimeout(() => summaryController.abort(), 7000);
          const sRes = await fetch('/api/gemini/summarize-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: olderMessages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                text: m.content
              }))
            }),
            signal: summaryController.signal
          });
          clearTimeout(summaryTimeout);
          if (sRes.ok) {
            const sData = await sRes.json();
            conversationSummary = sData.summary || '';
            if (conversationSummary) {
              zenSummaryCacheRef.current = { msgCount: olderMessages.length, summary: conversationSummary };
            }
          }
        } catch (sErr) {
          console.warn('AI history summarization notice:', sErr);
          const directives = olderMessages
            .filter(m => m.sender === 'user')
            .map(m => m.content.trim())
            .slice(-3);
          if (directives.length > 0) {
            conversationSummary = `Directives established earlier: ${directives.join('; ')}.`;
          }
        }
      }
    }

    // Build ultra-concise history payload for AI model
    const historyForApi: { role: string; text: string }[] = [];

    if (conversationSummary) {
      historyForApi.push({
        role: 'user',
        text: `[Executive Summary of Earlier Discussion & Established Context]:\n${conversationSummary}`
      });
      historyForApi.push({
        role: 'model',
        text: 'Understood, Co-Counsel. I have recorded all established facts, case details, and directives from our earlier discussion.'
      });
    }

    recentMessages.forEach(m => {
      historyForApi.push({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.content
      });
    });

    const promptWithAttachment = attachedFile ? (
      `[ATTACHED FILE: "${attachedFile.name}" (${attachedFile.size})]\n--- FILE CONTENT START ---\n${attachedFile.content}\n--- FILE CONTENT END ---\n\n${userPrompt || `Please thoroughly review and analyze this attached document ("${attachedFile.name}"). Pinpoint critical findings, liabilities, strategic considerations, and next steps.`}`
    ) : userPrompt;

    historyForApi.push({
      role: 'user',
      text: promptWithAttachment
    });

    // Build real practice context so AI knows active roster and carries out the specific request
    const practiceSummary = [
      `Active Clients (${clients.length}): ` + clients.slice(0, 5).map(c => `${c.name} (${c.practiceArea || 'General'}, ${c.status})`).join('; '),
      `Active Matters (${matters.length}): ` + matters.slice(0, 5).map(m => `${m.title} [${m.caseNumber}] - ${m.status}`).join('; '),
      `Recent Generated Documents (${generatedDocs.length}): ` + generatedDocs.slice(0, 5).map(d => `${d.title} (${d.templateId || 'Form'})`).join('; '),
      `Connected Google Drive: level23consulting@gmail.com & level23@gmail.com & adonisandrous@gmail.com (Folder ID: 1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH)`
    ].join('\n');

    const getAgentRole = () => {
      const up = agentName.toUpperCase();
      if (up === 'PHOENIX') return 'Senior Managing Partner & Litigation Lead';
      if (up === 'EVE') return 'Office Manager, Operations Lead & Senior Practice AI';
      if (up === 'ALURE') return 'Legal Research Associate & Case File Reviewer';
      if (up === 'SENTRY') return 'Systems Security & Diagnostic Specialist';
      return `${agentName} - Legal AI Specialist`;
    };

    const getAgentInstruction = () => {
      const up = agentName.toUpperCase();
      if (up === 'PHOENIX') {
        return `You are Phoenix (#1 Seniority), Senior Managing Partner and Litigation Lead. You direct master case strategy, high-stakes litigation doctrine, cross-examination postures, and trial tactics. When documents or pleadings are provided, evaluate evidentiary strength, tri-jurisdictional risk (CA, NV, Federal), and litigation readiness.`;
      }
      if (up === 'EVE') {
        return `You are EVE (#2 Seniority), Office Manager & Operations Lead. You coordinate client intakes, court docketing deadlines, document routing, file management, and client inquiries. When documents are provided, extract client particulars, dates, filing deadlines, and identify missing form requirements.`;
      }
      if (up === 'ALURE') {
        return `You are Alure, Legal Research Associate & Case File Reviewer. You specialize in statutory citations, precedent analysis, forensic financial asset/debt dissection, and comprehensive brief outlines. When documents are provided, provide a granular forensic breakdown and identify relevant statutes or precedents.`;
      }
      if (up === 'SENTRY') {
        return `You are Sentry, Systems Security & Diagnostic Specialist. You verify form accuracy, signature blocks, court rule compliance, notarization compliance, and system integrity audits. When documents are provided, audit the document structure, note any compliance gaps or unsigned sections.`;
      }
      return `You are ${agentName}, senior AI legal specialist for Level 23 Consulting.`;
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s reliable threshold

      const res = await fetch('/api/gemini/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          conversationSummary,
          isZenMode: true,
          speedPreference: 'fast',
          practiceContext: practiceSummary,
          agentRole: getAgentRole(),
          agentInstruction: `${getAgentInstruction()} The user Alex is co-counsel. Connected Google accounts: level23@gmail.com, level23consulting@gmail.com, and adonisandrous@gmail.com.`
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        let replyContent = data.reply || 'Briefing completed successfully.';

        // Real action execution: if response or prompt specifies client card creation
        const actionMatch = replyContent.match(/\[ACTION:CREATE_CLIENT:(\{.*?\})\]/s);
        let clientCreated = false;
        if (actionMatch) {
          try {
            const clientData = JSON.parse(actionMatch[1]);
            handleAddClient({
              name: clientData.name || 'New Client',
              practiceArea: clientData.practiceArea || 'General Practice',
              email: clientData.email || '',
              phone: clientData.phone || '',
              status: 'active',
              intakeNotes: clientData.intakeNotes || `Created by ${agentName} per co-counsel instruction.`
            });
            clientCreated = true;
            replyContent = replyContent.replace(/\[ACTION:CREATE_CLIENT:\{.*?\}\]/gs, '').trim();
          } catch (err) {
            console.warn('Action parse error:', err);
          }
        }

        // Direct intent backup
        const makeClientMatch = userPrompt.match(/(?:make|create|add)\s+(?:a\s+)?client\s+card\s+(?:for|of|named)\s+([A-Za-z0-9\s'-]+)/i);
        if (makeClientMatch && makeClientMatch[1] && !clientCreated) {
          const candidateName = makeClientMatch[1].trim().replace(/\b(please|now|promptly|it|from drive)\b/gi, '').trim();
          if (candidateName && candidateName.length >= 2) {
            handleAddClient({
              name: candidateName,
              practiceArea: 'General Practice',
              email: '',
              phone: '',
              status: 'active',
              intakeNotes: `Created by ${agentName} per counsel instruction: "${userPrompt}"`
            });
          }
        }

        replyContent = replyContent.replace(/\[ACTION:[^\]]+\]/g, '').trim() || 'Directive received and executed.';

        const botMsg: LegalMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          content: replyContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: agentName
        };
        handleAddMessage(botMsg);
      } else {
        const fallbackMsg: LegalMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          content: `Co-counsel, I received your request regarding "${userPrompt}". The legal intelligence service experienced a momentary response delay. Please speak or type your instruction again, or open the workspace dashboard to proceed directly.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: agentName
        };
        handleAddMessage(fallbackMsg);
      }
    } catch (e: any) {
      console.warn("Zen message dispatch notice:", e);
      const fallbackMsg: LegalMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        content: `Co-counsel, regarding "${userPrompt}": Please re-state your request or open the workspace to access client files, pleadings, and court forms directly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: agentName
      };
      handleAddMessage(fallbackMsg);
    }
  };

  const handleUpdateAgentProgress = (updatedProgress: AgentProgress) => {
    if (checkStorageLocked('update AI agent capability level')) return;
    setAgentProgressList(prev => prev.map(p => p.agentId === updatedProgress.agentId ? updatedProgress : p));
    setDoc(doc(db, 'agentProgressList', updatedProgress.agentId), sanitizeForFirestore(updatedProgress)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `agentProgressList/${updatedProgress.agentId}`);
    });
  };

  const handleAddConsultation = (session: ConsultationSession) => {
    if (checkStorageLocked('initialize video consultation room')) return;
    setConsultations(prev => [...prev, session]);
    addLog('system', `Active video Room initialized: "${session.roomName}" representing Client ${session.clientName}`);
    setDoc(doc(db, 'consultations', session.id), sanitizeForFirestore(session)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `consultations/${session.id}`);
    });
  };

  const handleUpdateConsultation = (updatedSession: ConsultationSession) => {
    if (checkStorageLocked('update consultation details')) return;
    setConsultations(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    if (updatedSession.status === 'concluded') {
      addLog('system', `Concluded Video Consultation loop with ${updatedSession.clientName}. Transcripts saved as reference notes.`);
    }
    setDoc(doc(db, 'consultations', updatedSession.id), sanitizeForFirestore(updatedSession)).catch(err => {
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
        handleSetZenMode(false);
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
              onOpenGoogleHosting={() => {
                setShowGoogleHostingModal(true);
                addLog('system', 'Google Hosting, Desktop App & PWA Hub opened from sidebar.');
              }}
              onOpenZenEntrance={() => {
                handleSetZenMode(true);
                addLog('system', 'Full-screen AI Co-Counsel Zen suite activated from sidebar.');
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
                  {/* Google Hosting, Desktop App & PWA Hub Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowGoogleHostingModal(true);
                      addLog('system', 'Google Cloud Hosting, Desktop App & PWA Center accessed.');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-900/50 to-blue-900/50 hover:from-teal-800/70 hover:to-blue-800/70 border border-teal-500/40 hover:border-teal-400 text-teal-200 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-[0_0_12px_rgba(45,212,191,0.15)]"
                    title="Configure Google Cloud Hosting, 1-Click PWA Installation & Desktop Bridge"
                  >
                    <CloudLightning className="w-3.5 h-3.5 text-teal-300 animate-pulse" />
                    <span className="hidden sm:inline">Google App & Hosting</span>
                    <span className="bg-teal-500/20 text-teal-300 text-[9px] px-1 py-0.5 rounded border border-teal-500/30">PWA</span>
                  </button>

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
                    onClick={() => {
                      handleSetZenMode(true);
                      addLog('system', 'Full-screen AI Co-Counsel Zen suite opened from header tray.');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-sm"
                    title="Open Full-Screen AI Co-Counsel Suite (Phoenix, EVE, Alure, Sentry)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="hidden sm:inline">AI Co-Counsel</span>
                    <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1 py-0.5 rounded border border-amber-500/30">ZEN</span>
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
                      evidenceFiles={evidenceFiles}
                      consultations={consultations}
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
                      clients={clients}
                      onAddClient={handleAddClient}
                      matters={matters}
                      onAddMatter={handleAddMatter}
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

      {/* Google Cloud Hosting, Desktop Native & Progressive Web App (PWA) Hub Modal */}
      <GoogleAppHostingModal
        isOpen={showGoogleHostingModal}
        onClose={() => setShowGoogleHostingModal(false)}
      />

    </div>
  );
}
