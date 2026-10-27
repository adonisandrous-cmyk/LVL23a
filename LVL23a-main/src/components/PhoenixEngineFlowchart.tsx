/**
 * LEVEL 23 / PHOENIX 23
 * AI POWERED DOCUMENT AUTOMATION ENGINE FLOWCHART
 * 
 * Interactive Architectural Diagram matching the official Level 23 / Phoenix 23 Specification:
 * "FROM UPLOAD → TO INTELLIGENCE → TO REUSABLE TEMPLATES"
 * "Same Document. Smarter Process. Endless Possibilities."
 */

import React, { useState } from 'react';
import {
  FileText,
  Cpu,
  Search,
  Database,
  Layers,
  CheckCircle2,
  Zap,
  Target,
  FolderLock,
  Repeat,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Eye,
  Check
} from 'lucide-react';

interface PhoenixEngineFlowchartProps {
  onSelectStep?: (stepNumber: number) => void;
  onLaunchExecutiveHandOff?: () => void;
}

export function PhoenixEngineFlowchart({ onSelectStep, onLaunchExecutiveHandOff }: PhoenixEngineFlowchartProps) {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      num: 1,
      title: '1. UPLOAD DOCUMENT',
      icon: FileText,
      badge: 'PDF, scanned image, Word, or other supported format',
      bullets: [
        'User uploads document',
        'System validates file type, size and security',
        'Creates a unique job ID & SHA-256 fingerprint'
      ],
      color: 'teal'
    },
    {
      num: 2,
      title: '2. INGEST & READ',
      icon: Cpu,
      badge: 'OCR + AI reads the document',
      bullets: [
        'Preserves exact structure, formatting and layout',
        'Detects text, tables, checkboxes, and form elements',
        'Constructs DocumentStructureMap without modifying source'
      ],
      color: 'cyan'
    },
    {
      num: 3,
      title: '3. EXTRACT INFORMATION',
      icon: Search,
      badge: 'AI identifies key data',
      bullets: [
        'Extracts field values with exact provenance',
        'Understands context, relationships and document logic',
        'Enforces Rule 5: Never guess; flag ambiguities for review'
      ],
      color: 'sky'
    },
    {
      num: 4,
      title: '4. STORE IN DATABASE',
      icon: Database,
      badge: 'Extracted data is structured and saved',
      bullets: [
        'Linked to the document, client, or matter ledger',
        'Canonical legal ontology mapping for cross-form reuse',
        'Available for future form population and automation'
      ],
      color: 'indigo'
    },
    {
      num: 5,
      title: '5. MAP FIELDS & CREATE TEMPLATE',
      icon: Layers,
      badge: 'Precision coordinate-based overlay',
      bullets: [
        'Fields are mapped to their exact locations in the document',
        'Original structure, layout and typography are 100% preserved',
        'Mapped fields are replaced with "blanks" (placeholders)'
      ],
      color: 'amber'
    },
    {
      num: 6,
      title: '6. READY FOR FUTURE USE',
      icon: CheckCircle2,
      badge: 'A true, exact replica of the original document',
      bullets: [
        'With mapped, fillable blanks',
        'Can be populated automatically using stored data or new input',
        'Saved as a certified reusable template in the vault'
      ],
      color: 'emerald'
    }
  ];

  const pillars = [
    { icon: Zap, label: 'FASTER', desc: 'Eliminates manual data entry and repetitive work.' },
    { icon: Target, label: 'ACCURATE', desc: 'AI ensures precise extraction and field mapping.' },
    { icon: FolderLock, label: 'ORGANIZED', desc: 'Centralized database for long-term use.' },
    { icon: Repeat, label: 'REUSABLE', desc: 'Turn any document into a smart, fillable template.' },
    { icon: ShieldCheck, label: 'SECURE', desc: 'Keeps your data, documents and clients protected.' }
  ];

  return (
    <div className="bg-gradient-to-b from-[#060b17] via-[#081022] to-[#050914] text-slate-100 rounded-2xl border border-[#1b2b48] p-6 lg:p-8 space-y-8 shadow-2xl relative overflow-hidden select-none">
      
      {/* Glow Backdrops */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* 1. Flowchart Header */}
      <div className="text-center space-y-2 relative z-10">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500/30 to-teal-500/30 border border-amber-500/50 flex items-center justify-center text-amber-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-black uppercase tracking-[0.25em] text-amber-400">
            PHOENIX 23 • LEVEL 23
          </span>
        </div>
        
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-heading uppercase">
          AI POWERED DOCUMENT AUTOMATION ENGINE
        </h2>
        
        <div className="text-xs lg:text-sm font-mono tracking-widest text-teal-300 uppercase font-bold">
          FROM UPLOAD → TO INTELLIGENCE → TO REUSABLE TEMPLATES
        </div>
        
        <p className="text-xs italic text-slate-400 max-w-xl mx-auto font-sans">
          "Same Document. Smarter Process. Endless Possibilities."
        </p>

        {onLaunchExecutiveHandOff && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onLaunchExecutiveHandOff}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-teal-400 hover:from-amber-400 hover:to-teal-300 text-slate-950 font-mono font-bold text-xs uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Phoenix & EVE: Hand Document & Issue Directives to Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Top 6 Sequential Pipeline Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 relative z-10">
        {steps.map((step) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.num;
          return (
            <div
              key={step.num}
              onClick={() => {
                setActiveStep(step.num);
                if (onSelectStep) onSelectStep(step.num);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left relative ${
                isSelected
                  ? 'bg-[#0d1c33] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'bg-[#091224] border-[#182744] hover:border-slate-500'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    STAGE {step.num}
                  </span>
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-[#060c18] text-teal-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="text-xs font-bold text-white tracking-wide uppercase leading-tight">
                  {step.title}
                </div>

                <div className="text-[10px] text-teal-300/90 font-mono bg-[#050b16] px-2 py-1 rounded border border-white/5 leading-snug">
                  {step.badge}
                </div>

                <ul className="space-y-1 text-[10.5px] text-slate-300 font-sans pt-1">
                  {step.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400 text-xs leading-none">•</span>
                      <span className="leading-tight">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Middle Section: EXAMPLE: FROM UPLOAD TO TEMPLATE */}
      <div className="bg-[#070e1c] rounded-xl border border-[#1a2a47] p-5 lg:p-6 space-y-4 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Visual Transformation
            </span>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              EXAMPLE: FROM UPLOAD TO REUSABLE TEMPLATE
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Rule: The original uploaded document is the immutable visual master.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-left">
          {/* Card A: Original Uploaded Document */}
          <div className="p-3.5 bg-[#0a1224] rounded-xl border border-[#1b2b48] space-y-2">
            <div className="text-[11px] font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>Original Document</span>
            </div>
            
            {/* Visual Mini Document Representation */}
            <div className="p-2.5 bg-white text-slate-900 rounded-lg text-[8px] font-serif space-y-1 shadow-inner border border-slate-300">
              <div className="text-center font-bold text-[8.5px] uppercase border-b border-slate-400 pb-0.5">
                Superior Court of California
              </div>
              <div className="text-center font-semibold text-[7.5px] text-slate-700">
                Petition For Dissolution
              </div>
              <div className="space-y-0.5 pt-1 text-[7px] text-slate-600">
                <div>Petitioner: [PETITIONER_NAME]</div>
                <div>Respondent: [RESPONDENT_NAME]</div>
                <div>Case Number: [CASE_NUMBER]</div>
                <div>County: [COUNTY]</div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
              • Exact structure, formatting, fonts, margins, and page layout preserved byte-for-byte.
            </p>
          </div>

          {/* Card B: AI Reads & Extracts Data */}
          <div className="p-3.5 bg-[#0a1224] rounded-xl border border-[#1b2b48] space-y-2">
            <div className="text-[11px] font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Reads & Extracts Data</span>
            </div>
            
            <div className="p-2.5 bg-[#050a14] rounded-lg text-[9px] font-mono text-cyan-300 space-y-1 border border-cyan-500/20">
              <div className="text-[8px] text-slate-400 uppercase font-bold">Extracted Values:</div>
              <div className="truncate text-slate-200">• Petitioner: [PETITIONER_NAME]</div>
              <div className="truncate text-slate-200">• Respondent: [RESPONDENT_NAME]</div>
              <div className="truncate text-slate-200">• Case #: [CASE_NUMBER]</div>
              <div className="truncate text-slate-200">• Filing Date: 09/24/2026</div>
              <div className="truncate text-slate-200">• Court: [COUNTY]</div>
            </div>

            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
              • Every extracted fact captures source page, coordinates, confidence score, and timestamp.
            </p>
          </div>

          {/* Card C: Mapped Template (Blanks) */}
          <div className="p-3.5 bg-[#0a1224] rounded-xl border border-[#1b2b48] space-y-2">
            <div className="text-[11px] font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Mapped Template (Blanks)</span>
            </div>
            
            <div className="p-2.5 bg-white text-slate-900 rounded-lg text-[8px] font-serif space-y-1 shadow-inner border border-slate-300">
              <div className="text-center font-bold text-[8.5px] uppercase border-b border-slate-400 pb-0.5">
                Superior Court of California
              </div>
              <div className="space-y-0.5 pt-1 text-[7px] text-slate-600">
                <div className="bg-amber-100 border border-amber-400 px-1 text-amber-900 font-mono">
                  [party.petitioner.full_name]
                </div>
                <div className="bg-amber-100 border border-amber-400 px-1 text-amber-900 font-mono">
                  [party.respondent.full_name]
                </div>
                <div className="bg-amber-100 border border-amber-400 px-1 text-amber-900 font-mono">
                  [matter.case_number]
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
              • Fields mapped & replaced with blanks. Original structure is 100% unchanged.
            </p>
          </div>

          {/* Card D: Database Storage */}
          <div className="p-3.5 bg-[#0a1224] rounded-xl border border-[#1b2b48] space-y-2">
            <div className="text-[11px] font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Database Storage</span>
            </div>
            
            <div className="p-2.5 bg-[#050a14] rounded-lg text-[9px] font-mono text-indigo-300 space-y-1 border border-indigo-500/20">
              <div className="text-[8px] text-slate-400 uppercase font-bold">Relational Ledgers:</div>
              <div>• Extracted facts</div>
              <div>• Document metadata</div>
              <div>• Client / matter linkage</div>
              <div>• Field mappings</div>
              <div>• Template library</div>
            </div>

            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
              • Stored for future use, search, and instant automated population.
            </p>
          </div>

          {/* Card E: Reusable Template For Future Use */}
          <div className="p-3.5 bg-[#0a1224] rounded-xl border border-emerald-500/40 space-y-2">
            <div className="text-[11px] font-bold text-emerald-300 uppercase font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ready For Future Use</span>
            </div>
            
            <div className="p-2.5 bg-emerald-950/40 rounded-lg text-[9px] font-mono text-emerald-200 space-y-1 border border-emerald-500/30">
              <div className="flex items-center gap-1 font-bold text-emerald-300">
                <Check className="w-3 h-3" />
                <span>Certified Template</span>
              </div>
              <div className="text-[8px] text-slate-300 leading-snug">
                Populate with verified client facts today, or any new client matter tomorrow.
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
              • A true, exact form template with mapped fields (blanks) ready for automated population.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Five Pillars Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 relative z-10">
        {pillars.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              className="p-3.5 bg-[#081022] rounded-xl border border-[#16233d] flex items-start gap-3 text-left"
            >
              <div className="p-2 rounded-lg bg-[#050b16] border border-white/5 text-amber-400 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-mono font-extrabold uppercase text-white tracking-wider">
                  {p.label}
                </div>
                <div className="text-[10.5px] text-slate-400 font-sans leading-snug">
                  {p.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Footer Brand Signoff */}
      <div className="pt-3 border-t border-[#16233d] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-slate-400 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">LEVEL 23</span>
          <span>•</span>
          <span className="text-teal-400 font-bold">PHOENIX 23</span>
        </div>
        <div className="italic text-slate-300 font-sans text-xs">
          "We develop the best options for the best results."
        </div>
      </div>
    </div>
  );
}
