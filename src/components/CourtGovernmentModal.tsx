import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink, 
  X, 
  Scale, 
  Check, 
  Database, 
  ShieldCheck, 
  Copy,
  Landmark,
  UserCheck
} from 'lucide-react';
import { 
  CourtGovernmentRecord, 
  COURT_GOVERNMENT_DIRECTORY, 
  lookupCourtGovernment 
} from '../data/courtGovernmentDatabase';

interface CourtGovernmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseCounty?: string;
  caseNumber?: string;
  clientName?: string;
  onApplyToStaging?: (record: CourtGovernmentRecord) => void;
}

export const CourtGovernmentModal: React.FC<CourtGovernmentModalProps> = ({
  isOpen,
  onClose,
  caseCounty,
  caseNumber,
  clientName,
  onApplyToStaging
}) => {
  const initialRecord = lookupCourtGovernment(caseCounty);
  const [selectedRecord, setSelectedRecord] = useState<CourtGovernmentRecord>(initialRecord);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [stagedSuccess, setStagedSuccess] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleStageAutopopulation = () => {
    if (onApplyToStaging) {
      onApplyToStaging(selectedRecord);
    }
    setStagedSuccess(true);
    setTimeout(() => setStagedSuccess(false), 2500);
  };

  return (
    <AnimatePresence>
      <div 
        id="court-government-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0b1220] border border-amber-500/40 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col font-mono"
        >
          {/* Top Bar Header */}
          <div className="p-4 bg-gradient-to-r from-[#0d172a] via-[#09111f] to-[#0a101b] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                <Landmark className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wide flex items-center gap-2">
                  <span>Court & Government (DA) Database Directory</span>
                  <span className="text-[9px] px-2 py-0.5 rounded uppercase font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                    Staged for Autopopulation
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Linked to Case: <strong className="text-white">{caseNumber || '[UNASSIGNED]'}</strong> | Client: <strong className="text-teal-300">{clientName || '[UNASSIGNED]'}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Jurisdiction Selector Pills */}
          <div className="p-3 bg-[#070b14] border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[10px] text-slate-500 uppercase font-bold whitespace-nowrap pl-1">
              Select Jurisdiction:
            </span>
            {COURT_GOVERNMENT_DIRECTORY.map((court) => (
              <button
                key={court.id}
                type="button"
                onClick={() => setSelectedRecord(court)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedRecord.id === court.id
                    ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold'
                    : 'bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{court.countyOrJurisdiction}</span>
                {selectedRecord.id === court.id && <Check className="w-3 h-3 text-amber-400" />}
              </button>
            ))}
          </div>

          {/* Body Information Panels */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
            {/* 2-Column Grid: Court Venue on Left, District Attorney & Govt on Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* COURT VENUE CARD */}
              <div className="p-4 bg-[#090f1d] border border-slate-800 rounded-xl space-y-3 shadow-inner">
                <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-300 font-bold uppercase text-[11.5px]">
                    <Building2 className="w-4 h-4 text-teal-400" />
                    <span>Superior Court / Courthouse Venue</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    Jurisdiction
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Court Title:</label>
                    <div className="text-white font-bold text-[12px]">{selectedRecord.courtName}</div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Courthouse / Branch:</label>
                    <div className="text-amber-300 font-semibold">{selectedRecord.courthouseName}</div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <label className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Street Address:</label>
                      <div className="text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{selectedRecord.streetAddress}, {selectedRecord.city}, {selectedRecord.state} {selectedRecord.zip}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${selectedRecord.streetAddress}, ${selectedRecord.city}, ${selectedRecord.state} ${selectedRecord.zip}`, 'court_addr')}
                      className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded cursor-pointer shrink-0"
                    >
                      {copiedKey === 'court_addr' ? 'Copied' : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Court Phone & Division:</label>
                    <div className="text-slate-300 flex items-center gap-2">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{selectedRecord.phone}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-400">{selectedRecord.departmentOrDivision}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Presiding Judge / Bench:</label>
                    <div className="text-indigo-300 font-semibold">{selectedRecord.presidingJudge}</div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Clerk Filing Portal:</label>
                    <div className="text-emerald-400 text-[11px] truncate">{selectedRecord.clerkFilingPortal}</div>
                  </div>
                </div>
              </div>

              {/* DISTRICT ATTORNEY & GOVERNMENT ADVERSARY CARD */}
              <div className="p-4 bg-[#090f1d] border border-slate-800 rounded-xl space-y-3 shadow-inner">
                <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-bold uppercase text-[11.5px]">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span>District Attorney & Government Counsel</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Prosecution / Child Support
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Agency / DA Name:</label>
                    <div className="text-white font-bold text-[12px]">{selectedRecord.districtAttorneyName}</div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Department / Division:</label>
                    <div className="text-amber-200">{selectedRecord.districtAttorneyDivision}</div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <label className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">Office Address:</label>
                      <div className="text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{selectedRecord.districtAttorneyAddress}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedRecord.districtAttorneyAddress, 'da_addr')}
                      className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded cursor-pointer shrink-0"
                    >
                      {copiedKey === 'da_addr' ? 'Copied' : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">DA Direct Phone & Contact:</label>
                    <div className="text-slate-300 flex items-center gap-2">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{selectedRecord.districtAttorneyPhone}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{selectedRecord.districtAttorneyContact}</div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-0.5">DA Service Email:</label>
                    <div className="text-teal-300 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{selectedRecord.districtAttorneyEmail}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Mapped Fields Staging Bar */}
            <div className="p-3.5 bg-[#060a12] border border-teal-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300 uppercase flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-400" />
                  <span>Staged Database Autopopulation Map</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Universal DB Linked</span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="bg-[#090f1d] p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block">court.county</span>
                  <span className="text-white font-semibold">{selectedRecord.countyOrJurisdiction}</span>
                </div>
                <div className="bg-[#090f1d] p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block">court.courthouse</span>
                  <span className="text-amber-300 font-semibold truncate block">{selectedRecord.courthouseName}</span>
                </div>
                <div className="bg-[#090f1d] p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block">court.judge</span>
                  <span className="text-indigo-300 font-semibold truncate block">{selectedRecord.presidingJudge.split('/')[0]}</span>
                </div>
                <div className="bg-[#090f1d] p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block">court.da_contact</span>
                  <span className="text-teal-300 font-semibold truncate block">{selectedRecord.districtAttorneyPhone}</span>
                </div>
              </div>
            </div>

            {/* Notes / Special Instructions */}
            <div className="p-3 bg-[#070c16] border border-slate-800/80 rounded-xl text-[11px] text-slate-400 leading-relaxed">
              <span className="text-slate-500 font-bold uppercase block mb-1">Local Rules & Venue Protocol:</span>
              <p>{selectedRecord.notes}</p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-[#080d18] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>These verified records auto-populate FL-120, FL-105, EOIR-33, and caption blocks.</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleStageAutopopulation}
                className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-mono text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-slate-950" />
                <span>{stagedSuccess ? '✓ Staged to Case Profile' : 'Stage into Case Profile'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
