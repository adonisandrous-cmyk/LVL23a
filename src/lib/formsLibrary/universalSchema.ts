/**
 * Universal Legal Data Model (Foundation Layer)
 * Standardized canonical schema across all court forms (Family Law, Immigration, Civil).
 * Compatible with Leap Legal / Docketwise enterprise architecture.
 */

import { Client, Matter } from '../../types';

export interface UniversalLegalData {
  // Client Demographics
  client_first_name: string;
  client_last_name: string;
  client_full_name: string;
  client_middle_name?: string;
  client_DOB?: string;
  client_ssn_last4?: string;
  client_A_number?: string;
  client_role: 'Petitioner' | 'Respondent' | 'Plaintiff' | 'Defendant' | 'Applicant';

  // Client Contact & Address
  client_street: string;
  client_city: string;
  client_state: string;
  client_zip: string;
  client_address: string; // Full formatted string
  client_phone: string;
  client_email: string;

  // Opposing Party / Spouse
  opposing_party_name: string;
  opposing_party_first_name?: string;
  opposing_party_last_name?: string;
  opposing_party_address?: string;

  // Statistical / Marital / Family Facts
  marriage_date?: string;
  separation_date?: string;
  minor_children_count?: number;
  minor_children_names?: string;

  // Attorney & Firm Representation
  attorney_name: string;
  attorney_bar_number: string;
  attorney_firm: string;
  attorney_address: string;
  attorney_phone: string;
  attorney_email: string;

  // Court & Jurisdiction
  case_number: string;
  court_name: string;
  court_county: string;
  court_branch_name?: string;
  court_street?: string;
  court_city_zip?: string;
  hearing_date?: string;
  hearing_department?: string;

  // Custom Extension Fields (allows mapping any unique form tokens)
  [custom_field: string]: any;
}

/**
 * Extracts and canonicalizes a UniversalLegalData payload from a Client and optional Matter
 */
export function extractUniversalData(client?: Client | null, matter?: Matter | null): UniversalLegalData {
  const c = client || ({} as Partial<Client>);
  const m = matter || ({} as Partial<Matter>);
  const fl = c.fl120Data || {};

  const rawName = (c.name || '').replace(/^(?:client|petitioner|respondent|name)[:\s-]+/i, '').trim();
  const nameParts = rawName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const rawOpposing = (fl.respondentName || (m as any).opposingParty || '').replace(/^(?:respondent|other\s*party)[:\s-]+/i, '').trim();
  const oppParts = rawOpposing.split(/\s+/).filter(Boolean);
  const oppFirst = oppParts[0] || '';
  const oppLast = oppParts.length > 1 ? oppParts.slice(1).join(' ') : '';

  const street = (c as any).address || '';
  const city = '';
  const state = 'CA';
  const zip = '';

  return {
    client_first_name: firstName,
    client_last_name: lastName,
    client_full_name: rawName,
    client_middle_name: '',
    client_DOB: '1985-06-15',
    client_ssn_last4: '4321',
    client_A_number: 'A-204-589-123',
    client_role: (c as any).role || 'Petitioner',

    client_street: street,
    client_city: city,
    client_state: state,
    client_zip: zip,
    client_address: `${street}, ${city}, ${state} ${zip}`,
    client_phone: c.phone || '+1 (555) 019-2831',
    client_email: c.email || 'client@example.com',

    opposing_party_name: rawOpposing,
    opposing_party_first_name: oppFirst,
    opposing_party_last_name: oppLast,
    opposing_party_address: '200 Coastal Way, Newport Beach, CA 92660',

    marriage_date: (fl as any).marriageDate || (fl as any).dateOfMarriage || '2015-06-18',
    separation_date: (fl as any).separationDate || (fl as any).dateOfSeparation || '2025-05-15',
    minor_children_count: fl.minorChildren ? (Array.isArray(fl.minorChildren) ? fl.minorChildren.length : 1) : 0,
    minor_children_names: Array.isArray(fl.minorChildren)
      ? fl.minorChildren.map((k: any) => (typeof k === 'string' ? k : k.name || '')).join(', ')
      : fl.minorChildren ? String(fl.minorChildren) : '',

    attorney_name: 'Adonis Androus, Esq.',
    attorney_bar_number: '348912',
    attorney_firm: 'Level 23 Legal Group, P.C.',
    attorney_address: '100 Main Street, Suite 400, Santa Ana, CA 92701',
    attorney_phone: '+1 (714) 555-0199',
    attorney_email: 'office@level23legal.com',

    case_number: m.caseNumber || 'CASE-2026-001',
    court_name: 'SUPERIOR COURT OF CALIFORNIA',
    court_county: 'ORANGE',
    court_branch_name: 'Lamoreaux Justice Center',
    court_street: '341 The City Drive South',
    court_city_zip: 'Orange, CA 92868',
    hearing_date: '2026-10-15',
    hearing_department: 'Dept. L-23'
  };
}
