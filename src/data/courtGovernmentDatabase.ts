/**
 * COURT & GOVERNMENT (DA) DIRECTORY DATABASE
 * Accommodates court venue, courthouse address, presiding judges,
 * District Attorney (DA) offices, and government agency contact info.
 * Linked to the Client Data Card and staged for autopopulation.
 */

export interface CourtGovernmentRecord {
  id: string;
  countyOrJurisdiction: string;
  courtName: string;
  courthouseName: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  presidingJudge: string;
  departmentOrDivision: string;
  clerkFilingPortal: string;
  districtAttorneyName: string;
  districtAttorneyDivision: string;
  districtAttorneyAddress: string;
  districtAttorneyPhone: string;
  districtAttorneyEmail: string;
  districtAttorneyContact: string;
  stagedForAutopopulation: boolean;
  notes: string;
}

export const COURT_GOVERNMENT_DIRECTORY: CourtGovernmentRecord[] = [
  {
    id: 'court-sacramento-ridgeway',
    countyOrJurisdiction: 'Sacramento',
    courtName: 'Superior Court of California, County of Sacramento',
    courthouseName: 'William R. Ridgeway Family Relations Courthouse',
    streetAddress: '3341 Power Inn Road',
    city: 'Sacramento',
    state: 'CA',
    zip: '95826',
    phone: '(916) 875-3400',
    presidingJudge: 'Hon. Laurie M. Earl / Presiding Family Law Bench',
    departmentOrDivision: 'Family Law & Domestic Relations Department',
    clerkFilingPortal: 'Sacramento Superior Court e-Filing (eCourt / Odyssey Portal)',
    districtAttorneyName: 'Sacramento County District Attorney',
    districtAttorneyDivision: 'Child Support Services & Family Protection Bureau',
    districtAttorneyAddress: '901 G Street, Sacramento, CA 95814',
    districtAttorneyPhone: '(916) 874-6218',
    districtAttorneyEmail: 'daoffice@sacda.org',
    districtAttorneyContact: 'Thien Ho, District Attorney | Family Support Liaison',
    stagedForAutopopulation: true,
    notes: 'Primary jurisdiction for Sacramento family dissolution, UCCJEA custody, and support enforcement proceedings.'
  },
  {
    id: 'court-orange-lamoreaux',
    countyOrJurisdiction: 'Orange County',
    courtName: 'Superior Court of California, County of Orange',
    courthouseName: 'Lamoreaux Justice Center',
    streetAddress: '341 The City Drive South',
    city: 'Orange',
    state: 'CA',
    zip: '92868',
    phone: '(657) 622-6000',
    presidingJudge: 'Hon. Maria D. Hernandez',
    departmentOrDivision: 'Family Law Operations Center',
    clerkFilingPortal: 'Orange County Superior Court Odyssey eFileCA',
    districtAttorneyName: 'Orange County District Attorney',
    districtAttorneyDivision: 'Family Protection & Child Abduction Unit',
    districtAttorneyAddress: '300 N Flower Street, Santa Ana, CA 92703',
    districtAttorneyPhone: '(714) 834-3600',
    districtAttorneyEmail: 'info@da.ocgov.com',
    districtAttorneyContact: 'Todd Spitzer, District Attorney',
    stagedForAutopopulation: true,
    notes: 'Central Orange County domestic relations venue.'
  },
  {
    id: 'court-la-mosk',
    countyOrJurisdiction: 'Los Angeles',
    courtName: 'Superior Court of California, County of Los Angeles',
    courthouseName: 'Stanley Mosk Courthouse',
    streetAddress: '111 N. Hill Street',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90012',
    phone: '(213) 830-0800',
    presidingJudge: 'Hon. Samantha P. Jessner',
    departmentOrDivision: 'Central Family Law District',
    clerkFilingPortal: 'LACourt.org Odyssey File & Serve Portal',
    districtAttorneyName: 'Los Angeles County District Attorney',
    districtAttorneyDivision: 'Family Violence & Protection Division',
    districtAttorneyAddress: '211 W. Temple Street, Suite 1200, Los Angeles, CA 90012',
    districtAttorneyPhone: '(213) 974-3512',
    districtAttorneyEmail: 'contact@da.lacounty.gov',
    districtAttorneyContact: 'George Gascón, District Attorney',
    stagedForAutopopulation: true,
    notes: 'Central Los Angeles county civil and family division.'
  },
  {
    id: 'court-sf-civic',
    countyOrJurisdiction: 'San Francisco',
    courtName: 'Superior Court of California, County of San Francisco',
    courthouseName: 'Civic Center Courthouse',
    streetAddress: '400 McAllister Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    phone: '(415) 551-4000',
    presidingJudge: 'Hon. Anne-Christine Massullo',
    departmentOrDivision: 'Unified Family Court',
    clerkFilingPortal: 'SF Superior Court Odyssey Portal',
    districtAttorneyName: 'San Francisco District Attorney',
    districtAttorneyDivision: 'Child Support & Victims Services',
    districtAttorneyAddress: '350 Rhode Island Street, San Francisco, CA 94103',
    districtAttorneyPhone: '(415) 553-1752',
    districtAttorneyEmail: 'districtattorney@sfgov.org',
    districtAttorneyContact: 'Brooke Jenkins, District Attorney',
    stagedForAutopopulation: true,
    notes: 'Unified family court serving San Francisco city and county.'
  },
  {
    id: 'court-immigration-eoir-sf',
    countyOrJurisdiction: 'Federal / Immigration (EOIR)',
    courtName: 'Executive Office for Immigration Review (EOIR)',
    courthouseName: 'San Francisco Immigration Court',
    streetAddress: '100 Montgomery Street, Suite 800',
    city: 'San Francisco',
    state: 'CA',
    zip: '94104',
    phone: '(415) 705-4400',
    presidingJudge: 'Hon. Christopher R. Seppanen / Supervisory Immigration Judge',
    departmentOrDivision: 'Executive Office for Immigration Review',
    clerkFilingPortal: 'EOIR Courts & Appeals System (ECAS)',
    districtAttorneyName: 'DHS / ICE Office of the Principal Legal Advisor (OPLA)',
    districtAttorneyDivision: 'San Francisco Chief Counsel Office',
    districtAttorneyAddress: '630 Sansome Street, Suite 1200, San Francisco, CA 94111',
    districtAttorneyPhone: '(415) 844-5200',
    districtAttorneyEmail: 'opla-sfo-service@ice.dhs.gov',
    districtAttorneyContact: 'Office of the Chief Counsel, San Francisco',
    stagedForAutopopulation: true,
    notes: 'Federal immigration court handling EOIR-33 change of address, I-589 asylum, and removal defense.'
  },
  {
    id: 'court-bankruptcy-caed',
    countyOrJurisdiction: 'Federal / Bankruptcy (E.D. Cal.)',
    courtName: 'United States Bankruptcy Court, Eastern District of California',
    courthouseName: 'Robert T. Matsui United States Courthouse',
    streetAddress: '501 I Street, Suite 3-200',
    city: 'Sacramento',
    state: 'CA',
    zip: '95814',
    phone: '(916) 930-4400',
    presidingJudge: 'Hon. Fredrick E. Clement, Chief Judge',
    departmentOrDivision: 'Sacramento Division Bankruptcy Clerk',
    clerkFilingPortal: 'CM/ECF NextGen Electronic Filing System',
    districtAttorneyName: 'United States Trustee Program — Region 17 (DOJ)',
    districtAttorneyDivision: 'Sacramento Field Office',
    districtAttorneyAddress: '501 I Street, Suite 7-500, Sacramento, CA 95814',
    districtAttorneyPhone: '(916) 930-2100',
    districtAttorneyEmail: 'USTP.Region17.SA.ECF@usdoj.gov',
    districtAttorneyContact: 'Tracy Hope Davis, United States Trustee',
    stagedForAutopopulation: true,
    notes: 'Federal jurisdiction for Chapter 7 liquidations and Chapter 13 reorganizations in Sacramento.'
  }
];

/**
 * Helper to match court and government data by county or free-text query
 */
export function lookupCourtGovernment(query?: string): CourtGovernmentRecord {
  if (!query) return COURT_GOVERNMENT_DIRECTORY[0];
  const q = query.toLowerCase();

  const match = COURT_GOVERNMENT_DIRECTORY.find(item =>
    q.includes(item.countyOrJurisdiction.toLowerCase()) ||
    q.includes(item.city.toLowerCase()) ||
    q.includes(item.courthouseName.toLowerCase()) ||
    item.countyOrJurisdiction.toLowerCase().includes(q) ||
    item.courthouseName.toLowerCase().includes(q)
  );

  return match || COURT_GOVERNMENT_DIRECTORY[0]; // Default to Sacramento Ridgeway
}
