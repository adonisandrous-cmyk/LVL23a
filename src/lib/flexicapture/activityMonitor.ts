/**
 * FlexiCapture Activity Monitor (Piece 2)
 * 
 * Passive, privacy-safe mouse and keyboard activity tracker.
 * Tracks engagement ratios, event frequency, and idle states
 * without recording sensitive keystrokes or private input values.
 */

export interface ActivityIntervalStats {
  intervalId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  mouseClicks: number;
  mouseMovementDistance: number;
  scrollCount: number;
  keystrokeCount: number;
  activeSeconds: number;
  idleSeconds: number;
  activityPercentage: number; // 0 - 100%
  status: 'active' | 'low_activity' | 'idle';
}

export interface ActivityMonitorState {
  isMonitoring: boolean;
  isIdle: boolean;
  idleThresholdSeconds: number;
  currentIdleSeconds: number;
  currentActiveSeconds: number;
  currentIntervalProgress: number; // 0 - 100%
  totalKeystrokes: number;
  totalClicks: number;
  totalScrolls: number;
  totalDistancePixels: number;
  currentActivityPercentage: number;
  intervals: ActivityIntervalStats[];
}

export class ActivityMonitor {
  private isMonitoring: boolean = false;
  private isIdle: boolean = false;
  private idleThresholdSeconds: number = 60; // 1 minute default
  private intervalDurationSeconds: number = 60; // 1 minute interval buckets

  // Current Interval Counters
  private intervalStartMs: number = Date.now();
  private mouseClicks: number = 0;
  private keystrokeCount: number = 0;
  private scrollCount: number = 0;
  private movementDistance: number = 0;
  private lastMouseX: number | null = null;
  private lastMouseY: number | null = null;

  // Second-by-second tracking
  private activeSecondsInInterval: number = 0;
  private consecutiveIdleSeconds: number = 0;
  private secondHadActivity: boolean = false;

  // Running Totals
  private totalKeystrokes: number = 0;
  private totalClicks: number = 0;
  private totalScrolls: number = 0;
  private totalDistancePixels: number = 0;
  private intervalsHistory: ActivityIntervalStats[] = [];

  // Tickers
  private tickerIntervalId: ReturnType<typeof setInterval> | null = null;

  // Event Callbacks
  public onTick?: (state: ActivityMonitorState) => void;
  public onIdleChange?: (isIdle: boolean, idleSeconds: number) => void;
  public onIntervalCompleted?: (stats: ActivityIntervalStats) => void;

  constructor(idleThresholdSeconds: number = 60, intervalSeconds: number = 60) {
    this.idleThresholdSeconds = idleThresholdSeconds;
    this.intervalDurationSeconds = intervalSeconds;
  }

