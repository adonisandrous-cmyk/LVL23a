/**
 * Firm and Attorney Profile Management
 * 
 * Provides dynamic storage for real firm and attorney credentials.
 * Defaults are strictly empty strings - no hardcoded mock data or fictional attorneys.
 */

export interface FirmAttorneyProfile {
  attorneyName: string;
  firmName: string;
  barNumber: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  fax: string;
  email: string;
}

const STORAGE_KEY = 'firm_attorney_profile';

export function getSavedFirmProfile(): FirmAttorneyProfile {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved firm profile', e);
    }
  }
  return {
    attorneyName: '',
    firmName: '',
    barNumber: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    fax: '',
    email: ''
  };
}

export function saveFirmProfile(profile: Partial<FirmAttorneyProfile>): FirmAttorneyProfile {
  const current = getSavedFirmProfile();
  const updated: FirmAttorneyProfile = {
    ...current,
    ...profile
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save firm profile', e);
    }
  }
  return updated;
}
