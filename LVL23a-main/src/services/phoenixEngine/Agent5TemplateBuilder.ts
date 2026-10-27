/**
 * AGENT 5 — TEMPLATE BUILDER AGENT
 * This is the most important agent.
 * 
 * Purpose: Transform the original document into a reusable intelligent form
 * WITHOUT changing the original structure.
 * 
 * Non-Negotiable Rule:
 * The template must visually match the source document.
 * The template builder may NOT:
 * - rebuild the document from HTML
 * - recreate the PDF from scratch
 * - change page dimensions
 * - move text or reflow content
 * 
 * Preferred Architecture:
 * Use the original PDF as the immutable visual layer.
 * Create a separate machine-readable field layer over the original.
 */

import { DocumentStructureMap, CanonicalFieldMapping, IntelligentTemplate } from './types';
import { phoenixDb, generateUUID } from '../phoenixDatabaseService';

export class TemplateBuilderAgent {
  public readonly id = 'agent_5_template_builder';
  public readonly name = 'Template Builder Agent';
  public readonly directive = 'Transform original documents into reusable intelligent templates using coordinate overlays and native AcroForm maps while strictly preserving original visual structure byte-for-byte.';

  public async buildIntelligentTemplate(
    structureMap: DocumentStructureMap,
    templateName?: string
  ): Promise<IntelligentTemplate> {
    const templateId = generateUUID();
    const sourceVersionId = generateUUID();
    const createdAt = new Date().toISOString();

    const cleanName = templateName || `Template_${structureMap.documentId.substring(0, 8)}`;

    const mappings: CanonicalFieldMapping[] = [];

    // Map each detected blank to canonical ontology
    structureMap.detectedBlanks.forEach((blank, idx) => {
      const canonical = blank.suggestedCanonicalField || `field.${idx + 1}`;
      const dataType = this.inferDataType(canonical, blank.fieldCategory);

      mappings.push({
        mappingId: generateUUID(),
        templateId,
        versionNumber: 1,
        canonicalName: canonical,
        sourceLabel: blank.promptLabel || `Blank Line ${idx + 1}`,
        pageNumber: blank.pageNumber,
        bounds: { ...blank.bounds },
        dataType,
        required: canonical.includes('full_name') || canonical.includes('case_number'),
        nativeAcroFieldName: blank.promptLabel,
        confidence: 0.95
      });
    });

    const template: IntelligentTemplate = {
      templateId,
      templateName: cleanName,
      documentId: structureMap.documentId,
      sourceVersionId,
      currentVersionNumber: 1,
      sourceSha256: structureMap.sha256,
      status: 'draft',
      validationStatus: 'pass',
      fieldMappings: mappings,
      geometry: structureMap.geometry,
      createdAt
    };

    // Store in Phoenix DB
    phoenixDb.templates.push({
      template_id: templateId,
      tenant_id: phoenixDb.tenants[0]?.tenant_id || null,
      document_id: structureMap.documentId,
      source_version_id: sourceVersionId,
      template_name: cleanName,
      form_number: 'STD-V1',
      form_family: 'Standard Legal Forms',
      status: 'draft',
      certification_status: 'pending',
      current_version_number: 1,
      source_sha256: structureMap.sha256,
      created_at: createdAt,
      metadata: { fieldCount: mappings.length }
    });

    phoenixDb.templateVersions.push({
      template_version_id: sourceVersionId,
      template_id: templateId,
      version_number: 1,
      source_version_id: sourceVersionId,
      field_map_version: 1,
      status: 'draft',
      source_hash: structureMap.sha256,
      created_at: createdAt
    });

    mappings.forEach(m => {
      phoenixDb.fieldMappings.push({
        mapping_id: m.mappingId,
        template_version_id: sourceVersionId,
        field_id: generateUUID(),
        page_number: m.pageNumber,
        x: m.bounds.x,
        y: m.bounds.y,
        width: m.bounds.width,
        height: m.bounds.height,
        rotation_degrees: 0,
        field_type: m.dataType as any,
        source_label: m.sourceLabel,
        native_pdf_field_name: m.nativeAcroFieldName,
        required: m.required,
        confidence: m.confidence,
        confidence_band: 'very_high',
        risk_level: 'low',
        review_status: 'approved',
        mapping_version: 1,
        validation_rules: {},
        metadata: {}
      });
    });

    phoenixDb.persist();

    return template;
  }

  /**
   * Versioning Rule: If form changes, increment version; never overwrite existing version.
   */
  public createNewTemplateVersion(
    existingTemplate: IntelligentTemplate,
    updatedMappings: CanonicalFieldMapping[],
    newSourceHash?: string
  ): IntelligentTemplate {
    const nextVersionNum = existingTemplate.currentVersionNumber + 1;
    const newVersionId = generateUUID();

    const newTemplate: IntelligentTemplate = {
      ...existingTemplate,
      sourceVersionId: newVersionId,
      currentVersionNumber: nextVersionNum,
      sourceSha256: newSourceHash || existingTemplate.sourceSha256,
      fieldMappings: updatedMappings,
      createdAt: new Date().toISOString()
    };

    return newTemplate;
  }

  private inferDataType(canonicalName: string, category: string): CanonicalFieldMapping['dataType'] {
    if (category === 'checkbox') return 'boolean';
    if (category === 'signature') return 'signature';
    if (category === 'date' || canonicalName.includes('date')) return 'date';
    if (canonicalName.includes('phone')) return 'phone';
    if (canonicalName.includes('email')) return 'email';
    if (canonicalName.includes('ssn')) return 'ssn';
    if (canonicalName.includes('case_number') || canonicalName.includes('bar_number')) return 'identifier';
    if (canonicalName.includes('name')) return 'person_name';
    return 'text';
  }
}

export const templateBuilderAgent = new TemplateBuilderAgent();
