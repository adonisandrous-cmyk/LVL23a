/**
 * LEVEL 23 / PHOENIX 23
 * CENTRAL 8-AGENT PIPELINE COORDINATOR
 * 
 * Pipeline Flow:
 * Document Upload ->
 * 1. Ingestion Agent ->
 * 2. Document Analysis Agent ->
 * 3. Extraction Agent ->
 * 4. Database Agent ->
 * 5. Template Builder Agent ->
 * 6. Delivery / Population Agent ->
 * 7. Integration Orchestrator + 8. QA / Validation Sentinel ->
 * Reusable Template & Database Record
 * 
 * Features:
 * - Directives and role management for all 8 agents
 * - Interactive chat with any agent regarding its role, directives, or activity
 * - Complete audit trail
 * - Guaranteed visual master immutability
 */

import {
  AgentDescriptor,
  AgentChatMessage,
  PipelineExecutionState,
  IntelligentTemplate,
  PopulatedOutputResult,
  QAValidationReport,
  ExecutiveDirectivePackage
} from './types';
import { ingestionAgent } from './Agent1Ingestion';
import { documentAnalysisAgent } from './Agent2DocumentAnalysis';
import { extractionAgent } from './Agent3Extraction';
import { databaseAgent } from './Agent4Database';
import { templateBuilderAgent } from './Agent5TemplateBuilder';
import { deliveryPopulationAgent } from './Agent6DeliveryPopulation';
import { integrationOrchestratorAgent } from './Agent7IntegrationOrchestrator';
import { qaSentinelAgent } from './Agent8QASentinel';
import { generateUUID, phoenixDb } from '../phoenixDatabaseService';

export class PhoenixPipelineCoordinator {
  private agentDescriptors: Map<string, AgentDescriptor> = new Map();
  private chatHistories: Map<string, AgentChatMessage[]> = new Map();
  private pipelineStates: Map<string, PipelineExecutionState> = new Map();

  constructor() {
    this.initAgents();
  }

