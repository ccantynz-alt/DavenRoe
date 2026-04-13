import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ClientPortal() {
  const { user } = useAuth();
  const isAccountant = ['partner', 'manager', 'senior'].includes(user?.role);

  return isAccountant ? <AccountantView /> : <ClientView />;
}

function AccountantView() {
  const [email, setEmail] = useState('');
  const [entityId, setEntityId] = useState('');
  const [entities, setEntities] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get('/entities/').then(r => setEntities(r.data)).catch(() => {});
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email || !entityId) return;
    setSending(true);
    setMessage(null);
    try {
      // Register the client user with the client role
      await api.post('/auth/register', {
        email,
        password: crypto.randomUUID().slice(0, 12) + 'A1!',
        full_name: email.split('@')[0],
        role: 'client',
      });

      setInvitations(prev => [...prev, {
        email,
        entity: entities.find(e => e.id === entityId)?.name || entityId,
        sent_at: new Date().toISOString(),
        status: 'sent',
      }]);
      setMessage({ type: 'success', text: `Invitation sent to ${email}` });
      setEmail('');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'Email already registered') {
        setMessage({ type: 'info', text: `${email} already has an account. They can log in with their existing credentials.` });
      } else {
        setMessage({ type: 'error', text: detail || 'Failed to send invitation' });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Client Portal</h2>
      <p className="text-gray-500 mb-8">Invite clients to view their own financial data</p>

      {/* Invite Form */}
      <div className="bg-white border rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">Invite a Client</h3>
        <form onSubmit={handleInvite} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg" placeholder="client@example.com" required />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Access</label>
            <select value={entityId} onChange={e => setEntityId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Select entity...</option>
              {entities.map(ent => (
                <option key={ent.id} value={ent.id}>{ent.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={sending}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {sending ? 'Sending...' : 'Send Invite'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
            : message.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-white border rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">How the Client Portal Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StepCard step="1" title="Invite" desc="Enter your client's email and assign them to their entity" />
          <StepCard step="2" title="Client Logs In" desc="They receive an email with login credentials" />
          <StepCard step="3" title="Scoped Access" desc="They see only their entity — invoices, documents, tax position" />
          <StepCard step="4" title="Collaborate" desc="They upload receipts, view reports, and approve documents" />
        </div>
      </div>

      {/* Recent Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Recent Invitations</h3>
          <div className="space-y-2">
            {invitations.map((inv, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium">{inv.email}</p>
                  <p className="text-sm text-gray-400">{inv.entity}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{new Date(inv.sent_at).toLocaleDateString()}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function ClientView() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Your Portal</h2>
      <p className="text-gray-500 mb-8">Welcome, {user?.full_name}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <PortalCard title="Your Invoices" desc="View outstanding and paid invoices" link="/invoicing" icon="$" />
        <PortalCard title="Your Documents" desc="Upload receipts and view tax documents" link="/documents" icon="^" />
        <PortalCard title="Reports" desc="View your P&L, Balance Sheet, and more" link="/reports" icon="=" />
        <PortalCard title="Tax Position" desc="See your tax calculations and treaty benefits" link="/tax" icon="%" />
      </div>

      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
        <p className="text-gray-500 text-sm">
          Contact your accountant or use Ask DavenRoe to get answers about your financial data in plain English.
        </p>
      </div>
    </div>
  );
}


function StepCard({ step, title, desc }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mx-auto mb-2">
        {step}
      </div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </div>
  );
}

function PortalCard({ title, desc, link, icon }) {
  return (
    <a href={link} className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow block">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl font-mono text-indigo-500">{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-gray-500">{desc}</p>
    </a>
  );
}
