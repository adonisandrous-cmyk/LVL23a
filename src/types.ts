export interface MinorChildRecord {
  name: string;
  birthdate: string;
  age: number;
  sex?: string;
}

export interface FL120IntakeData {
  caseNumber?: string;
  courtCounty?: string;
  branchName?: string;
  petitionerName?: string;
  respondentName?: string;
  proceedingType?: 'Dissolution' | 'Legal Separation' | 'Nullity';
  legalRelationship?: 'Marriage' | 'Domestic Partnership (CA)' | 'Domestic Partnership (Non-CA)';
  residenceRequirementMet?: boolean;
  dateOfMarriage?: string;
  dateOfSeparation?: string;
  durationYears?: number;
  durationMonths?: number;
  hasMinorChildren?: boolean;
  minorChildren?: MinorChildRecord[];
  uccjeaFormRequired?: boolean;
  legalGrounds?: 'Irreconcilable Differences' | 'Permanent Legal Incapacity' | 'Nullity/Void';
  custodyLegal?: 'Petitioner' | 'Respondent' | 'Joint' | 'Other';
  custodyPhysical?: 'Petitioner' | 'Respondent' | 'Joint' | 'Other';
  visitationRequested?: string;
  childSupportRequested?: boolean;
  spousalSupportRequested?: 'Payable to Petitioner' | 'Payable to Respondent' | 'Terminate' | 'Reserve' | 'None';
  separatePropertyConfirmed?: boolean;
  separatePropertyNotes?: string;
  communityPropertyDivision?: boolean;
  communityPropertyNotes?: string;
  attorneyFeesPayableBy?: 'Petitioner' | 'Respondent' | 'None';
  formerNameRestored?: string;
  abbyyExtractionTimestamp?: string;
  abbyyBatchId?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  intakeNotes: string;
  createdAt: string;
  practiceArea: string;
  fl120Data?: FL120IntakeData;
}

export interface Matter {
  id: string;
  title: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
  practiceArea: 'Family Law' | 'Immigration' | 'Bankruptcy' | 'General Practice' | 'Corporate' | 'Estate Planning' | string;
  status: 'active' | 'pending' | 'completed';
  billingRate: number;
  billedHours: number;
  description: string;
  createdAt: string;
  tasks: Task[];
  riskAssessment?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
}

export interface ActivityLog {
  id: string;
  type: 'client' | 'matter' | 'document' | 'voice' | 'system';
  message: string;
  timestamp: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultQuestions: string[];
  templateBody?: string; // Raw pleading template containing double-curly-braces tokens (e.g., {{CLIENT_NAME}})
  isCustom?: boolean;    // Custom created by attorney flag
}

export interface DocumentVersion {
  versionNumber: number;
  content: string;
  timestamp: string;
  notes?: string;
}

export interface GeneratedDocument {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  templateId: string;
  content: string;
  generatedAt: string;
  version?: number;
  versions?: DocumentVersion[];
}

export interface LegalMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agentName: string;
  fileAttachment?: {
    name: string;
    size: string;
    type?: string;
    content?: string;
  };
  detectedIntent?: {
    category: string;
    summary: string;
    objective?: string;
    implicitNeeds?: string[];
    recommendedAction?: string;
  };
}

export interface VoiceAgentProfile {
  id: string;
  name: string;
  avatar: string;
  role: string;
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' | 'Aoede' | string;
  description: string;
  accent: string;
  style: string;
  portrait?: string;
}

export interface SystemDiagnostic {
  id: string;
  name: string;
  value: string | number;
  status: 'ok' | 'warning' | 'critical';
  details: string;
}

export interface AgentExtractionResult {
  taskAudit: {
    taskId: string;
    assignedAgent: string;
    taskName: string;
    status: string;
    timestamp: string;
    extractedFieldsCount: number;
    summary: string;
    keyHighlights: string[];
  };
  client: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    practiceArea: string;
    status: 'active' | 'inactive' | 'pending';
    intakeNotes: string;
    keyDates?: { event: string; date: string; sourceDocument?: string }[];
  };
  extractedFields: Record<string, string>;
  matter?: {
    title: string;
    caseNumber: string;
    practiceArea: string;
    status: 'active' | 'pending' | 'completed';
    billingRate: number;
    description: string;
    filingDeadline?: string;
    tasks?: { id: string; title: string; dueDate: string; completed: boolean }[];
  };
}

export interface AgentProgress {
  agentId: string;
  rapportScore: number; // 0 to 100
  personalityState: 'Reserved' | 'Collaborative' | 'Trusting' | 'Empathetic' | 'Highly Aligned';
  interactionCount: number;
  unlockedCapabilities: string[];
  caseFamiliarity: number; // 0 to 100
  prosecutorialAggression: number; // 0 to 100
}

export interface ConsultationSession {
  id: string;
  clientId: string;
  clientName: string;
  roomName: string;
  meetingType: 'Consultation' | 'Deposition' | 'Mediation' | 'Hearing';
  scheduledFor: string;
  status: 'active' | 'scheduled' | 'concluded';
  notes: string;
}

export interface EvidenceFile {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  uploadedAt: string;
  clientId: string;
  clientName: string;
  matterId?: string;
  matterTitle?: string;
  fileCategory: string;
  extractedClientName: string;
  duressLevel: 'High' | 'Medium' | 'Low' | 'N/A';
  summary: string;
  extractedFacts: string[];
  rawTextSimulated?: string;
  status: 'scanned' | 'processing' | 'failed';
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'trust_deposit' | 'trust_disbursement' | 'invoice_issued' | 'payment_received' | 'expense' | 'fee_earned';
  description: string;
  referenceNumber: string;
  category: 'IOLTA Trust' | 'Operating Account' | 'Filing Fee' | 'Retainer' | 'Hourly Billing';
  amount: number;
  balanceAfter: number;
  trustBalanceAfter: number;
  status: 'cleared' | 'pending' | 'processing';
  recordedBy: string;
}

export interface ClientLedger {
  clientId: string;
  trustBalance: number;
  operatingBalance: number;
  totalInvoiced: number;
  totalPaid: number;
  unbilledHours: number;
  hourlyRate: number;
  lastBillingDate: string;
  entries: LedgerEntry[];
}