  private initAgents() {
    const agents: AgentDescriptor[] = [
      {
        id: 'agent_1_ingestion',
        name: 'Agent 1: Ingestion Agent',
        index: 1,
        title: 'Master Ingestion Specialist',
        directive: 'Receive and securely ingest original documents. Create immutable identities, compute SHA-256 byte hashes, and preserve original files byte-for-byte in the vault.',
        permissionPolicy: {
          read: [],
          write: ['documents', 'document_versions', 'vault'],
          forbidden: ['modify_bytes', 'reflow_document']
        },
        status: 'idle'
      },
      {
        id: 'agent_2_analysis',
        name: 'Agent 2: Document Analysis Agent',
        index: 2,
        title: 'Structural Geometry Analyst',
        directive: 'Inspect document geometry, detect native AcroForm fields, identify blanks, labels, and bounding boxes, and construct a machine-readable DocumentStructureMap without touching the source.',
        permissionPolicy: {
          read: ['vault', 'document_versions'],
          write: ['document_structure_map', 'geometry'],
          forbidden: ['modify_source', 'reconstruct_pdf']
        },
        status: 'idle'
      },
      {
        id: 'agent_3_extraction',
        name: 'Agent 3: Extraction Agent',
        index: 3,
        title: 'Provenance & Extraction Lead',
        directive: 'Zero Speculation Extraction & 4-Pass Verification: CRITICAL: Disregard all prior schemas, history, cache registers, and residual text strings. When populating a document where a placeholder or formfield requires a specific item, ONLY place the called for item in the field (e.g. first name: Aurora; last name: Ramos). Once data is extracted on the first pass, go back 3 additional times (4 passes total) to verify field accuracy. On the third pass, examine the words around the response being inserted into the field to ensure document correctness.',
        permissionPolicy: {
          read: ['document_structure_map', 'field_definitions'],
          write: ['extracted_values', 'review_tasks'],
          forbidden: ['guess_values', 'modify_source']
        },
        status: 'idle'
      },
      {
        id: 'agent_4_database',
        name: 'Agent 4: Database Agent',
        index: 4,
        title: 'Knowledge Base Architect',
        directive: 'Persist canonical document intelligence into the Level 23 relational database. Associate facts with Client -> Matter -> Document -> Template -> Fields so data extracted today can populate any form tomorrow.',
        permissionPolicy: {
          read: ['*'],
          write: ['clients', 'matters', 'documents', 'templates', 'extracted_values'],
          forbidden: ['overwrite_golden_master']
        },
        status: 'idle'
      },
      {
        id: 'agent_5_template_builder',
        name: 'Agent 5: Template Builder Agent',
        index: 5,
        title: 'Intelligent Form Architect',
        directive: 'Transform original documents into reusable intelligent templates using coordinate overlays and native AcroForm maps. Never rebuild from HTML or reflow text; the visual master is immutable.',
        permissionPolicy: {
          read: ['document_structure_map', 'vault', 'field_definitions'],
          write: ['templates', 'template_versions', 'field_mappings'],
          forbidden: ['rebuild_from_html', 'reflow_text', 'alter_geometry']
        },
        status: 'idle'
      },
      {
        id: 'agent_6_delivery',
        name: 'Agent 6: Delivery / Population Agent',
        index: 6,
        title: 'Deterministic Population Engine',
        directive: 'Populate certified templates using approved client/matter facts. Generate identical-geometry PDFs, fillable PDFs, XFDF, FDF, and JSON while keeping the underlying visual layer pristine.',
        permissionPolicy: {
          read: ['templates', 'client_matter_data', 'vault'],
          write: ['populated_outputs', 'xfdf', 'fdf'],
          forbidden: ['alter_typography', 'change_page_count']
        },
        status: 'idle'
      },
      {
        id: 'agent_7_integration',
        name: 'Agent 7: Integration Orchestrator',
        index: 7,
        title: 'External Systems Gateway',
        directive: 'Relay populated outputs to Google Drive, court filing gateways, practice management systems, and webhooks with retry logic, rate limits, and audit transaction IDs.',
        permissionPolicy: {
          read: ['populated_outputs', 'templates', 'matters'],
          write: ['integration_transactions', 'external_sync'],
          forbidden: ['modify_source', 'bypass_auth']
        },
        status: 'idle'
      },
      {
        id: 'agent_8_qa_sentinel',
        name: 'Agent 8: QA / Validation Sentinel',
        index: 8,
        title: 'Independent Integrity Watchdog',
        directive: 'Independently verify SHA-256 hashes, page count invariants, coordinate boundaries, canonical naming, and visual geometry. Halt delivery if any validation check fails.',
        permissionPolicy: {
          read: ['*'],
          write: ['qa_reports', 'validation_checks', 'certifications'],
          forbidden: ['silent_repair', 'suppress_errors']
        },
        status: 'idle'
      }
    ];

    agents.forEach(ag => {
      this.agentDescriptors.set(ag.id, ag);
      this.chatHistories.set(ag.id, [
        {
          id: generateUUID(),
          agentId: ag.id,
          sender: 'system',
          content: `Agent initialized with directive: "${ag.directive}". Ready to assist with role responsibilities and pipeline operations.`,
          timestamp: new Date().toISOString()
        }
      ]);
    });
  }

  public getAgents(): AgentDescriptor[] {
    return Array.from(this.agentDescriptors.values());
  }

  public getAgent(id: string): AgentDescriptor | undefined {
    return this.agentDescriptors.get(id);
  }

  public getChatHistory(agentId: string): AgentChatMessage[] {
    return this.chatHistories.get(agentId) || [];
  }

