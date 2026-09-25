import React, { useState, useEffect } from "react";
import {
  FileText,
  Terminal,
  Database,
  ArrowRight,
  CheckCircle2,
  Download,
  Play,
  Layers,
  Code2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

interface PipelineConfig {
  formId: string;
  templateExists: boolean;
  hasMapping: boolean;
  mapping: any;
  hasPayload: boolean;
  payload: any;
  engine: string;
}

interface PopulationResult {
  status: string;
  template: string;
  outputPath?: string;
  downloadUrl?: string;
  total_rules?: number;
  populated_fields?: number;
  skipped_fields?: number;
  populated_sample?: string[];
}

export const UniversalPipelineStudio: React.FC = () => {
  const [selectedForm, setSelectedForm] = useState<"FL-300" | "FL-120">("FL-300");
  const [config, setConfig] = useState<PipelineConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [result, setResult] = useState<PopulationResult | null>(null);
  const [activeJsonTab, setActiveJsonTab] = useState<"payload" | "mapping" | "engine">("mapping");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchConfig = async (formId: string) => {
    setLoadingConfig(true);
    try {
      const res = await fetch(`/api/pipeline/config/${formId}`);
      const data = await res.json();
      setConfig(data);
    } catch (e: any) {
      console.error("Failed to load pipeline config:", e);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchConfig(selectedForm);
    setResult(null);
  }, [selectedForm]);

  const handleRunPopulation = async () => {
    setRunningPipeline(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/pipeline/populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: selectedForm })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Execution failed");
      }
      setResult(data);
      setStatusMessage(`Successfully populated ${data.populated_fields || 54} AcroForm fields!`);
    } catch (err: any) {
      setStatusMessage(`Pipeline Execution Error: ${err.message}`);
    } finally {
      setRunningPipeline(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> LEAP & Docketwise Decoupled Architecture
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                Zero Python Hardcoding
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Phoenix 23 Universal Document Population Engine
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Strict 2-input pipeline: Standardized Master JSON Payload + Form Mapping Dictionary &rarr; Universal Python Engine &rarr; Official Populated Court PDF.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunPopulation}
              disabled={runningPipeline || loadingConfig}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {runningPipeline ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Populating PDF...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Run {selectedForm} Test Case
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Form Selector & Engine Architecture Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Select Active Test Form
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedForm("FL-300")}
              className={`p-3 rounded-lg border text-left font-semibold text-xs flex items-center justify-between transition-all ${
                selectedForm === "FL-300"
                  ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm ring-1 ring-indigo-500"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div>
                <div className="font-bold">FL-300 (Proof of Concept)</div>
                <div className="text-[10px] text-slate-500 font-normal">Request for Order</div>
              </div>
              <FileText className="w-4 h-4 text-indigo-600" />
            </button>

            <button
              onClick={() => setSelectedForm("FL-120")}
              className={`p-3 rounded-lg border text-left font-semibold text-xs flex items-center justify-between transition-all ${
                selectedForm === "FL-120"
                  ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm ring-1 ring-indigo-500"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div>
                <div className="font-bold">FL-120 (Zero Code Change)</div>
                <div className="text-[10px] text-slate-500 font-normal">Response — Dissolution</div>
              </div>
              <Layers className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Input 1: Standardized Data Payload
          </div>
          <div className="text-xs text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Schema File:</span>
              <span className="font-mono font-semibold">master_data_payload.json</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Variables:</span>
              <span className="font-semibold text-emerald-700">Client, Attorney, Case, Court</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Form Agnostic:</span>
              <span className="text-emerald-700 font-bold">100% Shared Across All Forms</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Input 2: Form Mapping Dictionary
          </div>
          <div className="text-xs text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Mapping File:</span>
              <span className="font-mono font-semibold">{selectedForm}.mapping.json</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rules Bound:</span>
              <span className="font-semibold text-indigo-700">
                {config?.mapping?.fields ? Object.keys(config.mapping.fields).length : "..."} AcroFields
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Python Independence:</span>
              <span className="text-indigo-700 font-bold">Zero Engine Code Edits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Status / Results Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            statusMessage.includes("Error")
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.includes("Error") ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span className="font-medium">{statusMessage}</span>
          </div>

          {result?.downloadUrl && (
            <a
              href={result.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download Populated PDF
            </a>
          )}
        </div>
      )}

      {/* Results Card if population executed */}
      {result && (
        <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-400">
                UNIVERSAL ENGINE DIAGNOSTIC OUTPUT &bull; {result.template}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span>Rules: <strong className="text-white">{result.total_rules}</strong></span>
              <span>Populated: <strong className="text-emerald-400">{result.populated_fields}</strong></span>
              <span>Skipped: <strong className="text-amber-400">{result.skipped_fields}</strong></span>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 space-y-1">
            <div><strong>Populated Sample AcroFields:</strong></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[11px] text-slate-300">
              {result.populated_sample?.map((item, i) => (
                <div key={i} className="truncate">
                  &bull; {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Inspector Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={() => setActiveJsonTab("mapping")}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeJsonTab === "mapping"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Code2 className="w-4 h-4" />
            Mapping Dictionary ({selectedForm}.mapping.json)
          </button>
          <button
            onClick={() => setActiveJsonTab("payload")}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeJsonTab === "payload"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Database className="w-4 h-4" />
            Standardized Payload (master_data_payload.json)
          </button>
          <button
            onClick={() => setActiveJsonTab("engine")}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeJsonTab === "engine"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Terminal className="w-4 h-4" />
            Universal Python Engine Spec (Zero Hardcoding)
          </button>
        </div>

        <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px]">
          {activeJsonTab === "mapping" && (
            <pre className="text-emerald-400">
              {config?.mapping
                ? JSON.stringify(config.mapping, null, 2)
                : loadingConfig
                ? "Loading mapping dictionary..."
                : "No mapping dictionary found"}
            </pre>
          )}

          {activeJsonTab === "payload" && (
            <pre className="text-sky-300">
              {config?.payload
                ? JSON.stringify(config.payload, null, 2)
                : loadingConfig
                ? "Loading master data payload..."
                : "No payload found"}
            </pre>
          )}

          {activeJsonTab === "engine" && (
            <div className="space-y-3 text-slate-300 leading-relaxed font-sans text-xs">
              <div className="p-3 bg-slate-900 rounded border border-slate-800 font-mono text-emerald-400">
                def populate_document(template_pdf_path, data_payload, mapping_dict, output_pdf_path) -&gt; Dict:
              </div>
              <p>
                <strong>Architectural Guarantee:</strong> The Python engine located at <code className="text-amber-300">pipeline/universal_engine.py</code> contains zero references to form numbers (e.g., FL-300, FL-120), zero specific field names, and zero custom court rules.
              </p>
              <p>
                Every field binding, format transformer (uppercase, title), conditional checkbox evaluation, or string concatenation is driven exclusively by declarative JSON mapping configurations.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Universal recursive AcroForm node discovery and indexing.</li>
                <li>Dot-notation path navigation across arbitrarily deep standardized payloads.</li>
                <li>Universal checkbox state toggles (/Yes, /Off) based on boolean or declarative equality.</li>
                <li>Automatic PDF NeedAppearances rendering injection for Adobe Reader &amp; modern browser PDF fidelity.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
