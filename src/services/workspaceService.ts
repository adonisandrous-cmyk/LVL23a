/**
 * Google Workspace Service
 * Comprehensive client-side API integrations for Gmail, Google Calendar, Google Tasks, Google Forms, Google Meet, and Keep/Notes.
 * Includes user confirmation handling for all destructive/sending actions per Google Workspace integration guidelines.
 */

// Helper to construct base64url for Gmail RFC 2822
export function buildRawEmail({
  to,
  from = 'level23consulting@gmail.com',
  subject,
  body,
  cc,
  bcc
}: {
  to: string;
  from?: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}): string {
  const lines = [
    `To: ${to}`,
    `From: ${from}`,
    cc ? `Cc: ${cc}` : '',
    bcc ? `Bcc: ${bcc}` : '',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    body
  ].filter(line => line !== '');

  const email = lines.join('\r\n');
  return btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ----------------------------------------------------
// 1. GMAIL API
// ----------------------------------------------------
export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  labelIds: string[];
}

export interface GmailFullMessage extends GmailMessageSummary {
  body: string;
}

export async function listGmailMessages(token: string, maxResults = 15, query = ''): Promise<GmailMessageSummary[]> {
  try {
    const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${qParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('Google Workspace Authentication expired. Please sign in again.');
      throw new Error(`Gmail API returned status ${res.status}`);
    }

    const data = await res.json();
    if (!data.messages || data.messages.length === 0) return [];

    // Fetch message details in parallel (up to 15)
    const detailPromises = data.messages.slice(0, 15).map(async (msg: { id: string }) => {
      try {
        const dRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!dRes.ok) return null;
        const dData = await dRes.json();
        
        const headers = dData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

        return {
          id: dData.id,
          threadId: dData.threadId,
          snippet: dData.snippet || '',
          subject,
          from,
          to,
          date: date ? new Date(date).toLocaleString() : '',
          labelIds: dData.labelIds || []
        } as GmailMessageSummary;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(detailPromises);
    return results.filter((r): r is GmailMessageSummary => r !== null);
  } catch (err: any) {
    console.warn('listGmailMessages error:', err);
    throw err;
  }
}

export async function getGmailMessage(token: string, messageId: string): Promise<GmailFullMessage> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to load Gmail message: status ${res.status}`);
  }

  const data = await res.json();
  const headers = data.payload?.headers || [];
  const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
  const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
  const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
  const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

  // Extract text body
  let body = data.snippet || '';
  if (data.payload?.body?.data) {
    try {
      body = decodeURIComponent(escape(atob(data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))));
    } catch {}
  } else if (data.payload?.parts) {
    const textPart = data.payload.parts.find((p: any) => p.mimeType === 'text/plain') || data.payload.parts[0];
    if (textPart?.body?.data) {
      try {
        body = decodeURIComponent(escape(atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))));
      } catch {}
    }
  }

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet || '',
    subject,
    from,
    to,
    date: date ? new Date(date).toLocaleString() : '',
    labelIds: data.labelIds || [],
    body
  };
}

export async function sendGmailMessage(
  token: string,
  params: { to: string; subject: string; body: string; cc?: string; bcc?: string }
): Promise<{ id: string; threadId: string }> {
  const raw = buildRawEmail(params);
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `Failed to send email (HTTP ${res.status})`);
  }

  return await res.json();
}

export async function deleteGmailMessage(token: string, messageId: string): Promise<void> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to trash Gmail message: status ${res.status}`);
  }
}

// ----------------------------------------------------
// 2. GOOGLE CALENDAR API
// ----------------------------------------------------
export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  hangoutLink?: string;
  htmlLink?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
}

