import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { cn } from '@/lib/utils';

/* --- Static Data --- */

const WHY_PARTNER = [
  {
    icon: '\u2605',
    title: 'Free Practice Tier',
    desc: 'Full platform access for your own practice at no cost. Manage your internal books on the same platform you recommend to clients.',
    color: 'indigo',
  },
  {
    icon: '$',
    title: 'Revenue Share',
    desc: 'Earn 20% recurring commission on every client you refer. $149/mo client = $29.80/mo passive income. 50 clients = $1,490/mo.',
    color: 'emerald',
  },
  {
    icon: '\u21AF',
    title: 'Priority Support',
    desc: '2-hour response time. Dedicated partner success manager. Direct Slack channel for urgent issues.',
    color: 'blue',
  },
  {
    icon: '\u21C4',
    title: 'Migration Tools',
    desc: 'Bulk import clients from Xero, QuickBooks, MYOB. One-click migration with data mapping. We handle the heavy lifting.',
    color: 'amber',
  },
];

const CARD_COLORS = {
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
};

const ICON_BG = {
  indigo: 'bg-indigo-100 text-indigo-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-600',
};

const CERT_LEVELS = [
  {
    level: 1,
    name: 'Certified Partner',
    requirement: 'Complete online training (2 hours), pass assessment',
    perks: ['Badge and directory listing', 'Free practice tier', '20% recurring commission', 'Standard support'],
    badge: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  {
    level: 2,
    name: 'Premium Partner',
    requirement: '10+ active client referrals',
    perks: ['Co-marketing opportunities', 'Featured placement in directory', '25% recurring commission', 'Priority support'],
    badge: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  {
    level: 3,
    name: 'Elite Partner',
    requirement: '50+ active client referrals',
    perks: ['Custom white-label branding', 'Dedicated account manager', '30% recurring commission', 'Event speaking invitations'],
    badge: 'bg-amber-100 text-amber-700 border-amber-300',
  },
];

const SAMPLE_PARTNERS = [
  { name: 'Sarah Mitchell', firm: 'Mitchell & Associates', location: 'Sydney, AU', specs: ['Tax', 'Advisory', 'Payroll'], rating: 4.9 },
  { name: 'James Chen', firm: 'Chen Accounting Group', location: 'Auckland, NZ', specs: ['Bookkeeping', 'Tax', 'Forensic'], rating: 4.8 },
  { name: 'Emily Rhodes', firm: 'Rhodes Financial', location: 'London, UK', specs: ['Audit', 'Advisory', 'Tax'], rating: 4.7 },
];

const DEMO_REFERRALS = [
  { client: 'Bright Sparks Electrical', plan: 'Practice', signedUp: '2026-02-14', status: 'Active', commission: '$29.80' },
  { client: 'Coastal Kitchens Pty Ltd', plan: 'Practice', signedUp: '2026-01-22', status: 'Active', commission: '$29.80' },
  { client: 'Northside Medical Group', plan: 'Firm', signedUp: '2025-12-08', status: 'Active', commission: '$99.80' },
  { client: 'GreenLeaf Organics', plan: 'Practice', signedUp: '2026-03-01', status: 'Active', commission: '$29.80' },
  { client: 'Summit Construction Ltd', plan: 'Firm', signedUp: '2025-11-15', status: 'Active', commission: '$99.80' },
];

const SPECIALISATIONS = ['Tax', 'Audit', 'Bookkeeping', 'Advisory', 'Payroll', 'Forensic'];
const JURISDICTIONS = ['AU', 'NZ', 'UK', 'US'];
const PLATFORMS = ['Xero', 'QuickBooks', 'MYOB', 'Sage', 'FreshBooks', 'Other'];
const HEAR_ABOUT = ['Google Search', 'LinkedIn', 'Referral', 'Webinar', 'Conference', 'Accounting Publication', 'Other'];

const RESOURCES = [
  { title: 'Partner Training', desc: 'Complete the certification curriculum at your own pace', icon: '\u25B6' },
  { title: 'Marketing Kit', desc: 'Downloadable logos, banners, email templates, and social assets', icon: '\u25BC' },
  { title: 'Client Migration Guide', desc: 'Step-by-step playbook for moving clients from Xero, QBO, or MYOB', icon: '\u25C8' },
  { title: 'Co-Branded Proposal Template', desc: 'Professional proposal template with your branding and Astra features', icon: '\u25E7' },
];

const INITIAL_FORM = {
  practiceName: '',
  yourName: '',
  email: '',
  phone: '',
  numClients: '',
  currentPlatform: '',
  specialisations: [],
  jurisdiction: '',
  hearAbout: '',
};

/* --- Revenue Calculator --- */

function RevenueCalculator() {
  const [clients, setClients] = useState(50);
  const monthly = clients * 149 * 0.2;
  const annual = monthly * 12;

  return (
    <Card className="p-8">
      <CardContent className="p-0">
        <h3 className="text-2xl font-bold mb-2">Revenue Calculator</h3>
        <p className="text-gray-500 mb-6">See how much you could earn as an Astra partner.</p>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          How many clients do you manage?
        </label>
        <input
          type="range"
          min={10}
          max={500}
          step={5}
          value={clients}
          onChange={(e) => setClients(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-2"
        />
        <div className="flex justify-between text-xs text-gray-400 mb-8">
          <span>10</span>
          <span className="font-semibold text-indigo-600 text-base">{clients} clients</span>
          <span>500</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-indigo-50 border-indigo-100 text-center">
            <CardContent className="p-5">
              <p className="text-xs text-indigo-500 font-medium uppercase tracking-wider mb-1">Monthly Commission</p>
              <p className="text-3xl font-bold text-indigo-700">${monthly.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-100 text-center">
            <CardContent className="p-5">
              <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider mb-1">Annual Income</p>
              <p className="text-3xl font-bold text-emerald-700">${annual.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-100 text-center">
            <CardContent className="p-5">
              <p className="text-xs text-amber-500 font-medium uppercase tracking-wider mb-1">Per Client / Month</p>
              <p className="text-3xl font-bold text-amber-700">$29.80</p>
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">Based on 20% commission on $149/mo Practice plan. Premium and Elite tiers earn 25-30%.</p>
      </CardContent>
    </Card>
  );
}

/* --- Application Modal --- */

function ApplicationModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleSpec = (s) =>
    setForm((f) => ({
      ...f,
      specialisations: f.specialisations.includes(s)
        ? f.specialisations.filter((x) => x !== s)
        : [...f.specialisations, s],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    onSubmit(form);
    setForm({ ...INITIAL_FORM });
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to Become a Partner</DialogTitle>
          <DialogDescription>Fill out the form below and we will be in touch within 24 hours.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Practice Name</label>
              <Input required value={form.practiceName} onChange={(e) => set('practiceName', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <Input required value={form.yourName} onChange={(e) => set('yourName', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Clients</label>
              <Input required type="number" min="1" value={form.numClients} onChange={(e) => set('numClients', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Platform</label>
              <Select value={form.currentPlatform} onValueChange={(val) => set('currentPlatform', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specialisations</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALISATIONS.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={form.specialisations.includes(s) ? 'default' : 'outline'}
                  onClick={() => toggleSpec(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
              <Select value={form.jurisdiction} onValueChange={(val) => set('jurisdiction', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about Astra?</label>
              <Select value={form.hearAbout} onValueChange={(val) => set('hearAbout', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {HEAR_ABOUT.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full py-3">
            {submitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* --- Public View --- */

function PublicView({ onOpenApply }) {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 border-0 p-10 md:p-14 text-white text-center">
          <CardContent className="p-0">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Grow Your Practice with Astra</h1>
            <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
              Join the Astra Certified Partner Program. Free practice management tools, revenue share on referrals, and priority support.
            </p>
            <Button
              onClick={onOpenApply}
              variant="secondary"
              size="lg"
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-lg shadow-lg px-8 py-3.5"
            >
              Apply to Become a Partner
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Why Partner */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Why Partner with Astra</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHY_PARTNER.map((item, index) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-6">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold mb-4', ICON_BG[item.color])}>
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Revenue Calculator */}
      <RevenueCalculator />

      {/* Certification Path */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Certification Path</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CERT_LEVELS.map((tier, index) => (
            <motion.div key={tier.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="outline" className={tier.badge}>
                      Level {tier.level}
                    </Badge>
                    <h3 className="font-semibold text-lg">{tier.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{tier.requirement}</p>
                  <ul className="space-y-2">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-indigo-500 mt-0.5 shrink-0">&#10003;</span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Partner Directory Preview */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Partner Directory</h2>
        <p className="text-gray-500 mb-6">Your clients can find you. Get listed in our searchable directory of certified accountants.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SAMPLE_PARTNERS.map((p, index) => (
            <motion.div key={p.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {p.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-semibold">{p.name}</h4>
                      <p className="text-xs text-gray-500">{p.firm}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{p.location}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.specs.map((s) => (
                      <Badge key={s} variant="secondary" className="bg-indigo-50 text-indigo-600 border-transparent">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-600">{'\u2605'.repeat(Math.floor(p.rating))} {p.rating}</span>
                    <Button variant="link" size="sm" className="text-indigo-600">View Profile</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <Card className="bg-gray-50 border-gray-200 p-10 text-center">
        <CardContent className="p-0">
          <h2 className="text-2xl font-bold mb-3">Ready to grow your practice?</h2>
          <p className="text-gray-500 mb-6 max-w-xl mx-auto">
            Join hundreds of forward-thinking accountants who are building recurring revenue and delivering better client outcomes with Astra.
          </p>
          <Button onClick={onOpenApply} size="lg">
            Apply to Become a Partner
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* --- Partner Dashboard (logged-in) --- */

function PartnerDashboard() {
  const [copied, setCopied] = useState(false);
  const referralUrl = 'https://astra.ai/ref/PTR-SM-2847';

  const copy = () => {
    navigator.clipboard.writeText(referralUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: 'Partner Level', value: 'Certified', sub: 'Level 1', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { label: 'Referred Clients', value: '12', sub: '10 needed for Premium', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Monthly Commission', value: '$356.40', sub: 'Next payout: Apr 1', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'Total Earned', value: '$2,138.40', sub: 'Since Nov 2025', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, index) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
            <Card className={cn('border', s.color)}>
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs mt-1 opacity-60">{s.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Share this link with clients. When they sign up, you earn 20% of their subscription -- forever.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono text-gray-700 truncate">
              {referralUrl}
            </div>
            <Button onClick={copy}>
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referred Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referred Clients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Signed Up</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Monthly Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_REFERRALS.map((r) => (
                <TableRow key={r.client}>
                  <TableCell className="font-medium text-gray-900">{r.client}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-transparent">
                      {r.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{r.signedUp}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-gray-900">{r.commission}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resources */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Partner Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RESOURCES.map((r, index) => (
            <motion.div key={r.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
              <Card className="cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group h-full">
                <CardContent className="p-5">
                  <span className="text-2xl mb-3 block text-gray-300 group-hover:text-indigo-400 transition-colors">{r.icon}</span>
                  <h4 className="font-semibold mb-1 group-hover:text-indigo-700 transition-colors">{r.title}</h4>
                  <p className="text-xs text-gray-500">{r.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Main Export --- */

export default function PartnerProgram() {
  const { user } = useAuth();
  const toast = useToast();
  const [applyOpen, setApplyOpen] = useState(false);

  const isPartner = !!user;

  const handleApplySubmit = () => {
    setApplyOpen(false);
    toast.success('Application submitted -- we\'ll be in touch within 24 hours');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">{isPartner ? 'Partner Dashboard' : 'Astra Certified Partner Program'}</h2>
        <p className="text-gray-500 mt-1">
          {isPartner
            ? 'Manage your referrals, track commissions, and access partner resources.'
            : 'The fastest way for accountants to grow revenue while delivering better outcomes for clients.'}
        </p>
      </div>

      {isPartner ? (
        <PartnerDashboard />
      ) : (
        <PublicView onOpenApply={() => setApplyOpen(true)} />
      )}

      <ApplicationModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSubmit={handleApplySubmit}
      />
    </motion.div>
  );
}
