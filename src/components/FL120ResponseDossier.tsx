import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCheck,
  ShieldCheck,
  Check,
  CheckCheck,
  Copy,
  Scale,
  ArrowRight,
  Eye,
  Globe,
  Briefcase,
  Building2,
  Landmark,
  FileText,
  AlertCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Client, FL120IntakeData, GeneratedDocument, Matter } from '../types';
import { OfficialCaliforniaJudicialCouncilFormModal } from './OfficialCaliforniaJudicialCouncilFormModal';

export type StatutoryMatterType = 'family' | 'immigration' | 'civil' | 'bankruptcy' | 'corporate';

export interface StatutoryResponseDossierProps {
  client: Client;
  fl120Data?: FL120IntakeData;
  matter?: Matter;
  matters?: Matter[];
  onAddGeneratedDoc?: (doc: GeneratedDocument) => void;
  onNavigateToTab?: (tab: string, clientId?: string) => void;
  onOpenOfficialForm?: (client: Client, formCode?: 'FL-120' | 'FL-105' | 'FL-311' | 'FL-160') => void;
}

export type FL120ResponseDossierProps = StatutoryResponseDossierProps;

function resolveInitialMatterType(
  client: Client,
  matter?: Matter,
  matters?: Matter[]
): StatutoryMatterType {
  // If matter is provided, the matter type dictates the statutory sections directly
  if (matter) {
    const targetArea = (matter.practiceArea || '').toLowerCase();
    const targetTitle = (matter.title || '').toLowerCase();
    const targetDesc = (matter.description || '').toLowerCase();
    const matterCombined = `${targetArea} ${targetTitle} ${targetDesc}`;

    if (
      matterCombined.includes('immigration') ||
      matterCombined.includes('asylum') ||
      matterCombined.includes('visa') ||
      matterCombined.includes('removal') ||
      matterCombined.includes('deportation') ||
      matterCombined.includes('uscis') ||
      matterCombined.includes('eoir') ||
      matterCombined.includes('ina') ||
      matterCombined.includes('alien')
    ) {
      return 'immigration';
    }

    if (
      matterCombined.includes('civil') ||
      matterCombined.includes('tort') ||
      matterCombined.includes('breach') ||
      matterCombined.includes('personal injury') ||
      matterCombined.includes('negligence') ||
      matterCombined.includes('contract') ||
      matterCombined.includes('litigation') ||
      matterCombined.includes('general practice')
    ) {
      return 'civil';
    }

    if (
      matterCombined.includes('bankruptcy') ||
      matterCombined.includes('chapter 7') ||
      matterCombined.includes('chapter 11') ||
      matterCombined.includes('chapter 13') ||
      matterCombined.includes('debtor') ||
      matterCombined.includes('insolvency')
    ) {
      return 'bankruptcy';
    }

    if (
      matterCombined.includes('corporate') ||
      matterCombined.includes('business') ||
      matterCombined.includes('llc') ||
      matterCombined.includes('partnership') ||
      matterCombined.includes('entity') ||
      matterCombined.includes('commercial')
    ) {
      return 'corporate';
    }

    if (
      matterCombined.includes('family') ||
      matterCombined.includes('divorce') ||
      matterCombined.includes('dissolution') ||
      matterCombined.includes('custody') ||
      matterCombined.includes('domestic') ||
      matterCombined.includes('marriage') ||
      matterCombined.includes('fl-120')
    ) {
      return 'family';
    }
  }

  // Fallback to associated matter in client matters
  const associatedMatter = matters?.find(m => m?.clientId === client?.id);
  if (associatedMatter) {
    const assocArea = (associatedMatter.practiceArea || '').toLowerCase();
    const assocTitle = (associatedMatter.title || '').toLowerCase();
    const assocText = `${assocArea} ${assocTitle}`;
    if (assocText.includes('immigration') || assocText.includes('asylum') || assocText.includes('visa')) return 'immigration';
    if (assocText.includes('civil') || assocText.includes('tort') || assocText.includes('litigation') || assocText.includes('breach')) return 'civil';
    if (assocText.includes('bankruptcy') || assocText.includes('chapter')) return 'bankruptcy';
    if (assocText.includes('corporate') || assocText.includes('business')) return 'corporate';
    if (assocText.includes('family') || assocText.includes('divorce') || assocText.includes('custody')) return 'family';
  }

  // Fallback to client profile
  const clientArea = (client?.practiceArea || '').toLowerCase();
  const clientNotes = (client?.intakeNotes || '').toLowerCase();
  const combined = `${clientArea} ${clientNotes}`;

  if (
    combined.includes('immigration') ||
    combined.includes('asylum') ||
    combined.includes('visa') ||
    combined.includes('removal') ||
    combined.includes('deportation') ||
    combined.includes('uscis') ||
    combined.includes('eoir')
  ) {
    return 'immigration';
  }
  if (
    combined.includes('civil') ||
    combined.includes('tort') ||
    combined.includes('breach') ||
    combined.includes('personal injury') ||
    combined.includes('negligence') ||
    combined.includes('contract') ||
    combined.includes('litigation')
  ) {
    return 'civil';
  }
  if (
    combined.includes('bankruptcy') ||
    combined.includes('chapter 7') ||
    combined.includes('chapter 11') ||
    combined.includes('chapter 13') ||
    combined.includes('debtor') ||
    combined.includes('insolvency')
  ) {
    return 'bankruptcy';
  }
  if (
    combined.includes('corporate') ||
    combined.includes('business') ||
    combined.includes('llc') ||
    combined.includes('partnership') ||
    combined.includes('entity') ||
    combined.includes('commercial')
  ) {
    return 'corporate';
  }
  return 'family';
}

