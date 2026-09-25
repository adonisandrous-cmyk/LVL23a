/**
 * LEVEL 23 / PHOENIX 23
 * DOCUMENT INTELLIGENCE + LEGAL FORM AUTOMATION DATABASE
 * TypeScript schema and type definitions matching PostgreSQL 15+ schema (schema.sql)
 * 
 * Design rule:
 *   GOLDEN MASTER = immutable source
 *   INTELLIGENCE TWIN = extracted/mapped/searchable knowledge
 *   TEMPLATE = reusable field map/overlay
 *   POPULATION = deterministic output operation
 *   QA = independent verification
 */

// ============================================================
// 1. ENUMS
// ============================================================

export type DocumentStatus =
  | 'uploaded'
  | 'ingesting'
  | 'analyzing'
  | 'extracting'
  | 'mapping'
  | 'validating'
  | 'certified'
  | 'production'
  | 'failed'
  | 'archived';

export type TemplateStatus =
  | 'draft'
  | 'processing'
  | 'review'
  | 'certified'
  | 'production'
  | 'retired';

export type ReviewStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'corrected'
  | 'escalated';

export type ConfidenceBand =
  | 'very_low'
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type AgentStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'blocked'
  | 'cancelled';

export type ExtractionMethod =
  | 'native_pdf'
  | 'ocr'
  | 'vision'
  | 'manual'
  | 'imported'
  | 'derived';

export type FieldDataType =
  | 'text'
  | 'long_text'
  | 'person_name'
  | 'date'
  | 'datetime'
  | 'time'
  | 'number'
  | 'currency'
  | 'boolean'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'address'
  | 'phone'
  | 'email'
  | 'ssn'
  | 'identifier'
  | 'signature'
  | 'image'
  | 'unknown';

export type ElementType =
  | 'text'
  | 'label'
  | 'paragraph'
  | 'table'
  | 'table_cell'
  | 'line'
  | 'checkbox'
  | 'radio'
  | 'signature'
  | 'image'
  | 'graphic'
  | 'header'
  | 'footer'
  | 'page_number'
  | 'instruction'
  | 'unknown';

export type SourceType =
  | 'upload'
  | 'client_record'
  | 'matter_record'
  | 'other_document'
  | 'manual_entry'
  | 'integration'
  | 'derived';

export type ValidationResult = 'pass' | 'fail' | 'warning' | 'not_run';

export type PopulationStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'review_required';

export type OutputFormat =
  | 'pdf'
  | 'fillable_pdf'
  | 'xfdf'
  | 'fdf'
  | 'json'
  | 'xml'
  | 'image';

export type VersionChangeType = 'identical' | 'minor' | 'major' | 'new_document';

export type EvidenceType =
  | 'source_text'
  | 'source_coordinate'
  | 'source_image'
  | 'database_record'
  | 'manual_entry'
  | 'agent_reasoning';

// ============================================================
// 2. TENANTS / USERS / SECURITY BOUNDARY
// ============================================================

