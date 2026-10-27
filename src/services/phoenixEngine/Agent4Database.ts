/**
 * AGENT 4 — DATABASE AGENT
 * Purpose: Create the persistent intelligence layer.
 * 
 * Responsibilities:
 * - Persist Document, Extracted Data, Field Map, and Templates into the Phoenix DB
 * - Maintain relational link: Client -> Matter -> Document -> Template -> Fields
 * - Ensure facts extracted from one document can seamlessly populate any other form
 */

import { DocumentStructureMap, ExtractedFieldValue, IntelligentTemplate } from './types';
import { phoenixDb, generateUUID } from '../phoenixDatabaseService';

export class DatabaseAgent {
  public readonly id = 'agent_4_database';
  public readonly name = 'Database Agent';
  public readonly directive = 'Normalize and persist canonical document intelligence, maintain Client -> Matter -> Document -> Template linkages, and ensure multi-form reusability.';

  public async persistIntelligence(
    structureMap: DocumentStructureMap,
    extractedValues: ExtractedFieldValue[],
    clientId?: string,
    matterId?: string
  ): Promise<{ documentRecordId: string; versionRecordId: string; persistedCount: number }> {
    const documentId = structureMap.documentId;
    const versionId = generateUUID();

    // 1. Persist Document Row
    phoenixDb.documents.push({
      document_id: documentId,
      tenant_id: phoenixDb.tenants[0]?.tenant_id || null,
      client_id: clientId || null,
      matter_id: matterId || null,
      filename: `doc_${structureMap.sha256.substring(0, 8)}.pdf`,
      document_type: 'court_form',
      form_number: 'LEGAL-STD',
      form_family: 'General Litigation',
      mime_type: 'application/pdf',
      source: 'upload',
      status: 'analyzing',
      original_sha256: structureMap.sha256,
      file_size_bytes: 102400,
      page_count: structureMap.geometry.pageCount,
      storage_uri: `vault://${documentId}`,
      uploaded_at: new Date().toISOString(),
      metadata: { geometry: structureMap.geometry }
    });

    // 2. Persist Golden Master Document Version
    const goldenVersion = {
      version_id: versionId,
      document_id: documentId,
      version_number: 1,
      sha256: structureMap.sha256,
      storage_uri: `vault://${documentId}/v1`,
      page_count: structureMap.geometry.pageCount,
      page_width_points: structureMap.geometry.pages[0]?.widthPoints || 612,
      page_height_points: structureMap.geometry.pages[0]?.heightPoints || 792,
      orientation: structureMap.geometry.pages[0]?.orientation || 'portrait',
      is_golden_master: true,
      created_at: new Date().toISOString(),
      metadata: {}
    };
    phoenixDb.documentVersions.push(goldenVersion);

    // 3. Persist Document Elements
    structureMap.elements.forEach(el => {
      phoenixDb.documentElements.push({
        element_id: el.id,
        page_id: generateUUID(),
        element_type: 'line',
        x: el.bounds.x,
        y: el.bounds.y,
        width: el.bounds.width,
        height: el.bounds.height,
        rotation_degrees: 0,
        text_content: el.text,
        normalized_text: el.text?.toLowerCase(),
        confidence: el.confidence,
        native_field_name: el.nativeFieldName,
        metadata: {}
      });
    });

    // 4. Persist Extracted Values with Provenance
    let persistedCount = 0;
    extractedValues.forEach(val => {
      const fieldDef = phoenixDb.fieldDefinitions.find(f => f.canonical_name === val.canonicalName);
      const fieldId = fieldDef ? fieldDef.field_id : generateUUID();

      phoenixDb.extractedValues.push({
        value_id: val.fieldId,
        field_id: fieldId,
        document_id: documentId,
        source_version_id: versionId,
        value_text: String(val.value ?? ''),
        value_json: { raw: val.value },
        source_page: val.sourcePage,
        source_x: val.sourceCoordinates.x,
        source_y: val.sourceCoordinates.y,
        source_width: val.sourceCoordinates.width,
        source_height: val.sourceCoordinates.height,
        source_text: val.sourceLabel,
        extraction_method: val.extractionMethod,
        confidence: val.confidence,
        confidence_band: val.confidence > 0.9 ? 'very_high' : val.confidence > 0.8 ? 'high' : 'medium',
        risk_level: 'medium',
        review_status: val.requiresReview ? 'pending' : 'approved',
        created_at: val.timestamp,
        provenance: val.provenance
      });
      persistedCount++;
    });

    phoenixDb.persist();

    return {
      documentRecordId: documentId,
      versionRecordId: versionId,
      persistedCount
    };
  }

  /**
   * Universal data retrieval: Fetch all known values for a Client/Matter
   * that can be used to populate ANY legal form in the system.
   */
  public getClientMatterKnowledgeBase(clientId?: string, matterId?: string): Record<string, any> {
    const knowledge: Record<string, any> = {};

    // 1. Direct matter records
    if (matterId) {
      const matter = phoenixDb.matters.find(m => m.matter_id === matterId);
      if (matter) {
        knowledge['matter.case_number'] = matter.case_number;
        knowledge['matter.case_type'] = matter.case_type;
        knowledge['court.name'] = matter.court_name;
        knowledge['court.county'] = matter.court_county;
        knowledge['court.state'] = matter.court_state;
        if (matter.data) Object.assign(knowledge, matter.data);
      }
    }

    // 2. Direct client records
    if (clientId) {
      const client = phoenixDb.clients.find(c => c.client_id === clientId);
      if (client) {
        knowledge['person.full_name'] = client.display_name;
        if (client.data) Object.assign(knowledge, client.data);
      }
    }

    // 3. Previously extracted facts from any linked document
    const extracted = phoenixDb.extractedValues.filter(ev => {
      const doc = phoenixDb.documents.find(d => d.document_id === ev.document_id);
      return (clientId && doc?.client_id === clientId) || (matterId && doc?.matter_id === matterId);
    });

    extracted.forEach(item => {
      const def = phoenixDb.fieldDefinitions.find(f => f.field_id === item.field_id);
      if (def && item.value_text && !knowledge[def.canonical_name]) {
        knowledge[def.canonical_name] = item.value_text;
      }
    });

    return knowledge;
  }
}

export const databaseAgent = new DatabaseAgent();
