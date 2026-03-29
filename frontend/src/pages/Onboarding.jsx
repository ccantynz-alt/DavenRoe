import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import api from '@/services/api';

const STEPS = [
  { id: 'welcome', title: 'Welcome to Astra', subtitle: 'Let\'s set up your accounting in under 2 minutes' },
  { id: 'entity', title: 'Create Your Business', subtitle: 'Tell us about your company' },
  { id: 'bank', title: 'Connect Your Bank', subtitle: 'Automatic transaction import' },
  { id: 'done', title: 'You\'re All Set', subtitle: 'Start working with Astra' },
];

const SAMPLE_ENTITIES = [
  { name: 'Coastal Coffee Co', type: 'company', currency: 'AUD', jurisdiction: 'AU', tax_id_type: 'ABN', description: 'Cafe chain with 3 locations' },
  { name: 'NorthStar Consulting LLC', type: 'company', currency: 'USD', jurisdiction: 'US', tax_id_type: 'EIN', description: 'Management consulting firm' },
  { name: 'Kiwi Design Studio', type: 'sole_trader', currency: 'NZD', jurisdiction: 'NZ', tax_id_type: 'IRD', description: 'Freelance graphic designer' },
  { name: 'Thames Legal Partners', type: 'partnership', currency: 'GBP', jurisdiction: 'GB', tax_id_type: 'UTR', description: 'UK law firm' },
];

const stepVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25, ease: 'easeIn' } },
};

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [entityForm, setEntityForm] = useState({
    name: '', legal_name: '', entity_type: 'company',
    primary_currency: 'AUD', tax_id: '', tax_id_type: 'ABN',
    jurisdiction: 'AU',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdEntity, setCreatedEntity] = useState(null);

  const currentStep = STEPS[step];
  const progressValue = ((step + 1) / STEPS.length) * 100;

  const handleCreateEntity = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/entities/', {
        name: entityForm.name,
        legal_name: entityForm.legal_name || entityForm.name,
        entity_type: entityForm.entity_type,
        primary_currency: entityForm.primary_currency,
        tax_id: entityForm.tax_id || undefined,
        tax_id_type: entityForm.tax_id_type,
        jurisdictions: [{
          jurisdiction_code: entityForm.jurisdiction,
          is_primary: true,
          nexus_type: 'physical',
          effective_from: new Date().toISOString(),
        }],
      });
      setCreatedEntity(res.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create entity. Database may not be connected yet — you can skip this step.');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleData = async (sample) => {
    setEntityForm({
      name: sample.name,
      legal_name: sample.name,
      entity_type: sample.type,
      primary_currency: sample.currency,
      tax_id: '',
      tax_id_type: sample.tax_id_type,
      jurisdiction: sample.jurisdiction,
    });
  };

  const currencyByJurisdiction = { AU: 'AUD', US: 'USD', NZ: 'NZD', GB: 'GBP' };
  const taxIdByJurisdiction = { AU: 'ABN', US: 'EIN', NZ: 'IRD', GB: 'UTR' };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-4">
          <Progress value={progressValue} className="h-1.5" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                i < step && 'bg-green-500 text-white',
                i === step && 'bg-astra-600 text-white',
                i > step && 'bg-gray-200 text-gray-500',
              )}>
                {i < step ? '\u2713' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('w-12 h-0.5 transition-colors', i < step ? 'bg-green-500' : 'bg-gray-200')} />
              )}
            </div>
          ))}
        </div>

        <Card className="rounded-2xl p-0">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-2xl">{currentStep.title}</CardTitle>
            <CardDescription className="mt-1">{currentStep.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-6">
            <AnimatePresence mode="wait">
              {/* Step 0: Welcome */}
              {step === 0 && (
                <motion.div key="welcome" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <FeatureCard icon="$" title="Tax Engine" desc="US, AU, NZ, GB + 6 treaties" />
                    <FeatureCard icon=">" title="AI Ledger" desc="Auto-categorize & review" />
                    <FeatureCard icon="?" title="Ask Astra" desc="Natural language queries" />
                    <FeatureCard icon="!" title="Forensic Tools" desc="Anomaly detection & audit" />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => setStep(1)} size="lg" className="flex-1">
                      Set Up My Business
                    </Button>
                    <Button onClick={() => onComplete()} variant="secondary" size="lg">
                      Explore First
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Create Entity */}
              {step === 1 && (
                <motion.div key="entity" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  {/* Sample data quick-start */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">Quick start with sample data:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {SAMPLE_ENTITIES.map(s => (
                        <Card
                          key={s.name}
                          onClick={() => handleSampleData(s)}
                          className={cn(
                            'cursor-pointer p-3 text-left text-sm hover:border-astra-400 transition-colors',
                            entityForm.name === s.name && 'border-astra-500 bg-astra-50',
                          )}
                        >
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.description}</p>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                        <Input
                          type="text"
                          value={entityForm.name}
                          onChange={e => setEntityForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="My Business Pty Ltd"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                        <Select
                          value={entityForm.entity_type}
                          onValueChange={val => setEntityForm(f => ({ ...f, entity_type: val }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="sole_trader">Sole Trader</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="trust">Trust</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                        <Select
                          value={entityForm.jurisdiction}
                          onValueChange={j => {
                            setEntityForm(f => ({
                              ...f,
                              jurisdiction: j,
                              primary_currency: currencyByJurisdiction[j] || f.primary_currency,
                              tax_id_type: taxIdByJurisdiction[j] || f.tax_id_type,
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select jurisdiction" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="NZ">New Zealand</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <Select
                          value={entityForm.primary_currency}
                          onValueChange={val => setEntityForm(f => ({ ...f, primary_currency: val }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {['AUD', 'USD', 'NZD', 'GBP', 'EUR', 'CAD'].map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {entityForm.tax_id_type || 'Tax ID'}
                        </label>
                        <Input
                          type="text"
                          value={entityForm.tax_id}
                          onChange={e => setEntityForm(f => ({ ...f, tax_id: e.target.value }))}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4">
                      <Badge variant="destructive" className="w-full justify-start rounded-lg px-3 py-2.5 text-sm font-normal">
                        {error}
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => setStep(0)} variant="secondary" size="lg">
                      Back
                    </Button>
                    <Button
                      onClick={handleCreateEntity}
                      disabled={loading || !entityForm.name}
                      size="lg"
                      className="flex-1"
                    >
                      {loading ? 'Creating...' : 'Create & Continue'}
                    </Button>
                    <Button onClick={() => setStep(2)} variant="ghost" size="lg" className="text-gray-400">
                      Skip
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Connect Bank */}
              {step === 2 && (
                <motion.div key="bank" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <BankProviderCard name="Plaid" countries="US, CA" institutions="1,000+" />
                    <BankProviderCard name="Basiq" countries="AU, NZ" institutions="170+" />
                    <BankProviderCard name="TrueLayer" countries="UK, EU" institutions="5,000+" />
                  </div>

                  <Card className="bg-gray-50 border p-4 mb-6">
                    <p className="text-sm text-gray-600">
                      Your bank credentials never touch our servers. Authentication happens
                      directly between you and your bank via secure OAuth flows.
                    </p>
                  </Card>

                  <div className="flex gap-3">
                    <Button onClick={() => setStep(3)} size="lg" className="flex-1">
                      Connect Later (Dashboard)
                    </Button>
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-3">
                    You can connect bank accounts anytime from the Bank Feeds page.
                  </p>
                </motion.div>
              )}

              {/* Step 3: Done */}
              {step === 3 && (
                <motion.div key="done" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="text-center">
                  <motion.div
                    className="text-6xl mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                  >
                    &#10003;
                  </motion.div>
                  <p className="text-gray-600 mb-2">
                    {createdEntity
                      ? `"${createdEntity.name}" is ready to go.`
                      : 'Your workspace is ready.'}
                  </p>
                  <p className="text-sm text-gray-400 mb-8">
                    Start by importing transactions, creating invoices, or asking Astra anything.
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <QuickAction label="Import CSV" desc="Upload existing data" />
                    <QuickAction label="Create Invoice" desc="Send your first invoice" />
                    <QuickAction label="Ask Astra" desc="Ask anything in plain English" />
                  </div>

                  <Button onClick={() => onComplete()} size="lg" className="w-full">
                    Go to Dashboard
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <Card className="flex items-center gap-3 p-4 bg-gray-50 border-gray-100">
      <Badge variant="outline" className="text-lg font-mono text-astra-500 h-8 w-8 flex items-center justify-center rounded-lg p-0">
        {icon}
      </Badge>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </Card>
  );
}

function BankProviderCard({ name, countries, institutions }) {
  return (
    <Card className="p-4 text-center">
      <p className="font-semibold mb-1">{name}</p>
      <Badge variant="secondary" className="mb-1">{countries}</Badge>
      <p className="text-xs text-gray-400">{institutions} banks</p>
    </Card>
  );
}

function QuickAction({ label, desc }) {
  return (
    <Card className="bg-gray-50 border-gray-100 p-3 text-center">
      <p className="font-medium text-sm">{label}</p>
      <p className="text-xs text-gray-400">{desc}</p>
    </Card>
  );
}
