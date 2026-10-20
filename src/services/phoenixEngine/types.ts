/**
 * LEVEL 23 / PHOENIX 23 — AI DOCUMENT AUTOMATION ENGINE
 * Core Types & Agent Contracts
 * 
 * Absolute Rule:
 * THE AI MAY NOT ALTER THE ORIGINAL DOCUMENT'S STRUCTURE.
 * Layer 1 = Visual Master (Immutable)
 * Layer 2 = Intelligence Layer (Field Map, Extracted Data, Provenance, Rules)
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

export interface DocumentGeometry {
  pageCount: number;
  pages: Array<{
    pageNumber: number;
    widthPoints: number;
    heightPoints: number;
    rotationDegrees: number;
    orientation: 'portrait' | 'landscape';
    mediaBox?: [number, number, number, number];
  }>;
}

export interface DocumentElementNode {
  id: string;
  type: 'text' | 'label' | 'blank_line' | 'checkbox' | 'radio' | 'table' | 'table_cell' | 'signature_area' | 'header' | 'footer' | 'barcode' | 'unknown';
  pageNumber: number;
  bounds: BoundingBox;
  text?: string;
  normalizedText?: string;
  nativeFieldName?: string;
  isFillableBlank: boolean;
  confidence: number;
}

export interface DocumentStructureMap {
  documentId: string;
  sha256: string;
  geometry: DocumentGeometry;
  hasNativeAcroForms: boolean;
  isScannedOrImage: boolean;
  elements: DocumentElementNode[];
  detectedBlanks: Array<{
    blankId: string;
    pageNumber: number;
    bounds: BoundingBox;
    promptLabel?: string;
    suggestedCanonicalField?: string;
    fieldCategory: 'text' | 'checkbox' | 'date' | 'signature' | 'number';
  }>;
  analyzedAt: string;
}

export interface MultiPassVerificationAudit {
  pass1_initialExtraction: {
    rawCandidateValue: string | boolean | number;
    timestamp: string;
  };
  pass2_atomicItemAudit: {
    isolatedItemValue: string | boolean | number;
    specificFieldType: string;
    labelsStripped: boolean;
    compoundDecomposed: boolean;
  };
  pass3_surroundingWordsExamination: {
    surroundingTokensFound: string[];
    semanticContextMatched: boolean;
    examinationNotes: string;
  };
  pass4_integrityCertification: {
    certified: boolean;
    zeroBleedConfirmed: boolean;
    finalValue: string | boolean | number;
  };
}

export interface ExtractedFieldValue {
  fieldId: string;
  canonicalName: string;
  sourceLabel: string;
  value: string | boolean | number;
  sourcePage: number;
  sourceCoordinates: BoundingBox;
  extractionMethod: 'native_pdf' | 'ocr' | 'vision' | 'manual' | 'derived';
  confidence: number; // 0.0 - 1.0
  requiresReview: boolean;
  reviewReason?: string;
  timestamp: string;
  verificationAudit?: MultiPassVerificationAudit;
  provenance: {
    documentId: string;
    originalSha256: string;
    agentName: string;
    characterSpan?: [number, number];
    rawSnippet?: string;
  };
}

export interface CanonicalFieldMapping {
  mappingId: string;
  templateId: string;
  versionNumber: number;
  canonicalName: string; // e.g., 'person.full_name', 'court.case_number'
  sourceLabel: string;
  pageNumber: number;
  bounds: BoundingBox;
  dataType: 'text' | 'date' | 'person_name' | 'phone' | 'email' | 'ssn' | 'identifier' | 'signature' | 'boolean' | 'currency';
  required: boolean;
  validationRules?: Record<string, any>;
  nativeAcroFieldName?: string;
  confidence: number;
}

export interface IntelligentTemplate {
  templateId: string;
  templateName: string;
  documentId: string;
  sourceVersionId: string;
  currentVersionNumber: number;
  sourceSha256: string;
  status: 'draft' | 'certified' | 'production' | 'retired';
  validationStatus: 'pass' | 'fail' | 'review_required';
  fieldMappings: CanonicalFieldMapping[];
  geometry: DocumentGeometry;
  createdAt: string;
  certifiedAt?: string;
}

export interface PopulationInput {
  templateId: string;
  clientData?: Record<string, any>;
  matterData?: Record<string, any>;
  outputFormat?: 'pdf' | 'fillable_pdf' | 'xfdf' | 'fdf' | 'json';
  overrideValues?: Record<string, any>;
}

export interface PopulatedOutputResult {
  jobId: string;
  templateId: string;
  outputFormat: string;
  pdfBytes?: Uint8Array;
  downloadUrl?: string;
  xfdfContent?: string;
  fdfContent?: string;
  dataJson?: Record<string, any>;
  populatedFieldCount: number;
  blankFieldCount: number;
  unmappedFieldCount: number;
  outputSha256: string;
  visualMasterSha256: string;
  status: 'completed' | 'failed' | 'review_required';
  createdAt: string;
}

export interface QACheckItem {
  checkName: string;
  category: 'document_integrity' | 'visual_integrity' | 'field_integrity' | 'data_provenance';
  passed: boolean;
  expected: any;
  actual: any;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface QAValidationReport {
  reportId: string;
  documentId: string;
  templateId?: string;
  outputId?: string;
  passed: boolean;
  isValid?: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  checks: QACheckItem[];
  timestamp: string;
}

export interface AgentDescriptor {
  id: string;
  name: string;
  index: number;
  title: string;
  directive: string;
  permissionPolicy: {
    read: string[];
    write: string[];
    forbidden: string[];
  };
  status: 'idle' | 'running' | 'completed' | 'failed' | 'review_needed';
  lastActivity?: string;
}

export interface AgentChatMessage {
  id: string;
  agentId: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ExecutiveDirectivePackage {
  id?: string;
  dispatcher?: 'phoenix' | 'eve';
  dispatcherAgent: 'phoenix' | 'eve';
  dispatcherName: string;
  dispatcherTitle: string;
  directiveTitle: string;
  generalInstructions: string;
  caseStrategy?: string;
  matterReference?: {
    clientId?: string;
    clientName?: string;
    matterId?: string;
    caseNumber?: string;
    courtCounty?: string;
  };
  customAgentDirectives?: {
    agent_1_ingestion?: string;
    agent_2_analysis?: string;
    agent_3_extraction?: string;
    agent_4_database?: string;
    agent_5_template_builder?: string;
    agent_6_delivery?: string;
    agent_7_integration?: string;
    agent_8_qa_sentinel?: string;
  };
  dispatchedAt: string;
}

export interface PipelineExecutionState {
  jobId: string;
  documentId: string;
  filename: string;
  currentStep: number; // 1 to 8
  overallStatus: 'idle' | 'ingesting' | 'analyzing' | 'extracting' | 'persisting' | 'building_template' | 'populating' | 'integrating' | 'qa_validating' | 'completed' | 'failed' | 'review_required';
  originalHash?: string;
  structureMap?: DocumentStructureMap;
  extractedValues?: ExtractedFieldValue[];
  template?: IntelligentTemplate;
  qaReport?: QAValidationReport;
  executiveDirective?: ExecutiveDirectivePackage;
  auditTrail: Array<{
    step: number;
    agentName: string;
    operation: string;
    timestamp: string;
    status: string;
    notes?: string;
  }>;
}
