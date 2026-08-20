import { Client, Matter, EvidenceFile, GeneratedDocument } from '../types';

export const INITIAL_CLIENTS_ROSTER: Client[] = [
  {
    id: 'c-0',
    name: 'Don Watson',
    email: 'don.watson@watsontech.com',
    phone: '+1 (949) 555-0198',
    status: 'active',
    practiceArea: 'Family Law',
    createdAt: '2026-06-01T08:00:00Z',
    intakeNotes: `========================================================================
CLIENT INTAKE MEMORANDUM & CASE FILE: DON WATSON
========================================================================
1. PARTY INFORMATION & PERSONAL DETAILS
------------------------------------------------------------------------
PETITIONER (CLIENT):
- Full Legal Name: Don Watson
- Date of Birth: November 14, 1982 (Age 43)
- Residential Address: 1420 Newport Center Dr, Suite 500, Newport Beach, Orange County, CA 92660
- Email: don.watson@watsontech.com
- Phone: +1 (949) 555-0198
- Occupation / Employer: Chief Technology Officer, WatsonTech Systems Inc.

RESPONDENT (SPOUSE):
- Full Legal Name: Clara Watson
- Date of Birth: April 22, 1985 (Age 41)
- Residential Address: 780 Coast Hwy, Laguna Beach, Orange County, CA 92651
- Email: clara.watson@gmail.com
- Phone: +1 (949) 555-0812

2. MARRIAGE & DISSOLUTION DECLARATION / COVER SHEET
------------------------------------------------------------------------
- Nature of Action: Dissolution of Marriage (Marriage Dissolution / Divorce)
- Date of Marriage: June 15, 2012 (City of Newport Beach, County of Orange, CA)
- Date of Separation: April 10, 2026
- County of Filing: Superior Court of California, County of Orange (341 The City Drive South, Orange, CA 92868)
- Statutory Jurisdictional Basis: California Family Code Section 300 (Jurisdiction in Marriage Dissolution Actions; Petitioner meets 6-month California state residence and 3-month Orange County residence requirements).

3. MINOR CHILDREN & CUSTODY PREFERENCES
------------------------------------------------------------------------
- Minor Child 1: Ethan Watson (DOB: August 10, 2016)
- Minor Child 2: Chloe Watson (DOB: December 5, 2019)
- Requested Custody: Joint Legal Custody & Primary Physical Custody to Petitioner (Don Watson) with structured weekend visitation to Respondent.

4. PROPERTY, ASSETS & SPOUSAL SUPPORT DISCLOSURES
------------------------------------------------------------------------
- Community Property: Newport Beach residential real estate ($1.4M valuation), WatsonTech equity holdings acquired during marriage.
- Separate Property: Pre-marital tech patents and inheritance accounts.
- Relief Sought: Partition of real property assets, spousal support determination audit, and issuance of FL-110 Summons.
========================================================================`
  },
  {
    id: 'c-1',
    name: 'Eleanor Vance',
    email: 'eleanor.vance@gmail.com',
    phone: '+1 (415) 304-9271',
    status: 'active',
    practiceArea: 'Family Law',
    createdAt: '2026-04-10T14:22:00Z',
    intakeNotes: `Client Eleanor Vance seeks assistance regarding joint custody dissolution under CA Family Code.
Separation date was reported as April 10th. Marriage date was July 2nd, 2012. Two minor children are involved.
She seeks spousal support limits audit, division of retirement accounts, and partition of cooperative townhouse asset in San Francisco.`
  },
  {
    id: 'c-2',
    name: 'Mateo Rodriguez',
    email: 'm.rodriguez@fastmail.com',
    phone: '+1 (510) 902-8344',
    status: 'active',
    practiceArea: 'Immigration',
    createdAt: '2026-04-15T09:45:00Z',
    intakeNotes: `Mateo Rodriguez is applying for Form I-589 Application for Asylum and Withholding of Removal.
Country of Origin: El Salvador. Entry date: February 12, 2026 via B-2 Visa status.
Fled following targeted threats for investigative journalism and human rights advocacy. Police reports indicate failure of state protection.`
  },
  {
    id: 'c-3',
    name: 'Samuel Miller',
    email: 'sam.miller@techcorp.io',
    phone: '+1 (650) 844-3011',
    status: 'pending',
    practiceArea: 'Bankruptcy',
    createdAt: '2026-05-18T11:10:00Z',
    intakeNotes: `Samuel seeks Chapter 7 individual liquidation bankruptcy.
Unsecured consumer obligations total $48,000 across four credit facilities. Monthly median income is below state exemption limits.
Primary exempt asset is commuter automobile. Seeks immediate stay of collection letters and debt discharge.`
  },
  {
    id: 'c-4',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@lumina-art.org',
    phone: '+1 (310) 849-2104',
    status: 'active',
    practiceArea: 'Family Law',
    createdAt: '2026-05-02T10:15:00Z',
    intakeNotes: `Petitioner in Jenkins v. Jenkins (LA Superior Court).
Marriage date: June 12, 2012. Separation date: September 15, 2025. Two minor children (Lily, 10; Ethan, 8).
Disputed assets: 442 Ocean Drive Santa Monica condominium with Moore/Marsden community contribution claim ($620,000) and offshore diverted dividends.`
  },
  {
    id: 'c-5',
    name: 'Aisha Al-Mansoor',
    email: 'aisha.mansoor@dubai-ventures.com',
    phone: '+1 (408) 723-9912',
    status: 'active',
    practiceArea: 'Immigration',
    createdAt: '2026-05-04T13:30:00Z',
    intakeNotes: `EB-1A Alien of Extraordinary Ability petition and I-485 Adjustment of Status.
Ph.D. in Quantum Computing with 14 peer-reviewed IEEE publications and 420 citations. Seeks green card approval without labor certification.`
  },
  {
    id: 'c-6',
    name: 'Marcus Sterling',
    email: 'm.sterling@sterling-capital.com',
    phone: '+1 (213) 490-8821',
    status: 'active',
    practiceArea: 'Corporate',
    createdAt: '2026-05-06T15:00:00Z',
    intakeNotes: `Series A Preferred Stock Equity Financing ($6.5M round).
Drafting Investor Rights Agreement, Right of First Refusal & Co-Sale Agreement, Voting Agreement, and Restated Certificate of Incorporation.`
  },
  {
    id: 'c-7',
    name: 'Elena Rostova',
    email: 'elena.rostova@rostova-trust.net',
    phone: '+1 (415) 662-7719',
    status: 'active',
    practiceArea: 'Estate Planning',
    createdAt: '2026-05-08T09:20:00Z',
    intakeNotes: `Comprehensive Revocable Living Trust & Asset Protection Restructuring.
Pour-Over Will, Advance Health Care Directive, Durable Power of Attorney for Finances, and real property deeds funding into Rostova Family Trust.`
  },
  {
    id: 'c-8',
    name: 'David K. Chen',
    email: 'david.chen@bayview-properties.com',
    phone: '+1 (510) 338-4450',
    status: 'active',
    practiceArea: 'Real Estate',
    createdAt: '2026-05-10T11:45:00Z',
    intakeNotes: `Commercial lease negotiation for 18,000 sq ft retail space in Oakland.
CAM charges dispute, exclusivity covenant drafting, tenant improvement allowance ($180k), and personal guaranty limitation clause.`
  },
  {
    id: 'c-9',
    name: 'Gabriela Morales',
    email: 'gaby.morales@latinx-health.org',
    phone: '+1 (619) 402-3318',
    status: 'active',
    practiceArea: 'Immigration',
    createdAt: '2026-05-12T14:10:00Z',
    intakeNotes: `U-Visa Form I-918 Petition for Victims of Qualifying Crimes.
Certified Form I-918 Supplement B signed by San Diego County Sheriff's Dept following cooperation in felony assault conviction. Requesting derivative status for minor child.`
  },
  {
    id: 'c-10',
    name: 'Harrison Vance',
    email: 'harrison.vance@vance-holdings.co',
    phone: '+1 (702) 819-0044',
    status: 'active',
    practiceArea: 'Civil Litigation',
    createdAt: '2026-05-14T16:30:00Z',
    intakeNotes: `Breach of contract and fiduciary duty defense in Clark County District Court.
Summary judgment briefing on statute of limitations defense and lack of privity under Nevada Commercial Code.`
  },
  {
    id: 'c-11',
    name: 'Fatima Zahra',
    email: 'fatima.zahra@biotech-innovations.org',
    phone: '+1 (858) 991-2300',
    status: 'active',
    practiceArea: 'Intellectual Property',
    createdAt: '2026-05-16T10:00:00Z',
    intakeNotes: `USPTO Patent Prosecution for CRISPER-based gene delivery vector formulation.
Responding to Non-Final Office Action on 35 U.S.C. 103 obviousness rejections and preparing claims amendments with declarations under 37 C.F.R. 1.132.`
  },
  {
    id: 'c-12',
    name: 'Robert Thornton',
    email: 'r.thornton@sierra-logistics.net',
    phone: '+1 (916) 551-7890',
    status: 'pending',
    practiceArea: 'Employment',
    createdAt: '2026-05-19T08:40:00Z',
    intakeNotes: `Executive severance negotiation following constructive termination.
California Labor Code § 2802 expense reimbursement claims, non-disparagement carveouts for SEC reporting, and acceleration of unvested ISO stock options.`
  },
  {
    id: 'c-13',
    name: 'Lucia Fontana',
    email: 'lucia.fontana@milano-design.it',
    phone: '+1 (415) 880-9941',
    status: 'active',
    practiceArea: 'Immigration',
    createdAt: '2026-05-21T13:15:00Z',
    intakeNotes: `O-1B Visa for Individuals with Extraordinary Ability in the Arts (Industrial Design).
Red Dot Design Award recipient with international exhibition record in Milan, Paris, and New York. Petitioner is SF Architecture Collective.`
  },
  {
    id: 'c-14',
    name: 'Benjamin O\'Connor',
    email: 'ben.oconnor@redwood-builders.com',
    phone: '+1 (707) 321-6540',
    status: 'active',
    practiceArea: 'Civil Litigation',
    createdAt: '2026-05-23T15:20:00Z',
    intakeNotes: `California Mechanic's Lien foreclosure action against general contractor and developer in Sonoma County.
$340,000 unpaid structural concrete subcontract. Preliminary 20-day notice timely served; recorded lien on parcel APN 032-110-09.`
  },
  {
    id: 'c-15',
    name: 'Mei-Ling Zhou',
    email: 'meiling.zhou@silicon-valley-vc.com',
    phone: '+1 (408) 902-1144',
    status: 'active',
    practiceArea: 'Estate Planning',
    createdAt: '2026-05-25T11:00:00Z',
    intakeNotes: `Irrevocable Grantor Retained Annuity Trust (GRAT) and Qualified Small Business Stock (QSBS § 1202) estate structuring.
Multi-generational wealth transfer for pre-IPO tech startup founder.`
  },
  {
    id: 'c-16',
    name: 'Javier Castillo',
    email: 'javier.castillo@castillo-produce.com',
    phone: '+1 (559) 701-4433',
    status: 'active',
    practiceArea: 'Corporate',
    createdAt: '2026-05-27T09:30:00Z',
    intakeNotes: `Cross-border PACA (Perishable Agricultural Commodities Act) supply agreements and corporate restructuring from LLC to C-Corp.
Customs compliance and agricultural distributor licensing in Central Valley.`
  },
  {
    id: 'c-17',
    name: 'Kavita Patel',
    email: 'kavita.patel@healthbridge-clinic.com',
    phone: '+1 (949) 820-5577',
    status: 'active',
    practiceArea: 'Corporate',
    createdAt: '2026-05-29T14:45:00Z',
    intakeNotes: `Medical practice MSO (Management Services Organization) compliance structure under California Corporate Practice of Medicine doctrine.
Physician employment agreements and HIPAA Business Associate Agreements.`
  },
  {
    id: 'c-18',
    name: 'Andre Dubois',
    email: 'andre.dubois@provence-wine.fr',
    phone: '+1 (707) 992-3301',
    status: 'pending',
    practiceArea: 'Intellectual Property',
    createdAt: '2026-05-31T10:10:00Z',
    intakeNotes: `USPTO Trademark Opposition proceeding before the Trademark Trial and Appeal Board (TTAB).
Defending Napa Valley winery brand against likelihood of confusion claim by European conglomerate.`
  },
  {
    id: 'c-19',
    name: 'Nadia Kowalski',
    email: 'nadia.kowalski@cascadia-green.org',
    phone: '+1 (503) 610-8844',
    status: 'active',
    practiceArea: 'Personal Injury',
    createdAt: '2026-06-02T16:00:00Z',
    intakeNotes: `Commercial truck collision liability claim on I-5 corridor.
Traumatic brain injury and spinal disc herniation. FMCSA electronic logging device (ELD) data preservation demand and policy limits tender ($2M).`
  },
  {
    id: 'c-20',
    name: 'Julian Montgomery',
    email: 'julian.m@montgomery-advisory.com',
    phone: '+1 (310) 554-9988',
    status: 'active',
    practiceArea: 'Bankruptcy',
    createdAt: '2026-06-04T12:00:00Z',
    intakeNotes: `Subchapter V Chapter 11 Small Business Reorganization.
Restructuring $1.8M in commercial landlord and vendor debt for boutique hospitality management company while maintaining debtor-in-possession equity.`
  },
  {
    id: 'c-21',
    name: 'Sunita Sharma',
    email: 'sunita.sharma@apex-fintech.io',
    phone: '+1 (650) 412-9090',
    status: 'active',
    practiceArea: 'Immigration',
    createdAt: '2026-06-06T09:15:00Z',
    intakeNotes: `H-1B Change of Employer petition and PERM Labor Certification filing.
Senior Machine Learning Engineer role. Prevailing wage determination received from DOL with SOC Code 15-1221.`
  },
  {
    id: 'c-22',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@mendoza-contracting.com',
    phone: '+1 (619) 550-1288',
    status: 'active',
    practiceArea: 'Civil Litigation',
    createdAt: '2026-06-08T11:30:00Z',
    intakeNotes: `Public works construction bid protest against municipal transit authority.
Disqualification appeal based on non-responsive subcontractor listing requirements under California Public Contract Code § 4100.`
  },
  {
    id: 'c-23',
    name: 'Evelyn St. Claire',
    email: 'evelyn@stclaire-antiques.com',
    phone: '+1 (831) 420-7711',
    status: 'active',
    practiceArea: 'Estate Planning',
    createdAt: '2026-06-10T15:00:00Z',
    intakeNotes: `Special Needs Trust (SNT) establishment for adult disabled dependent.
Ensuring continued eligibility for Medi-Cal and SSI benefits while preserving family real estate endowment.`
  },
  {
    id: 'c-24',
    name: 'Tariq Hassan',
    email: 'tariq.hassan@emerald-solar.energy',
    phone: '+1 (916) 883-2411',
    status: 'active',
    practiceArea: 'Corporate',
    createdAt: '2026-06-12T13:40:00Z',
    intakeNotes: `Solar PPA (Power Purchase Agreement) and EPC (Engineering, Procurement, Construction) commercial contracts.
Negotiating interconnection agreement with regional utility operator and Inflation Reduction Act (IRA) ITC tax equity provisions.`
  }
];

