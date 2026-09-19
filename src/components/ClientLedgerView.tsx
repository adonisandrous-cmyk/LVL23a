import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Clock,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Receipt,
  Building,
  ShieldCheck,
  Search,
  X,
  FileText
} from 'lucide-react';
import { Client, ClientLedger, LedgerEntry } from '../types';
import {
  getOrCreateClientLedger,
  addLedgerTransaction,
  formatCurrency,
  getStoredLedgers
} from '../data/ledgerData';

interface ClientLedgerDropdownProps {
  client: Client;
  isOpen: boolean;
  onToggle: () => void;
  onOpenFullLedger?: () => void;
}

export function ClientLedgerDropdown({
  client,
  isOpen,
  onToggle,
  onOpenFullLedger
}: ClientLedgerDropdownProps) {
  const [ledger, setLedger] = useState<ClientLedger>(() =>
    getOrCreateClientLedger(client.id, client.name, client.practiceArea)
  );
  const [showAddModal, setShowAddModal] = useState(false);

  // Refresh when opened
  useEffect(() => {
    if (isOpen) {
      setLedger(getOrCreateClientLedger(client.id, client.name, client.practiceArea));
    }
  }, [isOpen, client.id]);

  const handleExportCSV = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rows = [
      ['Date', 'Reference', 'Category', 'Type', 'Description', 'Amount', 'Trust Balance After', 'Status', 'Recorded By'],
      ...ledger.entries.map((entry) => [
        entry.date,
        entry.referenceNumber,
        entry.category,
        entry.type,
        `"${entry.description.replace(/"/g, '""')}"`,
        entry.amount,
        entry.trustBalanceAfter,
        entry.status,
        entry.recordedBy
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ledger_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        id={`btn-ledger-toggle-${client.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-mono flex items-center justify-between transition-all border cursor-pointer ${
          isOpen
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
            : 'bg-[#090d16]/70 hover:bg-[#111c30] border-[#1e293b] text-slate-400 hover:text-amber-300'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-sans font-medium text-xs">Financial Ledger & Trust</span>
          <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9.5px]">
            {formatCurrency(ledger.trustBalance)} IOLTA
          </span>
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-slate-300">
          <span>{isOpen ? 'Close' : 'View Ledger'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {/* Expandable Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-1.5"
          >
            <div
              id={`ledger-dropdown-body-${client.id}`}
              onClick={(e) => e.stopPropagation()}
              className="p-3 bg-[#060a12] border border-amber-500/30 rounded-xl space-y-2.5 text-left text-xs shadow-xl select-text"
            >
              {/* Ledger Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2 bg-[#090f1d] border border-emerald-500/20 rounded-lg">
                  <div className="text-[9px] font-mono text-emerald-400 uppercase font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Trust (IOLTA)</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">
                    {formatCurrency(ledger.trustBalance)}
                  </div>
                </div>

                <div className="p-2 bg-[#090f1d] border border-blue-500/20 rounded-lg">
                  <div className="text-[9px] font-mono text-blue-400 uppercase font-semibold flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    <span>Operating Retainer</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">
                    {formatCurrency(ledger.operatingBalance)}
                  </div>
                </div>

                <div className="p-2 bg-[#090f1d] border border-amber-500/20 rounded-lg col-span-2 sm:col-span-1">
                  <div className="text-[9px] font-mono text-amber-400 uppercase font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Unbilled WIP</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">
                    {ledger.unbilledHours} hrs ({formatCurrency(ledger.unbilledHours * ledger.hourlyRate)})
                  </div>
                </div>
              </div>

              {/* Transactions Mini List */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-0.5">
                  <span>Recent Ledger Transactions ({ledger.entries.length})</span>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export CSV</span>
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
                  {ledger.entries.length === 0 ? (
                    <div className="text-center py-3 text-slate-500 text-[11px] font-sans">
                      No ledger transactions recorded yet.
                    </div>
                  ) : (
                    ledger.entries.slice(0, 4).map((entry) => (
                      <div
                        key={entry.id}
                        className="p-2 bg-[#0c1424] border border-[#1e293b] rounded-lg flex items-start justify-between gap-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono text-slate-400">{entry.date}</span>
                            <span className="px-1 py-0.2 rounded text-[8px] font-mono bg-slate-800 text-slate-300">
                              {entry.referenceNumber}
                            </span>
                            <span
                              className={`px-1 py-0.2 rounded text-[8px] font-mono uppercase font-semibold ${
                                entry.category === 'IOLTA Trust'
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                  : entry.category === 'Filing Fee'
                                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                  : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {entry.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-200 truncate font-sans">{entry.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`font-mono font-bold text-xs ${
                              entry.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {entry.amount > 0 ? `+${formatCurrency(entry.amount)}` : formatCurrency(entry.amount)}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            Bal: {formatCurrency(entry.trustBalanceAfter)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddModal(true);
                  }}
                  className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-mono font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Record Deposit / Fee</span>
                </button>

                {onOpenFullLedger && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFullLedger();
                    }}
                    className="py-1.5 px-2.5 bg-[#14b8a6]/10 hover:bg-[#14b8a6]/20 text-teal-300 border border-teal-500/30 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Ledger Tab</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal
          client={client}
          onClose={() => setShowAddModal(false)}
          onAdded={(updated) => {
            setLedger(updated);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

interface AddTransactionModalProps {
  client: Client;
  onClose: () => void;
  onAdded: (updatedLedger: ClientLedger) => void;
}

export function AddTransactionModal({ client, onClose, onAdded }: AddTransactionModalProps) {
  const [category, setCategory] = useState<LedgerEntry['category']>('IOLTA Trust');
  const [type, setType] = useState<LedgerEntry['type']>('trust_deposit');
  const [amount, setAmount] = useState<string>('1500');
  const [description, setDescription] = useState<string>('Retainer Trust Deposit');
  const [referenceNumber, setReferenceNumber] = useState<string>(
    `DEP-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [isDebit, setIsDebit] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    const finalAmount = isDebit ? -numericAmount : numericAmount;

    const updated = addLedgerTransaction(client.id, {
      date: new Date().toISOString().split('T')[0],
      type,
      description: description.trim() || 'Manual Ledger Entry',
      referenceNumber: referenceNumber.trim() || 'MAN-001',
      category,
      amount: finalAmount,
      status: 'cleared',
      recordedBy: 'Senior Counsel / Billing'
    });

    onAdded(updated);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b1220] border border-amber-500/40 rounded-2.5xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left"
      >
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">Record Ledger Transaction</h3>
              <p className="text-[10px] text-slate-400 font-mono">Client: {client.name} (ID: {client.id})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Credit vs Debit Direction */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsDebit(false);
                setType('trust_deposit');
                setCategory('IOLTA Trust');
                setDescription('Client Retainer Deposit into IOLTA');
              }}
              className={`p-2.5 rounded-xl border text-center font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                !isDebit
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-[#090d16] border-[#1e293b] text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>+ Deposit / Credit</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDebit(true);
                setType('trust_disbursement');
                setCategory('Operating Account');
                setDescription('Earned Fee Disbursement / Filing Expense');
              }}
              className={`p-2.5 rounded-xl border text-center font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isDebit
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'bg-[#090d16] border-[#1e293b] text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>- Disbursement / Expense</span>
            </button>
          </div>

          {/* Category & Type */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">Account Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#070b13] border border-[#1e293b] rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500/60"
              >
                <option value="IOLTA Trust">IOLTA Trust Account</option>
                <option value="Operating Account">Operating Account</option>
                <option value="Filing Fee">Court Filing Fee</option>
                <option value="Retainer">General Retainer</option>
                <option value="Hourly Billing">Hourly Billing</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">Transaction Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[#070b13] border border-[#1e293b] rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500/60"
              >
                <option value="trust_deposit">Trust Deposit (IOLTA)</option>
                <option value="trust_disbursement">Trust Disbursement</option>
                <option value="invoice_issued">Invoice Issued</option>
                <option value="payment_received">Payment Received</option>
                <option value="expense">Expense / Court Cost</option>
                <option value="fee_earned">Earned Fee</option>
              </select>
            </div>
          </div>

          {/* Amount & Reference */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">Amount ($ USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#070b13] border border-[#1e293b] rounded-xl pl-7 pr-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">Reference / Check #</label>
              <input
                type="text"
                required
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="CHK-1002 or WIRE-44"
                className="w-full bg-[#070b13] border border-[#1e293b] rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">Description / Memo</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Retainer replenishment or FL-100 Filing Fee"
              className="w-full bg-[#070b13] border border-[#1e293b] rounded-xl px-3 py-2 text-slate-200 font-sans text-xs focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* State Bar Compliance Notice */}
          <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-[10px] text-emerald-300 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Compliant with State Bar Rule 1.15 (Trust Account Auditing & Ledger Reconciliation)</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-white font-mono text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold font-mono text-xs rounded-xl shadow-lg hover:brightness-110 transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Record to Ledger</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ClientFullLedgerViewProps {
  client: Client;
  onReturnToCard?: () => void;
}

export function ClientFullLedgerView({ client, onReturnToCard }: ClientFullLedgerViewProps) {
  const [ledger, setLedger] = useState<ClientLedger>(() =>
    getOrCreateClientLedger(client.id, client.name, client.practiceArea)
  );
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  useEffect(() => {
    setLedger(getOrCreateClientLedger(client.id, client.name, client.practiceArea));
  }, [client.id]);

  const filteredEntries = ledger.entries.filter((entry) => {
    const matchesCategory = filterCategory === 'all' || entry.category === filterCategory;
    const matchesSearch =
      searchTerm === '' ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.date.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Reference #', 'Account Category', 'Transaction Type', 'Description / Memo', 'Amount', 'Trust Balance After', 'Status', 'Recorded By'],
      ...ledger.entries.map((entry) => [
        entry.date,
        entry.referenceNumber,
        entry.category,
        entry.type,
        `"${entry.description.replace(/"/g, '""')}"`,
        entry.amount,
        entry.trustBalanceAfter,
        entry.status,
        entry.recordedBy
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Client_Ledger_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="client-full-ledger-tab-view" className="p-6 space-y-6 flex-1 select-text">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-heading font-black text-white tracking-wide uppercase">
              Financial Trust & Billing Ledger
            </h3>
            <span className="px-2 py-0.5 text-[9.5px] font-mono rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
              State Bar Rule 1.15 Audit
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Complete transaction ledger for <span className="text-white font-bold">{client.name}</span> with IOLTA trust escrow accounting and billing reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onReturnToCard && (
            <button
              type="button"
              onClick={onReturnToCard}
              className="px-3 py-2 bg-[#090d16] hover:bg-[#111c30] text-slate-400 hover:text-slate-200 border border-[#1e293b] rounded-xl text-xs font-mono transition cursor-pointer"
            >
              ← Intake Card
            </button>
          )}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-[#090d16] hover:bg-[#111c30] text-slate-300 hover:text-white border border-[#1e293b] rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold font-mono text-xs rounded-xl shadow-lg hover:brightness-110 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-gradient-to-b from-[#091522] to-[#070d17] border border-emerald-500/30 rounded-2xl space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>IOLTA Trust Funds</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-xl font-heading font-black text-white font-mono">
            {formatCurrency(ledger.trustBalance)}
          </div>
          <div className="text-[9.5px] text-slate-400 font-mono">Held in Escrow (State Bar Compliant)</div>
        </div>

        <div className="p-4 bg-gradient-to-b from-[#091522] to-[#070d17] border border-blue-500/30 rounded-2xl space-y-1 shadow-md">
          <span className="text-[10px] font-mono text-blue-400 font-semibold uppercase flex items-center gap-1">
            <Building className="w-3.5 h-3.5" />
            <span>Operating Retainer</span>
          </span>
          <div className="text-xl font-heading font-black text-white font-mono">
            {formatCurrency(ledger.operatingBalance)}
          </div>
          <div className="text-[9.5px] text-slate-400 font-mono">General Firm Account</div>
        </div>

        <div className="p-4 bg-gradient-to-b from-[#091522] to-[#070d17] border border-purple-500/30 rounded-2xl space-y-1 shadow-md">
          <span className="text-[10px] font-mono text-purple-400 font-semibold uppercase flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5" />
            <span>Total Invoiced</span>
          </span>
          <div className="text-xl font-heading font-black text-white font-mono">
            {formatCurrency(ledger.totalInvoiced)}
          </div>
          <div className="text-[9.5px] text-slate-400 font-mono">Total Paid: {formatCurrency(ledger.totalPaid)}</div>
        </div>

        <div className="p-4 bg-gradient-to-b from-[#091522] to-[#070d17] border border-amber-500/30 rounded-2xl space-y-1 shadow-md">
          <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Unbilled WIP ({ledger.unbilledHours}h)</span>
          </span>
          <div className="text-xl font-heading font-black text-amber-300 font-mono">
            {formatCurrency(ledger.unbilledHours * ledger.hourlyRate)}
          </div>
          <div className="text-[9.5px] text-slate-400 font-mono">Rate: ${ledger.hourlyRate}/hr</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search ledger by description, reference #, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 font-sans"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto">
          {['all', 'IOLTA Trust', 'Operating Account', 'Filing Fee', 'Hourly Billing'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 ${
                filterCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[#090d16] text-slate-400 border border-[#1e293b] hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Accounts' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Itemized Ledger Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#090d16]/80">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] bg-[#070b13] text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="p-3.5">Date & Ref</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Description</th>
              <th className="p-3.5">Amount</th>
              <th className="p-3.5">Trust Balance</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Recorded By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/60">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No matching ledger entries found.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#0e1626]/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-mono text-slate-200 text-xs">{entry.date}</div>
                    <div className="text-[10px] text-amber-400 font-mono">{entry.referenceNumber}</div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-semibold ${
                        entry.category === 'IOLTA Trust'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : entry.category === 'Filing Fee'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {entry.category}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="text-slate-200 font-sans font-medium">{entry.description}</div>
                    <div className="text-[10px] text-slate-500 font-mono capitalize">Type: {entry.type.replace(/_/g, ' ')}</div>
                  </td>
                  <td className="p-3.5">
                    <div
                      className={`font-mono font-bold text-xs ${
                        entry.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {entry.amount > 0 ? `+${formatCurrency(entry.amount)}` : formatCurrency(entry.amount)}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="text-slate-200 font-mono font-bold text-xs">
                      {formatCurrency(entry.trustBalanceAfter)}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {entry.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="text-slate-400 text-[10px] font-mono">{entry.recordedBy}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showAddModal && (
        <AddTransactionModal
          client={client}
          onClose={() => setShowAddModal(false)}
          onAdded={(updated) => {
            setLedger(updated);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}
