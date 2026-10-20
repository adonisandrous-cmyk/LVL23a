import React, { useState, useRef } from 'react';
import {
  Bot,
  FileText,
  Mic,
  Paperclip,
  Send,
  Sparkles,
  Upload,
  ArrowRight,
  CheckCircle2,
  X
} from 'lucide-react';
import { LegalMessage, Client, Matter, GeneratedDocument } from '../types';

export type ZenAgentKey = 'PHOENIX' | 'EVE' | 'ALURE' | 'SENTRY';

export interface ZenAttachedFile {
  name: string;
  size: string;
  type: string;
  content: string;
  rawBase64?: string;
  uploadedAt: string;
}

interface ZenAgentConfig {
  id: ZenAgentKey;
  name: string;
  title: string;
  icon: any;
}

const ZEN_AGENTS: ZenAgentConfig[] = [
  { id: 'PHOENIX', name: 'Phoenix', title: 'Lead counsel', icon: Sparkles },
  { id: 'EVE', name: 'EVE', title: 'Ops lead', icon: Bot },
  { id: 'ALURE', name: 'Alure', title: 'Research', icon: FileText },
  { id: 'SENTRY', name: 'Sentry', title: 'Review', icon: CheckCircle2 }
];

interface ZenEntranceViewProps {
  onActivateWorkspace: (targetTab?: string) => void;
  chatThread: LegalMessage[];
  onSendMessage: (
    userPrompt: string,
    agentName: ZenAgentKey | string,
    attachedFile?: { name: string; size: string; type?: string; content?: string }
  ) => Promise<void>;
  clients: Client[];
  matters: Matter[];
  generatedDocs: GeneratedDocument[];
  systemConnected: boolean;
  dbSyncStatus: string;
}

