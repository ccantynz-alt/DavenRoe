import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

const ACCOUNTS = [
  { id: '1000', name: 'Business Cheque Account', code: '1000', institution: 'ANZ Bank', currency: 'AUD' },
  { id: '1010', name: 'Savings Account', code: '1010', institution: 'ANZ Bank', currency: 'AUD' },
  { id: '1020', name: 'USD Operating Account', code: '1020', institution: 'Wise', currency: 'USD' },
];

const INITIAL_BANK_ITEMS = [
  { id: 'b1', date: '2026-03-01', description: 'Client Payment — Meridian Corp', amount: 5200.00, type: 'credit', matchId: 'l1' },
  { id: 'b2', date: '2026-03-03', description: 'Office Rent — March', amount: -3500.00, type: 'debit', matchId: 'l2' },
  { id: 'b3', date: '2026-03-04', description: 'Xero Subscription', amount: -79.00, type: 'debit', matchId: 'l3' },
  { id: 'b4', date: '2026-03-06', description: 'Client Payment — Pinnacle Ltd', amount: 8400.00, type: 'credit', matchId: 'l4' },
  { id: 'b5', date: '2026-03-08', description: 'Supplier Payment — TechParts Ltd', amount: -4500.00, type: 'debit', matchId: 'l5' },
  { id: 'b6', date: '2026-03-10', description: 'Client Payment — Vortex Digital', amount: 12000.00, type: 'credit', matchId: 'l6' },
  { id: 'b7', date: '2026-03-11', description: 'Insurance Premium — Allianz', amount: -1850.00, type: 'debit', matchId: 'l7' },
  { id: 'b8', date: '2026-03-13', description: 'Electricity — AGL Energy', amount: -420.00, type: 'debit', matchId: 'l8' },
  { id: 'b9', date: '2026-03-15', description: 'Client Payment — Summit Holdings', amount: 15600.00, type: 'credit', matchId: 'l9' },
  { id: 'b10', date: '2026-03-17', description: 'Staff Payroll — March Wk2', amount: -18200.00, type: 'debit', matchId: 'l10' },
  { id: 'b11', date: '2026-03-19', description: 'Supplier Payment — FastFreight', amount: -800.00, type: 'debit', matchId: 'l11' },
  { id: 'b12', date: '2026-03-20', description: 'Client Payment — Apex Advisory', amount: 3400.00, type: 'credit', matchId: 'l12' },
  { id: 'b13', date: '2026-03-21', description: 'Bank Fee — Monthly Account', amount: -30.00, type: 'debit', matchId: null },
  { id: 'b14', date: '2026-03-22', description: 'Client Payment — Horizon Group', amount: 1500.00, type: 'credit', matchId: null },
  { id: 'b15', date: '2026-03-23', description: 'PayPal Transaction Fee', amount: -50.00, type: 'debit', matchId: null },
];

