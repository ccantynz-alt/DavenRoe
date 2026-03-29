import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

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

const ROLE_BADGE_VARIANT = {
  partner: 'default',
  manager: 'secondary',
  senior: 'secondary',
  bookkeeper: 'outline',
  client: 'success',
};

const ROLE_BADGE_CLASS = {
  partner: 'bg-purple-100 text-purple-700 border-purple-200',
  manager: 'bg-blue-100 text-blue-700 border-blue-200',
  senior: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  bookkeeper: 'bg-gray-100 text-gray-700 border-gray-200',
  client: 'bg-green-100 text-green-700 border-green-200',
};

const ROLE_DESCRIPTIONS = {
  partner: 'Full access — all entities, settings, admin, billing, user management',
  manager: 'Manage clients, reports, approvals, team. No billing or admin access.',
  senior: 'Full financial access — review queue, tax filing, reports. No user management.',
  bookkeeper: 'Day-to-day — transactions, bank feeds, invoicing. No tax filing or admin.',
  client: 'View-only access to their own entity via Client Portal.',
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
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
  const [entityAccess, setEntityAccess] = useState(() => {
    const initial = {};
    DEMO_ENTITIES.forEach(e => { initial[e.id] = true; });
    return initial;
  });

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
    setEntityAccess(() => {
      const initial = {};
      entities.forEach(e => { initial[e.id] = true; });
      return initial;
    });
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
    localStorage.setItem('astra_active_entity', id);
    const entity = entities.find(e => e.id === id);
    toast.success(`Switched to ${entity?.name}`);
  };

  const handleRemoveTeamMember = (id) => {
    setTeam(prev => prev.filter(m => m.id !== id));
    toast.success('Team member removed');
  };

  return (
    <div>
      <motion.div className="mb-6" {...fadeIn}>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, practice, entities, and team</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8 h-auto bg-transparent p-0 border-b border-gray-200 rounded-none w-full justify-start gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={cn(
                'rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium shadow-none bg-transparent',
                'data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent',
                'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium"
            >
              Settings saved successfully.
            </motion.div>
          )}
        </AnimatePresence>

        {/* PROFILE */}
        <TabsContent value="Profile">
          <motion.div {...fadeIn}>
            <Card className="max-w-2xl hover:shadow-sm">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <LabeledField label="Full Name">
                  <Input defaultValue={user?.full_name || ''} />
                </LabeledField>
                <LabeledField label="Email Address">
                  <Input type="email" defaultValue={user?.email || ''} />
                </LabeledField>
                <LabeledField label="Role">
                  <Card className="bg-gray-50 border-gray-200 shadow-none">
                    <CardContent className="px-3 py-2">
                      <span className="text-sm text-gray-600 capitalize">{user?.role || 'Partner'}</span>
                    </CardContent>
                  </Card>
                </LabeledField>
                <LabeledField label="Phone">
                  <Input placeholder="+61 400 000 000" />
                </LabeledField>
                <LabeledField label="Timezone">
                  <Select defaultValue="Australia/Sydney">
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Australia/Sydney">Australia/Sydney (AEST)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                      <SelectItem value="Pacific/Auckland">Pacific/Auckland (NZST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </LabeledField>
              </CardContent>
              <CardFooter className="border-t border-gray-100 pt-6">
                <Button onClick={handleSave}>Save Changes</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        {/* PRACTICE */}
        <TabsContent value="Practice">
          <motion.div {...fadeIn}>
            <Card className="max-w-2xl hover:shadow-sm">
              <CardHeader>
                <CardTitle>Practice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <LabeledField label="Practice Name">
                  <Input defaultValue="Smith & Associates" />
                </LabeledField>
                <LabeledField label="ABN / Tax ID">
                  <Input defaultValue="12 345 678 901" />
                </LabeledField>
                <LabeledField label="Primary Jurisdiction">
                  <Select defaultValue="AU">
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AU">Australia (AU)</SelectItem>
                      <SelectItem value="US">United States (US)</SelectItem>
                      <SelectItem value="NZ">New Zealand (NZ)</SelectItem>
                      <SelectItem value="GB">United Kingdom (GB)</SelectItem>
                    </SelectContent>
                  </Select>
                </LabeledField>
                <LabeledField label="Default Currency">
                  <Select defaultValue="AUD">
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="NZD">NZD - New Zealand Dollar</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </LabeledField>
                <LabeledField label="Practice Address">
                  <Input placeholder="Level 20, 1 Martin Place, Sydney NSW 2000" />
                </LabeledField>
              </CardContent>
              <CardFooter className="border-t border-gray-100 pt-6">
                <Button onClick={handleSave}>Save Changes</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ENTITIES */}
        <TabsContent value="Entities">
          <motion.div className="space-y-6 max-w-3xl" {...fadeIn}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Your Entities</h2>
                <p className="text-xs text-gray-500 mt-0.5">Each entity is a separate business with its own financials, tax, and payroll</p>
              </div>
              <Button onClick={() => setShowAddEntity(true)}>+ Add Entity</Button>
            </div>

            <motion.div className="space-y-3" variants={staggerContainer} initial="initial" animate="animate">
              {entities.map(entity => (
                <motion.div key={entity.id} variants={staggerItem}>
                  <Card
                    className={cn(
                      'transition hover:shadow-sm',
                      activeEntity === entity.id ? 'border-2 border-indigo-400 shadow-sm' : 'border-2 border-gray-200'
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{entity.name}</h3>
                            {activeEntity === entity.id && (
                              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px]">Active</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {entity.type} &middot; {entity.jurisdiction} &middot; {entity.currency} &middot; Year end: {entity.year_end}
                          </p>
                          {entity.tax_id && <p className="text-xs text-gray-400 mt-0.5">Tax ID: {entity.tax_id}</p>}
                        </div>
                        <div className="flex gap-2">
                          {activeEntity !== entity.id && (
                            <Button variant="secondary" size="sm" onClick={() => handleSetActive(entity.id)}>
                              Switch to This
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Add entity dialog */}
            <Dialog open={showAddEntity} onOpenChange={setShowAddEntity}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Entity</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <LabeledField label="Business Name">
                    <Input value={entityForm.name} onChange={e => setEntityForm(f => ({ ...f, name: e.target.value }))} />
                  </LabeledField>
                  <div className="grid grid-cols-2 gap-3">
                    <LabeledField label="Type">
                      <Select value={entityForm.type} onValueChange={v => setEntityForm(f => ({ ...f, type: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Company">Company</SelectItem>
                          <SelectItem value="Sole Trader">Sole Trader</SelectItem>
                          <SelectItem value="Partnership">Partnership</SelectItem>
                          <SelectItem value="Trust">Trust</SelectItem>
                        </SelectContent>
                      </Select>
                    </LabeledField>
                    <LabeledField label="Jurisdiction">
                      <Select value={entityForm.jurisdiction} onValueChange={v => setEntityForm(f => ({ ...f, jurisdiction: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="NZ">New Zealand</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </LabeledField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <LabeledField label="Currency">
                      <Select value={entityForm.currency} onValueChange={v => setEntityForm(f => ({ ...f, currency: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AUD">AUD</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="NZD">NZD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </LabeledField>
                    <LabeledField label="Year End">
                      <Select value={entityForm.year_end} onValueChange={v => setEntityForm(f => ({ ...f, year_end: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30 June">30 June</SelectItem>
                          <SelectItem value="31 December">31 December</SelectItem>
                          <SelectItem value="31 March">31 March</SelectItem>
                          <SelectItem value="30 September">30 September</SelectItem>
                        </SelectContent>
                      </Select>
                    </LabeledField>
                  </div>
                  <LabeledField label="Tax ID (ABN/EIN/IRD/UTR)">
                    <Input value={entityForm.tax_id} onChange={e => setEntityForm(f => ({ ...f, tax_id: e.target.value }))} placeholder="Optional" />
                  </LabeledField>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setShowAddEntity(false)}>Cancel</Button>
                  <Button onClick={handleAddEntity}>Create Entity</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        </TabsContent>

        {/* TEAM */}
        <TabsContent value="Team">
          <motion.div className="space-y-6 max-w-3xl" {...fadeIn}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Team Members</h2>
                <p className="text-xs text-gray-500 mt-0.5">Invite accountants, bookkeepers, or clients with scoped access</p>
              </div>
              <Button onClick={() => setShowInvite(true)}>+ Invite Member</Button>
            </div>

            {/* Role legend */}
            <Card className="bg-gray-50 hover:shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Role Permissions</p>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-2"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
                    <motion.div key={role} className="flex items-start gap-2" variants={staggerItem}>
                      <Badge className={cn('text-[10px] shrink-0 mt-0.5', ROLE_BADGE_CLASS[role])}>{role}</Badge>
                      <span className="text-[11px] text-gray-500">{desc}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>

            {/* Team list */}
            <Card className="overflow-hidden hover:shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-medium">Name</TableHead>
                    <TableHead className="text-xs font-medium">Email</TableHead>
                    <TableHead className="text-xs font-medium">Role</TableHead>
                    <TableHead className="text-xs font-medium">Entities</TableHead>
                    <TableHead className="text-xs font-medium">Status</TableHead>
                    <TableHead className="text-xs font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-gray-900">{m.name}</TableCell>
                      <TableCell className="text-gray-500 text-xs">{m.email}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px]', ROLE_BADGE_CLASS[m.role])}>{m.role}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{m.entities}</TableCell>
                      <TableCell>
                        <Badge variant={m.status === 'active' ? 'success' : 'warning'} className="text-[10px]">
                          {m.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {m.role !== 'partner' && (
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-auto py-1 px-2" onClick={() => handleRemoveTeamMember(m.id)}>
                            Remove
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Invite dialog */}
            <Dialog open={showInvite} onOpenChange={setShowInvite}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <LabeledField label="Email Address">
                    <Input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} placeholder="accountant@firm.com" />
                  </LabeledField>
                  <LabeledField label="Role">
                    <Select value={inviteForm.role} onValueChange={v => setInviteForm(f => ({ ...f, role: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager -- manage clients, reports, approvals</SelectItem>
                        <SelectItem value="senior">Senior -- full financial access, tax filing</SelectItem>
                        <SelectItem value="bookkeeper">Bookkeeper -- day-to-day transactions</SelectItem>
                        <SelectItem value="client">Client -- view-only access to their entity</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400 mt-1">{ROLE_DESCRIPTIONS[inviteForm.role]}</p>
                  </LabeledField>
                  <LabeledField label="Entity Access">
                    <div className="space-y-3">
                      {entities.map(entity => (
                        <div key={entity.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">
                            {entity.name} ({entity.jurisdiction})
                          </span>
                          <Switch
                            checked={entityAccess[entity.id] ?? true}
                            onCheckedChange={(checked) =>
                              setEntityAccess(prev => ({ ...prev, [entity.id]: checked }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </LabeledField>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button>
                  <Button onClick={handleInvite}>Send Invitation</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="Notifications">
          <motion.div {...fadeIn}>
            <Card className="max-w-2xl hover:shadow-sm">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="space-y-6"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  <NotificationToggle label="Forensic anomaly alerts" description="Get notified when the forensic engine detects suspicious transactions" defaultChecked />
                  <NotificationToggle label="Compliance deadline reminders" description="Receive reminders 7, 3, and 1 day before tax deadlines" defaultChecked />
                  <NotificationToggle label="Bank feed sync failures" description="Alert when a bank connection fails to sync" defaultChecked />
                  <NotificationToggle label="Review queue items" description="Notify when new transactions require manual review" defaultChecked />
                  <NotificationToggle label="Month-end close completion" description="Get notified when the autonomous month-end close finishes" defaultChecked />
                  <NotificationToggle label="Client portal activity" description="Alert when clients upload documents or submit queries" />
                  <NotificationToggle label="AI confidence drops" description="Notify when categorisation accuracy drops below threshold" />
                </motion.div>
              </CardContent>
              <CardFooter className="border-t border-gray-100 pt-6">
                <Button onClick={handleSave}>Save Preferences</Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        {/* BILLING */}
        <TabsContent value="Billing">
          <motion.div
            className="space-y-6 max-w-2xl"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={staggerItem}>
              <Card className="hover:shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Current Plan</CardTitle>
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Firm</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-gray-900">$499</span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Unlimited clients, all jurisdictions, forensic detection, full AI agent suite</p>
                  <div className="flex gap-3">
                    <Button variant="secondary">Change Plan</Button>
                    <Button variant="ghost" className="text-gray-500">Cancel Subscription</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Card className="hover:shadow-sm">
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <Card className="bg-gray-50 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">VISA</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">**** **** **** 4242</p>
                          <p className="text-xs text-gray-500">Expires 12/2027</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Button variant="link" className="mt-3 px-0">Update payment method</Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Card className="hover:shadow-sm">
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                </CardHeader>
                <CardContent>
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
                          <Badge variant="success" className="text-xs">{inv.status}</Badge>
                          <Button variant="link" size="sm" className="px-0 h-auto">Download</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LabeledField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function NotificationToggle({ label, description, defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <motion.div className="flex items-start justify-between gap-4" variants={staggerItem}>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </motion.div>
  );
}
