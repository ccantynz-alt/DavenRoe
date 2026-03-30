import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

const TABS = ['Profile', 'Practice', 'Entities', 'Team', 'Notifications', 'Billing'];

const DEMO_ENTITIES = [
  { id: '1', name: 'Coastal Coffee Co', type: 'Company', jurisdiction: 'AU', currency: 'AUD', tax_id: '12 345 678 901', status: 'active', year_end: '30 June' },
  { id: '2', name: 'NorthStar Consulting LLC', type: 'Company', jurisdiction: 'US', currency: 'USD', tax_id: '82-1234567', status: 'active', year_end: '31 December' },
  { id: '3', name: 'Kiwi Design Studio', type: 'Sole Trader', jurisdiction: 'NZ', currency: 'NZD', tax_id: '123-456-789', status: 'active', year_end: '31 March' },
];

const DEMO_TEAM = [
  { id: '1', name: 'You (Owner)', email: 'owner@practice.com', role: 'partner', status: 'active', entities: 'All', lastActive: 'Now' },
  { id: '2', name: 'Sarah Mitchell', email: 'sarah@practice.com', role: 'manager', status: 'active', entities: 'Coastal Coffee, NorthStar', lastActive: '2h ago' },
  { id: '3', name: 'Tom Richards', email: 'tom@practice.com', role: 'senior', status: 'active', entities: 'All', lastActive: '1d ago' },
  { id: '4', name: 'Li Wong', email: 'li@practice.com', role: 'bookkeeper', status: 'active', entities: 'Kiwi Design', lastActive: '3h ago' },
];

const ROLE_COLORS = {
  partner: 'bg-purple-100 text-purple-700', manager: 'bg-blue-100 text-blue-700',
  senior: 'bg-indigo-100 text-indigo-700', bookkeeper: 'bg-gray-100 text-gray-700',
  client: 'bg-green-100 text-green-700',
};

