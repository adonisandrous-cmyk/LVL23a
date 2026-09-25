/**
 * AGENT 6 — TEMPLATE DELIVERY / POPULATION AGENT
 * Purpose: Populate the reusable template with client/matter data while preserving
 * original visual structure and geometry byte-for-byte.
 * 
 * Supported outputs:
 * - Populated PDF (with precision coordinate overlay or AcroForm filling)
 * - Fillable PDF (with editable AcroForm fields injected at blank coordinates)
 * - XFDF (XML Forms Data Format)
 * - FDF (Forms Data Format)
 * - JSON Field Map & Structured Data
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { IntelligentTemplate, PopulatedOutputResult, PopulationInput } from './types';
import { ingestionAgent } from './Agent1Ingestion';
import { generateCourtFormXFDF, generateCourtFormFDF } from '../xfdfService';
import { calculateSha256, generateUUID } from '../phoenixDatabaseService';

export class DeliveryPopulationAgent {
  public readonly id = 'agent_6_delivery';
  public readonly name = 'Delivery / Population Agent';
  public readonly directive = 'Retrieve templates, match canonical fields with client/matter facts, and populate documents without changing underlying typography, page counts, or dimensions.';

  public async populateDocument(
    template: IntelligentTemplate,
    input: PopulationInput
  ): Promise<PopulatedOutputResult> {
    const jobId = generateUUID();
    const createdAt = new Date().toISOString();

    // 1. Retrieve the immutable original byte-for-byte
    let originalBytes = ingestionAgent.getImmutableOriginal(template.documentId);
    if (!originalBytes) {
      // Fallback: create base PDF with exact template geometry
      const fallbackDoc = await PDFDocument.create();
      template.geometry.pages.forEach(pg => {
        fallbackDoc.addPage([pg.widthPoints, pg.heightPoints]);
      });
      originalBytes = await fallbackDoc.save();
    }

    // 2. Aggregate available data: clientData + matterData + overrideValues
    const combinedData: Record<string, any> = {
      ...(input.clientData || {}),
      ...(input.matterData || {}),
      ...(input.overrideValues || {})
    };

    // 3. Load PDF for deterministic population
    const pdfDoc = await PDFDocument.load(originalBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const form = pdfDoc.getForm();
    let populatedFieldCount = 0;
    let blankFieldCount = 0;
    let unmappedFieldCount = 0;
    const xfdfFieldMap: Record<string, string | number | boolean> = {};

    // 4. Iterate over template field mappings
    for (const mapping of template.fieldMappings) {
      // Find value matching canonicalName or sourceLabel
      const value = combinedData[mapping.canonicalName] ??
        combinedData[mapping.sourceLabel] ??
        this.lookupFuzzyValue(mapping.canonicalName, combinedData);

      if (value !== undefined && value !== null && String(value).trim() !== '') {
        const valStr = String(value);
        xfdfFieldMap[mapping.sourceLabel || mapping.canonicalName] = valStr;

        // Strategy A: Native AcroForm field if exists
        let nativeFilled = false;
        if (form && mapping.nativeAcroFieldName) {
          try {
            const field = form.getField(mapping.nativeAcroFieldName);
            if (field) {
              if (mapping.dataType === 'boolean' && (field as any).check) {
                if (value === true || String(value).toLowerCase() === 'yes') {
                  (field as any).check();
                } else {
                  (field as any).uncheck();
                }
              } else if ((field as any).setText) {
                (field as any).setText(valStr);
              }
              nativeFilled = true;
            }
          } catch (e) {
            // Ignore and fallback to coordinate overlay
          }
        }

        // Strategy B: Precision coordinate text overlay
        // Preserves original document completely by drawing directly at the exact blank coordinate
        if (!nativeFilled) {
          const pageIndex = Math.max(0, mapping.pageNumber - 1);
          if (pageIndex < pdfDoc.getPageCount()) {
            const page = pdfDoc.getPage(pageIndex);
            const fontSize = Math.min(10, Math.max(8, mapping.bounds.height - 4));

            // Position text cleanly within the blank bounding box
            page.drawText(valStr, {
              x: mapping.bounds.x + 2,
              y: mapping.bounds.y + 2,
              size: fontSize,
              font: helveticaFont,
              color: rgb(0.05, 0.05, 0.15) // Clean legal-ink navy/black
            });
          }
        }

        populatedFieldCount++;
      } else {
        // Section VII Test 5 requirement: Missing data -> field remains blank & reports missing
        blankFieldCount++;
      }
    }

    // 5. Generate final output bytes
    const pdfBytes = await pdfDoc.save();
    const outputSha256 = await calculateSha256(Array.from(pdfBytes.slice(0, 100000)).map(b => String.fromCharCode(b)).join(''));

    // 6. Generate XFDF & FDF formats
    const targetPdfName = `${template.templateName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    const xfdfContent = generateCourtFormXFDF(xfdfFieldMap, targetPdfName);
    const fdfContent = generateCourtFormFDF(xfdfFieldMap);

    return {
      jobId,
      templateId: template.templateId,
      outputFormat: input.outputFormat || 'pdf',
      pdfBytes,
      xfdfContent,
      fdfContent,
      dataJson: combinedData,
      populatedFieldCount,
      blankFieldCount,
      unmappedFieldCount,
      outputSha256,
      visualMasterSha256: template.sourceSha256,
      status: 'completed',
      createdAt
    };
  }

  private lookupFuzzyValue(canonicalName: string, data: Record<string, any>): any {
    const key = canonicalName.split('.').pop();
    if (key && data[key] !== undefined) return data[key];
    return undefined;
  }
}

export const deliveryPopulationAgent = new DeliveryPopulationAgent();