export default function ZenEntranceViewRefined({
  onActivateWorkspace,
  chatThread,
  onSendMessage,
  clients,
  matters,
  generatedDocs,
  systemConnected
}: ZenEntranceViewProps) {
  const [selectedAgent, setSelectedAgent] = useState<ZenAgentKey>('PHOENIX');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFile, setAttachedFile] = useState<ZenAttachedFile | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsingFileName, setParsingFileName] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, targetAgent?: ZenAgentKey) => {
    if (!file) return;
    if (targetAgent) setSelectedAgent(targetAgent);

    setIsParsingFile(true);
    setParsingFileName(file.name);
    setParseError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawResult = event.target?.result as string;
        if (!rawResult) {
          setParseError('Could not read file.');
          setIsParsingFile(false);
          setParsingFileName('');
          return;
        }

        const base64Data = rawResult.split(',')[1] || '';
        let parsedText = '';

        try {
          const res = await fetch('/api/files/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64Data,
              mimeType: file.type || 'text/plain',
              fileName: file.name
            })
          });

          if (res.ok) {
            const data = await res.json();
            parsedText = data.content || '';
          }
        } catch {
          parsedText = '';
        }

        if (!parsedText.trim()) {
          try {
            const text = await file.text();
            parsedText = text.slice(0, 50000);
          } catch {
            parsedText = `[Document: ${file.name}]`;
          }
        }

        setAttachedFile({
          name: file.name,
          size: file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type || 'application/octet-stream',
          content: parsedText,
          rawBase64: base64Data,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setIsParsingFile(false);
        setParsingFileName('');
      };

      reader.onerror = () => {
        setParseError(`Failed to read ${file.name}`);
        setIsParsingFile(false);
        setParsingFileName('');
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setParseError(err?.message || 'File upload failed.');
      setIsParsingFile(false);
      setParsingFileName('');
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSubmit = (customPrompt ?? inputPrompt).trim();
    if ((!promptToSubmit && !attachedFile) || isSubmitting) return;

    const fileToSend = attachedFile;
    setInputPrompt('');
    setAttachedFile(null);
    setIsSubmitting(true);

    try {
      const promptText = promptToSubmit || `Please review and analyze attached document "${fileToSend?.name || 'document'}".`;
      await onSendMessage(
        promptText,
        selectedAgent,
        fileToSend ? {
          name: fileToSend.name,
          size: fileToSend.size,
          type: fileToSend.type,
          content: fileToSend.content
        } : undefined
      );
    } catch (err) {
      console.error('Message send failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeAgentName = ZEN_AGENTS.find((agent) => agent.id === selectedAgent)?.name || selectedAgent;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/40 bg-slate-900 text-sm font-black text-amber-300">
              L23
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Legal AI</div>
              <div className="text-sm font-semibold text-white">Level 23 Co-Counsel</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onActivateWorkspace('dashboard')}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
            >
              Workspace
            </button>
            <button
              type="button"
              onClick={() => onActivateWorkspace('documents')}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
            >
              Documents
            </button>
            <button
              type="button"
              onClick={() => onActivateWorkspace('matters')}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
            >
              Matters
            </button>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-medium text-emerald-300">
              {systemConnected ? 'AI Ready' : 'Standby'}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-slate-900 text-amber-300">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-semibold text-white">How can I help with this matter?</h2>
          <p className="mt-2 text-sm text-slate-400">Review files, draft documents, and keep the workflow moving.</p>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          {ZEN_AGENTS.map((agent) => {
            const isSelected = selectedAgent === agent.id;
            const Icon = agent.icon;

            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedAgent(agent.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/15 text-amber-200'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{agent.name}</span>
              </button>
            );
          })}
        </div>

        {parseError && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            <span>{parseError}</span>
            <button type="button" onClick={() => setParseError(null)} className="text-rose-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isParsingFile && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>Reading {parsingFileName} for {activeAgentName}...</span>
          </div>
        )}

        {attachedFile && (
          <div className="mb-4 rounded-2xl border border-amber-500/40 bg-slate-900 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2 text-amber-300">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{attachedFile.name}</div>
                  <div className="text-[10px] text-slate-400">{attachedFile.size}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] text-slate-300"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="h-full overflow-y-auto space-y-3">
            {chatThread.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
                Start with a matter, file, or question.
              </div>
            ) : (
              chatThread.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-amber-500 text-slate-950'
                        : 'border border-slate-700 bg-slate-950 text-slate-100'
                    }`}
                  >
                    {msg.content}
                    {msg.sender === 'assistant' && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{msg.agentName}</span>
                        {msg.fileAttachment && <span>• file</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-2"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-200 hover:border-slate-500"
              aria-label="Upload file"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.csv,.md,.json,image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0], selectedAgent);
                  e.target.value = '';
                }
              }}
            />

            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={attachedFile ? `Ask ${activeAgentName} about "${attachedFile.name}"...` : `Ask ${activeAgentName} anything...`}
              className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => setIsListening((prev) => !prev)}
              className={`rounded-xl border p-2 ${
                isListening
                  ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                  : 'border-slate-700 bg-slate-800 text-slate-200'
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>

            <button
              type="submit"
              disabled={(!inputPrompt.trim() && !attachedFile) || isSubmitting}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-40"
            >
              Ask
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSend('Draft a concise legal summary for this matter.')}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-300"
          >
            Draft summary
          </button>
          <button
            type="button"
            onClick={() => handleSend('Review the attached file for risks and missing facts.')}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-300"
          >
            Review file
          </button>
          <button
            type="button"
            onClick={() => onActivateWorkspace('documents')}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-300"
          >
            Open docs
          </button>
          <button
            type="button"
            onClick={() => handleSend('What do I need to action next for this matter?')}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-300"
          >
            Next steps
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Upload className="h-3.5 w-3.5 text-amber-300" />
          <span>Attach a pleading, contract, or intake file</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span className="text-slate-300">{activeAgentName}</span>
        </div>
      </main>
    </div>
  );
}
