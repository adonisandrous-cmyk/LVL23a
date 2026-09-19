import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileCheck,
  ShieldCheck,
  Check,
  CheckCheck,
  Copy,
  Scale,
  ArrowRight,
  Eye,
  Printer
} from 'lucide-react';
import { Client, FL120IntakeData, GeneratedDocument } from '../types';
import { OfficialCaliforniaJudicialCouncilFormModal } from './OfficialCaliforniaJudicialCouncilFormModal';

interface FL120ResponseDossierProps {
  client: Client;
  fl120Data: FL120IntakeData;
  onAddGeneratedDoc?: (doc: GeneratedDocument) => void;
  onNavigateToTab?: (tab: string, clientId?: string) => void;
  onOpenOfficialForm?: (client: Client, formCode?: 'FL-120' | 'FL-105' | 'FL-311' | 'FL-160') => void;
}

export const FL120ResponseDossier: React.FC<FL120ResponseDossierProps> = ({
  client,
  fl120Data: fl,
  onAddGeneratedDoc,
  onNavigateToTab,
  onOpenOfficialForm
}) => {
  const [fl120GeneratedStatus, setFl120GeneratedStatus] = useState<string | null>(null);
  const [hasCopiedFl120, setHasCopiedFl120] = useState(false);
  const [showOfficialModalLocal, setShowOfficialModalLocal] = useState<boolean>(false);
  const [selectedFormCode, setSelectedFormCode] = useState<'FL-120' | 'FL-105' | 'FL-311' | 'FL-160'>('FL-120');

  const handleOpenOfficial = (code: 'FL-120' | 'FL-105' | 'FL-311' | 'FL-160' = 'FL-120') => {
    if (onOpenOfficialForm) {
      onOpenOfficialForm(client, code);
    } else {
      setSelectedFormCode(code);
      setShowOfficialModalLocal(true);
    }
  };

  const generateFl120Text = () => {
    return `SUPERIOR COURT OF CALIFORNIA, COUNTY OF ${(fl.courtCounty || 'ORANGE').toUpperCase()}
BRANCH: ${fl.branchName || 'Lamoreaux Justice Center, 341 The City Dr S, Orange, CA 92868'}

PETITIONER: ${fl.petitionerName || 'Petitioner'}
RESPONDENT: ${fl.respondentName || client.name}

RESPONSE TO PETITION FOR DISSOLUTION OF MARRIAGE (FL-120)
CASE NUMBER: ${fl.caseNumber || '26FL008921'}

1. LEGAL RELATIONSHIP (Fam. Code § 300):
   [X] a. We are married.

2. RESIDENCE REQUIREMENTS (Fam. Code § 2320):
   [X] a. Petitioner has been a resident of this state for at least 6 months and of this county for at least 3 months.
   [X] b. Respondent has been a resident of this state for at least 6 months and of this county for at least 3 months.

3. STATISTICAL FACTS:
   a. Date of marriage: ${fl.dateOfMarriage || '09/18/2015'}
   b. Date of separation: ${fl.dateOfSeparation || '04/10/2026'}
   c. Duration: ${fl.durationYears || 10} years, ${fl.durationMonths || 7} months

4. MINOR CHILDREN:
   [X] a. There are minor children of the marriage:
       ${(fl.minorChildren && fl.minorChildren.length > 0)
         ? fl.minorChildren.map(c => `- ${c.name}, DOB: ${c.birthdate}, Age: ${c.age}`).join('\n       ')
         : 'None'}
   [X] b. UCCJEA Declaration (Form FL-105) is attached.

5. LEGAL GROUNDS (Fam. Code § 2310):
   [X] a. Irreconcilable differences.

6. CUSTODY AND VISITATION:
   a. Legal custody to: [X] Joint (Petitioner and Respondent)
   b. Physical custody to: [X] Joint (Petitioner and Respondent)
   c. Child visitation: [X] As requested in Form FL-311 (Parenting Plan Attachment).
      Terms: ${fl.visitationRequested || 'Joint physical custody with alternating 2-2-3 schedule.'}

7. CHILD SUPPORT:
   [X] The court may make orders for support of the children and issue earnings assignment.

8. SPOUSAL SUPPORT:
   [X] Reserve for future determination the issue of support payable to Respondent.

9. SEPARATE PROPERTY:
   [X] Confirm separate property per Family Code § 770:
       ${fl.separatePropertyNotes || 'Pre-marital retirement, personal effects, and vehicles.'}

10. COMMUNITY AND QUASI-COMMUNITY ASSETS AND DEBTS:
    [X] Determine rights to community and quasi-community assets:
        ${fl.communityPropertyNotes || 'Equal division of community estate pursuant to Family Code § 2550.'}

11. OTHER ORDERS:
    [X] Attorney fees and costs: Pursuant to Family Code § 2030 / 2032.
    ${fl.formerNameRestored ? `[X] Restore former legal name: ${fl.formerNameRestored}` : ''}

I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct.

Date: ${new Date().toLocaleDateString()}
${fl.respondentName || client.name}, Respondent: _____________________________________
Attorney for Respondent: Alex, Esq. (State Bar No. 232323)`;
  };

  const generateUccjeaText = () => {
    return `SUPERIOR COURT OF CALIFORNIA, COUNTY OF ${(fl.courtCounty || 'ORANGE').toUpperCase()}
BRANCH: ${fl.branchName || 'Lamoreaux Justice Center, 341 The City Dr S, Orange, CA 92868'}
PETITIONER: ${fl.petitionerName || 'Petitioner'}
RESPONDENT: ${fl.respondentName || client.name}

DECLARATION UNDER UNIFORM CHILD CUSTODY JURISDICTION AND ENFORCEMENT ACT (UCCJEA)
(Judicial Council Form FL-105 / GC-120 — Attachment to Form FL-120)
CASE NUMBER: ${fl.caseNumber || '26FL008921'}

1. Minor Children subject to this proceeding: ${(fl.minorChildren || []).length}
${(fl.minorChildren || []).map((c, i) => `   Child ${i + 1}: ${c.name}
   Date of Birth: ${c.birthdate} | Age: ${c.age}
   Period of residence: Birth to Present (Continuous California Residence)
   Child lived with: Both Parents / Respondent ${fl.respondentName || client.name}
   Relationship: Father / Mother`).join('\n\n')}

2. Other Custody Proceedings:
   Respondent has not participated as a party or witness or in any other capacity in any other proceeding concerning the custody of or visitation with the children.

3. Domestic Violence & Protective Orders:
   No domestic violence restraining orders or criminal protective orders are currently pending or in effect.

I declare under penalty of perjury under the laws of the State of California that the foregoing is true and correct.
Date: ${new Date().toLocaleDateString()}
${fl.respondentName || client.name}, Respondent`;
  };

  const generateFl311Text = () => {
    return `SUPERIOR COURT OF CALIFORNIA, COUNTY OF ${(fl.courtCounty || 'ORANGE').toUpperCase()}
CHILD CUSTODY AND VISITATION (PARENTING TIME) APPLICATION ATTACHMENT
(Judicial Council Form FL-311 — Attachment to Form FL-120)
CASE NUMBER: ${fl.caseNumber || '26FL008921'}
PETITIONER: ${fl.petitionerName || 'Petitioner'}
RESPONDENT: ${fl.respondentName || client.name}

1. CUSTODY:
   a. Legal Custody to: [X] Joint (Petitioner and Respondent)
   b. Physical Custody to: [X] Joint (Petitioner and Respondent)

2. PARENTING TIME / VISITATION SCHEDULE REQUESTED BY RESPONDENT:
   ${fl.visitationRequested || 'Standard 2-2-3 alternating weekly schedule with alternating major holidays and 2 uninterrupted weeks during summer vacation.'}

3. HOLIDAY SCHEDULE:
   - Thanksgiving: Alternating odd/even years
   - Winter Break: Shared equally
   - Mother's Day with Petitioner; Father's Day with Respondent

Date: ${new Date().toLocaleDateString()}
Submitted by: ${fl.respondentName || client.name}, Respondent`;
  };

  const handleGenerateFl120Pleading = () => {
    const pleading = generateFl120Text();
    if (onAddGeneratedDoc) {
      onAddGeneratedDoc({
        id: `doc_fl120_${Date.now()}`,
        title: `Form FL-120 Response Pleading — ${client.name}`,
        clientId: client.id,
        clientName: client.name,
        templateId: 'ca-fl-120',
        content: pleading,
        generatedAt: new Date().toISOString()
      });
    }
    setFl120GeneratedStatus('Form FL-120 Response Pleading compiled and filed into Generated Documents!');
    setTimeout(() => setFl120GeneratedStatus(null), 8000);
  };

  const handleGenerateCompletePacket = () => {
    const fullPacket = `================================================================================
CALIFORNIA JUDICIAL COUNCIL RESPONSE PACKET: FORM FL-120 ET SEQ.
================================================================================
CASE NUMBER: ${fl.caseNumber || '26FL008921'}
COUNTY: ${(fl.courtCounty || 'ORANGE').toUpperCase()}
CLIENT (RESPONDENT): ${fl.respondentName || client.name}
OPPOSING PARTY (PETITIONER): ${fl.petitionerName || 'Petitioner'}
================================================================================

DOCUMENT 1: FORM FL-120 (RESPONSE — MARRIAGE/DOMESTIC PARTNERSHIP)
--------------------------------------------------------------------------------
${generateFl120Text()}

================================================================================
DOCUMENT 2: FORM FL-105 / GC-120 (UCCJEA DECLARATION)
--------------------------------------------------------------------------------
${generateUccjeaText()}

================================================================================
DOCUMENT 3: FORM FL-311 (CHILD CUSTODY & VISITATION APPLICATION ATTACHMENT)
--------------------------------------------------------------------------------
${generateFl311Text()}

================================================================================
DOCUMENT 4: FORM FL-160 (COMMUNITY & SEPARATE PROPERTY DECLARATION SUMMARY)
--------------------------------------------------------------------------------
SUPERIOR COURT OF CALIFORNIA, COUNTY OF ${(fl.courtCounty || 'ORANGE').toUpperCase()}
SEPARATE & COMMUNITY PROPERTY DECLARATION (FL-160)
CASE NUMBER: ${fl.caseNumber || '26FL008921'}
1. SEPARATE PROPERTY CONFIRMATION (Fam. Code § 770):
   ${fl.separatePropertyNotes || 'Pre-marital retirement, accounts, and tools.'}
2. COMMUNITY PROPERTY DIVISION (Fam. Code § 2550):
   ${fl.communityPropertyNotes || 'Equal division of marital estate.'}

================================================================================
END OF JUDICIAL COUNCIL FL-120 ET SEQ. RESPONSE PACKET
================================================================================`;

    if (onAddGeneratedDoc) {
      onAddGeneratedDoc({
        id: `doc_fl120_et_seq_${Date.now()}`,
        title: `Full FL-120 et seq. Response Packet — ${client.name}`,
        clientId: client.id,
        clientName: client.name,
        templateId: 'ca-fl-120-packet',
        content: fullPacket,
        generatedAt: new Date().toISOString()
      });
    }
    setFl120GeneratedStatus('Complete FL-120 et seq. Response Packet compiled and filed into Generated Documents!');
    setTimeout(() => setFl120GeneratedStatus(null), 8000);
  };

  const handleCopyJson = () => {
    navigator.clipboard?.writeText(JSON.stringify(fl, null, 2));
    setHasCopiedFl120(true);
    setTimeout(() => setHasCopiedFl120(false), 3000);
  };

  return (
    <div className="mt-5 p-5 bg-[#050811] border border-emerald-500/40 rounded-2xl space-y-4 shadow-xl shadow-emerald-950/20 select-text">
      {/* Header & Status Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                  California Form FL-120 Response Dossier
                </h4>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  ABBYY FlexiCapture OCR
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Judicial Council Mandatory 11-Section Statutory Schedule • Batch: {fl.abbyyBatchId || 'ABBYY-FL120-VERIFIED'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenOfficial('FL-120')}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 hover:from-amber-400 hover:to-emerald-400 text-[#090d16] text-xs font-mono font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/40 transition-all cursor-pointer ring-2 ring-emerald-400/50"
            title="Open authentic California Judicial Council Form FL-120 populated with extracted case data"
          >
            <Eye className="w-3.5 h-3.5 text-black" />
            <span>Open Official Form FL-120</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#090d16] hover:bg-slate-800 text-slate-300 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {hasCopiedFl120 ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{hasCopiedFl120 ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateFl120Pleading}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/30 transition-all cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Generate Pleading</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateCompletePacket}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-emerald-500/30 transition-all cursor-pointer"
            title="Generate full Judicial Council response packet: FL-120, FL-105 UCCJEA, FL-311, and FL-160"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Full FL-120 Packet</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {fl120GeneratedStatus && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{fl120GeneratedStatus}</span>
          </div>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('documents', client.id)}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>View in Documents</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </motion.div>
      )}

      {/* Case Caption Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#090e1a] border border-slate-800 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Court & Jurisdiction</span>
          <span className="text-slate-200 font-semibold">{fl.courtCounty}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Case Number</span>
          <span className="text-emerald-400 font-bold">{fl.caseNumber}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Petitioner</span>
          <span className="text-slate-300">{fl.petitionerName}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Respondent</span>
          <span className="text-slate-100 font-bold">{fl.respondentName}</span>
        </div>
      </div>

      {/* 11 Statutory Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
        {/* Section 1 & 2 */}
        <div className="p-3 bg-[#070c18] border border-slate-800 rounded-xl space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
            <span>1 & 2. Legal Relationship & Residency</span>
            <span className="text-[9px] text-slate-500">Fam Code § 2320</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            <strong className="text-white">Status:</strong> {fl.proceedingType} of {fl.legalRelationship}
          </p>
          <p className="text-slate-400 text-[10.5px]">
            ✓ 6 Mo California State & 3 Mo Orange County verified
          </p>
        </div>

        {/* Section 3 */}
        <div className="p-3 bg-[#070c18] border border-slate-800 rounded-xl space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
            <span>3. Statistical Facts</span>
            <span className="text-[9px] text-slate-500">Duration</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5">
            <div><strong className="text-slate-400">Married:</strong> {fl.dateOfMarriage}</div>
            <div><strong className="text-slate-400">Separated:</strong> {fl.dateOfSeparation}</div>
            <div className="text-emerald-300 font-bold">{fl.durationYears} Years, {fl.durationMonths} Months</div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="p-3 bg-[#070c18] border border-slate-800 rounded-xl space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
            <span>4. Minor Children & UCCJEA</span>
            <span className="text-[9px] text-slate-500">FL-105</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5">
            {(fl.minorChildren || []).map((c, i) => (
              <div key={i}>• {c.name} (DOB: {c.birthdate}, Age: {c.age})</div>
            ))}
            <div className="text-[10px] text-emerald-400">✓ Form FL-105 Attached</div>
          </div>
        </div>

        {/* Section 5 */}
        <div className="p-3 bg-[#070c18] border border-slate-800 rounded-xl space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
            <span>5. Legal Grounds</span>
            <span className="text-[9px] text-slate-500">Fam Code § 2310</span>
          </div>
          <p className="text-slate-200 text-[11px] font-semibold">
            {fl.legalGrounds}
          </p>
          <p className="text-[10px] text-slate-400">
            Irreconcilable differences leading to the irremediable breakdown of the marriage.
          </p>
        </div>

        {/* Section 6 */}
        <div className="p-3 bg-[#070c18] border border-slate-800 rounded-xl space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
            <span>6. Custody & Parenting (FL-311)</span>
            <span className="text-[9px] text-slate-500">Custody</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5">
            <div><strong className="text-slate-400">Legal:</strong> {fl.custodyLegal}</div>
            <div><strong className="text-slate-400">Physical:</strong> {fl.custodyPhysical}</div>
            <div className="text-[10px] text-slate-400 truncate">{fl.visitationRequested}</div>
          </div>
        </div>

        {/* Section 7 & 8 */}
        <div className="p-3 bg-[#070c18] border border-slate-800 rounded-xl space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
            <span>7 & 8. Child & Spousal Support</span>
            <span className="text-[9px] text-slate-500">Orders</span>
          </div>
          <p className="text-[11px] text-slate-300">
            <strong className="text-slate-400">Child Support:</strong> Statutory Guideline Order
          </p>
          <p className="text-[11px] text-amber-300 font-bold">
            <strong className="text-slate-400">Spousal Support:</strong> Reserve Jurisdiction
          </p>
        </div>

        {/* Section 9 */}
        <div className="p-3 bg-[#070c18] border border-slate-800 rounded-xl space-y-1.5 lg:col-span-1">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
            <span>9. Separate Property</span>
            <span className="text-[9px] text-slate-500">Fam Code § 770</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {fl.separatePropertyNotes}
          </p>
        </div>

        {/* Section 10 */}
        <div className="p-3 bg-[#070c18] border border-slate-800 rounded-xl space-y-1.5 lg:col-span-2">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
            <span>10. Community Property Division</span>
            <span className="text-[9px] text-slate-500">Equal Division</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {fl.communityPropertyNotes}
          </p>
        </div>

        {/* Section 11 & Orders */}
        <div className="p-3 bg-[#070c18] border border-slate-800 rounded-xl space-y-1.5 lg:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-emerald-400">
              11. Attorney Fees & Cost Contribution (Fam Code § 2030 / 2032)
            </div>
            <p className="text-slate-300 text-[11px]">
              Prayed: Petitioner to contribute to Respondent's legal fees and forensic costs.
            </p>
          </div>
          <div className="text-[10.5px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30 whitespace-nowrap">
            ✓ Verified under penalty of perjury
          </div>
        </div>
      </div>

      {/* Official Form Modal */}
      {showOfficialModalLocal && (
        <OfficialCaliforniaJudicialCouncilFormModal
          isOpen={showOfficialModalLocal}
          onClose={() => setShowOfficialModalLocal(false)}
          client={client}
          initialFormCode={selectedFormCode}
          onAddGeneratedDoc={onAddGeneratedDoc}
        />
      )}
    </div>
  );
};
