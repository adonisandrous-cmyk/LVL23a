// Google Drive Background & Periodic Synchronization Service for level23consulting@gmail.com

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
export const GOOGLE_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH?usp=drive_link';

// Central in-memory state
let currentSyncState: DriveSyncState = {
  accountEmail: DEFAULT_ACCOUNT_EMAIL,
  targetFolderId: DEFAULT_TARGET_FOLDER_ID,
  lastSyncedAt: new Date().toISOString(),
  status: 'idle',
  syncedFilesCount: 0,
  mappedFoldersCount: 4,
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
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_AUTH_TOKEN) : null;
    const res = await fetch('/api/drive/map-folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ folderId })
    });

    const data = await res.json();
    if (res.ok && data.success && data.folderStructure) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY_FOLDER_MAP, JSON.stringify(data.folderStructure));
      }
      currentSyncState.mappedFoldersCount = data.folderStructure.subfolders?.length || 4;
      notifyListeners();
      return data.folderStructure;
    } else if (res.status === 401 || res.status === 403 || (data && data.error && (data.error.includes('auth') || data.error.includes('token') || data.error.includes('permission')))) {
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

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_AUTH_TOKEN) : null;
    
    // Check if token exists in client browser session
    const res = await fetch('/api/drive/sync-folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ folderId })
    });

    const data = await res.json();
    if (res.ok && data.success) {
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
    } else {
      const isAuthError = res.status === 401 || res.status === 403 || (data && data.error && (data.error.includes('auth') || data.error.includes('token') || data.error.includes('permission')));
      currentSyncState.status = 'error';
      currentSyncState.errorType = isAuthError ? 'auth_required' : 'sync_failed';
      currentSyncState.error = isAuthError 
        ? `Google Drive Authentication / Access Error: Permission required for folder ${folderId} (${DEFAULT_ACCOUNT_EMAIL}).`
        : (data.error || 'Periodic synchronization encountered an unexpected connection error.');
      currentSyncState.lastErrorAt = new Date().toISOString();
      notifyListeners();
    }
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
 */
export async function uploadClientDocumentToDrive(params: {
  name: string;
  content: string;
  clientName?: string;
  folderId?: string;
  mimeType?: string;
}): Promise<any> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_AUTH_TOKEN) : null;
  const targetFolderId = params.folderId || DEFAULT_TARGET_FOLDER_ID;

  const res = await fetch('/api/drive/upload-document', {
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

  const data = await res.json();
  if (res.ok && data.success) {
    // Re-trigger background sync to update local manifest
    syncDriveFiles(targetFolderId).catch(() => {});
    return data.file;
  }

  throw new Error(data.error || 'Failed to upload document to Google Drive.');
}

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
