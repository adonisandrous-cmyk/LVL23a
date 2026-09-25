/**
 * LEVEL 23 / PHOENIX 23
 * EXECUTIVE PIPELINE BRIDGE: PHOENIX & EVE DISPATCHER
 * 
 * Empowers Phoenix (Managing Partner & Lead Legal Strategist) and
 * EVE (Director of Legal Operations & Executive Intake Lead) to:
 * 1. Hand documents to the 8-Agent Document Automation Pipeline.
 * 2. Issue authoritative executive directives & instructions to the pipeline agents.
 * 3. Oversee real-time execution, monitor QA Sentinel integrity, and receive populated deliverables.
 */

import { phoenixPipelineCoordinator } from './PhoenixPipelineCoordinator';
import { ExecutiveDirectivePackage, PipelineExecutionState, IntelligentTemplate, PopulatedOutputResult, QAValidationReport } from './types';
import { generateUUID } from '../phoenixDatabaseService';

export interface ExecutiveDispatchPayload {
  dispatcher: 'phoenix' | 'eve';
  documentName: string;
  documentBytes?: Uint8Array;
  documentBase64?: string;
  directiveTitle: string;
  generalInstructions: string;
  caseStrategy?: string;
  clientId?: string;
  clientName?: string;
  matterId?: string;
  caseNumber?: string;
  courtCounty?: string;
  clientData?: Record<string, any>;
  matterData?: Record<string, any>;
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
}

export interface ExecutiveDispatchResult {
  jobId: string;
  documentId: string;
  dispatcher: 'phoenix' | 'eve';
  dispatcherName: string;
  dispatcherTitle?: string;
  documentName?: string;
  directiveTitle: string;
  state: PipelineExecutionState;
  template: IntelligentTemplate;
  populatedOutput: PopulatedOutputResult;
  qaReport: QAValidationReport;
  executiveSummary: string;
}

export class ExecutivePipelineBridgeService {
  /**
   * Phoenix Default Directive Preset:
   * Focused on trial strategy, pleading accuracy, property characterization, and strict QA visual invariants.
   */
  public getPhoenixDefaultDirectives(params?: { caseNumber?: string; clientName?: string }): ExecutiveDirectivePackage {
    return {
      dispatcherAgent: 'phoenix',
      dispatcherName: 'Phoenix',
      dispatcherTitle: 'Managing Partner & Senior Legal Strategist',
      directiveTitle: 'Litigation Master Directive: Exact Coordinate Pleading Mapping',
      generalInstructions: 'Preserve underlying court pleading geometry byte-for-byte. Extract petitioner/respondent designations, relief requests, and case numbers. Do not guess on contested facts; flag all ambiguities for counsel review.',
      caseStrategy: 'Prepare court-admissible California Judicial Council pleading overlay. Ensure all signature blocks, court captions, and checkbox matrices retain exact millimeter alignment.',
      matterReference: {
        clientName: params?.clientName || 'Eleanor Vance',
        caseNumber: params?.caseNumber || '24FL-009412',
        courtCounty: 'Orange County'
      },
      customAgentDirectives: {
        agent_1_ingestion: 'Ingest immutable visual master; calculate and vault SHA-256 fingerprint.',
        agent_2_analysis: 'Analyze structural bounding boxes, AcroForm fields, and blank lines without altering source.',
        agent_3_extraction: 'Extract key litigation parties, case number, filing dates; apply Rule 5 No-Guess review policy.',
        agent_4_database: 'Relate facts to Client and Matter ledger under canonical legal field ontology.',
        agent_5_template_builder: 'Generate precision coordinate-based overlays. Zero HTML conversion or reflow permitted.',
        agent_6_delivery: 'Generate deterministic populated PDF, Adobe XFDF, and JSON field map outputs.',
        agent_7_integration: 'Stage completed files in designated Google Drive folder "phoenix_review".',
        agent_8_qa_sentinel: 'Perform independent verification of page geometry, hashes, and boundary containment.'
      },
      dispatchedAt: new Date().toISOString()
    };
  }

  /**
   * EVE Default Directive Preset:
   * Focused on comprehensive client onboarding, 16-point intake matrix, identity verification, and multi-document consistency.
   */
  public getEveDefaultDirectives(params?: { clientName?: string; caseNumber?: string }): ExecutiveDirectivePackage {
    return {
      dispatcherAgent: 'eve',
      dispatcherName: 'EVE',
      dispatcherTitle: 'Director of Legal Operations & Executive Intake Lead',
      directiveTitle: 'Executive Intake Directive: Full Dossier & Fact Matrix Ingestion',
      generalInstructions: 'Process incoming client documentation into structured intake records. Extract verified identity, contact parameters, children dates of birth, marriage/separation statistical facts, and jurisdictional residency.',
      caseStrategy: 'Consolidate raw client documents into reusable template forms. Cross-check extracted names against conflict checks and database rosters.',
      matterReference: {
        clientName: params?.clientName || 'Eleanor Vance',
        caseNumber: params?.caseNumber || '24FL-009412',
        courtCounty: 'Orange County'
      },
      customAgentDirectives: {
        agent_1_ingestion: 'Securely intake client onboarding packet; verify MIME and byte integrity.',
        agent_2_analysis: 'Detect all form blanks, table cells, and checkbox groups for 16-point intake mapping.',
        agent_3_extraction: 'Extract client biographical details, addresses, and family stats with full provenance.',
        agent_4_database: 'Persist facts into Level 23 Client Repository for multi-form reuse.',
        agent_5_template_builder: 'Map blanks to canonical fields (e.g. party.petitioner.full_name, person.dob).',
        agent_6_delivery: 'Generate pre-filled intake verification packet and standard Judicial Council draft.',
        agent_7_integration: 'Sync to Google Workspace Drive, Calendar deadlines, and Keep notes.',
        agent_8_qa_sentinel: 'Certify zero missing required fields and verify client data validity.'
      },
      dispatchedAt: new Date().toISOString()
    };
  }

