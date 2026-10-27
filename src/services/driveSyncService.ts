// Google Drive Background & Periodic Synchronization Service for level23consulting@gmail.com
import {
  safeFetchJson,
  clientMapDriveFolder,
  clientListDriveFiles,
  clientUploadDriveFile
} from '../lib/driveClient';

export interface DriveSyncedFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  offlineAvailable: boolean;
  syncedAt: string;
}

export interface DriveFolderNode {
  id: string;
  name: string;
  webViewLink?: string;
  subfolders?: DriveFolderNode[];
  files?: DriveSyncedFile[];
}

export interface DriveSyncState {
  accountEmail: string;
  targetFolderId: string;
  lastSyncedAt: string;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  syncedFilesCount: number;
  mappedFoldersCount: number;
  error?: string | null;
  errorType?: 'auth_required' | 'access_denied' | 'network_error' | 'sync_failed' | null;
  lastErrorAt?: string | null;
  manifest: DriveSyncedFile[];
}

const LOCAL_STORAGE_KEY_OFFLINE_CACHE = 'legal_suite_drive_offline_cache';
const LOCAL_STORAGE_KEY_FOLDER_MAP = 'legal_suite_drive_folder_map';
const LOCAL_STORAGE_KEY_AUTH_TOKEN = 'google_drive_access_token';
export const DEFAULT_TARGET_FOLDER_ID = '1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH';
export const DEFAULT_ACCOUNT_EMAIL = 'level23consulting@gmail.com';
export const DEFAULT_INBOX_FOLDER = 'phoenix_review';
export const DESIGNATED_REVIEW_FOLDER = 'phoenix_review';
export const GOOGLE_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link';

// Central in-memory state
let currentSyncState: DriveSyncState = {
  accountEmail: DEFAULT_ACCOUNT_EMAIL,
  targetFolderId: DEFAULT_TARGET_FOLDER_ID,
  lastSyncedAt: new Date().toISOString(),
  status: 'idle',
  syncedFilesCount: 0,
  mappedFoldersCount: 5,
  error: null,
  errorType: null,
  lastErrorAt: null,
  manifest: []
};

// Listeners for reactive updates
const listeners = new Set<(state: DriveSyncState) => void>();

function notifyListeners() {
  listeners.forEach(cb => {
    try { cb({ ...currentSyncState }); } catch (e) { console.error("Drive sync listener error:", e); }
  });
}

export function getDriveSyncState(): DriveSyncState {
  return { ...currentSyncState };
}

export function subscribeDriveSync(listener: (state: DriveSyncState) => void): () => void {
  listeners.add(listener);
  listener({ ...currentSyncState });
  return () => {
    listeners.delete(listener);
  };
}

export function clearDriveSyncError() {
  currentSyncState.error = null;
  currentSyncState.errorType = null;
  notifyListeners();
}

/**
 * Fetch and map the Google Drive folder hierarchy for level23consulting@gmail.com
 */
export async function mapDriveFolderStructure(folderId = DEFAULT_TARGET_FOLDER_ID): Promise<DriveFolderNode | null> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_AUTH_TOKEN) : null;

  try {
    // 1. Try server API with safe JSON response checking
    const res = await safeFetchJson('/api/drive/map-folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ folderId })
    });

    const data = res.data;
    if (res.ok && data && data.success && data.folderStructure) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY_FOLDER_MAP, JSON.stringify(data.folderStructure));
      }
      currentSyncState.mappedFoldersCount = data.folderStructure.subfolders?.length || 4;
      notifyListeners();
      return data.folderStructure;
    }

    // 2. If running on Vercel/Static PWA (HTML response or 404), fall back to direct client-side Google Drive API
    if ((res.isHtml || res.status === 404 || !res.ok) && token && !token.startsWith('ya29.Level23Consulting_Drive')) {
      try {
        const clientStructure = await clientMapDriveFolder(token, folderId);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY_FOLDER_MAP, JSON.stringify(clientStructure));
        }
        currentSyncState.mappedFoldersCount = clientStructure.subfolders?.length || 0;
        notifyListeners();
        return clientStructure as any;
      } catch (clientErr: any) {
        console.warn('Direct client Drive folder map fallback failed:', clientErr);
      }
    }

    if (res.status === 401 || res.status === 403 || (data && data.error && (data.error.includes('auth') || data.error.includes('token') || data.error.includes('permission')))) {
      currentSyncState.status = 'error';
      currentSyncState.errorType = 'auth_required';
      currentSyncState.error = `Google Drive authentication error: Valid access token required to map folder ${folderId} (${DEFAULT_ACCOUNT_EMAIL}).`;
      currentSyncState.lastErrorAt = new Date().toISOString();
      notifyListeners();
    }
  } catch (err: any) {
    console.warn('⚠️ Map folder failed, returning offline cached map:', err);
  }

  // Return offline cached folder map if fetch failed
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_FOLDER_MAP);
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
  }

  return null;
}

