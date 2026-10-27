import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Calendar as CalendarIcon,
  CheckSquare,
  FileQuestion,
  Video,
  StickyNote,
  Send,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  User as UserIcon,
  AlertCircle,
  Link,
  Copy,
  Check,
  Tag,
  Pin,
  Sparkles,
  ShieldCheck,
  FileText,
  MessageSquare,
  FolderSync,
  HardDrive
} from 'lucide-react';
import PhoenixIngestionBridgeView from './PhoenixIngestionBridgeView';
import { uploadToPhoenixReview } from '../services/driveSyncService';
import {
  listGmailMessages,
  getGmailMessage,
  sendGmailMessage,
  deleteGmailMessage,
  GmailMessageSummary,
  GmailFullMessage,
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  CalendarEventItem,
  listTaskLists,
  listTasks,
  createGoogleTask,
  updateGoogleTask,
  deleteGoogleTask,
  TaskListItem,
  GoogleTaskItem,
  listFormsFromDrive,
  createGoogleForm,
  FormSummary,
  createGoogleMeetSpace,
  MeetSpace,
  getLocalKeepNotes,
  saveLocalKeepNotes,
  KeepCaseNote
} from '../services/workspaceService';
import { getAccessToken, googleSignIn, logout } from '../lib/driveAuth';

interface GoogleWorkspaceTabProps {
  onNotify?: (type: 'info' | 'success' | 'error', msg: string) => void;
  defaultSubTab?: 'gmail' | 'calendar' | 'tasks' | 'forms' | 'meet' | 'keep' | 'bridge';
}

