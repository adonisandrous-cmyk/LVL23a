/**
 * Level 23 / Phoenix 23 - BigLaw (discover-legal/BigLaw) Integration Bridge
 * 
 * Pairs Phoenix (Managing Partner & Lead Legal Strategist) with the BigLaw open-source
 * legal engineering stack:
 * - 100+ Agent Bench with DyTopo (Dynamic Topology) Multi-Round Debate Architecture
 * - CourtListener-backed Verbatim CitationGate & Statutory Grounding
 * - Playbook-Aware Contract Negotiation & Silent-Edit Detection
 * - Court Filing Deadline Calculator (FRCP, UK CPR, EU Competition, California Rules)
 * - Tabular Review Matrix (50 docs x 30 cols) & Human Verification Gates
 * - Native Go binary (:3101), Docker stack (:3102), and MCP Tool Provider Support
 */

export interface BigLawStatus {
  isConnected: boolean;
  mode: 'docker' | 'native_go' | 'mcp' | 'embedded';
  apiUrl: string;
  benchCount: number;
  activeConnectors: string[];
  version: string;
  dockerCommand: string;
  nativeCommand: string;
}

export interface DyTopoExchange {
  fromAgent: string;
  toAgent: string;
  agentRole: string;
  content: string;
  citation?: string;
  confidence: number;
  isContested?: boolean;
}

export interface DyTopoRound {
  roundIndex: number;
  stageName: 'Epistemic Need/Offer' | 'Adversarial Debate' | 'CitationGate & CourtListener' | 'Human Gate' | 'Final Synthesis';
  description: string;
  activeAgents: string[];
  exchanges: DyTopoExchange[];
  status: 'complete' | 'in_progress' | 'flagged';
}

export interface HumanGate {
  id: string;
  taskId: string;
  finding: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ruleCitation: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rationale: string;
}

export interface BigLawTask {
  id: string;
  title: string;
  jurisdiction: 'US_FEDERAL_FRCP' | 'CA_JUDICIAL' | 'NY_COMMERCIAL' | 'UK_CPR' | 'EU_COMPETITION' | 'DE_CHANCERY';
  workflow: 'roundtable' | 'counter_redline' | 'deadline_audit' | 'citation_check' | 'tabular_review' | 'custom';
  clientName?: string;
  matterNumber?: string;
  status: 'QUEUED' | 'IN_ROUNDS' | 'HUMAN_GATE_PENDING' | 'COMPLETED' | 'FAILED';
  rounds: DyTopoRound[];
  gates: HumanGate[];
  finalSynthesis?: string;
  verbatimCitations?: string[];
  statutoryGroundingRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourtDeadlineCalculation {
  jurisdiction: string;
  triggerEvent: string;
  triggerDate: string;
  serviceMethod: 'personal' | 'mail' | 'electronic';
  deadlines: {
    actionName: string;
    dueDate: string;
    daysCount: number;
    dayType: 'calendar' | 'business';
    statutoryBasis: string;
    ruleNumber: string;
    notes: string;
  }[];
}

export interface RedlineAnalysis {
  contractTitle: string;
  riskScore: 'Low' | 'Medium' | 'High' | 'Severe';
  silentEditsDetected: {
    clause: string;
    hiddenChange: string;
    risk: 'High' | 'Critical';
    remedy: string;
  }[];
  playbookVariances: {
    clauseName: string;
    offeringText: string;
    playbookStandard: string;
    recommendedCounter: string;
    negotiationRationale: string;
  }[];
  integrityCheckPassed: boolean;
}

export interface CitationVerification {
  queryCitation: string;
  isValid: boolean;
  officialReporter: string;
  court: string;
  dateDecided: string;
  precedentialVitality: 'Good Law' | 'Distinguished' | 'Cautionary' | 'Overruled';
  verbatimHolding: string;
  statutoryPenaltyOrRule: string;
}

class BigLawService {
  private customApiUrl: string = '';

  public setCustomApiUrl(url: string) {
    this.customApiUrl = url;
    if (typeof window !== 'undefined') {
      localStorage.setItem('phoenix_biglaw_api_url', url);
    }
  }

  public getSavedApiUrl(): string {
    if (this.customApiUrl) return this.customApiUrl;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('phoenix_biglaw_api_url') || '';
    }
    return '';
  }

  /**
   * Health and connectivity check to BigLaw engine
   */
  public async getStatus(): Promise<BigLawStatus> {
    try {
      const url = this.getSavedApiUrl();
      const res = await fetch(`/api/biglaw/status${url ? `?customUrl=${encodeURIComponent(url)}` : ''}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[BigLawService] Status fetch error:', e);
    }

    return {
      isConnected: false,
      mode: 'embedded',
      apiUrl: 'http://localhost:3102',
      benchCount: 112,
      activeConnectors: ['CourtListener', 'TypeDB', 'DocuSeal', 'FRCP Deadline Engine', 'Clio OAuth', 'Drive Sync'],
      version: 'discover-legal/BigLaw 2026.1 (DyTopo v2)',
      dockerCommand: 'curl -fsSL https://raw.githubusercontent.com/discover-legal/BigLaw/main/setup.sh | bash',
      nativeCommand: 'go run ./biglaw-go/cmd/biglaw'
    };
  }

  /**
   * Submit legal task into BigLaw DyTopo multi-agent bench
   */
  public async submitTask(params: {
    title: string;
    jurisdiction: BigLawTask['jurisdiction'];
    workflow: BigLawTask['workflow'];
    inputBrief: string;
    clientName?: string;
    matterNumber?: string;
    requireHumanGate?: boolean;
  }): Promise<BigLawTask> {
    const res = await fetch('/api/biglaw/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      throw new Error(`BigLaw dispatch failed: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Get task details and stream DyTopo rounds
   */
  public async getTask(taskId: string): Promise<BigLawTask> {
    const res = await fetch(`/api/biglaw/tasks/${taskId}`);
    if (!res.ok) {
      throw new Error(`Failed to load BigLaw task ${taskId}`);
    }
    return await res.json();
  }

  /**
   * Human Gate Approval/Rejection (attorney or Phoenix gatekeeper)
   */
  public async resolveGate(taskId: string, gateId: string, action: 'approve' | 'reject', comment?: string): Promise<{ success: boolean; task: BigLawTask }> {
    const res = await fetch(`/api/biglaw/tasks/${taskId}/gates/${gateId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    });

    if (!res.ok) {
      throw new Error(`Failed to ${action} gate: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Compute Court Deadlines via BigLaw Rules Engine
   */
  public async computeDeadlines(params: {
    jurisdiction: string;
    triggerEvent: string;
    triggerDate: string;
    serviceMethod: 'personal' | 'mail' | 'electronic';
  }): Promise<CourtDeadlineCalculation> {
    const res = await fetch('/api/biglaw/deadlines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      throw new Error(`Failed to compute court deadlines: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Verify Citations against BigLaw CitationGate & CourtListener
   */
  public async verifyCitation(citation: string): Promise<CitationVerification> {
    const res = await fetch('/api/biglaw/citations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citation })
    });

    if (!res.ok) {
      throw new Error(`Failed to verify citation: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Contract Counter-Redline & Silent-Edit Detection
   */
  public async analyzeRedline(contractText: string, playbook: string = 'firm_standard'): Promise<RedlineAnalysis> {
    const res = await fetch('/api/biglaw/redline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractText, playbook })
    });

    if (!res.ok) {
      throw new Error(`Failed to analyze contract redline: ${res.statusText}`);
    }

    return await res.json();
  }
}

export const biglawService = new BigLawService();
