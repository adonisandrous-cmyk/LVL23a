import { Client, Matter } from '../types';

export const INITIAL_CLIENTS_ROSTER: Client[] = [
  {
    id: 'client_fl_001',
    name: 'Elena Vance',
    email: 'elena.vance@legalmail.org',
    phone: '(949) 555-0182',
    status: 'active',
    practiceArea: 'Family Law',
    address: '2418 Ocean Breeze Way, Newport Beach, CA 92660',
    intakeNotes: 'Petitioner filed FL-100 Petition for Dissolution. Respondent seeks joint legal and physical custody under FL-311 2-2-3 schedule, statutory reservation of spousal support under Fam. Code § 4320, and equal community property division pursuant to Fam. Code § 2550.',
    createdAt: '2026-01-15T09:00:00.000Z',
    fl120Data: {
      caseNumber: '26FL004812C',
      courtCounty: 'Superior Court of California, County of Orange',
      branchName: 'Lamoreaux Justice Center, 341 The City Dr S, Orange, CA 92868',
      petitionerName: 'Marcus Vance (Petitioner)',
      respondentName: 'Elena Vance (Respondent)',
      proceedingType: 'Dissolution',
      legalRelationship: 'Marriage',
      residenceRequirementMet: true,
      dateOfMarriage: '09/18/2015',
      dateOfSeparation: '04/10/2026',
      durationYears: 10,
      durationMonths: 7,
      hasMinorChildren: true,
      minorChildren: [
        { name: 'Lucas Vance', birthdate: '03/12/2018', age: 8 },
        { name: 'Chloe Vance', birthdate: '07/24/2021', age: 5 }
      ],
      uccjeaFormRequired: true,
      legalGrounds: 'Irreconcilable Differences',
      custodyLegal: 'Joint',
      custodyPhysical: 'Joint',
      visitationRequested: 'Joint physical custody with alternating 2-2-3 schedule; alternating holidays and shared spring break.',
      childSupportRequested: true,
      spousalSupportRequested: 'Reserve',
      separatePropertyConfirmed: true,
      separatePropertyNotes: 'Pre-marital 401(k) balance, family heirloom jewelry, and separate checking account.',
      communityPropertyDivision: true,
      communityPropertyNotes: 'Equal division of marital residence equity and deferred compensation earned during marriage per Fam. Code § 2550.',
      attorneyFeesPayableBy: 'Petitioner'
    }
  },
  {
    id: 'client_imm_002',
    name: 'Mateo Rodriguez',
    email: 'm.rodriguez.case@domain.net',
    phone: '(213) 555-0144',
    status: 'active',
    practiceArea: 'Immigration',
    address: '1420 S Grand Ave, Los Angeles, CA 90015',
    intakeNotes: 'EOIR removal defense proceeding. Client entered U.S. in 2014, establishing 12 years of continuous physical presence under INA § 240A(b). Two U.S. Citizen minor children with documented medical/developmental conditions qualifying under Matter of Recinas hardship standard.',
    createdAt: '2026-02-10T11:30:00.000Z'
  },
  {
    id: 'client_civ_003',
    name: 'Kaelen Sterling',
    email: 'ksterling@sterlinglogistics.io',
    phone: '(415) 555-0199',
    status: 'active',
    practiceArea: 'Civil Litigation',
    address: '880 Industrial Pkwy, Irvine, CA 92618',
    intakeNotes: 'Commercial breach of contract and promissory estoppel lawsuit served under unlimited civil jurisdiction ($180,000 claim). Preparing verified general denial under CCP § 431.30, 11 affirmative defenses including statute of limitations (CCP § 337), comparative fault, failure to mitigate, and trial by jury demand.',
    createdAt: '2026-03-05T14:15:00.000Z'
  }
];