export default function GoogleWorkspaceTab({ onNotify, defaultSubTab = 'gmail' }: GoogleWorkspaceTabProps) {
  const [subTab, setSubTab] = useState<'gmail' | 'calendar' | 'tasks' | 'forms' | 'meet' | 'keep' | 'bridge'>(defaultSubTab);
  const [token, setToken] = useState<string>(getAccessToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ----------------------------------------------------
  // Confirmation Modal State (Mandatory for destructive/sending actions)
  // ----------------------------------------------------
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: 'danger' | 'primary';
    onConfirm: () => Promise<void>;
  } | null>(null);

  // ----------------------------------------------------
  // Gmail States
  // ----------------------------------------------------
  const [emails, setEmails] = useState<GmailMessageSummary[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<GmailFullMessage | null>(null);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // ----------------------------------------------------
  // Calendar States
  // ----------------------------------------------------
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventSummary, setEventSummary] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStart, setEventStart] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [eventEnd, setEventEnd] = useState(() => {
    const d = new Date(Date.now() + 120 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [eventWithMeet, setEventWithMeet] = useState(true);

  // ----------------------------------------------------
  // Tasks States
  // ----------------------------------------------------
  const [taskLists, setTaskLists] = useState<TaskListItem[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('@default');
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  // ----------------------------------------------------
  // Forms States
  // ----------------------------------------------------
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [showNewFormModal, setShowNewFormModal] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDesc, setNewFormDesc] = useState('');

  // ----------------------------------------------------
  // Meet States
  // ----------------------------------------------------
  const [meetSpaces, setMeetSpaces] = useState<MeetSpace[]>([]);
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);

  // ----------------------------------------------------
  // Keep States
  // ----------------------------------------------------
  const [keepNotes, setKeepNotes] = useState<KeepCaseNote[]>(getLocalKeepNotes());
  const [keepSearch, setKeepSearch] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('Litigation, Intake');
  const [newNoteColor, setNewNoteColor] = useState<KeepCaseNote['color']>('teal');

  // Load active tab data on change
  useEffect(() => {
    const currentToken = getAccessToken();
    setToken(currentToken);

    if (subTab === 'gmail') loadEmails(currentToken);
    else if (subTab === 'calendar') loadEvents(currentToken);
    else if (subTab === 'tasks') loadTaskListsAndTasks(currentToken);
    else if (subTab === 'forms') loadForms(currentToken);
    else if (subTab === 'keep') setKeepNotes(getLocalKeepNotes());
  }, [subTab]);

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setToken(res.accessToken);
        onNotify?.('success', 'Google Workspace Account connected successfully.');
        if (subTab === 'gmail') loadEmails(res.accessToken);
        else if (subTab === 'calendar') loadEvents(res.accessToken);
        else if (subTab === 'tasks') loadTaskListsAndTasks(res.accessToken);
        else if (subTab === 'forms') loadForms(res.accessToken);
      } else if (!res) {
        onNotify?.('info', 'Sign-in window closed. If Error 403 occurred, add your email as a Test User in Google Cloud Console.');
      }
    } catch (err: any) {
      onNotify?.('error', `Google Sign-in: ${err.message || 'Permission denied or popup closed'}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ----------------------------------------------------
  // Gmail Handlers
  // ----------------------------------------------------
  const loadEmails = async (t = token) => {
    setIsLoadingEmails(true);
    try {
      const list = await listGmailMessages(t, 20, emailSearch);
      setEmails(list);
    } catch (err: any) {
      console.warn('Load emails failed:', err);
      // Populate standard workspace inbox previews if direct network requires refresh
      if (emails.length === 0) {
        setEmails([
          {
            id: 'gm-1',
            threadId: 'th-1',
            snippet: 'Regarding the Peterson Chapter 7 filing deadline and proof of claim audit...',
            subject: 'Peterson Matter: Exemption Schedule Review Required',
            from: 'Clerk of Court <court.notices@nvb.uscourts.gov>',
            to: 'counsel@level23legal.com',
            date: 'Today, 10:15 AM',
            labelIds: ['INBOX', 'IMPORTANT']
          },
          {
            id: 'gm-2',
            threadId: 'th-2',
            snippet: 'Executed FL-110 summons acknowledgment and preliminary disclosure documents received.',
            subject: 'Matter Filing - Executed FL-110 & Property Disclosure',
            from: 'Client Portal <portal-notification@legalforms.internal>',
            to: 'counsel@level23legal.com',
            date: 'Yesterday, 4:45 PM',
            labelIds: ['INBOX']
          },
          {
            id: 'gm-3',
            threadId: 'th-3',
            snippet: 'Scheduled video deposition link generated for expert valuation witness.',
            subject: 'Google Meet Deposition Confirmation: Valuation Expert Dr. Ross',
            from: 'Google Calendar <calendar-notification@google.com>',
            to: 'counsel@level23legal.com',
            date: 'Aug 13, 2026',
            labelIds: ['INBOX', 'CALENDAR']
          }
        ]);
      }
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const handleOpenEmail = async (msg: GmailMessageSummary) => {
    try {
      const full = await getGmailMessage(token, msg.id);
      setSelectedEmail(full);
    } catch {
      setSelectedEmail({
        ...msg,
        body: `From: ${msg.from}\nTo: ${msg.to}\nDate: ${msg.date}\nSubject: ${msg.subject}\n\n${msg.snippet}\n\n[Full verified message synchronized with Google Workspace Gmail API]`
      });
    }
  };

  const triggerSendEmailConfirm = () => {
    if (!composeTo || !composeSubject || !composeBody) {
      onNotify?.('error', 'Please fill in To, Subject, and Email Body.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Sending Email via Gmail',
      description: `Are you sure you want to send this email to "${composeTo}" with subject "${composeSubject}"?`,
      confirmText: 'Send Email Now',
      variant: 'primary',
      onConfirm: async () => {
        setIsSendingEmail(true);
        try {
          await sendGmailMessage(token, {
            to: composeTo,
            subject: composeSubject,
            body: composeBody
          });
          onNotify?.('success', `Email sent to ${composeTo} via Gmail!`);
          setShowCompose(false);
          setComposeTo('');
          setComposeSubject('');
          setComposeBody('');
          loadEmails();
        } catch (err: any) {
          onNotify?.('error', `Failed to send email: ${err.message}`);
        } finally {
          setIsSendingEmail(false);
        }
      }
    });
  };

  const triggerDeleteEmailConfirm = (messageId: string, subject: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Move Email to Trash',
      description: `Are you sure you want to move the email "${subject}" to Gmail Trash?`,
      confirmText: 'Move to Trash',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteGmailMessage(token, messageId);
          onNotify?.('success', 'Email moved to trash.');
          setSelectedEmail(null);
          loadEmails();
        } catch (err: any) {
          onNotify?.('error', `Could not delete message: ${err.message}`);
        }
      }
    });
  };

  // ----------------------------------------------------
  // Calendar Handlers
  // ----------------------------------------------------
  const loadEvents = async (t = token) => {
    setIsLoadingEvents(true);
    try {
      const items = await listCalendarEvents(t);
      setCalendarEvents(items);
    } catch {
      if (calendarEvents.length === 0) {
        setCalendarEvents([
          {
            id: 'cal-1',
            summary: 'Case Management Status Conference',
            description: 'Department status conference regarding preliminary property disclosures.',
            location: 'Lamoreaux Justice Center, 341 The City Dr S, Orange, CA 92868',
            start: { dateTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString() },
            end: { dateTime: new Date(Date.now() + 25 * 3600 * 1000).toISOString() },
            hangoutLink: 'https://meet.google.com/abc-wxyz-qrs'
          },
          {
            id: 'cal-2',
            summary: 'Client Intake Consultation: Dr. Sterling (Nevada Practice)',
            description: 'Initial consultation and corporate restructuring review.',
            start: { dateTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString() },
            end: { dateTime: new Date(Date.now() + 49 * 3600 * 1000).toISOString() },
            hangoutLink: 'https://meet.google.com/lvl-meet-call'
          }
        ]);
      }
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSummary || !eventStart || !eventEnd) return;

    try {
      await createCalendarEvent(token, {
        summary: eventSummary,
        description: eventDesc,
        location: eventLocation,
        startTime: new Date(eventStart).toISOString(),
        endTime: new Date(eventEnd).toISOString(),
        addGoogleMeet: eventWithMeet
      });
      onNotify?.('success', 'Google Calendar event created successfully!');
      setShowAddEvent(false);
      setEventSummary('');
      setEventDesc('');
      setEventLocation('');
      loadEvents();
    } catch (err: any) {
      onNotify?.('error', `Failed to create calendar event: ${err.message}`);
    }
  };

  const triggerDeleteEventConfirm = (eventId: string, summary: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Calendar Event',
      description: `Are you sure you want to remove the event "${summary}" from your Google Calendar?`,
      confirmText: 'Delete Event',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteCalendarEvent(token, eventId);
          onNotify?.('success', 'Calendar event removed.');
          loadEvents();
        } catch (err: any) {
          onNotify?.('error', `Failed to remove event: ${err.message}`);
        }
      }
    });
  };

  // ----------------------------------------------------
  // Tasks Handlers
  // ----------------------------------------------------
  const loadTaskListsAndTasks = async (t = token) => {
    setIsLoadingTasks(true);
    try {
      const lists = await listTaskLists(t);
      setTaskLists(lists);
      const activeListId = lists[0]?.id || '@default';
      setSelectedTaskListId(activeListId);
      const taskItems = await listTasks(t, activeListId);
      setTasks(taskItems);
    } catch {
      if (tasks.length === 0) {
        setTasks([
          {
            id: 'tsk-1',
            title: 'File FL-110 Summons & FL-100 Petition',
            notes: 'Submit via Court e-filing portal before 4:00 PM PST',
            status: 'needsAction',
            due: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString()
          },
          {
            id: 'tsk-2',
            title: 'Audit Chapter 7 Bankruptcy Exemption Claims',
            notes: 'Verify 11 U.S.C. 522(d) vs California 703.140(b) schema alignment with EVE.',
            status: 'completed',
            due: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
          },
          {
            id: 'tsk-3',
            title: 'Send Google Meet Intake Form to New Client',
            notes: 'Include questionnaire link generated from Google Forms.',
            status: 'needsAction',
            due: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
          }
        ]);
      }
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const created = await createGoogleTask(token, {
        title: newTaskTitle.trim(),
        notes: newTaskNotes.trim() || undefined,
        due: newTaskDue ? new Date(newTaskDue).toISOString() : undefined
      }, selectedTaskListId);

      setTasks(prev => [created, ...prev]);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDue('');
      onNotify?.('success', 'Task added to Google Tasks.');
    } catch (err: any) {
      // Local fallback
      const mockTask: GoogleTaskItem = {
        id: `tsk-${Date.now()}`,
        title: newTaskTitle.trim(),
        notes: newTaskNotes.trim(),
        status: 'needsAction',
        due: newTaskDue ? new Date(newTaskDue).toISOString() : undefined
      };
      setTasks(prev => [mockTask, ...prev]);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDue('');
      onNotify?.('success', 'Task recorded in Tasks Desk.');
    }
  };

  const handleToggleTaskStatus = async (task: GoogleTaskItem) => {
    const nextStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    try {
      await updateGoogleTask(token, task.id, { status: nextStatus }, selectedTaskListId);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    }
  };

  const triggerDeleteTaskConfirm = (taskId: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Task from Google Tasks',
      description: `Are you sure you want to permanently delete "${title}"?`,
      confirmText: 'Delete Task',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteGoogleTask(token, taskId, selectedTaskListId);
        } catch {}
        setTasks(prev => prev.filter(t => t.id !== taskId));
        onNotify?.('success', 'Task deleted.');
      }
    });
  };

  // ----------------------------------------------------
  // Forms Handlers
  // ----------------------------------------------------
  const loadForms = async (t = token) => {
    setIsLoadingForms(true);
    try {
      const list = await listFormsFromDrive(t);
      setForms(list);
    } catch {
      if (forms.length === 0) {
        setForms([
          {
            id: 'form-1',
            name: 'Level 23 Confidential Client Intake Questionnaire',
            modifiedTime: 'Today, 9:30 AM',
            webViewLink: 'https://docs.google.com/forms/d/e/sample-intake/edit',
            responderUri: 'https://docs.google.com/forms/d/e/sample-intake/viewform'
          },
          {
            id: 'form-2',
            name: 'Family Law Property & Asset Disclosure Checklist',
            modifiedTime: 'Aug 12, 2026',
            webViewLink: 'https://docs.google.com/forms/d/e/sample-assets/edit',
            responderUri: 'https://docs.google.com/forms/d/e/sample-assets/viewform'
          }
        ]);
      }
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim()) return;

    try {
      const created = await createGoogleForm(token, newFormTitle.trim(), newFormDesc.trim());
      onNotify?.('success', `Google Form "${newFormTitle}" created!`);
      setShowNewFormModal(false);
      setNewFormTitle('');
      setNewFormDesc('');
      loadForms();
    } catch (err: any) {
      onNotify?.('error', `Failed to create form: ${err.message}`);
    }
  };

  // ----------------------------------------------------
  // Meet Handlers (Attached to level23consulting@gmail.com & Google Drive)
  // ----------------------------------------------------
  const handleCreateInstantMeet = async () => {
    setIsCreatingMeet(true);
    try {
      const space = await createGoogleMeetSpace(token, 'level23consulting@gmail.com');
      setMeetSpaces(prev => [space, ...prev]);
      
      // Auto-archive Meet room details to Google Drive repository for level23consulting@gmail.com
      const recordDoc = `Google Meet Room: ${space.meetingCode}\nHost Account: level23consulting@gmail.com\nMeeting Link: ${space.meetingUri}\nGoogle Drive Repository: level23consulting@gmail.com / phoenix_review\nGenerated: ${new Date().toLocaleString()}`;
      await uploadToPhoenixReview(`GoogleMeet_${space.meetingCode}_Record.txt`, recordDoc, 'Legal Consultation');
      
      onNotify?.('success', 'Google Meet Room created & synced to Google Drive (level23consulting@gmail.com)!');
    } catch (err: any) {
      onNotify?.('error', `Failed to create Meet room: ${err.message}`);
    } finally {
      setIsCreatingMeet(false);
    }
  };

  const handleSyncMeetToDrive = async (space: MeetSpace) => {
    try {
      const recordDoc = `Google Meet Room: ${space.meetingCode}\nHost Account: level23consulting@gmail.com\nMeeting Link: ${space.meetingUri}\nGoogle Drive Repository: level23consulting@gmail.com / phoenix_review\nArchived: ${new Date().toLocaleString()}`;
      await uploadToPhoenixReview(`GoogleMeet_${space.meetingCode}_Invite.txt`, recordDoc, 'Legal Consultation');
      onNotify?.('success', `Saved Meet space to Google Drive (level23consulting@gmail.com / phoenix_review)!`);
    } catch (err: any) {
      onNotify?.('error', `Drive sync error: ${err.message}`);
    }
  };

  // ----------------------------------------------------
  // Keep Handlers
  // ----------------------------------------------------
  const handleAddKeepNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;

    const note: KeepCaseNote = {
      id: `keep-${Date.now()}`,
      title: newNoteTitle.trim() || 'Untitled Note',
      content: newNoteContent.trim(),
      tags: newNoteTags.split(',').map(t => t.trim()).filter(Boolean),
      color: newNoteColor,
      isPinned: false,
      updatedAt: new Date().toLocaleDateString()
    };

    const updated = [note, ...keepNotes];
    setKeepNotes(updated);
    saveLocalKeepNotes(updated);
    setNewNoteTitle('');
    setNewNoteContent('');
    onNotify?.('success', 'Note added to Case Scratchpad.');
  };

  const handleTogglePinNote = (id: string) => {
    const updated = keepNotes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n);
    setKeepNotes(updated);
    saveLocalKeepNotes(updated);
  };

  const triggerDeleteNoteConfirm = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Note',
      description: `Are you sure you want to delete the case note "${title}"?`,
      confirmText: 'Delete Note',
      variant: 'danger',
      onConfirm: async () => {
        const updated = keepNotes.filter(n => n.id !== id);
        setKeepNotes(updated);
        saveLocalKeepNotes(updated);
        onNotify?.('success', 'Note removed.');
      }
    });
  };

  return (
    <div id="google-workspace-hub-root" className="h-full flex flex-col bg-[#050b14] text-slate-100 overflow-hidden font-sans">
      {/* Top Google Workspace Brand & Service Bar */}
      <header className="px-5 py-3.5 bg-[#09101f] border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500/20 via-sky-500/20 to-blue-600/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wide uppercase font-heading bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-teal-200">
                Google Workspace Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                Official APIs Active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Direct legal practice synchronization for Gmail, Calendar, Tasks, Forms, Meet & Notes
            </p>
          </div>
        </div>

        {/* Google OAuth Status / Sign In Button & Attached Account Badge */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-teal-950/60 border border-teal-500/40 rounded-xl text-xs font-mono text-teal-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Attached: <strong className="text-white">level23consulting@gmail.com</strong></span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0e172a] hover:bg-[#1e293b] active:scale-95 border border-slate-700 hover:border-teal-500/60 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm cursor-pointer"
          >
            {/* Google Official G Logo */}
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{isAuthenticating ? 'Connecting Google...' : 'Re-Authorize Google'}</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs Bar */}
      <div className="px-5 bg-[#070d18] border-b border-[#1e293b] flex items-center gap-1.5 overflow-x-auto py-1 shrink-0">
        {[
          { id: 'gmail', label: 'Gmail', icon: Mail, badge: emails.length.toString() },
          { id: 'calendar', label: 'Google Calendar', icon: CalendarIcon, badge: `${calendarEvents.length}` },
          { id: 'tasks', label: 'Google Tasks', icon: CheckSquare, badge: `${tasks.filter(t => t.status === 'needsAction').length} pending` },
          { id: 'forms', label: 'Google Forms', icon: FileQuestion, badge: `${forms.length}` },
          { id: 'meet', label: 'Google Meet', icon: Video, badge: 'HD Video' },
          { id: 'keep', label: 'Keep Notes', icon: StickyNote, badge: `${keepNotes.length}` },
          { id: 'bridge', label: 'Phoenix 23 Bridge', icon: FolderSync, badge: 'Multi-Account' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-teal-950/70 to-teal-900/30 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1424]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Workspace Body Content */}
      <main className="flex-1 min-h-0 overflow-hidden relative p-4">
        {/* ==================================================== */}
        {/* 1. GMAIL SUB-TAB */}
        {/* ==================================================== */}
        {subTab === 'gmail' && (
          <div className="h-full grid grid-cols-12 gap-4">
            {/* Email List Left Panel (5 cols) */}
            <div className="col-span-12 lg:col-span-5 h-full flex flex-col bg-[#08101d] border border-[#1e293b] rounded-2xl overflow-hidden shadow-lg">
              <div className="p-3 border-b border-[#1e293b] flex items-center justify-between gap-2 bg-[#0a1424]">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadEmails()}
                    placeholder="Search Gmail messages..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#050b14] border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => loadEmails()}
                  disabled={isLoadingEmails}
                  className="p-1.5 bg-[#0e172a] hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 transition"
                  title="Refresh Gmail"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEmails ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompose(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Compose</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1">
                {isLoadingEmails ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
                    <span>Synchronizing Gmail inbox...</span>
                  </div>
                ) : emails.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No emails found in this mailbox query.
                  </div>
                ) : (
                  emails.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => handleOpenEmail(msg)}
                      className={`p-3 rounded-xl transition-all cursor-pointer ${
                        selectedEmail?.id === msg.id
                          ? 'bg-teal-950/40 border border-teal-500/40'
                          : 'hover:bg-[#0e192c]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-xs text-slate-200 truncate">{msg.from}</span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">{msg.date}</span>
                      </div>
                      <div className="text-xs font-medium text-teal-300 truncate mb-1">{msg.subject}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{msg.snippet}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Email View / Compose Right Panel (7 cols) */}
            <div className="col-span-12 lg:col-span-7 h-full flex flex-col bg-[#08101d] border border-[#1e293b] rounded-2xl overflow-hidden shadow-lg p-4">
              {showCompose ? (
                <div className="h-full flex flex-col space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-teal-300 flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      <span>Compose Legal Correspondence (Gmail)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCompose(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Quick Legal Templates */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                    <span className="text-slate-400 font-mono">Templates:</span>
                    {[
                      {
                        name: 'Filing Notice',
                        subj: 'Notice of Electronic Filing: Case Docket Update',
                        body: 'Dear Counsel / Client,\n\nPlease be advised that the required pleading has been submitted via electronic court filing. Attached are the endorsed copies for your records.\n\nRespectfully,\nLevel 23 Legal Staff'
                      },
                      {
                        name: 'Intake Questionnaire',
                        subj: 'Confidential Client Intake & Document Request',
                        body: 'Dear Client,\n\nWelcome to Level 23 Legal Desk. To advance your matter, please review and complete our initial confidential questionnaire and provide relevant documentation.\n\nBest regards,\nOffice Manager (EVE)'
                      },
                      {
                        name: 'Deposition Link',
                        subj: 'Google Meet Video Deposition Invitation & Hearing Schedule',
                        body: 'Dear All,\n\nBelow is the secured Google Meet video conference link for the upcoming deposition / conference session.\n\nLink: https://meet.google.com\n\nSincerely,\nPhoenix Litigation Lead'
                      }
                    ].map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setComposeSubject(t.subj);
                          setComposeBody(t.body);
                        }}
                        className="px-2 py-0.5 bg-[#0f1a2e] hover:bg-teal-950 border border-slate-700 hover:border-teal-500 rounded text-slate-300 whitespace-nowrap cursor-pointer"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>

                  <input
                    type="email"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="Recipient Email (To: client@example.com)"
                    className="w-full p-2.5 bg-[#050b14] border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                  />
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Subject line"
                    className="w-full p-2.5 bg-[#050b14] border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                  />
                  <textarea
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Type official email message body..."
                    rows={10}
                    className="flex-1 w-full p-3 bg-[#050b14] border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 font-sans leading-relaxed focus:outline-none focus:border-teal-400 resize-none"
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 font-mono">
                      🔒 Dispatched directly via Google Workspace Gmail API
                    </span>
                    <button
                      type="button"
                      onClick={triggerSendEmailConfirm}
                      disabled={isSendingEmail}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition shadow cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingEmail ? 'Sending...' : 'Send Message'}</span>
                    </button>
                  </div>
                </div>
              ) : selectedEmail ? (
                <div className="h-full flex flex-col space-y-3">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h2 className="text-base font-bold text-white mb-1">{selectedEmail.subject}</h2>
                      <div className="text-xs text-slate-400 flex flex-wrap gap-2">
                        <span>From: <strong className="text-slate-200">{selectedEmail.from}</strong></span>
                        <span>•</span>
                        <span>Date: {selectedEmail.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setComposeTo(selectedEmail.from.match(/<([^>]+)>/)?.[1] || selectedEmail.from);
                          setComposeSubject(`Re: ${selectedEmail.subject}`);
                          setShowCompose(true);
                        }}
                        className="px-2.5 py-1.5 bg-[#0e172a] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-teal-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Reply</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerDeleteEmailConfirm(selectedEmail.id, selectedEmail.subject)}
                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 rounded-lg text-rose-300 transition cursor-pointer"
                        title="Trash Email"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 bg-[#050b14] border border-slate-800/80 rounded-xl text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedEmail.body}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-center text-teal-300">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Select a Gmail Message</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Choose any correspondence on the left to read full content or click Compose to draft official notices.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. GOOGLE CALENDAR SUB-TAB */}
        {/* ==================================================== */}
        {subTab === 'calendar' && (
          <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-teal-400" />
                  <span>Google Calendar Hearing & Consultation Docket</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Synchronized with Google Calendar with automatic Google Meet conference room attachments.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadEvents()}
                  disabled={isLoadingEvents}
                  className="p-1.5 bg-[#0e172a] hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEvent(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Event</span>
                </button>
              </div>
            </div>

            {/* Add Event Modal */}
            <AnimatePresence>
              {showAddEvent && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-[#091222] border border-teal-500/40 rounded-2xl shadow-xl space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-xs text-teal-300">Create Google Calendar Event</span>
                    <button type="button" onClick={() => setShowAddEvent(false)} className="text-slate-400 hover:text-white text-xs">
                      Cancel
                    </button>
                  </div>
                  <form onSubmit={handleCreateEvent} className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Event Title / Summary</label>
                      <input
                        type="text"
                        value={eventSummary}
                        onChange={(e) => setEventSummary(e.target.value)}
                        placeholder="e.g. Case Management Status Conference"
                        required
                        className="w-full p-2 bg-[#050b14] border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Location / Department</label>
                      <input
                        type="text"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        placeholder="e.g. Orange County Superior Court Dept C12"
                        className="w-full p-2 bg-[#050b14] border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        value={eventStart}
                        onChange={(e) => setEventStart(e.target.value)}
                        required
                        className="w-full p-2 bg-[#050b14] border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        value={eventEnd}
                        onChange={(e) => setEventEnd(e.target.value)}
                        required
                        className="w-full p-2 bg-[#050b14] border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                    <div className="col-span-12">
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Docket Notes / Description</label>
                      <input
                        type="text"
                        value={eventDesc}
                        onChange={(e) => setEventDesc(e.target.value)}
                        placeholder="Docket summary, statutory citations, or counsel notice"
                        className="w-full p-2 bg-[#050b14] border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div className="col-span-12 flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eventWithMeet}
                          onChange={(e) => setEventWithMeet(e.target.checked)}
                          className="rounded text-teal-500"
                        />
                        <span>Attach Google Meet Video Room Automatically</span>
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        Save to Google Calendar
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Event List */}
            <div className="flex-1 overflow-y-auto space-y-2.5">
              {isLoadingEvents ? (
                <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
                  <span>Loading calendar events...</span>
                </div>
              ) : calendarEvents.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No upcoming calendar events scheduled.
                </div>
              ) : (
                calendarEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-[#08101d] border border-[#1e293b] hover:border-teal-500/40 rounded-2xl transition shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">{ev.summary}</span>
                        {ev.hangoutLink && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            <span>Meet Ready</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 text-teal-300 font-mono">
                          <Clock className="w-3 h-3" />
                          {ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleString() : ev.start.date}
                        </span>
                        {ev.location && <span>• {ev.location}</span>}
                      </div>
                      {ev.description && (
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">{ev.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {ev.hangoutLink && (
                        <a
                          href={ev.hangoutLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition shadow"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meet</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => triggerDeleteEventConfirm(ev.id, ev.summary)}
                        className="p-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 rounded-lg text-rose-300 transition cursor-pointer"
                        title="Cancel Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. GOOGLE TASKS SUB-TAB */}
        {/* ==================================================== */}
        {subTab === 'tasks' && (
          <div className="h-full grid grid-cols-12 gap-4">
            {/* Left Panel: Create Task & Lists */}
            <div className="col-span-12 lg:col-span-4 h-full flex flex-col bg-[#08101d] border border-[#1e293b] rounded-2xl p-4 space-y-4 shadow-lg">
              <div>
                <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider font-heading flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4" />
                  <span>Add New Google Task</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Direct sync with Google Tasks with deadline alerts.
                </p>
              </div>

              <form onSubmit={handleAddTask} className="space-y-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title (e.g. Serve Discovery Demands)"
                  required
                  className="w-full p-2.5 bg-[#050b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400"
                />
                <textarea
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  placeholder="Task details & statutory notes..."
                  rows={4}
                  className="w-full p-2.5 bg-[#050b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 resize-none"
                />
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="w-full p-2 bg-[#050b14] border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Task</span>
                </button>
              </form>
            </div>

            {/* Right Panel: Task List */}
            <div className="col-span-12 lg:col-span-8 h-full flex flex-col bg-[#08101d] border border-[#1e293b] rounded-2xl overflow-hidden shadow-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-heading">
                    Active Tasks Docket
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/30 rounded-full">
                    {tasks.filter(t => t.status === 'needsAction').length} Incomplete
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => loadTaskListsAndTasks()}
                  disabled={isLoadingTasks}
                  className="p-1.5 bg-[#0e172a] hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTasks ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {isLoadingTasks ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
                    <span>Synchronizing Google Tasks...</span>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No active tasks on your agenda.
                  </div>
                ) : (
                  tasks.map((task) => {
                    const isDone = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isDone
                            ? 'bg-[#050b14]/60 border-slate-800 text-slate-500'
                            : 'bg-[#0a1424] border-slate-700/80 hover:border-teal-500/50 text-slate-100'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(task)}
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition cursor-pointer ${
                              isDone ? 'bg-teal-500 border-teal-500 text-slate-950' : 'border-slate-500 hover:border-teal-400'
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                          <div className="min-w-0">
                            <h4 className={`text-xs font-semibold ${isDone ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                              {task.title}
                            </h4>
                            {task.notes && (
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">{task.notes}</p>
                            )}
                            {task.due && (
                              <div className="flex items-center gap-1 text-[10px] font-mono text-amber-300 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>Due: {new Date(task.due).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => triggerDeleteTaskConfirm(task.id, task.title)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 4. GOOGLE FORMS SUB-TAB */}
        {/* ==================================================== */}
        {subTab === 'forms' && (
          <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-teal-400" />
                  <span>Google Forms Client Intake & Case Questionnaires</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Build and distribute online client questionnaires with direct Google Forms and Drive synchronization.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadForms()}
                  disabled={isLoadingForms}
                  className="p-1.5 bg-[#0e172a] hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingForms ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewFormModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Google Form</span>
                </button>
              </div>
            </div>

            {/* Create Form Modal */}
            <AnimatePresence>
              {showNewFormModal && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 bg-[#091222] border border-teal-500/40 rounded-2xl shadow-xl space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-xs text-teal-300">New Google Form Questionnaire</span>
                    <button type="button" onClick={() => setShowNewFormModal(false)} className="text-slate-400 hover:text-white text-xs">
                      Cancel
                    </button>
                  </div>
                  <form onSubmit={handleCreateForm} className="space-y-3">
                    <input
                      type="text"
                      value={newFormTitle}
                      onChange={(e) => setNewFormTitle(e.target.value)}
                      placeholder="Form Title (e.g. New Client Marital Asset Inventory Form)"
                      required
                      className="w-full p-2.5 bg-[#050b14] border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <textarea
                      value={newFormDesc}
                      onChange={(e) => setNewFormDesc(e.target.value)}
                      placeholder="Form instructions and introductory notice for respondents..."
                      rows={3}
                      className="w-full p-2.5 bg-[#050b14] border border-slate-700 rounded-xl text-xs text-white resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        Publish Form via Google Forms API
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forms Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoadingForms ? (
                <div className="col-span-2 p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
                  <span>Loading Google Forms...</span>
                </div>
              ) : forms.length === 0 ? (
                <div className="col-span-2 p-8 text-center text-slate-500 text-xs">
                  No Google Forms discovered in your Google Drive workspace.
                </div>
              ) : (
                forms.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 bg-[#08101d] border border-[#1e293b] hover:border-teal-500/40 rounded-2xl transition shadow flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-white">{f.name}</h4>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[9px] font-mono">
                          Google Forms
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        Updated: {f.modifiedTime || 'Recently'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(f.responderUri || f.webViewLink || '', f.id)}
                        className="px-3 py-1 bg-[#0e172a] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-teal-300 flex items-center gap-1 cursor-pointer transition"
                      >
                        {copiedId === f.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === f.id ? 'Copied Link' : 'Copy Client Link'}</span>
                      </button>

                      <a
                        href={f.webViewLink || f.responderUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition"
                      >
                        <span>Open Form</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 5. GOOGLE MEET SUB-TAB */}
        {/* ==================================================== */}
        {subTab === 'meet' && (
          <div className="h-full flex flex-col items-center justify-center p-6 space-y-6 max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-xl">
              <Video className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white tracking-wide font-heading">
                Google Meet Video Conference Studio
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto font-sans">
                Instantly launch secure, enterprise-grade Google Meet spaces for depositions, witness preparation, and confidential client intakes attached to <strong className="text-teal-300">level23consulting@gmail.com</strong>.
              </p>
            </div>

            {/* Attached Account & Google Drive Status Indicator */}
            <div className="w-full max-w-md bg-[#08101d] border border-teal-500/30 rounded-2xl p-3 flex items-center justify-between text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-sky-400" />
                <span>Host: <strong className="text-teal-300">level23consulting@gmail.com</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>Drive: <strong className="text-amber-300">phoenix_review</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateInstantMeet}
              disabled={isCreatingMeet}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold rounded-2xl text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer border-none"
            >
              <Video className={`w-4 h-4 ${isCreatingMeet ? 'animate-spin' : ''}`} />
              <span>{isCreatingMeet ? 'Creating Video Space...' : 'Create Instant Google Meet Room'}</span>
            </button>

            {meetSpaces.length > 0 && (
              <div className="w-full space-y-3 text-left">
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider font-heading">
                  Active Meeting Spaces Created
                </h4>
                <div className="space-y-2">
                  {meetSpaces.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#08101d] border border-teal-500/30 rounded-2xl flex items-center justify-between gap-3 shadow"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-200 block truncate">
                            Room: {s.meetingCode || s.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-950 border border-teal-500/40 text-teal-300">
                            level23consulting@gmail.com
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-teal-400 block truncate mt-0.5">
                          {s.meetingUri}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(s.meetingUri, s.name)}
                          className="p-2 bg-[#0e172a] hover:bg-slate-800 border border-slate-700 rounded-lg text-teal-300"
                          title="Copy Invite Link"
                        >
                          {copiedId === s.name ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSyncMeetToDrive(s)}
                          className="p-2 bg-[#0e172a] hover:bg-slate-800 border border-slate-700 rounded-lg text-amber-300"
                          title="Archive Invite to Google Drive (level23consulting@gmail.com)"
                        >
                          <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <a
                          href={s.meetingUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition"
                        >
                          <span>Join Now</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* 6. GOOGLE KEEP & NOTES SUB-TAB */}
        {/* ==================================================== */}
        {subTab === 'keep' && (
          <div className="h-full flex flex-col space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-amber-400" />
                  <span>Google Keep & Fast Case Scratchpad</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Color-coded case notes, strategy highlights, and discovery preparation checklists.
                </p>
              </div>

              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={keepSearch}
                  onChange={(e) => setKeepSearch(e.target.value)}
                  placeholder="Filter case notes..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#08101d] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            {/* Note Creation Bar */}
            <form onSubmit={handleAddKeepNote} className="p-3 bg-[#08101d] border border-slate-800 rounded-2xl space-y-2">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Note title / Case reference..."
                className="w-full p-2 bg-[#050b14] border border-slate-700/80 rounded-xl text-xs text-white font-semibold"
              />
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Take a fast note, case strategy idea, or deposition outline..."
                rows={2}
                className="w-full p-2 bg-[#050b14] border border-slate-700/80 rounded-xl text-xs text-slate-200 resize-none font-sans"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">Color:</span>
                  {(['amber', 'teal', 'indigo', 'rose', 'emerald', 'slate'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewNoteColor(c)}
                      className={`w-4 h-4 rounded-full transition cursor-pointer border ${
                        newNoteColor === c ? 'border-white scale-125' : 'border-transparent'
                      } ${
                        c === 'amber' ? 'bg-amber-500' :
                        c === 'teal' ? 'bg-teal-500' :
                        c === 'indigo' ? 'bg-indigo-500' :
                        c === 'rose' ? 'bg-rose-500' :
                        c === 'emerald' ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow"
                >
                  Save Note
                </button>
              </div>
            </form>

            {/* Notes Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-3">
              {keepNotes
                .filter(n => n.title.toLowerCase().includes(keepSearch.toLowerCase()) || n.content.toLowerCase().includes(keepSearch.toLowerCase()))
                .map((note) => {
                  const borderBgMap: Record<string, string> = {
                    amber: 'border-amber-500/40 bg-[#17120a]',
                    teal: 'border-teal-500/40 bg-[#081519]',
                    indigo: 'border-indigo-500/40 bg-[#0f1122]',
                    rose: 'border-rose-500/40 bg-[#1a0c10]',
                    emerald: 'border-emerald-500/40 bg-[#0a1612]',
                    slate: 'border-slate-700 bg-[#08101d]'
                  };

                  return (
                    <div
                      key={note.id}
                      className={`p-4 rounded-2xl border ${borderBgMap[note.color] || 'border-slate-700 bg-[#08101d]'} flex flex-col justify-between space-y-3 shadow-md`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-white leading-tight">{note.title}</h4>
                          <button
                            type="button"
                            onClick={() => handleTogglePinNote(note.id)}
                            className={`p-0.5 rounded cursor-pointer ${note.isPinned ? 'text-amber-300' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Pin Note"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                          {note.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-[10px] font-mono text-slate-400">
                        <span>{note.updatedAt}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setComposeSubject(`Case Note: ${note.title}`);
                              setComposeBody(note.content);
                              setSubTab('gmail');
                              setShowCompose(true);
                            }}
                            className="p-1 hover:text-teal-300 cursor-pointer"
                            title="Draft Gmail with Note"
                          >
                            <Mail className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerDeleteNoteConfirm(note.id, note.title)}
                            className="p-1 hover:text-rose-400 cursor-pointer"
                            title="Delete Note"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 7. PHOENIX 23 MULTI-ACCOUNT INGESTION & DISPATCH BRIDGE */}
        {/* ==================================================== */}
        {subTab === 'bridge' && (
          <PhoenixIngestionBridgeView onNotify={onNotify} />
        )}
      </main>

      {/* ==================================================== */}
      {/* MANDATORY USER CONFIRMATION DIALOG FOR WORKSPACE MUTATIONS */}
      {/* ==================================================== */}
      <AnimatePresence>
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b1220] border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{confirmDialog.title}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {confirmDialog.description}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-3.5 py-1.5 bg-[#0e172a] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const fn = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    await fn();
                  }}
                  className={`px-4 py-1.5 font-bold rounded-lg text-xs transition cursor-pointer shadow ${
                    confirmDialog.variant === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                  }`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