  // DOM Event Listeners
  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isMonitoring) return;
    this.secondHadActivity = true;
    this.consecutiveIdleSeconds = 0;

    if (this.lastMouseX !== null && this.lastMouseY !== null) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.movementDistance += dist;
      this.totalDistancePixels += dist;
    }
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private handleClick = () => {
    if (!this.isMonitoring) return;
    this.secondHadActivity = true;
    this.consecutiveIdleSeconds = 0;
    this.mouseClicks++;
    this.totalClicks++;
  };

  private handleScroll = () => {
    if (!this.isMonitoring) return;
    this.secondHadActivity = true;
    this.consecutiveIdleSeconds = 0;
    this.scrollCount++;
    this.totalScrolls++;
  };

  private handleKeyDown = () => {
    if (!this.isMonitoring) return;
    this.secondHadActivity = true;
    this.consecutiveIdleSeconds = 0;
    this.keystrokeCount++;
    this.totalKeystrokes++;
  };

  /**
   * Start passive activity monitoring
   */
  public start(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.intervalStartMs = Date.now();
    this.resetIntervalCounters();

    // Attach passive listeners
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    window.addEventListener('mousedown', this.handleClick, { passive: true });
    window.addEventListener('wheel', this.handleScroll, { passive: true });
    window.addEventListener('keydown', this.handleKeyDown, { passive: true });

    // 1-second pulse clock
    this.tickerIntervalId = setInterval(() => {
      this.pulseSecond();
    }, 1000);
  }

  /**
   * Pause/Stop monitoring
   */
  public stop(): void {
    if (!this.isMonitoring) return;
    this.isMonitoring = false;

    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleClick);
    window.removeEventListener('wheel', this.handleScroll);
    window.removeEventListener('keydown', this.handleKeyDown);

    if (this.tickerIntervalId) {
      clearInterval(this.tickerIntervalId);
      this.tickerIntervalId = null;
    }
  }

  /**
   * 1-second pulse logic
   */
  private pulseSecond(): void {
    if (this.secondHadActivity) {
      this.activeSecondsInInterval++;
      this.secondHadActivity = false;

      if (this.isIdle) {
        this.isIdle = false;
        this.onIdleChange?.(false, 0);
      }
    } else {
      this.consecutiveIdleSeconds++;

      if (this.consecutiveIdleSeconds >= this.idleThresholdSeconds && !this.isIdle) {
        this.isIdle = true;
        this.onIdleChange?.(true, this.consecutiveIdleSeconds);
      }
    }

    // Check if current interval duration reached
    const elapsedSeconds = Math.floor((Date.now() - this.intervalStartMs) / 1000);
    if (elapsedSeconds >= this.intervalDurationSeconds) {
      this.finalizeInterval(elapsedSeconds);
    }

    this.onTick?.(this.getState());
  }

  /**
   * Completes current interval and emits stats
   */
  private finalizeInterval(elapsedSeconds: number): void {
    const activityRatio = Math.min(100, Math.round((this.activeSecondsInInterval / Math.max(1, elapsedSeconds)) * 100));
    
    let status: 'active' | 'low_activity' | 'idle' = 'active';
    if (activityRatio < 20) status = 'idle';
    else if (activityRatio < 55) status = 'low_activity';

    const intervalStats: ActivityIntervalStats = {
      intervalId: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      startTime: new Date(this.intervalStartMs).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      mouseClicks: this.mouseClicks,
      mouseMovementDistance: Math.round(this.movementDistance),
      scrollCount: this.scrollCount,
      keystrokeCount: this.keystrokeCount,
      activeSeconds: this.activeSecondsInInterval,
      idleSeconds: Math.max(0, elapsedSeconds - this.activeSecondsInInterval),
      activityPercentage: activityRatio,
      status
    };

    this.intervalsHistory.unshift(intervalStats);
    if (this.intervalsHistory.length > 50) {
      this.intervalsHistory = this.intervalsHistory.slice(0, 50);
    }

    this.onIntervalCompleted?.(intervalStats);
    this.intervalStartMs = Date.now();
    this.resetIntervalCounters();
  }

  private resetIntervalCounters(): void {
    this.mouseClicks = 0;
    this.keystrokeCount = 0;
    this.scrollCount = 0;
    this.movementDistance = 0;
    this.activeSecondsInInterval = 0;
    this.secondHadActivity = false;
  }

  public setIdleThreshold(seconds: number): void {
    this.idleThresholdSeconds = Math.max(10, seconds);
  }

  public setIntervalDuration(seconds: number): void {
    this.intervalDurationSeconds = Math.max(10, seconds);
  }

  public clearHistory(): void {
    this.intervalsHistory = [];
    this.totalClicks = 0;
    this.totalKeystrokes = 0;
    this.totalScrolls = 0;
    this.totalDistancePixels = 0;
  }

  public getState(): ActivityMonitorState {
    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - this.intervalStartMs) / 1000));
    const currentActivityPercentage = Math.min(100, Math.round((this.activeSecondsInInterval / elapsedSeconds) * 100));
    const currentIntervalProgress = Math.min(100, Math.round((elapsedSeconds / this.intervalDurationSeconds) * 100));

    return {
      isMonitoring: this.isMonitoring,
      isIdle: this.isIdle,
      idleThresholdSeconds: this.idleThresholdSeconds,
      currentIdleSeconds: this.consecutiveIdleSeconds,
      currentActiveSeconds: this.activeSecondsInInterval,
      currentIntervalProgress,
      totalKeystrokes: this.totalKeystrokes,
      totalClicks: this.totalClicks,
      totalScrolls: this.totalScrolls,
      totalDistancePixels: Math.round(this.totalDistancePixels),
      currentActivityPercentage,
      intervals: [...this.intervalsHistory]
    };
  }
}
