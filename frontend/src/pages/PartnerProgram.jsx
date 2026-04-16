import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

/* ─── Static Data ─── */

const WHY_PARTNER = [
  {
    icon: '★',
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
    icon: '↯',
    title: 'Priority Support',
    desc: '2-hour response time. Dedicated partner success manager. Direct Slack channel for urgent issues.',
    color: 'blue',
  },
  {
    icon: '⇄',
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
  { title: 'Partner Training', desc: 'Complete the certification curriculum at your own pace', icon: '▶' },
  { title: 'Marketing Kit', desc: 'Downloadable logos, banners, email templates, and social assets', icon: '▼' },
  { title: 'Client Migration Guide', desc: 'Step-by-step playbook for moving clients from Xero, QBO, or MYOB', icon: '◈' },
  { title: 'Co-Branded Proposal Template', desc: 'Professional proposal template with your branding and DavenRoe features', icon: '◧' },
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

/* ─── Revenue Calculator ─── */

function RevenueCalculator() {
  const [clients, setClients] = useState(50);
  const monthly = clients * 149 * 0.2;
  const annual = monthly * 12;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <h3 className="text-2xl font-bold mb-2">Revenue Calculator</h3>
      <p className="text-gray-500 mb-6">See how much you could earn as an DavenRoe partner.</p>

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
        <div className="bg-indigo-50 rounded-xl p-5 text-center border border-indigo-100">
          <p className="text-xs text-indigo-500 font-medium uppercase tracking-wider mb-1">Monthly Commission</p>
          <p className="text-3xl font-bold text-indigo-700">${monthly.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-5 text-center border border-emerald-100">
          <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider mb-1">Annual Income</p>
          <p className="text-3xl font-bold text-emerald-700">${annual.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-5 text-center border border-amber-100">
          <p className="text-xs text-amber-500 font-medium uppercase tracking-wider mb-1">Per Client / Month</p>
          <p className="text-3xl font-bold text-amber-700">$29.80</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4 text-center">Based on 20% commission on $149/mo Practice plan. Premium and Elite tiers earn 25-30%.</p>
    </div>
  );
}

/* ─── Application Modal ─── */

function ApplicationModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Apply to Become a Partner</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <p className="text-sm text-gray-500 mt-1">Fill out the form below and we will be in touch within 24 hours.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Practice Name</label>
              <input required value={form.practiceName} onChange={(e) => set('practiceName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input required value={form.yourName} onChange={(e) => set('yourName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Clients</label>
              <input required type="number" min="1" value={form.numClients} onChange={(e) => set('numClients', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Platform</label>
              <select required value={form.currentPlatform} onChange={(e) => set('currentPlatform', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none bg-white">
                <option value="">Select...</option>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specialisations</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALISATIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpec(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.specialisations.includes(s)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
              <select required value={form.jurisdiction} onChange={(e) => set('jurisdiction', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none bg-white">
                <option value="">Select...</option>
                {JURISDICTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about DavenRoe?</label>
              <select value={form.hearAbout} onChange={(e) => set('hearAbout', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none bg-white">
                <option value="">Select...</option>
                {HEAR_ABOUT.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Public View ─── */

function PublicView({ onOpenApply }) {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-10 md:p-14 text-white text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Grow Your Practice with DavenRoe</h1>
        <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
          Join the DavenRoe Certified Partner Program. Free practice management tools, revenue share on referrals, and priority support.
        </p>
        <button
          onClick={onOpenApply}
          className="bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors text-lg shadow-lg"
        >
          Apply to Become a Partner
        </button>
      </div>

      {/* Why Partner */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Why Partner with DavenRoe</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHY_PARTNER.map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold mb-4 ${ICON_BG[item.color]}`}>
                {item.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Calculator */}
      <RevenueCalculator />

      {/* Certification Path */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Certification Path</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CERT_LEVELS.map((tier) => (
            <div key={tier.name} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow relative">
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${tier.badge}`}>
                  Level {tier.level}
                </span>
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
            </div>
          ))}
        </div>
      </div>

      {/* Partner Directory Preview */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Partner Directory</h2>
        <p className="text-gray-500 mb-6">Your clients can find you. Get listed in our searchable directory of certified accountants.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SAMPLE_PARTNERS.map((p) => (
            <div key={p.name} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
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
                  <span key={s} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{s}</span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-amber-600">{'★'.repeat(Math.floor(p.rating))} {p.rating}</span>
                <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">View Profile</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-10 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to grow your practice?</h2>
        <p className="text-gray-500 mb-6 max-w-xl mx-auto">
          Join hundreds of forward-thinking accountants who are building recurring revenue and delivering better client outcomes with DavenRoe.
        </p>
        <button
          onClick={onOpenApply}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Apply to Become a Partner
        </button>
      </div>
    </div>
  );
}

/* ─── Partner Dashboard (logged-in) ─── */

function PartnerDashboard() {
  const [copied, setCopied] = useState(false);
  const referralUrl = 'https://davenroe.com/ref/PTR-SM-2847';

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
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.color}`}>
            <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs mt-1 opacity-60">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-lg mb-2">Your Referral Link</h3>
        <p className="text-sm text-gray-500 mb-4">
          Share this link with clients. When they sign up, you earn 20% of their subscription — forever.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono text-gray-700 truncate">
            {referralUrl}
          </div>
          <button
            onClick={copy}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Referred Clients Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-lg">Referred Clients</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Client Name</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Signed Up</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Monthly Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DEMO_REFERRALS.map((r) => (
                <tr key={r.client} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{r.client}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700">{r.plan}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{r.signedUp}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">{r.commission}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resources */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Partner Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RESOURCES.map((r) => (
            <button
              key={r.title}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <span className="text-2xl mb-3 block text-gray-300 group-hover:text-indigo-400 transition-colors">{r.icon}</span>
              <h4 className="font-semibold mb-1 group-hover:text-indigo-700 transition-colors">{r.title}</h4>
              <p className="text-xs text-gray-500">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Export ─── */

export default function PartnerProgram() {
  const { user } = useAuth();
  const toast = useToast();
  const [applyOpen, setApplyOpen] = useState(false);

  const isPartner = !!user;

  const handleApplySubmit = () => {
    setApplyOpen(false);
    toast.success('Application submitted — we\'ll be in touch within 24 hours');
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">{isPartner ? 'Partner Dashboard' : 'DavenRoe Certified Partner Program'}</h2>
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
    </div>
  );
}