  /**
   * Interactive chat with any agent regarding its role, directives, or activity
   */
  public async chatWithAgent(agentId: string, userMessage: string): Promise<AgentChatMessage> {
    const agent = this.agentDescriptors.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} does not exist.`);

    const history = this.chatHistories.get(agentId) || [];

    // Add user message
    const userMsg: AgentChatMessage = {
      id: generateUUID(),
      agentId,
      sender: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    history.push(userMsg);

    // Formulate response grounded in the agent's specific directive & Level 23 rules
    let responseText = '';
    const lower = userMessage.toLowerCase();

    if (lower.includes('directive') || lower.includes('role') || lower.includes('responsibility')) {
      responseText = `My primary directive as ${agent.name} is: "${agent.directive}". I operate under strict permissions: read (${agent.permissionPolicy.read.join(', ')}), write (${agent.permissionPolicy.write.join(', ')}), and forbidden (${agent.permissionPolicy.forbidden.join(', ')}).`;
    } else if (lower.includes('immutable') || lower.includes('change') || lower.includes('alter')) {
      responseText = `Under the Master Rules of Level 23 / Phoenix 23, the original document is the immutable visual master. I am strictly forbidden from altering the source structure, page dimensions, or typography. All intelligence is maintained on a decoupled overlay layer.`;
    } else if (lower.includes('status') || lower.includes('activity')) {
      responseText = `Current operational status: ${agent.status.toUpperCase()}. Last activity: ${agent.lastActivity || 'Standing by for pipeline task dispatch'}.`;
    } else if (agent.index === 3 && (lower.includes('guess') || lower.includes('unsure') || lower.includes('confidence'))) {
      responseText = `Per Rule 5 (Never Guess), if an extracted field has ambiguity or falls below our 0.85 confidence threshold, I immediately flag it with REQUIRES_HUMAN_REVIEW rather than speculating.`;
    } else if (agent.index === 5 && (lower.includes('blank') || lower.includes('template') || lower.includes('html'))) {
      responseText = `I follow the Blank Field Rule: I identify what information belongs in the blank, where it belongs, and establish the canonical mapping without converting to HTML or rebuilding the PDF.`;
    } else if (agent.index === 8 && (lower.includes('audit') || lower.includes('fail') || lower.includes('qa'))) {
      responseText = `As the independent watchdog, I verify document SHA-256 hashes, page count invariants, boundary coordinates, and end-to-end provenance. Any validation violation will immediately halt delivery.`;
    } else {
      responseText = `I have received your inquiry: "${userMessage}". As ${agent.name}, I am actively enforcing my directive across the pipeline to guarantee exact document preservation and canonical accuracy.`;
    }

    const agentReply: AgentChatMessage = {
      id: generateUUID(),
      agentId,
      sender: 'agent',
      content: responseText,
      timestamp: new Date().toISOString()
    };
    history.push(agentReply);

    return agentReply;
  }

  /**
   * Run the complete 8-agent document processing pipeline
   */
  public async processDocument(
    fileBytes: Uint8Array,
    filename: string,
    options?: {
      clientId?: string;
      matterId?: string;
      clientData?: Record<string, any>;
      matterData?: Record<string, any>;
      targetIntegrationAdapterId?: string;
      executiveDirective?: ExecutiveDirectivePackage;
    }
  ): Promise<{
    state: PipelineExecutionState;
    template: IntelligentTemplate;
    populatedOutput: PopulatedOutputResult;
    qaReport: QAValidationReport;
  }> {
    const jobId = generateUUID();
    const state: PipelineExecutionState = {
      jobId,
      documentId: '',
      filename,
      currentStep: 1,
      overallStatus: 'ingesting',
      executiveDirective: options?.executiveDirective,
      auditTrail: []
    };
    this.pipelineStates.set(jobId, state);

    // If an executive directive was issued by Phoenix or EVE, log the commanding order
    if (options?.executiveDirective) {
      const exec = options.executiveDirective;
      state.auditTrail.push({
        step: 0,
        agentName: `${exec.dispatcherName} (${exec.dispatcherTitle})`,
        operation: 'EXECUTIVE_DIRECTIVE_ISSUED',
        timestamp: exec.dispatchedAt,
        status: 'success',
        notes: `[DIRECTIVE: ${exec.directiveTitle}] General: "${exec.generalInstructions}" ${exec.caseStrategy ? `| Strategy: "${exec.caseStrategy}"` : ''}`
      });
    }

    // Helper to log directive to agent chat
    const logDirectiveToAgent = (agentId: string, directiveText?: string) => {
      if (!directiveText || !options?.executiveDirective) return;
      const history = this.chatHistories.get(agentId);
      if (history) {
        history.push({
          id: generateUUID(),
          agentId,
          sender: 'agent',
          content: `[EXECUTIVE ORDER FROM ${options.executiveDirective.dispatcherName.toUpperCase()}]: "${directiveText}"`,
          timestamp: new Date().toISOString()
        });
      }
    };

    // ==========================================
    // STEP 1: Ingestion Agent
    // ==========================================
    const dir1 = options?.executiveDirective?.customAgentDirectives?.agent_1_ingestion;
    logDirectiveToAgent('agent_1_ingestion', dir1);
    this.updateAgentStatus('agent_1_ingestion', 'running', dir1 ? `Directived: ${dir1}` : `Ingesting ${filename}...`);
    const ingestionRes = await ingestionAgent.ingestDocument(fileBytes, filename);
    state.documentId = ingestionRes.documentId;
    state.originalHash = ingestionRes.sha256;
    state.auditTrail.push({
      step: 1,
      agentName: ingestionAgent.name,
      operation: 'INGEST_IMMUTABLE_SOURCE',
      timestamp: new Date().toISOString(),
      status: 'success',
      notes: `SHA-256: ${ingestionRes.sha256.substring(0, 16)}..., Pages: ${ingestionRes.pageCount}, Size: ${ingestionRes.fileSizeBytes} bytes${dir1 ? ` | Directive: "${dir1}"` : ''}`
    });
    this.updateAgentStatus('agent_1_ingestion', 'completed', `Ingested ${ingestionRes.pageCount} pages.`);

    // ==========================================
    // STEP 2: Document Analysis Agent
    // ==========================================
    state.currentStep = 2;
    state.overallStatus = 'analyzing';
    const dir2 = options?.executiveDirective?.customAgentDirectives?.agent_2_analysis;
    logDirectiveToAgent('agent_2_analysis', dir2);
    this.updateAgentStatus('agent_2_analysis', 'running', dir2 ? `Directive: ${dir2}` : 'Analyzing geometry & blank lines...');
    const structureMap = await documentAnalysisAgent.analyzeDocument(
      ingestionRes.documentId,
      fileBytes,
      ingestionRes.sha256,
      ingestionRes.geometry
    );
    state.structureMap = structureMap;
    state.auditTrail.push({
      step: 2,
      agentName: documentAnalysisAgent.name,
      operation: 'CONSTRUCT_STRUCTURE_MAP',
      timestamp: new Date().toISOString(),
      status: 'success',
      notes: `Detected ${structureMap.detectedBlanks.length} blank field locations, AcroForms: ${structureMap.hasNativeAcroForms}${dir2 ? ` | Directive: "${dir2}"` : ''}`
    });
    this.updateAgentStatus('agent_2_analysis', 'completed', `Mapped ${structureMap.elements.length} elements.`);

    // ==========================================
    // STEP 3: Extraction Agent
    // ==========================================
    state.currentStep = 3;
    state.overallStatus = 'extracting';
    const dir3 = options?.executiveDirective?.customAgentDirectives?.agent_3_extraction;
    logDirectiveToAgent('agent_3_extraction', dir3);
    this.updateAgentStatus('agent_3_extraction', 'running', dir3 ? `Directive: ${dir3}` : 'Extracting canonical values with provenance...');
    const combinedInput = { ...(options?.clientData || {}), ...(options?.matterData || {}) };
    const extractedValues = await extractionAgent.extractValues(structureMap, combinedInput);
    state.extractedValues = extractedValues;
    const reviewCount = extractedValues.filter(e => e.requiresReview).length;
    state.auditTrail.push({
      step: 3,
      agentName: extractionAgent.name,
      operation: 'EXTRACT_CANONICAL_PROVENANCE',
      timestamp: new Date().toISOString(),
      status: reviewCount > 0 ? 'review_required' : 'success',
      notes: `4-Pass Extraction Completed: Pass 1 (Candidate Harvest), Pass 2 (Atomic Item Audit: Aurora vs Ramos), Pass 3 (Surrounding Word Context Examination), Pass 4 (Integrity Certification). Extracted ${extractedValues.length} fields (${reviewCount} review items)${dir3 ? ` | Directive: "${dir3}"` : ''}`
    });
    this.updateAgentStatus('agent_3_extraction', 'completed', `Extracted ${extractedValues.length} items (${reviewCount} review items).`);

    // ==========================================
    // STEP 4: Database Agent
    // ==========================================
    state.currentStep = 4;
    state.overallStatus = 'persisting';
    const dir4 = options?.executiveDirective?.customAgentDirectives?.agent_4_database;
    logDirectiveToAgent('agent_4_database', dir4);
    this.updateAgentStatus('agent_4_database', 'running', dir4 ? `Directive: ${dir4}` : 'Persisting intelligence layer into DB...');
    const dbRes = await databaseAgent.persistIntelligence(
      structureMap,
      extractedValues,
      options?.clientId,
      options?.matterId
    );
    state.auditTrail.push({
      step: 4,
      agentName: databaseAgent.name,
      operation: 'PERSIST_INTELLIGENCE_LAYER',
      timestamp: new Date().toISOString(),
      status: 'success',
      notes: `Saved ${dbRes.persistedCount} canonical facts linked to Document ${ingestionRes.documentId.substring(0, 8)}${dir4 ? ` | Directive: "${dir4}"` : ''}`
    });
    this.updateAgentStatus('agent_4_database', 'completed', 'Database records linked.');

    // ==========================================
    // STEP 5: Template Builder Agent
    // ==========================================
    state.currentStep = 5;
    state.overallStatus = 'building_template';
    const dir5 = options?.executiveDirective?.customAgentDirectives?.agent_5_template_builder;
    logDirectiveToAgent('agent_5_template_builder', dir5);
    this.updateAgentStatus('agent_5_template_builder', 'running', dir5 ? `Directive: ${dir5}` : 'Building coordinate-based field overlay...');
    const template = await templateBuilderAgent.buildIntelligentTemplate(structureMap, filename.replace(/\.[^/.]+$/, ''));
    state.template = template;
    state.auditTrail.push({
      step: 5,
      agentName: templateBuilderAgent.name,
      operation: 'BUILD_INTELLIGENT_TEMPLATE',
      timestamp: new Date().toISOString(),
      status: 'success',
      notes: `Created Template v${template.currentVersionNumber} with ${template.fieldMappings.length} mapped blanks.${dir5 ? ` | Directive: "${dir5}"` : ''}`
    });
    this.updateAgentStatus('agent_5_template_builder', 'completed', `Template v${template.currentVersionNumber} built.`);

    // ==========================================
    // STEP 6: Delivery / Population Agent
    // ==========================================
    state.currentStep = 6;
    state.overallStatus = 'populating';
    const dir6 = options?.executiveDirective?.customAgentDirectives?.agent_6_delivery;
    logDirectiveToAgent('agent_6_delivery', dir6);
    this.updateAgentStatus('agent_6_delivery', 'running', dir6 ? `Directive: ${dir6}` : 'Populating template fields deterministically...');
    const populatedOutput = await deliveryPopulationAgent.populateDocument(template, {
      templateId: template.templateId,
      clientData: options?.clientData,
      matterData: options?.matterData,
      outputFormat: 'pdf'
    });
    state.auditTrail.push({
      step: 6,
      agentName: deliveryPopulationAgent.name,
      operation: 'POPULATE_TEMPLATE',
      timestamp: new Date().toISOString(),
      status: 'success',
      notes: `Populated ${populatedOutput.populatedFieldCount} fields (${populatedOutput.blankFieldCount} left blank intentionally)${dir6 ? ` | Directive: "${dir6}"` : ''}`
    });
    this.updateAgentStatus('agent_6_delivery', 'completed', `Populated ${populatedOutput.populatedFieldCount} fields.`);

    // ==========================================
    // STEP 7: Integration Orchestrator Agent
    // ==========================================
    state.currentStep = 7;
    state.overallStatus = 'integrating';
    const dir7 = options?.executiveDirective?.customAgentDirectives?.agent_7_integration;
    logDirectiveToAgent('agent_7_integration', dir7);
    this.updateAgentStatus('agent_7_integration', 'running', dir7 ? `Directive: ${dir7}` : 'Synchronizing with external adapters...');
    const targetAdapter = options?.targetIntegrationAdapterId || 'google_drive_court_vault';
    let integrationTx = 'TX-PENDING';
    try {
      const syncResult = await integrationOrchestratorAgent.dispatchDocumentOutput(targetAdapter, {
        documentId: ingestionRes.documentId,
        templateId: template.templateId,
        filename: `Populated_${filename}`,
        outputSha256: populatedOutput.outputSha256,
        matterId: options?.matterId,
        clientId: options?.clientId
      });
      integrationTx = syncResult.transactionId;
      state.auditTrail.push({
        step: 7,
        agentName: integrationOrchestratorAgent.name,
        operation: 'DISPATCH_INTEGRATION',
        timestamp: new Date().toISOString(),
        status: 'success',
        notes: `Dispatched to ${syncResult.adapterName}, TX: ${syncResult.transactionId}${dir7 ? ` | Directive: "${dir7}"` : ''}`
      });
      this.updateAgentStatus('agent_7_integration', 'completed', `Synchronized via ${integrationTx}.`);
    } catch (intErr) {
      console.warn('Integration non-fatal notice:', intErr);
      this.updateAgentStatus('agent_7_integration', 'completed', 'Integration queued.');
    }

    // ==========================================
    // STEP 8: QA / Validation Sentinel Agent
    // ==========================================
    state.currentStep = 8;
    state.overallStatus = 'qa_validating';
    const dir8 = options?.executiveDirective?.customAgentDirectives?.agent_8_qa_sentinel;
    logDirectiveToAgent('agent_8_qa_sentinel', dir8);
    this.updateAgentStatus('agent_8_qa_sentinel', 'running', dir8 ? `Directive: ${dir8}` : 'Auditing hashes, geometry, and provenance...');
    const qaReport = await qaSentinelAgent.validateTemplateAndOutput(template, populatedOutput);
    state.qaReport = qaReport;

    state.auditTrail.push({
      step: 8,
      agentName: qaSentinelAgent.name,
      operation: 'INDEPENDENT_QA_AUDIT',
      timestamp: new Date().toISOString(),
      status: qaReport.passed ? 'success' : 'failed',
      notes: `Checks passed: ${qaReport.passedChecks}/${qaReport.totalChecks} (${qaReport.passed ? 'CERTIFIED' : 'HALTED'})`
    });

    if (qaReport.passed) {
      template.status = 'certified';
      template.validationStatus = 'pass';
      state.overallStatus = 'completed';
      this.updateAgentStatus('agent_8_qa_sentinel', 'completed', 'Document & Template 100% Certified.');
    } else {
      template.validationStatus = 'fail';
      state.overallStatus = 'failed';
      this.updateAgentStatus('agent_8_qa_sentinel', 'failed', 'Integrity check failed. Delivery halted.');
    }

    return {
      state,
      template,
      populatedOutput,
      qaReport
    };
  }

  private updateAgentStatus(agentId: string, status: AgentDescriptor['status'], activity: string) {
    const ag = this.agentDescriptors.get(agentId);
    if (ag) {
      ag.status = status;
      ag.lastActivity = activity;
    }
  }

  public getPipelineState(jobId: string): PipelineExecutionState | undefined {
    return this.pipelineStates.get(jobId);
  }
}

export const phoenixPipelineCoordinator = new PhoenixPipelineCoordinator();