export const INITIAL_MATTERS_ROSTER: Matter[] = [
  {
    id: 'matter_fl_001',
    title: 'Vance Marriage Dissolution & Custody Response',
    caseNumber: '26FL004812C',
    clientId: 'client_fl_001',
    clientName: 'Elena Vance',
    practiceArea: 'Family Law',
    status: 'active',
    billingRate: 350,
    billedHours: 14.5,
    description: 'Mandatory California Judicial Council FL-120 response to marital dissolution petition. Prepared accompanying FL-105 UCCJEA declaration, FL-311 parenting plan, and FL-160 property disclosure schedule.',
    createdAt: '2026-01-16T10:00:00.000Z',
    courtVenue: 'Superior Court of California, County of Orange',
    opposingParty: 'Marcus Vance',
    tasks: [
      { id: 'task_fl_1', title: 'File Form FL-120 Response and Proof of Service with court clerk', completed: true, dueDate: '2026-04-20' },
      { id: 'task_fl_2', title: 'Serve Form FL-150 Income & Expense Declaration and preliminary disclosures', completed: false, dueDate: '2026-05-15' },
      { id: 'task_fl_3', title: 'Prepare for Child Custody Recommending Counseling (CCRC) session', completed: false, dueDate: '2026-06-01' }
    ]
  },
  {
    id: 'matter_imm_002',
    title: 'Rodriguez EOIR Non-LPR Cancellation & Hardship Defense',
    caseNumber: 'A# 248-819-021',
    clientId: 'client_imm_002',
    clientName: 'Mateo Rodriguez',
    practiceArea: 'Immigration',
    status: 'active',
    billingRate: 320,
    billedHours: 18.0,
    description: 'Defensive application for Cancellation of Removal for Nonpermanent Residents pursuant to INA § 240A(b), 8 U.S.C. § 1229b(b), and Form EOIR-42B. Proof of 10+ years continuous residence, clean FBI record, and exceptional and extremely unusual hardship to USC children.',
    createdAt: '2026-02-12T09:30:00.000Z',
    courtVenue: 'EOIR Immigration Court, Los Angeles',
    opposingParty: 'DHS / Assistant Chief Counsel (ICE)',
    tasks: [
      { id: 'task_imm_1', title: 'Complete biometric fingerprints and security check appointment', completed: true, dueDate: '2026-03-01' },
      { id: 'task_imm_2', title: 'Compile 10 years of federal IRS transcripts and continuous presence utility records', completed: true, dueDate: '2026-03-25' },
      { id: 'task_imm_3', title: 'Finalize psychological evaluation and pediatric medical records for USC children', completed: false, dueDate: '2026-05-10' },
      { id: 'task_imm_4', title: 'Submit EOIR-42B master application package and country conditions index', completed: false, dueDate: '2026-06-15' }
    ]
  },
  {
    id: 'matter_civ_003',
    title: 'Pacific Crest Supply v. Sterling Logistics — Commercial Defense',
    caseNumber: '30-2026-01489201-CU-BC-CGC',
    clientId: 'client_civ_003',
    clientName: 'Kaelen Sterling',
    practiceArea: 'Civil Litigation',
    status: 'active',
    billingRate: 425,
    billedHours: 12.0,
    description: 'Defense of $180,000 commercial breach of contract and UCC goods delivery claim. Assertion of verified answer under CCP § 431.30, 11 statutory affirmative defenses including statute of limitations, comparative fault, failure to mitigate, and cross-complaint reservation.',
    createdAt: '2026-03-08T13:00:00.000Z',
    courtVenue: 'Superior Court of California, County of Orange (Unlimited Civil)',
    opposingParty: 'Pacific Crest Commercial Supply, Inc.',
    tasks: [
      { id: 'task_civ_1', title: 'File Verified Answer to Complaint with CCP § 446 Verification', completed: true, dueDate: '2026-03-30' },
      { id: 'task_civ_2', title: 'Serve Form Interrogatories (General) and Special Interrogatories Set One', completed: false, dueDate: '2026-04-28' },
      { id: 'task_civ_3', title: 'Prepare Cross-Complaint for breach of implied covenant of good faith and fair dealing', completed: false, dueDate: '2026-05-20' },
      { id: 'task_civ_4', title: 'File Case Management Statement (Form CM-110) demanding jury trial', completed: false, dueDate: '2026-06-10' }
    ]
  }
];
