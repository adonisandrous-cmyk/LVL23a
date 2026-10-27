import React, { useState, useRef } from 'react';
import {
  FileText,
  FileCode,
  Download,
  Printer,
  Copy,
  Check,
  Columns,
  Maximize2,
  Minimize2,
  FileCheck2,
  Scale,
  Sparkles,
  Edit3,
  Save,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  X,
  Type
} from 'lucide-react';

interface DocumentSplitPreviewProps {
  title: string;
  clientName?: string;
  content: string;
  generatedAt?: string;
  version?: number;
  category?: string;
  caseNumber?: string;
  onClose?: () => void;
  onSave?: (updatedContent: string) => void;
  isEditable?: boolean;
}

export default function DocumentSplitPreview({
  title,
  clientName = 'Jane Doe',
  content,
  generatedAt,
  version = 1,
  category = 'Litigation Pleading',
  caseNumber = 'FAM-2026-0892',
  onClose,
  onSave,
  isEditable = false
}: DocumentSplitPreviewProps) {
  const [viewMode, setViewMode] = useState<'split' | 'rendered' | 'raw'>('split');
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [includeLetterhead, setIncludeLetterhead] = useState(true);
  const [paperTheme, setPaperTheme] = useState<'white' | 'parchment' | 'dark'>('white');
  const [lineSpacing, setLineSpacing] = useState<'normal' | 'relaxed' | 'double'>('relaxed');
  const [rawEditableText, setRawEditableText] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [fontFamily, setFontFamily] = useState<'times' | 'serif' | 'georgia'>('times');

  const printSheetRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawEditableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'md' | 'txt' | 'doc' | 'html') => {
    let mimeType = 'text/plain';
    let fileExtension = format;
    let exportContent = rawEditableText;

    if (format === 'md') {
      mimeType = 'text/markdown';
    } else if (format === 'html') {
      mimeType = 'text/html';
      exportContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ${clientName}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      margin: 1in;
      line-height: 1.6;
      color: #111;
    }
    .caption {
      border: 1px solid #444;
      padding: 12px;
      margin-bottom: 20px;
    }
    .court-header {
      text-align: center;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    pre {
      white-space: pre-wrap;
      font-family: inherit;
    }
  </style>
</head>
<body>
  <div class="caption">
    <strong>LEVEL 23 LEGAL CONSULTING GROUP</strong><br>
    ATTORNEYS AT LAW • STATE BAR REF #L23-2026<br>
    ATTORNEY FOR: ${clientName.toUpperCase()}
  </div>
  <div class="court-header">
    SUPERIOR COURT OF CALIFORNIA<br>
    COUNTY OF ORANGE • FAMILY LAW DIVISION
  </div>
  <pre>${rawEditableText}</pre>
</body>
</html>`;
    } else if (format === 'doc') {
      mimeType = 'application/msword';
      fileExtension = 'doc';
      exportContent = `<html><head><meta charset="utf-8"><style>body{font-family:'Times New Roman',Times,serif;line-height:1.5;}</style></head><body><pre style="white-space:pre-wrap;font-family:'Times New Roman',Times,serif;">${rawEditableText}</pre></body></html>`;
    }

    const blob = new Blob([exportContent], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `${sanitizedTitle}-v${version}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const wordCount = rawEditableText.split(/\s+/).filter(Boolean).length;
  const lineCount = rawEditableText.split('\n').length;

  return (
    <div id="document-split-preview-container" className="flex flex-col h-full bg-[#080d16] border border-[#1e293b] rounded-none overflow-hidden select-text">
      
      {/* Embedded Print CSS Rules for Times New Roman Legal Output */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-legal-template-sheet, #printable-legal-template-sheet * {
            visibility: visible !important;
          }
          #printable-legal-template-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0.75in !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 12pt !important;
            line-height: 2 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* TOP COMMAND TOOLBAR */}
      <div className="no-print p-3 bg-[#0d1624] border-b border-[#1e293b] flex items-center justify-between flex-wrap gap-2 text-xs">
        
        {/* Left Document Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Scale className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white uppercase tracking-wider truncate font-heading text-xs sm:text-sm">
                {title}
              </h3>
              <span className="px-1.5 py-0.2 bg-teal-950 text-teal-300 border border-teal-500/30 text-[10px] font-mono">
                v{version}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-mono truncate">
              Client: <span className="text-teal-300 font-semibold">{clientName}</span> • Case: {caseNumber} • {category}
            </p>
          </div>
        </div>

        {/* Center View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#090d16] p-1 border border-[#1e293b]">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Split-Pane: Raw Content + Rendered Legal Template"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split-Pane</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('rendered')}
            className={`px-2.5 py-1 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'rendered'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Rendered Times New Roman Legal Format Only"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rendered Template</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`px-2.5 py-1 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Raw Content View Only"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Raw Source</span>
          </button>
        </div>

        {/* Right Actions: Downloads & Print */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* Quick Copy */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1.5 bg-[#090d16] hover:bg-slate-900 border border-[#1e293b] hover:border-teal-400 text-slate-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-all"
            title="Copy Raw Content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download dropdown / buttons */}
          <div className="flex items-center border border-teal-500/40 bg-teal-950/40">
            <button
              type="button"
              onClick={() => handleDownload('md')}
              className="px-2 py-1.5 text-teal-300 hover:bg-teal-500 hover:text-slate-950 text-[11px] font-mono font-bold transition-colors cursor-pointer"
              title="Download as Markdown"
            >
              .MD
            </button>
            <div className="w-[1px] h-4 bg-teal-500/30"></div>
            <button
              type="button"
              onClick={() => handleDownload('doc')}
              className="px-2 py-1.5 text-teal-300 hover:bg-teal-500 hover:text-slate-950 text-[11px] font-mono font-bold transition-colors cursor-pointer"
              title="Download as Word DOC"
            >
              .DOC
            </button>
            <div className="w-[1px] h-4 bg-teal-500/30"></div>
            <button
              type="button"
              onClick={() => handleDownload('txt')}
              className="px-2 py-1.5 text-teal-300 hover:bg-teal-500 hover:text-slate-950 text-[11px] font-mono font-bold transition-colors cursor-pointer"
              title="Download as Plain Text"
            >
              .TXT
            </button>
            <div className="w-[1px] h-4 bg-teal-500/30"></div>
            <button
              type="button"
              onClick={() => handleDownload('html')}
              className="px-2 py-1.5 text-teal-300 hover:bg-teal-500 hover:text-slate-950 text-[11px] font-mono font-bold transition-colors cursor-pointer"
              title="Download as Clean HTML"
            >
              .HTML
            </button>
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 font-mono text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            title="Print Clean-Formatted Times New Roman Legal Document"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {/* Close Button if applicable */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-[#090d16] hover:bg-slate-900 border border-[#1e293b] text-slate-400 hover:text-white cursor-pointer ml-1"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SECONDARY FORMATTING CONTROLS BAR (FOR LEGAL TEMPLATE CUSTOMIZATION) */}
      <div className="no-print px-4 py-2 bg-[#090d16] border-b border-[#1e293b] flex items-center justify-between text-[11px] font-mono text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-teal-400 font-bold flex items-center gap-1">
            <Type className="w-3.5 h-3.5" />
            <span>Typography:</span>
          </span>
          <span className="px-2 py-0.5 bg-slate-900 border border-[#1e293b] text-slate-200 font-serif">
            Times New Roman (Standard Legal)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFontSize(s => Math.max(11, s - 1))}
              className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-[#1e293b] cursor-pointer"
            >
              A-
            </button>
            <span className="px-1 text-slate-300 font-bold">{fontSize}pt</span>
            <button
              type="button"
              onClick={() => setFontSize(s => Math.min(18, s + 1))}
              className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-[#1e293b] cursor-pointer"
            >
              A+
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIncludeLetterhead(!includeLetterhead)}
            className={`px-2 py-0.5 border cursor-pointer ${
              includeLetterhead
                ? 'bg-teal-950 text-teal-300 border-teal-500/40 font-semibold'
                : 'bg-slate-900 text-slate-500 border-[#1e293b]'
            }`}
          >
            Court Caption Block: {includeLetterhead ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => setPaperTheme(t => t === 'white' ? 'parchment' : t === 'parchment' ? 'dark' : 'white')}
            className="px-2 py-0.5 bg-slate-900 border border-[#1e293b] text-slate-300 hover:text-white cursor-pointer"
          >
            Paper: {paperTheme === 'white' ? 'Bond White' : paperTheme === 'parchment' ? 'Cream Parchment' : 'Executive Dark'}
          </button>
          <button
            type="button"
            onClick={() => setLineSpacing(l => l === 'normal' ? 'relaxed' : l === 'relaxed' ? 'double' : 'normal')}
            className="px-2 py-0.5 bg-slate-900 border border-[#1e293b] text-slate-300 hover:text-white cursor-pointer"
          >
            Spacing: {lineSpacing === 'normal' ? 'Single' : lineSpacing === 'relaxed' ? '1.5x' : 'Double (2.0)'}
          </button>
        </div>
      </div>

      {/* MAIN SPLIT-PANE VIEWPORT */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* LEFT PANE: RAW GENERATED CONTENT */}
        {(viewMode === 'split' || viewMode === 'raw') && (
          <div className={`flex flex-col border-r border-[#1e293b] bg-[#070b13] ${
            viewMode === 'split' ? 'w-1/2' : 'w-full'
          }`}>
            {/* Raw Pane Header */}
            <div className="px-4 py-2 bg-[#0b101c] border-b border-[#1e293b] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-mono font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  Raw Generated Document Content
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10.5px] font-mono text-slate-400">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{lineCount} lines</span>
                {onSave && (
                  <button
                    type="button"
                    onClick={() => {
                      onSave(rawEditableText);
                      alert('Document content revisions saved.');
                    }}
                    className="ml-2 px-2 py-0.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold font-mono rounded-none text-[10px] cursor-pointer flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save Draft</span>
                  </button>
                )}
              </div>
            </div>

            {/* Raw Text Editor / Viewer */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
              <textarea
                value={rawEditableText}
                onChange={(e) => setRawEditableText(e.target.value)}
                className="w-full h-full min-h-[500px] bg-transparent text-slate-300 font-mono text-xs leading-relaxed focus:outline-none resize-none border-none p-0 selection:bg-teal-500/30"
                placeholder="Raw document text..."
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* RIGHT PANE: RENDERED CLEAN-FORMATTED LEGAL TEMPLATE VERSION (TIMES NEW ROMAN) */}
        {(viewMode === 'split' || viewMode === 'rendered') && (
          <div className={`flex flex-col bg-[#050811] overflow-y-auto p-4 sm:p-8 flex justify-center select-text ${
            viewMode === 'split' ? 'w-1/2' : 'w-full'
          }`}>
            
            {/* Rendered Template Header Toolbar */}
            <div className="no-print max-w-[800px] w-full mx-auto mb-3 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                  Rendered Legal Template Version
                </span>
              </div>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 font-serif">
                Times New Roman • Ready for Court Filing
              </span>
            </div>

            {/* Formal Legal Document Sheet */}
            <div
              id="printable-legal-template-sheet"
              ref={printSheetRef}
              style={{
                fontFamily: "'Times New Roman', Times, Georgia, serif",
                fontSize: `${fontSize}pt`,
                lineHeight: lineSpacing === 'normal' ? 1.4 : lineSpacing === 'relaxed' ? 1.75 : 2.2
              }}
              className={`w-full max-w-[800px] mx-auto min-h-[1050px] shadow-2xl p-8 sm:p-14 border transition-all relative flex flex-col justify-between ${
                paperTheme === 'white'
                  ? 'bg-white text-[#111827] border-slate-300'
                  : paperTheme === 'parchment'
                  ? 'bg-[#faf6ee] text-[#1c1917] border-[#ded4bd]'
                  : 'bg-[#0e1626] text-slate-100 border-[#1e293b]'
              }`}
            >
              <div>
                
                {/* Formal Court Pleading Caption */}
                {includeLetterhead && (
                  <div className="border-b-2 border-current pb-6 mb-8 select-text">
                    
                    {/* Attorney Block Header */}
                    <div className="text-[11pt] leading-snug mb-6">
                      <p className="font-bold tracking-wide">LEVEL 23 LEGAL CONSULTING & ADVOCACY GROUP</p>
                      <p>Alex, Senior Legal Specialist (Bar ID #L23-2026)</p>
                      <p>700 Flower Street, Suite 2300, Los Angeles, CA 90017</p>
                      <p>Telephone: (213) 555-0123 • Email: filings@level23legal.com</p>
                      <p className="mt-1 font-semibold">Attorney for Petitioner / Declarant: {clientName.toUpperCase()}</p>
                    </div>

                    {/* Court Jurisdiction */}
                    <div className="text-center font-bold uppercase tracking-widest text-[12pt] my-4">
                      SUPERIOR COURT OF THE STATE OF CALIFORNIA<br />
                      COUNTY OF ORANGE • FAMILY LAW & GENERAL JURISDICTION
                    </div>

                    {/* Case Caption Grid */}
                    <div className="border border-current p-4 grid grid-cols-2 text-[10.5pt] leading-normal mt-4">
                      <div className="pr-4 border-r border-current space-y-2">
                        <p>In re the Matter of:</p>
                        <p className="font-bold uppercase pl-4">{clientName},</p>
                        <p className="pl-6 italic">Petitioner / Declarant,</p>
                        <p className="text-center font-bold my-1">and</p>
                        <p className="font-bold uppercase pl-4">JOHN DOE / RESPONDENT,</p>
                        <p className="pl-6 italic">Respondent.</p>
                      </div>
                      <div className="pl-4 flex flex-col justify-between">
                        <div className="space-y-1">
                          <p><strong className="font-bold">CASE NO.:</strong> {caseNumber}</p>
                          <p><strong className="font-bold">DEPT.:</strong> L23-FAMILY</p>
                          <p><strong className="font-bold">HEARING DATE:</strong> Pending Scheduling</p>
                        </div>
                        <div className="pt-2 border-t border-current mt-2">
                          <p className="font-bold uppercase tracking-wide text-xs">{title}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* Formal Clean-Formatted Legal Content */}
                <div className="legal-body-content whitespace-pre-wrap text-justify selection:bg-amber-200 selection:text-black">
                  {rawEditableText}
                </div>

              </div>

              {/* Formal Legal Signature Block */}
              <div className="mt-14 pt-6 border-t border-current flex justify-between items-end text-[11pt]">
                <div>
                  <p className="italic">Dated: {generatedAt || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="mt-4">Respectfully submitted,</p>
                  <div className="w-56 h-[1px] bg-current my-3"></div>
                  <p className="font-bold">Alex, Designated Counsel</p>
                  <p className="text-xs opacity-80">LEVEL 23 LEGAL CONSULTING GROUP</p>
                </div>
                <div className="text-right text-xs opacity-70">
                  <p>Exhibit Reference: DOC-v{version}</p>
                  <p>Certified Under Local Rule 5.11</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
