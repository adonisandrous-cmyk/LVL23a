/**
 * FlexiCapture Types & Data Contracts
 * Ported from https://github.com/prabhuc94/flexicapture
 */

export interface ActiveWindowInfo {
  title: string;
  appName: string;
  processId?: number;
  url?: string;
  timestamp: string;
}

export interface ScreenShotModel {
  id: string;
  imageBlob?: Blob;
  imageByte?: Uint8Array;
  base64Image?: string;
  previewUrl: string;
  windowInfo: ActiveWindowInfo;
  sizeBytes: number;
  originalSizeBytes: number;
  compressed: boolean;
  compressionQuality?: number;
  capturedAt: string;
}

export interface FlexiCaptureOptions {
  maxMinute: number;
  fixedRatio: number;
  randomRatio: number;
  enableCompress: boolean;
  maxSize: number; // in bytes, e.g. 400 * 1024
  convertBase64: boolean;
  exceptAppName?: string;
  captureWithAppDetails: boolean;
}

export type FlexiCaptureStatus = 'idle' | 'running' | 'paused' | 'capturing' | 'compressing' | 'disposed';

export interface FlexiCaptureState {
  status: FlexiCaptureStatus;
  maxMinute: number;
  enableCompress: boolean;
  maxSize: number;
  convertBase64: boolean;
  exceptAppName: string;
  isPaused: boolean;
  isDisposed: boolean;
  currentIntervalSeconds: number;
  secondsRemaining: number;
  lastCapturedAt: string | null;
  captureCount: number;
}
