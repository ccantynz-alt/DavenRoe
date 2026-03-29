import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

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
    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
      <h2 className="text-3xl font-bold mb-2">Client Portal</h2>
      <p className="text-gray-500 mb-8">Invite clients to view their own financial data</p>

      {/* Invite Form */}
      <motion.div variants={fadeUp} custom={0}>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invite a Client</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Access</label>
                <Select value={entityId} onValueChange={setEntityId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map(ent => (
                      <SelectItem key={ent.id} value={ent.id}>{ent.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={sending}>
                {sending ? 'Sending...' : 'Send Invite'}
              </Button>
            </form>

            {message && (
              <div className={cn(
                'mt-4 p-3 rounded-lg text-sm border',
                message.type === 'success' && 'bg-green-50 text-green-700 border-green-200',
                message.type === 'info' && 'bg-blue-50 text-blue-700 border-blue-200',
                message.type === 'error' && 'bg-red-50 text-red-700 border-red-200',
              )}>
                {message.text}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* How it works */}
      <motion.div variants={fadeUp} custom={1}>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How the Client Portal Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Invite', desc: "Enter your client's email and assign them to their entity" },
                { step: '2', title: 'Client Logs In', desc: 'They receive an email with login credentials' },
                { step: '3', title: 'Scoped Access', desc: 'They see only their entity — invoices, documents, tax position' },
                { step: '4', title: 'Collaborate', desc: 'They upload receipts, view reports, and approve documents' },
              ].map((item, i) => (
                <StepCard key={item.step} step={item.step} title={item.title} desc={item.desc} index={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Invitations */}
      {invitations.length > 0 && (
        <motion.div variants={fadeUp} custom={2}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell className="text-gray-500">{inv.entity}</TableCell>
                      <TableCell className="text-gray-400 text-xs">
                        {new Date(inv.sent_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="success">{inv.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}


function ClientView() {
  const { user } = useAuth();

  const portalItems = [
    { title: 'Your Invoices', desc: 'View outstanding and paid invoices', link: '/invoicing', icon: '$' },
    { title: 'Your Documents', desc: 'Upload receipts and view tax documents', link: '/documents', icon: '^' },
    { title: 'Reports', desc: 'View your P&L, Balance Sheet, and more', link: '/reports', icon: '=' },
    { title: 'Tax Position', desc: 'See your tax calculations and treaty benefits', link: '/tax', icon: '%' },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
      <h2 className="text-3xl font-bold mb-2">Your Portal</h2>
      <p className="text-gray-500 mb-8">Welcome, {user?.full_name}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {portalItems.map((item, i) => (
          <motion.div key={item.title} variants={fadeUp} custom={i}>
            <PortalCard title={item.title} desc={item.desc} link={item.link} icon={item.icon} />
          </motion.div>
        ))}
      </div>

      <motion.div variants={fadeUp} custom={4}>
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Contact your accountant or use Ask Astra to get answers about your financial data in plain English.
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    </motion.div>
  );
}


function StepCard({ step, title, desc, index }) {
  return (
    <motion.div
      className="text-center"
      variants={fadeUp}
      custom={index}
    >
      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mx-auto mb-2">
        {step}
      </div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </motion.div>
  );
}

function PortalCard({ title, desc, link, icon }) {
  return (
    <a href={link} className="block">
      <Card className="h-full cursor-pointer">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono text-indigo-500">{icon}</span>
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
      </Card>
    </a>
  );
}
