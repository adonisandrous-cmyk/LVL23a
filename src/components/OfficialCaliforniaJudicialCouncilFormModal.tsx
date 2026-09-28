import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Moon, FileX, Trash2 } from 'lucide-react';
import { Client, GeneratedDocument } from '../types';

interface OfficialCaliforniaJudicialCouncilFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  clients?: Client[];
  initialFormCode?: 'FL-120' | 'FL-105' | 'FL-311' | 'FL-160';
  onAddGeneratedDoc?: (doc: GeneratedDocument) => void;
  onExportToDrive?: (fileName: string, content: string, format: 'docx' | 'pdf') => void;
}

export const OfficialCaliforniaJudicialCouncilFormModal: React.FC<OfficialCaliforniaJudicialCouncilFormModalProps> = ({
  isOpen,
  onClose
}) => {
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
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Form Automation Decommissioned</h2>
              <p className="text-xs text-indigo-400 font-mono">System In Hibernation Mode</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>All California Judicial Council form templates have been deleted.</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <FileX className="w-4 h-4 text-rose-400" />
              <span>Document generation automation has been permanently removed.</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
