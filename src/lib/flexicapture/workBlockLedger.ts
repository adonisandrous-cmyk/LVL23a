/**
 * FlexiCapture Work-Block Ledger & Billable Session Manager (Piece 3)
 * 
 * Aggregates screenshot captures (Piece 1) and activity statistics (Piece 2)
 * into structured legal billing blocks, time-slips, and verifiable audit records.
 */

import { ScreenShotModel } from './types';
import { ActivityIntervalStats } from './activityMonitor';

export interface WorkBlock {
  id: string;
  sessionStartTime: string;
  sessionEndTime: string;
  durationMinutes: number;
  billableHours: number; // In 0.1 hr increments (e.g., 6 min = 0.1 hr)
  clientId?: string;
  clientName: string;
  matterId?: string;
  matterTitle: string;
  hourlyRate: number;
  billableAmount: number;
  activityPercentage: number;
  keystrokeTotal: number;
  clickTotal: number;
  screenshotCount: number;
  screenshots: ScreenShotModel[];
  notes: string;
  verified: boolean;
}

export class WorkBlockLedger {
  private blocks: WorkBlock[] = [];
  private activeBlockStartMs: number = Date.now();
  private defaultHourlyRate: number = 350; // $350/hr standard legal rate
  private storageKey: string = 'flexicapture_work_blocks_v1';

  constructor(defaultHourlyRate: number = 350) {
    this.defaultHourlyRate = defaultHourlyRate;
    this.loadFromStorage();
  }

  /**
   * Creates a finalized work block by combining screenshots and activity statistics
   */
  public recordBlock(params: {
    clientName: string;
    clientId?: string;
    matterTitle: string;
    matterId?: string;
    hourlyRate?: number;
    durationMinutes: number;
    activityPercentage: number;
    keystrokeTotal: number;
    clickTotal: number;
    screenshots: ScreenShotModel[];
    notes?: string;
  }): WorkBlock {
    const rate = params.hourlyRate || this.defaultHourlyRate;
    const duration = Math.max(1, params.durationMinutes);
    // Standard legal 6-minute (0.1 hr) increment calculation
    const billableHours = Math.max(0.1, Math.ceil(duration / 6) * 0.1);
    const billableAmount = Math.round(billableHours * rate * 100) / 100;

    const block: WorkBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionStartTime: new Date(Date.now() - duration * 60000).toISOString(),
      sessionEndTime: new Date().toISOString(),
      durationMinutes: duration,
      billableHours,
      clientId: params.clientId,
      clientName: params.clientName || 'General Legal Practice',
      matterId: params.matterId,
      matterTitle: params.matterTitle || 'Administrative & Case Review',
      hourlyRate: rate,
      billableAmount,
      activityPercentage: Math.min(100, Math.max(0, Math.round(params.activityPercentage))),
      keystrokeTotal: params.keystrokeTotal,
      clickTotal: params.clickTotal,
      screenshotCount: params.screenshots.length,
      screenshots: [...params.screenshots],
      notes: params.notes || 'Automated activity session logged via FlexiCapture engine.',
      verified: true
    };

    this.blocks.unshift(block);
    this.saveToStorage();
    return block;
  }

  public getBlocks(): WorkBlock[] {
    return [...this.blocks];
  }

  public deleteBlock(id: string): void {
    this.blocks = this.blocks.filter((b) => b.id !== id);
    this.saveToStorage();
  }

  public clearAll(): void {
    this.blocks = [];
    this.saveToStorage();
  }

  /**
   * Export all recorded work blocks to CSV format
   */
  public exportToCSV(): string {
    const headers = [
      'Block ID',
      'Start Time',
      'End Time',
      'Client Name',
      'Matter Title',
      'Duration (Mins)',
      'Billable Hours',
      'Rate ($/hr)',
      'Total Amount ($)',
      'Activity %',
      'Keystrokes',
      'Clicks',
      'Screenshots'
    ];

    const rows = this.blocks.map((b) => [
      b.id,
      b.sessionStartTime,
      b.sessionEndTime,
      `"${b.clientName.replace(/"/g, '""')}"`,
      `"${b.matterTitle.replace(/"/g, '""')}"`,
      b.durationMinutes,
      b.billableHours.toFixed(1),
      b.hourlyRate,
      b.billableAmount.toFixed(2),
      `${b.activityPercentage}%`,
      b.keystrokeTotal,
      b.clickTotal,
      b.screenshotCount
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Export full JSON audit bundle
   */
  public exportToJSON(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalBlocks: this.blocks.length,
        totalBillableHours: this.getTotalBillableHours(),
        totalBillableAmount: this.getTotalBillableAmount(),
        blocks: this.blocks
      },
      null,
      2
    );
  }

  public getTotalBillableHours(): number {
    return Math.round(this.blocks.reduce((acc, b) => acc + b.billableHours, 0) * 10) / 10;
  }

  public getTotalBillableAmount(): number {
    return Math.round(this.blocks.reduce((acc, b) => acc + b.billableAmount, 0) * 100) / 100;
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        // Strip heavy base64/blobs for lightweight localStorage storage
        const lightweight = this.blocks.map((b) => ({
          ...b,
          screenshots: b.screenshots.map((s) => ({
            ...s,
            imageBlob: undefined,
            base64Image: undefined,
            previewUrl: ''
          }))
        }));
        localStorage.setItem(this.storageKey, JSON.stringify(lightweight));
      } catch (err) {
        console.warn('Failed to save blocks to localStorage:', err);
      }
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.blocks = parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load blocks from localStorage:', err);
      }
    }
  }
}
