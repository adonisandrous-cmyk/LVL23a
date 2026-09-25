-- ============================================================
-- LEVEL 23 / PHOENIX 23
-- DOCUMENT INTELLIGENCE + LEGAL FORM AUTOMATION DATABASE
-- PostgreSQL 15+
--
-- This is the complete v1 foundation, not a demo schema.
-- Design rule:
--   GOLDEN MASTER = immutable source
--   INTELLIGENCE TWIN = extracted/mapped/searchable knowledge
--   TEMPLATE = reusable field map/overlay
--   POPULATION = deterministic output operation
--   QA = independent verification
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS lvl23;
SET search_path TO lvl23, public;

-- ============================================================
-- 1. ENUMS
-- ============================================================

CREATE TYPE document_status AS ENUM (
  'uploaded','ingesting','analyzing','extracting','mapping',
  'validating','certified','production','failed','archived'
);

CREATE TYPE template_status AS ENUM (
  'draft','processing','review','certified','production','retired'
);

CREATE TYPE review_status AS ENUM (
  'not_required','pending','approved','rejected','corrected','escalated'
);

CREATE TYPE confidence_band AS ENUM (
  'very_low','low','medium','high','very_high'
);

CREATE TYPE risk_level AS ENUM ('low','medium','high','critical');

CREATE TYPE agent_status AS ENUM (
  'queued','running','succeeded','failed','blocked','cancelled'
);

CREATE TYPE extraction_method AS ENUM (
  'native_pdf','ocr','vision','manual','imported','derived'
);

CREATE TYPE field_data_type AS ENUM (
  'text','long_text','person_name','date','datetime','time',
  'number','currency','boolean','checkbox','radio','select',
  'address','phone','email','ssn','identifier','signature',
  'image','unknown'
);

CREATE TYPE element_type AS ENUM (
  'text','label','paragraph','table','table_cell','line',
  'checkbox','radio','signature','image','graphic','header',
  'footer','page_number','instruction','unknown'
);

CREATE TYPE source_type AS ENUM (
  'upload','client_record','matter_record','other_document',
  'manual_entry','integration','derived'
);

CREATE TYPE validation_result AS ENUM (
  'pass','fail','warning','not_run'
);

CREATE TYPE population_status AS ENUM (
  'queued','running','completed','failed','review_required'
);

CREATE TYPE output_format AS ENUM (
  'pdf','fillable_pdf','xfdf','fdf','json','xml','image'
);

CREATE TYPE version_change_type AS ENUM (
  'identical','minor','major','new_document'
);

CREATE TYPE evidence_type AS ENUM (
  'source_text','source_coordinate','source_image',
  'database_record','manual_entry','agent_reasoning'
);

-- ============================================================
-- 2. TENANTS / USERS / SECURITY BOUNDARY
-- ============================================================

CREATE TABLE tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_name TEXT NOT NULL,
  slug CITEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE app_users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  email CITEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================
-- 3. CLIENTS / MATTERS / PARTIES
-- ============================================================

CREATE TABLE clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  external_key TEXT,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, external_key)
);

CREATE TABLE matters (
  matter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  client_id UUID REFERENCES clients(client_id),
  matter_number TEXT,
  matter_name TEXT NOT NULL,
  case_type TEXT,
  jurisdiction TEXT,
  court_name TEXT,
  court_county TEXT,
  court_state TEXT,
  case_number TEXT,
  filing_date DATE,
  status TEXT NOT NULL DEFAULT 'open',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, matter_number)
);

