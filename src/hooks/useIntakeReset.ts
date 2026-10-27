import { useCallback } from 'react';

export interface PristineClientState {
  refId: string | null;
  fullName: string;
  dob: string;
  email: string;
  phone: string;
  occupation: string;
  address: string;
  opposingParty: string;
  dateOfMarriage: string;
  separationDate: string;
  filingCourt: string;
  caseNumber: string;
  minorChildren: Array<{ name?: string; dob?: string; age?: number }>;
  custodyRelief: { legal: string; physical: string };
  communityProperty: string;
  primaryRisks: string;
}

export const PRISTINE_CLIENT_STATE: PristineClientState = {
  refId: null,
  fullName: '',
  dob: '',
  email: '',
  phone: '',
  occupation: '',
  address: '',
  opposingParty: '',
  dateOfMarriage: '',
  separationDate: '',
  filingCourt: '',
  caseNumber: '',
  minorChildren: [],
  custodyRelief: { legal: '', physical: '' },
  communityProperty: '',
  primaryRisks: ''
};

export function useIntakeReset(
  setClientState?: ((state: any) => void) | Function,
  setCachedProfiles?: ((profiles: any[]) => void) | Function,
  onAfterReset?: () => void
) {
  const handleEraseAndReset = useCallback(() => {
    // 1. Flush active client profile schema back to pristine defaults
    if (typeof setClientState === 'function') {
      setClientState({ ...PRISTINE_CLIENT_STATE });
    }

    // 2. Clear cached buffer streams to prevent previous client bleed
    if (typeof setCachedProfiles === 'function') {
      setCachedProfiles([]);
    }

    // 3. Purge temporary local storage/session markers
    try {
      sessionStorage.removeItem('phoenix_active_intake_id');
      sessionStorage.removeItem('phoenix_active_session_token');
      localStorage.removeItem('active_staged_documents');
      localStorage.removeItem('phoenix_extracted_intake_cache');
      localStorage.removeItem('phoenix_agent3_context_memory');
    } catch {
      // In case of restricted storage environments
    }

    // 4. Reset backend in-memory intake cache if accessible
    fetch('/api/phoenix/reset-intake-state', { method: 'POST' }).catch(() => {
      // Non-blocking background flush
    });

    if (onAfterReset) {
      onAfterReset();
    }

    console.info('Phoenix Pipeline: State successfully wiped for new client intake.');
  }, [setClientState, setCachedProfiles, onAfterReset]);

  return { handleEraseAndReset, PRISTINE_CLIENT_STATE };
}
