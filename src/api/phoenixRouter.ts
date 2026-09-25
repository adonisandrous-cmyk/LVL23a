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
    const clientName = (req.query.clientName as string) || 'Eleanor Vance';
    const caseNumber = (req.query.caseNumber as string) || '24FL-009412';
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
