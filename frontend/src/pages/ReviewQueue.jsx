import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getReviewQueue, reviewTransaction } from '@/services/api';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending' },
  { value: 'flagged', label: 'Flagged' },
];

export default function ReviewQueue() {
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await getReviewQueue();
      setTransactions(res.data);
      setError(null);
    } catch (err) {
      setError('Unable to load review queue. Database may not be connected.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleAction = async (id, action) => {
    try {
      await reviewTransaction(id, { action });
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed');
    }
  };

  const filtered = filter === 'all'
    ? transactions
    : filter === 'flagged'
      ? transactions.filter(t => (t.risk_score || 0) >= 40)
      : transactions.filter(t => t.status === filter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Review Queue</h2>
          <p className="text-gray-500 mt-1">
            {loading ? 'Loading...' : `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''} awaiting your approval`}
          </p>
        </div>
        <div className="flex gap-2">
          {FILTER_OPTIONS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? 'default' : 'secondary'}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-yellow-200 bg-yellow-50 mb-6">
            <CardContent className="pt-6">
              <p className="text-yellow-800 font-medium">{error}</p>
              <p className="text-yellow-600 text-sm mt-1">Transactions will appear here once the database is connected and data is flowing.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-8 pb-8 text-center">
              <p className="text-green-800 font-semibold text-lg">All clear</p>
              <p className="text-green-600 text-sm mt-1">No transactions pending review.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filtered.map((txn) => (
          <motion.div key={txn.id} variants={itemVariants}>
            <TransactionCard txn={txn} onAction={handleAction} />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function getRiskVariant(score) {
  if (score < 20) return 'success';
  if (score < 40) return 'warning';
  return 'destructive';
}

function getStatusVariant(status) {
  if (status === 'draft') return 'secondary';
  return 'warning';
}

function TransactionCard({ txn, onAction }) {
  const riskScore = txn.risk_score || 0;
  const confidence = txn.ai_confidence ? `${(txn.ai_confidence * 100).toFixed(0)}%` : null;
  const confidenceValue = txn.ai_confidence ? txn.ai_confidence * 100 : 0;

  return (
    <Card className="p-0">
      <CardContent className="pt-6 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm text-gray-400 font-mono">{txn.transaction_date}</span>
              <Badge variant={getRiskVariant(riskScore)}>
                Risk: {riskScore}
              </Badge>
              {txn.tax_jurisdiction && (
                <Badge className="border-transparent bg-blue-100 text-blue-700">
                  {txn.tax_jurisdiction}
                </Badge>
              )}
              <Badge variant="secondary">
                {txn.source}
              </Badge>
              <Badge variant={getStatusVariant(txn.status)}>
                {txn.status}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg">{txn.description}</h3>
            {txn.ai_reasoning && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  AI: {txn.ai_reasoning}
                </p>
                {confidence && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Progress value={confidenceValue} className="h-1.5 w-24" />
                    <span className="text-xs text-gray-400">{confidence} confidence</span>
                  </div>
                )}
              </div>
            )}
            {txn.reference && (
              <p className="text-xs text-gray-400 mt-1">Ref: {txn.reference}</p>
            )}
          </div>
          <div className="text-right ml-6">
            <p className="text-2xl font-bold">${Number(txn.total_amount).toLocaleString('en', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-400">{txn.currency}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-3 pt-4 mt-4 border-t">
        <Button
          variant="success"
          size="sm"
          onClick={() => onAction(txn.id, 'approve')}
        >
          Approve
        </Button>
        <Button
          className="bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700"
          size="sm"
          onClick={() => onAction(txn.id, 'flag')}
        >
          Flag for Review
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className={cn('ml-auto bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300')}
          onClick={() => onAction(txn.id, 'void')}
        >
          Void
        </Button>
      </CardFooter>
    </Card>
  );
}