export interface Tenant {
  tenant_id: string; // UUID
  tenant_name: string;
  slug: string; // CITEXT
  status: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface AppUser {
  user_id: string; // UUID
  tenant_id?: string | null;
  email: string; // CITEXT
  display_name: string;
  role: string;
  active: boolean;
  created_at: string;
  last_seen_at?: string | null;
  metadata: Record<string, any>;
}

// ============================================================
// 3. CLIENTS / MATTERS / PARTIES
// ============================================================

export interface ClientRecord {
  client_id: string; // UUID
  tenant_id?: string | null;
  external_key?: string | null;
  display_name: string;
  status: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MatterRecord {
  matter_id: string; // UUID
  tenant_id?: string | null;
  client_id?: string | null;
  matter_number?: string | null;
  matter_name: string;
  case_type?: string | null;
  jurisdiction?: string | null;
  court_name?: string | null;
  court_county?: string | null;
  court_state?: string | null;
  case_number?: string | null;
  filing_date?: string | null;
  status: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PartyRecord {
  party_id: string; // UUID
  tenant_id?: string | null;
  matter_id?: string | null;
  party_role?: string | null;
  party_type?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  suffix?: string | null;
  organization_name?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  email?: string | null;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PartyAddress {
  address_id: string; // UUID
  party_id: string;
  address_type: string;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  is_current: boolean;
  created_at: string;
}

export interface MatterDocument {
  matter_id: string;
  document_id: string;
}

// ============================================================
// 4. IMMUTABLE DOCUMENT / GOLDEN MASTER
// ============================================================

export interface DocumentRow {
  document_id: string; // UUID
  tenant_id?: string | null;
  client_id?: string | null;
  matter_id?: string | null;
  filename: string;
  document_type?: string | null;
  form_number?: string | null;
  form_family?: string | null;
  mime_type: string;
  source: SourceType;
  status: DocumentStatus;
  original_sha256: string; // CHAR(64)
  file_size_bytes: number;
  page_count?: number | null;
  storage_uri: string;
  uploaded_by?: string | null;
  uploaded_at: string;
  archived_at?: string | null;
  metadata: Record<string, any>;
}

export interface DocumentVersion {
  version_id: string; // UUID
  document_id: string;
  version_number: number;
  sha256: string; // CHAR(64)
  storage_uri: string;
  page_count?: number | null;
  page_width_points?: number | null;
  page_height_points?: number | null;
  orientation?: string | null;
  is_golden_master: boolean;
  change_type?: VersionChangeType | null;
  parent_version_id?: string | null;
  created_at: string;
  created_by?: string | null;
  metadata: Record<string, any>;
}

export interface DocumentPage {
  page_id: string; // UUID
  version_id: string;
  page_number: number;
  width_points: number;
  height_points: number;
  rotation_degrees: number;
  rendered_image_uri?: string | null;
  page_sha256?: string | null;
  text_sha256?: string | null;
}

export interface DocumentElement {
  element_id: string; // UUID
  page_id: string;
  element_type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation_degrees: number;
  reading_order?: number | null;
  text_content?: string | null;
  normalized_text?: string | null;
  confidence?: number | null;
  extraction_method?: ExtractionMethod | null;
  native_field_name?: string | null;
  metadata: Record<string, any>;
}

export interface DocumentAsset {
  asset_id: string; // UUID
  version_id: string;
  asset_type: string;
  storage_uri: string;
  sha256?: string | null;
  page_number?: number | null;
  metadata: Record<string, any>;
}

// ============================================================
// 5. FIELD ONTOLOGY / DATA DICTIONARY
// ============================================================

export interface FieldDefinition {
  field_id: string; // UUID
  canonical_name: string;
  display_name: string;
  description?: string | null;
  namespace?: string | null;
  data_type: FieldDataType;
  required_default: boolean;
  risk_level: RiskLevel;
  validation_schema: Record<string, any>;
  synonyms: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FieldAlias {
  alias_id: string; // UUID
  field_id: string;
  alias: string;
  source?: string | null;
}

export interface FieldDependency {
  dependency_id: string; // UUID
  field_id: string;
  depends_on_field_id: string;
  rule: Record<string, any>;
}

// ============================================================
// 6. TEMPLATE SYSTEM
// ============================================================

export interface TemplateRow {
  template_id: string; // UUID
  tenant_id?: string | null;
  document_id: string;
  source_version_id: string;
  template_name: string;
  form_number?: string | null;
  form_family?: string | null;
  status: TemplateStatus;
  certification_status: ReviewStatus;
  current_version_number: number;
  source_sha256: string;
  created_at: string;
  certified_at?: string | null;
  retired_at?: string | null;
  metadata: Record<string, any>;
}

export interface TemplateVersion {
  template_version_id: string; // UUID
  template_id: string;
  version_number: number;
  source_version_id: string;
  field_map_version: number;
  rendered_preview_uri?: string | null;
  template_storage_uri?: string | null;
  status: TemplateStatus;
  source_hash: string;
  created_at: string;
  certified_at?: string | null;
  certified_by?: string | null;
}

export interface FieldMapping {
  mapping_id: string; // UUID
  template_version_id: string;
  field_id: string;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation_degrees: number;
  field_type: FieldDataType;
  source_label?: string | null;
  source_element_id?: string | null;
  native_pdf_field_name?: string | null;
  required: boolean;
  confidence?: number | null;
  confidence_band?: ConfidenceBand | null;
  risk_level: RiskLevel;
  review_status: ReviewStatus;
  mapping_version: number;
  validation_rules: Record<string, any>;
  metadata: Record<string, any>;
}

// ============================================================
// 7. EXTRACTION + PROVENANCE
// ============================================================

export interface ExtractionBatch {
  extraction_batch_id: string; // UUID
  document_id: string;
  source_version_id?: string | null;
  status: AgentStatus;
  method: ExtractionMethod;
  started_at?: string | null;
  completed_at?: string | null;
  metadata: Record<string, any>;
}

export interface ExtractedValue {
  value_id: string; // UUID
  field_id: string;
  document_id: string;
  source_version_id?: string | null;
  extraction_batch_id?: string | null;
  value_text?: string | null;
  value_json?: Record<string, any> | null;
  source_page?: number | null;
  source_x?: number | null;
  source_y?: number | null;
  source_width?: number | null;
  source_height?: number | null;
  source_text?: string | null;
  extraction_method: ExtractionMethod;
  agent_run_id?: string | null;
  confidence?: number | null;
  confidence_band?: ConfidenceBand | null;
  risk_level: RiskLevel;
  review_status: ReviewStatus;
  created_at: string;
  provenance: Record<string, any>;
}

export interface ExtractionCandidate {
  candidate_id: string; // UUID
  field_id: string;
  document_id: string;
  candidate_value?: string | null;
  candidate_json?: Record<string, any> | null;
  source_page?: number | null;
  source_text?: string | null;
  confidence?: number | null;
  model_name?: string | null;
  agent_run_id?: string | null;
  selected: boolean;
  rejection_reason?: string | null;
  created_at: string;
}

export interface EvidenceRecord {
  evidence_id: string; // UUID
  document_id?: string | null;
  value_id?: string | null;
  mapping_id?: string | null;
  evidence_type: EvidenceType;
  page_number?: number | null;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  quoted_text?: string | null;
  storage_uri?: string | null;
  hash?: string | null;
  metadata: Record<string, any>;
}

// ============================================================
// 8. AGENTS / MODELS / RUNS
// ============================================================

export interface AiModel {
  model_id: string; // UUID
  provider: string;
  model_name: string;
  model_version?: string | null;
  capability_class?: string | null;
  active: boolean;
  metadata: Record<string, any>;
}

export interface Agent {
  agent_id: string; // UUID
  agent_name: string;
  role_description: string;
  permission_policy: {
    read?: string[];
    write?: string[];
    forbidden?: string[];
    [key: string]: any;
  };
  active: boolean;
}

export interface AgentRun {
  agent_run_id: string; // UUID
  agent_id: string;
  model_id?: string | null;
  tenant_id?: string | null;
  document_id?: string | null;
  template_id?: string | null;
  parent_run_id?: string | null;
  status: AgentStatus;
  started_at?: string | null;
  completed_at?: string | null;
  input_hash?: string | null;
  output_hash?: string | null;
  prompt_version?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  input_json: Record<string, any>;
  output_json: Record<string, any>;
  metrics: Record<string, any>;
}

export interface AgentMessage {
  message_id: string; // UUID
  agent_run_id: string;
  message_type: string;
  direction: 'inbound' | 'outbound' | 'internal';
  payload: Record<string, any>;
  created_at: string;
}

// ============================================================
// 9. POPULATION / OUTPUTS
// ============================================================

export interface PopulationJob {
  population_job_id: string; // UUID
  tenant_id?: string | null;
  matter_id?: string | null;
  template_version_id: string;
  status: PopulationStatus;
  requested_by?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  input_snapshot: Record<string, any>;
  error_message?: string | null;
  metadata: Record<string, any>;
}

export interface PopulationValue {
  population_value_id: string; // UUID
  population_job_id: string;
  mapping_id: string;
  field_id: string;
  value_text?: string | null;
  value_json?: Record<string, any> | null;
  source_value_id?: string | null;
  status: ReviewStatus;
  validation_message?: string | null;
  created_at: string;
}

export interface GeneratedOutput {
  output_id: string; // UUID
  population_job_id: string;
  output_format: OutputFormat;
  storage_uri: string;
  sha256: string;
  page_count?: number | null;
  byte_size?: number | null;
  source_template_hash: string;
  created_at: string;
  is_final: boolean;
  metadata: Record<string, any>;
}

// ============================================================
// 10. VALIDATION / QA / VISUAL REGRESSION
// ============================================================

export interface ValidationRun {
  validation_run_id: string; // UUID
  agent_run_id?: string | null;
  document_id?: string | null;
  template_version_id?: string | null;
  population_job_id?: string | null;
  result: ValidationResult;
  validator_type: string;
  validator_model?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  summary?: string | null;
  metrics: Record<string, any>;
  created_at: string;
}

export interface ValidationCheck {
  check_id: string; // UUID
  validation_run_id: string;
  check_name: string;
  check_category: string;
  result: ValidationResult;
  expected_value?: any;
  actual_value?: any;
  difference?: any;
  severity: RiskLevel;
  message?: string | null;
  created_at: string;
}

export interface VisualRegressionResult {
  visual_result_id: string; // UUID
  validation_run_id: string;
  source_version_id: string;
  output_id?: string | null;
  page_number: number;
  source_image_uri?: string | null;
  output_image_uri?: string | null;
  pixel_difference_ratio?: number | null;
  structural_difference_ratio?: number | null;
  geometry_difference_count?: number | null;
  result: ValidationResult;
  diff_image_uri?: string | null;
  details: Record<string, any>;
}

export interface CertificationRecord {
  certification_id: string; // UUID
  template_version_id: string;
  validation_run_id?: string | null;
  certified_by?: string | null;
  certified_at: string;
  source_hash: string;
  certification_hash: string;
  notes?: string | null;
  metadata: Record<string, any>;
}

// ============================================================
// 11. HUMAN REVIEW
// ============================================================

export interface ReviewTask {
  review_task_id: string; // UUID
  tenant_id?: string | null;
  document_id?: string | null;
  template_version_id?: string | null;
  value_id?: string | null;
  mapping_id?: string | null;
  assigned_to?: string | null;
  status: ReviewStatus;
  priority: RiskLevel;
  reason: string;
  created_at: string;
  resolved_at?: string | null;
  resolution_notes?: string | null;
}

export interface ReviewDecision {
  decision_id: string; // UUID
  review_task_id: string;
  reviewer_id?: string | null;
  old_value?: any;
  new_value?: any;
  decision: string;
  evidence: Record<string, any>;
  created_at: string;
}

// ============================================================
// 12. FORM VERSION INTELLIGENCE
// ============================================================

export interface FormFamily {
  form_family_id: string; // UUID
  family_name: string;
  jurisdiction?: string | null;
  description?: string | null;
  metadata: Record<string, any>;
}

export interface FormVersion {
  form_version_id: string; // UUID
  form_family_id?: string | null;
  document_version_id: string;
  form_number?: string | null;
  revision_label?: string | null;
  effective_date?: string | null;
  version_change?: VersionChangeType | null;
  supersedes_form_version_id?: string | null;
  metadata: Record<string, any>;
}

// ============================================================
// 13. INTEGRATIONS
// ============================================================

export interface Integration {
  integration_id: string; // UUID
  tenant_id?: string | null;
  provider: string;
  display_name: string;
  status: string;
  credential_reference?: string | null;
  configuration: Record<string, any>;
  created_at: string;
}

export interface IntegrationEvent {
  integration_event_id: string; // UUID
  integration_id?: string | null;
  event_type: string;
  direction: string;
  external_id?: string | null;
  status: string;
  payload: Record<string, any>;
  created_at: string;
}

// ============================================================
// 14. AUDIT / SECURITY / RETENTION
// ============================================================

export interface AuditEvent {
  audit_event_id: string; // UUID
  tenant_id?: string | null;
  user_id?: string | null;
  agent_run_id?: string | null;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  before_json?: Record<string, any> | null;
  after_json?: Record<string, any> | null;
  event_hash?: string | null;
  previous_event_hash?: string | null;
  created_at: string;
  metadata: Record<string, any>;
}

export interface SecurityEvent {
  security_event_id: string; // UUID
  tenant_id?: string | null;
  user_id?: string | null;
  event_type: string;
  severity: RiskLevel;
  ip_hash?: string | null;
  details: Record<string, any>;
  created_at: string;
}

export interface RetentionPolicy {
  policy_id: string; // UUID
  tenant_id?: string | null;
  entity_type: string;
  retention_days: number;
  archive_after_days?: number | null;
  delete_after_days?: number | null;
  active: boolean;
}

// ============================================================
// 15. TEMPLATE REGRESSION TESTS
// ============================================================

export interface RegressionSuite {
  suite_id: string; // UUID
  template_id: string;
  name: string;
  active: boolean;
  metadata: Record<string, any>;
}

export interface RegressionCase {
  case_id: string; // UUID
  suite_id: string;
  name: string;
  input_json: Record<string, any>;
  expected_json: Record<string, any>;
  active: boolean;
}

export interface RegressionRun {
  regression_run_id: string; // UUID
  suite_id: string;
  status: ValidationResult;
  started_at?: string | null;
  completed_at?: string | null;
  summary: Record<string, any>;
}

export interface RegressionCaseResult {
  result_id: string; // UUID
  regression_run_id: string;
  case_id: string;
  result: ValidationResult;
  expected_json?: any;
  actual_json?: any;
  diff_json?: any;
  message?: string | null;
}

// ============================================================
// CANONICAL SEED CONSTANTS
// ============================================================

export const CANONICAL_FIELD_DEFINITIONS: Array<{
  canonical_name: string;
  display_name: string;
  namespace: string;
  data_type: FieldDataType;
  risk_level: RiskLevel;
  required_default: boolean;
  synonyms: string[];
}> = [
  { canonical_name: 'person.full_name', display_name: 'Full Name', namespace: 'person', data_type: 'person_name', risk_level: 'high', required_default: true, synonyms: ['name', 'full legal name'] },
  { canonical_name: 'person.first_name', display_name: 'First Name', namespace: 'person', data_type: 'text', risk_level: 'high', required_default: true, synonyms: ['first', 'given name'] },
  { canonical_name: 'person.middle_name', display_name: 'Middle Name', namespace: 'person', data_type: 'text', risk_level: 'high', required_default: false, synonyms: ['middle'] },
  { canonical_name: 'person.last_name', display_name: 'Last Name', namespace: 'person', data_type: 'text', risk_level: 'high', required_default: true, synonyms: ['surname', 'family name', 'last'] },
  { canonical_name: 'person.suffix', display_name: 'Suffix', namespace: 'person', data_type: 'text', risk_level: 'medium', required_default: false, synonyms: ['Jr', 'Sr', 'II', 'III', 'IV'] },
  { canonical_name: 'person.date_of_birth', display_name: 'Date of Birth', namespace: 'person', data_type: 'date', risk_level: 'critical', required_default: false, synonyms: ['DOB', 'birth date'] },
  { canonical_name: 'person.phone', display_name: 'Phone', namespace: 'person', data_type: 'phone', risk_level: 'medium', required_default: false, synonyms: ['telephone', 'mobile'] },
  { canonical_name: 'person.email', display_name: 'Email', namespace: 'person', data_type: 'email', risk_level: 'medium', required_default: false, synonyms: ['email address'] },
  { canonical_name: 'person.ssn', display_name: 'Social Security Number', namespace: 'person', data_type: 'ssn', risk_level: 'critical', required_default: false, synonyms: ['SSN'] },
  { canonical_name: 'person.address.line1', display_name: 'Address Line 1', namespace: 'person.address', data_type: 'text', risk_level: 'high', required_default: false, synonyms: ['street', 'address'] },
  { canonical_name: 'person.address.line2', display_name: 'Address Line 2', namespace: 'person.address', data_type: 'text', risk_level: 'medium', required_default: false, synonyms: ['apt', 'unit', 'suite'] },
  { canonical_name: 'person.address.city', display_name: 'City', namespace: 'person.address', data_type: 'text', risk_level: 'medium', required_default: false, synonyms: ['city'] },
  { canonical_name: 'person.address.state', display_name: 'State', namespace: 'person.address', data_type: 'text', risk_level: 'high', required_default: false, synonyms: ['state'] },
  { canonical_name: 'person.address.postal_code', display_name: 'ZIP Code', namespace: 'person.address', data_type: 'text', risk_level: 'medium', required_default: false, synonyms: ['zip', 'postal code'] },
  { canonical_name: 'person.address.country', display_name: 'Country', namespace: 'person.address', data_type: 'text', risk_level: 'low', required_default: false, synonyms: ['country'] },

  { canonical_name: 'party.role', display_name: 'Party Role', namespace: 'party', data_type: 'text', risk_level: 'high', required_default: false, synonyms: ['role', 'party type'] },
  { canonical_name: 'party.organization_name', display_name: 'Organization Name', namespace: 'party', data_type: 'text', risk_level: 'high', required_default: false, synonyms: ['company', 'business'] },

  { canonical_name: 'matter.case_number', display_name: 'Case Number', namespace: 'matter', data_type: 'identifier', risk_level: 'critical', required_default: false, synonyms: ['case no', 'case #', 'docket number'] },
  { canonical_name: 'matter.matter_number', display_name: 'Matter Number', namespace: 'matter', data_type: 'identifier', risk_level: 'high', required_default: false, synonyms: ['matter no'] },
  { canonical_name: 'matter.case_type', display_name: 'Case Type', namespace: 'matter', data_type: 'text', risk_level: 'high', required_default: false, synonyms: ['type of case'] },
  { canonical_name: 'matter.filing_date', display_name: 'Filing Date', namespace: 'matter', data_type: 'date', risk_level: 'critical', required_default: false, synonyms: ['filed', 'date filed'] },
  { canonical_name: 'matter.jurisdiction', display_name: 'Jurisdiction', namespace: 'matter', data_type: 'text', risk_level: 'high', required_default: false, synonyms: ['jurisdiction'] },

  { canonical_name: 'court.name', display_name: 'Court Name', namespace: 'court', data_type: 'text', risk_level: 'high', required_default: false, synonyms: ['court'] },
  { canonical_name: 'court.county', display_name: 'Court County', namespace: 'court', data_type: 'text', risk_level: 'high', required_default: false, synonyms: ['county'] },
  { canonical_name: 'court.state', display_name: 'Court State', namespace: 'court', data_type: 'text', risk_level: 'high', required_default: false, synonyms: ['state'] },
  { canonical_name: 'court.department', display_name: 'Department', namespace: 'court', data_type: 'text', risk_level: 'medium', required_default: false, synonyms: ['dept', 'department no'] },
  { canonical_name: 'court.judge', display_name: 'Judge', namespace: 'court', data_type: 'person_name', risk_level: 'high', required_default: false, synonyms: ['judicial officer'] },

  { canonical_name: 'attorney.full_name', display_name: 'Attorney Name', namespace: 'attorney', data_type: 'person_name', risk_level: 'high', required_default: false, synonyms: ['attorney', 'counsel'] },
  { canonical_name: 'attorney.bar_number', display_name: 'Bar Number', namespace: 'attorney', data_type: 'identifier', risk_level: 'critical', required_default: false, synonyms: ['bar no', 'bar number'] },
  { canonical_name: 'attorney.phone', display_name: 'Attorney Phone', namespace: 'attorney', data_type: 'phone', risk_level: 'medium', required_default: false, synonyms: ['office phone'] },
  { canonical_name: 'attorney.email', display_name: 'Attorney Email', namespace: 'attorney', data_type: 'email', risk_level: 'medium', required_default: false, synonyms: ['office email'] },
  { canonical_name: 'attorney.address.line1', display_name: 'Attorney Address', namespace: 'attorney.address', data_type: 'text', risk_level: 'medium', required_default: false, synonyms: ['law office address'] },
  { canonical_name: 'attorney.address.city', display_name: 'Attorney City', namespace: 'attorney.address', data_type: 'text', risk_level: 'medium', required_default: false, synonyms: [] },
  { canonical_name: 'attorney.address.state', display_name: 'Attorney State', namespace: 'attorney.address', data_type: 'text', risk_level: 'medium', required_default: false, synonyms: [] },
  { canonical_name: 'attorney.address.postal_code', display_name: 'Attorney ZIP', namespace: 'attorney.address', data_type: 'text', risk_level: 'medium', required_default: false, synonyms: [] },

  { canonical_name: 'legal.date', display_name: 'Legal Date', namespace: 'legal', data_type: 'date', risk_level: 'critical', required_default: false, synonyms: ['date'] },
  { canonical_name: 'legal.deadline', display_name: 'Legal Deadline', namespace: 'legal', data_type: 'date', risk_level: 'critical', required_default: false, synonyms: ['deadline', 'due date'] },
  { canonical_name: 'legal.amount', display_name: 'Legal Amount', namespace: 'legal', data_type: 'currency', risk_level: 'critical', required_default: false, synonyms: ['amount', 'sum', 'total'] },
  { canonical_name: 'legal.signature', display_name: 'Signature', namespace: 'legal', data_type: 'signature', risk_level: 'critical', required_default: false, synonyms: ['signature'] },
  { canonical_name: 'legal.signature_date', display_name: 'Signature Date', namespace: 'legal', data_type: 'date', risk_level: 'critical', required_default: false, synonyms: ['date signed'] }
];

export const CANONICAL_DEFAULT_AGENTS: Array<{
  agent_name: string;
  role_description: string;
  permission_policy: {
    read: string[];
    write: string[];
    forbidden: string[];
  };
}> = [
  {
    agent_name: 'ingestion',
    role_description: 'Securely ingest source documents and create immutable document identities.',
    permission_policy: {
      read: [],
      write: ['documents', 'document_versions', 'audit_events'],
      forbidden: ['modify_golden_master_content']
    }
  },
  {
    agent_name: 'document_analysis',
    role_description: 'Analyze PDF/image structure, pages, elements, native fields and geometry.',
    permission_policy: {
      read: ['documents', 'document_versions', 'document_pages'],
      write: ['document_pages', 'document_elements'],
      forbidden: ['modify_source']
    }
  },
  {
    agent_name: 'extraction',
    role_description: 'Extract canonical data with provenance and confidence; never guess.',
    permission_policy: {
      read: ['documents', 'document_elements', 'field_definitions'],
      write: ['extracted_values', 'extraction_candidates', 'evidence', 'review_tasks'],
      forbidden: ['modify_source']
    }
  },
  {
    agent_name: 'database',
    role_description: 'Normalize and persist canonical document intelligence.',
    permission_policy: {
      read: ['*'],
      write: ['field_definitions', 'clients', 'matters', 'parties', 'extracted_values'],
      forbidden: ['modify_golden_master']
    }
  },
  {
    agent_name: 'template_builder',
    role_description: 'Create coordinate/native field mappings against the immutable source.',
    permission_policy: {
      read: ['documents', 'document_versions', 'document_elements', 'field_definitions'],
      write: ['templates', 'template_versions', 'field_mappings'],
      forbidden: ['modify_golden_master']
    }
  },
  {
    agent_name: 'population',
    role_description: 'Populate only certified templates using approved values.',
    permission_policy: {
      read: ['templates', 'template_versions', 'field_mappings', 'extracted_values'],
      write: ['population_jobs', 'population_values', 'generated_outputs'],
      forbidden: ['modify_template_structure', 'modify_golden_master']
    }
  },
  {
    agent_name: 'integration',
    role_description: 'Exchange approved data with connected systems.',
    permission_policy: {
      read: ['clients', 'matters', 'documents', 'templates'],
      write: ['integration_events'],
      forbidden: ['modify_golden_master']
    }
  },
  {
    agent_name: 'qa_sentinel',
    role_description: 'Independently validate hashes, geometry, visual identity, field placement and outputs.',
    permission_policy: {
      read: ['*'],
      write: ['validation_runs', 'validation_checks', 'visual_regression_results', 'certification_records'],
      forbidden: ['silently_repair', 'modify_source', 'modify_template']
    }
  }
];
