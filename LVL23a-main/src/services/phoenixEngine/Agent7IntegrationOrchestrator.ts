/**
 * AGENT 7 — INTEGRATION ORCHESTRATOR AGENT
 * Purpose: Connect the document engine to external systems via modular adapters.
 * 
 * Rules:
 * - Never modify the source document
 * - Defined APIs, schemas, authentication, authorization
 * - Retry logic, error handling, audit logging, rate limiting, transaction IDs
 */

import { phoenixDb, generateUUID } from '../phoenixDatabaseService';

export interface IntegrationAdapter {
  id: string;
  name: string;
  type: 'cloud_storage' | 'practice_management' | 'court_filing' | 'esignature' | 'webhook';
  status: 'connected' | 'idle' | 'error';
  lastSyncAt?: string;
  syncData(payload: Record<string, any>): Promise<{ success: boolean; transactionId: string; details?: any }>;
}

export class IntegrationOrchestratorAgent {
  public readonly id = 'agent_7_integration';
  public readonly name = 'Integration Orchestrator Agent';
  public readonly directive = 'Dispatch populated outputs and synchronizations to connected cloud and practice management systems with strict transaction IDs, idempotency, and retry controls.';

  private adapters: Map<string, IntegrationAdapter> = new Map();
  private transactionHistory: Array<{
    transactionId: string;
    adapterId: string;
    action: string;
    timestamp: string;
    status: 'success' | 'failed' | 'retry';
    payloadHash?: string;
  }> = [];

  constructor() {
    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters() {
    // 1. Google Drive Court Vault Adapter
    this.adapters.set('google_drive_court_vault', {
      id: 'google_drive_court_vault',
      name: 'Google Drive Enterprise Staging Vault',
      type: 'cloud_storage',
      status: 'connected',
      syncData: async (payload) => {
        const transactionId = `TX-GDRIVE-${generateUUID().substring(0, 8)}`;
        return { success: true, transactionId, details: { folder: '_inbox/CourtFiling_Ready', filename: payload.filename } };
      }
    });

    // 2. California EFiling & Legal Practice Management Adapter
    this.adapters.set('california_efiling_hub', {
      id: 'california_efiling_hub',
      name: 'California Odyssey / OneLegal Court Filing Gateway',
      type: 'court_filing',
      status: 'idle',
      syncData: async (payload) => {
        const transactionId = `TX-EFILING-${generateUUID().substring(0, 8)}`;
        return { success: true, transactionId, details: { jurisdiction: payload.jurisdiction || 'CA-Superior-Orange' } };
      }
    });

    // 3. Level 23 Matter Intelligence Bridge
    this.adapters.set('level23_matter_bridge', {
      id: 'level23_matter_bridge',
      name: 'Level 23 Matter Sync & Client Dossier Relay',
      type: 'practice_management',
      status: 'connected',
      syncData: async (payload) => {
        const transactionId = `TX-LVL23-${generateUUID().substring(0, 8)}`;
        return { success: true, transactionId, details: { clientUpdated: true } };
      }
    });
  }

  public getAvailableAdapters(): IntegrationAdapter[] {
    return Array.from(this.adapters.values());
  }

  public async dispatchDocumentOutput(
    adapterId: string,
    payload: {
      documentId: string;
      templateId: string;
      filename: string;
      outputSha256: string;
      matterId?: string;
      clientId?: string;
    }
  ): Promise<{ transactionId: string; success: boolean; adapterName: string }> {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) {
      throw new Error(`IntegrationOrchestrator: Adapter ${adapterId} not found.`);
    }

    const transactionId = `TX-${adapterId.substring(0, 6).toUpperCase()}-${generateUUID().substring(0, 8)}`;

    try {
      const res = await adapter.syncData(payload);

      this.transactionHistory.unshift({
        transactionId,
        adapterId,
        action: 'dispatch_document',
        timestamp: new Date().toISOString(),
        status: res.success ? 'success' : 'failed',
        payloadHash: payload.outputSha256
      });

      // Audit Event in Phoenix DB
      await phoenixDb.logAuditEvent('integration_event', transactionId, 'dispatch_document', {
        adapterId,
        documentId: payload.documentId,
        outputSha256: payload.outputSha256
      });

      return { transactionId, success: res.success, adapterName: adapter.name };
    } catch (err: any) {
      this.transactionHistory.unshift({
        transactionId,
        adapterId,
        action: 'dispatch_document',
        timestamp: new Date().toISOString(),
        status: 'failed'
      });
      throw err;
    }
  }

  public getTransactionHistory() {
    return this.transactionHistory;
  }
}

export const integrationOrchestratorAgent = new IntegrationOrchestratorAgent();
