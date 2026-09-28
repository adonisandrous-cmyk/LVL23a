import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  FileCheck,
  Eye,
  Download,
  Copy,
  Check,
  Edit3,
  Share2,
  RefreshCw,
  ExternalLink,
  Layers,
  Code,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  FolderOpen
} from 'lucide-react';

interface DocumentViewerProps {
  initialFileUrl?: string;
  initialFileName?: string;
  initialFileType?: 'pdf' | 'xfdf' | 'json' | 'text';
  onEditInEditor?: (formCode?: string) => void;
  onRouteFile?: (fileUrl: string) => void;
  onClose?: () => void;
}

export default function DocumentViewer({
  initialFileUrl = '/templates/FL-120.pdf',
  initialFileName = 'FL-120.pdf',
  initialFileType = 'pdf',
  onEditInEditor,
  onRouteFile,
  onClose
}: DocumentViewerProps) {
  const [currentUrl, setCurrentUrl] = useState<string>(initialFileUrl);
  const [currentFileName, setCurrentFileName] = useState<string>(initialFileName);
  const [currentFileType, setCurrentFileType] = useState<'pdf' | 'xfdf' | 'json' | 'text'>(initialFileType);

  const [activeMode, setActiveMode] = useState<'visual' | 'fields' | 'raw'>('visual');
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Parsed XFDF or mapping fields
  const [parsedFields, setParsedFields] = useState<Array<{ name: string; value: string; universalKey?: string }>>([]);

  // Available files dropdown
  const [availableFiles, setAvailableFiles] = useState<Array<{ name: string; url: string; type: 'pdf' | 'xfdf' | 'json' }>>([
    { name: 'FL-120.pdf (Official Template)', url: '/templates/FL-120.pdf', type: 'pdf' },
    { name: 'FL-100.pdf (Official Template)', url: '/templates/FL-100.pdf', type: 'pdf' },
    { name: 'FL-110.pdf (Official Template)', url: '/templates/FL-110.pdf', type: 'pdf' },
    { name: 'FL-115.pdf (Official Template)', url: '/templates/FL-115.pdf', type: 'pdf' },
    { name: 'FL-150.pdf (Official Template)', url: '/templates/FL-150.pdf', type: 'pdf' },
    { name: 'FL-300.pdf (Official Template)', url: '/templates/FL-300.pdf', type: 'pdf' },
    { name: 'EOIR-33.pdf (Official Template)', url: '/templates/EOIR-33.pdf', type: 'pdf' },
    { name: 'I-589.pdf (Official Template)', url: '/templates/I-589.pdf', type: 'pdf' },
    { name: 'FL-120_Maria_Lopez_Filled.pdf (Matter Vault)', url: '/output/Family_Law/23-12345/FL-120_Maria_Lopez_Filled.pdf', type: 'pdf' },
    { name: 'FL-120_Maria_Lopez.xfdf (Matter Vault)', url: '/output/Family_Law/23-12345/FL-120_Maria_Lopez.xfdf', type: 'xfdf' },
    { name: 'FL-110_Maria_Lopez_Filled.pdf (Matter Vault)', url: '/output/Family_Law/23-12345/FL-110_Maria_Lopez_Filled.pdf', type: 'pdf' },
    { name: 'FL-110_Maria_Lopez.xfdf (Matter Vault)', url: '/output/Family_Law/23-12345/FL-110_Maria_Lopez.xfdf', type: 'xfdf' },
    { name: 'EOIR-33_Carlos_Mendoza_Filled.pdf (Matter Vault)', url: '/output/Immigration/A098765432-EOIR/EOIR-33_Carlos_Mendoza_Filled.pdf', type: 'pdf' },
    { name: 'EOIR-33_Carlos_Mendoza.xfdf (Matter Vault)', url: '/output/Immigration/A098765432-EOIR/EOIR-33_Carlos_Mendoza.xfdf', type: 'xfdf' },
    { name: 'FL-120.mapping.json', url: '/forms/FL-120.mapping.json', type: 'json' },
    { name: 'FL-100.mapping.json', url: '/forms/FL-100.mapping.json', type: 'json' },
    { name: 'EOIR-33.mapping.json', url: '/forms/EOIR-33.mapping.json', type: 'json' }
  ]);

  // Load content whenever URL changes
  const loadFileContent = async (url: string) => {
    try {
      setLoading(true);
      const isXfdfOrText = url.endsWith('.xfdf') || url.endsWith('.json') || url.endsWith('.txt') || url.endsWith('.xml');
      const cleanPath = url.replace(/^\//, '');

      if (isXfdfOrText) {
        const res = await fetch(`/api/v1/file-content?path=${encodeURIComponent(cleanPath)}`);
        const json = await res.json();
        if (json.success && json.content) {
          setFileContent(json.content);

          // Parse XFDF if applicable
          if (url.endsWith('.xfdf')) {
            parseXfdfXml(json.content);
            setActiveMode('fields');
          } else if (url.endsWith('.json')) {
            parseMappingJson(json.content);
            setActiveMode('fields');
          } else {
            setActiveMode('raw');
          }
        }
      } else {
        // PDF mode
        setActiveMode('visual');
        // Check if there is a companion XFDF in the same matter or output dir
        const xfdfUrl = url.replace(/_Filled\.pdf$/, '.xfdf').replace(/\.pdf$/, '.xfdf');
        try {
          const resX = await fetch(`/api/v1/file-content?path=${encodeURIComponent(xfdfUrl.replace(/^\//, ''))}`);
          const jsonX = await resX.json();
          if (jsonX.success && jsonX.content) {
            parseXfdfXml(jsonX.content);
          }
        } catch {
          // No companion xfdf, fine
        }
      }
    } catch (err) {
      console.error('Failed to load file content:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseXfdfXml = (xmlStr: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
      const fieldNodes = xmlDoc.getElementsByTagName('field');
      const fields: Array<{ name: string; value: string }> = [];

      for (let i = 0; i < fieldNodes.length; i++) {
        const node = fieldNodes[i];
        const name = node.getAttribute('name') || `Field_${i}`;
        const valNode = node.getElementsByTagName('value')[0];
        const val = valNode ? valNode.textContent || '' : '';
        fields.push({ name, value: val });
      }
      setParsedFields(fields);
    } catch (err) {
      console.warn('XFDF parse warning:', err);
    }
  };

  const parseMappingJson = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      const fieldsObj = data.fields || {};
      const fields = Object.entries(fieldsObj).map(([uKey, pdfField]) => ({
        universalKey: uKey,
        name: String(pdfField),
        value: `Mapped from: ${uKey}`
      }));
      setParsedFields(fields);
    } catch (err) {
      console.warn('JSON parse warning:', err);
    }
  };

  useEffect(() => {
    loadFileContent(currentUrl);
  }, [currentUrl]);

  const handleCopyContent = () => {
    if (fileContent) {
      navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPdf = currentUrl.endsWith('.pdf');
  const isXfdf = currentUrl.endsWith('.xfdf');

  return (
    <div
      className={`bg-[#090f1d] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 bg-[#090f1d]' : 'w-full'
      }`}
    >
      {/* Top Header & Control Toolbar */}
      <div className="p-4 bg-gradient-to-r from-slate-950 via-[#0a1122] to-slate-950 border-b border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
              isPdf
                ? 'bg-blue-950/80 border border-blue-500/50 text-blue-400'
                : isXfdf
                ? 'bg-amber-950/80 border border-amber-500/50 text-amber-400'
                : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-400'
            }`}
          >
            {isPdf ? <FileCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white font-mono">{currentFileName}</h2>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold ${
                  isPdf
                    ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50'
                    : isXfdf
                    ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                    : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                }`}
              >
                {isPdf ? 'Official Court PDF' : isXfdf ? 'Adobe XFDF Payload' : 'Mapping / JSON'}
              </span>
              {currentUrl.includes('/output/') && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Matter Vault Output
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Path: <span className="text-slate-300">.{currentUrl}</span>
            </p>
          </div>
        </div>

        {/* View Mode Tabs and Actions */}
        <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto font-mono text-xs">
          {/* Quick File Switcher */}
          <div className="flex items-center gap-1.5 mr-1">
            <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={currentUrl}
              onChange={(e) => {
                const target = availableFiles.find((f) => f.url === e.target.value);
                if (target) {
                  setCurrentUrl(target.url);
                  setCurrentFileName(target.name.split(' ')[0]);
                  setCurrentFileType(target.type);
                }
              }}
              className="p-1.5 bg-[#070b14] border border-slate-700 rounded-lg text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none max-w-[200px] truncate"
            >
              <optgroup label="Matter Vault Filled Artifacts">
                {availableFiles
                  .filter((f) => f.url.includes('/output/'))
                  .map((f) => (
                    <option key={f.url} value={f.url}>
                      {f.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Official Court Templates">
                {availableFiles
                  .filter((f) => f.url.startsWith('/templates/'))
                  .map((f) => (
                    <option key={f.url} value={f.url}>
                      {f.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Declarative Mapping JSON">
                {availableFiles
                  .filter((f) => f.url.startsWith('/forms/'))
                  .map((f) => (
                    <option key={f.url} value={f.url}>
                      {f.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#070b14] border border-slate-800 rounded-lg p-0.5">
            {isPdf && (
              <button
                onClick={() => setActiveMode('visual')}
                className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer flex items-center gap-1 font-bold ${
                  activeMode === 'visual' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>PDF View</span>
              </button>
            )}

            <button
              onClick={() => setActiveMode('fields')}
              className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer flex items-center gap-1 font-bold ${
                activeMode === 'fields' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Fields ({parsedFields.length})</span>
            </button>

            <button
              onClick={() => setActiveMode('raw')}
              className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer flex items-center gap-1 font-bold ${
                activeMode === 'raw' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>XML / Code</span>
            </button>
          </div>

          {/* Edit in Editor Action */}
          {onEditInEditor && (
            <button
              onClick={() => onEditInEditor(currentFileName.split('_')[0].replace('.pdf', '').replace('.xfdf', ''))}
              className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 hover:text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
              title="Edit in Court Form Field Editor"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Open in Editor</span>
            </button>
          )}

          {/* Route to Client Matter Action */}
          {onRouteFile && (
            <button
              onClick={() => onRouteFile(currentUrl)}
              className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
              title="Route to Client Matter"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Route</span>
            </button>
          )}

          {/* Download */}
          <a
            href={currentUrl}
            download={currentFileName}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-all cursor-pointer"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </a>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close button if provided */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 rounded transition-all cursor-pointer"
              title="Close Viewer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#060a14] min-h-[550px] relative overflow-hidden flex flex-col">
        {loading && (
          <div className="absolute inset-0 bg-[#060a14]/80 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading document artifact...</span>
            </div>
          </div>
        )}

        {/* 1. VISUAL PDF MODE */}
        {activeMode === 'visual' && isPdf && (
          <div className="flex-1 flex flex-col md:flex-row h-full">
            {/* Embedded PDF Viewer */}
            <div className="flex-1 p-2 bg-slate-950 flex flex-col h-[650px] relative">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#090f1d] border border-slate-800 rounded-t-lg text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Adobe PDF Render Preview</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-slate-300">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(180, z + 10))}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:underline text-[11px] ml-2"
                  >
                    <span>Open External</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-b-lg overflow-hidden relative">
                <object
                  data={`${currentUrl}#view=FitH&zoom=${zoomLevel}`}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3 font-mono">
                    <FileCheck className="w-12 h-12 text-blue-400" />
                    <p className="text-xs text-slate-300">
                      Standard PDF preview not supported in this frame.
                    </p>
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download or Open Official Court PDF</span>
                    </a>
                  </div>
                </object>
              </div>
            </div>

            {/* Side-by-side Field Inspection Drawer */}
            {parsedFields.length > 0 && (
              <div className="w-full md:w-80 p-3 bg-[#080d1a] border-t md:border-t-0 md:border-l border-slate-800 flex flex-col font-mono text-xs overflow-y-auto max-h-[650px]">
                <div className="pb-2 border-b border-slate-800 mb-3 flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Populated Court Fields</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    {parsedFields.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {parsedFields.map((f, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-[#050811] border border-slate-800/80 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold text-cyan-300 truncate max-w-[180px]" title={f.name}>
                          {f.name}
                        </span>
                        {f.universalKey && (
                          <span className="text-[9px] text-slate-500">[{f.universalKey}]</span>
                        )}
                      </div>
                      <div className="p-1.5 bg-[#03050a] rounded text-[11px] text-emerald-300 break-all select-all border border-slate-900">
                        {f.value || <em className="text-slate-600 font-normal">empty</em>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. FIELDS & XFDF OVERLAY TABLE MODE */}
        {activeMode === 'fields' && (
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#090f1d] border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">
                    W3C Adobe XFDF Form Field Data Structure
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {parsedFields.length} fields mapped to official court PDF form tags.
                  </p>
                </div>
              </div>

              {onEditInEditor && (
                <button
                  onClick={() => onEditInEditor(currentFileName.split('_')[0].replace('.pdf', '').replace('.xfdf', ''))}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Values in Form Editor</span>
                </button>
              )}
            </div>

            {parsedFields.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                No structured field records found in this document. Switch to XML or Raw view.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#090f1d] text-slate-400 text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 font-medium">#</th>
                      <th className="p-2.5 font-medium">Official PDF Field Name (&lt;field name=&quot;...&quot;&gt;)</th>
                      <th className="p-2.5 font-medium">Universal Relational Key</th>
                      <th className="p-2.5 font-medium">Populated Value (&lt;value&gt;)</th>
                      <th className="p-2.5 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {parsedFields.map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-2.5 text-slate-500 text-[11px]">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-cyan-300">{f.name}</td>
                        <td className="p-2.5 text-slate-400">
                          {f.universalKey || (
                            <span className="text-slate-600 italic">Universal Schema</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-semibold select-all">
                            {f.value || '—'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-700/40">
                            Valid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. RAW XML / CODE INSPECTOR MODE */}
        {activeMode === 'raw' && (
          <div className="flex-1 flex flex-col p-3 space-y-2 h-full">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#090f1d] border border-slate-800 rounded-t-lg font-mono text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-purple-400" />
                <span>Source Inspector ({fileContent.length} bytes)</span>
              </span>
              <button
                onClick={handleCopyContent}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Source'}</span>
              </button>
            </div>

            <pre className="flex-1 p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-b-lg border border-slate-800 overflow-auto whitespace-pre-wrap select-all leading-relaxed">
              {fileContent || '<!-- Empty or binary content -->'}
            </pre>
          </div>
        )}
      </div>

      {/* Footer Info & Adobe Instructions */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Official Pipeline Compliance: W3C / Adobe Acrobat XFDF 1-Click Injection Compatible</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Adobe Acrobat: Tools ➔ Prepare Form ➔ More ➔ Import Data</span>
        </div>
      </div>
    </div>
  );
}