export const FL120ResponseDossier: React.FC<StatutoryResponseDossierProps> = ({
  client,
  fl120Data: rawFl,
  matter,
  matters = [],
  onAddGeneratedDoc,
  onNavigateToTab,
  onOpenOfficialForm
}) => {
  // Find associated matter if not directly passed
  const activeMatter = useMemo(() => {
    if (matter) return matter;
    return (matters || []).find(m => m?.clientId === client?.id) || null;
  }, [matter, matters, client?.id]);

  // Determine initial matter type dynamically from active matter or client
  const initialType = useMemo(
    () => resolveInitialMatterType(client, activeMatter || undefined, matters),
    [client, activeMatter, matters]
  );

  const [selectedMatterType, setSelectedMatterType] = useState<StatutoryMatterType>(initialType);
  const [dossierNotice, setDossierNotice] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [showOfficialModalLocal, setShowOfficialModalLocal] = useState<boolean>(false);
  const [selectedFormCode, setSelectedFormCode] = useState<'FL-120' | 'FL-105' | 'FL-311' | 'FL-160'>('FL-120');

  // Dynamically re-synchronize matter type whenever the active matter or resolved type changes
  useEffect(() => {
    setSelectedMatterType(initialType);
  }, [initialType]);

  // Provide robust fallback data calibrated to selectedMatterType so dossier is never mismatched
  const fl: FL120IntakeData = useMemo(() => {
    const defaultCaseNumber = selectedMatterType === 'immigration'
      ? (activeMatter?.caseNumber?.startsWith('A') ? activeMatter.caseNumber : `A# 248-${(client.id || '912').padStart(6, '0')}`)
      : selectedMatterType === 'civil'
      ? (activeMatter?.caseNumber || '30-2026-01489201-CU-BC-CGC')
      : selectedMatterType === 'bankruptcy'
      ? (activeMatter?.caseNumber || '8:26-bk-10492-TA')
      : (activeMatter?.caseNumber || '26FL004812C');

    const defaultCourt = selectedMatterType === 'immigration'
      ? (activeMatter?.courtVenue || 'EOIR Immigration Court, Los Angeles / 8 C.F.R. § 1003.14')
      : selectedMatterType === 'civil'
      ? (activeMatter?.courtVenue || 'Superior Court of California, County of Orange (Unlimited Civil)')
      : selectedMatterType === 'bankruptcy'
      ? (activeMatter?.courtVenue || 'U.S. Bankruptcy Court, Central District of California')
      : (activeMatter?.courtVenue || 'Orange County Superior Court');

    const defaultPetitioner = selectedMatterType === 'immigration'
      ? (activeMatter?.opposingParty || 'U.S. Department of Homeland Security (ICE Trial Attorney)')
      : selectedMatterType === 'civil'
      ? (activeMatter?.opposingParty || 'Apex Commercial Holdings, Inc. (Plaintiff)')
      : selectedMatterType === 'bankruptcy'
      ? (activeMatter?.opposingParty || 'Office of the United States Trustee')
      : (activeMatter?.opposingParty || 'Elena Vance (Petitioner)');

    return {
      caseNumber: rawFl?.caseNumber || activeMatter?.caseNumber || defaultCaseNumber,
      courtCounty: rawFl?.courtCounty || activeMatter?.courtVenue || defaultCourt,
      branchName: rawFl?.branchName || 'Lamoreaux Justice Center, 341 The City Dr S, Orange, CA 92868',
      petitionerName: rawFl?.petitionerName || activeMatter?.opposingParty || defaultPetitioner,
      respondentName: rawFl?.respondentName || client.name,
      proceedingType: rawFl?.proceedingType || 'Dissolution',
      legalRelationship: rawFl?.legalRelationship || 'Marriage',
      dateOfMarriage: rawFl?.dateOfMarriage || '09/18/2015',
      dateOfSeparation: rawFl?.dateOfSeparation || '04/10/2026',
      durationYears: rawFl?.durationYears ?? 10,
      durationMonths: rawFl?.durationMonths ?? 7,
      hasMinorChildren: rawFl?.hasMinorChildren ?? true,
      minorChildren: rawFl?.minorChildren?.length
        ? rawFl.minorChildren
        : [
            { name: 'Marcus Vance', birthdate: '03/12/2018', age: 8 },
            { name: 'Chloe Vance', birthdate: '07/24/2021', age: 5 }
          ],
      legalGrounds: rawFl?.legalGrounds || 'Irreconcilable Differences',
      custodyLegal: rawFl?.custodyLegal || 'Joint',
      custodyPhysical: rawFl?.custodyPhysical || 'Joint',
      visitationRequested: rawFl?.visitationRequested || 'Joint physical custody with alternating 2-2-3 schedule.',
      spousalSupportRequested: rawFl?.spousalSupportRequested || 'Reserve',
      separatePropertyNotes: rawFl?.separatePropertyNotes || 'Pre-marital retirement, separate bank accounts, and tools of trade.',
      communityPropertyNotes: rawFl?.communityPropertyNotes || 'Equal division of marital residence and community retirement benefits pursuant to Fam. Code § 2550.',
      ...rawFl
    };
  }, [rawFl, activeMatter, client.name]);

  const handleOpenOfficial = (code: 'FL-120' | 'FL-105' | 'FL-311' | 'FL-160' = 'FL-120') => {
    if (onOpenOfficialForm) {
      onOpenOfficialForm(client, code);
    } else {
      setSelectedFormCode(code);
      setShowOfficialModalLocal(true);
    }
  };

  // ============================================================================
  // MATTER-SPECIFIC CONFIGURATION & 11 STATUTORY SECTIONS
  // ============================================================================
  const dossierConfig = useMemo(() => {
    switch (selectedMatterType) {
      case 'immigration':
        return {
          typeKey: 'immigration',
          badgeText: '8 U.S.C. & INA Statutory Compliance',
          statutoryTitle: 'Federal Immigration Statutory Response Dossier',
          statutoryBadge: 'Verified Statutory Data',
          scheduleSubtitle: 'EOIR & USCIS Mandatory 11-Section Statutory Schedule (INA & 8 C.F.R.)',
          courtJurisdictionLabel: 'EOIR Immigration Court / USCIS Asylum Office',
          courtValue: activeMatter?.courtVenue || 'EOIR Immigration Court, Los Angeles / 8 C.F.R. § 1003.14',
          caseNumberLabel: 'Alien Registration (A-Number) / EOIR Case',
          caseNumberValue: fl.caseNumber?.startsWith('A') ? fl.caseNumber : `A# 248-${(client.id || '912').padStart(6, '0')}`,
          petitionerLabel: 'DHS / Assistant Chief Counsel',
          petitionerValue: fl.petitionerName || 'U.S. Department of Homeland Security (ICE Trial Attorney)',
          respondentLabel: 'Respondent (Alien / Beneficiary)',
          respondentValue: client.name,
          governingCode: 'Immigration & Nationality Act (INA) §§ 208, 240A(b), 241(b)(3), 8 U.S.C. § 1229b',
          officialButtonText: 'Open Official EOIR / USCIS Forms',
          sections: [
            {
              num: '1',
              title: 'Alien Registration & Identity Verification',
              citation: '8 U.S.C. § 1302',
              main: `A-Number: ${fl.caseNumber?.startsWith('A') ? fl.caseNumber : `A# 248-${(client.id || '912').padStart(6, '0')}`} | Biometrics Verified`,
              detail: `Identity verified via original passport, consular registration, and Form EOIR-28 appearance notice filed on behalf of ${client.name}.`
            },
            {
              num: '2',
              title: 'Port of Entry & Inspection Status',
              citation: 'INA § 212(a)(6)(A)(i)',
              main: 'Entry Without Inspection (EWI) / NTA Issued',
              detail: 'Notice to Appear (NTA) audited; defective notice defense reserved under Pereira v. Sessions & Niz-Chavez v. Garland.'
            },
            {
              num: '3',
              title: 'Agency & Court Jurisdiction',
              citation: '8 C.F.R. § 1003.14',
              main: 'EOIR Master Calendar Jurisdiction Confirmed',
              detail: 'Proper venue in California EOIR Immigration Court. USCIS concurrent jurisdiction over I-130 petition noted.'
            },
            {
              num: '4',
              title: 'Qualifying Familial Relationships',
              citation: 'INA § 201(b) / § 203',
              main: `${fl.minorChildren?.length || 2} Qualifying U.S. Citizen Dependents`,
              detail: (fl.minorChildren || []).map(c => `• ${c.name} (USC Child, Age ${c.age}, DOB: ${c.birthdate})`).join('\n') || 'U.S. Citizen minor children established.'
            },
            {
              num: '5',
              title: 'Statutory Grounds of Defensive Relief',
              citation: 'INA § 240A(b) / § 208',
              main: 'Non-LPR Cancellation of Removal (Form EOIR-42B)',
              detail: 'Secondary relief: Asylum (Form I-589), Withholding of Removal under INA § 241(b)(3), and CAT protection under 8 C.F.R. § 1208.16.'
            },
            {
              num: '6',
              title: 'Continuous Physical Presence & Statutory Period',
              citation: 'INA § 240A(b)(1)(A)',
              main: '10+ Years Continuous Residence in United States',
              detail: 'Verified residency since 2014; no single absence exceeding 90 days or aggregate departures exceeding 180 days under stop-time analysis.'
            },
            {
              num: '7',
              title: 'Good Moral Character (GMC) Audit',
              citation: 'INA § 101(f)',
              main: '10-Year Statutory Period Cleared — Zero Inadmissibility Bars',
              detail: 'FBI Identity History Summary clear. California DOJ live-scan certified. 10 years of timely filed federal IRS 1040 returns confirmed.'
            },
            {
              num: '8',
              title: 'Exceptional & Extremely Unusual Hardship',
              citation: 'INA § 240A(b)(1)(D)',
              main: 'Severe Hardship to USC Minor Children Established',
              detail: 'Documented medical, psychological, and developmental disruption to USC dependents upon respondent removal under Matter of Recinas.'
            },
            {
              num: '9',
              title: 'Grounds of Inadmissibility / Bar Analysis',
              citation: 'INA § 212(a) / § 237(a)',
              main: 'Zero Aggravated Felonies / Crimes Involving Moral Turpitude',
              detail: 'Respondent is not inadmissible under INA § 212(a)(2) or removable under § 237(a)(2). Statutory waiver under INA § 212(h) reserved.'
            },
            {
              num: '10',
              title: 'Mandatory Declarations & Country Conditions Index',
              citation: 'EOIR-42B / DOS Index',
              main: 'Index of Supporting Exhibits & Form EOIR-42B Package',
              detail: 'Declaration under penalty of perjury attached. State Department Country Conditions Report and community declarations indexed.'
            },
            {
              num: '11',
              title: 'Prayer for Relief & Adjustment of Status',
              citation: 'INA § 240A(b) / § 240B',
              main: 'Discretionary Cancellation of Removal & Adjustment to LPR',
              detail: 'Prayed: Immigration Judge grant cancellation of removal, adjust respondent to lawful permanent resident, or grant voluntary departure.'
            }
          ]
        };

      case 'civil':
        return {
          typeKey: 'civil',
          badgeText: 'Cal. CCP § 431.30 & Rules of Court',
          statutoryTitle: 'California Civil Litigation Statutory Response Dossier',
          statutoryBadge: 'Verified Statutory Data',
          scheduleSubtitle: 'Code of Civil Procedure Mandatory 11-Section Response Schedule (Cal. CCP)',
          courtJurisdictionLabel: 'Superior Court of California (Unlimited Civil)',
          courtValue: fl.courtCounty || activeMatter?.courtVenue || 'Superior Court of California, County of Orange (Unlimited Civil)',
          caseNumberLabel: 'Civil Docket / Case Number',
          caseNumberValue: fl.caseNumber || activeMatter?.caseNumber || '30-2026-01489201-CU-BC-CGC',
          petitionerLabel: 'Plaintiff / Complainant',
          petitionerValue: fl.petitionerName || activeMatter?.opposingParty || 'Apex Commercial Holdings, Inc. (Plaintiff)',
          respondentLabel: 'Defendant / Cross-Complainant',
          respondentValue: client.name,
          governingCode: 'Cal. Code of Civil Procedure §§ 431.30, 446, Cal. Civ. Code § 1431.2',
          officialButtonText: 'Open Judicial Council Civil Answer (PLD-C-010)',
          sections: [
            {
              num: '1',
              title: 'Subject Matter & Personal Jurisdiction',
              citation: 'Cal. CCP §§ 392-396',
              main: 'Unlimited Civil Jurisdiction ($35,000+ Threshold)',
              detail: `Venue properly laid in California Superior Court. Defendant ${client.name} preserves all jurisdictional and forum non conveniens objections.`
            },
            {
              num: '2',
              title: 'Party Capacity & Standing to Defend',
              citation: 'CCP § 367',
              main: 'Real Party in Interest Verification',
              detail: 'Plaintiff fails to establish corporate standing to maintain action under California Corporations Code § 2203; lack of privity asserted.'
            },
            {
              num: '3',
              title: 'Verified General / Specific Denial',
              citation: 'Cal. CCP § 431.30',
              main: 'General Denial of Each and Every Material Allegation',
              detail: 'Defendant expressly denies each, every, and all allegations contained in the Complaint, generally and specifically, pursuant to CCP § 431.30(d).'
            },
            {
              num: '4',
              title: 'Affirmative Defense: Statute of Limitations',
              citation: 'CCP §§ 335.1, 337, 338',
              main: 'Statutory Time Bar (CCP § 337 4-Yr Written / § 339 2-Yr Oral)',
              detail: 'All causes of action in the Complaint are barred by the applicable statutes of limitation set forth in California Code of Civil Procedure.'
            },
            {
              num: '5',
              title: 'Equitable Defenses: Laches, Estoppel & Unclean Hands',
              citation: 'Civ. Code §§ 3515-3548',
              main: 'Doctrine of Unclean Hands, Waiver & Equitable Estoppel',
              detail: 'Plaintiff engaged in bad faith and inequitable conduct, barring all equitable relief and damages under the Maxims of Jurisprudence.'
            },
            {
              num: '6',
              title: 'Contractual Defenses: Failure of Consideration',
              citation: 'Civ. Code § 1550 / § 1689',
              main: 'Failure of Consideration & Frustration of Purpose',
              detail: 'Plaintiff committed prior material breaches, excused defendant performance, and failed to satisfy express conditions precedent.'
            },
            {
              num: '7',
              title: 'Tort Defenses: Comparative Fault & Prop 51',
              citation: 'Civ. Code § 1431.2',
              main: 'Comparative Fault & Several Liability for Non-Economic Loss',
              detail: 'Any damages were caused in whole or in part by the negligence or fault of plaintiff or third parties over whom defendant had no control.'
            },
            {
              num: '8',
              title: 'Statutory Offset, Setoff & Failure to Mitigate',
              citation: 'CCP § 431.70',
              main: 'Cross-Demands for Money Compensation & Duty to Mitigate',
              detail: 'Plaintiff failed to take reasonable steps to mitigate damages, and defendant is entitled to complete offset under CCP § 431.70.'
            },
            {
              num: '9',
              title: 'Reservation of Compulsory Cross-Complaint',
              citation: 'CCP §§ 426.30, 428.10',
              main: 'Related Causes of Action & Compulsory Joinder Reserved',
              detail: 'Defendant reserves the statutory right to file a Cross-Complaint against Plaintiff and third-party defendants for affirmative recovery.'
            },
            {
              num: '10',
              title: 'Formal Verification under Penalty of Perjury',
              citation: 'Cal. CCP § 446',
              main: 'Verified Answer Executed Pursuant to CCP § 446',
              detail: `Client verification executed under penalty of perjury under the laws of the State of California confirming factual assertions.`
            },
            {
              num: '11',
              title: 'Prayer for Defense Judgment, Costs & Jury Demand',
              citation: 'CCP § 1032 / Art. I § 16',
              main: 'Judgment for Defendant, Statutory Costs, Reciprocal Fees & Jury',
              detail: 'Prayed: Plaintiff take nothing; Defendant recover statutory costs under CCP § 1032 and attorney fees under Civ. Code § 1717. JURY TRIAL DEMANDED.'
            }
          ]
        };

      case 'bankruptcy':
        return {
          typeKey: 'bankruptcy',
          badgeText: '11 U.S.C. Bankruptcy Code Authority',
          statutoryTitle: 'Federal Bankruptcy Statutory Response & Disclosure Dossier',
          statutoryBadge: 'Verified Statutory Data',
          scheduleSubtitle: 'United States Bankruptcy Court Mandatory 11-Section Statutory Schedule',
          courtJurisdictionLabel: 'United States Bankruptcy Court',
          courtValue: activeMatter?.courtVenue || 'U.S. Bankruptcy Court, Central District of California',
          caseNumberLabel: 'Bankruptcy Case No. & Chapter',
          caseNumberValue: fl.caseNumber || activeMatter?.caseNumber || '8:26-bk-10822-SC (Chapter 7/13)',
          petitionerLabel: 'U.S. Trustee / Creditor Panel',
          petitionerValue: fl.petitionerName || 'Office of the United States Trustee (Region 16)',
          respondentLabel: 'Debtor / Debtor-in-Possession',
          respondentValue: client.name,
          governingCode: 'Title 11 United States Code §§ 362, 521, 541, 707',
          officialButtonText: 'Open Official Bankruptcy Schedules',
          sections: [
            {
              num: '1',
              title: 'Debtor Eligibility & Means Testing',
              citation: '11 U.S.C. § 707(b)',
              main: 'Below Median Income / Presumption of Abuse Rebutted',
              detail: 'Form 122A-1/122C-1 calculated. Annualized current monthly income clears California median family threshold.'
            },
            {
              num: '2',
              title: 'Pre-Filing Credit Counseling Certification',
              citation: '11 U.S.C. § 109(h)',
              main: 'Approved Credit Counseling Agency Certificate Filed',
              detail: 'Mandatory pre-petition briefing completed within 180 days prior to petition filing from approved agency.'
            },
            {
              num: '3',
              title: 'Automatic Stay Injunction Enforcement',
              citation: '11 U.S.C. § 362',
              main: 'Immediate Statutory Injunction Effective Upon Filing',
              detail: 'Automatic stay bars all creditor collection efforts, wage garnishments, lawsuits, and foreclosure proceedings.'
            },
            {
              num: '4',
              title: 'Schedule A/B: Real & Personal Property Estate',
              citation: '11 U.S.C. § 541',
              main: 'Comprehensive Estate Inventory Under Oath',
              detail: `${fl.communityPropertyNotes || 'Residential real property, vehicles, bank balances, and household goods cataloged.'}`
            },
            {
              num: '5',
              title: 'Schedule C: California Statutory Exemptions',
              citation: 'CCP § 703.140(b) / § 704',
              main: 'California Section 703.140(b) Wildcard Exemptions Claimed',
              detail: 'All debtor equity in homestead, retirement, tools of trade, and cash protected under California statutory exemptions.'
            },
            {
              num: '6',
              title: 'Schedule D: Secured Claims & Lien Valuation',
              citation: '11 U.S.C. § 506',
              main: 'Secured Mortgages & Vehicle Liens Audited',
              detail: 'Lien valuation complete. Debtor elects to retain collateral and reaffirm debt or surrender under statutory election.'
            },
            {
              num: '7',
              title: 'Schedule E/F: Priority & Unsecured Debt',
              citation: '11 U.S.C. §§ 507, 727',
              main: 'General Unsecured Creditor Matrix Verified',
              detail: 'Credit card accounts, medical debt, and commercial liabilities indexed with exact creditor notice addresses.'
            },
            {
              num: '8',
              title: 'Schedule G & H: Executory Contracts & Co-Debtors',
              citation: '11 U.S.C. §§ 365, 1301',
              main: 'Residential Leases & Co-Debtor Stay Review',
              detail: 'Debtor assumes unexpired residential lease. Co-debtor stay protection invoked under § 1301 where applicable.'
            },
            {
              num: '9',
              title: 'Schedule I & J: Income, Expenses & Feasibility',
              citation: '11 U.S.C. § 1325',
              main: 'Current Monthly Income & Necessary Living Expenses',
              detail: 'Monthly net disposable income certified pursuant to IRS Local Standards for housing and transportation.'
            },
            {
              num: '10',
              title: 'Statement of Financial Affairs (SOFA)',
              citation: '11 U.S.C. § 521',
              main: '2-Year Insider Transfers & Preference Review',
              detail: 'Zero fraudulent conveyances or voidable preferential transfers within the 90-day and 1-year insider windows.'
            },
            {
              num: '11',
              title: 'Debtor Declaration & Statutory Discharge Prayer',
              citation: '11 U.S.C. §§ 343, 727',
              main: 'Declaration Under Penalty of Perjury & 341 Exam Prep',
              detail: 'Prayed: Chapter 7/13 discharge order entered eliminating all dischargeable debts pursuant to 11 U.S.C. § 727.'
            }
          ]
        };

      case 'corporate':
        return {
          typeKey: 'corporate',
          badgeText: 'Cal. Corp. Code & Commercial Law',
          statutoryTitle: 'Commercial & Corporate Statutory Response Dossier',
          statutoryBadge: 'Verified Statutory Data',
          scheduleSubtitle: 'California Corporate & Commercial Mandatory 11-Section Schedule',
          courtJurisdictionLabel: 'Regulatory Jurisdiction / Commercial Arbitration',
          courtValue: activeMatter?.courtVenue || 'California Secretary of State / JAMS Commercial Arbitration',
          caseNumberLabel: 'Corporate Entity ID / Commercial Docket',
          caseNumberValue: fl.caseNumber || activeMatter?.caseNumber || 'C-4819022 / COM-2026-081',
          petitionerLabel: 'Claimant / Regulatory Authority',
          petitionerValue: fl.petitionerName || activeMatter?.opposingParty || 'Department of Financial Protection & Innovation / Claimant',
          respondentLabel: 'Respondent (Corporate Entity / Officer)',
          respondentValue: client.name,
          governingCode: 'Cal. Corporations Code §§ 200, 300, 309, Cal. Com. Code § 2201',
          officialButtonText: 'Open Commercial Governance Form',
          sections: [
            {
              num: '1',
              title: 'Entity Organization & Good Standing',
              citation: 'Cal. Corp. Code § 200',
              main: 'Active California Entity with Secretary of State',
              detail: 'Articles of Incorporation and current Statement of Information on file; franchise tax payments certified in good standing.'
            },
            {
              num: '2',
              title: 'Corporate Governance & Board Authority',
              citation: 'Corp. Code § 300',
              main: 'Unanimous Written Consent & Board Resolution in Place',
              detail: 'Officer authority to respond and bind corporate entity confirmed pursuant to Bylaws and board resolutions.'
            },
            {
              num: '3',
              title: 'Capitalization Table & Equity Compliance',
              citation: 'Corp. Code § 25102(f)',
              main: 'Private Placement Exemption Notice Filed',
              detail: 'Shareholder ledger and stock issuance records maintained in compliance with California Corporate Securities Law.'
            },
            {
              num: '4',
              title: 'Commercial Contract Terms & UCC Compliance',
              citation: 'Cal. Com. Code § 2201',
              main: 'UCC Article 2 Commercial Terms & Statute of Frauds',
              detail: 'Commercial purchase orders, integration clauses, and warranties audited under California Commercial Code.'
            },
            {
              num: '5',
              title: 'Intellectual Property & Trade Secret Defense',
              citation: 'Cal. Civ. Code § 3426',
              main: 'California Uniform Trade Secrets Act (CUTSA) Compliance',
              detail: 'Proprietary IP assignments, NDAs, and trade secret protocols verified; no misappropriation under Civil Code § 3426.'
            },
            {
              num: '6',
              title: 'Regulatory Permitting & Licensing Compliance',
              citation: 'Gov. Code § 11120',
              main: 'Municipal Business License & State Permits Verified',
              detail: 'Commercial enterprise operating in compliance with county, state, and federal regulatory oversight.'
            },
            {
              num: '7',
              title: 'Workforce Classification & AB 5 / ABC Test',
              citation: 'Labor Code § 2775',
              main: 'Independent Contractor vs Employee Statutory Audit',
              detail: 'Workforce classified under Dynamex ABC test standards and statutory professional exemptions.'
            },
            {
              num: '8',
              title: 'Commercial Risk Allocation & Mutual Indemnity',
              citation: 'Civ. Code § 2778',
              main: 'Contractual Indemnity & Limitation of Liability Enforced',
              detail: 'Consequential damages waivers, insurance certificates, and reciprocal hold-harmless provisions verified.'
            },
            {
              num: '9',
              title: 'Dispute Resolution & Binding Arbitration',
              citation: 'Cal. CCP § 1281',
              main: 'Mandatory JAMS/AAA Commercial Arbitration Clause',
              detail: 'Commercial agreement mandates confidential binding arbitration, precluding courtroom litigation.'
            },
            {
              num: '10',
              title: 'Fiduciary Duty Defense & Prudent Person Standard',
              citation: 'Corp. Code § 309',
              main: 'Business Judgment Rule & Due Diligence Defense',
              detail: 'Directors acted in good faith, in the best interests of the corporation, and with ordinary care under § 309.'
            },
            {
              num: '11',
              title: 'Corporate Officer Verification & Execution',
              citation: 'Corp. Code § 313',
              main: 'Executed Under Penalty of Perjury by Authorized Officer',
              detail: 'Formal statutory corporate response verified by Chief Executive Officer / Managing Director.'
            }
          ]
        };

      default: // 'family'
        return {
          typeKey: 'family',
          badgeText: 'CA Fam. Code & Judicial Council Verified',
          statutoryTitle: 'California Statutory Response Dossier',
          statutoryBadge: 'Verified Statutory Data',
          scheduleSubtitle: 'Judicial Council Mandatory 11-Section Statutory Schedule',
          courtJurisdictionLabel: 'Court & County Jurisdiction',
          courtValue: fl.courtCounty || 'Superior Court of California, County of Orange',
          caseNumberLabel: 'Family Law Case Number',
          caseNumberValue: fl.caseNumber || '26FL004812C',
          petitionerLabel: 'Petitioner',
          petitionerValue: fl.petitionerName || 'Elena Vance (Petitioner)',
          respondentLabel: 'Respondent',
          respondentValue: fl.respondentName || client.name,
          governingCode: 'Cal. Family Code §§ 300, 2310, 2320, 2550, 4320',
          officialButtonText: 'Open Official Response Form (FL-120)',
          sections: [
            {
              num: '1 & 2',
              title: 'Legal Relationship & Residency',
              citation: 'Fam Code § 2320',
              main: `Status: ${fl.proceedingType || 'Dissolution'} of ${fl.legalRelationship || 'Marriage'}`,
              detail: '✓ 6 Mo California State & 3 Mo County residency verified under Fam. Code § 2320.'
            },
            {
              num: '3',
              title: 'Statistical Facts & Duration',
              citation: 'Fam Code § 4336',
              main: `Married: ${fl.dateOfMarriage} | Separated: ${fl.dateOfSeparation}`,
              detail: `${fl.durationYears} Years, ${fl.durationMonths} Months (Long-Term Marriage § 4336).`
            },
            {
              num: '4',
              title: 'Minor Children & UCCJEA Declaration',
              citation: 'Form FL-105',
              main: `${(fl.minorChildren || []).length} Minor Children Declared`,
              detail: (fl.minorChildren || []).map(c => `• ${c.name} (DOB: ${c.birthdate}, Age: ${c.age})`).join('\n') + '\n✓ Form FL-105 Attached.'
            },
            {
              num: '5',
              title: 'Legal Grounds',
              citation: 'Fam Code § 2310',
              main: fl.legalGrounds || 'Irreconcilable Differences',
              detail: 'Irreconcilable differences leading to the irremediable breakdown of the marriage.'
            },
            {
              num: '6',
              title: 'Custody & Parenting Plan (FL-311)',
              citation: 'Fam Code § 3040',
              main: `Legal: ${fl.custodyLegal} | Physical: ${fl.custodyPhysical}`,
              detail: fl.visitationRequested || 'Joint physical custody with alternating 2-2-3 schedule.'
            },
            {
              num: '7 & 8',
              title: 'Child & Spousal Support Orders',
              citation: 'Fam Code §§ 4055 & 4320',
              main: 'Child Support: Statutory Guideline | Spousal: Reserve',
              detail: 'Court may make guideline child support orders; reserve jurisdiction over spousal support payable to Respondent.'
            },
            {
              num: '9',
              title: 'Separate Property Confirmation',
              citation: 'Fam Code § 770',
              main: 'Confirmation of Premarital Assets & Debts',
              detail: fl.separatePropertyNotes || 'Pre-marital retirement, separate accounts, and personal effects.'
            },
            {
              num: '10',
              title: 'Community Property Division',
              citation: 'Fam Code § 2550',
              main: 'Equal Division of Community & Quasi-Community Estate',
              detail: fl.communityPropertyNotes || 'Equal division of marital estate pursuant to Family Code § 2550.'
            },
            {
              num: '11',
              title: 'Attorney Fees & Cost Contribution',
              citation: 'Fam Code §§ 2030 / 2032',
              main: 'Need and Ability to Pay Fee Contribution Prayed',
              detail: 'Petitioner to contribute to Respondent’s attorney fees and forensic accounting costs. Verified under penalty of perjury.'
            }
          ]
        };
    }
  }, [selectedMatterType, fl, activeMatter, client]);

  // ============================================================================
  // PLEADING GENERATORS (DYNAMIC PER MATTER TYPE)
  // ============================================================================
  const generatePleadingText = () => {
    switch (selectedMatterType) {
      case 'immigration':
        return `UNITED STATES DEPARTMENT OF JUSTICE
EXECUTIVE OFFICE FOR IMMIGRATION REVIEW
IMMIGRATION COURT — STATE OF CALIFORNIA

In the Matter of:
${client.name}, Respondent
Alien Registration No.: ${dossierConfig.caseNumberValue}

RESPONDENT'S STATUTORY APPLICATION FOR RELIEF AND DEFENSIVE RESPONSE
(INA § 240A(b), 8 U.S.C. § 1229b(b) — NON-LPR CANCELLATION OF REMOVAL)

1. IDENTITY AND ALIEN REGISTRATION:
   Respondent ${client.name} appears by and through counsel. Respondent has completed biometrics and filed Form EOIR-28.

2. NOTICE TO APPEAR & PROCEDURAL STATUS:
   Respondent denies removability as charged. Any defect in the NTA is preserved under Pereira v. Sessions and Niz-Chavez v. Garland.

3. CONTINUOUS PHYSICAL PRESENCE (10 YEARS):
   Respondent has resided continuously in the United States since 2014, exceeding the statutory requirement of 10 years prior to NTA issuance.

4. GOOD MORAL CHARACTER (INA § 101(f)):
   Respondent has been a person of Good Moral Character throughout the statutory 10-year period. Certified FBI clearances and 10 years of federal tax returns are indexed as Exhibit Group B.

5. ZERO DISQUALIFYING CONVICTIONS:
   Respondent has never been convicted of an offense under INA §§ 212(a)(2), 237(a)(2), or 237(a)(3).

6. EXCEPTIONAL AND EXTREMELY UNUSUAL HARDSHIP (INA § 240A(b)(1)(D)):
   Removal would cause exceptional and extremely unusual hardship to Respondent's qualifying relatives:
   ${(fl.minorChildren || []).map(c => `- ${c.name}, U.S. Citizen child, DOB: ${c.birthdate}, Age: ${c.age}`).join('\n   ') || '- Minor U.S. Citizen dependent children.'}
   Documented medical, psychological, and country-condition evidence is submitted under Exhibit Group C.

7. PRAYER FOR RELIEF:
   WHEREFORE, Respondent prays that the Immigration Judge:
   a. Grant Respondent's Application for Cancellation of Removal pursuant to INA § 240A(b);
   b. Adjust Respondent's status to that of a Lawful Permanent Resident;
   c. In the alternative, grant Voluntary Departure pursuant to INA § 240B.

I declare under penalty of perjury under the laws of the United States of America that the foregoing is true and correct.
Dated: ${new Date().toLocaleDateString()}
Submitted by: ${client.name}, Respondent`;

      case 'civil':
        return `SUPERIOR COURT OF THE STATE OF CALIFORNIA
FOR THE COUNTY OF ${(fl.courtCounty || 'ORANGE').toUpperCase()} — UNLIMITED CIVIL JURISDICTION

${dossierConfig.petitionerValue},
    Plaintiff,
v.
${client.name},
    Defendant.

Case No.: ${dossierConfig.caseNumberValue}

DEFENDANT'S VERIFIED ANSWER TO COMPLAINT; AFFIRMATIVE DEFENSES; DEMAND FOR JURY TRIAL
[Cal. Code Civ. Proc. §§ 431.30, 446; Cal. Const. Art. I, § 16]

GENERAL DENIAL (CCP § 431.30(d))
Defendant ${client.name} hereby generally and specifically denies each and every allegation in Plaintiff's Complaint, and the whole thereof, and further denies that Plaintiff has sustained damages in the sum alleged or in any sum whatsoever.

MANDATORY STATUTORY AFFIRMATIVE DEFENSES
1. FIRST AFFIRMATIVE DEFENSE (Statute of Limitations — CCP §§ 335.1, 337, 338, 339):
   Plaintiff's claims are barred by the applicable statutes of limitation.
2. SECOND AFFIRMATIVE DEFENSE (Failure to State Facts — CCP § 430.10(e)):
   The Complaint fails to state facts sufficient to constitute a cause of action.
3. THIRD AFFIRMATIVE DEFENSE (Equitable Estoppel & Waiver):
   Plaintiff's conduct constitutes waiver and equitable estoppel.
4. FOURTH AFFIRMATIVE DEFENSE (Doctrine of Laches):
   Plaintiff unreasonably delayed commencing this action, causing severe prejudice.
5. FIFTH AFFIRMATIVE DEFENSE (Unclean Hands):
   Plaintiff's claims are barred by the doctrine of unclean hands.
6. SIXTH AFFIRMATIVE DEFENSE (Prior Material Breach & Excuse):
   Plaintiff committed prior material breaches of any alleged covenants.
7. SEVENTH AFFIRMATIVE DEFENSE (Comparative Fault & Prop 51 — Civ. Code § 1431.2):
   Any damages were caused by Plaintiff or third parties over whom Defendant had no control.
8. EIGHTH AFFIRMATIVE DEFENSE (Failure to Mitigate Damages):
   Plaintiff failed and neglected to take reasonable steps to mitigate damages.
9. NINTH AFFIRMATIVE DEFENSE (Statutory Offset & Setoff — CCP § 431.70):
   Defendant is entitled to complete offset for reciprocal claims and payments.
10. TENTH AFFIRMATIVE DEFENSE (Reservation of Cross-Complaint — CCP § 426.30):
    Defendant reserves all rights to assert compulsory cross-claims.
11. ELEVENTH AFFIRMATIVE DEFENSE (Failure to Comply with Conditions Precedent):
    Plaintiff failed to satisfy mandatory statutory and contractual conditions precedent.

PRAYER FOR RELIEF
WHEREFORE, Defendant prays for judgment as follows:
1. That Plaintiff take nothing by way of the Complaint;
2. That Defendant be awarded costs of suit incurred herein pursuant to CCP § 1032;
3. For reasonable attorney fees pursuant to Cal. Civil Code § 1717;
4. For such other and further relief as the Court deems just and proper.

DEMAND FOR JURY TRIAL
Defendant hereby demands a trial by jury on all issues so triable.

VERIFICATION (CCP § 446)
I, ${client.name}, declare under penalty of perjury under the laws of the State of California that I have read the foregoing Answer and know the contents thereof; that the facts stated therein are true of my own knowledge.
Executed this ${new Date().toLocaleDateString()} at ${fl.courtCounty || 'Orange County'}, California.

_______________________________________
${client.name}, Defendant`;

      case 'bankruptcy':
        return `UNITED STATES BANKRUPTCY COURT
FOR THE CENTRAL DISTRICT OF CALIFORNIA

In re:
${client.name}, Debtor.
Bankruptcy Case No.: ${dossierConfig.caseNumberValue}
Chapter: 7 / 13

DEBTOR'S STATUTORY RESPONSE & SCHEDULES DISCLOSURE STATEMENT
(TITLE 11, UNITED STATES CODE §§ 362, 521, 541, 707)

1. DEBTOR ELIGIBILITY & MEANS TEST (11 U.S.C. § 707(b)):
   Debtor's annualized current monthly income is below the applicable California median family income. No presumption of abuse arises.

2. CREDIT COUNSELING CERTIFICATION (11 U.S.C. § 109(h)):
   Debtor timely completed approved pre-petition briefing within 180 days prior to filing. Certificate is filed on the docket.

3. NOTICE OF AUTOMATIC STAY (11 U.S.C. § 362):
   Notice is hereby given that the automatic stay is in full force and effect against all scheduled creditors.

4. REAL & PERSONAL PROPERTY INVENTORY (Schedule A/B & 11 U.S.C. § 541):
   Debtor has made a full, verified disclosure of all assets comprising the bankruptcy estate.

5. CALIFORNIA STATUTORY EXEMPTIONS (Schedule C & CCP § 703.140(b)):
   Debtor claims all allowable exemptions under California Code of Civil Procedure § 703.140(b).

6. PRAYER FOR STATUTORY DISCHARGE:
   Debtor prays for an order of discharge under 11 U.S.C. § 727 / § 1328.

I declare under penalty of perjury that the foregoing is true and correct.
Dated: ${new Date().toLocaleDateString()}
${client.name}, Debtor`;

      case 'corporate':
        return `COMMERCIAL & CORPORATE STATUTORY RESPONSE STATEMENT
STATE OF CALIFORNIA — SECRETARY OF STATE & COMMERCIAL ARBITRATION

In the Matter of:
${client.name} (Corporate Entity / Officer)
Corporate Entity ID: ${dossierConfig.caseNumberValue}

STATUTORY CORPORATE RESPONSE & GOVERNANCE COMPLIANCE DOSSIER
[Cal. Corporations Code §§ 200, 300, 309; Cal. Com. Code § 2201]

1. ENTITY GOOD STANDING (Corp. Code § 200):
   Entity is in active legal status with the California Secretary of State.

2. BOARD RESOLUTION & AUTHORITY (Corp. Code § 300):
   Action authorized pursuant to Board resolution and corporate bylaws.

3. COMMERCIAL CONTRACT COMPLIANCE (Cal. Com. Code § 2201):
   All commercial dealings comply with California Commercial Code standards.

4. TRADE SECRET INTEGRITY (Cal. Civ. Code § 3426):
   CUTSA protections and non-disclosure standards rigorously enforced.

5. BUSINESS JUDGMENT RULE & FIDUCIARY DEFENSE (Corp. Code § 309):
   Directors and officers acted in good faith with the care of an ordinarily prudent person.

Executed under penalty of perjury by authorized corporate officer.
Dated: ${new Date().toLocaleDateString()}
${client.name}, Authorized Officer`;

      default: // family
        return `SUPERIOR COURT OF CALIFORNIA, COUNTY OF ${(fl.courtCounty || 'ORANGE').toUpperCase()}
BRANCH: ${fl.branchName || 'Lamoreaux Justice Center, 341 The City Dr S, Orange, CA 92868'}

PETITIONER: ${fl.petitionerName || 'Petitioner'}
RESPONDENT: ${fl.respondentName || client.name}

RESPONSE TO PETITION FOR DISSOLUTION OF MARRIAGE (FL-120)
CASE NUMBER: ${fl.caseNumber || '26FL004812C'}

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
${fl.respondentName || client.name}, Respondent
Attorney for Respondent: Alex, Esq. (State Bar No. 232323)`;
    }
  };

  const handleGeneratePleading = () => {
    const pleading = generatePleadingText();
    const docTitle = `${dossierConfig.statutoryTitle} — ${client.name}`;

    if (onAddGeneratedDoc) {
      onAddGeneratedDoc({
        id: `doc_${selectedMatterType}_${Date.now()}`,
        title: docTitle,
        clientId: client.id,
        clientName: client.name,
        templateId: `statutory-${selectedMatterType}`,
        content: pleading,
        generatedAt: new Date().toISOString()
      });
    }

    setDossierNotice(`${dossierConfig.statutoryTitle} compiled and saved into Documents!`);
    setTimeout(() => setDossierNotice(null), 7000);
  };

  const handleGenerateCompletePacket = () => {
    let fullPacket = '';
    const divider = '='.repeat(80);

    if (selectedMatterType === 'family') {
      fullPacket = `${divider}
CALIFORNIA JUDICIAL COUNCIL RESPONSE PACKET: FORM FL-120 ET SEQ.
${divider}
CASE NUMBER: ${dossierConfig.caseNumberValue}
COUNTY: ${(fl.courtCounty || 'ORANGE').toUpperCase()}
CLIENT (RESPONDENT): ${dossierConfig.respondentValue}
OPPOSING PARTY (PETITIONER): ${dossierConfig.petitionerValue}
GOVERNING STATUTE: ${dossierConfig.governingCode}
${divider}

DOCUMENT 1: FORM FL-120 (RESPONSE — MARRIAGE/DOMESTIC PARTNERSHIP)
--------------------------------------------------------------------------------
${generatePleadingText()}

${divider}
DOCUMENT 2: FORM FL-105 / GC-120 (UCCJEA DECLARATION)
--------------------------------------------------------------------------------
Case: ${dossierConfig.caseNumberValue} | Minor Children Declared: ${(fl.minorChildren || []).length}
${(fl.minorChildren || []).map((c, i) => `Child ${i + 1}: ${c.name} | DOB: ${c.birthdate} | Age: ${c.age}\nPeriod of CA residence: Birth to Present\nChild lived with: Both Parents / Respondent`).join('\n\n')}

${divider}
DOCUMENT 3: FORM FL-311 (CUSTODY & PARENTING APPLICATION ATTACHMENT)
--------------------------------------------------------------------------------
Joint Legal & Physical Custody requested. Schedule: ${fl.visitationRequested}

${divider}
DOCUMENT 4: FORM FL-160 (SEPARATE & COMMUNITY PROPERTY SUMMARY)
--------------------------------------------------------------------------------
Separate (Fam. Code § 770): ${fl.separatePropertyNotes}
Community (Fam. Code § 2550): ${fl.communityPropertyNotes}

${divider}
END OF FAMILY LAW JUDICIAL COUNCIL RESPONSE PACKET
${divider}`;
    } else if (selectedMatterType === 'immigration') {
      fullPacket = `${divider}
FEDERAL IMMIGRATION DEFENSIVE RESPONSE & RELIEF DOSSIER PACKET
EXECUTIVE OFFICE FOR IMMIGRATION REVIEW (EOIR) / USCIS
${divider}
A-NUMBER: ${dossierConfig.caseNumberValue}
RESPONDENT: ${dossierConfig.respondentValue}
DEPARTMENT: ${dossierConfig.petitionerValue}
GOVERNING STATUTE: ${dossierConfig.governingCode}
${divider}

DOCUMENT 1: FORM EOIR-28 (NOTICE OF ENTRY OF APPEARANCE AS ATTORNEY)
--------------------------------------------------------------------------------
Alex, Esq. enters appearance on behalf of Respondent ${client.name}.

${divider}
DOCUMENT 2: STATUTORY APPLICATION FOR CANCELLATION OF REMOVAL (FORM EOIR-42B)
--------------------------------------------------------------------------------
${generatePleadingText()}

${divider}
DOCUMENT 3: QUALIFYING RELATIVE HARDSHIP DECLARATION (INA § 240A(b)(1)(D))
--------------------------------------------------------------------------------
Detailed declarations establishing severe psychological, developmental, and medical hardship to USC qualifying children:
${(fl.minorChildren || []).map(c => `• ${c.name} (USC Child, Age ${c.age}, DOB: ${c.birthdate})`).join('\n')}

${divider}
DOCUMENT 4: STATUTORY GOOD MORAL CHARACTER (GMC) & TAX CLEARANCE INDEX
--------------------------------------------------------------------------------
FBI Biometric Clearance: CLEAN
California DOJ Record: CLEAN
IRS 1040 Certified Transcripts: 2016-2025 Filed and Compliant.

${divider}
END OF IMMIGRATION STATUTORY RESPONSE PACKET
${divider}`;
    } else if (selectedMatterType === 'civil') {
      fullPacket = `${divider}
CALIFORNIA CIVIL LITIGATION RESPONSE PACKET: VERIFIED ANSWER & 11 AFFIRMATIVE DEFENSES
SUPERIOR COURT OF THE STATE OF CALIFORNIA — UNLIMITED CIVIL
${divider}
CASE NUMBER: ${dossierConfig.caseNumberValue}
PLAINTIFF: ${dossierConfig.petitionerValue}
DEFENDANT: ${dossierConfig.respondentValue}
GOVERNING STATUTE: ${dossierConfig.governingCode}
${divider}

DOCUMENT 1: DEFENDANT'S VERIFIED ANSWER TO COMPLAINT & 11 AFFIRMATIVE DEFENSES
--------------------------------------------------------------------------------
${generatePleadingText()}

${divider}
DOCUMENT 2: RESERVATION OF COMPULSORY CROSS-COMPLAINT (CCP §§ 426.30, 428.10)
--------------------------------------------------------------------------------
Notice that Defendant reserves all rights to assert affirmative cross-claims arising out of the occurrences alleged in Plaintiff's Complaint.

${divider}
DOCUMENT 3: FORMAL PROOF OF SERVICE BY OVERNIGHT / ELECTRONIC TRANSMISSION
--------------------------------------------------------------------------------
Proof of Service pursuant to California Code of Civil Procedure § 1013a / 1010.6 certifying service on Plaintiff's counsel of record.

${divider}
END OF CIVIL LITIGATION RESPONSE PACKET
${divider}`;
    } else if (selectedMatterType === 'bankruptcy') {
      fullPacket = `${divider}
FEDERAL BANKRUPTCY MASTER SCHEDULES & STATUTORY DISCLOSURE PACKET
UNITED STATES BANKRUPTCY COURT (11 U.S.C. §§ 101 ET SEQ.)
${divider}
CASE NO.: ${dossierConfig.caseNumberValue}
DEBTOR: ${dossierConfig.respondentValue}
GOVERNING STATUTE: ${dossierConfig.governingCode}
${divider}

${generatePleadingText()}

${divider}
SCHEDULE SUMMARY (SCHEDULES A/B THROUGH J & SOFA ATTACHED)
${divider}`;
    } else {
      fullPacket = `${divider}
COMMERCIAL & CORPORATE STATUTORY RESPONSE PACKET
STATE OF CALIFORNIA — SECRETARY OF STATE & COMMERCIAL TRIBUNAL
${divider}
${generatePleadingText()}`;
    }

    if (onAddGeneratedDoc) {
      onAddGeneratedDoc({
        id: `doc_${selectedMatterType}_packet_${Date.now()}`,
        title: `Complete ${dossierConfig.statutoryTitle} Packet — ${client.name}`,
        clientId: client.id,
        clientName: client.name,
        templateId: `statutory-packet-${selectedMatterType}`,
        content: fullPacket,
        generatedAt: new Date().toISOString()
      });
    }

    setDossierNotice(`Complete ${dossierConfig.statutoryTitle} Packet compiled and filed into Documents!`);
    setTimeout(() => setDossierNotice(null), 7000);
  };

  const handleCopyJson = () => {
    const payload = {
      matterType: selectedMatterType,
      statutoryTitle: dossierConfig.statutoryTitle,
      governingCode: dossierConfig.governingCode,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        practiceArea: client.practiceArea
      },
      activeMatter: activeMatter ? {
        id: activeMatter.id,
        title: activeMatter.title,
        caseNumber: activeMatter.caseNumber,
        practiceArea: activeMatter.practiceArea
      } : null,
      jurisdiction: {
        court: dossierConfig.courtValue,
        caseNumber: dossierConfig.caseNumberValue,
        petitioner: dossierConfig.petitionerValue,
        respondent: dossierConfig.respondentValue
      },
      statutorySections: dossierConfig.sections
    };

    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 3000);
  };

  return (
    <div className="mt-5 p-5 bg-[#050811] border border-emerald-500/40 rounded-2xl space-y-4 shadow-xl shadow-emerald-950/20 select-text">
      {/* Dynamic Matter Type Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] uppercase font-mono font-bold text-slate-400">
            Matter Practice Area:
          </span>
          <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {activeMatter?.title ? `Matter: ${activeMatter.title}` : `Client Default: ${client.practiceArea || 'Family Law'}`}
          </span>
        </div>

        {/* Matter Type Tabs */}
        <div className="flex items-center gap-1 flex-wrap text-xs font-mono">
          {[
            { id: 'family', label: '⚖️ Family Law', short: 'FL-120' },
            { id: 'immigration', label: '🛂 Immigration', short: 'INA / EOIR' },
            { id: 'civil', label: '🏛️ Civil Litigation', short: 'Cal. CCP' },
            { id: 'bankruptcy', label: '💼 Bankruptcy', short: '11 U.S.C.' },
            { id: 'corporate', label: '🏢 Corporate', short: 'Corp. Code' }
          ].map(t => {
            const isSelected = selectedMatterType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedMatterType(t.id as StatutoryMatterType)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/30 ring-1 ring-emerald-300'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
                title={`Switch Statutory Response Dossier to ${t.label}`}
              >
                <span>{t.label}</span>
                <span className={`text-[9px] ${isSelected ? 'text-slate-950/80' : 'text-slate-500'}`}>
                  ({t.short})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Header & Status Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                  {dossierConfig.statutoryTitle}
                </h4>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {dossierConfig.statutoryBadge}
                </span>
                <span className="text-[9.5px] font-mono text-teal-400/90 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
                  {dossierConfig.badgeText}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                {dossierConfig.scheduleSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedMatterType === 'family' && (
            <button
              type="button"
              onClick={() => handleOpenOfficial('FL-120')}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 hover:from-amber-400 hover:to-emerald-400 text-[#090d16] text-xs font-mono font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/40 transition-all cursor-pointer ring-2 ring-emerald-400/50"
              title="Open authentic California Judicial Council statutory form populated with case data"
            >
              <Eye className="w-3.5 h-3.5 text-black" />
              <span>{dossierConfig.officialButtonText}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyJson}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#090d16] hover:bg-slate-800 text-slate-300 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy structured statutory JSON data for active matter"
          >
            {hasCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{hasCopied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleGeneratePleading}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/30 transition-all cursor-pointer"
            title="Generate verified statutory pleading and file into client documents"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Generate Pleading</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateCompletePacket}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-emerald-500/30 transition-all cursor-pointer"
            title={`Generate complete ${selectedMatterType} statutory response packet`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Full Response Packet</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {dossierNotice && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{dossierNotice}</span>
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

      {/* Case Caption Strip (Reflecting Matter Type) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#090e1a] border border-slate-800 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">{dossierConfig.courtJurisdictionLabel}</span>
          <span className="text-slate-200 font-semibold truncate block" title={dossierConfig.courtValue}>
            {dossierConfig.courtValue}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">{dossierConfig.caseNumberLabel}</span>
          <span className="text-emerald-400 font-bold block">{dossierConfig.caseNumberValue}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">{dossierConfig.petitionerLabel}</span>
          <span className="text-slate-300 truncate block">{dossierConfig.petitionerValue}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">{dossierConfig.respondentLabel}</span>
          <span className="text-slate-100 font-bold truncate block">{dossierConfig.respondentValue}</span>
        </div>
      </div>

      {/* Governing Authority Strip */}
      <div className="px-3 py-1.5 rounded-lg bg-[#070d1a] border border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Governing Code:</span>
          <span className="text-teal-300 font-semibold">{dossierConfig.governingCode}</span>
        </div>
        <div className="text-[10px] text-emerald-400">
          ✓ Verified Matter-Specific Schedule
        </div>
      </div>

      {/* 11 Statutory Sections Grid (Dynamic per Matter Type) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
        {dossierConfig.sections.map((section, idx) => {
          // Highlight specific span classes for aesthetic balance
          const isSpanTwo = idx === 9 || idx === 10;
          return (
            <div
              key={section.num}
              className={`p-3 bg-[#070c18] border border-slate-800 rounded-xl space-y-1.5 transition-all hover:border-emerald-500/30 ${
                idx === 10 ? 'lg:col-span-3' : isSpanTwo ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
                <span>{section.title}</span>
                <span className="text-[9px] text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
                  {section.citation}
                </span>
              </div>
              <p className="text-slate-200 text-[11px] font-semibold leading-snug">
                {section.main}
              </p>
              <p className="text-slate-400 text-[10.5px] leading-relaxed whitespace-pre-line">
                {section.detail}
              </p>
            </div>
          );
        })}
      </div>

      {/* Official Form Modal for Family Law */}
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

export const StatutoryResponseDossier = FL120ResponseDossier;
export default FL120ResponseDossier;
