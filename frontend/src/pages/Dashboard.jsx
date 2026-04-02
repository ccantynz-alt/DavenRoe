import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    api.get('/dashboard/stats').then(r => {
      setStats(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fmt = (n) => `$${(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-6xl">
      {/* Greeting */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{greeting}</h2>
        <p className="text-gray-500 mt-1">Here's your business at a glance</p>
      </div>

      {/* Money Overview — the 3 things every tradie needs to see */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <MoneyCard
          label="You're Owed"
          value={loading ? null : fmt(stats?.outstanding_amount)}
          sub={stats?.overdue_invoices > 0 ? `${stats.overdue_invoices} overdue — chase them` : 'All up to date'}
          color={stats?.overdue_invoices > 0 ? 'red' : 'green'}
          icon={<IncomingIcon />}
          link="/invoicing"
          linkLabel="View invoices"
        />
        <MoneyCard
          label="Revenue Collected"
          value={loading ? null : fmt(stats?.total_revenue)}
          sub="Paid invoices this period"
          color="green"
          icon={<WalletIcon />}
          link="/reports"
          linkLabel="View reports"
        />
        <MoneyCard
          label="This Month"
          value={loading ? null : `${stats?.transactions_this_month ?? 0} transactions`}
          sub={`${stats?.approved_this_month ?? 0} approved, ${stats?.pending_review ?? 0} to review`}
          color={stats?.pending_review > 0 ? 'amber' : 'green'}
          icon={<ActivityIcon />}
          link="/review"
          linkLabel="Review queue"
        />
      </div>

      {/* Quick Actions — big, obvious buttons for daily tasks */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction to="/invoicing" icon={<InvoiceIcon />} label="Create Invoice" desc="Bill a customer" />
          <QuickAction to="/email-intelligence" icon={<EmailScanIcon />} label="Scan Emails" desc="Find driver invoices" />
          <QuickAction to="/live-receipt" icon={<CameraIcon />} label="Snap Receipt" desc="Capture & save" />
          <QuickAction to="/ask" icon={<AskIcon />} label="Ask AlecRae" desc="Ask anything" />
        </div>
      </div>

      {/* Email Intelligence Promo — drives discovery */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">Email Intelligence</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Connect your Gmail or Outlook and let AI scan for invoices from your drivers and subcontractors.
              Found invoices get turned into billable items you can invoice to your customers in one click.
            </p>
          </div>
          <Link to="/email-intelligence"
            className="shrink-0 px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors text-center">
            Scan My Emails
          </Link>
        </div>
      </div>

      {/* Business Health Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatusTile
          label="Active Businesses"
          value={loading ? '...' : stats?.active_entities ?? 0}
          sub="Under management"
          icon={<BuildingIcon />}
        />
        <StatusTile
          label="Risk Alerts"
          value={loading ? '...' : stats?.risk_alerts ?? 0}
          sub={stats?.risk_alerts > 0 ? 'Needs attention' : 'All clear'}
          icon={<ShieldIcon />}
          alert={stats?.risk_alerts > 0}
        />
        <StatusTile
          label="Jurisdictions"
          value="4"
          sub="AU, NZ, UK, US"
          icon={<GlobeIcon />}
        />
        <StatusTile
          label="AI Engine"
          value="Online"
          sub="Claude Sonnet"
          icon={<BrainIcon />}
          online
        />
      </div>

      {/* Getting Started Guide — helps new users find things */}
      <div className="bg-white rounded-2xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Getting Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GettingStartedStep
            num="1"
            title="Connect your email"
            desc="Link Gmail or Outlook so AI can find invoices from your drivers and subcontractors automatically."
            to="/email-intelligence"
            cta="Connect now"
          />
          <GettingStartedStep
            num="2"
            title="Create your first invoice"
            desc="Bill a customer in under 60 seconds. Add line items, set payment terms, and send."
            to="/invoicing"
            cta="Create invoice"
          />
          <GettingStartedStep
            num="3"
            title="Connect your bank"
            desc="Link your bank account for automatic transaction imports and reconciliation."
            to="/banking"
            cta="Link bank"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────── */

function MoneyCard({ label, value, sub, color, icon, link, linkLabel }) {
  const borderColor = color === 'red' ? 'border-l-red-500' : color === 'amber' ? 'border-l-amber-500' : 'border-l-emerald-500';
  return (
    <div className={`bg-white rounded-2xl border border-l-4 ${borderColor} p-6`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className="text-gray-300">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">
        {value === null ? <span className="animate-pulse bg-gray-200 rounded h-8 w-32 inline-block" /> : value}
      </p>
      <p className={`text-sm ${color === 'red' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{sub}</p>
      {link && (
        <Link to={link} className="text-indigo-600 text-xs font-medium mt-3 inline-block hover:underline">
          {linkLabel} &rarr;
        </Link>
      )}
    </div>
  );
}

function QuickAction({ to, icon, label, desc }) {
  return (
    <Link to={to}
      className="bg-white border-2 border-gray-100 rounded-2xl p-5 text-center hover:border-indigo-200 hover:shadow-md transition-all group">
      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
        {icon}
      </div>
      <p className="font-semibold text-gray-900 text-sm">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
    </Link>
  );
}

function StatusTile({ label, value, sub, icon, alert, online }) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
        alert ? 'bg-red-50 text-red-500' : online ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-400'
      }`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label} &middot; {sub}</p>
      </div>
    </div>
  );
}

function GettingStartedStep({ num, title, desc, to, cta }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
        {num}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed mb-2">{desc}</p>
        <Link to={to} className="text-indigo-600 text-xs font-medium hover:underline">{cta} &rarr;</Link>
      </div>
    </div>
  );
}

/* ─── Icons (inline SVG, no deps) ─────────────────────────────── */

function IncomingIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>;
}
function WalletIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" /></svg>;
}
function ActivityIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
}
function InvoiceIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
}
function EmailScanIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
}
function CameraIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>;
}
function AskIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;
}
function BuildingIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>;
}
function ShieldIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
}
function GlobeIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 9.75c0 .746-.092 1.472-.262 2.168M3.26 11.918A8.959 8.959 0 013 9.75c0-.746.092-1.472.262-2.168" /></svg>;
}
function BrainIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
}
