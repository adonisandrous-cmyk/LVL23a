/**
 * Autonomous Matter Memory Store & Cognitive Vector Retrieval Engine
 * 
 * Direct Builder Directive (CRITICAL 3):
 * Connects the real-time transcription parser directly to the active matter
 * memory store and Google Drive repository (1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH)
 * so that every user query dynamically updates the ongoing case state and feeds
 * into the model's active working memory.
 */

export interface ActiveCaseFact {
  id: string;
  timestamp: string;
  category: 'party' | 'docket' | 'statute' | 'deadline' | 'asset' | 'liability' | 'directive';
  key: string;
  value: string;
  source: string;
  confidence: number;
}

export interface LearnedMemory {
  id: string;
  timestamp: string;
  type: 'voice_transcription' | 'user_query' | 'google_drive' | 'ocr_scan' | 'case_analysis';
  rawText: string;
  entities: Record<string, string>;
  keyTopics: string[];
  activeMatterId?: string;
}

export interface ActiveMatterState {
  caseNumber?: string;
  parties: { petitioner?: string; respondent?: string; minorChildren?: string[] };
  controllingStatutes: string[];
  impendingDeadlines: string[];
  disputedAssets: string[];
  lastUpdated: string;
  driveFolderId: string;
}

const STORAGE_KEY = 'level23_autonomous_matter_memory_v1';
const DRIVE_FOLDER_ID = '1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH';

