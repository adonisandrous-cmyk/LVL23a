/**
 * Forms Library Layer (Leap/Docketwise Architecture)
 * Official court form definitions with exact PDF field mappings.
 */

export interface CourtFormDefinition {
  id: string;
  code: string;
  title: string;
  category: 'California Family Law' | 'Immigration' | 'Civil / General';
  jurisdiction: string;
  description: string;
  templatePdfName: string;
  fieldMap: Record<string, string>; // Universal Field Name -> PDF Form Field Name
  checkboxRules?: Record<string, string>; // Universal boolean -> PDF checkbox export value
}

export const FORMS_LIBRARY: CourtFormDefinition[] = [
  {
    id: 'fl-120',
    code: 'FL-120',
    title: 'Response — Marriage / Domestic Partnership',
    category: 'California Family Law',
    jurisdiction: 'California Judicial Council',
    description: 'Official response form filed by the Respondent contesting or accepting dissolution/legal separation.',
    templatePdfName: 'FL-120.pdf',
    fieldMap: {
      client_full_name: 'RespondentName',
      client_first_name: 'ClientFirstName',
      client_last_name: 'ClientLastName',
      client_street: 'RespondentStreet',
      client_city: 'RespondentCity',
      client_state: 'RespondentState',
      client_zip: 'RespondentZip',
      client_phone: 'RespondentPhone',
      client_email: 'RespondentEmail',
      opposing_party_name: 'PetitionerName',
      attorney_name: 'AttorneyName',
      attorney_bar_number: 'AttorneyBarNumber',
      attorney_firm: 'AttorneyFirmName',
      attorney_address: 'AttorneyAddress',
      attorney_phone: 'AttorneyPhone',
      attorney_email: 'AttorneyEmail',
      case_number: 'CaseNumber',
      court_county: 'CountyName',
      court_street: 'CourtStreet',
      court_city_zip: 'CourtCityZip',
      court_branch_name: 'BranchName',
      marriage_date: 'DateOfMarriage',
      separation_date: 'DateOfSeparation'
    }
  },
  {
    id: 'fl-100',
    code: 'FL-100',
    title: 'Petition — Marriage / Domestic Partnership',
    category: 'California Family Law',
    jurisdiction: 'California Judicial Council',
    description: 'Initial pleading filed by the Petitioner to commence dissolution, legal separation, or nullity.',
    templatePdfName: 'FL-100.pdf',
    fieldMap: {
      client_full_name: 'PetitionerName',
      client_first_name: 'ClientFirstName',
      client_last_name: 'ClientLastName',
      client_address: 'PetitionerAddress',
      client_phone: 'PetitionerPhone',
      client_email: 'PetitionerEmail',
      opposing_party_name: 'RespondentName',
      attorney_name: 'AttorneyName',
      attorney_bar_number: 'AttorneyBarNumber',
      attorney_firm: 'AttorneyFirmName',
      case_number: 'CaseNumber',
      court_county: 'CountyName',
      court_street: 'CourtStreet',
      court_city_zip: 'CourtCityZip',
      marriage_date: 'DateOfMarriage',
      separation_date: 'DateOfSeparation'
    }
  },
  {
    id: 'fl-150',
    code: 'FL-150',
    title: 'Income and Expense Declaration',
    category: 'California Family Law',
    jurisdiction: 'California Judicial Council',
    description: 'Mandatory financial disclosure detailing gross income, tax deductions, and monthly household expenses.',
    templatePdfName: 'FL-150.pdf',
    fieldMap: {
      client_full_name: 'PartyName',
      client_address: 'PartyAddress',
      client_phone: 'PartyPhone',
      client_email: 'PartyEmail',
      opposing_party_name: 'OtherPartyName',
      attorney_name: 'AttorneyName',
      attorney_bar_number: 'AttorneyBarNumber',
      case_number: 'CaseNumber',
      court_county: 'CountyName'
    }
  },
  {
    id: 'fl-300',
    code: 'FL-300',
    title: 'Request for Order (RFO)',
    category: 'California Family Law',
    jurisdiction: 'California Judicial Council',
    description: 'Motions for temporary or modified orders regarding child custody, spousal support, attorney fees, or property control.',
    templatePdfName: 'FL-300.pdf',
    fieldMap: {
      client_full_name: 'MovingPartyName',
      client_address: 'MovingPartyAddress',
      client_phone: 'MovingPartyPhone',
      opposing_party_name: 'RespondingPartyName',
      attorney_name: 'AttorneyName',
      attorney_bar_number: 'AttorneyBarNumber',
      attorney_firm: 'AttorneyFirmName',
      case_number: 'CaseNumber',
      court_county: 'CountyName',
      hearing_date: 'HearingDate',
      hearing_department: 'HearingDepartment'
    }
  },
  {
    id: 'eoir-33',
    code: 'EOIR-33',
    title: "Alien's Change of Address Form (Immigration Court)",
    category: 'Immigration',
    jurisdiction: 'Executive Office for Immigration Review (EOIR)',
    description: 'Mandatory notice of address or phone change submitted within 5 business days of relocation.',
    templatePdfName: 'EOIR-33.pdf',
    fieldMap: {
      client_full_name: 'AlienFullName',
      client_first_name: 'AlienFirstName',
      client_last_name: 'AlienLastName',
      client_A_number: 'AlienRegistrationNumber',
      client_street: 'NewStreetAddress',
      client_city: 'NewCity',
      client_state: 'NewState',
      client_zip: 'NewZipCode',
      client_phone: 'NewPhoneNumber',
      attorney_name: 'AttorneyName',
      court_name: 'ImmigrationCourtLocation'
    }
  },
  {
    id: 'i-589',
    code: 'I-589',
    title: 'Application for Asylum and for Withholding of Removal',
    category: 'Immigration',
    jurisdiction: 'USCIS / EOIR',
    description: 'Primary application for individuals seeking asylum under 8 U.S.C. 1158 or withholding of removal.',
    templatePdfName: 'I-589.pdf',
    fieldMap: {
      client_first_name: 'GivenName',
      client_last_name: 'FamilyName',
      client_full_name: 'ApplicantFullName',
      client_A_number: 'AlienRegistrationNumber',
      client_DOB: 'DateOfBirth',
      client_street: 'PhysicalStreetAddress',
      client_city: 'PhysicalCity',
      client_state: 'PhysicalState',
      client_zip: 'PhysicalZip',
      client_phone: 'TelephoneNumber',
      client_ssn_last4: 'SocialSecurityNumber'
    }
  }
];
