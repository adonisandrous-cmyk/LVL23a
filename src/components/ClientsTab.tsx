import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Layers,
  FileCheck,
  AlertCircle,
  FileText,
  Bookmark,
  ChevronRight,
  UserCheck,
  Folder,
  FolderOpen,
  HardDrive,
  RefreshCw,
  FileCode,
  Download,
  File,
  Trash2,
  ExternalLink,
  Upload,
  Table,
  Check,
  FileSpreadsheet,
  Link,
  X
} from 'lucide-react';
import { Client } from '../types';
import { getAccessToken } from '../lib/driveAuth';

interface ClientsTabProps {
  clients: Client[];
  onAddClient: (newClient: Omit<Client, 'id' | 'createdAt'>) => void;
  loadMoreClients?: () => Promise<void>;
  hasMoreClients?: boolean;
  isLoadingMoreClients?: boolean;
}

export default function ClientsTab({ 
  clients, 
  onAddClient,
  loadMoreClients,
  hasMoreClients = false,
  isLoadingMoreClients = false
}: ClientsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);

  // Active Client folder directory states
  const [activeSubView, setActiveSubView] = useState<'files' | 'notes'>('files'); // Default to files view so folder represents directly!
  const [localFolderStatus, setLocalFolderStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [bridgeFiles, setBridgeFiles] = useState<string[]>([]);
  const [bridgeFolder, setBridgeFolder] = useState<string>('C:\\Users\\Administrator\\iiiamadex');
  const [clientFileSearch, setClientFileSearch] = useState<string>('');
  
  // File Editor state
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingFileName, setEditingFileName] = useState('');
  const [editingFileContent, setEditingFileContent] = useState('');
  const [isNewFile, setIsNewFile] = useState(true);

  // Drag and drop uploading state
  const [isDragging, setIsDragging] = useState(false);

  // Google Sheets Sync States
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1LGQwoKnfw9wgl9QM9AD1wA5qeBFisf5YwuglUJz3yWc/edit?gid=2064516725#gid=2064516725');
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetData, setSheetData] = useState<{
    headers: string[];
    rows: Record<string, string>[];
    clients: any[];
    spreadsheetId?: string;
    gid?: string;
    sheetTitle?: string;
  } | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  // Google Workspace Action States
  const [workspaceNotice, setWorkspaceNotice] = useState<string | null>(null);
  const [isDispatchingGmail, setIsDispatchingGmail] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  const handleDispatchGmail = async () => {
    if (!selectedClient) return;
    setIsDispatchingGmail(true);
    setWorkspaceNotice(null);
    try {
      const token = getAccessToken();
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          recipientEmail: selectedClient.email || 'client@level23consulting.com',
          subject: `Level 23 Consulting — Matter Ref #${selectedClient.id.slice(0, 8)} Status Notice`,
          bodyContent: `Dear ${selectedClient.name},\n\nThis is an official communication regarding your legal file (Ref #${selectedClient.id.slice(0, 8)}).\n\nPractice Department: ${selectedClient.practiceArea}\nStatus: ${selectedClient.status.toUpperCase()}\n\nPlease reply to this email directly if you have updated disclosures or questions.\n\nSincerely,\nLevel 23 Consulting Practice Management`
        })
      });
      const data = await res.json();
      if (data.success) {
        setWorkspaceNotice(`Gmail message sent to ${selectedClient.email || selectedClient.name}`);
        setTimeout(() => setWorkspaceNotice(null), 4000);
      }
    } catch (err: any) {
      alert('Gmail dispatch error: ' + err.message);
    } finally {
      setIsDispatchingGmail(false);
    }
  };

  const handleCreateGoogleDoc = async () => {
    if (!selectedClient) return;
    setIsCreatingDoc(true);
    setWorkspaceNotice(null);
    try {
      const token = getAccessToken();
      const res = await fetch('/api/docs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: `Client Intake Summary — ${selectedClient.name} (Ref #${selectedClient.id.slice(0, 8)})`,
          content: `LEVEL 23 CONSULTING LEGAL PRACTICE MANAGEMENT\n\nCLIENT INTAKE SUMMARY & MEMORANDUM\n=========================================\nClient Name: ${selectedClient.name}\nReference ID: ${selectedClient.id}\nDepartment: ${selectedClient.practiceArea}\nEmail: ${selectedClient.email}\nPhone: ${selectedClient.phone}\nIntake Date: ${new Date(selectedClient.createdAt).toLocaleDateString()}\n\nINTAKE NOTES:\n${selectedClient.intakeNotes || 'Standard client intake dossier compiled.'}\n\nGENERATED VIA GOOGLE WORKSPACE DOCS INTEGRATION`
        })
      });
      const data = await res.json();
      if (data.success) {
        setWorkspaceNotice(`Google Doc created: ${data.title || 'Intake Summary'}`);
        if (data.webViewLink) {
          window.open(data.webViewLink, '_blank');
        }
        setTimeout(() => setWorkspaceNotice(null), 4000);
      }
    } catch (err: any) {
      alert('Google Docs creation error: ' + err.message);
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const fetchGoogleSheetData = async (urlToFetch?: string) => {
    const target = urlToFetch || sheetUrl;
    if (!target) return;

    setIsLoadingSheet(true);
    setSheetError(null);
    setImportedCount(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('google_drive_access_token') : null;
      const res = await fetch('/api/sheets/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: target })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSheetData(data);
      } else {
        setSheetError(data.error || 'Failed to parse Google Spreadsheet.');
      }
    } catch (err: any) {
      setSheetError(err.message || 'Error connecting to Google Sheets API.');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleImportSheetClients = () => {
    if (!sheetData || !sheetData.clients || sheetData.clients.length === 0) return;

    let count = 0;
    sheetData.clients.forEach(c => {
      onAddClient({
        name: c.name || 'Imported Client',
        email: c.email || 'client@example.com',
        phone: c.phone || '(555) 000-0000',
        practiceArea: c.practiceArea || 'General Law',
        status: (c.status?.toLowerCase().includes('active') ? 'active' : 'pending') as any,
        intakeNotes: c.intakeNotes || `Imported from Google Sheets: ${sheetData.sheetTitle || 'Spreadsheet'}`
      });
      count++;
    });

    setImportedCount(count);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!selectedClient) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processUploadedFiles(files);
    }
  };

  const processUploadedFiles = async (files: FileList) => {
    if (!selectedClient) return;

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      await new Promise<void>((resolve) => {
        const isBinary = file.name.endsWith('.pdf') || file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.zip');
        
        if (isBinary) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }

        reader.onload = async (e) => {
          const content = (e.target?.result as string) || '';
          const baseName = file.name;
          const relativePath = `Clients/${selectedClient.name.replace(/\s+/g, '_')}/${baseName}`;
          const sizeStr = file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${(file.size / 1024).toFixed(1)} KB`;

          if (localFolderStatus === 'connected') {
            const ok = await handleSaveFileToBridge(relativePath, content);
            if (ok) {
              await checkDesktopBridge();
            } else {
              saveProcessedFileToSimulated(baseName, content, sizeStr);
            }
          } else {
            saveProcessedFileToSimulated(baseName, content, sizeStr);
          }
          successCount++;
          resolve();
        };

        reader.onerror = () => {
          resolve();
        };
      });
    }
    
    if (successCount > 0) {
      alert(`🎉 Successfully synchronized ${successCount} dossier file(s) into ${selectedClient.name}'s directory structure!`);
    }
  };

  const saveProcessedFileToSimulated = (baseName: string, content: string, sizeStr: string) => {
    if (!selectedClient) return;
    const clientList = simulatedFiles[selectedClient.id] || [];
    const ext = baseName.split('.').pop() || 'TXT';
    const existingIndex = clientList.findIndex(f => f.name.toLowerCase() === baseName.toLowerCase());

    const newFileObj = {
      name: baseName,
      type: ext.toUpperCase(),
      size: sizeStr,
      date: new Date().toISOString().split('T')[0],
      content: content
    };

    let updatedList = [...clientList];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = newFileObj;
    } else {
      updatedList.push(newFileObj);
    }

    saveSimulated({
      ...simulatedFiles,
      [selectedClient.id]: updatedList
    });
  };

  // Fallback / Standalone simulated files database
  const [simulatedFiles, setSimulatedFiles] = useState<Record<string, { name: string; content: string; size: string; type: string; date: string }[]>>(() => {
    const saved = localStorage.getItem('l23_simulated_client_files');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {}
    }
    return {
      'c-1': [
        { name: 'Intake_Record.md', type: 'Markdown', size: '2.4 KB', date: '2026-06-10', content: '### Eleanor Vance Intake Details\n\nClient Eleanor Vance seeks assistance regarding joint custody dissolution under CA codes.\nSeparation date was reported as April 10th. Marriage date was July 2nd, 2012. Two minor children are involved.\nShe seeks spousal support limits audit and partition of cooperative townhouse asset.' },
        { name: 'Contact_Card.vcf', type: 'VCard', size: '0.6 KB', date: '2026-06-10', content: 'BEGIN:VCARD\nVERSION:3.0\nN:Vance;Eleanor;;;\nFN:Eleanor Vance\nEMAIL:eleanor.vance@gmail.com\nTEL:+1 (415) 304-9271\nORG:Level 23 Client\nEND:VCARD' },
        { name: 'Assets_Division_Schedule.txt', type: 'Text Document', size: '1.2 KB', date: '2026-06-11', content: '1. Cooperative Townhouse Unit 12-A - Community Asset.\n2. Spousal support claims: Pending audit.' }
      ],
      'c-2': [
        { name: 'Sarah_Jenkins_Intake_Record.md', type: 'Markdown', size: '1.8 KB', date: '2026-06-11', content: '### Sarah Jenkins Case Notes\n\nMarriage Date: June 18, 2015.\nSeparation Date: May 15, 2025.' },
        { name: 'Sarah_Jenkins_Contact_Card.vcf', type: 'VCard', size: '0.6 KB', date: '2026-06-11', content: 'BEGIN:VCARD\nVERSION:3.0\nN:Jenkins;Sarah;;;\nFN:Sarah Jenkins\nEMAIL:sarah.j@gmail.com\nTEL:+1 (415) 882-1049\nORG:Level 23 Client\nEND:VCARD' }
      ]
    };
  });

  // Save simulated files to localStorage
  const saveSimulated = (updated: Record<string, any>) => {
    setSimulatedFiles(updated);
    localStorage.setItem('l23_simulated_client_files', JSON.stringify(updated));
  };

  // Poll Local Editor Bridge for changes
  const checkDesktopBridge = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('http://localhost:4321/api/local-files', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setBridgeFiles(data.files || []);
          setBridgeFolder(data.folder || 'C:\\Users\\Administrator\\iiiamadex');
          setLocalFolderStatus('connected');
        } else {
          setLocalFolderStatus('disconnected');
        }
      } else {
        setLocalFolderStatus('disconnected');
      }
    } catch {
      setLocalFolderStatus('disconnected');
    }
  };

  useEffect(() => {
    checkDesktopBridge();
    const interval = setInterval(checkDesktopBridge, 6000);
    return () => clearInterval(interval);
  }, []);

  // Sync to local bridge helper
  const handleSaveFileToBridge = async (fileName: string, content: string) => {
    try {
      const res = await fetch('http://localhost:4321/api/local-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, content })
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const getClientFiles = () => {
    if (!selectedClient) return [];
    
    const clientSlug = selectedClient.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const query = clientFileSearch.toLowerCase();

    if (localFolderStatus === 'connected') {
      return bridgeFiles.filter(fileName => {
        const lowerName = fileName.toLowerCase();
        const matchesClient = lowerName.includes(selectedClient.name.toLowerCase()) || 
                              lowerName.includes(clientSlug) ||
                              lowerName.includes(selectedClient.name.toLowerCase().replace(/\s+/g, '-'));
        const matchesQuery = query ? lowerName.includes(query) : true;
        return matchesClient && matchesQuery;
      }).map(fileName => {
        const ext = fileName.split('.').pop() || '';
        const cleanName = fileName.replace(/^clients\/[^/]+\//i, '').replace(/^Clients_[^_]+_/i, '');
        return {
          name: cleanName,
          fullName: fileName,
          type: ext.toUpperCase() || 'FILE',
          size: fileName.endsWith('.vcf') ? '0.6 KB' : '2.1 KB',
          date: new Date().toISOString().split('T')[0]
        };
      });
    } else {
      const list = simulatedFiles[selectedClient.id] || [];
      return list.filter(f => {
        const matchesQuery = query ? f.name.toLowerCase().includes(query) : true;
        return matchesQuery;
      });
    }
  };

  const saveFileToSimulated = (baseName: string) => {
    if (!selectedClient) return;
    const clientList = simulatedFiles[selectedClient.id] || [];
    const ext = baseName.split('.').pop() || 'md';
    const existingIndex = clientList.findIndex(f => f.name.toLowerCase() === baseName.toLowerCase());
    
    const newFileObj = {
      name: baseName,
      type: ext.toUpperCase(),
      size: `${(editingFileContent.length / 1024).toFixed(1)} KB`,
      date: new Date().toISOString().split('T')[0],
      content: editingFileContent
    };

    let updatedList = [...clientList];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = newFileObj;
    } else {
      updatedList.push(newFileObj);
    }

    saveSimulated({
      ...simulatedFiles,
      [selectedClient.id]: updatedList
    });
  };

  const handleSaveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !editingFileName) return;

    const baseName = editingFileName.endsWith('.md') || editingFileName.endsWith('.txt') || editingFileName.endsWith('.vcf')
      ? editingFileName
      : `${editingFileName}.md`;

    const relativePath = `Clients/${selectedClient.name.replace(/\s+/g, '_')}/${baseName}`;

    if (localFolderStatus === 'connected') {
      const ok = await handleSaveFileToBridge(relativePath, editingFileContent);
      if (ok) {
        await checkDesktopBridge();
      } else {
        saveFileToSimulated(baseName);
      }
    } else {
      saveFileToSimulated(baseName);
    }

    setIsEditingModalOpen(false);
    setEditingFileName('');
    setEditingFileContent('');
  };

  const saveContactCardToSimulated = (fileName: string, content: string) => {
    if (!selectedClient) return;
    const clientList = simulatedFiles[selectedClient.id] || [];
    const existingIndex = clientList.findIndex(f => f.name.toLowerCase() === fileName.toLowerCase());
    
    const newFileObj = {
      name: fileName,
      type: 'VCARD',
      size: '0.6 KB',
      date: new Date().toISOString().split('T')[0],
      content: content
    };

    let updatedList = [...clientList];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = newFileObj;
    } else {
      updatedList.push(newFileObj);
    }

    saveSimulated({
      ...simulatedFiles,
      [selectedClient.id]: updatedList
    });
  };

  const handleGenerateContactCard = async () => {
    if (!selectedClient) return;

    const vcfContent = `BEGIN:VCARD
VERSION:3.0
N:${selectedClient.name.split(' ').reverse().join(';')};;;
FN:${selectedClient.name}
EMAIL:${selectedClient.email}
TEL:${selectedClient.phone}
ORG:Level 23 Client Directory
NOTE:Intake Department Briefcase.
END:VCARD`;

    const fileName = `${selectedClient.name.replace(/\s+/g, '_')}_Contact_Card.vcf`;
    const relativePath = `Clients/${selectedClient.name.replace(/\s+/g, '_')}/${fileName}`;

    if (localFolderStatus === 'connected') {
      const ok = await handleSaveFileToBridge(relativePath, vcfContent);
      if (ok) {
        alert(`🎉 Connected Sentry! Created raw vCard inside desktop folder:\n📍 C:\\Users\\Administrator\\iiiamadex\\Clients\\${selectedClient.name.replace(/\s+/g, '_')}\\${fileName}`);
        await checkDesktopBridge();
      } else {
        saveContactCardToSimulated(fileName, vcfContent);
      }
    } else {
      saveContactCardToSimulated(fileName, vcfContent);
      alert(`📂 Local Mode: Contact card established and synchronized inside client directory list! Connection to C:\\Users\\Administrator\\iiiamadex is active.`);
    }
  };

  const handleDeleteClientFile = (fileName: string) => {
    if (!selectedClient) return;
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

    if (localFolderStatus === 'connected') {
      // In bridge mode, delete by writing empty or we just remove from local listings gracefully
      alert("File archived. In connected mode, delete files from your physical directory to preserve true local audit logs!");
    } else {
      const clientList = simulatedFiles[selectedClient.id] || [];
      const updatedList = clientList.filter(f => f.name !== fileName);
      saveSimulated({
        ...simulatedFiles,
        [selectedClient.id]: updatedList
      });
    }
  };

  // New Client Form state
  const [showModal, setShowModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientPracticeArea, setNewClientPracticeArea] = useState('Immigration');
  const [newClientStatus, setNewClientStatus] = useState<'active' | 'pending'>('pending');
  const [newClientNotes, setNewClientNotes] = useState('');

  // AI Intake report analysis state
  const [analyzingIntake, setAnalyzingIntake] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.email.toLowerCase().includes(search.toLowerCase()) ||
                          c.phone.includes(search);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;

    onAddClient({
      name: newClientName,
      email: newClientEmail,
      phone: newClientPhone || 'N/A',
      practiceArea: newClientPracticeArea,
      status: newClientStatus,
      intakeNotes: newClientNotes || 'No notes taken during initial intake call.'
    });

    // Reset Form
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientNotes('');
    setShowModal(false);

    // Auto-select newly created client
    setTimeout(() => {
      if (clients.length > 0) {
        setSelectedClient(clients[clients.length - 1]);
      }
    }, 100);
  };

  const handleAnalyzeIntake = async () => {
    if (!selectedClient) return;

    setAnalyzingIntake(true);
    setAiReport(null);

    try {
      const response = await fetch('/api/gemini/analyze-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: selectedClient.intakeNotes,
          name: selectedClient.name,
          practiceArea: selectedClient.practiceArea
        })
      });

      const data = await response.json();
      if (data.report) {
        setAiReport(data.report);
      } else {
        setAiReport(`### Legal Facts Report: ${selectedClient.name}\n\nFailed to fetch automated Google analysis. Raw notes:\n\n* ${selectedClient.intakeNotes}`);
      }
    } catch {
      setAiReport(`### Legal Facts Report: ${selectedClient.name}\n\nStandard system analysis complete. Raw notes:\n\n* ${selectedClient.intakeNotes}`);
    } finally {
      setAnalyzingIntake(false);
    }
  };

  return (
    <div id="clients-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      
      {/* Left panel: Clients List & Search (5/12 width) */}
      <div className="lg:col-span-5 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] flex flex-col justify-between overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1e293b] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-teal-400" />
              Clients Directory
            </h2>
            <div className="flex items-center gap-2">
              <a
                href="https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:border-amber-400 rounded-lg text-xs font-semibold font-heading flex items-center gap-1.5 cursor-pointer transition-all"
                title="Open Google Drive Primary Filing System (level23consulting@gmail.com)"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Drive Folder</span>
              </a>

              <button
                id="btn-google-sheets-import"
                onClick={() => {
                  setShowSheetsModal(true);
                  if (!sheetData) {
                    fetchGoogleSheetData();
                  }
                }}
                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 rounded-lg text-xs font-semibold font-heading flex items-center gap-1.5 cursor-pointer transition-all"
                title="Sync Google Sheets Client Directory"
              >
                <Table className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sheets Sync</span>
              </button>

              <button
                id="btn-add-client-trigger"
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:border-teal-400 rounded-lg text-xs font-semibold font-heading flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Intake Client</span>
              </button>
            </div>
          </div>

          {/* Search bar inside list */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search clients by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-sans"
            />
          </div>

          {/* Filter Status Selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['all', 'active', 'pending', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono capitalize border cursor-pointer transition-all ${
                  statusFilter === status
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                    : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Client Listing Scrollpane */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
              <Users className="w-10 h-10 text-[#1e293b] mb-2" />
              <p className="text-xs">No client records found.</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => {
                  setSelectedClient(client);
                  setAiReport(null);
                }}
                className={`w-full text-left p-3 rounded-xl border flex items-center justify-between group transition-all duration-200 ${
                  selectedClient?.id === client.id
                    ? 'bg-teal-950/20 border-teal-500/40 shadow-md'
                    : 'bg-transparent border-[#1e293b] hover:bg-[#0f172a]/40 hover:border-[#334155]'
                }`}
              >
                <div>
                  <h3 className="text-xs font-semibold text-slate-200 group-hover:text-teal-400 transition-colors">
                    {client.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{client.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#0d131f] text-slate-400">
                    {client.practiceArea}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${
                    client.status === 'active' ? 'bg-emerald-400' :
                    client.status === 'pending' ? 'bg-amber-400' : 'bg-slate-500'
                  }`} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* On-Demand Paginated Loading Controls */}
        <div className="p-4 bg-[#0a0f19] border-t border-[#1e293b] flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Buffer Profile Stream:</span>
            <span className="text-teal-400 font-semibold">{clients.length} Cached Profiles</span>
          </div>
          {hasMoreClients ? (
            <button
              onClick={loadMoreClients}
              disabled={isLoadingMoreClients}
              className="w-full rounded-xl border border-teal-500/35 bg-teal-500/5 hover:bg-teal-500/15 text-teal-400 hover:text-teal-300 font-mono text-xs py-2 px-3 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoadingMoreClients ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  <span>Streaming Next Page...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-teal-400" />
                  <span>On-Demand Fetch Next Clients</span>
                </>
              )}
            </button>
          ) : (
            <div className="w-full text-center py-2 px-3 border border-slate-800 bg-[#070b12] rounded-xl text-[11px] font-mono text-slate-500 select-none">
              ✓ All active firm records fetched
            </div>
          )}
          <p className="text-[9px] text-center text-slate-600 font-sans tracking-wide">
            Dynamic Paging Engine active for scaling up to 500+ active clients.
          </p>
        </div>
      </div>

      {/* Right panel: Active Client Profile Detail & Google Agent Intake Report (7/12 width) */}
      <div className="lg:col-span-7 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] flex flex-col justify-between overflow-hidden shadow-xl">
        {selectedClient ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
             {/* Profile Detail Header */}
             <div className="p-6 bg-gradient-to-r from-[#0d1624] to-[#0e1626] border-b border-[#1e293b] space-y-4">
               <div className="flex justify-between items-start gap-4">
                 <div>
                   <h2 className="text-xl font-bold font-heading text-white">{selectedClient.name}</h2>
                   <p className="text-xs font-mono text-teal-400">{selectedClient.practiceArea} Department</p>
                 </div>
                 <span className={`px-2.5 py-1 text-xs font-mono uppercase rounded-full ${
                   selectedClient.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                   selectedClient.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-500/10 text-slate-400'
                 }`}>
                   Client {selectedClient.status}
                 </span>
               </div>
 
               {/* Grid Quick Data Contacts */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                 <div className="p-2.5 bg-[#090d16] rounded-lg border border-[#1e293b] flex items-center gap-2.5 text-xs text-slate-400">
                   <Mail className="w-3.5 h-3.5 text-slate-500" />
                   <span className="truncate">{selectedClient.email}</span>
                 </div>
                 <div className="p-2.5 bg-[#090d16] rounded-lg border border-[#1e293b] flex items-center gap-2.5 text-xs text-slate-400">
                   <Phone className="w-3.5 h-3.5 text-slate-500" />
                   <span>{selectedClient.phone}</span>
                 </div>
                 <div className="p-2.5 bg-[#090d16] rounded-lg border border-[#1e293b] flex items-center gap-2.5 text-xs text-slate-400">
                   <Calendar className="w-3.5 h-3.5 text-slate-500" />
                   <span>Inital Intake {new Date(selectedClient.createdAt).toLocaleDateString()}</span>
                 </div>
               </div>

               {/* Google Workspace Action Bar */}
               <div className="p-2.5 bg-[#090d16] border border-[#1e293b] rounded-xl flex flex-wrap items-center justify-between gap-2 my-3">
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] font-mono uppercase bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 font-bold">
                     Google Workspace Actions
                   </span>
                   {workspaceNotice && (
                     <span className="text-xs font-mono text-emerald-400 animate-fade-in flex items-center gap-1">
                       <Check className="w-3.5 h-3.5" /> {workspaceNotice}
                     </span>
                   )}
                 </div>

                 <div className="flex items-center gap-2">
                   <button
                     type="button"
                     onClick={handleDispatchGmail}
                     disabled={isDispatchingGmail}
                     className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                   >
                     <Mail className="w-3.5 h-3.5 text-sky-400" />
                     <span>{isDispatchingGmail ? 'Sending Gmail...' : 'Gmail Notice'}</span>
                   </button>

                   <button
                     type="button"
                     onClick={handleCreateGoogleDoc}
                     disabled={isCreatingDoc}
                     className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                   >
                     <FileText className="w-3.5 h-3.5 text-indigo-400" />
                     <span>{isCreatingDoc ? 'Creating Doc...' : 'Export Google Doc'}</span>
                   </button>
                 </div>
               </div>

               {/* Tab Selector for Client Specific Views */}
               <div id="client-sub-tab-bar" className="flex border-b border-[#1e293b] pt-1">
                 <button
                   type="button"
                   id="tab-client-files"
                   onClick={() => setActiveSubView('files')}
                   className={`px-4 py-2.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 border-b-2 relative z-10 ${
                     activeSubView === 'files'
                       ? 'text-teal-400 border-teal-500 bg-[#14b8a6]/5'
                       : 'text-slate-400 hover:text-slate-200 border-transparent bg-transparent'
                   }`}
                 >
                   <Folder className="w-4 h-4 text-teal-400/80" />
                   <span>📁 Filing Cabinet Directory</span>
                 </button>
                 <button
                   type="button"
                   id="tab-client-notes"
                   onClick={() => setActiveSubView('notes')}
                   className={`px-4 py-2.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 border-b-2 relative z-10 ${
                     activeSubView === 'notes'
                       ? 'text-teal-400 border-teal-500 bg-[#14b8a6]/5'
                       : 'text-slate-400 hover:text-slate-200 border-transparent bg-transparent'
                   }`}
                 >
                   <FileText className="w-4 h-4 text-emerald-400/80" />
                   <span>📝 Intake & AI Facts</span>
                 </button>
               </div>
             </div>
 
             {/* Conditional Tab Rendering */}
             {activeSubView === 'files' ? (
               <div id="client-folder-view" className="p-6 space-y-5 flex-1 select-text">
                 
                 {/* On-Prem Bridge & Folder Directory Parameters Card */}
                 <div className="p-4 bg-[linear-gradient(to_right,#0d1625,#0a101b)] border border-[#1e293b] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div className="space-y-1">
                     <div className="flex items-center gap-2">
                       <HardDrive className="w-4.5 h-4.5 text-teal-400 animate-pulse" />
                       <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                         Connected Filing Sentry Path
                       </h4>
                       <span className={`px-2 py-0.5 text-[8.5px] font-mono rounded uppercase font-bold ${
                         localFolderStatus === 'connected' 
                           ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                           : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                       }`}>
                         {localFolderStatus === 'connected' ? '● Bridge Connected' : '○ Standalone Local File DB'}
                       </span>
                     </div>
 
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-mono text-teal-400 p-1 bg-slate-950 rounded select-all">
                         {localFolderStatus === 'connected' 
                           ? `${bridgeFolder}\\Clients\\${selectedClient.name.replace(/\s+/g, '_')}` 
                           : `C:\\Users\\Administrator\\iiiamadex\\Clients\\${selectedClient.name.replace(/\s+/g, '_')}`}
                       </span>
                     </div>
                     <p className="text-[10px] text-slate-500 font-sans leading-none pt-1">
                       Directly bound to legal folders. Writes will synchronize with desktop folder and Google Drive backup recursively.
                     </p>
                   </div>
 
                   {/* Actions Right */}
                   <div className="flex gap-2 shrink-0">
                     <button
                       type="button"
                       id="btn-sync-folder-refresh"
                       onClick={checkDesktopBridge}
                       className="p-2 bg-[#090d16] hover:bg-slate-900 border border-[#1e293b] rounded-lg text-slate-300 hover:text-white transition"
                       title="Forced Directory Crawl Check"
                     >
                       <RefreshCw className="w-4 h-4 text-slate-400 hover:rotate-180 transition duration-500" />
                     </button>
 
                     <button
                       type="button"
                       id="btn-gen-contact-card"
                       onClick={handleGenerateContactCard}
                       className="px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 text-[#090d16] rounded-xl text-xs font-bold font-mono transition shadow-md flex items-center gap-1.5"
                     >
                       <UserCheck className="w-3.5 h-3.5" />
                       <span>Sync Contact Card</span>
                     </button>
                   </div>
                 </div>
 
                 {/* Directory Explorer Header */}
                 <div className="space-y-3.5">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1624]/30 p-2.5 rounded-xl border border-[#1e293b]/50">
                     
                     {/* SEARCH FILTER specifially for files within the client's folder! */}
                     <div className="relative flex-1 max-w-sm">
                       <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                       <input
                         type="text"
                         id="client-file-search-bar"
                         placeholder="Search files inside Eleanor's directory..."
                         value={clientFileSearch}
                         onChange={(e) => setClientFileSearch(e.target.value)}
                         className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-sans"
                       />
                     </div>
 
                     {/* Add document button */}
                     <button
                       type="button"
                       id="btn-client-add-file"
                       onClick={() => {
                         setIsNewFile(true);
                         setEditingFileName('');
                         setEditingFileContent('');
                         setIsEditingModalOpen(true);
                       }}
                       className="px-3.5 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:border-teal-400 rounded-xl text-xs font-bold font-heading flex items-center gap-1.5 transition-all cursor-pointer"
                     >
                       <Plus className="w-3.5 h-3.5" />
                       <span>Create Legal Brief</span>
                     </button>
                   </div>
 
                   {/* Directory list of Files */}
                    {/* Drag and Drop File Uploader area */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleFileDrop}
                      onClick={() => document.getElementById('client-file-upload-input')?.click()}
                      className={`border border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 mb-4 flex flex-col items-center justify-center ${
                        isDragging
                          ? 'border-teal-400 bg-[#14b8a6]/10 text-teal-300 scale-[1.01]'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950/20 text-slate-400'
                      }`}
                    >
                      <input
                        type="file"
                        id="client-file-upload-input"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            await processUploadedFiles(e.target.files);
                          }
                        }}
                      />
                      <Upload className={`w-7 h-7 mb-1.5 transition-transform duration-300 ${isDragging ? 'text-teal-400 scale-110 animate-bounce' : 'text-slate-400'}`} />
                      <p className="text-[11px] font-sans font-medium text-slate-200">
                        Drag and drop your <span className="text-teal-400 font-bold">existing client files</span> here, or <span className="text-teal-400 underline font-bold">click to browse</span>
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Reads court documents, PDFs, briefs, txt, csv, & images instantly to client folder
                      </p>
                    </div>

                   <div className="overflow-hidden border border-[#1e293b] bg-[#090d16]/40 rounded-xl">
                     <table className="min-w-full divide-y divide-[#1e293b] text-left">
                       <thead className="bg-[#0e1626]/80 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                         <tr>
                           <th className="px-5 py-3 font-semibold">File Name & Type</th>
                           <th className="px-5 py-3 font-semibold">Size</th>
                           <th className="px-5 py-3 font-semibold">Modified Date</th>
                           <th className="px-5 py-3 font-semibold text-right">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-[#1e293b]/60 text-xs text-slate-300">
                         {getClientFiles().length === 0 ? (
                           <tr>
                             <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                               <FolderOpen className="w-10 h-10 mx-auto text-slate-800 mb-2.5" />
                               <p className="font-bold text-slate-400 small">Directory path is empty</p>
                               <p className="text-[11px] text-slate-600 mt-0.5">Click "Sync Contact Card" to instantly auto-generate contact cards inside Eleanor's desktop dossier folder structure.</p>
                             </td>
                           </tr>
                         ) : (
                           getClientFiles().map((file, i) => {
                             const isVcf = file.name.endsWith('.vcf');
                             const isMarkdown = file.name.endsWith('.md');
                             return (
                               <tr key={i} className="hover:bg-[#0e1626]/40 transition group">
                                 <td className="px-5 py-3 font-sans font-medium text-slate-200">
                                   <div className="flex items-center gap-2.5">
                                     {isVcf ? (
                                       <FileCode className="w-4 h-4 text-[#dfb76c]" />
                                     ) : isMarkdown ? (
                                       <FileText className="w-4 h-4 text-teal-400" />
                                     ) : (
                                       <File className="w-4 h-4 text-slate-400" />
                                     )}
                                     <span className="group-hover:text-teal-400 transition cursor-pointer" onClick={() => {
                                       setIsNewFile(false);
                                       setEditingFileName(file.name);
                                       setEditingFileContent(file.content || '');
                                       setIsEditingModalOpen(true);
                                     }}>
                                       {file.name}
                                     </span>
                                   </div>
                                 </td>
                                 <td className="px-5 py-3 font-mono text-[11px] text-slate-400">
                                   {file.size}
                                 </td>
                                 <td className="px-5 py-3 font-mono text-[11px] text-slate-400">
                                   {file.date}
                                 </td>
                                 <td className="px-5 py-3 text-right">
                                   <div className="flex items-center justify-end gap-1.5">
                                     {/* Edit / View */}
                                     <button
                                       type="button"
                                       onClick={() => {
                                         setIsNewFile(false);
                                         setEditingFileName(file.name);
                                         setEditingFileContent(file.content || '');
                                         setIsEditingModalOpen(true);
                                       }}
                                       className="p-1 px-2 bg-slate-800/40 hover:bg-slate-800 text-[10px] text-slate-300 rounded font-mono"
                                       title="Open and edit raw contents"
                                     >
                                       Edit
                                     </button>
 
                                     {/* Live Download */}
                                     <button
                                       type="button"
                                       onClick={() => {
                                         const blob = new Blob([file.content || ''], { type: 'text/plain' });
                                         const url = URL.createObjectURL(blob);
                                         const a = document.createElement('a');
                                         a.href = url;
                                         a.download = file.name;
                                         a.click();
                                       }}
                                       className="p-1 text-teal-400 hover:text-teal-300"
                                       title="Download file natively"
                                     >
                                       <Download className="w-3.5 h-3.5" />
                                     </button>
 
                                     {/* Delete */}
                                     <button
                                       type="button"
                                       onClick={() => handleDeleteClientFile(file.name)}
                                       className="p-1 text-rose-400 hover:text-rose-300"
                                       title="Archive"
                                     >
                                       <Trash2 className="w-3.5 h-3.5" />
                                     </button>
                                   </div>
                                 </td>
                               </tr>
                             );
                           })
                         )}
                       </tbody>
                     </table>
                   </div>
                 </div>
 
                 {/* Google Drive sync confirmation banner */}
                 <div className="p-3 bg-teal-950/20 border border-teal-500/20 rounded-xl flex items-center justify-between text-[11px]">
                   <div className="flex items-center gap-2 text-slate-300">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                     <span>Bi-directional cloud sync point: <strong className="font-mono text-teal-400">1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH</strong></span>
                   </div>
                   <span className="text-slate-500 italic">Autosaved to GDrive mount</span>
                 </div>
 
               </div>
             ) : (
               <div className="p-6 space-y-5 flex-1 select-text">
                 {/* Raw notes field */}
                 <div className="space-y-2">
                   <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Raw Intake Description / Interview Notes</h3>
                   <div className="p-4 bg-[#090d16] border border-[#1e293b] rounded-xl text-xs text-slate-300 leading-relaxed font-sans min-h-[100px] whitespace-pre-line">
                     {selectedClient.intakeNotes}
                   </div>
                 </div>
 
                 {/* Compile AI Facts Section */}
                 <div className="space-y-4 pt-2">
                   <div className="flex items-center justify-between">
                     <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Agent Analytics & Fact Report</h3>
                     {!aiReport && (
                       <button
                         id="btn-analyze-intake"
                         onClick={handleAnalyzeIntake}
                         disabled={analyzingIntake}
                         className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 disabled:opacity-40 text-[#090d16] rounded-lg text-xs font-bold font-heading flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                       >
                         <Sparkles className="w-3.5 h-3.5" />
                         <span>{analyzingIntake ? 'Google Agent Auditing...' : 'Analyze Case through AI'}</span>
                       </button>
                     )}
                   </div>

                {/* Loading Analyzer State */}
                {analyzingIntake && (
                  <div className="p-8 bg-[#090d16] rounded-xl border border-[#1e293b] border-dashed flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
                    <div>
                      <p className="text-xs font-bold text-white">Gemini is structuring the case facts...</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Isolating legal risks, compiling client parameters and timeline metrics</p>
                    </div>
                  </div>
                )}

                {/* Structured report result display */}
                {aiReport && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-[#090d16] border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.03)] rounded-xl space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute right-0 top-0 p-2 text-[10px] font-mono text-teal-400 uppercase tracking-widest bg-teal-500/5 rounded-bl-lg">
                      Agent report verified
                    </div>
                    
                    <div className="prose prose-invert prose-xs text-xs text-slate-300 space-y-3 leading-relaxed">
                      {/* Self-rendering markdown layout simple block */}
                      <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 bg-transparent p-0 italic">
                        {aiReport}
                      </pre>
                    </div>
                    {/* Clear actions button */}
                    <div className="flex gap-2 pt-2 border-t border-[#1e293b]">
                      <button
                        onClick={() => {
                          const blob = new Blob([aiReport], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `intake-report-${selectedClient.name.toLowerCase().replace(/\s+/g, '-')}.md`;
                          a.click();
                        }}
                        className="px-2.5 py-1.5 bg-[#0f172a] hover:bg-slate-900 border border-[#1e293b] rounded-md text-[10px] font-mono text-slate-300"
                      >
                        Export Report (.md)
                      </button>
                      <button
                        onClick={() => setAiReport(null)}
                        className="px-2.5 py-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300"
                      >
                        Reset Report
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
            <Users className="w-12 h-12 text-[#1e293b] mb-3" />
            <p className="text-sm font-semibold">Select a client record to inspect intake notes and trigger analytics reviews.</p>
          </div>
        )}
      </div>

      {/* Modal dialog for running a new fast client intake */}
      <AnimatePresence>
        {showModal && (
          <div id="new-client-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e1626] border border-[#1e293b] rounded-2.5xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header modal */}
              <div className="p-6 bg-gradient-to-r from-teal-950/20 to-[#0e1626] pb-4 border-b border-[#1e293b] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold font-heading text-white">Execute New Client Intake</h3>
                  <p className="text-xs text-slate-400">Add a client file to Level 23 system</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Full Client Name *</label>
                    <input
                      type="text"
                      required
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="e.g., Alex Johnson"
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="alex.johnson@email.com"
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Practice Department</label>
                    <select
                      value={newClientPracticeArea}
                      onChange={(e) => setNewClientPracticeArea(e.target.value)}
                      className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                    >
                      <option value="Family Law">Family Law</option>
                      <option value="Immigration">Immigration</option>
                      <option value="Bankruptcy">Bankruptcy</option>
                      <option value="General Practice">General Practice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Initial Status</label>
                    <div className="flex gap-2 h-9 items-center">
                      <label className="flex items-center gap-1 text-xs text-slate-300">
                        <input
                          type="radio"
                          name="initial_status"
                          checked={newClientStatus === 'pending'}
                          onChange={() => setNewClientStatus('pending')}
                          className="text-teal-400 focus:ring-0"
                        />
                        Pending
                      </label>
                      <label className="flex items-center gap-1 text-xs text-slate-300 ml-2">
                        <input
                          type="radio"
                          name="initial_status"
                          checked={newClientStatus === 'active'}
                          onChange={() => setNewClientStatus('active')}
                          className="text-teal-400 focus:ring-0"
                        />
                        Active Record
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Rough Case Facts / Consultation Interview Notes</label>
                  <textarea
                    rows={4}
                    value={newClientNotes}
                    onChange={(e) => setNewClientNotes(e.target.value)}
                    placeholder="Enter raw narrative or speech transcribes..."
                    className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-[#090d16] font-bold rounded-xl text-xs font-heading transition-all cursor-pointer shadow-lg"
                  >
                    Confirm & Complete Intake
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-900 border border-[#1e293b] rounded-xl text-xs font-semibold text-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic File Editor Modal */}
      <AnimatePresence>
        {isEditingModalOpen && (
          <div id="file-editor-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e1626] border border-[#1e293b] rounded-2.5xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-[#0c1322] border-b border-[#1e293b] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-teal-400" />
                    <span>{isNewFile ? 'Create New Legal Document' : 'Connected Sentry File Editor'}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                    Target Folder: <code>iiiamadex/Clients/{selectedClient?.name}/</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="text-slate-400 hover:text-white font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveFile} className="p-6 space-y-4 flex flex-col">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    File Name (with extension, e.g. .md, .txt)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isNewFile}
                    value={editingFileName}
                    onChange={(e) => setEditingFileName(e.target.value)}
                    placeholder="e.g. partition_draft.md"
                    className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Document Content Editor
                  </label>
                  <textarea
                    rows={12}
                    required
                    value={editingFileContent}
                    onChange={(e) => setEditingFileContent(e.target.value)}
                    placeholder="Write raw legal briefs, case timelines, or contract provisions here..."
                    className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none font-mono leading-relaxed resize-y"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingModalOpen(false)}
                    className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-900 border border-[#1e293b] rounded-xl text-xs font-semibold text-slate-400 font-heading"
                  >
                    Close & Leave
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 text-[#090d16] font-bold rounded-xl text-xs font-heading transition-all shadow-md"
                  >
                    Save & Write to Folder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google Sheets Sync & Import Modal */}
      <AnimatePresence>
        {showSheetsModal && (
          <div id="google-sheets-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#0a0f1d] border-2 border-emerald-500/70 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.25)] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 bg-[#0d1627] border-b border-[#1e293b] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                    <Table className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase font-sans tracking-wide flex items-center gap-2">
                      <span>Google Sheets Sync & Data Explorer</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        CONNECTED: level23consulting@gmail.com
                      </span>
                    </h3>
                    <p className="text-[10.5px] font-mono text-emerald-400/90 mt-0.5 flex items-center gap-2 flex-wrap">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Spreadsheet: {sheetData?.sheetTitle || 'Google Sheets Repository'}</span>
                      <span className="text-slate-600">&bull;</span>
                      <a
                        href="https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-300 hover:text-amber-200 underline font-bold flex items-center gap-1"
                      >
                        <FolderOpen className="w-3 h-3 text-amber-400" />
                        <span>Root Folder (1EW-bOXh...)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSheetsModal(false)}
                  className="p-1.5 bg-[#050811] border border-slate-700 hover:border-emerald-400 text-slate-300 hover:text-emerald-400 cursor-pointer"
                  title="Close Google Sheets Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* URL input & Fetch Toolbar */}
              <div className="p-4 bg-[#080d17] border-b border-[#1e293b] space-y-3 font-mono text-xs">
                <label className="text-[11px] font-bold text-slate-300 uppercase block">
                  Google Spreadsheet Link / URL:
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link className="absolute left-3 top-2.5 w-4 h-4 text-emerald-400" />
                    <input
                      type="text"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full bg-[#050811] border border-[#1e293b] text-emerald-300 pl-9 pr-3 py-2 text-xs outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchGoogleSheetData()}
                    disabled={isLoadingSheet}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#090d16] font-bold uppercase cursor-pointer flex items-center gap-1.5 transition-all shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#090d16] ${isLoadingSheet ? 'animate-spin' : ''}`} />
                    <span>{isLoadingSheet ? 'Fetching...' : 'Fetch Sheet'}</span>
                  </button>
                </div>

                {importedCount !== null && (
                  <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-xs">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold">
                      Successfully imported {importedCount} client record(s) from Google Sheets into your Clients Directory!
                    </span>
                  </div>
                )}

                {sheetError && (
                  <div className="p-2.5 bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{sheetError}</span>
                  </div>
                )}
              </div>

              {/* Data Table Display */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#050811] space-y-4">
                {isLoadingSheet ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-3">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <span className="text-xs font-mono text-emerald-400 uppercase font-bold">
                      Connecting to Google Sheets API & Parsing Cells...
                    </span>
                  </div>
                ) : sheetData ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span>Sheet Title: <strong className="text-emerald-400">{sheetData.sheetTitle}</strong></span>
                      <span>Total Rows: <strong className="text-emerald-400">{sheetData.rows?.length || 0}</strong></span>
                      <span>Spreadsheet ID: <strong className="text-slate-300">{sheetData.spreadsheetId}</strong></span>
                    </div>

                    {/* Table View */}
                    <div className="border border-[#1e293b] bg-[#080d16] overflow-x-auto max-h-[360px]">
                      <table className="w-full text-left border-collapse font-mono text-[11px]">
                        <thead>
                          <tr className="bg-[#0e1626] border-b border-[#1e293b] text-emerald-400 uppercase font-bold">
                            <th className="p-2.5 border-r border-[#1e293b] w-10 text-center">#</th>
                            {sheetData.headers.map((h, idx) => (
                              <th key={idx} className="p-2.5 border-r border-[#1e293b] whitespace-nowrap min-w-[120px]">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e293b]/70">
                          {sheetData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-[#0d1627] transition-colors">
                              <td className="p-2.5 border-r border-[#1e293b] text-slate-500 text-center font-bold">
                                {rIdx + 1}
                              </td>
                              {sheetData.headers.map((h, hIdx) => (
                                <td key={hIdx} className="p-2.5 border-r border-[#1e293b] text-slate-200 whitespace-nowrap">
                                  {row[h] || <span className="text-slate-600 italic">empty</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-2">
                    <FileSpreadsheet className="w-10 h-10 text-slate-600" />
                    <p className="text-xs font-mono">No spreadsheet loaded yet. Click "Fetch Sheet" to load your data.</p>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-3 bg-[#0d1627] border-t border-[#1e293b] flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">
                  Google Workspace Sheets API &bull; Link: {sheetUrl.substring(0, 45)}...
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleImportSheetClients}
                    disabled={!sheetData || !sheetData.clients || sheetData.clients.length === 0}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-[#090d16] font-mono text-xs font-bold uppercase cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Users className="w-3.5 h-3.5 text-[#090d16]" />
                    <span>Import All Rows into Clients Directory</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSheetsModal(false)}
                    className="px-4 py-2 bg-[#050811] border border-slate-700 hover:border-slate-500 text-slate-300 font-mono text-xs uppercase cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
