import { DocumentTemplate, Client } from '../types';
import { CourtFormSchema, ResearchCourtForm, ALL_RESEARCH_COURT_FORMS, ALL_COURT_FORM_SCHEMAS } from '../data/legalFormsCatalog';
import { safeFetchJson } from '../lib/driveClient';

export interface OnlineJudicialFormMetadata {
  code: string;
  title: string;
  category: string;
  jurisdiction: string;
  pdfUrl: string;
  description: string;
  guidelines: string[];
  keyTokens: string[];
  sampleValues: Record<string, string>;
}

// Expanded online verified Judicial Council forms catalog
export const VERIFIED_ONLINE_JUDICIAL_FORMS: OnlineJudicialFormMetadata[] = [
  // ==================== FAMILY LAW ====================
  {
    code: 'FL-100',
    title: 'Petition — Marriage/Domestic Partnership',
    category: 'Family Law (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl100.pdf',
    description: 'California Judicial Council FL-100. Initiates dissolution, legal separation, or nullity proceedings.',
    guidelines: [
      'Residency requirement: 6 months in CA, 3 months in filing county (Fam Code § 2320).',
      'Accurately state date of marriage and date of separation.',
      'Check reservation of jurisdiction over spousal support.'
    ],
    keyTokens: [
      'PETITIONER_NAME', 'RESPONDENT_NAME', 'FILING_COUNTY', 'CASE_NUMBER',
      'DATE_OF_MARRIAGE', 'DATE_OF_SEPARATION', 'MINOR_CHILDREN_CUSTODY',
      'SPOUSAL_SUPPORT_REQUEST', 'COMMUNITY_PROPERTY_LIST'
    ],
    sampleValues: {
      FILING_COUNTY: 'Orange County',
      DATE_OF_MARRIAGE: 'June 18, 2015',
      DATE_OF_SEPARATION: 'May 15, 2025',
      MINOR_CHILDREN_CUSTODY: 'Joint legal custody to both parents; primary physical care to Petitioner.',
      SPOUSAL_SUPPORT_REQUEST: 'Temporary spousal support of $1,250/mo per Fam Code § 3600.',
      COMMUNITY_PROPERTY_LIST: 'Marital residence in Irvine, CA and joint savings at Chase Bank.'
    }
  },
  {
    code: 'FL-110',
    title: 'Summons (Family Law)',
    category: 'Family Law (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl110.pdf',
    description: 'Official summons served on Respondent with Standard Family Law Restraining Orders (ATROs).',
    guidelines: [
      'Restrains removing children from California without written consent or court order.',
      'Restrains disposing, encumbering, or concealing community property.',
      'Gives Respondent 30 calendar days to file formal FL-120 Response.'
    ],
    keyTokens: ['PETITIONER_NAME', 'RESPONDENT_NAME', 'COURT_ADDRESS', 'CASE_NUMBER', 'FILING_COUNTY'],
    sampleValues: {
      COURT_ADDRESS: '341 The City Drive South, Orange, CA 92868',
      FILING_COUNTY: 'Orange County'
    }
  },
  {
    code: 'FL-115',
    title: 'Proof of Service of Summons (Family Law)',
    category: 'Family Law (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl115.pdf',
    description: 'Mandatory proof certifying personal or substituted service of FL-100, FL-110, and blank FL-120 on Respondent.',
    guidelines: [
      'Must be served by someone at least 18 years old who is NOT a party to the action.',
      'Specifies exact date, time, and address where personal service was executed.',
      'Must be promptly filed with court clerk to establish jurisdictional service.'
    ],
    keyTokens: [
      'PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'FILING_COUNTY',
      'SERVER_NAME_ADDRESS', 'DATE_TIME_SERVED', 'ADDRESS_WHERE_SERVED', 'MANNER_OF_SERVICE'
    ],
    sampleValues: {
      SERVER_NAME_ADDRESS: 'Apex Legal Services LLC, 500 S. Main St, Suite 100, Santa Ana, CA 92701',
      DATE_TIME_SERVED: 'May 22, 2025 at 10:45 AM',
      ADDRESS_WHERE_SERVED: '200 Coastal Way, Newport Beach, CA 92660',
      MANNER_OF_SERVICE: 'Personal Service per CCP § 415.10'
    }
  },
  {
    code: 'FL-120',
    title: 'Response and Request for Dissolution / Separation',
    category: 'Family Law (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl120.pdf',
    description: 'Respondent’s formal answer contesting or agreeing to claims in the FL-100 petition.',
    guidelines: [
      'Due within 30 days after being served with FL-110 Summons.',
      'Confirm or contest marriage and separation dates.',
      'Declare Respondent’s custody and property requests.'
    ],
    keyTokens: ['PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'FILING_COUNTY', 'CONTESTED_SEPARATION_DATE', 'RESP_CUSTODY_PRAYER'],
    sampleValues: {
      CONTESTED_SEPARATION_DATE: 'July 1, 2025',
      RESP_CUSTODY_PRAYER: 'Joint Legal and Joint Physical Custody (50/50 rotation).'
    }
  },
  {
    code: 'FL-130',
    title: 'Appearance, Stipulations, and Waivers',
    category: 'Family Law (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl130.pdf',
    description: 'Used in uncontested dissolutions where Respondent agrees to proceed by default or uncontested written stipulation.',
    guidelines: [
      'Respondent submits to court jurisdiction without contesting the petition.',
      'Waives notice of trial and right to appeal when marital agreement is reached.'
    ],
    keyTokens: ['PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'FILING_COUNTY', 'STIPULATION_TERMS'],
    sampleValues: {
      STIPULATION_TERMS: 'Matter shall proceed uncontested per Marital Settlement Agreement executed by both parties.'
    }
  },
  {
    code: 'FL-140',
    title: 'Declaration of Disclosure (Cover Sheet)',
    category: 'Financial & Disclosures (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl140.pdf',
    description: 'Mandatory cover sheet certifying exchange of preliminary or final financial disclosures under Fam Code § 2104.',
    guidelines: [
      'Preliminary disclosures must be served within 60 days of petition or response.',
      'Accompanied by FL-150 Income & Expense and FL-142 Schedule of Assets & Debts.'
    ],
    keyTokens: ['PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'DISCLOSURE_TYPE', 'TAX_RETURNS_ATTACHED'],
    sampleValues: {
      DISCLOSURE_TYPE: 'Preliminary Declaration of Disclosure',
      TAX_RETURNS_ATTACHED: 'Federal and State tax returns for the past 2 calendar years.'
    }
  },
  {
    code: 'FL-141',
    title: 'Declaration Regarding Service of Declaration of Disclosure',
    category: 'Financial & Disclosures (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl141.pdf',
    description: 'Formal court filing verifying that financial disclosures were properly served on opposing party.',
    guidelines: [
      'Filed with the court clerk (never file FL-142 or private financial schedules with the court).',
      'Certifies delivery of tax returns, asset schedules, and income disclosures.'
    ],
    keyTokens: ['PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'FILING_COUNTY', 'DATE_DISCLOSURE_SERVED'],
    sampleValues: {
      DATE_DISCLOSURE_SERVED: 'June 5, 2025 by Certified Mail with return receipt.'
    }
  },
  {
    code: 'FL-142',
    title: 'Schedule of Assets and Debts',
    category: 'Financial & Disclosures (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl142.pdf',
    description: 'Comprehensive 4-page schedule detailing real estate, bank accounts, pensions, vehicles, credit cards, and liens.',
    guidelines: [
      'Served directly on opposing party; kept strictly confidential from public court file.',
      'Itemizes fair market value and date-of-separation debts.'
    ],
    keyTokens: ['PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'REAL_ESTATE_TOTAL', 'BANK_ACCOUNTS_TOTAL', 'TOTAL_UNSECURED_DEBT'],
    sampleValues: {
      REAL_ESTATE_TOTAL: '$850,000.00 (Equity approx $320,000.00)',
      BANK_ACCOUNTS_TOTAL: '$48,250.00',
      TOTAL_UNSECURED_DEBT: '$18,400.00'
    }
  },
  {
    code: 'FL-150',
    title: 'Income and Expense Declaration',
    category: 'Financial & Disclosures (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl150.pdf',
    description: 'Core 4-page judicial financial statement required for any child support, spousal support, or attorney fee request.',
    guidelines: [
      'Attach last 2 months of pay stubs or profit & loss statement.',
      'Itemize monthly rent/mortgage, health care, food, and childcare costs.',
      'Must be updated if older than 3 months at time of hearing.'
    ],
    keyTokens: [
      'PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'FILING_COUNTY',
      'EMPLOYER_NAME', 'GROSS_MONTHLY_INCOME', 'NET_MONTHLY_INCOME',
      'HOUSING_EXPENSE_MONTHLY', 'TOTAL_MONTHLY_EXPENSES'
    ],
    sampleValues: {
      EMPLOYER_NAME: 'Aegis Systems Inc., 100 Corporate Pkwy, Irvine, CA',
      GROSS_MONTHLY_INCOME: '$6,450.00',
      NET_MONTHLY_INCOME: '$4,820.00',
      HOUSING_EXPENSE_MONTHLY: '$2,200.00',
      TOTAL_MONTHLY_EXPENSES: '$4,350.00'
    }
  },
  {
    code: 'FL-160',
    title: 'Property Declaration (Community / Separate)',
    category: 'Financial & Disclosures (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl160.pdf',
    description: 'Declaration itemizing community or separate property assets and debts for court adjudication.',
    guidelines: [
      'Designate community vs separate property characterization.',
      'Can be attached to FL-100 Petition, FL-120 Response, or Default Judgment.'
    ],
    keyTokens: ['PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'PROPERTY_TYPE_CHECKED', 'TOTAL_GROSS_FAIR_MARKET_VALUE'],
    sampleValues: {
      PROPERTY_TYPE_CHECKED: 'Community Property',
      TOTAL_GROSS_FAIR_MARKET_VALUE: '$940,000.00'
    }
  },
  {
    code: 'FL-180',
    title: 'Judgment (Family Law)',
    category: 'Family Law (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl180.pdf',
    description: 'Final judicial decree entered by the judge establishing dissolution, custody orders, support, and property distribution.',
    guidelines: [
      'Signed by the Superior Court Judge.',
      'Incorporates Marital Settlement Agreement or formal statement of decision.',
      'Sets official date of restoration to single status.'
    ],
    keyTokens: ['PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'FILING_COUNTY', 'JUDGMENT_DATE', 'SINGLE_STATUS_DATE'],
    sampleValues: {
      JUDGMENT_DATE: 'October 14, 2025',
      SINGLE_STATUS_DATE: 'December 20, 2025 (6 months after service)'
    }
  },
  {
    code: 'FL-300',
    title: 'Request for Order (RFO)',
    category: 'Family Law (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl300.pdf',
    description: 'Primary motion form to set a court hearing for temporary child custody, visitation, spousal support, or fee contribution.',
    guidelines: [
      'Notice of hearing date assigned by clerk upon filing.',
      'Must be served on other party at least 16 court days before hearing.',
      'Attach factual declaration demonstrating change of circumstances.'
    ],
    keyTokens: [
      'PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'FILING_COUNTY',
      'HEARING_DATE_TIME', 'COURT_DEPARTMENT', 'RELIEF_REQUESTED_SUMMARY'
    ],
    sampleValues: {
      HEARING_DATE_TIME: 'July 24, 2025 at 8:30 AM',
      COURT_DEPARTMENT: 'Department L-64',
      RELIEF_REQUESTED_SUMMARY: 'Order for temporary child custody (50/50 schedule), guideline child support, and $3,500 contribution to attorney fees under FC § 2030.'
    }
  },
  {
    code: 'FL-311',
    title: 'Child Custody and Visitation Application Attachment',
    category: 'Family Law (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl311.pdf',
    description: 'Attachment to FL-300 or FL-100 detailing day-to-day physical custody, alternating weekends, and transportation exchange rules.',
    guidelines: [
      'Clearly specify drop-off and pick-up locations (e.g. school or neutral site).',
      'Designate holiday sharing schedules per FL-341(C).'
    ],
    keyTokens: ['PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'WEEKDAY_SCHEDULE', 'WEEKEND_ROTATION', 'EXCHANGE_LOCATION'],
    sampleValues: {
      WEEKDAY_SCHEDULE: 'Petitioner Monday-Wednesday; Respondent Wednesday-Friday.',
      WEEKEND_ROTATION: 'Alternating weekends Friday 5:00 PM to Sunday 6:00 PM.',
      EXCHANGE_LOCATION: 'Curbside at children primary school or Starbucks parking lot.'
    }
  },
  {
    code: 'FL-320',
    title: 'Responsive Declaration to Request for Order',
    category: 'Family Law (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fl320.pdf',
    description: 'Formal answer opposing or consenting to orders sought in an FL-300 motion.',
    guidelines: [
      'Must be filed and served at least 9 court days before the hearing date.',
      'Include supporting counter-declaration and financial disclosures if support is disputed.'
    ],
    keyTokens: ['PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'HEARING_DATE', 'OPPOSITION_SUMMARY'],
    sampleValues: {
      OPPOSITION_SUMMARY: 'Respondent opposes modification of physical custody; Petitioner’s proposed schedule disrupts school stability.'
    }
  },

  // ==================== DOMESTIC VIOLENCE ====================
  {
    code: 'DV-100',
    title: 'Request for Domestic Violence Restraining Order',
    category: 'Domestic Violence (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv100.pdf',
    description: 'Application for immediate temporary and permanent restraining orders protecting against abuse, harassment, or stalking.',
    guidelines: [
      'Detailed factual narrative of most recent incident and history of abuse.',
      'Can request personal conduct orders, stay-away orders (100 yards), and move-out orders.',
      'Judge reviews ex parte for immediate Temporary Restraining Order (DV-110).'
    ],
    keyTokens: [
      'PROTECTED_PERSON', 'RESTRAINED_PERSON', 'CASE_NUMBER', 'FILING_COUNTY',
      'DATE_OF_RECENT_ABUSE', 'DESCRIPTION_OF_INCIDENT', 'STAY_AWAY_DISTANCE'
    ],
    sampleValues: {
      PROTECTED_PERSON: 'Jane Doe',
      RESTRAINED_PERSON: 'John Doe',
      DATE_OF_RECENT_ABUSE: 'April 14, 2025',
      DESCRIPTION_OF_INCIDENT: 'Respondent arrived uninvited, made threatening statements, and damaged front door lock.',
      STAY_AWAY_DISTANCE: '100 Yards from Petitioner, residence, workplace, and children school.'
    }
  },
  {
    code: 'DV-109',
    title: 'Notice of Court Hearing (Domestic Violence Prevention)',
    category: 'Domestic Violence (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv109.pdf',
    description: 'Court order setting hearing date for restraining order and notifying restrained person of rights.',
    guidelines: [
      'Must be personally served on restrained person at least 5 days prior to hearing.',
      'Accompanied by DV-100, DV-110 (if issued), and blank DV-120 Response.'
    ],
    keyTokens: ['PROTECTED_PERSON', 'RESTRAINED_PERSON', 'CASE_NUMBER', 'HEARING_DATE_AND_DEPT'],
    sampleValues: {
      HEARING_DATE_AND_DEPT: 'May 8, 2025 at 8:30 AM in Dept. C-12'
    }
  },
  {
    code: 'DV-110',
    title: 'Temporary Restraining Order (CLETS-TRO)',
    category: 'Domestic Violence (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/dv110.pdf',
    description: 'Ex parte restraining order enforceable immediately by law enforcement and entered into California CLETS database.',
    guidelines: [
      'Prohibits possession of firearms or ammunition per Fam Code § 6389.',
      'Requires relinquishing firearms within 24 hours to law enforcement or licensed dealer.'
    ],
    keyTokens: ['PROTECTED_PERSON', 'RESTRAINED_PERSON', 'CASE_NUMBER', 'EXPIRATION_DATE', 'FIREARMS_RELINQUISH_ORDER'],
    sampleValues: {
      EXPIRATION_DATE: 'Midnight on scheduled court hearing date.',
      FIREARMS_RELINQUISH_ORDER: 'Mandatory immediate turn-in within 24 hours of service.'
    }
  },

  // ==================== CIVIL & GENERAL PLEADING ====================
  {
    code: 'MC-025',
    title: 'Attachment to Judicial Council Form',
    category: 'Civil & Pleading (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/mc025.pdf',
    description: 'Official multi-purpose continuation sheet for any Judicial Council pleading where additional space is required.',
    guidelines: [
      'Reference the primary form number and item number being expanded.',
      'Use sequential page numbering.'
    ],
    keyTokens: ['SHORT_TITLE', 'CASE_NUMBER', 'ATTACHMENT_NUMBER', 'ATTACHMENT_TEXT_BODY'],
    sampleValues: {
      SHORT_TITLE: 'Marriage of Doe',
      ATTACHMENT_NUMBER: 'Attachment 5 to FL-100',
      ATTACHMENT_TEXT_BODY: 'Continued factual basis for separate property reimbursement under Fam Code § 2640.'
    }
  },
  {
    code: 'MC-030',
    title: 'Declaration (General Civil / Family)',
    category: 'Civil & Pleading (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/mc030.pdf',
    description: 'Sworn factual declaration under penalty of perjury for submission in any California Superior Court proceeding.',
    guidelines: [
      'Must contain only personal knowledge facts admissible under California Evidence Code.',
      'Concludes with mandatory statutory declaration under penalty of perjury.'
    ],
    keyTokens: ['DECLARANT_NAME', 'CASE_NUMBER', 'FILING_COUNTY', 'STATEMENT_OF_FACTS'],
    sampleValues: {
      DECLARANT_NAME: 'Jane Doe',
      STATEMENT_OF_FACTS: 'I, Jane Doe, declare that on the morning of May 15, 2025, the following events transpired...'
    }
  },
  {
    code: 'POS-040',
    title: 'Proof of Service—Civil (Proof of Service by Mail / Personal)',
    category: 'Civil & Pleading (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/pos040.pdf',
    description: 'Universal proof of service for civil motions, oppositions, discovery requests, and general court filings.',
    guidelines: [
      'Executed by neutral third-party server over 18.',
      'Identifies each document title served, date mailed or personally delivered.'
    ],
    keyTokens: ['SERVER_NAME', 'SERVER_ADDRESS', 'CASE_NUMBER', 'DOCUMENTS_SERVED_LIST', 'DATE_AND_MANNER_OF_SERVICE'],
    sampleValues: {
      SERVER_NAME: 'Sarah Connor',
      SERVER_ADDRESS: '700 Flower St, Los Angeles, CA 90017',
      DOCUMENTS_SERVED_LIST: 'Notice of Motion and Motion to Compel Discovery; Declaration of Counsel; Proposed Order',
      DATE_AND_MANNER_OF_SERVICE: 'June 10, 2025 by First Class Mail with postage prepaid.'
    }
  },
  {
    code: 'CIV-100',
    title: 'Request for Entry of Default (Civil & General)',
    category: 'Civil & Pleading (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/civ100.pdf',
    description: 'Request to clerk for entry of default against a defendant who failed to answer within the statutory response window.',
    guidelines: [
      'Requires proof of service of summons filed on record.',
      'Includes declaration of non-military status under Servicemembers Civil Relief Act.'
    ],
    keyTokens: ['PLAINTIFF_NAME', 'DEFENDANT_NAME', 'CASE_NUMBER', 'DEFAULT_AMOUNT_REQUESTED'],
    sampleValues: {
      PLAINTIFF_NAME: 'Aegis Technologies LLC',
      DEFENDANT_NAME: 'Vortex Global Enterprises Inc.',
      DEFAULT_AMOUNT_REQUESTED: '$42,500.00 principal plus $1,250 costs.'
    }
  },
  {
    code: 'CM-010',
    title: 'Civil Case Cover Sheet',
    category: 'Civil & Pleading (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/cm010.pdf',
    description: 'Mandatory cover sheet filed with the initial civil complaint classifying case type and complex litigation designation.',
    guidelines: [
      'Select case type: Breach of contract, personal injury, employment, or property.',
      'Indicate whether case is unlimited (>$35,000) or limited (≤$35,000).'
    ],
    keyTokens: ['PLAINTIFF_NAME', 'DEFENDANT_NAME', 'CASE_NUMBER', 'CASE_TYPE_DESIGNATION', 'IS_COMPLEX_LITIGATION'],
    sampleValues: {
      CASE_TYPE_DESIGNATION: 'Contract: Other Commercial / Business Tort (07)',
      IS_COMPLEX_LITIGATION: 'No'
    }
  },
  {
    code: 'EJ-130',
    title: 'Writ of Execution (Money Judgment)',
    category: 'Civil & Pleading (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/ej130.pdf',
    description: 'Writ issued by court clerk directing county sheriff to levy upon bank accounts, wages, or real property to satisfy money judgment.',
    guidelines: [
      'States exact principal judgment, accrued 10% statutory interest, and court costs.',
      'Directed to Sheriff of target county.'
    ],
    keyTokens: ['JUDGMENT_CREDITOR', 'JUDGMENT_DEBTOR', 'CASE_NUMBER', 'TARGET_COUNTY_SHERIFF', 'TOTAL_JUDGMENT_BALANCE'],
    sampleValues: {
      JUDGMENT_CREDITOR: 'Jane Doe',
      JUDGMENT_DEBTOR: 'John Doe',
      TARGET_COUNTY_SHERIFF: 'Sheriff of Orange County, Civil Process Division',
      TOTAL_JUDGMENT_BALANCE: '$28,450.00'
    }
  },

  // ==================== FEE WAIVERS ====================
  {
    code: 'FW-001',
    title: 'Request to Waive Court Fees',
    category: 'Fee Waiver (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fw001.pdf',
    description: 'Application for waiver of initial filing fees based on public assistance, low household income, or financial inability.',
    guidelines: [
      'Qualifying public benefits: Medi-Cal, CalFresh, SSI, CalWORKs, or General Assistance.',
      'Income must be below 125% of Federal Poverty Guidelines or unable to pay without basic hardship.'
    ],
    keyTokens: ['APPLICANT_NAME', 'CASE_NUMBER', 'FILING_COUNTY', 'BENEFIT_TYPE_CHECKED', 'GROSS_MONTHLY_HOUSEHOLD_INCOME'],
    sampleValues: {
      APPLICANT_NAME: 'Jane Doe',
      BENEFIT_TYPE_CHECKED: 'Medi-Cal / CalFresh',
      GROSS_MONTHLY_HOUSEHOLD_INCOME: '$1,850.00'
    }
  },
  {
    code: 'FW-003',
    title: 'Order on Court Fee Waiver (Superior Court)',
    category: 'Fee Waiver (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/fw003.pdf',
    description: 'Proposed judicial order submitted to the court clerk granting full or partial waiver of court fees.',
    guidelines: [
      'Clerk or judicial officer grants waiver within 5 court days or it is granted automatically by operation of law.'
    ],
    keyTokens: ['APPLICANT_NAME', 'CASE_NUMBER', 'FILING_COUNTY', 'ORDER_STATUS_GRANTED'],
    sampleValues: {
      ORDER_STATUS_GRANTED: 'Fee waiver granted in full. No court fees due.'
    }
  },

  // ==================== HOUSING / UNLAWFUL DETAINER ====================
  {
    code: 'UD-100',
    title: 'Complaint — Unlawful Detainer',
    category: 'Housing & Eviction (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/ud100.pdf',
    description: 'Landlord complaint to evict tenant after expiration of notice (3-Day to Pay or Quit, 30/60-Day Notice).',
    guidelines: [
      'Attach copy of rental lease agreement and verified notice served.',
      'Plead compliance with California Tenant Protection Act of 2019 (AB 1482) just cause requirements.'
    ],
    keyTokens: ['PLAINTIFF_LANDLORD', 'DEFENDANT_TENANT', 'PREMISES_ADDRESS', 'MONTHLY_RENT', 'PAST_DUE_RENT_AMOUNT'],
    sampleValues: {
      PLAINTIFF_LANDLORD: 'Beacon Crest Properties LLC',
      DEFENDANT_TENANT: 'David Miller',
      PREMISES_ADDRESS: '1422 Elm Street, Apt 3B, Long Beach, CA 90802',
      MONTHLY_RENT: '$2,100.00',
      PAST_DUE_RENT_AMOUNT: '$4,200.00'
    }
  },
  {
    code: 'UD-105',
    title: 'Answer — Unlawful Detainer',
    category: 'Housing & Eviction (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/ud105.pdf',
    description: 'Tenant’s formal defense to eviction complaint alleging affirmative defenses (habitability, retaliation, defective notice).',
    guidelines: [
      'Tenant has strictly 5 court days to file and serve answer after personal service of UD-100.',
      'Check affirmative defenses: Breach of warranty of habitability (Civ Code § 1941.1), retaliatory eviction (Civ Code § 1942.5).'
    ],
    keyTokens: ['DEFENDANT_TENANT', 'PLAINTIFF_LANDLORD', 'CASE_NUMBER', 'HABITABILITY_DEFECTS_LIST'],
    sampleValues: {
      HABITABILITY_DEFECTS_LIST: 'Severe plumbing leaks, black mold in bathroom, and lack of functioning heating during winter months.'
    }
  },

  // ==================== PROBATE & GUARDIANSHIP ====================
  {
    code: 'GC-210',
    title: 'Petition for Appointment of Guardian of Minor',
    category: 'Probate & Guardianship (CA)',
    jurisdiction: 'Superior Court of California',
    pdfUrl: 'https://www.courts.ca.gov/documents/gc210.pdf',
    description: 'Petition seeking legal guardianship over person and/or estate of a minor child when parents cannot provide care.',
    guidelines: [
      'Requires UCCJEA Declaration (FL-105/GC-120) and Confidential Screening Form (GC-212).',
      'Court investigator conducts home study before hearing.'
    ],
    keyTokens: ['PROPOSED_GUARDIAN', 'MINOR_CHILD_NAME', 'MINOR_DOB', 'PARENTS_NAMES', 'REASON_GUARDIANSHIP_NEEDED'],
    sampleValues: {
      PROPOSED_GUARDIAN: 'Martha Vance (Maternal Grandmother)',
      MINOR_CHILD_NAME: 'Lucas Vance Doe',
      MINOR_DOB: 'March 14, 2018',
      PARENTS_NAMES: 'Jane Doe and John Doe',
      REASON_GUARDIANSHIP_NEEDED: 'Parents undergoing intensive medical rehabilitation and cannot maintain stable daily residence.'
    }
  },

  // ==================== FEDERAL BANKRUPTCY ====================
  {
    code: 'Official Form B 101',
    title: 'Voluntary Petition for Individuals Filing for Bankruptcy',
    category: 'Bankruptcy (Chapter 7)',
    jurisdiction: 'United States Bankruptcy Court',
    pdfUrl: 'https://www.uscourts.gov/sites/default/files/form_b_101.pdf',
    description: 'Official federal petition filed to initiate Chapter 7 or Chapter 13 liquidation or reorganization.',
    guidelines: [
      'Triggers 11 U.S.C. § 362 automatic stay halting foreclosures, repossessions, and lawsuits.',
      'Requires pre-bankruptcy credit counseling certificate within past 180 days.'
    ],
    keyTokens: ['DEBTOR_NAME', 'DEBTOR_SSN_LAST4', 'BANKRUPTCY_DISTRICT', 'CHAPTER_ELECTED', 'PRIOR_BANKRUPTCY_CASES'],
    sampleValues: {
      DEBTOR_NAME: 'David Miller',
      DEBTOR_SSN_LAST4: '4192',
      BANKRUPTCY_DISTRICT: 'Central District of California (Santa Ana Division)',
      CHAPTER_ELECTED: 'Chapter 7 (Liquidation)',
      PRIOR_BANKRUPTCY_CASES: 'None within past 8 years.'
    }
  },
  {
    code: 'Official Form B 106A/B',
    title: 'Schedule A/B: Property (Real Estate & Personal Property)',
    category: 'Bankruptcy (Chapter 7)',
    jurisdiction: 'United States Bankruptcy Court',
    pdfUrl: 'https://www.uscourts.gov/sites/default/files/form_b_106ab.pdf',
    description: 'Federal bankruptcy schedule itemizing all real estate, vehicles, household items, bank deposits, and claims.',
    guidelines: [
      'Disclose all world-wide property interests whether held solely, jointly, or in trust.',
      'Valuation based on current liquidation replacement value.'
    ],
    keyTokens: ['DEBTOR_NAME', 'CASE_NUMBER', 'REAL_ESTATE_TOTAL', 'PERSONAL_PROPERTY_TOTAL'],
    sampleValues: {
      REAL_ESTATE_TOTAL: '$0.00 (Debtor is residential tenant)',
      PERSONAL_PROPERTY_TOTAL: '$14,200.00 (2016 Honda Civic, basic household effects)'
    }
  },
  {
    code: 'Official Form B 106C',
    title: 'Schedule C: The Property You Claim as Exempt',
    category: 'Bankruptcy (Chapter 7)',
    jurisdiction: 'United States Bankruptcy Court',
    pdfUrl: 'https://www.uscourts.gov/sites/default/files/form_b_106c.pdf',
    description: 'Claims statutory exemptions protecting vehicle, clothing, household goods, and wildcard cash.',
    guidelines: [
      'Elect either CA System 1 (CCP § 704 homestead) or System 2 (CCP § 703 wildcard).',
      'Matches every dollar of exempt property to exact statutory subsection.'
    ],
    keyTokens: ['DEBTOR_NAME', 'CASE_NUMBER', 'EXEMPTION_SYSTEM_ELECTED', 'WILDCARD_EXEMPTION_CLAIMED'],
    sampleValues: {
      EXEMPTION_SYSTEM_ELECTED: 'California CCP § 703.140(b) System 2',
      WILDCARD_EXEMPTION_CLAIMED: '$12,400.00 cash wildcard under CCP § 703.140(b)(5)'
    }
  }
];

/**
 * Normalizes any form code string (e.g. "FL 100", "fl-115", "mc025") into clean court URL
 */
export function buildCourtPdfUrl(codeOrUrl: string): string {
  const trimmed = codeOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Federal form check
  if (trimmed.toLowerCase().includes('form b') || trimmed.toLowerCase().startsWith('b-') || trimmed.toLowerCase().startsWith('b 1')) {
    const cleanB = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `https://www.uscourts.gov/sites/default/files/${cleanB}.pdf`;
  }

  // California court form standard pattern: https://www.courts.ca.gov/documents/[cleaned].pdf
  const caCode = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://www.courts.ca.gov/documents/${caCode}.pdf`;
}

/**
 * Synthesizes or retrieves a complete DocumentTemplate from an online Judicial Council form
 */
export function generateTemplateFromJudicialForm(meta: OnlineJudicialFormMetadata): DocumentTemplate {
  const templateId = `online-jc-${meta.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  // Build standard Judicial Council caption header
  const header = `SUPERIOR COURT OF CALIFORNIA, COUNTY OF {{Filing County}}
${meta.jurisdiction.toUpperCase()}
--------------------------------------------------------------------------------
PETITIONER / PLAINTIFF: {{Client Name}}
RESPONDENT / DEFENDANT: {{Spouse Defendant Name}}
CASE NUMBER: {{Case Number}}
ATTORNEY FOR: {{Attorney Name and Bar Number}}
COURT ADDRESS: {{Court Address}}
--------------------------------------------------------------------------------
FORM ${meta.code.toUpperCase()}: ${meta.title.toUpperCase()}
--------------------------------------------------------------------------------`;

  // Build body clauses with fillable tokens
  let bodyClauses = '';
  meta.keyTokens.forEach((tok, idx) => {
    const cleanTok = tok.replace(/_/g, ' ');
    bodyClauses += `\n${idx + 1}. ${cleanTok.toUpperCase()}:\n   {{${cleanTok}}}\n`;
  });

  const declarationPerjury = `\nI declare under penalty of perjury under the laws of the State of California and the United States of America that the foregoing information and attachments are true and correct.\n\nDate: {{Current Date}}\n\n_____________________________________________\nSignature of Declarant / Party\n{{Client Name}}`;

  const templateBody = `${header}\n\nPURPOSE & STATUTORY NOTICE:\n${meta.description}\n${bodyClauses}\n${declarationPerjury}`;

  return {
    id: templateId,
    name: `CA ${meta.code}: ${meta.title}`,
    category: meta.category,
    description: `Official Judicial Council form ${meta.code}. Downloaded from online court repository. ${meta.description}`,
    defaultQuestions: meta.keyTokens.map(t => t.replace(/_/g, ' ')),
    templateBody
  };
}

/**
 * Synthesizes a CourtFormSchema for the Judicial Council Mapper with coordinate variable mappings
 */
export function generateSchemaFromJudicialForm(meta: OnlineJudicialFormMetadata, client?: Client | null): CourtFormSchema {
  const schemaId = `schema-${meta.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const standardMappings = [
    { fieldName: 'ATTORNEY_OR_PARTY_WITHOUT_ATTORNEY', token: 'client.attorney', value: 'Alex, Esq. (State Bar 232323)', isRequired: true },
    { fieldName: 'SUPERIOR_COURT_OF_CALIFORNIA_COUNTY', token: 'client.county', value: (client as any)?.county || 'ORANGE COUNTY', isRequired: true },
    { fieldName: 'PETITIONER_NAME', token: 'client.name', value: client?.name || 'Jane Doe', isRequired: true },
    { fieldName: 'RESPONDENT_NAME', token: 'spouse_or_defendant', value: (client as any)?.spouseName || (client as any)?.opposingParty || 'John Doe', isRequired: true },
    { fieldName: 'CASE_NUMBER', token: 'client.caseNumber', value: (client as any)?.caseNumber || `FL-2026-${client?.id?.slice(0, 6) || '99201'}`, isRequired: true }
  ];

  const customMappings = meta.keyTokens
    .filter(k => !['PETITIONER_NAME', 'RESPONDENT_NAME', 'CASE_NUMBER', 'FILING_COUNTY'].includes(k))
    .map(k => {
      const sampleVal = meta.sampleValues[k] || `[Parsed ${k.replace(/_/g, ' ')}]`;
      return {
        fieldName: k,
        token: `intake.${k.toLowerCase()}`,
        value: sampleVal,
        isRequired: false
      };
    });

  return {
    id: schemaId,
    formNumber: meta.code,
    formTitle: meta.title,
    courtSystem: meta.jurisdiction,
    mappings: [...standardMappings, ...customMappings]
  };
}

/**
 * Saves a downloaded/grabbed template to client persistent storage and fires custom event
 */
export function saveHarvestedTemplate(template: DocumentTemplate): void {
  try {
    const saved = localStorage.getItem('level23_templates_v2');
    let templatesList: DocumentTemplate[] = [];
    if (saved) {
      try {
        templatesList = JSON.parse(saved);
      } catch (e) {}
    }
    // Check if already exists; replace or prepend
    const existingIndex = templatesList.findIndex(t => t.id === template.id || t.name === template.name);
    if (existingIndex >= 0) {
      templatesList[existingIndex] = template;
    } else {
      templatesList = [template, ...templatesList];
    }
    localStorage.setItem('level23_templates_v2', JSON.stringify(templatesList));

    // Also notify listeners
    window.dispatchEvent(new CustomEvent('l23_templates_updated', { detail: { template } }));
  } catch (err) {
    console.error('Failed to save template to localStorage:', err);
  }
}

/**
 * Saves a CourtFormSchema to client persistent storage and fires custom event
 */
export function saveHarvestedCourtFormSchema(schema: CourtFormSchema): void {
  try {
    const saved = localStorage.getItem('level23_court_forms_v1');
    let schemasList: CourtFormSchema[] = [];
    if (saved) {
      try {
        schemasList = JSON.parse(saved);
      } catch (e) {}
    }
    const existingIndex = schemasList.findIndex(s => s.formNumber === schema.formNumber || s.id === schema.id);
    if (existingIndex >= 0) {
      schemasList[existingIndex] = schema;
    } else {
      schemasList = [schema, ...schemasList];
    }
    localStorage.setItem('level23_court_forms_v1', JSON.stringify(schemasList));

    window.dispatchEvent(new CustomEvent('l23_court_forms_updated', { detail: { schema } }));
  } catch (err) {
    console.error('Failed to save court form schema to localStorage:', err);
  }
}

/**
 * Triggers direct browser download of the official court form PDF
 */
export function triggerDirectCourtPdfDownload(pdfUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.target = '_blank';
  link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