export const INITIAL_MATTERS_ROSTER: Matter[] = [
  {
    id: 'm-0',
    title: 'Watson Marriage Dissolution & Custody',
    caseNumber: 'FL-2026-004812',
    clientId: 'c-0',
    clientName: 'Don Watson',
    practiceArea: 'Family Law',
    status: 'active',
    billingRate: 450,
    billedHours: 14.5,
    description: 'Dissolution of marriage in Orange County Superior Court. Primary custody of two minor children and Moore/Marsden division of residential property.',
    createdAt: '2026-06-01T08:30:00Z',
    tasks: [
      { id: 't-0-1', title: 'File FL-100 Petition & FL-110 Summons', completed: true, dueDate: '2026-06-15' },
      { id: 't-0-2', title: 'Compile FL-150 Income & Expense Declaration', completed: true, dueDate: '2026-07-01' },
      { id: 't-0-3', title: 'Prepare for Custody Mediation Hearing', completed: false, dueDate: '2026-08-30' }
    ],
    riskAssessment: 'High-net-worth tech equity assets require early forensic valuation.'
  },
  {
    id: 'm-1',
    title: 'Vance v. Vance Child Custody Partition',
    caseNumber: 'FL-2026-00892',
    clientId: 'c-1',
    clientName: 'Eleanor Vance',
    practiceArea: 'Family Law',
    status: 'active',
    billingRate: 350,
    billedHours: 12.0,
    description: 'Joint physical custody evaluation and division of San Francisco co-op property.',
    createdAt: '2026-04-10T14:30:00Z',
    tasks: [
      { id: 't-1-1', title: 'Serve Preliminary Declarations of Disclosure', completed: true, dueDate: '2026-05-15' },
      { id: 't-1-2', title: 'Appraise SF Cooperative Townhouse', completed: false, dueDate: '2026-09-01' }
    ],
    riskAssessment: 'Disputed valuation of cooperative unit.'
  },
  {
    id: 'm-2',
    title: 'Rodriguez I-589 Asylum Application',
    caseNumber: 'EOIR-SF-991204',
    clientId: 'c-2',
    clientName: 'Mateo Rodriguez',
    practiceArea: 'Immigration',
    status: 'active',
    billingRate: 280,
    billedHours: 18.5,
    description: 'Affirmative asylum filing with USCIS Asylum Office San Francisco.',
    createdAt: '2026-04-15T10:00:00Z',
    tasks: [
      { id: 't-2-1', title: 'Submit Form I-589 within 1-year deadline', completed: true, dueDate: '2026-06-01' },
      { id: 't-2-2', title: 'File Country Conditions Expert Report', completed: false, dueDate: '2026-09-15' }
    ],
    riskAssessment: 'Strict 1-year asylum filing window.'
  },
  {
    id: 'm-4',
    title: 'Jenkins v. Jenkins Marital Asset Forensic Audit',
    caseNumber: 'BD-2025-554489',
    clientId: 'c-4',
    clientName: 'Sarah Jenkins',
    practiceArea: 'Family Law',
    status: 'active',
    billingRate: 425,
    billedHours: 32.0,
    description: 'Forensic accounting of diverted community assets, Moore/Marsden interest in Santa Monica property, and Family Code § 1101 sanctions petition.',
    createdAt: '2026-05-02T10:30:00Z',
    tasks: [
      { id: 't-4-1', title: 'Subpoena Lombard Odier banking records', completed: true, dueDate: '2026-06-10' },
      { id: 't-4-2', title: 'File Motion for Joinder of Vance Holdings LLC', completed: false, dueDate: '2026-08-25' }
    ],
    riskAssessment: 'Complex offshore shell entity structure requiring international discovery.'
  },
  {
    id: 'm-5',
    title: 'Al-Mansoor EB-1A Extraordinary Ability Petition',
    caseNumber: 'USCIS-LIN-26-901-4421',
    clientId: 'c-5',
    clientName: 'Aisha Al-Mansoor',
    practiceArea: 'Immigration',
    status: 'active',
    billingRate: 375,
    billedHours: 21.0,
    description: 'Form I-140 Immigrant Petition with Form I-485 Adjustment of Status in Quantum Computing domain.',
    createdAt: '2026-05-04T14:00:00Z',
    tasks: [
      { id: 't-5-1', title: 'Obtain 6 independent expert opinion letters', completed: true, dueDate: '2026-06-20' },
      { id: 't-5-2', title: 'Submit Premium Processing Form I-907', completed: true, dueDate: '2026-07-05' }
    ],
    riskAssessment: 'High-standard evidentiary threshold under Kazarian framework.'
  },
  {
    id: 'm-6',
    title: 'Sterling Capital Series A Preferred Financing',
    caseNumber: 'CORP-2026-7819',
    clientId: 'c-6',
    clientName: 'Marcus Sterling',
    practiceArea: 'Corporate',
    status: 'active',
    billingRate: 500,
    billedHours: 26.5,
    description: '$6.5M Series A Preferred Stock Financing transaction closing.',
    createdAt: '2026-05-06T15:30:00Z',
    tasks: [
      { id: 't-6-1', title: 'Draft NVCA Series A Term Sheet', completed: true, dueDate: '2026-05-20' },
      { id: 't-6-2', title: 'Finalize Investor Rights and Co-Sale Agreements', completed: false, dueDate: '2026-08-28' }
    ],
    riskAssessment: 'Strict closing schedule driven by lead VC syndicate.'
  },
  {
    id: 'm-7',
    title: 'Rostova Family Revocable Living Trust',
    caseNumber: 'EP-2026-0192',
    clientId: 'c-7',
    clientName: 'Elena Rostova',
    practiceArea: 'Estate Planning',
    status: 'active',
    billingRate: 395,
    billedHours: 16.0,
    description: 'Comprehensive estate plan with pour-over wills, healthcare directives, and real property deeds funding.',
    createdAt: '2026-05-08T10:00:00Z',
    tasks: [
      { id: 't-7-1', title: 'Record Grant Deeds with County Recorder', completed: false, dueDate: '2026-09-10' }
    ],
    riskAssessment: 'Proper asset titling required to avoid probate court administration.'
  }
];