/**
 * Perform background synchronization of files into offline state
 */
export async function syncDriveFiles(folderId = DEFAULT_TARGET_FOLDER_ID): Promise<{
  lastSyncedAt: string;
  syncedFilesCount: number;
  manifest: DriveSyncedFile[];
}> {
  currentSyncState.status = 'syncing';
  notifyListeners();

  const token = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_AUTH_TOKEN) : null;

  try {
    // 1. Try server API with safe JSON response checking
    const res = await safeFetchJson('/api/drive/sync-folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ folderId })
    });

    const data = res.data;
    if (res.ok && data && data.success) {
      const result = {
        lastSyncedAt: data.lastSyncedAt || new Date().toISOString(),
        syncedFilesCount: data.syncedFilesCount || 0,
        manifest: data.manifest || []
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY_OFFLINE_CACHE, JSON.stringify(result));
      }

      currentSyncState.status = 'synced';
      currentSyncState.lastSyncedAt = result.lastSyncedAt;
      currentSyncState.syncedFilesCount = result.syncedFilesCount;
      currentSyncState.manifest = result.manifest;
      currentSyncState.error = null;
      currentSyncState.errorType = null;
      notifyListeners();

      return result;
    }

    // 2. Direct client Google Drive fallback for Vercel / PWA environments
    if ((res.isHtml || res.status === 404 || !res.ok) && token && !token.startsWith('ya29.Level23Consulting_Drive')) {
      try {
        const clientFiles = await clientListDriveFiles(token);
        const result = {
          lastSyncedAt: new Date().toISOString(),
          syncedFilesCount: clientFiles.length,
          manifest: clientFiles.map(f => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            size: f.size,
            modifiedTime: f.modifiedTime,
            webViewLink: f.webViewLink,
            offlineAvailable: true,
            syncedAt: new Date().toISOString()
          }))
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY_OFFLINE_CACHE, JSON.stringify(result));
        }

        currentSyncState.status = 'synced';
        currentSyncState.lastSyncedAt = result.lastSyncedAt;
        currentSyncState.syncedFilesCount = result.syncedFilesCount;
        currentSyncState.manifest = result.manifest;
        currentSyncState.error = null;
        currentSyncState.errorType = null;
        notifyListeners();

        return result;
      } catch (clientErr: any) {
        console.warn('Direct client Drive list fallback failed:', clientErr);
      }
    }

    const isAuthError = res.status === 401 || res.status === 403 || (data && data.error && (data.error.includes('auth') || data.error.includes('token') || data.error.includes('permission')));
    currentSyncState.status = 'error';
    currentSyncState.errorType = isAuthError ? 'auth_required' : 'sync_failed';
    currentSyncState.error = isAuthError 
      ? `Google Drive Authentication / Access Error: Permission required for folder ${folderId} (${DEFAULT_ACCOUNT_EMAIL}).`
      : (data?.error || 'Periodic synchronization encountered an unexpected connection error.');
    currentSyncState.lastErrorAt = new Date().toISOString();
    notifyListeners();
  } catch (err: any) {
    console.warn('⚠️ Sync Drive files network/auth error fallback:', err);
    currentSyncState.status = 'error';
    currentSyncState.errorType = 'network_error';
    currentSyncState.error = `Periodic Google Drive sync error: ${err.message || 'Network unreachable'}.`;
    currentSyncState.lastErrorAt = new Date().toISOString();
    notifyListeners();
  }

  return getOfflineCachedDriveState();
}

