import React from 'react';
import { Moon, FileX, Trash2 } from 'lucide-react';
import { Client, Matter } from '../types';

export interface PhoenixModularStudioProps {
  clients?: Client[];
  matters?: Matter[];
  onNavigateTab?: (tab: string) => void;
  onOpenOfficialForm?: (formCode: 'FL-120' | 'FL-105' | 'FL-311' | 'FL-160', clientName?: string) => void;
}

export const PhoenixModularStudio: React.FC<PhoenixModularStudioProps> = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 mx-auto flex items-center justify-center text-indigo-400">
        <Moon className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white font-heading">Phoenix Modules Asleep</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          All document modular automation and form drafting engines are dormant. The system is in Hibernation Mode.
        </p>
      </div>
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 max-w-md mx-auto text-left text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-rose-400">
          <Trash2 className="w-4 h-4 shrink-0" />
          <span>Form templates and interactive drafting modules deleted.</span>
        </div>
        <div className="flex items-center gap-2 text-indigo-400">
          <FileX className="w-4 h-4 shrink-0" />
          <span>AI engines and automated processes sleeping.</span>
        </div>
      </div>
    </div>
  );
};

export default PhoenixModularStudio;