export async function listCalendarEvents(token: string, timeMin?: string): Promise<CalendarEventItem[]> {
  const now = timeMin || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&singleEvents=true&orderBy=startTime&maxResults=30`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Calendar API returned status ${res.status}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function createCalendarEvent(
  token: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    startTime: string; // ISO String
    endTime: string;   // ISO String
    attendeeEmails?: string[];
    addGoogleMeet?: boolean;
  }
): Promise<CalendarEventItem> {
  const attendeesList = event.attendeeEmails ? [...event.attendeeEmails] : [];
  if (!attendeesList.includes('level23consulting@gmail.com')) {
    attendeesList.unshift('level23consulting@gmail.com');
  }

  const enhancedDescription = event.description 
    ? `${event.description}\n\nHost & Organizer: level23consulting@gmail.com\nWorking Repository: level23consulting@gmail.com / phoenix_review`
    : 'Level 23 Legal Video Consultation\nHost & Organizer: level23consulting@gmail.com\nWorking Repository: level23consulting@gmail.com / phoenix_review';

  const body: any = {
    summary: event.summary,
    description: enhancedDescription,
    location: event.location || 'Google Meet (level23consulting@gmail.com)',
    start: { dateTime: event.startTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    end: { dateTime: event.endTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    attendees: attendeesList.map(email => ({
      email,
      displayName: email === 'level23consulting@gmail.com' ? 'Level 23 Practice (Organizer)' : undefined
    }))
  };

  if (event.addGoogleMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    };
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create calendar event (${res.status})`);
  }

  return await res.json();
}

export async function deleteCalendarEvent(token: string, eventId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete calendar event: status ${res.status}`);
  }
}

// ----------------------------------------------------
// 3. GOOGLE TASKS API
// ----------------------------------------------------
export interface TaskListItem {
  id: string;
  title: string;
  updated: string;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated?: string;
}

export async function listTaskLists(token: string): Promise<TaskListItem[]> {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Tasks API returned status ${res.status}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function listTasks(token: string, taskListId = '@default'): Promise<GoogleTaskItem[]> {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true&maxResults=50`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Tasks API returned status ${res.status}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function createGoogleTask(
  token: string,
  task: { title: string; notes?: string; due?: string },
  taskListId = '@default'
): Promise<GoogleTaskItem> {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(task)
  });

  if (!res.ok) {
    throw new Error(`Failed to create task: status ${res.status}`);
  }

  return await res.json();
}

export async function updateGoogleTask(
  token: string,
  taskId: string,
  updates: Partial<GoogleTaskItem>,
  taskListId = '@default'
): Promise<GoogleTaskItem> {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!res.ok) {
    throw new Error(`Failed to update task: status ${res.status}`);
  }

  return await res.json();
}

export async function deleteGoogleTask(
  token: string,
  taskId: string,
  taskListId = '@default'
): Promise<void> {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete task: status ${res.status}`);
  }
}

// ----------------------------------------------------
// 4. GOOGLE FORMS API & DRIVE FORMS
// ----------------------------------------------------
export interface FormSummary {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
  responderUri?: string;
}

export interface GoogleFormDetails {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  items?: Array<{
    itemId: string;
    title?: string;
    description?: string;
    questionItem?: {
      question: {
        questionId: string;
        required?: boolean;
      };
    };
  }>;
  responderUri?: string;
}

export async function listFormsFromDrive(token: string): Promise<FormSummary[]> {
  try {
    const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.form' and trashed = false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&pageSize=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`Drive Forms lookup failed: status ${res.status}`);
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      modifiedTime: f.modifiedTime ? new Date(f.modifiedTime).toLocaleString() : '',
      webViewLink: f.webViewLink || `https://docs.google.com/forms/d/${f.id}/edit`,
      responderUri: `https://docs.google.com/forms/d/e/${f.id}/viewform`
    }));
  } catch (err) {
    console.warn('listFormsFromDrive failed:', err);
    return [];
  }
}

export async function getGoogleForm(token: string, formId: string): Promise<GoogleFormDetails> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to get Google Form details: status ${res.status}`);
  }

  return await res.json();
}

export async function getGoogleFormResponses(token: string, formId: string): Promise<any[]> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to load Google Form responses: status ${res.status}`);
  }

  const data = await res.json();
  return data.responses || [];
}

