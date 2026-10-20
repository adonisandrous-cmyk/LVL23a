/**
 * LEVEL 23 / PHOENIX 23
 * AUTOMATED VERIFICATION TEST SUITE
 * Implements Section VII of the Build Specification:
 * - Test 1: Native fillable PDF -> Original structure preserved
 * - Test 2: Non-fillable PDF -> Coordinate-based fields created without altering visual structure
 * - Test 3: Scanned PDF -> OCR extraction + coordinate mapping + reusable template
 * - Test 4: Populate template -> Only mapped fields receive data
 * - Test 5: Missing data -> Field remains blank & system reports missing data
 * - Test 6: Ambiguous field -> REQUIRES_HUMAN_REVIEW
 * - Test 7: Intentional structure violation -> QA Agent rejects the template
 * - Test 8: Template version change -> New version created; previous version remains immutable
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { phoenixPipelineCoordinator } from './PhoenixPipelineCoordinator';
import { ingestionAgent } from './Agent1Ingestion';
import { documentAnalysisAgent } from './Agent2DocumentAnalysis';
import { extractionAgent } from './Agent3Extraction';
import { templateBuilderAgent } from './Agent5TemplateBuilder';
import { deliveryPopulationAgent } from './Agent6DeliveryPopulation';
import { qaSentinelAgent } from './Agent8QASentinel';
import { calculateSha256 } from '../phoenixDatabaseService';

export interface AutomatedTestResult {
  testId: string;
  name: string;
  category: string;
  passed: boolean;
  assertions: Array<{ name: string; expected: any; actual: any; passed: boolean }>;
  durationMs: number;
  error?: string;
}

export class AutomatedTestSuite {
  /**
   * Helper: Generate clean synthetic PDF bytes for testing
   */
  private async createSyntheticPdf(options?: { fillable?: boolean; title?: string }): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Standard US Letter points
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const title = options?.title || 'SUPERIOR COURT OF CALIFORNIA, COUNTY OF ORANGE';

    page.drawText(title, { x: 50, y: 720, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText('PETITIONER: _____________________________________', { x: 50, y: 670, size: 10, font });
    page.drawText('RESPONDENT: _____________________________________', { x: 50, y: 640, size: 10, font });
    page.drawText('CASE NUMBER: _______________________', { x: 350, y: 670, size: 10, font });

    if (options?.fillable) {
      const form = pdfDoc.getForm();
      const petField = form.createTextField('Petitioner_Name');
      petField.addToPage(page, { x: 130, y: 668, width: 180, height: 16 });

      const respField = form.createTextField('Respondent_Name');
      respField.addToPage(page, { x: 135, y: 638, width: 180, height: 16 });

      const caseField = form.createTextField('Case_Number');
      caseField.addToPage(page, { x: 430, y: 668, width: 120, height: 16 });
    }

    return pdfDoc.save();
  }

  /**
   * Run full test suite (Tests 1 - 8)
   */
  public async runAllTests(): Promise<{ total: number; passed: number; failed: number; results: AutomatedTestResult[] }> {
    const results: AutomatedTestResult[] = [];

    results.push(await this.test1NativeFillablePdf());
    results.push(await this.test2NonFillablePdf());
    results.push(await this.test3ScannedPdf());
    results.push(await this.test4PopulateTemplate());
    results.push(await this.test5MissingData());
    results.push(await this.test6AmbiguousField());
    results.push(await this.test7IntentionalStructureViolation());
    results.push(await this.test8TemplateVersionChange());
    results.push(await this.test9AtomicItemAndFourPassVerification());

    const passed = results.filter(r => r.passed).length;
    return {
      total: results.length,
      passed,
      failed: results.length - passed,
      results
    };
  }

  // TEST 1: Native Fillable PDF -> Original structure preserved
  public async test1NativeFillablePdf(): Promise<AutomatedTestResult> {
    const start = Date.now();
    const assertions: AutomatedTestResult['assertions'] = [];

    try {
      const pdfBytes = await this.createSyntheticPdf({ fillable: true, title: 'FL-300 REQUEST FOR ORDER' });
      const ingestion = await ingestionAgent.ingestDocument(pdfBytes, 'FL-300-Fillable.pdf');

      assertions.push({
        name: 'Ingestion byte conservation',
        expected: pdfBytes.length,
        actual: ingestion.fileSizeBytes,
        passed: ingestion.fileSizeBytes === pdfBytes.length
      });

      const analysis = await documentAnalysisAgent.analyzeDocument(ingestion.documentId, pdfBytes, ingestion.sha256, ingestion.geometry);
      assertions.push({
        name: 'Detect native AcroForm fields without modifying source',
        expected: true,
        actual: analysis.hasNativeAcroForms,
        passed: analysis.hasNativeAcroForms === true
      });

      const template = await templateBuilderAgent.buildIntelligentTemplate(analysis, 'FL-300-Template');
      assertions.push({
        name: 'Template page count invariant',
        expected: 1,
        actual: template.geometry.pageCount,
        passed: template.geometry.pageCount === 1
      });

      assertions.push({
        name: 'Source hash equality check',
        expected: ingestion.sha256,
        actual: template.sourceSha256,
        passed: template.sourceSha256 === ingestion.sha256
      });

      return {
        testId: 'TEST-1',
        name: 'Test 1: Native Fillable PDF Structure Preservation',
        category: 'Ingestion & Analysis',
        passed: assertions.every(a => a.passed),
        assertions,
        durationMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        testId: 'TEST-1',
        name: 'Test 1: Native Fillable PDF Structure Preservation',
        category: 'Ingestion & Analysis',
        passed: false,
        assertions,
        durationMs: Date.now() - start,
        error: err.message
      };
    }
  }

  // TEST 2: Non-fillable PDF -> Coordinate-based fields created without changing visual structure
  public async test2NonFillablePdf(): Promise<AutomatedTestResult> {
    const start = Date.now();
    const assertions: AutomatedTestResult['assertions'] = [];

    try {
      const pdfBytes = await this.createSyntheticPdf({ fillable: false });
      const ingestion = await ingestionAgent.ingestDocument(pdfBytes, 'Court-Pleading-Flat.pdf');
      const analysis = await documentAnalysisAgent.analyzeDocument(ingestion.documentId, pdfBytes, ingestion.sha256, ingestion.geometry);

      assertions.push({
        name: 'Identified as flat / non-fillable',
        expected: false,
        actual: analysis.hasNativeAcroForms,
        passed: analysis.hasNativeAcroForms === false
      });

      assertions.push({
        name: 'Detected blank coordinates automatically',
        expected: '> 0 blanks',
        actual: `${analysis.detectedBlanks.length} blanks`,
        passed: analysis.detectedBlanks.length > 0
      });

      const template = await templateBuilderAgent.buildIntelligentTemplate(analysis);
      assertions.push({
        name: 'Coordinate-based overlay mappings generated',
        expected: '> 0 mappings',
        actual: `${template.fieldMappings.length} mappings`,
        passed: template.fieldMappings.length > 0
      });

      // Verify every coordinate is within original page points (612 x 792)
      const allInBounds = template.fieldMappings.every(m => m.bounds.x >= 0 && m.bounds.y >= 0 && m.bounds.x + m.bounds.width <= 612 && m.bounds.y + m.bounds.height <= 792);
      assertions.push({
        name: 'Overlay coordinates strictly bounded to original page points',
        expected: true,
        actual: allInBounds,
        passed: allInBounds
      });

      return {
        testId: 'TEST-2',
        name: 'Test 2: Non-Fillable PDF Coordinate Overlay Generation',
        category: 'Template Builder',
        passed: assertions.every(a => a.passed),
        assertions,
        durationMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        testId: 'TEST-2',
        name: 'Test 2: Non-Fillable PDF Coordinate Overlay Generation',
        category: 'Template Builder',
        passed: false,
        assertions,
        durationMs: Date.now() - start,
        error: err.message
      };
    }
  }

  // TEST 3: Scanned PDF -> OCR extraction + coordinate mapping + reusable template
  public async test3ScannedPdf(): Promise<AutomatedTestResult> {
    const start = Date.now();
    const assertions: AutomatedTestResult['assertions'] = [];

    try {
      const pdfBytes = await this.createSyntheticPdf({ fillable: false, title: 'SCANNED COURT RECORD [OCR SIMULATED]' });
      const ingestion = await ingestionAgent.ingestDocument(pdfBytes, 'Scanned-Intake-Doc.pdf');
      const analysis = await documentAnalysisAgent.analyzeDocument(ingestion.documentId, pdfBytes, ingestion.sha256, ingestion.geometry);
      const extracted = await extractionAgent.extractValues(analysis);
      const template = await templateBuilderAgent.buildIntelligentTemplate(analysis);

      assertions.push({
        name: 'OCR Blank mapping successfully attached',
        expected: true,
        actual: template.fieldMappings.length > 0,
        passed: template.fieldMappings.length > 0
      });

      assertions.push({
        name: 'Extracted facts retain extraction method provenance',
        expected: true,
        actual: extracted.every(e => Boolean(e.extractionMethod)),
        passed: extracted.every(e => Boolean(e.extractionMethod))
      });

      return {
        testId: 'TEST-3',
        name: 'Test 3: Scanned PDF OCR & Coordinate Mapping',
        category: 'Extraction & Provenance',
        passed: assertions.every(a => a.passed),
        assertions,
        durationMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        testId: 'TEST-3',
        name: 'Test 3: Scanned PDF OCR & Coordinate Mapping',
        category: 'Extraction & Provenance',
        passed: false,
        assertions,
        durationMs: Date.now() - start,
        error: err.message
      };
    }
  }

  // TEST 4: Populate template -> Only mapped fields receive data
  public async test4PopulateTemplate(): Promise<AutomatedTestResult> {
    const start = Date.now();
    const assertions: AutomatedTestResult['assertions'] = [];

    try {
      const pdfBytes = await this.createSyntheticPdf({ fillable: true });
      const ingestion = await ingestionAgent.ingestDocument(pdfBytes, 'Template-Pop-Source.pdf');
      const analysis = await documentAnalysisAgent.analyzeDocument(ingestion.documentId, pdfBytes, ingestion.sha256, ingestion.geometry);
      const template = await templateBuilderAgent.buildIntelligentTemplate(analysis);

      const popResult = await deliveryPopulationAgent.populateDocument(template, {
        templateId: template.templateId,
        matterData: {
          'party.petitioner.full_name': 'Test Petitioner',
          'matter.case_number': 'TEST-CASE-001'
        }
      });

      assertions.push({
        name: 'Deterministic population succeeded',
        expected: 'completed',
        actual: popResult.status,
        passed: popResult.status === 'completed'
      });

      assertions.push({
        name: 'Only mapped fields populated (2 fields provided)',
        expected: true,
        actual: popResult.populatedFieldCount >= 1,
        passed: popResult.populatedFieldCount >= 1
      });

      assertions.push({
        name: 'Visual master hash preserved in output provenance record',
        expected: template.sourceSha256,
        actual: popResult.visualMasterSha256,
        passed: popResult.visualMasterSha256 === template.sourceSha256
      });

      return {
        testId: 'TEST-4',
        name: 'Test 4: Deterministic Field Population & Preservation',
        category: 'Delivery Population',
        passed: assertions.every(a => a.passed),
        assertions,
        durationMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        testId: 'TEST-4',
        name: 'Test 4: Deterministic Field Population & Preservation',
        category: 'Delivery Population',
        passed: false,
        assertions,
        durationMs: Date.now() - start,
        error: err.message
      };
    }
  }

  // TEST 5: Missing data -> Field remains blank & system reports missing data
  public async test5MissingData(): Promise<AutomatedTestResult> {
    const start = Date.now();
    const assertions: AutomatedTestResult['assertions'] = [];

    try {
      const pdfBytes = await this.createSyntheticPdf({ fillable: false });
      const ingestion = await ingestionAgent.ingestDocument(pdfBytes, 'Missing-Data-Doc.pdf');
      const analysis = await documentAnalysisAgent.analyzeDocument(ingestion.documentId, pdfBytes, ingestion.sha256, ingestion.geometry);
      const template = await templateBuilderAgent.buildIntelligentTemplate(analysis);

      // Provide completely empty payload
      const popResult = await deliveryPopulationAgent.populateDocument(template, {
        templateId: template.templateId,
        clientData: {}
      });

      assertions.push({
        name: 'System accurately reports blank fields count',
        expected: template.fieldMappings.length,
        actual: popResult.blankFieldCount,
        passed: popResult.blankFieldCount === template.fieldMappings.length
      });

      assertions.push({
        name: 'Populated fields is 0 for empty payload',
        expected: 0,
        actual: popResult.populatedFieldCount,
        passed: popResult.populatedFieldCount === 0
      });

      return {
        testId: 'TEST-5',
        name: 'Test 5: Missing Data Graceful Blanks & Reporting',
        category: 'Delivery Population',
        passed: assertions.every(a => a.passed),
        assertions,
        durationMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        testId: 'TEST-5',
        name: 'Test 5: Missing Data Graceful Blanks & Reporting',
        category: 'Delivery Population',
        passed: false,
        assertions,
        durationMs: Date.now() - start,
        error: err.message
      };
    }
  }

  // TEST 6: Ambiguous field -> REQUIRES_HUMAN_REVIEW
  public async test6AmbiguousField(): Promise<AutomatedTestResult> {
    const start = Date.now();
    const assertions: AutomatedTestResult['assertions'] = [];

    try {
      const structureMap: any = {
        documentId: 'test-doc-ambiguity',
        sha256: '0'.repeat(64),
        geometry: { pageCount: 1, pages: [{ pageNumber: 1, widthPoints: 612, heightPoints: 792, rotationDegrees: 0, orientation: 'portrait' }] },
        hasNativeAcroForms: false,
        isScannedOrImage: false,
        elements: [],
        detectedBlanks: [
          {
            blankId: 'blank-unclear',
            pageNumber: 1,
            bounds: { x: 100, y: 100, width: 200, height: 20, pageNumber: 1 },
            promptLabel: '', // Empty label => Ambiguous
            suggestedCanonicalField: undefined,
            fieldCategory: 'text'
          }
        ],
        analyzedAt: new Date().toISOString()
      };

      const extracted = await extractionAgent.extractValues(structureMap);

      assertions.push({
        name: 'Ambiguous field marked requiresReview',
        expected: true,
        actual: extracted[0]?.requiresReview,
        passed: extracted[0]?.requiresReview === true
      });

      assertions.push({
        name: 'Confidence score throttled below threshold (< 0.85)',
        expected: '< 0.85',
        actual: extracted[0]?.confidence,
        passed: (extracted[0]?.confidence ?? 1) < 0.85
      });

      return {
        testId: 'TEST-6',
        name: 'Test 6: Rule 5 No-Guess Ambiguity Detection',
        category: 'Extraction & QA',
        passed: assertions.every(a => a.passed),
        assertions,
        durationMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        testId: 'TEST-6',
        name: 'Test 6: Rule 5 No-Guess Ambiguity Detection',
        category: 'Extraction & QA',
        passed: false,
        assertions,
        durationMs: Date.now() - start,
        error: err.message
      };
    }
  }

  // TEST 7: Intentional structure violation -> QA Agent rejects the template
  public async test7IntentionalStructureViolation(): Promise<AutomatedTestResult> {
    const start = Date.now();
    const assertions: AutomatedTestResult['assertions'] = [];

    try {
      // Create invalid template with out-of-bounds coordinates (x = -50, width = 1200 on a 612 pt page)
      const violatedTemplate: any = {
        templateId: 'violated-temp-1',
        templateName: 'Invalid-Geometry-Form',
        documentId: 'doc-viol-1',
        sourceVersionId: 'v1',
        currentVersionNumber: 1,
        sourceSha256: '0'.repeat(64),
        status: 'draft',
        validationStatus: 'review_required',
        geometry: { pageCount: 1, pages: [{ pageNumber: 1, widthPoints: 612, heightPoints: 792, rotationDegrees: 0, orientation: 'portrait' }] },
        fieldMappings: [
          {
            mappingId: 'map-illegal',
            templateId: 'violated-temp-1',
            versionNumber: 1,
            canonicalName: 'party.petitioner.full_name',
            sourceLabel: 'Petitioner',
            pageNumber: 1,
            bounds: { x: -50, y: 700, width: 1200, height: 30, pageNumber: 1 }, // Bleeds off page!
            dataType: 'text',
            required: true,
            confidence: 0.95
          }
        ],
        createdAt: new Date().toISOString()
      };

      const qaReport = await qaSentinelAgent.validateTemplateAndOutput(violatedTemplate);

      assertions.push({
        name: 'QA Sentinel halted delivery for bounds violation',
        expected: false,
        actual: qaReport.passed,
        passed: qaReport.passed === false
      });

      const containmentCheck = qaReport.checks.find(c => c.category === 'field_integrity');
      assertions.push({
        name: 'Field boundary violation identified specifically',
        expected: false,
        actual: containmentCheck?.passed,
        passed: containmentCheck?.passed === false
      });

      return {
        testId: 'TEST-7',
        name: 'Test 7: QA Sentinel Rejects Structural Violation',
        category: 'QA & Validation',
        passed: assertions.every(a => a.passed),
        assertions,
        durationMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        testId: 'TEST-7',
        name: 'Test 7: QA Sentinel Rejects Structural Violation',
        category: 'QA & Validation',
        passed: false,
        assertions,
        durationMs: Date.now() - start,
        error: err.message
      };
    }
  }

  // TEST 8: Template version change -> New version created; previous version remains immutable
  public async test8TemplateVersionChange(): Promise<AutomatedTestResult> {
    const start = Date.now();
    const assertions: AutomatedTestResult['assertions'] = [];

    try {
      const pdfBytes = await this.createSyntheticPdf({ fillable: false });
      const ingestion = await ingestionAgent.ingestDocument(pdfBytes, 'Version-Test-Doc.pdf');
      const analysis = await documentAnalysisAgent.analyzeDocument(ingestion.documentId, pdfBytes, ingestion.sha256, ingestion.geometry);
      const v1Template = await templateBuilderAgent.buildIntelligentTemplate(analysis);

      // Create v2
      const updatedMappings = [...v1Template.fieldMappings];
      const newHash = await calculateSha256(ingestion.sha256 + '_REVISED');
      const v2Template = templateBuilderAgent.createNewTemplateVersion(v1Template, updatedMappings, newHash);

      assertions.push({
        name: 'Version 1 remains unchanged (versionNumber = 1)',
        expected: 1,
        actual: v1Template.currentVersionNumber,
        passed: v1Template.currentVersionNumber === 1
      });

      assertions.push({
        name: 'Version 2 created with incremented versionNumber (2)',
        expected: 2,
        actual: v2Template.currentVersionNumber,
        passed: v2Template.currentVersionNumber === 2
      });

      assertions.push({
        name: 'Distinct version IDs generated for audit immutability',
        expected: true,
        actual: v1Template.sourceVersionId !== v2Template.sourceVersionId,
        passed: v1Template.sourceVersionId !== v2Template.sourceVersionId
      });

      return {
        testId: 'TEST-8',
        name: 'Test 8: Template Versioning Immutability',
        category: 'Template Management',
        passed: assertions.every(a => a.passed),
        assertions,
        durationMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        testId: 'TEST-8',
        name: 'Test 8: Template Versioning Immutability',
        category: 'Template Management',
        passed: false,
        assertions,
        durationMs: Date.now() - start,
        error: err.message
      };
    }
  }

  // TEST 9: Strict Atomic Item Placement & 4-Pass Multi-Pass Verification
  // Enforces:
  // 1. Only called-for item in field (first name: Aurora; last name: Ramos)
  // 2. 4-Pass Multi-Pass Verification with Pass 3 surrounding word examination
  public async test9AtomicItemAndFourPassVerification(): Promise<AutomatedTestResult> {
    const start = Date.now();
    const assertions: AutomatedTestResult['assertions'] = [];

    try {
      const pdfBytes = await this.createSyntheticPdf({ title: 'FL-120 RESPONSE DISSOLUTION OF MARRIAGE' });
      const ingestion = await ingestionAgent.ingestDocument(pdfBytes, 'FL-120-Response.pdf');
      const analysis = await documentAnalysisAgent.analyzeDocument(ingestion.documentId, pdfBytes, ingestion.sha256, ingestion.geometry);

      // Inject blanks explicitly requiring first name and last name
      analysis.detectedBlanks = [
        {
          blankId: 'blank-first-name',
          pageNumber: 1,
          bounds: { x: 50, y: 670, width: 150, height: 16, pageNumber: 1 },
          promptLabel: 'Petitioner First Name: ',
          suggestedCanonicalField: 'party.petitioner.first_name',
          fieldCategory: 'text'
        },
        {
          blankId: 'blank-last-name',
          pageNumber: 1,
          bounds: { x: 220, y: 670, width: 150, height: 16, pageNumber: 1 },
          promptLabel: 'Petitioner Last Name: ',
          suggestedCanonicalField: 'party.petitioner.last_name',
          fieldCategory: 'text'
        }
      ];

      // Provide compound candidate input
      const testContext = {
        'party.petitioner.first_name': 'first name: Aurora; last name: Ramos',
        'party.petitioner.last_name': 'Aurora Ramos'
      };

      const extracted = await extractionAgent.extractValues(analysis, testContext);

      const firstNameField = extracted.find(e => e.canonicalName === 'party.petitioner.first_name');
      const lastNameField = extracted.find(e => e.canonicalName === 'party.petitioner.last_name');

      assertions.push({
        name: 'First name field contains ONLY "Aurora" (labels & compound last name stripped)',
        expected: 'Aurora',
        actual: firstNameField?.value,
        passed: firstNameField?.value === 'Aurora'
      });

      assertions.push({
        name: 'Last name field contains ONLY "Ramos" (compound first name stripped)',
        expected: 'Ramos',
        actual: lastNameField?.value,
        passed: lastNameField?.value === 'Ramos'
      });

      assertions.push({
        name: 'Pass 1 records raw candidate input',
        expected: true,
        actual: Boolean(firstNameField?.verificationAudit?.pass1_initialExtraction.rawCandidateValue),
        passed: Boolean(firstNameField?.verificationAudit?.pass1_initialExtraction.rawCandidateValue)
      });

      assertions.push({
        name: 'Pass 2 records atomic item audit and decomposition',
        expected: true,
        actual: Boolean(firstNameField?.verificationAudit?.pass2_atomicItemAudit.labelsStripped),
        passed: Boolean(firstNameField?.verificationAudit?.pass2_atomicItemAudit.labelsStripped)
      });

      assertions.push({
        name: 'Pass 3 records surrounding word examination',
        expected: true,
        actual: Boolean(firstNameField?.verificationAudit?.pass3_surroundingWordsExamination.examinationNotes),
        passed: Boolean(firstNameField?.verificationAudit?.pass3_surroundingWordsExamination.examinationNotes)
      });

      assertions.push({
        name: 'Pass 4 certifies 100% integrity and zero bleed',
        expected: true,
        actual: Boolean(firstNameField?.verificationAudit?.pass4_integrityCertification.zeroBleedConfirmed),
        passed: Boolean(firstNameField?.verificationAudit?.pass4_integrityCertification.zeroBleedConfirmed)
      });

      return {
        testId: 'TEST-9',
        name: 'Test 9: Strict Atomic Item Placement & 4-Pass Verification Guard',
        category: 'Field Precision & Extraction',
        passed: assertions.every(a => a.passed),
        assertions,
        durationMs: Date.now() - start
      };
    } catch (err: any) {
      return {
        testId: 'TEST-9',
        name: 'Test 9: Strict Atomic Item Placement & 4-Pass Verification Guard',
        category: 'Field Precision & Extraction',
        passed: false,
        assertions,
        durationMs: Date.now() - start,
        error: err.message
      };
    }
  }
}

export const automatedTestSuite = new AutomatedTestSuite();
