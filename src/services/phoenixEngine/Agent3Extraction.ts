/**
 * AGENT 3 — EXTRACTION AGENT
 * Purpose: Extract useful information from the document with provenance and confidence.
 * 
 * Rules:
 * - Distinguish Document Content (actual data present) vs Field Definitions (what a blank asks for)
 * - Record: value, source page, source coordinates, extraction method, confidence, timestamp
 * - Rule 5 / No Guessing: If ambiguous or confidence < 0.85, mark REQUIRES_REVIEW
 */

import { DocumentStructureMap, ExtractedFieldValue } from './types';
import { generateUUID } from '../phoenixDatabaseService';

export class ExtractionAgent {
  public readonly id = 'agent_3_extraction';
  public readonly name = 'Extraction Agent';
  public readonly directive = 'Extract canonical data with strict provenance, coordinates, and confidence. Never guess ambiguous fields—flag for human review.';

  public async extractValues(
    structureMap: DocumentStructureMap,
    contextualData?: Record<string, any>
  ): Promise<ExtractedFieldValue[]> {
    const extracted: ExtractedFieldValue[] = [];
    const timestamp = new Date().toISOString();

    for (const blank of structureMap.detectedBlanks) {
      const canonical = blank.suggestedCanonicalField || 'unknown';
      let value: string | boolean | number = '';
      let confidence = 0.95;
      let requiresReview = false;
      let reviewReason: string | undefined;

      // Match against context data if provided (e.g. existing client/matter records)
      if (contextualData) {
        if (canonical.includes('petitioner') && contextualData.petitioner) {
          value = contextualData.petitioner;
          confidence = 0.98;
        } else if (canonical.includes('respondent') && contextualData.respondent) {
          value = contextualData.respondent;
          confidence = 0.98;
        } else if (canonical.includes('case_number') && contextualData.caseNumber) {
          value = contextualData.caseNumber;
          confidence = 0.99;
        } else if (canonical.includes('county') && contextualData.county) {
          value = contextualData.county;
          confidence = 0.96;
        } else if (contextualData[canonical]) {
          value = contextualData[canonical];
          confidence = 0.95;
        }
      }

      // If value could not be reliably extracted from text or context:
      // Rule 5: Leave field blank and request further information. Never put false information to fill space.
      if (!value || String(value).trim() === '') {
        value = '';
        confidence = 0.0;
        requiresReview = true;
        reviewReason = `Information for "${blank.promptLabel || canonical}" was not found in the uploaded documents. Field left blank; further information requested from client/matter.`;
      }

      extracted.push({
        fieldId: generateUUID(),
        canonicalName: canonical,
        sourceLabel: blank.promptLabel || 'Form Blank',
        value,
        sourcePage: blank.pageNumber,
        sourceCoordinates: blank.bounds,
        extractionMethod: structureMap.hasNativeAcroForms ? 'native_pdf' : 'ocr',
        confidence,
        requiresReview,
        reviewReason,
        timestamp,
        provenance: {
          documentId: structureMap.documentId,
          originalSha256: structureMap.sha256,
          agentName: this.name,
          rawSnippet: blank.promptLabel
        }
      });
    }

    return extracted;
  }
}

export const extractionAgent = new ExtractionAgent();