const INITIAL_LEDGER_ITEMS = [
  { id: 'l1', date: '2026-03-01', description: 'Invoice #1201 — Meridian Corp', amount: 5200.00, type: 'credit', matchId: 'b1' },
  { id: 'l2', date: '2026-03-03', description: 'Office Rent — 14 Collins St', amount: -3500.00, type: 'debit', matchId: 'b2' },
  { id: 'l3', date: '2026-03-04', description: 'Software Subscription — Xero', amount: -79.00, type: 'debit', matchId: 'b3' },
  { id: 'l4', date: '2026-03-06', description: 'Invoice #1205 — Pinnacle Ltd', amount: 8400.00, type: 'credit', matchId: 'b4' },
  { id: 'l5', date: '2026-03-08', description: 'Bill Payment — TechParts Ltd', amount: -4500.00, type: 'debit', matchId: 'b5' },
  { id: 'l6', date: '2026-03-10', description: 'Invoice #1210 — Vortex Digital', amount: 12000.00, type: 'credit', matchId: 'b6' },
  { id: 'l7', date: '2026-03-11', description: 'Insurance — Allianz Commercial', amount: -1850.00, type: 'debit', matchId: 'b7' },
  { id: 'l8', date: '2026-03-13', description: 'Utilities — AGL Energy', amount: -420.00, type: 'debit', matchId: 'b8' },
  { id: 'l9', date: '2026-03-15', description: 'Invoice #1218 — Summit Holdings', amount: 15600.00, type: 'credit', matchId: 'b9' },
  { id: 'l10', date: '2026-03-17', description: 'Payroll — Fortnightly Run #6', amount: -18200.00, type: 'debit', matchId: 'b10' },
  { id: 'l11', date: '2026-03-19', description: 'Bill Payment — FastFreight', amount: -800.00, type: 'debit', matchId: 'b11' },
  { id: 'l12', date: '2026-03-20', description: 'Invoice #1222 — Apex Advisory', amount: 3400.00, type: 'credit', matchId: 'b12' },
  { id: 'l13', date: '2026-03-18', description: 'Petty Cash — Office Supplies', amount: -125.00, type: 'debit', matchId: null },
  { id: 'l14', date: '2026-03-21', description: 'Journal Entry — Depreciation', amount: -840.00, type: 'debit', matchId: null },
  { id: 'l15', date: '2026-03-22', description: 'Manual Accrual — Consulting', amount: -455.00, type: 'debit', matchId: null },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

function SummaryCard({ label, value, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <motion.div {...fadeUp}>
      <Card className={cn('border-0 shadow-none', colorMap[color])}>
        <CardContent className="p-4">
          <p className="text-xs font-medium opacity-70">{label}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function BankReconciliation() {
  const [selectedAccount, setSelectedAccount] = useState(ACCOUNTS[0]);
  const [bankItems, setBankItems] = useState(INITIAL_BANK_ITEMS);
  const [ledgerItems, setLedgerItems] = useState(INITIAL_LEDGER_ITEMS);
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const toast = useToast();

  const statementBalance = 47250.00;
  const ledgerBalance = 45830.00;

  const matchedBankCount = bankItems.filter(i => i.matchId).length;
  const matchedLedgerCount = ledgerItems.filter(i => i.matchId).length;
  const unmatchedBankCount = bankItems.filter(i => !i.matchId).length;
  const unmatchedLedgerCount = ledgerItems.filter(i => !i.matchId).length;
  const difference = statementBalance - ledgerBalance;
  const isReconciled = unmatchedBankCount === 0 && unmatchedLedgerCount === 0;

  const handleBankClick = (item) => {
    if (item.matchId) return;
    setSelectedBank(prev => prev?.id === item.id ? null : item);
  };

  const handleLedgerClick = (item) => {
    if (item.matchId) return;
    if (!selectedBank) {
      setSelectedLedger(prev => prev?.id === item.id ? null : item);
      return;
    }
    if (selectedBank.amount === item.amount) {
      setBankItems(prev => prev.map(b => b.id === selectedBank.id ? { ...b, matchId: item.id } : b));
      setLedgerItems(prev => prev.map(l => l.id === item.id ? { ...l, matchId: selectedBank.id } : l));
      toast.success(`Matched: ${selectedBank.description} ↔ ${item.description}`);
      setSelectedBank(null);
      setSelectedLedger(null);
    } else {
      toast.error(`Cannot match — amounts differ ($${Math.abs(selectedBank.amount).toFixed(2)} vs $${Math.abs(item.amount).toFixed(2)})`);
    }
  };

  const handleAutoMatch = () => {
    let matches = 0;
    const unmatchedBank = bankItems.filter(b => !b.matchId);
    const unmatchedLedger = ledgerItems.filter(l => !l.matchId);
    const newBankItems = [...bankItems];
    const newLedgerItems = [...ledgerItems];
    const usedLedgerIds = new Set();

    for (const bank of unmatchedBank) {
      for (const ledger of unmatchedLedger) {
        if (usedLedgerIds.has(ledger.id)) continue;
        if (bank.amount === ledger.amount) {
          const bankWords = bank.description.toLowerCase().split(/[\s\-—]+/);
          const ledgerWords = ledger.description.toLowerCase().split(/[\s\-—]+/);
          const overlap = bankWords.filter(w => w.length > 2 && ledgerWords.some(lw => lw.includes(w) || w.includes(lw)));
          if (overlap.length >= 1) {
            const bi = newBankItems.findIndex(b => b.id === bank.id);
            const li = newLedgerItems.findIndex(l => l.id === ledger.id);
            newBankItems[bi] = { ...newBankItems[bi], matchId: ledger.id };
            newLedgerItems[li] = { ...newLedgerItems[li], matchId: bank.id };
            usedLedgerIds.add(ledger.id);
            matches++;
            break;
          }
        }
      }
    }

    setBankItems(newBankItems);
    setLedgerItems(newLedgerItems);
    if (matches > 0) {
      toast.success(`Auto-matched ${matches} transaction${matches > 1 ? 's' : ''}`);
    } else {
      toast.info('No additional matches found');
    }
    setSelectedBank(null);
    setSelectedLedger(null);
  };

  const handleUnmatch = (bankId, ledgerId) => {
    setBankItems(prev => prev.map(b => b.id === bankId ? { ...b, matchId: null } : b));
    setLedgerItems(prev => prev.map(l => l.id === ledgerId ? { ...l, matchId: null } : l));
    toast.success('Match removed');
  };

  const handleComplete = () => {
    setShowCompleted(true);
    toast.success('Reconciliation completed successfully');
  };

  const fmt = (val) => {
    const abs = Math.abs(val);
    return `$${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (showCompleted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Bank Reconciliation</h2>
            <p className="text-gray-500 mt-1">Match bank statement transactions to your ledger</p>
          </div>
        </div>
        <Card className="p-12 text-center">
          <CardContent className="p-0">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Reconciliation Complete</h3>
            <p className="text-gray-500 mb-2">{selectedAccount.name} ({selectedAccount.code})</p>
            <p className="text-gray-500 mb-6">Statement balance of {fmt(statementBalance)} reconciled as at 24 March 2026</p>
            <div className="inline-flex gap-4">
              <Button variant="outline" onClick={() => setShowCompleted(false)}>
                View Details
              </Button>
              <Button
                onClick={() => {
                  setShowCompleted(false);
                  setBankItems(INITIAL_BANK_ITEMS);
                  setLedgerItems(INITIAL_LEDGER_ITEMS);
                }}
              >
                New Reconciliation
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Bank Reconciliation</h2>
          <p className="text-gray-500 mt-1">Match bank statement transactions to your ledger</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleAutoMatch} className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Auto-Match
          </Button>
          <Button variant="success" onClick={handleComplete} disabled={!isReconciled}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Complete Reconciliation
          </Button>
        </div>
      </div>

      {/* Account Selector */}
      <motion.div {...fadeUp}>
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Bank Account</label>
              <Select value={selectedAccount.id} onValueChange={(val) => setSelectedAccount(ACCOUNTS.find(a => a.id === val))}>
                <SelectTrigger className="flex-1 max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNTS.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.code}) — {a.institution} ({a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-xs text-gray-400">Period: 1 - 24 March 2026</Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Bar */}
      <motion.div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6" variants={stagger} initial="initial" animate="animate">
        <SummaryCard label="Statement Balance" value={fmt(statementBalance)} color="indigo" />
        <SummaryCard label="Ledger Balance" value={fmt(ledgerBalance)} color="blue" />
        <SummaryCard label="Difference" value={fmt(difference)} color={difference === 0 ? 'green' : 'red'} />
        <SummaryCard label="Matched" value={`${matchedBankCount} / ${bankItems.length}`} color="green" />
        <SummaryCard label="Unmatched" value={`${unmatchedBankCount} bank, ${unmatchedLedgerCount} ledger`} color={unmatchedBankCount + unmatchedLedgerCount === 0 ? 'green' : 'amber'} />
      </motion.div>

      {/* Matching hint */}
      <AnimatePresence>
        {selectedBank && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-indigo-200 bg-indigo-50 shadow-none mb-4">
              <CardContent className="p-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-indigo-700">
                  Selected: <span className="font-semibold">{selectedBank.description}</span> ({fmt(selectedBank.amount)}) — Click a matching ledger item on the right to reconcile.
                </p>
                <Button variant="ghost" size="sm" onClick={() => setSelectedBank(null)} className="ml-auto text-indigo-400 hover:text-indigo-600">
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Bank Statement Items */}
        <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.1 }}>
          <Card className="overflow-hidden">
            <CardHeader className="px-4 py-3 bg-gray-50 border-b flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <CardTitle className="text-base font-semibold text-gray-700">Bank Statement</CardTitle>
              </div>
              <Badge variant="secondary">{bankItems.length} items</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {bankItems.map((item, index) => {
                  const isMatched = !!item.matchId;
                  const isSelected = selectedBank?.id === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.02 }}
                      onClick={() => handleBankClick(item)}
                      className={cn(
                        'px-4 py-3 flex items-center gap-3 transition-colors',
                        isMatched ? 'bg-green-50' : isSelected ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-400' : 'bg-white hover:bg-gray-50 cursor-pointer',
                        !isMatched && 'cursor-pointer'
                      )}
                    >
                      <div className="shrink-0">
                        {isMatched ? (
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium truncate', isMatched ? 'text-gray-500' : 'text-gray-900')}>{item.description}</p>
                        <p className="text-xs text-gray-400">{item.date}</p>
                      </div>
                      <span className={cn('text-sm font-semibold whitespace-nowrap', item.amount >= 0 ? 'text-green-600' : 'text-gray-900')}>
                        {item.amount >= 0 ? '+' : ''}{fmt(item.amount)}
                      </span>
                      {isMatched && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-300 hover:text-red-500"
                          onClick={(e) => { e.stopPropagation(); handleUnmatch(item.id, item.matchId); }}
                          title="Remove match"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* RIGHT: Ledger Transactions */}
        <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.2 }}>
          <Card className="overflow-hidden">
            <CardHeader className="px-4 py-3 bg-gray-50 border-b flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <CardTitle className="text-base font-semibold text-gray-700">Ledger Transactions</CardTitle>
              </div>
              <Badge variant="secondary">{ledgerItems.length} items</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {ledgerItems.map((item, index) => {
                  const isMatched = !!item.matchId;
                  const isSelected = selectedLedger?.id === item.id;
                  const canMatch = selectedBank && !isMatched && selectedBank.amount === item.amount;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.02 }}
                      onClick={() => handleLedgerClick(item)}
                      className={cn(
                        'px-4 py-3 flex items-center gap-3 transition-colors',
                        isMatched ? 'bg-green-50' : canMatch ? 'bg-indigo-50 border-l-4 border-l-indigo-400 cursor-pointer' : isSelected ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-400' : 'bg-white hover:bg-gray-50 cursor-pointer',
                        !isMatched && 'cursor-pointer'
                      )}
                    >
                      <div className="shrink-0">
                        {isMatched ? (
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : canMatch ? (
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium truncate', isMatched ? 'text-gray-500' : 'text-gray-900')}>{item.description}</p>
                        <p className="text-xs text-gray-400">{item.date}</p>
                      </div>
                      <span className={cn('text-sm font-semibold whitespace-nowrap', item.amount >= 0 ? 'text-green-600' : 'text-gray-900')}>
                        {item.amount >= 0 ? '+' : ''}{fmt(item.amount)}
                      </span>
                      {isMatched && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-300 hover:text-red-500"
                          onClick={(e) => { e.stopPropagation(); handleUnmatch(item.matchId, item.id); }}
                          title="Remove match"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Unmatched Items Explanation */}
      <AnimatePresence>
        {(unmatchedBankCount > 0 || unmatchedLedgerCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <Card className="border-amber-200 bg-amber-50 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Reconciliation Incomplete</p>
                    <p className="text-sm text-amber-700 mt-1">
                      {unmatchedBankCount > 0 && <>{unmatchedBankCount} unmatched bank statement item{unmatchedBankCount > 1 ? 's' : ''} — these may need to be recorded in your ledger. </>}
                      {unmatchedLedgerCount > 0 && <>{unmatchedLedgerCount} unmatched ledger transaction{unmatchedLedgerCount > 1 ? 's' : ''} — these may not have cleared the bank yet. </>}
                      Difference of {fmt(difference)} must be resolved before completing reconciliation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.3 }} className="mt-6">
        <Card className="bg-gray-50 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">How to reconcile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
              <div className="flex items-start gap-2">
                <Badge className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 p-0 bg-indigo-100 text-indigo-600 border-0">1</Badge>
                <p>Click an unmatched bank statement item on the left to select it.</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 p-0 bg-indigo-100 text-indigo-600 border-0">2</Badge>
                <p>Click the corresponding ledger transaction on the right to match them (amounts must be equal).</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 p-0 bg-indigo-100 text-indigo-600 border-0">3</Badge>
                <p>Or use Auto-Match to automatically pair transactions with matching amounts and descriptions.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