const ROLE_DESCRIPTIONS = {
  partner: 'Full access — all entities, settings, admin, billing, user management',
  manager: 'Manage clients, reports, approvals, team. No billing or admin access.',
  senior: 'Full financial access — review queue, tax filing, reports. No user management.',
  bookkeeper: 'Day-to-day — transactions, bank feeds, invoicing. No tax filing or admin.',
  client: 'View-only access to their own entity via Client Portal.',
};

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('Profile');
  const [saved, setSaved] = useState(false);
  const [entities, setEntities] = useState(DEMO_ENTITIES);
  const [team, setTeam] = useState(DEMO_TEAM);
  const [showInvite, setShowInvite] = useState(false);
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'bookkeeper', entities: [] });
  const [entityForm, setEntityForm] = useState({ name: '', type: 'Company', jurisdiction: 'AU', currency: 'AUD', tax_id: '', year_end: '30 June' });
  const [activeEntity, setActiveEntity] = useState(entities[0]?.id || '1');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleInvite = () => {
    if (!inviteForm.email) { toast.error('Email is required'); return; }
    setTeam(prev => [...prev, {
      id: String(Date.now()), name: inviteForm.email.split('@')[0], email: inviteForm.email,
      role: inviteForm.role, status: 'invited', entities: 'Pending', lastActive: 'Invited',
    }]);
    setShowInvite(false);
    setInviteForm({ email: '', role: 'bookkeeper', entities: [] });
    toast.success(`Invitation sent to ${inviteForm.email}`);
  };

  const handleAddEntity = () => {
    if (!entityForm.name) { toast.error('Entity name is required'); return; }
    setEntities(prev => [...prev, { id: String(Date.now()), ...entityForm, status: 'active' }]);
    setShowAddEntity(false);
    setEntityForm({ name: '', type: 'Company', jurisdiction: 'AU', currency: 'AUD', tax_id: '', year_end: '30 June' });
    toast.success(`Entity "${entityForm.name}" created`);
  };

  const handleSetActive = (id) => {
    setActiveEntity(id);
    localStorage.setItem('alecrae_active_entity', id);
    const entity = entities.find(e => e.id === id);
    toast.success(`Switched to ${entity?.name}`);
  };

  const handleRemoveTeamMember = (id) => {
    setTeam(prev => prev.filter(m => m.id !== id));
    toast.success('Team member removed');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, practice, entities, and team</p>
      </div>

      <div className="flex gap-1 mb-8 border-b border-gray-200 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {saved && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
          Settings saved successfully.
        </div>
      )}

      {/* PROFILE */}
      {activeTab === 'Profile' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-6">Profile Information</h2>
          <div className="space-y-5">
            <Field label="Full Name" defaultValue={user?.full_name || ''} />
            <Field label="Email Address" defaultValue={user?.email || ''} type="email" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 capitalize">
                {user?.role || 'Partner'}
              </div>
            </div>
            <Field label="Phone" placeholder="+61 400 000 000" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option>Australia/Sydney (AEST)</option>
                <option>America/New_York (EST)</option>
                <option>America/Los_Angeles (PST)</option>
                <option>Pacific/Auckland (NZST)</option>
                <option>Europe/London (GMT)</option>
              </select>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* PRACTICE */}
      {activeTab === 'Practice' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-6">Practice Settings</h2>
          <div className="space-y-5">
            <Field label="Practice Name" defaultValue="Smith & Associates" />
            <Field label="ABN / Tax ID" defaultValue="12 345 678 901" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Jurisdiction</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option>Australia (AU)</option><option>United States (US)</option>
                <option>New Zealand (NZ)</option><option>United Kingdom (GB)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Currency</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option>AUD - Australian Dollar</option><option>USD - US Dollar</option>
                <option>NZD - New Zealand Dollar</option><option>GBP - British Pound</option>
              </select>
            </div>
            <Field label="Practice Address" placeholder="Level 20, 1 Martin Place, Sydney NSW 2000" />
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Save Changes</button>
          </div>
        </div>
      )}

      {/* ENTITIES */}
      {activeTab === 'Entities' && (
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Your Entities</h2>
              <p className="text-xs text-gray-500 mt-0.5">Each entity is a separate business with its own financials, tax, and payroll</p>
            </div>
            <button onClick={() => setShowAddEntity(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              + Add Entity
            </button>
          </div>

          <div className="space-y-3">
            {entities.map(entity => (
              <div key={entity.id} className={`bg-white border-2 rounded-xl p-5 transition ${activeEntity === entity.id ? 'border-indigo-400 shadow-sm' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{entity.name}</h3>
                      {activeEntity === entity.id && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {entity.type} &middot; {entity.jurisdiction} &middot; {entity.currency} &middot; Year end: {entity.year_end}
                    </p>
                    {entity.tax_id && <p className="text-xs text-gray-400 mt-0.5">Tax ID: {entity.tax_id}</p>}
                  </div>
                  <div className="flex gap-2">
                    {activeEntity !== entity.id && (
                      <button onClick={() => handleSetActive(entity.id)}
                        className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-200">
                        Switch to This
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add entity modal */}
          {showAddEntity && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddEntity(false)}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-4">Add New Entity</h2>
                <div className="space-y-3">
                  <Field label="Business Name" value={entityForm.name} onChange={e => setEntityForm(f => ({ ...f, name: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select value={entityForm.type} onChange={e => setEntityForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                        <option>Company</option><option>Sole Trader</option><option>Partnership</option><option>Trust</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                      <select value={entityForm.jurisdiction} onChange={e => setEntityForm(f => ({ ...f, jurisdiction: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                        <option value="AU">Australia</option><option value="US">United States</option>
                        <option value="NZ">New Zealand</option><option value="GB">United Kingdom</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select value={entityForm.currency} onChange={e => setEntityForm(f => ({ ...f, currency: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                        <option>AUD</option><option>USD</option><option>NZD</option><option>GBP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year End</label>
                      <select value={entityForm.year_end} onChange={e => setEntityForm(f => ({ ...f, year_end: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                        <option>30 June</option><option>31 December</option><option>31 March</option><option>30 September</option>
                      </select>
                    </div>
                  </div>
                  <Field label="Tax ID (ABN/EIN/IRD/UTR)" value={entityForm.tax_id} onChange={e => setEntityForm(f => ({ ...f, tax_id: e.target.value }))} placeholder="Optional" />
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setShowAddEntity(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button onClick={handleAddEntity} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Create Entity</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEAM */}
      {activeTab === 'Team' && (
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Team Members</h2>
              <p className="text-xs text-gray-500 mt-0.5">Invite accountants, bookkeepers, or clients with scoped access</p>
            </div>
            <button onClick={() => setShowInvite(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              + Invite Member
            </button>
          </div>

          {/* Role legend */}
          <div className="bg-gray-50 border rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Role Permissions</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
                <div key={role} className="flex items-start gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${ROLE_COLORS[role]}`}>{role}</span>
                  <span className="text-[11px] text-gray-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team list */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Entities</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map(m => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[m.role]}`}>{m.role}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.entities}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.role !== 'partner' && (
                        <button onClick={() => handleRemoveTeamMember(m.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invite modal */}
          {showInvite && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowInvite(false)}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-4">Invite Team Member</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="accountant@firm.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                      <option value="manager">Manager — manage clients, reports, approvals</option>
                      <option value="senior">Senior — full financial access, tax filing</option>
                      <option value="bookkeeper">Bookkeeper — day-to-day transactions</option>
                      <option value="client">Client — view-only access to their entity</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">{ROLE_DESCRIPTIONS[inviteForm.role]}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity Access</label>
                    <div className="space-y-2">
                      {entities.map(entity => (
                        <label key={entity.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" className="rounded" defaultChecked />
                          {entity.name} ({entity.jurisdiction})
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button onClick={handleInvite} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Send Invitation</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NOTIFICATIONS */}
      {activeTab === 'Notifications' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-6">Notification Preferences</h2>
          <div className="space-y-6">
            <Toggle label="Forensic anomaly alerts" description="Get notified when the forensic engine detects suspicious transactions" defaultChecked />
            <Toggle label="Compliance deadline reminders" description="Receive reminders 7, 3, and 1 day before tax deadlines" defaultChecked />
            <Toggle label="Bank feed sync failures" description="Alert when a bank connection fails to sync" defaultChecked />
            <Toggle label="Review queue items" description="Notify when new transactions require manual review" defaultChecked />
            <Toggle label="Month-end close completion" description="Get notified when the autonomous month-end close finishes" defaultChecked />
            <Toggle label="Client portal activity" description="Alert when clients upload documents or submit queries" />
            <Toggle label="AI confidence drops" description="Notify when categorisation accuracy drops below threshold" />
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Save Preferences</button>
          </div>
        </div>
      )}

      {/* BILLING */}
      {activeTab === 'Billing' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Current Plan</h2>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">Firm</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-bold text-gray-900">$499</span>
              <span className="text-gray-500 text-sm">/month</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Unlimited clients, all jurisdictions, forensic detection, full AI agent suite</p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Change Plan</button>
              <button className="px-4 py-2 text-gray-500 rounded-lg text-sm font-medium hover:text-gray-700">Cancel Subscription</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">VISA</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">**** **** **** 4242</p>
                <p className="text-xs text-gray-500">Expires 12/2027</p>
              </div>
            </div>
            <button className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800">Update payment method</button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Billing History</h2>
            <div className="space-y-3">
              {[
                { date: 'Mar 1, 2026', amount: '$499.00', status: 'Paid' },
                { date: 'Feb 1, 2026', amount: '$499.00', status: 'Paid' },
                { date: 'Jan 1, 2026', amount: '$499.00', status: 'Paid' },
              ].map((inv, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{inv.date}</span>
                    <span className="text-sm font-medium text-gray-900">{inv.amount}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-green-600 font-medium">{inv.status}</span>
                    <button className="text-xs text-indigo-600 hover:text-indigo-800">Download</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, defaultValue, placeholder, type = 'text', value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type={type} defaultValue={value === undefined ? defaultValue : undefined} value={value} onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
    </div>
  );
}

function Toggle({ label, description, defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button onClick={() => setChecked(!checked)}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}>
        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform left-0.5"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(0)' }} />
      </button>
    </div>
  );
}
