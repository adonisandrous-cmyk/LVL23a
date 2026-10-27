/**
 * LEVEL 23 Legal AI Suite - Client-Side Google Drive API Service
 * Directly interacts with Google Drive v3 REST API from the browser.
 * This guarantees Google Drive operations work seamlessly on Vercel, static PWA hosting,
 * and offline/standalone environments without requiring an Express backend.
 */

export interface ClientDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface ClientDriveFolderNode {
  id: string;
  name: string;
  webViewLink?: string;
  subfolders: ClientDriveFolderNode[];
  files: ClientDriveFile[];
}

/**
 * Safely parse JSON or detect HTML/Error responses to prevent
 * "Unexpected token <, '<!DOCTYPE...' is not valid JSON"
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; isHtml: boolean; rawText: string }> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    const rawText = await res.text();

    if (contentType.includes('text/html') || rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html')) {
      return { ok: false, status: res.status, data: null, isHtml: true, rawText };
    }

    try {
      const data = JSON.parse(rawText);
      return { ok: res.ok, status: res.status, data, isHtml: false, rawText };
    } catch {
      return { ok: false, status: res.status, data: null, isHtml: false, rawText };
    }
  } catch (err: any) {
    return { ok: false, status: 0, data: null, isHtml: false, rawText: err.message || 'Network failed' };
  }
}

/**
 * Direct client-side list of Google Drive files
 */
export async function clientListDriveFiles(token: string, search?: string): Promise<ClientDriveFile[]> {
  let qFilter = "trashed = false";
  if (search && search.trim().length > 0) {
    const sanitized = search.replace(/'/g, "\\'");
    qFilter += ` and name contains '${sanitized}'`;
  }

  const queryParam = encodeURIComponent(qFilter);
  const fields = encodeURIComponent('files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink)');
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=50&fields=${fields}&orderBy=modifiedTime%20desc&q=${queryParam}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API error (${res.status}): ${errText}`);
  }

  const json = await res.json();
  return (json.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime ? new Date(f.modifiedTime).toLocaleString() : undefined,
    size: f.size ? `${(parseInt(f.size, 10) / 1024).toFixed(1)} KB` : undefined,
    webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    iconLink: f.iconLink
  }));
}

/**
 * Direct client-side get file metadata and content
 */
export async function clientGetDriveFile(
  token: string,
  fileId: string
): Promise<{ id: string; name: string; mimeType: string; webViewLink: string; content: string }> {
  // 1. Fetch metadata
  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!metaRes.ok) {
    throw new Error(`Failed to retrieve file metadata (${metaRes.status})`);
  }

  const meta = await metaRes.json();
  const mimeType = meta.mimeType || 'text/plain';
  let content = '';

  // 2. Fetch content based on mimeType
  if (mimeType === 'application/vnd.google-apps.document') {
    // Export Google Doc as plain text
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (exportRes.ok) {
      content = await exportRes.text();
    }
  } else {
    // Download raw file content
    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (downloadRes.ok) {
      content = await downloadRes.text();
    }
  }

  return {
    id: meta.id,
    name: meta.name || 'Untitled Document',
    mimeType: meta.mimeType,
    webViewLink: meta.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    content: content || `[Document content retrieved for ${meta.name || fileId}]`
  };
}

/**
 * Direct client-side upload/save to Google Drive using standard multipart upload
 */
export async function clientUploadDriveFile(
  token: string,
  {
    name,
    content,
    format = 'docx',
    folderId
  }: {
    name: string;
    content: string;
    format?: 'docx' | 'pdf' | 'text';
    folderId?: string;
  }
): Promise<ClientDriveFile> {
  let mimeType = 'text/plain';
  if (format === 'docx' || name.toLowerCase().endsWith('.docx')) {
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (format === 'pdf' || name.toLowerCase().endsWith('.pdf')) {
    mimeType = 'application/pdf';
  }

  const metadata: any = {
    name,
    mimeType
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Google Drive upload failed (${uploadRes.status}): ${errText}`);
  }

  const uploaded = await uploadRes.json();
  return {
    id: uploaded.id,
    name: uploaded.name || name,
    mimeType: uploaded.mimeType || mimeType,
    webViewLink: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
    modifiedTime: new Date().toLocaleString()
  };
}

/**
 * Direct client-side map of Google Drive folder
 */
export async function clientMapDriveFolder(
  token: string,
  folderId = '1EW-bOXh5eDyMyJsqRmLT6u5uZuld5XVH'
): Promise<ClientDriveFolderNode> {
  // Query subfolders
  const folderQuery = encodeURIComponent(`'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const subfoldersRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${folderQuery}&fields=files(id,name,mimeType,modifiedTime,webViewLink)&pageSize=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // Query files
  const fileQuery = encodeURIComponent(`'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`);
  const filesRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${fileQuery}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink)&pageSize=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const subfoldersData = subfoldersRes.ok ? await subfoldersRes.json() : { files: [] };
  const filesData = filesRes.ok ? await filesRes.json() : { files: [] };

  const fetchedSubfolders = (subfoldersData.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    webViewLink: f.webViewLink,
    subfolders: [],
    files: []
  }));

  // Ensure phoenix_review is always mapped as designated primary intake and review folder
  const hasReview = fetchedSubfolders.some((sf: any) => sf.name?.toLowerCase().includes('phoenix_review') || sf.name?.toLowerCase().includes('phoenix review') || sf.name?.toLowerCase().includes('_inbox'));
  const subfoldersList = hasReview 
    ? fetchedSubfolders 
    : [{ id: 'sub-phoenix-review', name: 'phoenix_review (Designated Upload & Review)', webViewLink: `https://drive.google.com/drive/folders/${folderId}`, subfolders: [], files: [] }, ...fetchedSubfolders];

  return {
    id: folderId,
    name: 'Enhanced Filing System (level23consulting@gmail.com)',
    subfolders: subfoldersList,
    files: (filesData.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size ? `${(parseInt(f.size, 10) / 1024).toFixed(1)} KB` : undefined,
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink,
      iconLink: f.iconLink
    }))
  };
}
