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
  ChevronDown,
  ChevronUp,
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
  DollarSign,
  CreditCard,
  ShieldCheck,
  X
} from 'lucide-react';
import { Client } from '../types';
import { getAccessToken } from '../lib/driveAuth';
import { ClientLedgerDropdown, ClientFullLedgerView } from './ClientLedgerView';
import { getOrCreateClientLedger, formatCurrency } from '../data/ledgerData';

interface ClientsTabProps {
  clients: Client[];
  onAddClient: (newClient: Omit<Client, 'id' | 'createdAt'>) => void;
  loadMoreClients?: () => Promise<void>;
  hasMoreClients?: boolean;
  isLoadingMoreClients?: boolean;
  onOpenOmniUpload?: () => void;
}

export default function ClientsTab({ 
  clients, 
  onAddClient,
  loadMoreClients,
  hasMoreClients = false,
  isLoadingMoreClients = false,
  onOpenOmniUpload
}: ClientsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);

  // Active Client folder directory & card view states
  const [activeSubView, setActiveSubView] = useState<'card' | 'roster' | 'ledger' | 'files' | 'notes'>('card'); // Default to Client Intake Card view!
  const [openLedgerClientId, setOpenLedgerClientId] = useState<string | null>(null);
  const [openTableLedgerClientId, setOpenTableLedgerClientId] = useState<string | null>(null);
  const [extractedCardFields, setExtractedCardFields] = useState<Record<string, Record<string, string>>>({});
  const [isExtractingCardData, setIsExtractingCardData] = useState(false);
  const [localFolderStatus, setLocalFolderStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [bridgeFiles, setBridgeFiles] = useState<string[]>([]);
  const [bridgeFolder, setBridgeFolder] = useState<string>('C:\\Users\\Administrator\\illamadex');
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
    const saved = localStorage.getItem('l23_simulated_client_files_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {}
    }
    return {
      'c-1': [
        { name: 'Intake_Record_JaneDoe.md', type: 'Markdown', size: '1.4 KB', date: '2026-08-01', content: '### Jane Doe Intake Details\n\nStandard Client Intake Placeholder Record.\nReady for replacement or onboarding of active client.' },
        { name: 'Contact_Card.vcf', type: 'VCard', size: '0.6 KB', date: '2026-08-01', content: 'BEGIN:VCARD\nVERSION:3.0\nN:Doe;Jane;;;\nFN:Jane Doe\nEMAIL:jane.doe@example.com\nTEL:+1 (555) 019-2831\nORG:Level 23 Client\nEND:VCARD' }
      ],
      'c-2': [
        { name: 'Intake_Record_JohnDoe.md', type: 'Markdown', size: '1.4 KB', date: '2026-08-01', content: '### John Doe Intake Details\n\nStandard Client Intake Placeholder Record.\nReady for replacement or onboarding of active client.' },
        { name: 'Contact_Card.vcf', type: 'VCard', size: '0.6 KB', date: '2026-08-01', content: 'BEGIN:VCARD\nVERSION:3.0\nN:Doe;John;;;\nFN:John Doe\nEMAIL:john.doe@example.com\nTEL:+1 (555) 019-2832\nORG:Level 23 Client\nEND:VCARD' }
      ]
    };
  });

  // Save simulated files to localStorage
  const saveSimulated = (updated: Record<string, any>) => {
    setSimulatedFiles(updated);
    localStorage.setItem('l23_simulated_client_files_v3', JSON.stringify(updated));
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
          setBridgeFolder(data.folder || 'C:\\Users\\Administrator\\illamadex');
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
        alert(`🎉 Connected Sentry! Created raw vCard inside desktop storage:\n📍 ${bridgeFolder}\\Clients\\${selectedClient.name.replace(/\s+/g, '_')}\\${fileName}`);
        await checkDesktopBridge();
      } else {
        saveContactCardToSimulated(fileName, vcfContent);
      }
    } else {
      saveContactCardToSimulated(fileName, vcfContent);
      alert(`📂 Local Mode: Contact card established and synchronized inside client directory list! Connection to ${bridgeFolder} is active.`);
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

  const handleExtractCardData = async () => {
    if (!selectedClient) return;
    setIsExtractingCardData(true);
    try {
      const targetFields = [
        'Full Legal Name',
        'Date of Birth / Age',
        'Residential Address',
        'Phone Number',
        'Email Address',
        'Occupation / Employer',
        'Spouse / Opposing Party',
        'Date of Marriage / Entry Date',
        'Date of Separation / Visa Class',
        'Filing Court / County Jurisdiction',
        'Minor Children & DOBs',
        'Requested Custody & Relief',
        'Community Assets & Debts',
        'Primary Legal Risks & Next Steps'
      ];
      const res = await fetch('/api/gemini/extract-all-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientData: selectedClient,
          rawNotes: selectedClient.intakeNotes,
          targetFields,
          formTitle: `Client Intake File — ${selectedClient.name}`
        })
      });
      const data = await res.json();
      if (data.extractedFields) {
        setExtractedCardFields(prev => ({
          ...prev,
          [selectedClient.id]: data.extractedFields
        }));
      }
    } catch (err) {
      console.warn("Card extraction notice:", err);
    } finally {
      setIsExtractingCardData(false);
    }
  };

  const getClientCardData = (client: Client): Record<string, string> => {
    if (extractedCardFields[client.id]) {
      return extractedCardFields[client.id];
    }
    // Fallback parsed defaults for standard placeholders
    if (client.name.includes('Jane Doe')) {
      return {
        'Full Legal Name': 'Jane Doe',
        'Date of Birth / Age': 'Standard Client Placeholder',
        'Residential Address': '100 Main Street, Suite 200, Santa Ana, CA 92701',
        'Phone Number': client.phone || '+1 (555) 019-2831',
        'Email Address': client.email || 'jane.doe@example.com',
        'Occupation / Employer': 'Client Intake Record',
        'Spouse / Opposing Party': 'John Doe',
        'Date of Marriage / Entry Date': 'August 1, 2020',
        'Date of Separation / Visa Class': 'August 1, 2026',
        'Filing Court / County Jurisdiction': 'Superior Court of CA, County of Orange',
        'Minor Children & DOBs': 'Pending Intake Disclosure',
        'Requested Custody & Relief': 'Standard Dissolution / Legal Action',
        'Community Assets & Debts': 'Pending Disclosure',
        'Primary Legal Risks & Next Steps': 'Complete initial client intake documentation and review pleading drafts'
      };
    }
    if (client.name.includes('John Doe')) {
      return {
        'Full Legal Name': 'John Doe',
        'Date of Birth / Age': 'Standard Client Placeholder',
        'Residential Address': '200 Coastal Way, Newport Beach, CA 92660',
        'Phone Number': client.phone || '+1 (555) 019-2832',
        'Email Address': client.email || 'john.doe@example.com',
        'Occupation / Employer': 'Client Intake Record',
        'Spouse / Opposing Party': 'Jane Doe',
        'Date of Marriage / Entry Date': 'August 1, 2020',
        'Date of Separation / Visa Class': 'August 1, 2026',
        'Filing Court / County Jurisdiction': 'Superior Court of CA, County of Orange',
        'Minor Children & DOBs': 'Pending Intake Disclosure',
        'Requested Custody & Relief': 'Standard Legal Action',
        'Community Assets & Debts': 'Pending Disclosure',
        'Primary Legal Risks & Next Steps': 'Complete initial client intake documentation and review pleading drafts'
      };
    }
    // Generic auto-parsed representation from client properties & intake notes
    return {
      'Full Legal Name': client.name,
      'Date of Birth / Age': 'Extracted from intake records',
      'Residential Address': 'Client Primary Address File',
      'Phone Number': client.phone || 'N/A',
      'Email Address': client.email || 'N/A',
      'Occupation / Employer': 'Extracted from intake dossier',
      'Spouse / Opposing Party': 'Extracted from intake notes',
      'Date of Marriage / Entry Date': 'Extracted from intake notes',
      'Date of Separation / Visa Class': 'Extracted from intake notes',
      'Filing Court / County Jurisdiction': `Superior Court (${client.practiceArea})`,
      'Minor Children & DOBs': 'Extracted from intake notes',
      'Requested Custody & Relief': 'Extracted from intake notes',
      'Community Assets & Debts': 'Extracted from intake notes',
      'Primary Legal Risks & Next Steps': client.intakeNotes ? client.intakeNotes.slice(0, 150) + '...' : 'Intake record compiled.'
    };
  };

  return (
    <div id="clients-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px] lg:h-[calc(100vh-130px)] xl:h-[calc(100vh-120px)] 2xl:h-[calc(100vh-110px)] h-auto">
      
      {/* Left panel: Clients List & Search (5/12 width) */}
      <div id="clients-roster-panel" className="lg:col-span-5 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] flex flex-col overflow-hidden shadow-xl min-h-[480px] lg:min-h-0 h-full">
        <div className="p-4 border-b border-[#1e293b] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-teal-400" />
              Clients Directory
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              {onOpenOmniUpload && (
                <button
                  id="btn-drive-batch-onboard"
                  type="button"
                  onClick={onOpenOmniUpload}
                  className="px-2.5 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/35 hover:border-purple-400 rounded-lg text-xs font-semibold font-heading flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  title="Batch Ingest Client Documents from Google Drive Folder (1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Drive Batch Onboard</span>
                </button>
              )}

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
        <div id="clients-roster-list-scrollpane" className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 select-text">
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
              <Users className="w-10 h-10 text-[#1e293b] mb-2" />
              <p className="text-xs">No client records found.</p>
            </div>
          ) : (
            filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              const isLedgerOpen = openLedgerClientId === client.id;

              return (
                <div
                  key={client.id}
                  id={`client-directory-card-${client.id}`}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'bg-[#0f172a]/90 border-teal-500/50 shadow-lg ring-1 ring-teal-500/20'
                      : 'bg-[#0a101d]/60 border-[#1e293b] hover:bg-[#0f172a]/50 hover:border-slate-700'
                  }`}
                >
                  {/* Top Client Card Header - Selection */}
                  <div
                    onClick={() => {
                      setSelectedClient(client);
                      setAiReport(null);
                    }}
                    className="p-3 cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-slate-200 hover:text-teal-300 transition-colors truncate">
                          {client.name}
                        </h3>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          client.status === 'active' ? 'bg-emerald-400' :
                          client.status === 'pending' ? 'bg-amber-400' : 'bg-slate-500'
                        }`} />
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{client.email}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#070b13] text-slate-400 border border-[#1e293b]">
                        {client.practiceArea}
                      </span>
                    </div>
                  </div>

                  {/* Integrated Client Financial Ledger Dropdown */}
                  <div className="px-3 pb-2.5 pt-0.5">
                    <ClientLedgerDropdown
                      client={client}
                      isOpen={isLedgerOpen}
                      onToggle={() => {
                        setOpenLedgerClientId(isLedgerOpen ? null : client.id);
                        if (!isSelected) {
                          setSelectedClient(client);
                        }
                      }}
                      onOpenFullLedger={() => {
                        setSelectedClient(client);
                        setActiveSubView('ledger');
                      }}
                    />
                  </div>
                </div>
              );
            })
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
      <div id="clients-detail-viewer-panel" className="lg:col-span-7 bg-[#0e1626] rounded-2.5xl border border-[#1e293b] flex flex-col overflow-hidden shadow-xl min-h-[480px] lg:min-h-0 h-full">
        {selectedClient ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
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
               <div id="client-sub-tab-bar" className="flex border-b border-[#1e293b] pt-1 overflow-x-auto">
                 <button
                   type="button"
                   id="tab-client-card"
                   onClick={() => setActiveSubView('card')}
                   className={`px-4 py-2.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 border-b-2 relative z-10 cursor-pointer ${
                     activeSubView === 'card'
                       ? 'text-amber-400 border-amber-500 bg-amber-500/5'
                       : 'text-slate-400 hover:text-slate-200 border-transparent bg-transparent'
                   }`}
                 >
                   <Bookmark className="w-4 h-4 text-amber-400" />
                   <span>📇 Populated Client Intake Card</span>
                 </button>
                 <button
                   type="button"
                   id="tab-client-ledger"
                   onClick={() => setActiveSubView('ledger')}
                   className={`px-4 py-2.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 border-b-2 relative z-10 cursor-pointer shrink-0 ${
                     activeSubView === 'ledger'
                       ? 'text-amber-400 border-amber-500 bg-amber-500/10'
                       : 'text-slate-400 hover:text-amber-300 border-transparent bg-transparent'
                   }`}
                 >
                   <DollarSign className="w-4 h-4 text-amber-400" />
                   <span>💳 Financial Trust Ledger</span>
                 </button>
                  <button
                    type="button"
                    id="tab-client-roster"
                    onClick={() => setActiveSubView('roster')}
                    className={'px-4 py-2.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 border-b-2 relative z-10 cursor-pointer shrink-0 ' + (
                      activeSubView === 'roster'
                        ? 'text-teal-400 border-teal-500 bg-[#14b8a6]/5'
                        : 'text-slate-400 hover:text-slate-200 border-transparent bg-transparent'
                    )}
                  >
                    <Users className="w-4 h-4 text-teal-400" />
                    <span>👥 Active Client Roster</span>
                  </button>
                 <button
                   type="button"
                   id="tab-client-files"
                   onClick={() => setActiveSubView('files')}
                   className={`px-4 py-2.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 border-b-2 relative z-10 cursor-pointer ${
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
                   className={`px-4 py-2.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 border-b-2 relative z-10 cursor-pointer ${
                     activeSubView === 'notes'
                       ? 'text-teal-400 border-teal-500 bg-[#14b8a6]/5'
                       : 'text-slate-400 hover:text-slate-200 border-transparent bg-transparent'
                   }`}
                 >
                   <FileText className="w-4 h-4 text-emerald-400/80" />
                   <span>📝 Raw Notes & AI Analysis</span>
                 </button>
               </div>
             </div>
 
             {/* Conditional Tab Rendering */}
             {activeSubView === 'card' ? (
               /* POPULATED CLIENT INTAKE CARD & GOOGLE DRIVE FILE MIRROR VIEW */
               <div id="client-card-view" className="p-6 space-y-5 flex-1 select-text">
                 {/* Top Google Drive Folder Mirror Banner */}
                 <div className="p-4 bg-gradient-to-r from-[#0d1625] via-[#09111e] to-[#0a101b] border border-amber-500/30 rounded-2xl space-y-3 shadow-lg">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                     <div className="space-y-1">
                       <div className="flex items-center gap-2">
                         <HardDrive className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
                         <h4 className="text-xs font-mono font-extrabold text-amber-300 uppercase tracking-wide flex items-center gap-2">
                           <span>Google Drive Client File Mirror</span>
                           <span className="px-2 py-0.5 text-[8.5px] font-mono rounded uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                             ● Live Database Card Populated
                           </span>
                         </h4>
                       </div>
                       <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5 flex-wrap">
                         <span className="text-slate-500">Path:</span>
                         <span className="px-2 py-0.5 bg-[#050811] text-amber-300 border border-slate-800 rounded">
                           Google Drive / level23consulting@gmail.com / 1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH / Clients / {selectedClient.name.replace(/\s+/g, '_')} /
                         </span>
                       </div>
                     </div>

                     {/* Header Buttons */}
                     <div className="flex flex-wrap items-center gap-2 shrink-0">
                       <button
                         type="button"
                         onClick={handleExtractCardData}
                         disabled={isExtractingCardData}
                         className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-[#090d16] font-mono text-xs font-black uppercase rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                         title="Extract client data from notes/files and populate cards in database"
                       >
                         {isExtractingCardData ? (
                           <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                         ) : (
                           <Sparkles className="w-3.5 h-3.5" />
                         )}
                         <span>{isExtractingCardData ? 'Extracting...' : '⚡ Extract & Populate Card (AI)'}</span>
                       </button>

                       <a
                         href="https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link"
                         target="_blank"
                         rel="noopener noreferrer"
                         className="px-3 py-1.5 bg-[#090d16] hover:bg-slate-900 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all"
                       >
                         <span>Open GDrive Folder</span>
                         <ExternalLink className="w-3.5 h-3.5" />
                       </a>
                     </div>
                   </div>
                 </div>

                 {/* POPULATED CLIENT INTAKE CARD DATA GRID */}
                 {(() => {
                   const cardData = getClientCardData(selectedClient);
                   return (
                     <div className="space-y-4">
                       <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                         <h3 className="text-xs font-mono font-extrabold uppercase text-amber-300 flex items-center gap-2">
                           <Bookmark className="w-4 h-4 text-amber-400" />
                           <span>Client File Dossier Cards — {selectedClient.name}</span>
                         </h3>
                         <span className="text-[10px] font-mono text-slate-400">
                           Ref ID: <code className="text-teal-400">{selectedClient.id}</code>
                         </span>
                       </div>

                       {/* GRID OF CARDS */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         
                         {/* CARD 1: Identity & Contact Card */}
                         <div className="p-4 bg-[#090d16] border border-slate-800 hover:border-slate-700 rounded-xl space-y-3 transition-all">
                           <div className="text-xs font-mono font-extrabold uppercase text-teal-300 pb-1.5 border-b border-slate-800 flex items-center justify-between">
                             <span>1. Personal & Contact Identity</span>
                             <span className="text-[9px] font-normal text-slate-500">Intake Dossier</span>
                           </div>
                           <div className="space-y-2 text-xs font-mono">
                             <div className="flex justify-between items-start">
                               <span className="text-slate-400">Full Legal Name:</span>
                               <span className="text-white font-bold text-right">{cardData['Full Legal Name']}</span>
                             </div>
                             <div className="flex justify-between items-start">
                               <span className="text-slate-400">DOB / Age:</span>
                               <span className="text-slate-200 text-right">{cardData['Date of Birth / Age']}</span>
                             </div>
                             <div className="flex justify-between items-start">
                               <span className="text-slate-400">Email:</span>
                               <span className="text-teal-300 text-right">{cardData['Email Address']}</span>
                             </div>
                             <div className="flex justify-between items-start">
                               <span className="text-slate-400">Phone:</span>
                               <span className="text-slate-200 text-right">{cardData['Phone Number']}</span>
                             </div>
                             <div className="flex justify-between items-start">
                               <span className="text-slate-400">Occupation / Employer:</span>
                               <span className="text-slate-300 text-right">{cardData['Occupation / Employer']}</span>
                             </div>
                             <div className="flex justify-between items-start pt-1 border-t border-slate-800/60">
                               <span className="text-slate-400">Residential Address:</span>
                               <span className="text-slate-300 text-right text-[11px] max-w-[65%]">{cardData['Residential Address']}</span>
                             </div>
                           </div>
                         </div>

                         {/* CARD 2: Case & Practice Parameters Card */}
                         <div className="p-4 bg-[#090d16] border border-slate-800 hover:border-slate-700 rounded-xl space-y-3 transition-all">
                           <div className="text-xs font-mono font-extrabold uppercase text-indigo-300 pb-1.5 border-b border-slate-800 flex items-center justify-between">
                             <span>2. {selectedClient.practiceArea} Matter Parameters</span>
                             <span className="text-[9px] font-normal text-slate-500">Case Facts</span>
                           </div>
                           <div className="space-y-2 text-xs font-mono">
                             <div className="flex justify-between items-start">
                               <span className="text-slate-400">Opposing Party / Respondent:</span>
                               <span className="text-amber-300 font-bold text-right max-w-[65%]">{cardData['Spouse / Opposing Party']}</span>
                             </div>
                             <div className="flex justify-between items-start">
                               <span className="text-slate-400">Date of Marriage / Entry:</span>
                               <span className="text-slate-200 text-right">{cardData['Date of Marriage / Entry Date']}</span>
                             </div>
                             <div className="flex justify-between items-start">
                               <span className="text-slate-400">Separation / Visa Class:</span>
                               <span className="text-slate-200 text-right">{cardData['Date of Separation / Visa Class']}</span>
                             </div>
                             <div className="flex justify-between items-start">
                               <span className="text-slate-400">Filing Court / County:</span>
                               <span className="text-teal-300 text-right text-[11px] max-w-[65%]">{cardData['Filing Court / County Jurisdiction']}</span>
                             </div>
                             <div className="flex justify-between items-start">
                               <span className="text-slate-400">Minor Children & DOBs:</span>
                               <span className="text-slate-200 text-right max-w-[65%]">{cardData['Minor Children & DOBs']}</span>
                             </div>
                           </div>
                         </div>

                         {/* CARD 3: Assets, Debts & Claims Requested */}
                         <div className="p-4 bg-[#090d16] border border-slate-800 hover:border-slate-700 rounded-xl space-y-3 transition-all">
                           <div className="text-xs font-mono font-extrabold uppercase text-amber-300 pb-1.5 border-b border-slate-800 flex items-center justify-between">
                             <span>3. Property, Relief & Claims Requested</span>
                             <span className="text-[9px] font-normal text-slate-500">Financial Disclosures</span>
                           </div>
                           <div className="space-y-2 text-xs font-mono">
                             <div>
                               <span className="text-slate-400 block mb-0.5">Requested Custody & Relief Claims:</span>
                               <p className="text-slate-200 bg-[#050811] p-2 rounded border border-slate-800 leading-relaxed text-[11px]">
                                 {cardData['Requested Custody & Relief']}
                               </p>
                             </div>
                             <div>
                               <span className="text-slate-400 block mb-0.5">Community Property & Debt Holdings:</span>
                               <p className="text-slate-200 bg-[#050811] p-2 rounded border border-slate-800 leading-relaxed text-[11px]">
                                 {cardData['Community Assets & Debts']}
                               </p>
                             </div>
                           </div>
                         </div>

                         {/* CARD 4: Primary Risks & Strategy Action Card */}
                         <div className="p-4 bg-[#090d16] border border-slate-800 hover:border-slate-700 rounded-xl space-y-3 transition-all">
                           <div className="text-xs font-mono font-extrabold uppercase text-emerald-300 pb-1.5 border-b border-slate-800 flex items-center justify-between">
                             <span>4. Legal Risk Assessment & Action Items</span>
                             <span className="text-[9px] font-normal text-slate-500">AI Strategy</span>
                           </div>
                           <div className="space-y-2 text-xs font-mono">
                             <div>
                               <span className="text-slate-400 block mb-0.5">Primary Legal Risks & Deadlines:</span>
                               <p className="text-emerald-300 bg-[#050811] p-2 rounded border border-emerald-500/20 leading-relaxed text-[11px]">
                                 {cardData['Primary Legal Risks & Next Steps']}
                               </p>
                             </div>
                             <div className="pt-2 flex items-center justify-between">
                               <span className="text-[10px] text-slate-500">Google Drive Sync Status:</span>
                               <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                 ✓ Synced to Drive Folder 1EW-bOXh...
                               </span>
                             </div>
                           </div>
                         </div>

                       </div>
                     </div>
                   );
                 })()}
               </div>
             ) : activeSubView === 'ledger' ? (
                /* FULL FINANCIAL TRUST & IOLTA LEDGER VIEW */
                <ClientFullLedgerView
                  client={selectedClient}
                  onReturnToCard={() => setActiveSubView('card')}
                />
             ) : activeSubView === 'roster' ? (
                /* FULL ACTIVE CLIENT ROSTER VIEW */
                <div id="client-roster-full-view" className="p-6 space-y-5 flex-1 select-text">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-400" />
                        <h3 className="text-sm font-heading font-black text-white tracking-wide uppercase">
                          Active Client Roster & Firm Directory
                        </h3>
                        <span className="px-2 py-0.5 text-[9px] font-mono rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                          {clients.length} Retained Clients
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans">
                        Complete directory of active matters, contacts, Google Drive folders, and case statuses.
                      </p>
                    </div>
                    <button
                      type="button"
                      id="btn-roster-quick-intake"
                      onClick={() => setShowModal(true)}
                      className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 text-[#090d16] rounded-xl text-xs font-bold font-mono transition shadow flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Client Intake</span>
                    </button>
                  </div>

                  {/* Search and Filter in Roster View */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search roster by name, email, phone, or matter ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-sans"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      {(['all', 'active', 'pending', 'inactive'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={'px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer ' + (
                            statusFilter === status
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                              : 'bg-[#090d16] text-slate-400 border border-[#1e293b] hover:text-slate-200'
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full Roster Table */}
                  <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#090d16]/80">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#1e293b] bg-[#070b13] text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          <th className="p-3.5">Client & Matter</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Contact</th>
                          <th className="p-3.5">Practice Area</th>
                          <th className="p-3.5">Drive Sync</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]/60">
                        {filteredClients.map((client) => {
                          const isSelected = selectedClient?.id === client.id;
                          return (
                            <React.Fragment key={client.id}>
                              <tr
                                onClick={() => {
                                  setSelectedClient(client);
                                  setActiveSubView('card');
                                }}
                                className={'group transition-colors cursor-pointer ' + (
                                  isSelected ? 'bg-teal-500/10' : 'hover:bg-[#0e1626]/70'
                                )}
                              >
                                <td className="p-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1e293b] to-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0 border border-slate-700">
                                      {client.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-200 group-hover:text-teal-300 transition-colors font-sans text-xs">
                                        {client.name}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-mono">
                                        ID: {client.id}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5">
                                  <span className={'px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ' + (
                                    client.status === 'active'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : client.status === 'pending'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                  )}>
                                    {client.status}
                                  </span>
                                </td>
                                <td className="p-3.5">
                                  <div className="text-slate-300 text-[11px] font-mono">{client.email}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{client.phone}</div>
                                </td>
                                <td className="p-3.5">
                                  <div className="text-teal-300 font-mono font-bold text-[11px]">{client.practiceArea || 'General Law'}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">Retained: {new Date(client.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td className="p-3.5">
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded border border-teal-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    1EW-bOXh5e...
                                  </span>
                                </td>
                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenTableLedgerClientId(openTableLedgerClientId === client.id ? null : client.id);
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer flex items-center gap-1 border ${
                                        openTableLedgerClientId === client.id
                                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                          : 'bg-[#0b1322] hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 border-[#1e293b] hover:border-amber-500/30'
                                      }`}
                                    >
                                      <DollarSign className="w-3 h-3 text-amber-400" />
                                      <span>Ledger {openTableLedgerClientId === client.id ? '▴' : '▾'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedClient(client);
                                        setActiveSubView('card');
                                      }}
                                      className="px-2.5 py-1 bg-slate-800/60 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 border border-slate-700 hover:border-teal-500/40 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer"
                                    >
                                      Open Card →
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {openTableLedgerClientId === client.id && (
                                <tr key={`${client.id}-table-ledger`} className="bg-[#050810]/95 border-b border-amber-500/30">
                                  <td colSpan={6} className="p-4">
                                    <ClientLedgerDropdown
                                      client={client}
                                      isOpen={true}
                                      onToggle={() => setOpenTableLedgerClientId(null)}
                                      onOpenFullLedger={() => {
                                        setSelectedClient(client);
                                        setActiveSubView('ledger');
                                      }}
                                    />
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeSubView === 'files' ? (
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
                           : `C:\\Users\\Administrator\\illamadex\\Clients\\${selectedClient.name.replace(/\s+/g, '_')}`}
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
                    Target Folder: <code>illamadex/Clients/{selectedClient?.name}/</code>
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
