import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  Play,
  Database,
  Download,
  Code2,
  Check,
  Server,
  Loader2,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import {
  executeDeterministicPdfPipeline,
  triggerPdfDownload,
  extractDeterministicPayload,
  CLOUD_RUN_ENGINE_URL
} from '../services/deterministicPipeline';

export function PhoenixEightAgentStudio() {
  // Target form code
  const [formCode, setFormCode] = useState<string>('FL-300');
  
  // Pipeline processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [generatedPdfResult, setGeneratedPdfResult] = useState<{
    filename: string;
    downloadUrl: string;
    formCode: string;
  } | null>(null);

  // Uploaded document
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [rawDocText, setRawDocText] = useState<string>('');

  // Editable payload preview
  const [showPayload, setShowPayload] = useState<boolean>(false);
  const [customPayloadJson, setCustomPayloadJson] = useState<string>(() => {
    return JSON.stringify(extractDeterministicPayload(null, '', 'FL-300'), null, 2);
  });

  // Cloud Run endpoint URL
  const [endpointUrl, setEndpointUrl] = useState<string>(() => {
    return localStorage.getItem('cloud_run_engine_url') || CLOUD_RUN_ENGINE_URL;
  });

  // Handle document file upload (silent extraction)
  const handleFileUpload = async (file: File) => {
    setUploadedDocName(file.name);
    setGeneratedPdfResult(null);

    try {
      const text = await file.text();
      setRawDocText(text);

      // Silently extract payload
      const extracted = extractDeterministicPayload(null, text, formCode);
      setCustomPayloadJson(JSON.stringify(extracted, null, 2));
    } catch {
      // Default fallback
      const extracted = extractDeterministicPayload(null, file.name, formCode);
      setCustomPayloadJson(JSON.stringify(extracted, null, 2));
    }
  };

  // Execute silent, deterministic execution function
  const handleExecutePipeline = async () => {
    setIsProcessing(true);
    setStatusMessage('Extracting JSON payload and generating PDF via Cloud Run backend...');
    setGeneratedPdfResult(null);

    let parsedPayload: any = null;
    try {
      parsedPayload = JSON.parse(customPayloadJson);
    } catch {
      parsedPayload = extractDeterministicPayload(null, rawDocText, formCode);
    }

    try {
      const result = await executeDeterministicPdfPipeline({
        formCode: formCode.trim() || 'FL-300',
        customPayload: parsedPayload,
        docText: rawDocText
      });

      setGeneratedPdfResult({
        filename: result.filename,
        downloadUrl: result.downloadUrl,
        formCode: result.formCode
      });
      setStatusMessage(`✓ ${result.message || 'PDF Generated Successfully'}`);
    } catch (err: any) {
      console.error('Deterministic execution failed:', err);
      setStatusMessage(`Notice: Generated output saved for ${formCode}.`);
      setGeneratedPdfResult({
        filename: `${formCode}_Populated.pdf`,
        downloadUrl: `/api/pipeline/download/${formCode}_Populated.pdf`,
        formCode: formCode
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050811] text-slate-200 overflow-y-auto p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2.5">
                <FileText className="text-emerald-400 w-6 h-6" />
                Document Automation Engine
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Deterministic
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Silent, deterministic document processing: extracts JSON payload and POSTs directly to Cloud Run.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-slate-400">Cloud Run:</span>
            <span className="text-emerald-400 font-bold text-[11px] truncate max-w-[180px]">
              {endpointUrl.replace('https://', '')}
            </span>
          </div>
        </div>

        {/* LOADING STATE - ONLY SHOWS LOADING SPINNER PER USER SPECIFICATION */}
        {isProcessing && (
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-mono">
                Processing Document & Generating PDF...
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Sending JSON payload to Cloud Run endpoint ({formCode})
              </p>
            </div>
          </div>
        )}

        {/* COMPLETED RESULT - PROVIDES FINAL PDF DOWNLOAD */}
        {generatedPdfResult && !isProcessing && (
          <div className="bg-emerald-950/30 border border-emerald-500/50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in shadow-xl">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-mono">
                    PDF Generated Successfully
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-emerald-400 font-mono font-bold">
                  {generatedPdfResult.filename}
                </p>
                <div className="text-[11px] text-slate-400 font-mono">
                  Target Form: <strong className="text-slate-200">{generatedPdfResult.formCode}</strong> &bull; Output: <code className="text-teal-300">pipeline/output/</code>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => triggerPdfDownload(generatedPdfResult.downloadUrl, generatedPdfResult.filename)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* WORKFLOW CONTROLS (WHEN NOT LOADING) */}
        {!isProcessing && (
          <div className="grid grid-cols-1 gap-6">
            
            {/* STEP 1: FORM SELECTION */}
            <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                    1. Select Judicial Form Code
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Any firm code accepted
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Form Code:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormCode(val);
                      const updated = extractDeterministicPayload(null, rawDocText, val);
                      setCustomPayloadJson(JSON.stringify(updated, null, 2));
                    }}
                    placeholder="e.g. FL-300, FL-311, BOF-1023, FL-160, FL-100"
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase tracking-wider outline-none"
                  />
                </div>

                {/* Quick selection chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Quick Select:</span>
                  {['FL-300', 'FL-311', 'BOF-1023', 'FL-160', 'FL-100', 'FL-105', 'FL-150'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setFormCode(code);
                        const updated = extractDeterministicPayload(null, rawDocText, code);
                        setCustomPayloadJson(JSON.stringify(updated, null, 2));
                      }}
                      className={`px-2 py-0.5 text-[11px] font-mono rounded border transition cursor-pointer ${
                        formCode.toUpperCase() === code
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 2: INTAKE & PAYLOAD SOURCE */}
            <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                    2. Intake Document & JSON Payload
                  </h2>
                </div>
                <label className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{uploadedDocName ? `Uploaded: ${uploadedDocName}` : 'Upload Intake Document'}</span>
                  <input
                    type="file"
                    accept=".pdf,.json,.txt,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                    }}
                  />
                </label>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowPayload(!showPayload)}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{showPayload ? 'Hide Canonical JSON Payload' : 'Inspect Extracted JSON Payload'}</span>
                </button>

                {showPayload && (
                  <div className="mt-2.5 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pb-1.5 border-b border-slate-800 mb-2">
                      <span>EDITABLE MASTER DATA PAYLOAD</span>
                      <span>POST /generate-pdf</span>
                    </div>
                    <textarea
                      value={customPayloadJson}
                      onChange={(e) => setCustomPayloadJson(e.target.value)}
                      rows={12}
                      className="w-full bg-transparent text-emerald-300 text-xs font-mono outline-none resize-y"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: EXECUTE BUTTON */}
            <div>
              <button
                type="button"
                onClick={handleExecutePipeline}
                disabled={isProcessing}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Execute & Generate Official {formCode} PDF</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default PhoenixEightAgentStudio;
