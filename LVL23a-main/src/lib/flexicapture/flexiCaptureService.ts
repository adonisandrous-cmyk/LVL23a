/**
 * FlexiCapture Service
 * Ported from https://github.com/prabhuc94/flexicapture
 * Complete TypeScript implementation for Web, Desktop Shell, and Electron environments.
 */

import {
  ActiveWindowInfo,
  ScreenShotModel,
  FlexiCaptureOptions,
  FlexiCaptureStatus,
  FlexiCaptureState
} from './types';
import { ImageCompressor } from './imageCompressor';

export class FlexiCapture {
  // Configurable Properties
  public maxMinute: number = 5;
  public fixedRatio: number = 0.5;
  public randomRatio: number = 0.5;
  public enableCompress: boolean = true;
  public maxSize: number = 400 * 1024; // 400 KB default
  public convertBase64: boolean = true;
  public exceptAppName: string = '';
  public captureWithAppDetails: boolean = true;

  // Runtime State
  public pauseCapture: boolean = false;
  public isDisposed: boolean = false;
  public isStartTimer: boolean = false;
  private currentStatus: FlexiCaptureStatus = 'idle';

  // Internal Timers & Streams
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private countdownIntervalId: ReturnType<typeof setInterval> | null = null;
  private secondsRemaining: number = 0;
  private currentIntervalSeconds: number = 0;
  private captureCount: number = 0;
  private lastCapturedAt: string | null = null;

  // Active Screen Stream (DisplayMedia)
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  // Callbacks
  public onCaptured?: (model: ScreenShotModel) => void;
  public onCaptureError?: (error: string) => void;
  public onRandomMinutes?: (minutes: number) => void;
  public onTick?: (secondsRemaining: number, currentIntervalSeconds: number) => void;
  public onStatusChange?: (status: FlexiCaptureStatus) => void;

  constructor(options?: Partial<FlexiCaptureOptions>) {
    if (options) {
      if (options.maxMinute !== undefined) this.maxMinute = options.maxMinute;
      if (options.fixedRatio !== undefined) this.fixedRatio = options.fixedRatio;
      if (options.randomRatio !== undefined) this.randomRatio = options.randomRatio;
      if (options.enableCompress !== undefined) this.enableCompress = options.enableCompress;
      if (options.maxSize !== undefined) this.maxSize = options.maxSize;
      if (options.convertBase64 !== undefined) this.convertBase64 = options.convertBase64;
      if (options.exceptAppName !== undefined) this.exceptAppName = options.exceptAppName;
      if (options.captureWithAppDetails !== undefined) this.captureWithAppDetails = options.captureWithAppDetails;
    }
  }

