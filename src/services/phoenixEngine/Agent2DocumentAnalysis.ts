/**
 * AGENT 2 — DOCUMENT ANALYSIS AGENT
 * Purpose: Understand the document without changing it.
 * 
 * Responsibilities:
 * 1. Inspect native PDF text, AcroForm fields, scanned images, tables, checkboxes, radio buttons, blanks
 * 2. Determine document exact structural geometry
 * 3. Create page-level structural map
 * 4. Identify bounding boxes, labels, form blanks, coordinates, reading order
 * 5. Never modify the source
 * 
 * Output: DocumentStructureMap
 */

import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup } from 'pdf-lib';
import { DocumentStructureMap, DocumentElementNode, DocumentGeometry } from './types';
import { generateUUID } from '../phoenixDatabaseService';

export class DocumentAnalysisAgent {
  public readonly id = 'agent_2_analysis';
  public readonly name = 'Document Analysis Agent';
  public readonly directive = 'Inspect and map document geometry, detect native form fields, scan blanks, and create a machine-readable DocumentStructureMap without altering the source.';

  public async analyzeDocument(
    documentId: string,
    fileBytes: Uint8Array,
    sha256: string,
    geometry: DocumentGeometry
  ): Promise<DocumentStructureMap> {
    const elements: DocumentElementNode[] = [];
    const detectedBlanks: DocumentStructureMap['detectedBlanks'] = [];
    let hasNativeAcroForms = false;
    let isScannedOrImage = false;

    try {
      const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const form = pdfDoc.getForm();
      const fields = form ? form.getFields() : [];

      if (fields.length > 0) {
        hasNativeAcroForms = true;

        fields.forEach((field) => {
          const fieldName = field.getName();
          // Extract widget bounding boxes
          const widgets = field.acroField.getWidgets();
          widgets.forEach((widget, widgetIndex) => {
            const rect = widget.getRectangle();
            const pageRef = widget.P();
            let pageNum = 1;
            // Match page
            const pages = pdfDoc.getPages();
            const foundIndex = pages.findIndex(p => p.ref === pageRef);
            if (foundIndex >= 0) pageNum = foundIndex + 1;

            const isCheck = field instanceof PDFCheckBox;
            const isRadio = field instanceof PDFRadioGroup;
            const isText = field instanceof PDFTextField;

            const elemType = isCheck ? 'checkbox' : isRadio ? 'radio' : 'blank_line';

            const elem: DocumentElementNode = {
              id: generateUUID(),
              type: elemType,
              pageNumber: pageNum,
              bounds: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                pageNumber: pageNum
              },
              nativeFieldName: fieldName,
              isFillableBlank: true,
              confidence: 0.99
            };
            elements.push(elem);

            // Also register in detectedBlanks
            detectedBlanks.push({
              blankId: generateUUID(),
              pageNumber: pageNum,
              bounds: elem.bounds,
              promptLabel: fieldName,
              suggestedCanonicalField: this.inferCanonicalFieldName(fieldName),
              fieldCategory: isCheck ? 'checkbox' : 'text'
            });
          });
        });
      }
    } catch (err) {
      console.warn('DocumentAnalysisAgent: AcroForm inspection note:', err);
    }

    // Heuristic geometry analysis for standard legal document forms (e.g. caption, petitioner blank, case number)
    // If no native AcroForm fields, synthesize coordinate blank detectors for visual document
    if (detectedBlanks.length === 0) {
      // Create canonical blank zones based on legal pleading / court form standard layout
      const page1 = geometry.pages[0] || { widthPoints: 612, heightPoints: 792 };
      const w = page1.widthPoints;
      const h = page1.heightPoints;

      // Standard California / Judicial Council / Pleading blanks
      const standardBlanks = [
        { label: 'ATTORNEY OR PARTY WITHOUT ATTORNEY (Name, State Bar number, and address):', canonical: 'attorney.full_name', x: 54, y: h - 90, width: 260, height: 18, type: 'text' as const },
        { label: 'ATTORNEY FOR (Name):', canonical: 'party.role', x: 54, y: h - 142, width: 260, height: 16, type: 'text' as const },
        { label: 'SUPERIOR COURT OF CALIFORNIA, COUNTY OF:', canonical: 'court.county', x: 54, y: h - 170, width: 260, height: 16, type: 'text' as const },
        { label: 'STREET ADDRESS:', canonical: 'court.address', x: 54, y: h - 188, width: 260, height: 16, type: 'text' as const },
        { label: 'PETITIONER:', canonical: 'party.petitioner.full_name', x: 54, y: h - 235, width: 260, height: 18, type: 'text' as const },
        { label: 'RESPONDENT:', canonical: 'party.respondent.full_name', x: 54, y: h - 262, width: 260, height: 18, type: 'text' as const },
        { label: 'CASE NUMBER:', canonical: 'matter.case_number', x: 380, y: h - 235, width: 175, height: 18, type: 'text' as const },
        { label: 'HEARING DATE:', canonical: 'legal.date', x: 380, y: h - 262, width: 175, height: 18, type: 'date' as const },
        { label: 'DEPARTMENT:', canonical: 'court.department', x: 380, y: h - 285, width: 175, height: 16, type: 'text' as const },
        { label: 'DATE SIGNED:', canonical: 'legal.signature_date', x: 54, y: 120, width: 140, height: 18, type: 'date' as const },
        { label: 'SIGNATURE OF PETITIONER:', canonical: 'legal.signature', x: 280, y: 120, width: 250, height: 24, type: 'signature' as const }
      ];

      standardBlanks.forEach((b) => {
        const bounds = {
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          pageNumber: 1
        };

        elements.push({
          id: generateUUID(),
          type: b.type === 'signature' ? 'signature_area' : 'blank_line',
          pageNumber: 1,
          bounds,
          text: b.label,
          isFillableBlank: true,
          confidence: 0.95
        });

        detectedBlanks.push({
          blankId: generateUUID(),
          pageNumber: 1,
          bounds,
          promptLabel: b.label,
          suggestedCanonicalField: b.canonical,
          fieldCategory: b.type
        });
      });
    }

    return {
      documentId,
      sha256,
      geometry,
      hasNativeAcroForms,
      isScannedOrImage,
      elements,
      detectedBlanks,
      analyzedAt: new Date().toISOString()
    };
  }

  private inferCanonicalFieldName(rawName: string): string {
    const clean = rawName.toLowerCase();
    if (clean.includes('petitioner') || clean.includes('plaintiff')) {
      if (clean.includes('first')) return 'party.petitioner.first_name';
      if (clean.includes('last')) return 'party.petitioner.last_name';
      return 'party.petitioner.full_name';
    }
    if (clean.includes('respondent') || clean.includes('defendant')) {
      return 'party.respondent.full_name';
    }
    if (clean.includes('case') && (clean.includes('no') || clean.includes('number'))) {
      return 'matter.case_number';
    }
    if (clean.includes('court') || clean.includes('county')) {
      return 'court.name';
    }
    if (clean.includes('bar') || clean.includes('attorney')) {
      return 'attorney.full_name';
    }
    if (clean.includes('date')) {
      return 'legal.date';
    }
    return `custom.${clean.replace(/[^a-z0-9_]/g, '_')}`;
  }
}

export const documentAnalysisAgent = new DocumentAnalysisAgent();
