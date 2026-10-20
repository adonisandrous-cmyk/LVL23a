import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ArrowRight, FileText } from 'lucide-react';
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
  onOpenUniversalStudio,
  onOpenModulesStudio,
  initialClientName,
  initialDocumentName
}: ExecutivePipelineHandOffModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg rounded-2xl bg-[#090e1c] border border-slate-800 p-6 text-slate-300 shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg"
            aria-label="Close pipeline modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Phoenix workflow ready</h2>
              <p className="text-xs text-indigo-400 font-mono">Legal operations live</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 mb-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>
                {initialDocumentName ? `Continue with ${initialDocumentName}.` : 'Continue in the live legal workspace.'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <ArrowRight className="w-4 h-4 text-indigo-400" />
              <span>
                {initialClientName ? `Client: ${initialClientName}` : 'Client-ready intake and drafting flow.'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {onOpenUniversalStudio && (
              <button
                onClick={onOpenUniversalStudio}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all"
              >
                Open workspace
              </button>
            )}
            {onOpenModulesStudio && (
              <button
                onClick={onOpenModulesStudio}
                className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs transition-all"
              >
                Modules
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ExecutivePipelineHandOffModal;
