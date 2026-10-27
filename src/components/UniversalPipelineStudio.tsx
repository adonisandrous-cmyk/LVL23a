import React from 'react';
import { Moon, FileX, Trash2 } from 'lucide-react';
import { Client, GeneratedDocument } from '../types';

export interface UniversalPipelineStudioProps {
  clients?: Client[];
  selectedClientId?: string;
  onSelectClient?: (id: string) => void;
  onAddGeneratedDoc?: (doc: GeneratedDocument) => void;
}

export default function UniversalPipelineStudio({}: UniversalPipelineStudioProps) {
  return (
    <div className="p-8 max-w-4xl mx-auto text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 mx-auto flex items-center justify-center text-indigo-400">
        <Moon className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white font-heading">Document Pipeline Decommissioned</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          The Universal Document Generation Pipeline has been removed and all court form templates deleted per instructions.
        </p>
      </div>
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 max-w-md mx-auto text-left text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-rose-400">
          <Trash2 className="w-4 h-4 shrink-0" />
          <span>FL-100, FL-120, and FL-300 templates purged.</span>
        </div>
        <div className="flex items-center gap-2 text-indigo-400">
          <FileX className="w-4 h-4 shrink-0" />
          <span>Pipeline services asleep in hibernation mode.</span>
        </div>
      </div>
    </div>
  );
}

export { UniversalPipelineStudio };
