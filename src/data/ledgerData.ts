import { ClientLedger, LedgerEntry } from '../types';

export const INITIAL_LEDGERS: Record<string, ClientLedger> = {};

const STORAGE_KEY = 'l23_firm_client_ledgers';

export function getStoredLedgers(): Record<string, ClientLedger> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...INITIAL_LEDGERS, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error loading stored ledgers:', e);
  }
  return INITIAL_LEDGERS;
}

export function saveStoredLedgers(ledgers: Record<string, ClientLedger>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ledgers));
  } catch (e) {
    console.error('Error saving ledgers to localStorage:', e);
  }
}

export function getOrCreateClientLedger(clientId: string, clientName?: string, practiceArea?: string): ClientLedger {
  const allLedgers = getStoredLedgers();
  if (allLedgers[clientId]) {
    return allLedgers[clientId];
  }

  // Generate a clean default ledger for newly created or imported clients
  const defaultLedger: ClientLedger = {
    clientId,
    trustBalance: 0,
    operatingBalance: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    unbilledHours: 0,
    hourlyRate: 350,
    lastBillingDate: new Date().toISOString().split('T')[0],
    entries: []
  };

  allLedgers[clientId] = defaultLedger;
  saveStoredLedgers(allLedgers);
  return defaultLedger;
}

export function addLedgerTransaction(
  clientId: string,
  entry: Omit<LedgerEntry, 'id' | 'balanceAfter' | 'trustBalanceAfter'>
): ClientLedger {
  const allLedgers = getStoredLedgers();
  const ledger = getOrCreateClientLedger(clientId);

  const isTrust = entry.category === 'IOLTA Trust' || entry.type === 'trust_deposit' || entry.type === 'trust_disbursement';
  const newTrustBalance = isTrust 
    ? Math.max(0, ledger.trustBalance + entry.amount)
    : ledger.trustBalance;
    
  const newOperatingBalance = !isTrust && entry.category === 'Operating Account'
    ? ledger.operatingBalance + entry.amount
    : ledger.operatingBalance;

  const newEntry: LedgerEntry = {
    ...entry,
    id: `led-${clientId}-${Date.now()}`,
    balanceAfter: (ledger.entries[ledger.entries.length - 1]?.balanceAfter || 0) + entry.amount,
    trustBalanceAfter: newTrustBalance
  };

  const updatedLedger: ClientLedger = {
    ...ledger,
    trustBalance: newTrustBalance,
    operatingBalance: newOperatingBalance,
    totalInvoiced: entry.type === 'invoice_issued' ? ledger.totalInvoiced + entry.amount : ledger.totalInvoiced,
    totalPaid: entry.type === 'payment_received' ? ledger.totalPaid + entry.amount : ledger.totalPaid,
    entries: [newEntry, ...ledger.entries]
  };

  allLedgers[clientId] = updatedLedger;
  saveStoredLedgers(allLedgers);
  return updatedLedger;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}