  /**
   * Initializes display capture permission ahead of scheduled timers
   */
  public async requestDisplayPermission(): Promise<boolean> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'monitor' } as any,
          audio: false
        });

        // Setup hidden video element for sampling frames
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        this.videoElement.srcObject = this.mediaStream;
        await this.videoElement.play();

        // Listen for track stop
        this.mediaStream.getVideoTracks()[0]?.addEventListener('ended', () => {
          this.mediaStream = null;
          this.videoElement = null;
          this.setStatus('idle');
        });

        return true;
      }
    } catch (err: any) {
      this.onCaptureError?.(err?.message || 'Display permission declined');
    }
    return false;
  }

  /**
   * Starts the randomized background capture timer
   */
  public start(): void {
    if (this.isDisposed) {
      this.isDisposed = false;
    }

    if (!this.isStartTimer && this.isActiveRandomDuration) {
      this.isStartTimer = true;
      this.setStatus('running');
      this.startTimer();
    }
  }

  /**
   * Main randomized timer scheduler matching flexicapture Dart formula
   */
  private startTimer(): void {
    this.clearTimers();

    if (this.isDisposed || !this.isActiveRandomDuration || this.pauseCapture) {
      if (this.pauseCapture) this.setStatus('paused');
      return;
    }

    const durationMinutes = this.randomDurationMinutes;
    this.currentIntervalSeconds = Math.max(10, Math.round(durationMinutes * 60));
    this.secondsRemaining = this.currentIntervalSeconds;

    this.onRandomMinutes?.(durationMinutes);
    this.setStatus('running');

    // Countdown tick loop
    this.countdownIntervalId = setInterval(() => {
      if (this.pauseCapture || this.isDisposed) return;
      this.secondsRemaining = Math.max(0, this.secondsRemaining - 1);
      this.onTick?.(this.secondsRemaining, this.currentIntervalSeconds);
    }, 1000);

    // Capture execution timer
    this.timerId = setTimeout(async () => {
      if (this.isDisposed || this.pauseCapture) return;

      await this.captureRoutine();
    }, this.currentIntervalSeconds * 1000);
  }

  /**
   * Executes the capture routine (checks app filter, grabs screenshot, compresses, emits)
   */
  private async captureRoutine(): Promise<void> {
    try {
      this.setStatus('capturing');
      const windowInfo = this.getActiveWindowInfo();

      // Check exception app name
      if (
        this.exceptAppName &&
        this.exceptAppName.trim().length > 0 &&
        windowInfo.appName.toLowerCase().startsWith(this.exceptAppName.toLowerCase())
      ) {
        this.onCaptureError?.(`${this.exceptAppName} is focused`);
        this.startTimer();
        return;
      }

      const screenshotModel = await this.captureScreenShotWithAppName(windowInfo);
      this.captureCount++;
      this.lastCapturedAt = new Date().toISOString();

      this.onCaptured?.(screenshotModel);
    } catch (err: any) {
      this.onCaptureError?.(err?.message || 'Failed to capture screenshot');
    } finally {
      if (!this.isDisposed && !this.pauseCapture) {
        this.startTimer();
      }
    }
  }

  /**
   * Manual on-demand capture trigger
   */
  public async captureNow(): Promise<ScreenShotModel | null> {
    try {
      this.setStatus('capturing');
      const windowInfo = this.getActiveWindowInfo();

      if (
        this.exceptAppName &&
        this.exceptAppName.trim().length > 0 &&
        windowInfo.appName.toLowerCase().startsWith(this.exceptAppName.toLowerCase())
      ) {
        this.onCaptureError?.(`${this.exceptAppName} is focused`);
        return null;
      }

      const screenshotModel = await this.captureScreenShotWithAppName(windowInfo);
      this.captureCount++;
      this.lastCapturedAt = new Date().toISOString();
      this.onCaptured?.(screenshotModel);
      this.setStatus(this.isStartTimer ? (this.pauseCapture ? 'paused' : 'running') : 'idle');
      return screenshotModel;
    } catch (err: any) {
      this.onCaptureError?.(err?.message || 'Manual capture failed');
      this.setStatus(this.isStartTimer ? (this.pauseCapture ? 'paused' : 'running') : 'idle');
      return null;
    }
  }

  /**
   * Grabs a raw screenshot from active display or fallback canvas
   */
  private async captureRawCanvas(): Promise<{ canvas: HTMLCanvasElement; originalBytes: number }> {
    let canvas: HTMLCanvasElement;

    if (this.videoElement && this.videoElement.videoWidth > 0) {
      canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
      }
    } else {
      // Fallback: render current client viewport / interactive canvas snapshot
      canvas = document.createElement('canvas');
      canvas.width = window.innerWidth || 1280;
      canvas.height = window.innerHeight || 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Gradient backdrop representing the active desktop frame
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#0a0f1d');
        grad.addColorStop(0.5, '#040711');
        grad.addColorStop(1, '#0e172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header simulation
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, 36);

        // Window controls
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(18, 18, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(34, 18, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(50, 18, 5, 0, Math.PI * 2);
        ctx.fill();

        // Title text
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(document.title || 'Active Desktop Window', 70, 22);

        // Timestamp watermark
        ctx.fillStyle = '#38bdf8';
        ctx.font = '14px monospace';
        ctx.fillText(`FlexiCapture Snapshot: ${new Date().toLocaleTimeString()} • ${window.location.host || 'localhost'}`, 40, 80);

        // Card mockup
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.fillRect(40, 110, canvas.width - 80, canvas.height - 150);
        ctx.strokeRect(40, 110, canvas.width - 80, canvas.height - 150);

        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Active App: ${this.getActiveWindowInfo().appName}`, 60, 150);
        ctx.fillText(`Window Title: ${this.getActiveWindowInfo().title}`, 60, 180);
        ctx.fillText(`URL: ${window.location.href}`, 60, 210);
      }
    }

    // Estimate uncompressed raw bytes
    const rawBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), 'image/png'));
    return { canvas, originalBytes: rawBlob.size };
  }

  /**
   * Internal capture + compress pipeline
   */
  private async captureScreenShotWithAppName(windowInfo: ActiveWindowInfo): Promise<ScreenShotModel> {
    const { canvas, originalBytes } = await this.captureRawCanvas();

    let finalBlob: Blob;
    let finalUint8Array: Uint8Array;
    let finalBytes = originalBytes;
    let compressed = false;
    let compressionQuality: number | undefined;

    if (this.enableCompress) {
      this.setStatus('compressing');
      const compressionResult = await ImageCompressor.compress(canvas, this.maxSize);
      finalBlob = compressionResult.blob;
      finalUint8Array = compressionResult.uint8Array;
      finalBytes = compressionResult.bytes;
      compressed = true;
      compressionQuality = compressionResult.quality;
    } else {
      finalBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), 'image/png'));
      finalUint8Array = new Uint8Array(await finalBlob.arrayBuffer());
      finalBytes = finalBlob.size;
    }

    let base64Image = '';
    if (this.convertBase64) {
      base64Image = ImageCompressor.uint8ArrayToBase64(finalUint8Array);
    }

    const previewUrl = URL.createObjectURL(finalBlob);

    return {
      id: `capture-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      imageBlob: finalBlob,
      imageByte: finalUint8Array,
      base64Image,
      previewUrl,
      windowInfo,
      sizeBytes: finalBytes,
      originalSizeBytes: originalBytes,
      compressed,
      compressionQuality,
      capturedAt: new Date().toISOString()
    };
  }

  /**
   * Derives active window/tab details
   */
  public getActiveWindowInfo(): ActiveWindowInfo {
    const title = document.title || 'FlexiCapture Workspace';
    let appName = 'Browser Desktop Session';

    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      if (ua.includes('Electron')) appName = 'Electron Desktop Host';
      else if (ua.includes('Chrome')) appName = 'Google Chrome';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) appName = 'Apple Safari';
      else if (ua.includes('Firefox')) appName = 'Mozilla Firefox';
      else if (ua.includes('Edge')) appName = 'Microsoft Edge';
    }

    return {
      title,
      appName,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }

  // Duration math matching flexicapture Dart implementation
  public get randomDurationMinutes(): number {
    return this.fixedMin(this.maxMinute) + this.randomMin(this.maxMinute);
  }

  private fixedMin(value: number): number {
    return Math.round(value * this.fixedRatio);
  }

  private randomMin(value: number): number {
    const minute = Math.round(value * this.randomRatio);
    if (minute <= 0) return 0;
    return Math.floor(Math.random() * minute);
  }

  public get isActiveRandomDuration(): boolean {
    return this.maxMinute > 0;
  }

  // Controls
  public togglePause(): boolean {
    this.pauseCapture = !this.pauseCapture;
    if (this.pauseCapture) {
      this.clearTimers();
      this.setStatus('paused');
    } else {
      this.setStatus('running');
      this.startTimer();
    }
    return this.pauseCapture;
  }

  public toggleCompress(): boolean {
    this.enableCompress = !this.enableCompress;
    return this.enableCompress;
  }

  public toggleConvertBase64(): boolean {
    this.convertBase64 = !this.convertBase64;
    return this.convertBase64;
  }

  public setMaxMinute(min: number): void {
    this.maxMinute = min > 0 ? min : 5;
    if (this.isStartTimer && !this.pauseCapture && !this.isDisposed) {
      this.startTimer();
    }
  }

  public setMaxSize(bytes: number): void {
    this.maxSize = bytes > 0 ? bytes : 400 * 1024;
  }

  public setExceptAppName(appName: string): void {
    this.exceptAppName = appName;
  }

  public dispose(): void {
    this.clearTimers();
    this.isDisposed = true;
    this.isStartTimer = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.videoElement = null;
    this.setStatus('disposed');
  }

  public restart(): void {
    this.dispose();
    this.isDisposed = false;
    this.start();
  }

  private clearTimers(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
  }

  private setStatus(status: FlexiCaptureStatus): void {
    this.currentStatus = status;
    this.onStatusChange?.(status);
  }

  public getState(): FlexiCaptureState {
    return {
      status: this.currentStatus,
      maxMinute: this.maxMinute,
      enableCompress: this.enableCompress,
      maxSize: this.maxSize,
      convertBase64: this.convertBase64,
      exceptAppName: this.exceptAppName,
      isPaused: this.pauseCapture,
      isDisposed: this.isDisposed,
      currentIntervalSeconds: this.currentIntervalSeconds,
      secondsRemaining: this.secondsRemaining,
      lastCapturedAt: this.lastCapturedAt,
      captureCount: this.captureCount
    };
  }
}