class AutonomousMatterMemoryStore {
  private memories: LearnedMemory[] = [];
  private facts: ActiveCaseFact[] = [];
  private matterState: ActiveMatterState = {
    parties: {},
    controllingStatutes: [],
    impendingDeadlines: [],
    disputedAssets: [],
    lastUpdated: new Date().toISOString(),
    driveFolderId: DRIVE_FOLDER_ID
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.memories)) this.memories = parsed.memories.slice(-100);
        if (Array.isArray(parsed.facts)) this.facts = parsed.facts.slice(-100);
        if (parsed.matterState) this.matterState = { ...this.matterState, ...parsed.matterState };
      }
    } catch (e) {
      console.warn('[AutonomousMemory] Failed to read local storage:', e);
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        memories: this.memories.slice(-100),
        facts: this.facts.slice(-100),
        matterState: this.matterState
      }));
    } catch (e) {
      console.warn('[AutonomousMemory] Failed to persist memory state:', e);
    }
  }

  /**
   * Entity & Case Concept Extraction
   */
  public extractEntities(text: string): Record<string, string> {
    const entities: Record<string, string> = {};
    if (!text) return entities;

    // Case / Docket numbers
    const caseMatch = text.match(/\b(?:\d{2}[A-Za-z]{2,4}\d{4,8}|[A-Za-z]{2,4}-\d{4,8})\b/i) ||
                      text.match(/case\s*(?:no\.?|number|#)?[:\s-]+([A-Za-z0-9\-]+)/i);
    if (caseMatch) entities.caseNumber = caseMatch[1] || caseMatch[0];

    // California & Federal Statutes
    const statuteMatches = text.match(/(?:(?:Cal(?:ifornia)?\.?\s*)?(?:Fam(?:ily)?\.?\s*Code|CCP|Evid(?:ence)?\.?\s*Code|Civ(?:il)?\.?\s*Code)\s*§+\s*\d+(?:\.\d+)?(?:\([a-z0-9]+\))?)/gi);
    if (statuteMatches) entities.statutes = Array.from(new Set(statuteMatches)).join(', ');

    // Money amounts
    const dollarMatch = text.match(/\$\s*[\d,]+(?:\.\d{2})?(?:\s*(?:million|thousand|k|m))?/gi);
    if (dollarMatch) entities.monetaryValues = dollarMatch.join(', ');

    // Form codes
    const formMatch = text.match(/\b(?:FL-\d{3}|EOIR-\d{2}|I-\d{3}|GC-\d{3})\b/gi);
    if (formMatch) entities.courtForms = Array.from(new Set(formMatch)).join(', ');

    return entities;
  }

  /**
   * Ingest a live user query, speech transcription, or OCR text into cognitive working memory
   */
  public async ingestInteraction(
    text: string,
    type: LearnedMemory['type'] = 'user_query',
    source: string = 'live_interaction'
  ): Promise<LearnedMemory> {
    const clean = text.trim();
    if (!clean) {
      return {
        id: `mem-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type,
        rawText: '',
        entities: {},
        keyTopics: []
      };
    }

    const entities = this.extractEntities(clean);
    const words = clean.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const keyTopics = Array.from(new Set(words)).slice(0, 8);

    const memory: LearnedMemory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      rawText: clean,
      entities,
      keyTopics
    };

    this.memories.push(memory);
    if (this.memories.length > 100) this.memories.shift();

    // Dynamically evolve ongoing case state
    if (entities.caseNumber) {
      this.matterState.caseNumber = entities.caseNumber;
      this.facts.push({
        id: `fact-${Date.now()}-case`,
        timestamp: new Date().toISOString(),
        category: 'docket',
        key: 'caseNumber',
        value: entities.caseNumber,
        source,
        confidence: 0.95
      });
    }

    if (entities.statutes) {
      const stats = entities.statutes.split(', ').map(s => s.trim());
      for (const s of stats) {
        if (!this.matterState.controllingStatutes.includes(s)) {
          this.matterState.controllingStatutes.push(s);
          this.facts.push({
            id: `fact-${Date.now()}-${s.slice(0, 10)}`,
            timestamp: new Date().toISOString(),
            category: 'statute',
            key: 'controllingStatute',
            value: s,
            source,
            confidence: 0.9
          });
        }
      }
    }

    this.matterState.lastUpdated = new Date().toISOString();
    this.persist();

    // Notify backend memory sync route if available
    this.syncToBackend(memory).catch(() => {});

    return memory;
  }

  /**
   * Sync memory to backend and Google Drive
   */
  private async syncToBackend(memory: LearnedMemory) {
    try {
      await fetch('/api/memory/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memory,
          matterState: this.matterState,
          driveFolderId: DRIVE_FOLDER_ID
        })
      });
    } catch {}
  }

  /**
   * Vector-style relevance search across learned memories
   */
  public queryRelevantMemories(query: string, maxResults = 4): LearnedMemory[] {
    if (!query || this.memories.length === 0) return this.memories.slice(-maxResults);
    const queryTokens = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));

    const scored = this.memories.map(m => {
      let score = 0;
      const memTokens = m.rawText.toLowerCase().split(/\s+/);
      for (const t of memTokens) {
        if (queryTokens.has(t)) score += 1;
      }
      if (Object.keys(m.entities).length > 0) score += 2;
      return { memory: m, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxResults).map(s => s.memory);
  }

  /**
   * Generate continuous working memory prompt snippet for LLMs
   */
  public getWorkingMemoryPromptSnippet(currentQuery?: string): string {
    const relevant = this.queryRelevantMemories(currentQuery || '', 4);
    const statutes = this.matterState.controllingStatutes.slice(-5).join('; ');
    const caseNum = this.matterState.caseNumber || 'Active Matter';

    const memoryLines = relevant.map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `- [${time} - ${m.type}]: "${m.rawText.slice(0, 180)}${m.rawText.length > 180 ? '...' : ''}"`;
    });

    return `[ACTIVE COGNITIVE WORKING MEMORY & DYNAMIC CASE STATE]:
- Matter Docket ID: ${caseNum}
- Controlling Statutes In Scope: ${statutes || 'California Family Code § 2310, § 2330, § 4320, CCP § 1005'}
- Linked Drive Repository: level23consulting@gmail.com (Folder ID: ${DRIVE_FOLDER_ID})
- Recent Learned Working Memory Context:
${memoryLines.length > 0 ? memoryLines.join('\n') : '- No prior interactions recorded; initiating fresh cognitive reasoning.'}
*Direct instruction: Reason dynamically using the above learned case facts. Avoid static repetitive templates.*`;
  }

  public getMatterState(): ActiveMatterState {
    return { ...this.matterState };
  }

  public clearWorkingMemory() {
    this.memories = [];
    this.facts = [];
    this.matterState = {
      parties: {},
      controllingStatutes: [],
      impendingDeadlines: [],
      disputedAssets: [],
      lastUpdated: new Date().toISOString(),
      driveFolderId: DRIVE_FOLDER_ID
    };
    this.persist();
  }
}

export const matterMemoryStore = new AutonomousMatterMemoryStore();
