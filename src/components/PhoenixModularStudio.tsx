import React from 'react';
import { ArrowRight, Briefcase, FileText, Search as Research, Sparkles } from 'lucide-react';
import { Client, Matter } from '../types';

export interface PhoenixModularStudioProps {
  clients?: Client[];
  matters?: Matter[];
  onNavigateTab?: (tab: string) => void;
  onOpenOfficialForm?: (formCode?: string, clientName?: string) => void;
  onOpenPhoenixWorkspace?: () => void;
  onOpenIntakeGenerator?: () => void;
  onOpenOmniUpload?: () => void;
}

export const PhoenixModularStudio: React.FC<PhoenixModularStudioProps> = ({
  clients = [],
  matters = [],
  onNavigateTab,
  onOpenOfficialForm,
  onOpenPhoenixWorkspace,
  onOpenIntakeGenerator,
  onOpenOmniUpload
}) => {
  const quickActions = [
    {
      label: 'Client intake',
      detail: `${clients.length} active clients`,
      icon: Briefcase,
      onClick: () => {
        if (onOpenIntakeGenerator) {
          onOpenIntakeGenerator();
        } else {
          onNavigateTab?.('clients');
        }
      }
    },
    {
      label: 'Matter workspace',
      detail: `${matters.length} matters in progress`,
      icon: FileText,
      onClick: () => onNavigateTab?.('matters')
    },
    {
      label: 'Draft and file',
      detail: 'Template Library & document drafting',
      icon: Sparkles,
      onClick: () => {
        if (onOpenPhoenixWorkspace) {
          onOpenPhoenixWorkspace();
        } else {
          onNavigateTab?.('template_library');
        }
      }
    },
    {
      label: 'Research desk',
      detail: 'Review, cite, and verify',
      icon: Research,
      onClick: () => onNavigateTab?.('documents')
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 mx-auto flex items-center justify-center text-indigo-400">
        <Sparkles className="w-8 h-8" />
      </div>

      <div className="space-y-2 text-center">
        <h2 className="text-xl font-bold text-white font-heading">Phoenix workspace</h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Legal drafting, client intake, research, and workflow execution in one focused environment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {quickActions.map(({ label, detail, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left transition-all hover:border-indigo-500/40 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                <Icon className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 transition-colors" />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">{label}</div>
              <div className="text-xs text-slate-400">{detail}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PhoenixModularStudio;