CREATE TABLE parties (
  party_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  matter_id UUID REFERENCES matters(matter_id),
  party_role TEXT,
  party_type TEXT,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  suffix TEXT,
  organization_name TEXT,
  date_of_birth DATE,
  phone TEXT,
  email CITEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE party_addresses (
  address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(party_id) ON DELETE CASCADE,
  address_type TEXT NOT NULL DEFAULT 'mailing',
  line1 TEXT,
  line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE matter_documents (
  matter_id UUID NOT NULL REFERENCES matters(matter_id) ON DELETE CASCADE,
  document_id UUID NOT NULL,
  PRIMARY KEY(matter_id, document_id)
);

-- ============================================================
-- 4. IMMUTABLE DOCUMENT / GOLDEN MASTER
-- ============================================================

CREATE TABLE documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  client_id UUID REFERENCES clients(client_id),
  matter_id UUID REFERENCES matters(matter_id),
  filename TEXT NOT NULL,
  document_type TEXT,
  form_number TEXT,
  form_family TEXT,
  mime_type TEXT NOT NULL,
  source source_type NOT NULL DEFAULT 'upload',
  status document_status NOT NULL DEFAULT 'uploaded',
  original_sha256 CHAR(64) NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK(file_size_bytes >= 0),
  page_count INTEGER CHECK(page_count >= 0),
  storage_uri TEXT NOT NULL,
  uploaded_by UUID REFERENCES app_users(user_id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE document_versions (
  version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(document_id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL CHECK(version_number > 0),
  sha256 CHAR(64) NOT NULL,
  storage_uri TEXT NOT NULL,
  page_count INTEGER CHECK(page_count >= 0),
  page_width_points NUMERIC(12,4),
  page_height_points NUMERIC(12,4),
  orientation TEXT,
  is_golden_master BOOLEAN NOT NULL DEFAULT FALSE,
  change_type version_change_type,
  parent_version_id UUID REFERENCES document_versions(version_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES app_users(user_id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(document_id, version_number),
  UNIQUE(document_id, sha256)
);

CREATE UNIQUE INDEX one_golden_master_per_document
ON document_versions(document_id)
WHERE is_golden_master;

CREATE TABLE document_pages (
  page_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES document_versions(version_id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL CHECK(page_number > 0),
  width_points NUMERIC(12,4) NOT NULL,
  height_points NUMERIC(12,4) NOT NULL,
  rotation_degrees INTEGER NOT NULL DEFAULT 0,
  rendered_image_uri TEXT,
  page_sha256 CHAR(64),
  text_sha256 CHAR(64),
  UNIQUE(version_id, page_number)
);

CREATE TABLE document_elements (
  element_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES document_pages(page_id) ON DELETE CASCADE,
  element_type element_type NOT NULL,
  x NUMERIC(12,4) NOT NULL,
  y NUMERIC(12,4) NOT NULL,
  width NUMERIC(12,4) NOT NULL,
  height NUMERIC(12,4) NOT NULL,
  rotation_degrees NUMERIC(8,3) NOT NULL DEFAULT 0,
  reading_order INTEGER,
  text_content TEXT,
  normalized_text TEXT,
  confidence NUMERIC(5,4) CHECK(confidence BETWEEN 0 AND 1),
  extraction_method extraction_method,
  native_field_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE document_assets (
  asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES document_versions(version_id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  storage_uri TEXT NOT NULL,
  sha256 CHAR(64),
  page_number INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================
-- 5. FIELD ONTOLOGY / DATA DICTIONARY
-- ============================================================

CREATE TABLE field_definitions (
  field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  namespace TEXT,
  data_type field_data_type NOT NULL DEFAULT 'text',
  required_default BOOLEAN NOT NULL DEFAULT FALSE,
  risk_level risk_level NOT NULL DEFAULT 'low',
  validation_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  synonyms JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE field_aliases (
  alias_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES field_definitions(field_id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  source TEXT,
  UNIQUE(field_id, alias)
);

CREATE TABLE field_dependencies (
  dependency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES field_definitions(field_id) ON DELETE CASCADE,
  depends_on_field_id UUID NOT NULL REFERENCES field_definitions(field_id) ON DELETE CASCADE,
  rule JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(field_id, depends_on_field_id)
);

-- ============================================================
-- 6. TEMPLATE SYSTEM
-- ============================================================

CREATE TABLE templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  document_id UUID NOT NULL REFERENCES documents(document_id),
  source_version_id UUID NOT NULL REFERENCES document_versions(version_id),
  template_name TEXT NOT NULL,
  form_number TEXT,
  form_family TEXT,
  status template_status NOT NULL DEFAULT 'draft',
  certification_status review_status NOT NULL DEFAULT 'not_required',
  current_version_number INTEGER NOT NULL DEFAULT 1,
  source_sha256 CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  certified_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE template_versions (
  template_version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(template_id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK(version_number > 0),
  source_version_id UUID NOT NULL REFERENCES document_versions(version_id),
  field_map_version INTEGER NOT NULL DEFAULT 1,
  rendered_preview_uri TEXT,
  template_storage_uri TEXT,
  status template_status NOT NULL DEFAULT 'draft',
  source_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  certified_at TIMESTAMPTZ,
  certified_by UUID REFERENCES app_users(user_id),
  UNIQUE(template_id, version_number)
);

CREATE TABLE field_mappings (
  mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_id UUID NOT NULL REFERENCES template_versions(template_version_id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES field_definitions(field_id),
  page_number INTEGER NOT NULL CHECK(page_number > 0),
  x NUMERIC(12,4) NOT NULL,
  y NUMERIC(12,4) NOT NULL,
  width NUMERIC(12,4) NOT NULL,
  height NUMERIC(12,4) NOT NULL,
  rotation_degrees NUMERIC(8,3) NOT NULL DEFAULT 0,
  field_type field_data_type NOT NULL,
  source_label TEXT,
  source_element_id UUID REFERENCES document_elements(element_id),
  native_pdf_field_name TEXT,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  confidence NUMERIC(5,4) CHECK(confidence BETWEEN 0 AND 1),
  confidence_band confidence_band,
  risk_level risk_level NOT NULL DEFAULT 'low',
  review_status review_status NOT NULL DEFAULT 'not_required',
  mapping_version INTEGER NOT NULL DEFAULT 1,
  validation_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX field_mappings_template_idx
ON field_mappings(template_version_id);

CREATE INDEX field_mappings_field_idx
ON field_mappings(field_id);

-- ============================================================
-- 7. EXTRACTION + PROVENANCE
-- ============================================================

CREATE TABLE extraction_batches (
  extraction_batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(document_id),
  source_version_id UUID REFERENCES document_versions(version_id),
  status agent_status NOT NULL DEFAULT 'queued',
  method extraction_method NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE extracted_values (
  value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES field_definitions(field_id),
  document_id UUID NOT NULL REFERENCES documents(document_id),
  source_version_id UUID REFERENCES document_versions(version_id),
  extraction_batch_id UUID REFERENCES extraction_batches(extraction_batch_id),
  value_text TEXT,
  value_json JSONB,
  source_page INTEGER,
  source_x NUMERIC(12,4),
  source_y NUMERIC(12,4),
  source_width NUMERIC(12,4),
  source_height NUMERIC(12,4),
  source_text TEXT,
  extraction_method extraction_method NOT NULL,
  agent_run_id UUID,
  confidence NUMERIC(5,4) CHECK(confidence BETWEEN 0 AND 1),
  confidence_band confidence_band,
  risk_level risk_level NOT NULL DEFAULT 'low',
  review_status review_status NOT NULL DEFAULT 'not_required',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE extraction_candidates (
  candidate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES field_definitions(field_id),
  document_id UUID NOT NULL REFERENCES documents(document_id),
  candidate_value TEXT,
  candidate_json JSONB,
  source_page INTEGER,
  source_text TEXT,
  confidence NUMERIC(5,4),
  model_name TEXT,
  agent_run_id UUID,
  selected BOOLEAN NOT NULL DEFAULT FALSE,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE evidence (
  evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(document_id),
  value_id UUID REFERENCES extracted_values(value_id),
  mapping_id UUID REFERENCES field_mappings(mapping_id),
  evidence_type evidence_type NOT NULL,
  page_number INTEGER,
  x NUMERIC(12,4),
  y NUMERIC(12,4),
  width NUMERIC(12,4),
  height NUMERIC(12,4),
  quoted_text TEXT,
  storage_uri TEXT,
  hash CHAR(64),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================
-- 8. AGENTS / MODELS / RUNS
-- ============================================================

CREATE TABLE ai_models (
  model_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_version TEXT,
  capability_class TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(provider, model_name, model_version)
);

CREATE TABLE agents (
  agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL UNIQUE,
  role_description TEXT NOT NULL,
  permission_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE agent_runs (
  agent_run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(agent_id),
  model_id UUID REFERENCES ai_models(model_id),
  tenant_id UUID REFERENCES tenants(tenant_id),
  document_id UUID REFERENCES documents(document_id),
  template_id UUID REFERENCES templates(template_id),
  parent_run_id UUID REFERENCES agent_runs(agent_run_id),
  status agent_status NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  input_hash CHAR(64),
  output_hash CHAR(64),
  prompt_version TEXT,
  error_code TEXT,
  error_message TEXT,
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE agent_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id UUID NOT NULL REFERENCES agent_runs(agent_run_id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. POPULATION / OUTPUTS
-- ============================================================

CREATE TABLE population_jobs (
  population_job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  matter_id UUID REFERENCES matters(matter_id),
  template_version_id UUID NOT NULL REFERENCES template_versions(template_version_id),
  status population_status NOT NULL DEFAULT 'queued',
  requested_by UUID REFERENCES app_users(user_id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE population_values (
  population_value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  population_job_id UUID NOT NULL REFERENCES population_jobs(population_job_id) ON DELETE CASCADE,
  mapping_id UUID NOT NULL REFERENCES field_mappings(mapping_id),
  field_id UUID NOT NULL REFERENCES field_definitions(field_id),
  value_text TEXT,
  value_json JSONB,
  source_value_id UUID REFERENCES extracted_values(value_id),
  status review_status NOT NULL DEFAULT 'not_required',
  validation_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE generated_outputs (
  output_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  population_job_id UUID NOT NULL REFERENCES population_jobs(population_job_id),
  output_format output_format NOT NULL,
  storage_uri TEXT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  page_count INTEGER,
  byte_size BIGINT,
  source_template_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_final BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================
-- 10. VALIDATION / QA / VISUAL REGRESSION
-- ============================================================

CREATE TABLE validation_runs (
  validation_run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id UUID REFERENCES agent_runs(agent_run_id),
  document_id UUID REFERENCES documents(document_id),
  template_version_id UUID REFERENCES template_versions(template_version_id),
  population_job_id UUID REFERENCES population_jobs(population_job_id),
  result validation_result NOT NULL DEFAULT 'not_run',
  validator_type TEXT NOT NULL,
  validator_model TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  summary TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE validation_checks (
  check_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_run_id UUID NOT NULL REFERENCES validation_runs(validation_run_id) ON DELETE CASCADE,
  check_name TEXT NOT NULL,
  check_category TEXT NOT NULL,
  result validation_result NOT NULL,
  expected_value JSONB,
  actual_value JSONB,
  difference JSONB,
  severity risk_level NOT NULL DEFAULT 'low',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE visual_regression_results (
  visual_result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_run_id UUID NOT NULL REFERENCES validation_runs(validation_run_id) ON DELETE CASCADE,
  source_version_id UUID NOT NULL REFERENCES document_versions(version_id),
  output_id UUID REFERENCES generated_outputs(output_id),
  page_number INTEGER NOT NULL,
  source_image_uri TEXT,
  output_image_uri TEXT,
  pixel_difference_ratio NUMERIC(12,8),
  structural_difference_ratio NUMERIC(12,8),
  geometry_difference_count INTEGER,
  result validation_result NOT NULL,
  diff_image_uri TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE certification_records (
  certification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_id UUID NOT NULL REFERENCES template_versions(template_version_id),
  validation_run_id UUID REFERENCES validation_runs(validation_run_id),
  certified_by UUID REFERENCES app_users(user_id),
  certified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_hash CHAR(64) NOT NULL,
  certification_hash CHAR(64) NOT NULL,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================
-- 11. HUMAN REVIEW
-- ============================================================

CREATE TABLE review_tasks (
  review_task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  document_id UUID REFERENCES documents(document_id),
  template_version_id UUID REFERENCES template_versions(template_version_id),
  value_id UUID REFERENCES extracted_values(value_id),
  mapping_id UUID REFERENCES field_mappings(mapping_id),
  assigned_to UUID REFERENCES app_users(user_id),
  status review_status NOT NULL DEFAULT 'pending',
  priority risk_level NOT NULL DEFAULT 'medium',
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

CREATE TABLE review_decisions (
  decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_task_id UUID NOT NULL REFERENCES review_tasks(review_task_id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES app_users(user_id),
  old_value JSONB,
  new_value JSONB,
  decision TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. FORM VERSION INTELLIGENCE
-- ============================================================

CREATE TABLE form_families (
  form_family_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name TEXT NOT NULL UNIQUE,
  jurisdiction TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE form_versions (
  form_version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_family_id UUID REFERENCES form_families(form_family_id),
  document_version_id UUID NOT NULL REFERENCES document_versions(version_id),
  form_number TEXT,
  revision_label TEXT,
  effective_date DATE,
  version_change version_change_type,
  supersedes_form_version_id UUID REFERENCES form_versions(form_version_id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================
-- 13. INTEGRATIONS
-- ============================================================

CREATE TABLE integrations (
  integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  credential_reference TEXT,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE integration_events (
  integration_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(integration_id),
  event_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  external_id TEXT,
  status TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. AUDIT / IMMUTABILITY / SECURITY
-- ============================================================

CREATE TABLE audit_events (
  audit_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  user_id UUID REFERENCES app_users(user_id),
  agent_run_id UUID REFERENCES agent_runs(agent_run_id),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  before_json JSONB,
  after_json JSONB,
  event_hash CHAR(64),
  previous_event_hash CHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE security_events (
  security_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  user_id UUID REFERENCES app_users(user_id),
  event_type TEXT NOT NULL,
  severity risk_level NOT NULL DEFAULT 'low',
  ip_hash CHAR(64),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE retention_policies (
  policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(tenant_id),
  entity_type TEXT NOT NULL,
  retention_days INTEGER NOT NULL CHECK(retention_days > 0),
  archive_after_days INTEGER,
  delete_after_days INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- 15. TEMPLATE REGRESSION TESTS
-- ============================================================

CREATE TABLE regression_suites (
  suite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(template_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE regression_cases (
  case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_id UUID NOT NULL REFERENCES regression_suites(suite_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  expected_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE regression_runs (
  regression_run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_id UUID NOT NULL REFERENCES regression_suites(suite_id),
  status validation_result NOT NULL DEFAULT 'not_run',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE regression_case_results (
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regression_run_id UUID NOT NULL REFERENCES regression_runs(regression_run_id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES regression_cases(case_id),
  result validation_result NOT NULL,
  expected_json JSONB,
  actual_json JSONB,
  diff_json JSONB,
  message TEXT
);

-- ============================================================
-- 16. SEARCH / PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX documents_tenant_idx ON documents(tenant_id);
CREATE INDEX documents_matter_idx ON documents(matter_id);
CREATE INDEX documents_sha_idx ON documents(original_sha256);
CREATE INDEX documents_form_idx ON documents(form_number, form_family);

CREATE INDEX document_versions_document_idx ON document_versions(document_id);
CREATE INDEX document_pages_version_idx ON document_pages(version_id);
CREATE INDEX document_elements_page_idx ON document_elements(page_id);
CREATE INDEX document_elements_text_idx ON document_elements USING gin(to_tsvector('english', coalesce(normalized_text,'')));

CREATE INDEX clients_tenant_idx ON clients(tenant_id);
CREATE INDEX matters_client_idx ON matters(client_id);
CREATE INDEX matters_case_idx ON matters(case_number);
CREATE INDEX parties_matter_idx ON parties(matter_id);

CREATE INDEX extracted_values_document_idx ON extracted_values(document_id);
CREATE INDEX extracted_values_field_idx ON extracted_values(field_id);
CREATE INDEX extracted_values_review_idx ON extracted_values(review_status);
CREATE INDEX extracted_values_json_idx ON extracted_values USING gin(value_json);

CREATE INDEX agent_runs_document_idx ON agent_runs(document_id);
CREATE INDEX agent_runs_status_idx ON agent_runs(status);
CREATE INDEX agent_messages_run_idx ON agent_messages(agent_run_id);

CREATE INDEX population_jobs_matter_idx ON population_jobs(matter_id);
CREATE INDEX generated_outputs_job_idx ON generated_outputs(population_job_id);

CREATE INDEX validation_runs_template_idx ON validation_runs(template_version_id);
CREATE INDEX validation_checks_run_idx ON validation_checks(validation_run_id);
CREATE INDEX visual_regression_page_idx ON visual_regression_results(validation_run_id,page_number);

CREATE INDEX audit_events_entity_idx ON audit_events(entity_type,entity_id);
CREATE INDEX audit_events_created_idx ON audit_events(created_at);

-- ============================================================
-- 17. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER matters_updated_at
BEFORE UPDATE ON matters
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER field_definitions_updated_at
BEFORE UPDATE ON field_definitions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 18. GOLDEN MASTER PROTECTION
-- Application must never UPDATE/DELETE the immutable source.
-- This trigger rejects mutation of a Golden Master version.
-- ============================================================

CREATE OR REPLACE FUNCTION protect_golden_master()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.is_golden_master THEN
    RAISE EXCEPTION 'Golden Master versions are immutable';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.is_golden_master THEN
    IF NEW.sha256 <> OLD.sha256
       OR NEW.storage_uri <> OLD.storage_uri
       OR NEW.page_count IS DISTINCT FROM OLD.page_count
       OR NEW.page_width_points IS DISTINCT FROM OLD.page_width_points
       OR NEW.page_height_points IS DISTINCT FROM OLD.page_height_points
       OR NEW.orientation IS DISTINCT FROM OLD.orientation THEN
      RAISE EXCEPTION 'Golden Master content/identity cannot be modified';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER golden_master_guard
BEFORE UPDATE OR DELETE ON document_versions
FOR EACH ROW EXECUTE FUNCTION protect_golden_master();

-- ============================================================
-- 19. NO-GUESS DATA QUALITY RULE
-- ============================================================

CREATE OR REPLACE FUNCTION validate_extracted_value()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.review_status IN ('approved','corrected')
     AND NEW.value_text IS NULL
     AND NEW.value_json IS NULL THEN
    RAISE EXCEPTION 'Approved/corrected extracted value cannot be empty';
  END IF;

  IF NEW.confidence IS NOT NULL AND NEW.confidence < 0 THEN
    RAISE EXCEPTION 'Confidence cannot be negative';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER extracted_value_quality_guard
BEFORE INSERT OR UPDATE ON extracted_values
FOR EACH ROW EXECUTE FUNCTION validate_extracted_value();

-- ============================================================
-- 20. CERTIFICATION GUARD
-- ============================================================

CREATE OR REPLACE FUNCTION certify_template_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('certified','production') THEN
    IF NEW.certified_at IS NULL OR NEW.certified_by IS NULL THEN
      RAISE EXCEPTION 'Certified/production template requires certification identity and timestamp';
    END IF;
    IF NEW.source_hash IS NULL THEN
      RAISE EXCEPTION 'Certified/production template requires source hash';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_certification_guard
BEFORE INSERT OR UPDATE ON template_versions
FOR EACH ROW EXECUTE FUNCTION certify_template_guard();

-- ============================================================
-- 21. CANONICAL LEGAL FIELD ONTOLOGY
-- ============================================================

INSERT INTO field_definitions
(canonical_name,display_name,namespace,data_type,risk_level,required_default,synonyms)
VALUES
('person.full_name','Full Name','person','person_name','high',TRUE,'["name","full legal name"]'),
('person.first_name','First Name','person','text','high',TRUE,'["first","given name"]'),
('person.middle_name','Middle Name','person','text','high',FALSE,'["middle"]'),
('person.last_name','Last Name','person','text','high',TRUE,'["surname","family name","last"]'),
('person.suffix','Suffix','person','text','medium',FALSE,'["Jr","Sr","II","III","IV"]'),
('person.date_of_birth','Date of Birth','person','date','critical',FALSE,'["DOB","birth date"]'),
('person.phone','Phone','person','phone','medium',FALSE,'["telephone","mobile"]'),
('person.email','Email','person','email','medium',FALSE,'["email address"]'),
('person.ssn','Social Security Number','person','ssn','critical',FALSE,'["SSN"]'),
('person.address.line1','Address Line 1','person.address','text','high',FALSE,'["street","address"]'),
('person.address.line2','Address Line 2','person.address','text','medium',FALSE,'["apt","unit","suite"]'),
('person.address.city','City','person.address','text','medium',FALSE,'["city"]'),
('person.address.state','State','person.address','text','high',FALSE,'["state"]'),
('person.address.postal_code','ZIP Code','person.address','text','medium',FALSE,'["zip","postal code"]'),
('person.address.country','Country','person.address','text','low',FALSE,'["country"]'),

('party.role','Party Role','party','text','high',FALSE,'["role","party type"]'),
('party.organization_name','Organization Name','party','text','high',FALSE,'["company","business"]'),

('matter.case_number','Case Number','matter','identifier','critical',FALSE,'["case no","case #","docket number"]'),
('matter.matter_number','Matter Number','matter','identifier','high',FALSE,'["matter no"]'),
('matter.case_type','Case Type','matter','text','high',FALSE,'["type of case"]'),
('matter.filing_date','Filing Date','matter','date','critical',FALSE,'["filed","date filed"]'),
('matter.jurisdiction','Jurisdiction','matter','text','high',FALSE,'["jurisdiction"]'),

('court.name','Court Name','court','text','high',FALSE,'["court"]'),
('court.county','Court County','court','text','high',FALSE,'["county"]'),
('court.state','Court State','court','text','high',FALSE,'["state"]'),
('court.department','Department','court','text','medium',FALSE,'["dept","department no"]'),
('court.judge','Judge','court','person_name','high',FALSE,'["judicial officer"]'),

('attorney.full_name','Attorney Name','attorney','person_name','high',FALSE,'["attorney","counsel"]'),
('attorney.bar_number','Bar Number','attorney','identifier','critical',FALSE,'["bar no","bar number"]'),
('attorney.phone','Attorney Phone','attorney','phone','medium',FALSE,'["office phone"]'),
('attorney.email','Attorney Email','attorney','email','medium',FALSE,'["office email"]'),
('attorney.address.line1','Attorney Address','attorney.address','text','medium',FALSE,'["law office address"]'),
('attorney.address.city','Attorney City','attorney.address','text','medium',FALSE,'[]'),
('attorney.address.state','Attorney State','attorney.address','text','medium',FALSE,'[]'),
('attorney.address.postal_code','Attorney ZIP','attorney.address','text','medium',FALSE,'[]'),

('legal.date','Legal Date','legal','date','critical',FALSE,'["date"]'),
('legal.deadline','Legal Deadline','legal','date','critical',FALSE,'["deadline","due date"]'),
('legal.amount','Legal Amount','legal','currency','critical',FALSE,'["amount","sum","total"]'),
('legal.signature','Signature','legal','signature','critical',FALSE,'["signature"]'),
('legal.signature_date','Signature Date','legal','date','critical',FALSE,'["date signed"]')
ON CONFLICT (canonical_name) DO NOTHING;

-- ============================================================
-- 22. DEFAULT AGENTS
-- ============================================================

INSERT INTO agents(agent_name,role_description,permission_policy)
VALUES
('ingestion','Securely ingest source documents and create immutable document identities.',
 '{"read":[],"write":["documents","document_versions","audit_events"],"forbidden":["modify_golden_master_content"]}'),
('document_analysis','Analyze PDF/image structure, pages, elements, native fields and geometry.',
 '{"read":["documents","document_versions","document_pages"],"write":["document_pages","document_elements"],"forbidden":["modify_source"]}'),
('extraction','Extract canonical data with provenance and confidence; never guess.',
 '{"read":["documents","document_elements","field_definitions"],"write":["extracted_values","extraction_candidates","evidence","review_tasks"],"forbidden":["modify_source"]}'),
('database','Normalize and persist canonical document intelligence.',
 '{"read":["*"],"write":["field_definitions","clients","matters","parties","extracted_values"],"forbidden":["modify_golden_master"]}'),
('template_builder','Create coordinate/native field mappings against the immutable source.',
 '{"read":["documents","document_versions","document_elements","field_definitions"],"write":["templates","template_versions","field_mappings"],"forbidden":["modify_golden_master"]}'),
('population','Populate only certified templates using approved values.',
 '{"read":["templates","template_versions","field_mappings","extracted_values"],"write":["population_jobs","population_values","generated_outputs"],"forbidden":["modify_template_structure","modify_golden_master"]}'),
('integration','Exchange approved data with connected systems.',
 '{"read":["clients","matters","documents","templates"],"write":["integration_events"],"forbidden":["modify_golden_master"]}'),
('qa_sentinel','Independently validate hashes, geometry, visual identity, field placement and outputs.',
 '{"read":["*"],"write":["validation_runs","validation_checks","visual_regression_results","certification_records"],"forbidden":["silently_repair","modify_source","modify_template"]}')
ON CONFLICT (agent_name) DO NOTHING;

-- ============================================================
-- 23. CERTIFICATION VIEW
-- ============================================================

CREATE VIEW certified_templates AS
SELECT
  t.template_id,
  t.template_name,
  tv.template_version_id,
  tv.version_number,
  tv.source_hash,
  tv.template_storage_uri,
  tv.certified_at,
  tv.certified_by
FROM templates t
JOIN template_versions tv ON tv.template_id = t.template_id
WHERE tv.status IN ('certified','production')
  AND tv.certified_at IS NOT NULL
  AND tv.certified_by IS NOT NULL;

-- ============================================================
-- 24. DOCUMENT INTELLIGENCE VIEW
-- ============================================================

CREATE VIEW document_intelligence AS
SELECT
  d.document_id,
  d.filename,
  d.form_number,
  d.form_family,
  d.status,
  d.original_sha256,
  d.page_count,
  count(DISTINCT de.element_id) AS element_count,
  count(DISTINCT ev.value_id) AS extracted_value_count,
  count(DISTINCT fm.mapping_id) AS mapped_field_count,
  count(DISTINCT rr.validation_run_id) AS validation_run_count
FROM documents d
LEFT JOIN document_versions dv ON dv.document_id = d.document_id
LEFT JOIN document_pages dp ON dp.version_id = dv.version_id
LEFT JOIN document_elements de ON de.page_id = dp.page_id
LEFT JOIN extracted_values ev ON ev.document_id = d.document_id
LEFT JOIN templates t ON t.document_id = d.document_id
LEFT JOIN template_versions tv ON tv.template_id = t.template_id
LEFT JOIN field_mappings fm ON fm.template_version_id = tv.template_version_id
LEFT JOIN validation_runs rr ON rr.document_id = d.document_id
GROUP BY d.document_id;

-- ============================================================
-- 25. SAFE CERTIFICATION PROCEDURE
-- ============================================================

CREATE OR REPLACE FUNCTION certify_template(
  p_template_version_id UUID,
  p_user_id UUID,
  p_validation_run_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_certification_id UUID;
  v_source_hash CHAR(64);
  v_result validation_result;
BEGIN
  SELECT source_hash INTO v_source_hash
  FROM template_versions
  WHERE template_version_id = p_template_version_id;

  IF v_source_hash IS NULL THEN
    RAISE EXCEPTION 'Template source hash is missing';
  END IF;

  SELECT result INTO v_result
  FROM validation_runs
  WHERE validation_run_id = p_validation_run_id;

  IF v_result IS DISTINCT FROM 'pass' THEN
    RAISE EXCEPTION 'Template cannot be certified without a passing validation run';
  END IF;

  UPDATE template_versions
  SET status='certified',
      certified_at=now(),
      certified_by=p_user_id
  WHERE template_version_id=p_template_version_id;

  INSERT INTO certification_records(
    template_version_id,validation_run_id,certified_by,
    source_hash,certification_hash,notes
  )
  VALUES(
    p_template_version_id,p_validation_run_id,p_user_id,
    v_source_hash,
    encode(digest(
      p_template_version_id::text || ':' ||
      v_source_hash || ':' ||
      p_user_id::text || ':' ||
      now()::text,'sha256'),'hex'),
    p_notes
  )
  RETURNING certification_id INTO v_certification_id;

  RETURN v_certification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- END
-- ============================================================