/**
 * Force manual immediate drive sync attempt
 */
export async function forceDriveSync(folderId = DEFAULT_TARGET_FOLDER_ID): Promise<DriveSyncState> {
  clearDriveSyncError();
  await mapDriveFolderStructure(folderId);
  await syncDriveFiles(folderId);
  return getDriveSyncState();
}

/**
 * Auto-upload a new client intake document or case evidence file directly to Google Drive
 * Defaults directly to the designated 'phoenix_review' folder in level23consulting@gmail.com
 */
export async function uploadClientDocumentToDrive(params: {
  name: string;
  content: string;
  clientName?: string;
  folderId?: string;
  mimeType?: string;
}): Promise<any> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_AUTH_TOKEN) : null;
  const targetFolderId = params.folderId || DESIGNATED_REVIEW_FOLDER;

  // 1. Try server API with safe JSON handling
  const res = await safeFetchJson('/api/drive/upload-document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      name: params.name,
      content: params.content,
      clientName: params.clientName,
      folderId: targetFolderId,
      mimeType: params.mimeType || 'text/plain'
    })
  });

  const data = res.data;
  if (res.ok && data && data.success) {
    syncDriveFiles(DEFAULT_TARGET_FOLDER_ID).catch(() => {});
    return data.file;
  }

  // 2. Direct client Google Drive upload fallback for Vercel / PWA environments
  if ((res.isHtml || res.status === 404 || !res.ok) && token && !token.startsWith('ya29.Level23Consulting_Drive')) {
    try {
      const uploaded = await clientUploadDriveFile(token, {
        name: params.name,
        content: params.content,
        folderId: DEFAULT_TARGET_FOLDER_ID
      });
      syncDriveFiles(DEFAULT_TARGET_FOLDER_ID).catch(() => {});
      return uploaded;
    } catch (clientErr: any) {
      console.warn('Direct client Drive upload fallback failed:', clientErr);
    }
  }

  throw new Error(data?.error || 'Failed to upload document to Google Drive.');
}

/**
 * Dedicated helper to upload directly to Phoenix's designated phoenix_review folder
 */
export async function uploadToPhoenixReview(name: string, content: string, clientName?: string): Promise<any> {
  return uploadClientDocumentToDrive({
    name,
    content,
    clientName,
    folderId: DESIGNATED_REVIEW_FOLDER
  });
}

/**
 * Backward compatibility alias for uploadToPhoenixReview
 */
export const uploadToInbox = uploadToPhoenixReview;

/**
 * Retrieve offline cached drive state
 */
export function getOfflineCachedDriveState(): {
  lastSyncedAt: string;
  syncedFilesCount: number;
  manifest: DriveSyncedFile[];
} {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_OFFLINE_CACHE);
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
  }

  return {
    lastSyncedAt: new Date().toISOString(),
    syncedFilesCount: 0,
    manifest: []
  };
}

/**
 * Start periodic background synchronization task (runs every intervalMs milliseconds)
 */
export function startPeriodicDriveSync(intervalMs = 60000, folderId = DEFAULT_TARGET_FOLDER_ID): () => void {
  // Initial sync
  mapDriveFolderStructure(folderId).catch(() => {});
  syncDriveFiles(folderId).catch(() => {});

  const intervalId = setInterval(() => {
    mapDriveFolderStructure(folderId).catch(() => {});
    syncDriveFiles(folderId).catch(() => {});
  }, intervalMs);

  return () => clearInterval(intervalId);
}