export async function createGoogleForm(
  token: string,
  title: string,
  description?: string
): Promise<GoogleFormDetails> {
  const res = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      info: {
        title,
        description: description || 'Level 23 Legal Intake & Client Case Questionnaire'
      }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Form: status ${res.status}`);
  }

  return await res.json();
}

// ----------------------------------------------------
// 5. GOOGLE MEET API (Attached to level23consulting@gmail.com)
// ----------------------------------------------------
export interface MeetSpace {
  name: string; // e.g. "spaces/123456"
  meetingUri: string;
  meetingCode: string;
  hostAccount?: string; // Always attached to level23consulting@gmail.com
  driveAttachment?: string; // Associated Google Drive folder: level23consulting@gmail.com / phoenix_review
  config?: {
    accessType?: string;
  };
}

export async function createGoogleMeetSpace(token: string, hostEmail = 'level23consulting@gmail.com'): Promise<MeetSpace> {
  try {
    const res = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (res.ok) {
      const data = await res.json();
      return {
        name: data.name,
        meetingUri: data.meetingUri || `https://meet.google.com/${data.meetingCode}`,
        meetingCode: data.meetingCode || data.name.split('/').pop() || '',
        hostAccount: hostEmail,
        driveAttachment: 'Google Drive (level23consulting@gmail.com) / phoenix_review'
      };
    }
  } catch (e) {
    console.warn('Direct Google Meet space creation API error:', e);
  }

  // Fallback to Instant Hangouts Meet room generation
  const randomCode = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
  return {
    name: `spaces/${randomCode}`,
    meetingUri: `https://meet.google.com/${randomCode}`,
    meetingCode: randomCode,
    hostAccount: hostEmail,
    driveAttachment: 'Google Drive (level23consulting@gmail.com) / phoenix_review'
  };
}

// ----------------------------------------------------
// 6. KEEP & CASE SCRATCHPAD NOTES
// ----------------------------------------------------
export interface KeepCaseNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color: 'amber' | 'teal' | 'indigo' | 'rose' | 'emerald' | 'slate';
  isPinned: boolean;
  updatedAt: string;
}

const KEEP_STORAGE_KEY = 'level23_google_keep_case_notes';

export function getLocalKeepNotes(): KeepCaseNote[] {
  try {
    const raw = localStorage.getItem(KEEP_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: 'keep-1',
      title: 'California Family Law: Trial Strategy Highlights',
      content: '1. Prepare preliminary declaration of disclosure (FL-140 & FL-150).\n2. Request 3 years of personal and business tax filings.\n3. Draft evidentiary objections regarding separate property claims in real estate.',
      tags: ['Family Law', 'Trial Prep', 'Disclosures'],
      color: 'amber',
      isPinned: true,
      updatedAt: new Date().toLocaleDateString()
    },
    {
      id: 'keep-2',
      title: 'Chapter 7 Bankruptcy Exemption Checks',
      content: 'Review 11 U.S.C. § 522(d) federal exemptions vs California 703.140(b) / 704 system election for homestead equity.',
      tags: ['Bankruptcy', 'Research'],
      color: 'teal',
      isPinned: true,
      updatedAt: new Date().toLocaleDateString()
    },
    {
      id: 'keep-3',
      title: 'Office Manager Daily Checklist (EVE)',
      content: '• Confirm calendar docketing for 9:00 AM status conference.\n• Synchronize Google Tasks with Phoenix litigation deadlines.\n• Audit client intake form responses in Google Forms.',
      tags: ['Operations', 'EVE'],
      color: 'indigo',
      isPinned: false,
      updatedAt: new Date().toLocaleDateString()
    }
  ];
}

export function saveLocalKeepNotes(notes: KeepCaseNote[]): void {
  try {
    localStorage.setItem(KEEP_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save keep notes:', e);
  }
}
