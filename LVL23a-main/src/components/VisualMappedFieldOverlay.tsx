import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Info,
  Database,
  ArrowRight,
  Eye,
  Sliders,
  Check,
  ChevronDown,
  Layers,
  FileText
} from 'lucide-react';

export interface MappedFieldDescriptor {
  id: string;
  fieldLabel: string;
  targetAcroField: string;
  mappedValue: string;
  sourceType: 'client_intake' | 'statutory_calc' | 'matter_dossier' | 'attorney_profile';
  sourceKey: string;
  pageNumber: number;
  confidenceScore: number;
  isCustomized?: boolean;
}

interface VisualMappedFieldOverlayProps {
  formCode: string;
  mappedFields: MappedFieldDescriptor[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateFieldValue: (id: string, newVal: string) => void;
  showOverlay: boolean;
  onToggleOverlay: () => void;
}

export const VisualMappedFieldOverlay: React.FC<VisualMappedFieldOverlayProps> = ({
  formCode,
  mappedFields,
  selectedFieldId,
  onSelectField,
  onUpdateFieldValue,
  showOverlay,
  onToggleOverlay
}) => {
  const [filterSource, setFilterSource] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempEditValue, setTempEditValue] = useState<string>('');

  const activeField = mappedFields.find(f => f.id === selectedFieldId) || null;

  const filteredFields = mappedFields.filter(f => {
    if (filterSource === 'all') return true;
    return f.sourceType === filterSource;
  });

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'client_intake':
        return { label: 'Client Intake', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'matter_dossier':
        return { label: 'Matter Court Index', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'statutory_calc':
        return { label: 'Statutory Calc', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'attorney_profile':
        return { label: 'Firm Profile', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      default:
        return { label: 'Mapped', color: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
    }
  };

  return (
    <div className="bg-[#0e1628] border-b border-slate-800 p-3 sm:px-6 transition-all">
      {/* Top Controller Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Data Field Mapper</span>
          </div>

          <button
            type="button"
            onClick={onToggleOverlay}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
              showOverlay
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Highlight mapped court form fields with visual overlays"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showOverlay ? 'Overlay: ON (Visual Highlight)' : 'Overlay: OFF'}</span>
          </button>
        </div>

        {/* Stats & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400">
            Mapped Fields: <strong className="text-white">{mappedFields.length}</strong>
          </span>

          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setFilterSource('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                filterSource === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterSource('client_intake')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                filterSource === 'client_intake' ? 'bg-blue-900/60 text-blue-200 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Intake
            </button>
            <button
              type="button"
              onClick={() => setFilterSource('matter_dossier')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                filterSource === 'matter_dossier' ? 'bg-emerald-900/60 text-emerald-200 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Court
            </button>
            <button
              type="button"
              onClick={() => setFilterSource('statutory_calc')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                filterSource === 'statutory_calc' ? 'bg-purple-900/60 text-purple-200 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Statutory
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroller of Field Badges */}
      {showOverlay && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-700">
            {filteredFields.map(field => {
              const isSelected = field.id === selectedFieldId;
              const badge = getSourceBadge(field.sourceType);
              return (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => onSelectField(isSelected ? null : field.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 shrink-0 transition-all border cursor-pointer text-left ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-200 border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                  <span className="font-bold">{field.fieldLabel}</span>
                  <span className="text-[10px] opacity-70 text-slate-400 max-w-[100px] truncate">
                    &rarr; {field.mappedValue}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Field Inspector Card */}
          {activeField && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300 font-mono flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5" />
                    Field: {activeField.fieldLabel}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getSourceBadge(activeField.sourceType).color}`}>
                    {getSourceBadge(activeField.sourceType).label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    AcroForm Target: <code className="text-slate-200 bg-black/40 px-1 rounded">{activeField.targetAcroField}</code>
                  </span>
                </div>

                <div className="text-slate-300 font-mono text-[11px] flex items-center gap-2">
                  <span>Source Value:</span>
                  {editingId === activeField.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempEditValue}
                        onChange={(e) => setTempEditValue(e.target.value)}
                        className="bg-black text-white px-2 py-0.5 rounded border border-amber-400 text-xs font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateFieldValue(activeField.id, tempEditValue);
                          setEditingId(null);
                        }}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span className="font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                      "{activeField.mappedValue}"
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {editingId !== activeField.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(activeField.id);
                      setTempEditValue(activeField.mappedValue);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-mono border border-slate-700 cursor-pointer"
                  >
                    Quick Adjust
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectField(null)}
                  className="text-slate-400 hover:text-white text-[11px] font-mono"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
