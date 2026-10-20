import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ShieldCheck, FileCheck2, ArrowRight, Zap } from 'lucide-react';
import { Client, Matter } from '../types';

interface ExecutivePipelineHandOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients?: Client[];
  matters?: Matter[];
  initialClientId?: string;
  initialDispatcher?: string;
  initialClientName?: string;
  initialCaseNumber?: string;
  initialDocumentName?: string;
  initialFileContent?: string;
  onDispatchComplete?: (result: any) => void;
  onGenerated?: (result: any) => void;
  onOpenUniversalStudio?: () => void;
  onOpenModulesStudio?: () => void;
  [key: string]: any;
}

export function ExecutivePipelineHandOffModal({
  isOpen,
  onClose,
  initialDispatcher = 'phoenix',
  initialDocumentName,
  onDispatchComplete
}: ExecutivePipelineHandOffModalProps) {
  if (!isOpen) return null;

  const dispatcherLabel = initialDispatcher === 'eve' ? 'EVE' : 'Phoenix';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#090e1c] p-6 text-slate-300 shadow-2xl"
        >
          <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>

          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Phoenix BigLaw handoff</h2>
              <p className="text-xs text-amber-300">{dispatcherLabel} dispatches work to the BigLaw review engine</p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
            <div className="flex items-center gap-2 text-slate-200">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Coordinator: {dispatcherLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <FileCheck2 className="h-4 w-4 text-emerald-400" />
              <span>Document: {initialDocumentName || 'Active matter file'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <span>Workflow: roundtable review, citation check, and human gate</span>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200">Close</button>
            <button
              type="button"
              onClick={() => {
                onDispatchComplete?.({
                  dispatcher: initialDispatcher === 'eve' ? 'eve' : 'phoenix',
                  dispatcherName: dispatcherLabel,
                  dispatcherTitle: initialDispatcher === 'eve' ? 'Ops Lead' : 'Managing Partner',
                  documentName: initialDocumentName || 'Active Matter File',
                  directiveTitle: 'Phoenix BigLaw review dispatch',
                  state: 'queued'
                });
                onClose();
              }}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950"
            >
              Launch BigLaw
              <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ExecutivePipelineHandOffModal;
