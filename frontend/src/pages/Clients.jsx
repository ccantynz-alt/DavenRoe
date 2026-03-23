import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';

const ENTITY_TYPES = ['company', 'trust', 'sole_trader', 'partnership', 'smsf', 'not_for_profit', 'individual'];
const JURISDICTIONS = ['AU', 'NZ', 'GB', 'US'];

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ search: '', jurisdiction: '', type: '' });
  const [form, setForm] = useState({ name: '', entity_type: 'company', jurisdiction: 'AU', contact_email: '' });
  const toast = useToast();

  useEffect(() => {
    axios.get('/api/v1/clients/', { params: filter })
      .then((res) => setClients(res.data.entities || []))
      .catch(() => setClients([]));
  }, [filter]);

  const handleCreate = async () => {
    try {
      await axios.post('/api/v1/clients/', form);
      setShowForm(false);
      setForm({ name: '', entity_type: 'company', jurisdiction: 'AU', contact_email: '' });
      // Refresh
      const res = await axios.get('/api/v1/clients/', { params: filter });
      setClients(res.data.entities || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Clients</h2>
          <p className="text-gray-500 mt-1">{clients.length} entities</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-astra-600 text-white rounded-lg text-sm font-medium hover:bg-astra-700">
          + New Entity
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Search clients..." value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm flex-1" />
        <select value={filter.jurisdiction} onChange={(e) => setFilter({ ...filter, jurisdiction: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Jurisdictions</option>
          {JURISDICTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Types</option>
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* New entity form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="font-bold mb-4">New Client Entity</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input placeholder="Entity name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm" />
            <select value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm">
              {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <select value={form.jurisdiction} onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm">
              {JURISDICTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
            <button onClick={handleCreate}
              className="px-4 py-2 bg-astra-600 text-white rounded-lg text-sm font-medium hover:bg-astra-700">
              Create
            </button>
          </div>
        </div>
      )}

      {/* Client list */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Jurisdiction</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{client.name}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{(client.entity_type || '').replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{client.jurisdiction}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    client.status === 'active' ? 'bg-green-100 text-green-700' :
                    client.status === 'archived' ? 'bg-gray-100 text-gray-500' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{client.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{client.contact_email || '-'}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No clients yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
