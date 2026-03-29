import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus, Search, Users } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

const ENTITY_TYPES = ['company', 'trust', 'sole_trader', 'partnership', 'smsf', 'not_for_profit', 'individual'];
const JURISDICTIONS = ['AU', 'NZ', 'GB', 'US'];

function statusVariant(status) {
  if (status === 'active') return 'success';
  if (status === 'archived') return 'secondary';
  return 'warning';
}

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Clients</h2>
          <p className="text-gray-500 mt-1">{clients.length} entities</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          New Entity
        </Button>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex gap-3 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search clients..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="pl-9"
          />
        </div>
        <Select
          value={filter.jurisdiction || '__all__'}
          onValueChange={(val) => setFilter({ ...filter, jurisdiction: val === '__all__' ? '' : val })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Jurisdictions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Jurisdictions</SelectItem>
            {JURISDICTIONS.map((j) => (
              <SelectItem key={j} value={j}>{j}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filter.type || '__all__'}
          onValueChange={(val) => setFilter({ ...filter, type: val === '__all__' ? '' : val })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Types</SelectItem>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* New entity form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Client Entity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Entity name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Select
                  value={form.entity_type}
                  onValueChange={(val) => setForm({ ...form, entity_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={form.jurisdiction}
                  onValueChange={(val) => setForm({ ...form, jurisdiction: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Jurisdiction" />
                  </SelectTrigger>
                  <SelectContent>
                    {JURISDICTIONS.map((j) => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCreate}>
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Client list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-gray-500 capitalize">{(client.entity_type || '').replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{client.jurisdiction}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(client.status)}>{client.status}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{client.contact_email || '-'}</TableCell>
                </TableRow>
              ))}
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-gray-300" />
                      No clients yet
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </motion.div>
  );
}
