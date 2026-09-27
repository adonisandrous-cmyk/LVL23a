import { Client, Matter } from '../types';

export const INITIAL_CLIENTS_ROSTER: Client[] = [
  {
    id: 'c-guinto',
    name: 'Christopher Guinto',
    email: 'christopher.guinto@gmail.com',
    phone: '+1 (714) 555-0199',
    status: 'active',
    practiceArea: 'Family Law',
    createdAt: '2026-08-15T09:00:00Z',
    fl120Data: {
      caseNumber: '26FL008921',
      courtCounty: 'Orange County Superior Court',
      branchName: 'Lamoreaux Justice Center, 341 The City Dr S, Orange, CA 92868',
      petitionerName: 'Maria Guinto',
      respondentName: 'Christopher Guinto',
      proceedingType: 'Dissolution',
      legalRelationship: 'Marriage',
      residenceRequirementMet: true,
      dateOfMarriage: '2015-09-18',
      dateOfSeparation: '2026-04-10',
      durationYears: 10,
      durationMonths: 7,
      hasMinorChildren: true,
      minorChildren: [
        { name: 'Ethan Guinto', birthdate: '2017-04-12', age: 9 },
        { name: 'Sophia Guinto', birthdate: '2020-11-05', age: 5 }
      ],
      uccjeaFormRequired: true,
      legalGrounds: 'Irreconcilable Differences',
      custodyLegal: 'Joint',
      custodyPhysical: 'Joint',
      visitationRequested: 'Standard 2-2-3 alternating weekly schedule with alternating major holidays and 2 uninterrupted weeks during summer vacation per FL-311',
      childSupportRequested: true,
      spousalSupportRequested: 'Reserve',
      separatePropertyConfirmed: true,
      separatePropertyNotes: 'Confirm Respondent Christopher Guinto separate property per Fam. Code § 770 (pre-marital retirement accounts, vehicle, and personal tools acquired prior to marriage)',
      communityPropertyDivision: true,
      communityPropertyNotes: 'Equal division of community estate pursuant to Fam. Code § 2550: Marital residence equity, joint checking and savings accounts, retirement benefits accrued during coverture subject to QDRO',
      attorneyFeesPayableBy: 'None',
      formerNameRestored: '',
      extractionTimestamp: '2026-08-15T09:30:00Z',
      batchId: 'VERIFIED-DOSSIER-GUINTO'
    },
    intakeNotes: `========================================================================
CLIENT INTAKE MEMORANDUM & CASE FILE: CHRISTOPHER GUINTO
========================================================================
1. PARTY INFORMATION
- Client Legal Name: Christopher Guinto (Respondent)
- Opposing Party: Maria Guinto (Petitioner)
- Case Number: 26FL008921
- Court: Superior Court of California, County of Orange
- Branch: Lamoreaux Justice Center, 341 The City Dr S, Orange, CA 92868
- Email: christopher.guinto@gmail.com
- Phone: +1 (714) 555-0199
- Practice Area: Family Law (Dissolution of Marriage)

2. STATUTORY DISSOLUTION PROFILE
- Marriage Date: September 18, 2015
- Separation Date: April 10, 2026 (Duration: 10 yrs, 7 mos)
- Minor Children:
  1) Ethan Guinto (DOB: 04/12/2017, Age 9)
  2) Sophia Guinto (DOB: 11/05/2020, Age 5)
- Custody / Visitation Plan: Joint legal and physical custody (FL-311 2-2-3 schedule)
- UCCJEA Jurisdiction: Form FL-105 attached (California residence > 6 months)
- Property Rights:
  * Fam. Code § 770 Separate Property: Respondent pre-marital retirement & personal assets
  * Fam. Code § 2550 Community Property: Equal division of marital assets and community equity
- Support Orders: Child support per California statutory guideline; reserve spousal support
========================================================================`
  }
];

export const INITIAL_MATTERS_ROSTER: Matter[] = [
  {
    id: 'm-guinto-1',
    title: 'Dissolution Response — Christopher Guinto',
    caseNumber: '26FL008921',
    clientId: 'c-guinto',
    clientName: 'Christopher Guinto',
    practiceArea: 'Family Law',
    status: 'active',
    billingRate: 350,
    billedHours: 3.5,
    description: 'Judicial Council statutory response forms packet (FL-105 UCCJEA, FL-311, FL-140, FL-160) for Christopher Guinto.',
    createdAt: '2026-08-15T10:00:00Z',
    tasks: [
      { id: 't-g-1', title: 'File Dissolution Response and FL-105 UCCJEA Declaration at Lamoreaux Justice Center', completed: false, dueDate: '2026-09-01' },
      { id: 't-g-2', title: 'Serve Preliminary Declaration of Disclosure (FL-140/FL-150) on Petitioner', completed: false, dueDate: '2026-09-15' }
    ],
    riskAssessment: 'Statutory 30-day response deadline following petition service; timely response filing required to avoid default.'
  }
];
