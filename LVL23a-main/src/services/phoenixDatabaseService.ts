/**
 * LEVEL 23 / PHOENIX 23
 * DATABASE ENGINE & REPOSITORY SERVICE
 * Full implementation of schema.sql specifications:
 * - 8 canonical agents with permission policies
 * - 40 canonical field ontology definitions
 * - Golden Master immutability guarantees
 * - No-guess extraction quality validation
 * - Template certification procedures and views
 * - Audit logging with SHA-256 chains
 */

import {
  DocumentStatus,
  TemplateStatus,
  ReviewStatus,
  ConfidenceBand,
  RiskLevel,
  AgentStatus,
  ExtractionMethod,
  FieldDataType,
  ElementType,
  SourceType,
  ValidationResult,
  PopulationStatus,
  OutputFormat,
  EvidenceType,
  Tenant,
  AppUser,
  ClientRecord,
  MatterRecord,
  PartyRecord,
  DocumentRow,
  DocumentVersion,
  DocumentPage,
  DocumentElement,
  FieldDefinition,
  TemplateRow,
  TemplateVersion,
  FieldMapping,
  ExtractionBatch,
  ExtractedValue,
  EvidenceRecord,
  Agent,
  AgentRun,
  AgentMessage,
  PopulationJob,
  PopulationValue,
  GeneratedOutput,
  ValidationRun,
  ValidationCheck,
  VisualRegressionResult,
  CertificationRecord,
  ReviewTask,
  FormFamily,
  FormVersion,
  AuditEvent,
  CANONICAL_FIELD_DEFINITIONS,
  CANONICAL_DEFAULT_AGENTS
} from '../db/schema';

