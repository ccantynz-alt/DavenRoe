import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TABS = ['Profile', 'Practice', 'Notifications', 'Billing'];

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, practice, and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {saved && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
          Settings saved successfully.
        </div>
      )}

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

      {activeTab === 'Practice' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-6">Practice Settings</h2>
          <div className="space-y-5">
            <Field label="Practice Name" defaultValue="Smith & Associates" />
            <Field label="ABN / Tax ID" defaultValue="12 345 678 901" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Jurisdiction</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option>Australia (AU)</option>
                <option>United States (US)</option>
                <option>New Zealand (NZ)</option>
                <option>United Kingdom (GB)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Currency</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option>AUD - Australian Dollar</option>
                <option>USD - US Dollar</option>
                <option>NZD - New Zealand Dollar</option>
                <option>GBP - British Pound</option>
                <option>EUR - Euro</option>
                <option>CAD - Canadian Dollar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Financial Year End</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option>30 June</option>
                <option>31 December</option>
                <option>31 March</option>
                <option>30 September</option>
              </select>
            </div>
            <Field label="Practice Address" placeholder="Level 20, 1 Martin Place, Sydney NSW 2000" />
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      )}

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
            <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Save Preferences
            </button>
          </div>
        </div>
      )}

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
            <p className="text-sm text-gray-500 mb-4">Up to 50 client entities, all jurisdictions, forensic detection, full AI agent suite</p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Change Plan
              </button>
              <button className="px-4 py-2 text-gray-500 rounded-lg text-sm font-medium hover:text-gray-700 transition-colors">
                Cancel Subscription
              </button>
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
            <button className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
              Update payment method
            </button>
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

function Field({ label, defaultValue, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
      />
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
      <button
        onClick={() => setChecked(!checked)}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5 left-0.5' : 'left-0.5'}`}
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}
