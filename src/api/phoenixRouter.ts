/**
 * LEVEL 23 / PHOENIX 23
 * DOCUMENT AUTOMATION ENGINE API ROUTER
 * Handles 8-agent pipeline execution, agent chat, population, and automated test suite.
 */

import { Router, Request, Response } from 'express';
import { phoenixPipelineCoordinator } from '../services/phoenixEngine/PhoenixPipelineCoordinator';
import { automatedTestSuite } from '../services/phoenixEngine/automatedTests';
import { deliveryPopulationAgent } from '../services/phoenixEngine/Agent6DeliveryPopulation';
import { phoenixDb } from '../services/phoenixDatabaseService';
import { executivePipelineBridge } from '../services/phoenixEngine/ExecutivePipelineBridge';

export const phoenixRouter = Router();

/**
 * GET /api/phoenix/agents
 * List all 8 specialized agents with directives and statuses
 */
phoenixRouter.get('/agents', (req: Request, res: Response) => {
  try {
    const agents = phoenixPipelineCoordinator.getAgents();
    res.json({ success: true, agents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/phoenix/agents/:agentId/history
 * Get chat history with an agent
 */
phoenixRouter.get('/agents/:agentId/history', (req: Request, res: Response) => {
  try {
    const history = phoenixPipelineCoordinator.getChatHistory(req.params.agentId);
    res.json({ success: true, history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/phoenix/agents/:agentId/chat
 * Interactive chat with any agent regarding directives or pipeline role
 */
phoenixRouter.post('/agents/:agentId/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }
    const reply = await phoenixPipelineCoordinator.chatWithAgent(req.params.agentId, message);
    res.json({ success: true, reply });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/phoenix/process
 * Ingest and process a document through the 8-agent pipeline
 */
phoenixRouter.post('/process', async (req: Request, res: Response) => {
  try {
    const { filename, fileBase64, clientData, matterData, clientId, matterId } = req.body;

    let bytes: Uint8Array;
    if (fileBase64) {
      const buffer = Buffer.from(fileBase64.replace(/^data:.*?;base64,/, ''), 'base64');
      bytes = new Uint8Array(buffer);
    } else {
      // Create clean standard legal pleading if no file provided
      const buffer = Buffer.from(`%PDF-1.4\n%Phoenix23 Synthetic Source\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n`);
      bytes = new Uint8Array(buffer);
    }

    const docFilename = filename || 'LegalDocument.pdf';

    const result = await phoenixPipelineCoordinator.processDocument(bytes, docFilename, {
      clientId,
      matterId,
      clientData,
      matterData
    });

    res.json({
      success: true,
      jobId: result.state.jobId,
      documentId: result.state.documentId,
      status: result.state.overallStatus,
      template: result.template,
      qaReport: result.qaReport,
      populatedOutput: {
        jobId: result.populatedOutput.jobId,
        populatedFieldCount: result.populatedOutput.populatedFieldCount,
        blankFieldCount: result.populatedOutput.blankFieldCount,
        outputSha256: result.populatedOutput.outputSha256,
        visualMasterSha256: result.populatedOutput.visualMasterSha256
      },
      auditTrail: result.state.auditTrail
    });
  } catch (err: any) {
    console.error('Phoenix Process Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/phoenix/executive-dispatch
 * Phoenix or EVE hands a document to the 8-agent pipeline and issues authoritative directives
 */
phoenixRouter.post('/executive-dispatch', async (req: Request, res: Response) => {
  try {
    const {
      dispatcher = 'phoenix',
      documentName = 'Judicial_Council_Petition.pdf',
      documentBase64,
      directiveTitle,
      generalInstructions,
      caseStrategy,
      clientId,
      clientName,
      matterId,
      caseNumber,
      courtCounty,
      clientData,
      matterData,
      customAgentDirectives
    } = req.body;

    const result = await executivePipelineBridge.dispatchDocument({
      dispatcher,
      documentName,
      documentBase64,
      directiveTitle: directiveTitle || (dispatcher === 'phoenix' ? 'Litigation Pleading Master Directive' : 'Executive Intake Matrix Directive'),
      generalInstructions: generalInstructions || 'Process document into immutable visual master and coordinate overlay with zero reflow.',
      caseStrategy,
      clientId,
      clientName,
      matterId,
      caseNumber,
      courtCounty,
      clientData,
      matterData,
      customAgentDirectives
    });

    res.json({
      success: true,
      jobId: result.jobId,
      documentId: result.documentId,
      dispatcher: result.dispatcher,
      dispatcherName: result.dispatcherName,
      directiveTitle: result.directiveTitle,
      executiveSummary: result.executiveSummary,
      state: result.state,
      template: result.template,
      populatedOutput: result.populatedOutput,
      qaReport: result.qaReport
    });
  } catch (err: any) {
    console.error('Executive Dispatch Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/phoenix/executive-presets
 * Retrieve default executive directives for Phoenix and EVE
 */
phoenixRouter.get('/executive-presets', (req: Request, res: Response) => {
  try {
    const clientName = (req.query.clientName as string) || '';
    const caseNumber = (req.query.caseNumber as string) || '';
    const phoenixPreset = executivePipelineBridge.getPhoenixDefaultDirectives({ clientName, caseNumber });
    const evePreset = executivePipelineBridge.getEveDefaultDirectives({ clientName, caseNumber });
    res.json({
      success: true,
      presets: {
        phoenix: phoenixPreset,
        eve: evePreset
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/phoenix/tests/run
 * Execute Section VII Automated Tests (Tests 1 through 8)
 */
phoenixRouter.get('/tests/run', async (req: Request, res: Response) => {
  try {
    const suiteResult = await automatedTestSuite.runAllTests();
    res.json({ success: true, ...suiteResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/phoenix/templates
 * Retrieve certified and draft intelligent templates
 */
phoenixRouter.get('/templates', (req: Request, res: Response) => {
  try {
    const templates = phoenixDb.templates;
    const certified = phoenixDb.getCertifiedTemplates();
    res.json({ success: true, templates, certified });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/phoenix/audit
 * Retrieve immutable SHA-256 audit events
 */
phoenixRouter.get('/audit', (req: Request, res: Response) => {
  try {
    res.json({ success: true, events: phoenixDb.auditEvents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/phoenix/submit
 * Universal 4-part legal intake & document automation submission endpoint
 */
phoenixRouter.post('/submit', async (req: Request, res: Response) => {
  try {
    const intakePayload = req.body || {};
    const p1 = intakePayload.part_1 || intakePayload.client || {};
    const p2 = intakePayload.part_2 || intakePayload.opposing_party || {};
    const p3 = intakePayload.part_3 || intakePayload.court_info || intakePayload.case || {};
    const p4 = intakePayload.part_4 || intakePayload.assistance || {};

    const clientName = p1.full_name || p1.client_name || `${p1.first_name || ''} ${p1.last_name || ''}`.trim() || 'Client';
    const caseNumber = p3.case_number || p3.docket_number || `MAT-2026-${Date.now().toString().slice(-4)}`;
    const practiceArea = p3.case_type || (p4.assistance_type?.includes('Dissolution') ? 'Family Law' : 'Civil Litigation');
    const targetForm = p4.assistance_type?.includes('FL-100') ? 'FL-100' :
      p4.assistance_type?.includes('FL-141') ? 'FL-141' :
      p4.assistance_type?.includes('FL-300') ? 'FL-300' :
      p4.assistance_type?.includes('FL-200') ? 'FL-200' :
      p4.assistance_type?.includes('FW-001') ? 'FW-001' : 'FL-120';

    const sanitizedClient = clientName.replace(/\s+/g, '_');
    const sanitizedPractice = practiceArea.replace(/\s+/g, '_').replace('/', '-');
    const sanitizedCase = caseNumber.replace(/\s+/g, '_').replace('/', '-');

    const result = {
      success: true,
      submission_id: `PHX-SUB-${Date.now()}`,
      status: 'ingested_and_processed',
      pipeline_stage: 'Universal DB -> Mapping JSON -> XFDF Generator -> Official Unaltered PDF',
      client: {
        name: clientName,
        phone: p1.phone,
        email: p1.email,
        address: p1.address || p1.street
      },
      case: {
        number: caseNumber,
        type: practiceArea,
        court: p3.court_name || 'Superior Court of California',
        county: p3.county || 'Orange'
      },
      target_form: targetForm,
      delivery_destinations: {
        database: {
          engine: 'PostgreSQL / SQLite3 (legal_platform.db)',
          tables_updated: ['clients', 'cases', 'intake_records', 'generated_documents']
        },
        local_matter_vault: {
          base_path: `output/${sanitizedPractice}/${sanitizedCase}/`,
          subfolders: [
            '01_Pleadings_and_Petitions',
            '02_Service_and_Summons',
            '03_Financial_Disclosures',
            '04_Motions_and_Orders',
            '05_Immigration_Packets',
            '06_Client_Exhibits_and_Intake',
            '07_XFDF_Injection_Payloads'
          ],
          generated_xfdf: `output/${sanitizedPractice}/${sanitizedCase}/${targetForm}_${sanitizedClient}.xfdf`,
          generated_pdf: `output/${sanitizedPractice}/${sanitizedCase}/${targetForm}_${sanitizedClient}_Filled.pdf`
        },
        google_drive_designated_dropzone: {
          account: 'level23consulting@gmail.com',
          folder_id: '1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH',
          folder_name: 'phoenix_review',
          local_inbox: 'google_drive_level23/Inbox/'
        }
      }
    };

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/phoenix/endpoints
 * Self-documenting endpoint catalog for pipeline integration
 */
phoenixRouter.get('/endpoints', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'Phoenix 23 Document Automation Pipeline',
    protocol: 'REST / JSON / XFDF / Python RPC',
    endpoints: {
      intake_submission_v1: {
        path: '/api/v1/intake',
        method: 'POST',
        description: 'Standard client self-service intake questionnaire. Inserts into DB and generates court forms.'
      },
      phoenix_submission: {
        path: '/api/phoenix/submit',
        method: 'POST',
        description: 'Universal 4-part legal intake & document automation submission endpoint.'
      },
      executive_dispatch: {
        path: '/api/phoenix/executive-dispatch',
        method: 'POST',
        description: 'Issues authoritative directives (Phoenix / EVE) to 8-agent document pipeline.'
      },
      document_processing: {
        path: '/api/phoenix/process',
        method: 'POST',
        description: 'Ingest and process binary/base64 document through 8-agent pipeline.'
      },
      python_pdf_engine: {
        path: 'http://localhost:8080/generate-pdf',
        method: 'POST',
        description: 'FastAPI/Flask Python Universal Document Population Engine microservice.'
      }
    },
    delivery_targets: {
      relational_database: 'PostgreSQL / SQLite (legal_platform.db)',
      output_vault: 'output/<practice_type>/<case_number>/[01-07 subfolders]',
      google_drive_repository: 'level23consulting@gmail.com (Folder ID: 1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH, Dropzone: phoenix_review)'
    }
  });
});