// Helper to calculate SHA-256 in browser or node
export async function calculateSha256(data: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple deterministic pseudo-hash for non-crypto contexts
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return (hex + hex + hex + hex + hex + hex + hex + hex).substring(0, 64);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class PhoenixDatabaseEngine {
  public tenants: Tenant[] = [];
  public appUsers: AppUser[] = [];
  public clients: ClientRecord[] = [];
  public matters: MatterRecord[] = [];
  public parties: PartyRecord[] = [];
  public documents: DocumentRow[] = [];
  public documentVersions: DocumentVersion[] = [];
  public documentPages: DocumentPage[] = [];
  public documentElements: DocumentElement[] = [];
  public fieldDefinitions: FieldDefinition[] = [];
  public templates: TemplateRow[] = [];
  public templateVersions: TemplateVersion[] = [];
  public fieldMappings: FieldMapping[] = [];
  public extractionBatches: ExtractionBatch[] = [];
  public extractedValues: ExtractedValue[] = [];
  public evidence: EvidenceRecord[] = [];
  public agents: Agent[] = [];
  public agentRuns: AgentRun[] = [];
  public agentMessages: AgentMessage[] = [];
  public populationJobs: PopulationJob[] = [];
  public populationValues: PopulationValue[] = [];
  public generatedOutputs: GeneratedOutput[] = [];
  public validationRuns: ValidationRun[] = [];
  public validationChecks: ValidationCheck[] = [];
  public visualRegressionResults: VisualRegressionResult[] = [];
  public certificationRecords: CertificationRecord[] = [];
  public reviewTasks: ReviewTask[] = [];
  public formFamilies: FormFamily[] = [];
  public formVersions: FormVersion[] = [];
  public auditEvents: AuditEvent[] = [];

  private lastAuditEventHash = '0'.repeat(64);
  private initialized = false;

  constructor() {
    this.bootstrap();
  }

  /**
   * Initialize and seed defaults according to schema.sql
   */
  public bootstrap(): void {
    if (this.initialized) return;

    // Load persisted state if exists
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('phoenix23_db_store_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.assign(this, parsed);
          this.initialized = true;
          return;
        }
      } catch (err) {
        console.warn('Could not read existing Phoenix DB store:', err);
      }
    }

    // Default Tenant & User
    const defaultTenant: Tenant = {
      tenant_id: '11111111-1111-4111-8111-111111111111',
      tenant_name: 'Level 23 Legal Group',
      slug: 'lvl23-default',
      status: 'active',
      created_at: new Date().toISOString(),
      metadata: { environment: 'production', tier: 'enterprise' }
    };
    this.tenants.push(defaultTenant);

    const defaultUser: AppUser = {
      user_id: '22222222-2222-4222-8222-222222222222',
      tenant_id: defaultTenant.tenant_id,
      email: 'attorney@level23legal.com',
      display_name: 'Lead Counsel',
      role: 'admin',
      active: true,
      created_at: new Date().toISOString(),
      metadata: { barNumber: 'CA-309821' }
    };
    this.appUsers.push(defaultUser);

    // Section 21: Seed Canonical Legal Field Ontology
    CANONICAL_FIELD_DEFINITIONS.forEach(def => {
      this.fieldDefinitions.push({
        field_id: generateUUID(),
        canonical_name: def.canonical_name,
        display_name: def.display_name,
        namespace: def.namespace,
        data_type: def.data_type,
        required_default: def.required_default,
        risk_level: def.risk_level,
        validation_schema: {},
        synonyms: def.synonyms,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    // Section 22: Seed Default 8 Pipeline Agents
    CANONICAL_DEFAULT_AGENTS.forEach(ag => {
      this.agents.push({
        agent_id: generateUUID(),
        agent_name: ag.agent_name,
        role_description: ag.role_description,
        permission_policy: ag.permission_policy,
        active: true
      });
    });

    // Seed Core Form Families
    const judicialCouncilFamily: FormFamily = {
      form_family_id: generateUUID(),
      family_name: 'California Judicial Council Family Law',
      jurisdiction: 'California Superior Court',
      description: 'Standardized California Judicial Council statutory family law and domestic forms.',
      metadata: { authority: 'Judicial Council of California' }
    };
    this.formFamilies.push(judicialCouncilFamily);

    this.initialized = true;
    this.persist();
  }

  public persist(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('phoenix23_db_store_v1', JSON.stringify({
          tenants: this.tenants,
          appUsers: this.appUsers,
          clients: this.clients,
          matters: this.matters,
          parties: this.parties,
          documents: this.documents,
          documentVersions: this.documentVersions,
          documentPages: this.documentPages,
          documentElements: this.documentElements,
          fieldDefinitions: this.fieldDefinitions,
          templates: this.templates,
          templateVersions: this.templateVersions,
          fieldMappings: this.fieldMappings,
          extractionBatches: this.extractionBatches,
          extractedValues: this.extractedValues,
          evidence: this.evidence,
          agents: this.agents,
          agentRuns: this.agentRuns,
          agentMessages: this.agentMessages,
          populationJobs: this.populationJobs,
          populationValues: this.populationValues,
          generatedOutputs: this.generatedOutputs,
          validationRuns: this.validationRuns,
          validationChecks: this.validationChecks,
          visualRegressionResults: this.visualRegressionResults,
          certificationRecords: this.certificationRecords,
          reviewTasks: this.reviewTasks,
          formFamilies: this.formFamilies,
          formVersions: this.formVersions,
          auditEvents: this.auditEvents
        }));
      } catch (err) {
        console.warn('Could not persist Phoenix DB store:', err);
      }
    }
  }

  // ============================================================
  // TRIGGER IMPLEMENTATIONS
  // ============================================================

  /**
   * Section 18: GOLDEN MASTER PROTECTION TRIGGER
   * Rejects modification or deletion of any version marked is_golden_master.
   */
  public protectGoldenMasterCheck(
    operation: 'UPDATE' | 'DELETE',
    oldVersion: DocumentVersion,
    newVersion?: DocumentVersion
  ): void {
    if (operation === 'DELETE' && oldVersion.is_golden_master) {
      throw new Error('Golden Master versions are immutable');
    }

    if (operation === 'UPDATE' && oldVersion.is_golden_master && newVersion) {
      if (
        newVersion.sha256 !== oldVersion.sha256 ||
        newVersion.storage_uri !== oldVersion.storage_uri ||
        newVersion.page_count !== oldVersion.page_count ||
        newVersion.page_width_points !== oldVersion.page_width_points ||
        newVersion.page_height_points !== oldVersion.page_height_points ||
        newVersion.orientation !== oldVersion.orientation
      ) {
        throw new Error('Golden Master content/identity cannot be modified');
      }
    }
  }

  /**
   * Section 19: NO-GUESS DATA QUALITY RULE
   * Approved/corrected values must not be empty. Confidence cannot be negative.
   */
  public validateExtractedValue(value: ExtractedValue): void {
    if (
      (value.review_status === 'approved' || value.review_status === 'corrected') &&
      (!value.value_text || value.value_text.trim() === '') &&
      (!value.value_json || Object.keys(value.value_json).length === 0)
    ) {
      throw new Error('Approved/corrected extracted value cannot be empty');
    }

    if (value.confidence !== undefined && value.confidence !== null && value.confidence < 0) {
      throw new Error('Confidence cannot be negative');
    }
  }

  /**
   * Section 20: CERTIFICATION GUARD
   */
  public certifyTemplateGuard(version: TemplateVersion): void {
    if (version.status === 'certified' || version.status === 'production') {
      if (!version.certified_at || !version.certified_by) {
        throw new Error('Certified/production template requires certification identity and timestamp');
      }
      if (!version.source_hash) {
        throw new Error('Certified/production template requires source hash');
      }
    }
  }

  // ============================================================
  // Section 25: SAFE CERTIFICATION PROCEDURE
  // ============================================================

  public async certifyTemplate(
    templateVersionId: string,
    userId: string,
    validationRunId: string,
    notes?: string
  ): Promise<string> {
    const version = this.templateVersions.find(v => v.template_version_id === templateVersionId);
    if (!version) throw new Error('Template version not found');
    if (!version.source_hash) throw new Error('Template source hash is missing');

    const validationRun = this.validationRuns.find(r => r.validation_run_id === validationRunId);
    if (!validationRun) throw new Error('Validation run not found');
    if (validationRun.result !== 'pass') {
      throw new Error('Template cannot be certified without a passing validation run');
    }

    version.status = 'certified';
    version.certified_at = new Date().toISOString();
    version.certified_by = userId;

    const certificationId = generateUUID();
    const certString = `${templateVersionId}:${version.source_hash}:${userId}:${new Date().toISOString()}`;
    const certHash = await calculateSha256(certString);

    const record: CertificationRecord = {
      certification_id: certificationId,
      template_version_id: templateVersionId,
      validation_run_id: validationRunId,
      certified_by: userId,
      certified_at: new Date().toISOString(),
      source_hash: version.source_hash,
      certification_hash: certHash,
      notes: notes || null,
      metadata: {}
    };

    this.certificationRecords.push(record);
    this.persist();

    // Audit Event
    await this.logAuditEvent('template_version', templateVersionId, 'certify', { status: 'certified', certified_by: userId }, userId);

    return certificationId;
  }

  // ============================================================
  // Section 23 & 24: VIEWS
  // ============================================================

  /**
   * Section 23: CERTIFIED TEMPLATES VIEW
   */
  public getCertifiedTemplates() {
    return this.templates
      .map(t => {
        const versions = this.templateVersions.filter(
          tv => tv.template_id === t.template_id &&
            (tv.status === 'certified' || tv.status === 'production') &&
            tv.certified_at &&
            tv.certified_by
        );
        return versions.map(tv => ({
          template_id: t.template_id,
          template_name: t.template_name,
          template_version_id: tv.template_version_id,
          version_number: tv.version_number,
          source_hash: tv.source_hash,
          template_storage_uri: tv.template_storage_uri,
          certified_at: tv.certified_at,
          certified_by: tv.certified_by
        }));
      })
      .flat();
  }

  /**
   * Section 24: DOCUMENT INTELLIGENCE VIEW
   */
  public getDocumentIntelligence() {
    return this.documents.map(d => {
      const versionIds = this.documentVersions.filter(dv => dv.document_id === d.document_id).map(dv => dv.version_id);
      const pageIds = this.documentPages.filter(dp => versionIds.includes(dp.version_id)).map(dp => dp.page_id);
      const elementCount = this.documentElements.filter(de => pageIds.includes(de.page_id)).length;
      const extractedValueCount = this.extractedValues.filter(ev => ev.document_id === d.document_id).length;

      const template = this.templates.find(t => t.document_id === d.document_id);
      let mappedFieldCount = 0;
      if (template) {
        const tvIds = this.templateVersions.filter(tv => tv.template_id === template.template_id).map(tv => tv.template_version_id);
        mappedFieldCount = this.fieldMappings.filter(fm => tvIds.includes(fm.template_version_id)).length;
      }

      const validationRunCount = this.validationRuns.filter(r => r.document_id === d.document_id).length;

      return {
        document_id: d.document_id,
        filename: d.filename,
        form_number: d.form_number,
        form_family: d.form_family,
        status: d.status,
        original_sha256: d.original_sha256,
        page_count: d.page_count,
        element_count: elementCount,
        extracted_value_count: extractedValueCount,
        mapped_field_count: mappedFieldCount,
        validation_run_count: validationRunCount
      };
    });
  }

  // ============================================================
  // AUDIT LOGGING (Section 14)
  // ============================================================

  public async logAuditEvent(
    entityType: string,
    entityId: string,
    action: string,
    details: Record<string, any>,
    userId?: string,
    agentRunId?: string
  ): Promise<AuditEvent> {
    const eventId = generateUUID();
    const eventString = `${eventId}:${entityType}:${entityId}:${action}:${JSON.stringify(details)}:${this.lastAuditEventHash}`;
    const eventHash = await calculateSha256(eventString);

    const event: AuditEvent = {
      audit_event_id: eventId,
      tenant_id: this.tenants[0]?.tenant_id,
      user_id: userId || null,
      agent_run_id: agentRunId || null,
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      after_json: details,
      event_hash: eventHash,
      previous_event_hash: this.lastAuditEventHash,
      created_at: new Date().toISOString(),
      metadata: {}
    };

    this.lastAuditEventHash = eventHash;
    this.auditEvents.unshift(event);
    if (this.auditEvents.length > 500) this.auditEvents.pop();
    this.persist();

    return event;
  }
}

export const phoenixDb = new PhoenixDatabaseEngine();