  /**
   * Hand a document and authoritative directives to the 8-Agent Pipeline
   */
  public async dispatchDocument(payload: ExecutiveDispatchPayload): Promise<ExecutiveDispatchResult> {
    const isPhoenix = payload.dispatcher === 'phoenix';
    const dispatcherName = isPhoenix ? 'Phoenix' : 'EVE';
    const dispatcherTitle = isPhoenix
      ? 'Managing Partner & Senior Legal Strategist'
      : 'Director of Legal Operations & Executive Intake Lead';

    // 1. Build authoritative directive package
    const directivePackage: ExecutiveDirectivePackage = {
      dispatcherAgent: payload.dispatcher,
      dispatcherName,
      dispatcherTitle,
      directiveTitle: payload.directiveTitle,
      generalInstructions: payload.generalInstructions,
      caseStrategy: payload.caseStrategy,
      matterReference: {
        clientId: payload.clientId,
        clientName: payload.clientName,
        matterId: payload.matterId,
        caseNumber: payload.caseNumber,
        courtCounty: payload.courtCounty
      },
      customAgentDirectives: payload.customAgentDirectives || (
        isPhoenix
          ? this.getPhoenixDefaultDirectives({ caseNumber: payload.caseNumber, clientName: payload.clientName }).customAgentDirectives
          : this.getEveDefaultDirectives({ caseNumber: payload.caseNumber, clientName: payload.clientName }).customAgentDirectives
      ),
      dispatchedAt: new Date().toISOString()
    };

    // 2. Prepare file bytes (either provided, decoded from base64, or clean synthetic standard)
    let bytes: Uint8Array;
    if (payload.documentBytes) {
      bytes = payload.documentBytes;
    } else if (payload.documentBase64) {
      const cleaned = payload.documentBase64.replace(/^data:.*?;base64,/, '');
      bytes = new Uint8Array(Buffer.from(cleaned, 'base64'));
    } else {
      // Create clean standard PDF header byte stream
      const docHeader = `%PDF-1.4\n%Level23 Immutable Visual Master (Dispatched by ${dispatcherName})\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF`;
      bytes = new Uint8Array(docHeader.split('').map(c => c.charCodeAt(0)));
    }

    // 3. Prepare client and matter facts
    const clientData: Record<string, any> = {
      'party.petitioner.full_name': payload.clientName || 'Eleanor Vance',
      'person.full_name': payload.clientName || 'Eleanor Vance',
      'party.respondent.full_name': 'Jonathan Vance',
      'matter.case_number': payload.caseNumber || '24FL-009412',
      'court.county': payload.courtCounty || 'Orange County',
      ...(payload.clientData || {})
    };

    const matterData: Record<string, any> = {
      'court.name': 'Superior Court of California',
      'legal.date': new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      ...(payload.matterData || {})
    };

    // 4. Dispatch to the 8-Agent Pipeline Coordinator with the Executive Directive
    const pipelineResult = await phoenixPipelineCoordinator.processDocument(bytes, payload.documentName, {
      clientId: payload.clientId,
      matterId: payload.matterId,
      clientData,
      matterData,
      executiveDirective: directivePackage
    });

    // 5. Generate executive summary from the dispatcher's perspective
    const summary = isPhoenix
      ? `[PHOENIX EXECUTIVE BRIEF]: Successfully dispatched "${payload.documentName}" to the 8-agent document pipeline under Directive "${payload.directiveTitle}". The Visual Master (SHA-256: ${pipelineResult.state.originalHash?.substring(0, 12)}...) is certified byte-for-byte immutable. Identified ${pipelineResult.template.fieldMappings.length} blank field coordinates. QA Sentinel certification: ${pipelineResult.qaReport.passed ? 'PASSED (Zero Boundary Deviation)' : 'HALTED'}. Populated ${pipelineResult.populatedOutput.populatedFieldCount} court-ready fields. Reusable template "${pipelineResult.template.templateName}" is stored in the database.`
      : `[EVE OPERATIONS DISPATCH]: Processed intake document "${payload.documentName}" across the 8-agent pipeline under Directive "${payload.directiveTitle}". Client facts linked for "${payload.clientName || 'Eleanor Vance'}". Generated ${pipelineResult.template.fieldMappings.length} canonical mappings with full provenance. Output deliverables (PDF, XFDF, JSON) staged in the pipeline vault for future automation.`;

    return {
      jobId: pipelineResult.state.jobId,
      documentId: pipelineResult.state.documentId,
      dispatcher: payload.dispatcher,
      dispatcherName,
      dispatcherTitle,
      documentName: payload.documentName,
      directiveTitle: payload.directiveTitle,
      state: pipelineResult.state,
      template: pipelineResult.template,
      populatedOutput: pipelineResult.populatedOutput,
      qaReport: pipelineResult.qaReport,
      executiveSummary: summary
    };
  }
}

export const executivePipelineBridge = new ExecutivePipelineBridgeService();
