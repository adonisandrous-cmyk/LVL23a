export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  intakeNotes: string;
  createdAt: string;
  practiceArea: string;
}

export interface Matter {
  id: string;
  title: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
  practiceArea: 'Family Law' | 'Immigration' | 'Bankruptcy' | 'General Practice';
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

export interface GeneratedDocument {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  templateId: string;
  content: string;
  generatedAt: string;
}

export interface LegalMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agentName: string;
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
  fileCategory: string; // 'Hospital invoice', 'Death warning list', 'Bank statements ledger', etc.
  extractedClientName: string;
  duressLevel: 'High' | 'Medium' | 'Low' | 'N/A';
  summary: string;
  extractedFacts: string[];
  rawTextSimulated?: string;
  status: 'scanned' | 'processing' | 'failed';
}


