import { ClientLedger, LedgerEntry } from '../types';

export const INITIAL_LEDGERS: Record<string, ClientLedger> = {
  'c-0': {
    clientId: 'c-0',
    trustBalance: 6500,
    operatingBalance: 1850,
    totalInvoiced: 4200,
    totalPaid: 4200,
    unbilledHours: 4.5,
    hourlyRate: 450,
    lastBillingDate: '2026-06-15',
    entries: [
      {
        id: 'led-0-1',
        date: '2026-06-01',
        type: 'trust_deposit',
        description: 'Initial Evergreen Retainer Deposit (IOLTA Trust Account)',
        referenceNumber: 'CHK-8821',
        category: 'IOLTA Trust',
        amount: 8000,
        balanceAfter: 8000,
        trustBalanceAfter: 8000,
        status: 'cleared',
        recordedBy: 'Senior Partner A. Androus'
      },
      {
        id: 'led-0-2',
        date: '2026-06-03',
        type: 'expense',
        description: 'CA Superior Court FL-100 Initial Family Law Filing Fee & Surcharge',
        referenceNumber: 'COURT-FL-435',
        category: 'Filing Fee',
        amount: -435,
        balanceAfter: 7565,
        trustBalanceAfter: 7565,
        status: 'cleared',
        recordedBy: 'Paralegal S. Mitchell'
      },
      {
        id: 'led-0-3',
        date: '2026-06-08',
        type: 'invoice_issued',
        description: 'Invoice #INV-2026-061: Pleading drafting, asset inventory analysis, and spouse discovery review (6.0 hrs)',
        referenceNumber: 'INV-2026-061',
        category: 'Hourly Billing',
        amount: 2700,
        balanceAfter: 2700,
        trustBalanceAfter: 7565,
        status: 'cleared',
        recordedBy: 'Billing Dept.'
      },
      {
        id: 'led-0-4',
        date: '2026-06-09',
        type: 'trust_disbursement',
        description: 'Earned Trust Transfer to Operating Account for Invoice #INV-2026-061',
        referenceNumber: 'TR-DISB-109',
        category: 'IOLTA Trust',
        amount: -2700,
        balanceAfter: 4865,
        trustBalanceAfter: 4865,
        status: 'cleared',
        recordedBy: 'Trust Compliance Officer'
      },
      {
        id: 'led-0-5',
        date: '2026-06-12',
        type: 'trust_deposit',
        description: 'Supplemental Retainer Wire for Complex Valuation Expert Deposition',
        referenceNumber: 'WIRE-WATSON-90',
        category: 'IOLTA Trust',
        amount: 4335,
        balanceAfter: 9200,
        trustBalanceAfter: 9200,
        status: 'cleared',
        recordedBy: 'Senior Partner A. Androus'
      },
      {
        id: 'led-0-6',
        date: '2026-06-15',
        type: 'expense',
        description: 'Process Server Retainer: Newport Beach Respondent Subpoena Service',
        referenceNumber: 'PROC-992',
        category: 'Operating Account',
        amount: -200,
        balanceAfter: 9000,
        trustBalanceAfter: 9000,
        status: 'cleared',
        recordedBy: 'Paralegal S. Mitchell'
      }
    ]
  },
  'c-1': {
    clientId: 'c-1',
    trustBalance: 3200,
    operatingBalance: 750,
    totalInvoiced: 2850,
    totalPaid: 2850,
    unbilledHours: 2.0,
    hourlyRate: 375,
    lastBillingDate: '2026-05-20',
    entries: [
      {
        id: 'led-1-1',
        date: '2026-04-10',
        type: 'trust_deposit',
        description: 'Initial Retainer Deposit into State Bar IOLTA Trust Account',
        referenceNumber: 'ACH-VANCE-11',
        category: 'IOLTA Trust',
        amount: 5000,
        balanceAfter: 5000,
        trustBalanceAfter: 5000,
        status: 'cleared',
        recordedBy: 'Firm Administrator'
      },
      {
        id: 'led-1-2',
        date: '2026-04-12',
        type: 'expense',
        description: 'Orange County Superior Court Appearance & Docket Expedite Fee',
        referenceNumber: 'EXP-8812',
        category: 'Filing Fee',
        amount: -350,
        balanceAfter: 4650,
        trustBalanceAfter: 4650,
        status: 'cleared',
        recordedBy: 'Paralegal S. Mitchell'
      },
      {
        id: 'led-1-3',
        date: '2026-05-02',
        type: 'invoice_issued',
        description: 'Invoice #INV-2026-042: Separation Agreement & Minor Custody Schedule Drafting',
        referenceNumber: 'INV-2026-042',
        category: 'Hourly Billing',
        amount: 1450,
        balanceAfter: 1450,
        trustBalanceAfter: 4650,
        status: 'cleared',
        recordedBy: 'Billing Dept.'
      },
      {
        id: 'led-1-4',
        date: '2026-05-05',
        type: 'trust_disbursement',
        description: 'Earned Fees Transfer from Trust to Operating Account for INV-2026-042',
        referenceNumber: 'DISB-2026-44',
        category: 'IOLTA Trust',
        amount: -1450,
        balanceAfter: 3200,
        trustBalanceAfter: 3200,
        status: 'cleared',
        recordedBy: 'Trust Officer'
      }
    ]
  },
  'c-2': {
    clientId: 'c-2',
    trustBalance: 1800,
    operatingBalance: 400,
    totalInvoiced: 1600,
    totalPaid: 1600,
    unbilledHours: 3.5,
    hourlyRate: 300,
    lastBillingDate: '2026-05-10',
    entries: [
      {
        id: 'led-2-1',
        date: '2026-04-15',
        type: 'trust_deposit',
        description: 'Asylum Application Retainer - Client Trust Account',
        referenceNumber: 'CARD-ROD-09',
        category: 'IOLTA Trust',
        amount: 2500,
        balanceAfter: 2500,
        trustBalanceAfter: 2500,
        status: 'cleared',
        recordedBy: 'Intake Dept.'
      },
      {
        id: 'led-2-2',
        date: '2026-04-20',
        type: 'expense',
        description: 'USCIS Certified Document Translation & Courier Service',
        referenceNumber: 'EXP-TRAN-33',
        category: 'Operating Account',
        amount: -180,
        balanceAfter: 2320,
        trustBalanceAfter: 2320,
        status: 'cleared',
        recordedBy: 'Paralegal S. Mitchell'
      },
      {
        id: 'led-2-3',
        date: '2026-05-01',
        type: 'trust_disbursement',
        description: 'Earned Preparation Fee Transfer for I-589 Asylum Briefing',
        referenceNumber: 'DISB-771',
        category: 'IOLTA Trust',
        amount: -520,
        balanceAfter: 1800,
        trustBalanceAfter: 1800,
        status: 'cleared',
        recordedBy: 'Senior Partner A. Androus'
      }
    ]
  },
  'c-3': {
    clientId: 'c-3',
    trustBalance: 950,
    operatingBalance: 200,
    totalInvoiced: 850,
    totalPaid: 850,
    unbilledHours: 1.5,
    hourlyRate: 275,
    lastBillingDate: '2026-05-25',
    entries: [
      {
        id: 'led-3-1',
        date: '2026-05-18',
        type: 'trust_deposit',
        description: 'Chapter 7 Bankruptcy Initial Retainer Deposit',
        referenceNumber: 'CHK-MILLER-40',
        category: 'IOLTA Trust',
        amount: 1500,
        balanceAfter: 1500,
        trustBalanceAfter: 1500,
        status: 'cleared',
        recordedBy: 'Intake Dept.'
      },
      {
        id: 'led-3-2',
        date: '2026-05-20',
        type: 'expense',
        description: 'US Bankruptcy Court Central District Case Filing Fee',
        referenceNumber: 'BK-COURT-338',
        category: 'Filing Fee',
        amount: -338,
        balanceAfter: 1162,
        trustBalanceAfter: 1162,
        status: 'cleared',
        recordedBy: 'Paralegal S. Mitchell'
      },
      {
        id: 'led-3-3',
        date: '2026-05-24',
        type: 'expense',
        description: 'Mandatory Pre-Filing Credit Counseling Certificate Fee',
        referenceNumber: 'COUNS-101',
        category: 'Operating Account',
        amount: -50,
        balanceAfter: 1112,
        trustBalanceAfter: 1112,
        status: 'cleared',
        recordedBy: 'Paralegal S. Mitchell'
      }
    ]
  }
};

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

  // Generate a realistic default ledger for newly created or imported clients
  const defaultLedger: ClientLedger = {
    clientId,
    trustBalance: 2500,
    operatingBalance: 500,
    totalInvoiced: 1200,
    totalPaid: 1200,
    unbilledHours: 1.0,
    hourlyRate: 350,
    lastBillingDate: new Date().toISOString().split('T')[0],
    entries: [
      {
        id: `led-${clientId}-1`,
        date: new Date().toISOString().split('T')[0],
        type: 'trust_deposit',
        description: `Initial Retainer Deposit for ${clientName || 'Client Matter'} (${practiceArea || 'General Legal Matter'})`,
        referenceNumber: `DEP-${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'IOLTA Trust',
        amount: 2500,
        balanceAfter: 2500,
        trustBalanceAfter: 2500,
        status: 'cleared',
        recordedBy: 'Client Intake AI System'
      }
    ]
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
