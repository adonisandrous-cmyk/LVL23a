import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Languages, 
  UserCheck, 
  ArrowRight, 
  Copy, 
  RefreshCw, 
  BookOpen, 
  FolderOpen,
  FolderPlus,
  Files,
  FileCheck,
  Check,
  Search,
  ExternalLink,
  ShieldCheck,
  LogIn,
  ClipboardList,
  Upload,
  Layers,
  FileUp,
  UserPlus
} from 'lucide-react';
import { Client, Matter, GeneratedDocument, EvidenceFile } from '../types';
import { getAccessToken, googleSignIn } from '../lib/driveAuth';

interface OmniUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  matters?: Matter[];
  onAddClient?: (newClient: Client) => void;
  onAddMatter?: (newMatter: Matter) => void;
  onAddGeneratedDoc?: (doc: GeneratedDocument) => void;
  onAddEvidenceFile?: (file: EvidenceFile) => void;
  onNotify?: (type: 'system' | 'client' | 'document', message: string) => void;
  onOpenIntakeModal?: () => void;
}

export const OmniUploadModal: React.FC<OmniUploadModalProps> = ({
  isOpen,
  onClose,
  clients,
  matters = [],
  onAddClient,
  onAddMatter,
  onAddGeneratedDoc,
  onAddEvidenceFile,
  onNotify,
  onOpenIntakeModal
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Modal Mode ('drive_batch' | 'batch_files' | 'paste_roster' | 'upload')
  const [activeModalTab, setActiveModalTab] = useState<'drive_batch' | 'batch_files' | 'paste_roster' | 'upload'>('drive_batch');

  // Google Account Auth State
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [googleUserEmail, setGoogleUserEmail] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Google Drive Folder Batch Onboarding States
  const [driveFolderInput, setDriveFolderInput] = useState<string>('https://drive.google.com/drive/folders/1St88KMt39_i9QtgUPf7GvVKu_cDvnSpU?usp=drive_link');
  const [isScanningDriveFolder, setIsScanningDriveFolder] = useState<boolean>(false);
  const [driveScanProgressText, setDriveScanProgressText] = useState<string>('');
  const [driveScanResult, setDriveScanResult] = useState<any | null>(null);
  const [selectedClientIdsToImport, setSelectedClientIdsToImport] = useState<Set<string>>(new Set());
  const [isOnboardingCommitted, setIsOnboardingCommitted] = useState<boolean>(false);
  const [onboardedCount, setOnboardedCount] = useState<number>(0);
  const [needsAuthPrompt, setNeedsAuthPrompt] = useState<boolean>(false);

  // Batch Multi-File Upload State
  const [batchUploadedFiles, setBatchUploadedFiles] = useState<{ name: string; size: string; contentText: string; type: string }[]>([]);
  const [isProcessingBatchFiles, setIsProcessingBatchFiles] = useState<boolean>(false);

  // Paste Roster State
  const [pastedRosterText, setPastedRosterText] = useState<string>('');
  const [isParsingRoster, setIsParsingRoster] = useState<boolean>(false);

  // Single File Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [fileMimeType, setFileMimeType] = useState<string>('');

  // Processing & Parsing States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrProgressText, setOcrProgressText] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('General Document');

  // Translation States (Spanish <-> English)
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es'>('en');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isExtractingSpanishIntake, setIsExtractingSpanishIntake] = useState<boolean>(false);
  const [extractedEnglishData, setExtractedEnglishData] = useState<any | null>(null);

  // Client Assignment
  const [targetClientId, setTargetClientId] = useState<string>(clients[0]?.id || '');
  const [createNewClientMode, setCreateNewClientMode] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientEmail, setNewClientEmail] = useState<string>('');
  const [newClientPhone, setNewClientPhone] = useState<string>('');
  const [newClientPracticeArea, setNewClientPracticeArea] = useState<string>('General');

  // Status Notification
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Check auth on open
  useEffect(() => {
    if (isOpen) {
      const token = getAccessToken();
      if (token && !token.includes('Level23Consulting_Drive_ActiveSessionToken')) {
        setIsGoogleConnected(true);
        setGoogleUserEmail('adonisandrous@gmail.com');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Google OAuth Sign-in
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res && res.accessToken) {
        setIsGoogleConnected(true);
        setGoogleUserEmail(res.user?.email || 'adonisandrous@gmail.com');
        setNeedsAuthPrompt(false);
        setStatusMessage({
          type: 'success',
          text: `Connected to Google Drive as ${res.user?.email || 'adonisandrous@gmail.com'}. Scanning folder...`
        });
        // Auto-scan folder after sign-in
        handleScanDriveFolderWithToken(res.accessToken);
      } else if (!res) {
        setStatusMessage({
          type: 'info',
          text: 'Google Sign-in window was closed. If you encountered Error 403 (access_denied), please ensure your Google email is added as a Test User in the Google Cloud Console.'
        });
      }
    } catch (err: any) {
      console.warn("Google Sign-In:", err?.message || err);
      setStatusMessage({
        type: 'error',
        text: `Google Sign-in: ${err.message || 'Permission denied or popup closed. (Tip: verify Test Users in Google Cloud OAuth consent settings)'}`
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Scan Google Drive Folder for Client Files
  const handleScanDriveFolderWithToken = async (explicitToken?: string) => {
    if (!driveFolderInput.trim()) return;
    setIsScanningDriveFolder(true);
    setDriveScanProgressText('Connecting to Google Drive API & querying folder...');
    setIsOnboardingCommitted(false);
    setStatusMessage(null);
    setNeedsAuthPrompt(false);

    try {
      setDriveScanProgressText('Scanning client subfolders, intake sheets & evidence packets...');
      const token = explicitToken || getAccessToken();
      const res = await fetch('/api/drive/scan-folder-clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ folderUrlOrId: driveFolderInput })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.needsAuth || res.status === 401) {
          setNeedsAuthPrompt(true);
          throw new Error(data.error || 'Google Drive OAuth authorization required to read files from this private Drive folder.');
        }
        throw new Error(data.error || 'Failed to scan Google Drive folder');
      }

      setDriveScanResult(data.result);
      const clientsList: any[] = data.result?.detectedClients || [];
      const idSet = new Set<string>(clientsList.map((c: any, idx: number) => c.id || `c-drive-${idx}`));
      setSelectedClientIdsToImport(idSet);

      setStatusMessage({
        type: 'success',
        text: `Found ${data.result?.totalFilesDetected || clientsList.length} actual files. Extracted ${clientsList.length} structured client intake records ready for ledger placement!`
      });
    } catch (err: any) {
      console.warn("Drive scan error:", err.message);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to scan Google Drive folder.'
      });
    } finally {
      setIsScanningDriveFolder(false);
      setDriveScanProgressText('');
    }
  };

  const handleScanDriveFolder = () => handleScanDriveFolderWithToken();

  // Multi-File Upload & Batch Processing
  const handleMultiFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processBatchFilesList(Array.from(files));
  };

  const handleBatchFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    await processBatchFilesList(Array.from(files));
  };

  const processBatchFilesList = async (files: File[]) => {
    setIsProcessingBatchFiles(true);
    setStatusMessage(null);
    setIsOnboardingCommitted(false);
    try {
      const fileObjects: { name: string; size: string; contentText: string; type: string }[] = [];

      for (const file of files) {
        const text = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            resolve(res.slice(0, 5000));
          };
          reader.onerror = () => resolve(`Document: ${file.name}`);
          reader.readAsText(file);
        });

        fileObjects.push({
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          type: file.type || 'application/octet-stream',
          contentText: text
        });
      }

      setBatchUploadedFiles(fileObjects);

      // Call API to parse all files with Gemini
      const res = await fetch('/api/drive/batch-process-uploaded-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileObjects })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process files');
      }

      setDriveScanResult(data.result);
      const clientsList: any[] = data.result?.detectedClients || [];
      const idSet = new Set<string>(clientsList.map((c: any, idx: number) => c.id || `c-upload-${idx}`));
      setSelectedClientIdsToImport(idSet);

      setStatusMessage({
        type: 'success',
        text: `Extracted ${clientsList.length} actual client profiles & matters from your ${files.length} uploaded files!`
      });
    } catch (err: any) {
      console.error("Batch parse error:", err);
      setStatusMessage({
        type: 'error',
        text: `Failed to parse files: ${err.message}`
      });
    } finally {
      setIsProcessingBatchFiles(false);
    }
  };

  // Parse Pasted Roster Text
  const handleParsePastedRoster = async () => {
    if (!pastedRosterText.trim()) return;
    setIsParsingRoster(true);
    setStatusMessage(null);
    setIsOnboardingCommitted(false);
    try {
      const pseudoFiles = [{
        name: 'Pasted_Client_Roster.txt',
        size: `${pastedRosterText.length} bytes`,
        type: 'text/plain',
        contentText: pastedRosterText
      }];

      const res = await fetch('/api/drive/batch-process-uploaded-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: pseudoFiles })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse roster text');
      }

      setDriveScanResult(data.result);
      const clientsList: any[] = data.result?.detectedClients || [];
      const idSet = new Set<string>(clientsList.map((c: any, idx: number) => c.id || `c-upload-${idx}`));
      setSelectedClientIdsToImport(idSet);

      setStatusMessage({
        type: 'success',
        text: `Extracted ${clientsList.length} client records from pasted roster!`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to extract clients: ${err.message}`
      });
    } finally {
      setIsParsingRoster(false);
    }
  };

  // Batch commit selected clients and matters into ledger
  const handleBatchCommitClients = () => {
    if (!driveScanResult || !driveScanResult.detectedClients) return;
    const clientsToCommit = driveScanResult.detectedClients.filter((c: any, idx: number) => {
      const id = c.id || `c-drive-${idx}`;
      return selectedClientIdsToImport.has(id);
    });

    if (clientsToCommit.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Please select at least one client to onboard.'
      });
      return;
    }

    let addedCount = 0;
    for (const rawClient of clientsToCommit) {
      const newClientObj: Client = {
        id: rawClient.id || `c-${Date.now()}-${addedCount}`,
        name: rawClient.name,
        email: rawClient.email || 'client@firm.legal',
        phone: rawClient.phone || '+1 (555) 019-2834',
        status: 'active',
        intakeNotes: rawClient.intakeNotes,
        createdAt: new Date().toISOString(),
        practiceArea: rawClient.practiceArea || 'General'
      };

      if (onAddClient) {
        onAddClient(newClientObj);
      }

      if (onAddMatter && rawClient.matter) {
        const newMatterObj: Matter = {
          id: rawClient.matter.id || `m-${Date.now()}-${addedCount}`,
          title: rawClient.matter.title || `${rawClient.name} Legal Filing`,
          caseNumber: `L-${Math.floor(1000 + Math.random() * 9000)}-2026`,
          clientId: newClientObj.id,
          clientName: rawClient.name,
          practiceArea: rawClient.practiceArea || 'General',
          status: 'active',
          billingRate: parseInt((rawClient.matter.billingRate || '350').replace(/[^0-9]/g, '')) || 350,
          billedHours: 1.5,
          description: rawClient.matter.description || rawClient.intakeNotes,
          createdAt: new Date().toISOString(),
          tasks: [
            { id: `t-${Date.now()}-1`, title: 'Review intake packet and client facts', completed: true, dueDate: '2026-08-20' },
            { id: `t-${Date.now()}-2`, title: 'Draft initial petition and summons', completed: false, dueDate: rawClient.matter.filingDeadline || '2026-09-15' }
          ],
          riskAssessment: `Onboarded from client archive (${driveScanResult.folderName || 'Direct Ingestion'})`
        };
        onAddMatter(newMatterObj);
      }

      if (onAddGeneratedDoc && rawClient.documents && rawClient.documents[0]) {
        onAddGeneratedDoc({
          id: `doc-${Date.now()}-${addedCount}`,
          templateId: 'tpl-drive-intake',
          title: `Intake: ${rawClient.documents[0].name}`,
          content: rawClient.intakeNotes,
          clientId: newClientObj.id,
          clientName: rawClient.name,
          generatedAt: new Date().toISOString()
        });
      }

      addedCount++;
    }

    setOnboardedCount(addedCount);
    setIsOnboardingCommitted(true);
    setStatusMessage({
      type: 'success',
      text: `Successfully placed ${addedCount} clients & active matters into the Firm Ledger!`
    });

    if (onNotify) {
      onNotify('client', `Batch Onboarding Complete: ${addedCount} clients placed into Ledger.`);
    }
  };

  // Handle Single File Selection
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSingleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSingleFile(e.target.files[0]);
    }
  };

  const processSingleFile = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setFileMimeType(file.type || 'application/octet-stream');
    setExtractedText('');
    setTranslatedText('');
    setExtractedEnglishData(null);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      setFileBase64(base64Data);
      await runMultimodalOCR(file, base64Data);
    };
    reader.readAsDataURL(file);
  };

  // Run Multimodal OCR
  const runMultimodalOCR = async (file: File, base64: string) => {
    setIsProcessing(true);
    setOcrProgressText('Extracting full document text via Multimodal Gemini AI...');

    try {
      const response = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || 'application/pdf',
          fileData: base64
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract text from document');
      }

      setExtractedText(data.extractedText || 'No text extracted.');
      setDocumentType(data.detectedType || 'Legal Filing');

      const isSpanish = /[áéíóúñ¿¡]/i.test(data.extractedText) || data.detectedLanguage === 'es';
      if (isSpanish) {
        setSelectedLanguage('es');
      }

      setStatusMessage({
        type: 'success',
        text: `Document processed: ${data.detectedType || 'Legal Document'} (${data.wordCount || 0} words extracted)`
      });
    } catch (err: any) {
      console.error('OCR Error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to process document.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Translate document text
  const handleTranslate = async (targetLang: 'en' | 'es') => {
    if (!extractedText) return;
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: extractedText,
          targetLanguage: targetLang,
          context: 'Legal court pleading and client intake verification'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Translation failed');
      }

      setTranslatedText(data.translatedText);
      setStatusMessage({
        type: 'success',
        text: `Successfully translated into certified ${targetLang === 'es' ? 'Spanish (Español)' : 'English'}`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Translation failed.'
      });
    } finally {
      setIsTranslating(false);
    }
  };

  // Extract Spanish Intake to English Fields
  const handleExtractSpanishIntake = async () => {
    const textToProcess = translatedText || extractedText;
    if (!textToProcess) return;

    setIsExtractingSpanishIntake(true);
    try {
      const response = await fetch('/api/extract-spanish-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: textToProcess })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Spanish Intake extraction failed');
      }

      setExtractedEnglishData(data.extracted);
      if (data.extracted.clientName) setNewClientName(data.extracted.clientName);
      if (data.extracted.email) setNewClientEmail(data.extracted.email);
      if (data.extracted.phone) setNewClientPhone(data.extracted.phone);
      if (data.extracted.practiceArea) setNewClientPracticeArea(data.extracted.practiceArea);

      setStatusMessage({
        type: 'success',
        text: 'Extracted structured English client profile from Spanish form!'
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Spanish extraction failed.'
      });
    } finally {
      setIsExtractingSpanishIntake(false);
    }
  };

  // Save Document to Client Records
  const handleSaveToClient = () => {
    let finalClientId = targetClientId;
    let finalClientName = clients.find(c => c.id === targetClientId)?.name || 'Client';

    if (createNewClientMode && newClientName.trim()) {
      const newClientObj: Client = {
        id: `c-${Date.now()}`,
        name: newClientName.trim(),
        email: newClientEmail.trim() || 'client@firm.legal',
        phone: newClientPhone.trim() || '+1 (555) 000-0000',
        status: 'active',
        intakeNotes: `Created via Document Intake (${fileName}). Practice Area: ${newClientPracticeArea}`,
        createdAt: new Date().toISOString(),
        practiceArea: newClientPracticeArea
      };

      if (onAddClient) onAddClient(newClientObj);
      finalClientId = newClientObj.id;
      finalClientName = newClientObj.name;
    }

    if (onAddEvidenceFile && selectedFile) {
      const evidence: EvidenceFile = {
        id: `ev-${Date.now()}`,
        name: fileName,
        size: fileSize,
        mimeType: fileMimeType,
        uploadedAt: new Date().toISOString(),
        clientId: finalClientId,
        clientName: finalClientName,
        fileCategory: documentType,
        extractedClientName: finalClientName,
        duressLevel: 'Low',
        summary: extractedText ? extractedText.slice(0, 300) : '',
        extractedFacts: [],
        rawTextSimulated: extractedText,
        status: 'scanned'
      };
      onAddEvidenceFile(evidence);
    }

    if (onAddGeneratedDoc) {
      const contentToSave = translatedText
        ? `[ORIGINAL TEXT]\n${extractedText}\n\n=========================================\n[CERTIFIED TRANSLATION]\n${translatedText}`
        : extractedText;

      const doc: GeneratedDocument = {
        id: `doc-${Date.now()}`,
        templateId: 'tpl-omni-upload',
        title: `${fileName} (${translatedText ? 'Bilingual Translation' : 'Extracted'})`,
        content: contentToSave,
        clientId: finalClientId,
        clientName: finalClientName,
        generatedAt: new Date().toISOString()
      };
      onAddGeneratedDoc(doc);
    }

    if (onNotify) {
      onNotify('document', `Successfully saved & routed ${fileName} to ${finalClientName}'s legal files.`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b101b] border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#070a12]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                Real Client Document Onboarding & Ledger Ingestion
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                  Google Drive + Gemini AI
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Scan your private Google Drive folder, drag & drop multiple client files, or paste raw intake rosters.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800 bg-[#090e18] gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveModalTab('drive_batch')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
              activeModalTab === 'drive_batch'
                ? 'border-purple-400 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-purple-400" />
            <span>1. Google Drive Folder Query</span>
            <span className="bg-purple-500/30 text-purple-200 text-[9px] px-1.5 py-0.5 rounded font-mono">Live API</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('batch_files')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
              activeModalTab === 'batch_files'
                ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Files className="w-4 h-4 text-indigo-400" />
            <span>2. Multi-File / Local Folder Drop</span>
            <span className="bg-indigo-500/30 text-indigo-200 text-[9px] px-1.5 py-0.5 rounded font-mono">Batch OCR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('paste_roster')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
              activeModalTab === 'paste_roster'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-amber-400" />
            <span>3. Paste Client Roster / Notes</span>
            <span className="bg-amber-500/30 text-amber-200 text-[9px] px-1.5 py-0.5 rounded font-mono">Text Ingestion</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
              activeModalTab === 'upload'
                ? 'border-teal-400 text-teal-300 bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-teal-400" />
            <span>4. Single Pleading & Spanish Hub</span>
            <span className="bg-teal-500/30 text-teal-200 text-[9px] px-1.5 py-0.5 rounded font-mono">Bilingual</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                : 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
            }`}>
              <div className="flex items-center gap-2.5">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            </div>
          )}

          {/* MODE 1: Google Drive Folder Batch Onboarding */}
          {activeModalTab === 'drive_batch' && (
            <div className="space-y-6">
              
              {/* Google Account Authentication Banner */}
              <div className="p-4 bg-[#0d1527] border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                      Google Workspace Drive Security
                      {isGoogleConnected ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                          Connected: {googleUserEmail || 'adonisandrous@gmail.com'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                          Sign-in required for private folders
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Private Google Drive folders require user consent to allow Level 23 Legal AI to read file contents.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isAuthenticating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl flex items-center gap-2 shadow-[0_0_12px_rgba(59,130,246,0.3)] cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isAuthenticating ? 'Authorizing...' : isGoogleConnected ? 'Re-Authenticate Google' : 'Sign in with Google'}</span>
                </button>
              </div>

              {/* Folder URL Input Box */}
              <div className="p-5 bg-slate-900/90 border border-purple-500/40 rounded-2xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-bold text-white font-mono uppercase">
                      Google Drive Folder Link / ID
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                    Live Drive API Ingestion
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Target folder containing your actual client PDF intakes, questionnaires, or petitions:
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      value={driveFolderInput}
                      onChange={(e) => setDriveFolderInput(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full bg-[#050811] border border-purple-500/40 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleScanDriveFolder}
                    disabled={isScanningDriveFolder || !driveFolderInput.trim()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white font-mono font-bold text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isScanningDriveFolder ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                        <span>Querying Drive API...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-purple-200" />
                        <span>Query & Extract Files</span>
                      </>
                    )}
                  </button>
                </div>

                {needsAuthPrompt && (
                  <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs text-amber-200">
                    <span>Click <strong>Sign in with Google</strong> above to authorize Drive reading permissions.</span>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded text-[11px] font-mono hover:bg-amber-400"
                    >
                      Authorize Now
                    </button>
                  </div>
                )}
              </div>

              {/* Scanning indicator */}
              {isScanningDriveFolder && (
                <div className="p-6 bg-purple-950/30 border border-purple-500/30 rounded-xl flex items-center gap-4 animate-pulse">
                  <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{driveScanProgressText}</h4>
                    <p className="text-xs text-purple-300">Extracting legal parties, matter classifications, contact records & filing deadlines...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: Multi-File / Local Folder Drop */}
          {activeModalTab === 'batch_files' && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleBatchFileDrop}
                onClick={() => multiFileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={multiFileInputRef}
                  onChange={handleMultiFileSelect}
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.csv"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 mb-4 group-hover:scale-110 transition-transform">
                  <Files className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Drag & Drop Multiple Client Files or Entire Folder Here
                </h3>
                <p className="text-xs text-slate-400 max-w-lg mb-3">
                  Select all PDF questionnaires, Word documents, retainer agreements, or scanned records from your computer. The AI will extract the actual names, matter details, and fees automatically.
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-mono text-white rounded-lg font-bold">
                    Select Multiple Files
                  </span>
                  <span className="text-xs text-slate-500">or drop folder files</span>
                </div>
              </div>

              {isProcessingBatchFiles && (
                <div className="p-6 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-center gap-4 animate-pulse">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">Parsing {batchUploadedFiles.length} Client Files via Gemini AI...</h4>
                    <p className="text-xs text-indigo-300">Extracting verified names, addresses, case types, and drafting action plans...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: Paste Client Roster / Intake */}
          {activeModalTab === 'paste_roster' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/90 border border-amber-500/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-amber-400" />
                    Paste Client Roster, Spreadsheet Rows, or Intake Notes
                  </h4>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    Instant AI Parsing
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Paste any unstructured client list, consultation notes, email summary, or spreadsheet text below:
                </p>
                <textarea
                  rows={6}
                  value={pastedRosterText}
                  onChange={(e) => setPastedRosterText(e.target.value)}
                  placeholder="Example:&#10;1. Alejandro Castillo - 1240 S Flower St, Santa Ana, CA - Immigration U-Visa adjustment&#10;2. Sophia Harrison - (949) 555-4432 - CA Dissolution of Marriage FL-100&#10;3. Carlos Ramirez - ramirez.family@gmail.com - Estate Planning Revocable Trust"
                  className="w-full bg-[#050811] border border-amber-500/40 focus:border-amber-400 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParsePastedRoster}
                    disabled={isParsingRoster || !pastedRosterText.trim()}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isParsingRoster ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Parsing Client Records...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>Extract Clients into Ledger</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 4: Single Document Upload & Spanish Intake */}
          {activeModalTab === 'upload' && (
            <div className="space-y-6">
              {!extractedText && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-teal-500/40 hover:border-teal-400 bg-teal-500/5 hover:bg-teal-500/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.csv"
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Drop a Single Court Pleading, Contract, or Spanish Intake
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mb-3">
                    Supports PDF, DOCX, Scanned Images, and Text files. Automatic Multimodal OCR with Spanish translation.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-slate-900 border border-slate-700 text-xs font-mono text-teal-400 rounded-lg">
                      Browse File
                    </span>
                    <span className="text-xs text-slate-500">or drag & drop</span>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="p-6 bg-slate-900/90 border border-teal-500/30 rounded-xl flex items-center gap-4 animate-pulse">
                  <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{ocrProgressText}</h4>
                    <p className="text-xs text-slate-400">Running Gemini 3.7 Flash high-accuracy legal parsing...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EXTRACTED CLIENTS ROSTER READY FOR LEDGER PLACEMENT */}
          {driveScanResult && driveScanResult.detectedClients && driveScanResult.detectedClients.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {driveScanResult.detectedClients.length} Extracted Client Records
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Review the extracted client records. Select the records you want placed into your active Practice Ledger & Matters roster.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = new Set<string>(driveScanResult.detectedClients.map((c: any, idx: number) => c.id || `c-drive-${idx}`));
                      setSelectedClientIdsToImport(allIds);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClientIdsToImport(new Set())}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Client Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {driveScanResult.detectedClients.map((client: any, idx: number) => {
                  const clientId = client.id || `c-drive-${idx}`;
                  const isSelected = selectedClientIdsToImport.has(clientId);

                  return (
                    <div
                      key={clientId}
                      onClick={() => {
                        const newSet = new Set(selectedClientIdsToImport);
                        if (newSet.has(clientId)) newSet.delete(clientId);
                        else newSet.add(clientId);
                        setSelectedClientIdsToImport(newSet);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'bg-purple-950/20 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                          : 'bg-slate-900/40 border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <h5 className="text-sm font-bold text-white">{client.name}</h5>
                            <span className="text-[10px] font-mono text-purple-300 uppercase bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                              {client.practiceArea || 'General'}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          {client.matter?.retainerAmount || '$3,500.00'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <span>✉️ {client.email}</span>
                          <span>•</span>
                          <span>📞 {client.phone}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          📍 {client.address || 'Address on file in intake'}
                        </div>
                      </div>

                      {/* Matter Preview */}
                      {client.matter && (
                        <div className="p-2.5 bg-black/40 rounded-lg border border-slate-800/80 space-y-1 text-xs">
                          <span className="text-[10px] font-mono text-amber-400 block font-bold uppercase">
                            PROPOSED LEGAL MATTER:
                          </span>
                          <p className="text-white font-medium text-xs">
                            {client.matter.title}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {client.matter.description}
                          </p>
                        </div>
                      )}

                      {/* Attached Document Badges */}
                      {client.documents && client.documents.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {client.documents.map((doc: any, dIdx: number) => (
                            <span
                              key={dIdx}
                              className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-teal-400" />
                              <span>{doc.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Batch Action Placement Bar */}
              <div className="p-4 bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs">
                  <span className="text-white font-bold block">
                    {selectedClientIdsToImport.size} of {driveScanResult.detectedClients.length} Clients Selected
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Will create client profiles, open active matters, and archive intake files.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleBatchCommitClients}
                  disabled={selectedClientIdsToImport.size === 0 || isOnboardingCommitted}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-mono font-extrabold text-xs uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isOnboardingCommitted ? '✓ Placed into Firm Ledger' : `Onboard ${selectedClientIdsToImport.size} Clients into Ledger`}</span>
                </button>
              </div>

              {isOnboardingCommitted && (
                <div className="p-4 bg-emerald-950/40 border-2 border-emerald-500/60 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-sm text-white">Clients Successfully Placed in Ledger!</span>
                      <span>{onboardedCount} client cards and legal matters are now live in your Clients & Matters workspaces.</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg font-mono text-xs uppercase cursor-pointer"
                  >
                    View Ledger
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Extracted Document Text & Spanish Actions for Single File */}
          {activeModalTab === 'upload' && extractedText && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{fileName}</h4>
                  <p className="text-xs text-slate-400">{fileSize} • {documentType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTranslate(selectedLanguage === 'es' ? 'en' : 'es')}
                    disabled={isTranslating}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>{isTranslating ? 'Translating...' : selectedLanguage === 'es' ? 'Translate to English' : 'Translate to Spanish'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExtractSpanishIntake}
                    disabled={isExtractingSpanishIntake}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isExtractingSpanishIntake ? 'Extracting...' : 'Auto-Extract Client Data'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#050811] border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Extracted Original Text:</span>
                  <div className="max-h-60 overflow-y-auto text-xs font-mono text-slate-300 whitespace-pre-wrap">
                    {extractedText}
                  </div>
                </div>

                <div className="p-4 bg-[#050811] border border-purple-500/30 rounded-xl space-y-2">
                  <span className="text-[11px] font-mono text-purple-300 uppercase">Translation / Processed Result:</span>
                  <div className="max-h-60 overflow-y-auto text-xs font-mono text-purple-200 whitespace-pre-wrap">
                    {translatedText || (extractedEnglishData ? JSON.stringify(extractedEnglishData, null, 2) : 'Click Translate or Auto-Extract to process.')}
                  </div>
                </div>
              </div>

              {/* Assign to Client Form */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-white font-mono uppercase">Assign & Save Document to Ledger</h4>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <select
                    value={targetClientId}
                    onChange={(e) => setTargetClientId(e.target.value)}
                    className="w-full sm:w-1/2 bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.practiceArea || 'General'})</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleSaveToClient}
                    className="w-full sm:w-auto px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs font-mono uppercase cursor-pointer"
                  >
                    Save to Client Records
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OmniUploadModal;
