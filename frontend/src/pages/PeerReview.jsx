import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

const ROLES = [
  { value: 'external_accountant', label: 'External Accountant' },
  { value: 'external_auditor', label: 'External Auditor' },
  { value: 'tax_agent', label: 'Tax Agent' },
  { value: 'partner', label: 'Partner' },
  { value: 'peer_reviewer', label: 'Peer Reviewer' },
];

const SCOPES = [
  { value: 'read_only', label: 'Read Only', desc: 'Can view transactions, reports, and documents but cannot approve' },
  { value: 'review_approve', label: 'Review & Approve', desc: 'Can review work, approve/reject items, and add notes' },
  { value: 'full_review', label: 'Full Review', desc: 'Full access including audit trail, forensics, and requesting changes' },
];

const STATUS_VARIANT = {
  pending: 'secondary',
  accepted: 'success',
  declined: 'destructive',
  expired: 'warning',
  revoked: 'destructive',
  in_progress: 'default',
  approved: 'success',
  rejected: 'destructive',
  changes_requested: 'warning',
  completed: 'success',
};

export default function PeerReview() {
  const [invites, setInvites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    entity_id: 'default', entity_name: '', invitee_email: '', invitee_name: '',
    role: 'external_accountant', scope: 'review_approve', expires_in_days: 30, message: '',
  });
  const [reviewForm, setReviewForm] = useState({
    entity_id: 'default', entity_name: '', review_type: 'month_end',
    description: '', assigned_reviewers: [], due_date: '',
  });
  const toast = useToast();

  const fetchData = () => {
    api.get('/peer-review/invites').then(r => setInvites(r.data.invites || [])).catch(() => null);
    api.get('/peer-review/reviews').then(r => setReviews(r.data.reviews || [])).catch(() => null);
  };

  useEffect(() => { fetchData(); }, []);

  const sendInvite = async () => {
    if (!inviteForm.invitee_email || !inviteForm.invitee_name) {
      return toast.error('Name and email are required');
    }
    try {
      await api.post('/peer-review/invites', inviteForm);
      toast.success(`Invitation sent to ${inviteForm.invitee_name}`);
      setShowInviteForm(false);
      setInviteForm({ entity_id: 'default', entity_name: '', invitee_email: '', invitee_name: '', role: 'external_accountant', scope: 'review_approve', expires_in_days: 30, message: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send invite');
    }
  };

  const revokeInvite = async (id) => {
    try {
      await api.post(`/peer-review/invites/${id}/revoke`);
      toast.success('Invitation revoked');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to revoke');
    }
  };

  const createReview = async () => {
    if (!reviewForm.description) return toast.error('Description is required');
    try {
      await api.post('/peer-review/reviews', reviewForm);
      toast.success('Review created');
      setShowReviewForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create review');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Peer Review</h2>
          <p className="text-gray-500 mt-1">Authorize external accountants for manual checks and sign-offs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowInviteForm(true)}>
            Invite Reviewer
          </Button>
          <Button variant="outline" onClick={() => setShowReviewForm(true)}>
            Create Review
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invites" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="invites">Invitations ({invites.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
        </TabsList>

        {/* Invitations Tab */}
        <TabsContent value="invites">
          <div className="space-y-3">
            {invites.length === 0 && !showInviteForm && (
              <Card className="p-12 text-center">
                <CardContent className="flex flex-col items-center p-0">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Invitations Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Invite external accountants or auditors to review your work</p>
                  <Button onClick={() => setShowInviteForm(true)}>
                    Send First Invitation
                  </Button>
                </CardContent>
              </Card>
            )}

            {invites.map((inv, index) => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card>
                  <CardContent className="p-5 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{inv.invitee_name}</span>
                        <Badge variant={STATUS_VARIANT[inv.status] || 'secondary'}>
                          {inv.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{inv.invitee_email}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>Role: {ROLES.find(r => r.value === inv.role)?.label || inv.role}</span>
                        <span>Scope: {SCOPES.find(s => s.value === inv.scope)?.label || inv.scope}</span>
                        <span>Entity: {inv.entity_name || inv.entity_id}</span>
                        <span>Expires: {new Date(inv.expires_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {inv.status === 'pending' && (
                      <Button variant="ghost" size="sm" onClick={() => revokeInvite(inv.id)}
                        className="text-red-400 hover:text-red-600">
                        Revoke
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <div className="space-y-3">
            {reviews.length === 0 && !showReviewForm && (
              <Card className="p-12 text-center">
                <CardContent className="flex flex-col items-center p-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Reviews Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Create a review to request sign-off from external accountants</p>
                  <Button onClick={() => setShowReviewForm(true)}>
                    Create First Review
                  </Button>
                </CardContent>
              </Card>
            )}

            {reviews.map((rev, index) => (
              <motion.div key={rev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{rev.description}</span>
                          <Badge variant={STATUS_VARIANT[rev.status] || 'secondary'}>
                            {rev.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{rev.entity_name || rev.entity_id} &middot; {rev.review_type?.replace('_', ' ')}</p>
                      </div>
                      {rev.due_date && (
                        <span className="text-xs text-gray-400">Due: {new Date(rev.due_date).toLocaleDateString()}</span>
                      )}
                    </div>

                    {/* Sign-offs */}
                    {rev.sign_offs?.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">Sign-offs ({rev.sign_offs.length}/{rev.assigned_reviewers?.length || 0})</p>
                        <div className="space-y-1">
                          {rev.sign_offs.map((so, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div className={cn('w-2 h-2 rounded-full',
                                so.decision === 'approved' ? 'bg-green-500' :
                                so.decision === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                              )} />
                              <span className="font-medium">{so.reviewer_name}</span>
                              <span className="text-gray-400">-- {so.decision}</span>
                              {so.notes && <span className="text-gray-400 text-xs italic">"{so.notes}"</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite Form Dialog */}
      <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite External Reviewer</DialogTitle>
            <DialogDescription>Send an invitation to an external accountant or auditor to review your work.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Input value={inviteForm.invitee_name} onChange={e => setInviteForm(f => ({ ...f, invitee_name: e.target.value }))}
                  placeholder="Jane Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <Input type="email" value={inviteForm.invitee_email} onChange={e => setInviteForm(f => ({ ...f, invitee_email: e.target.value }))}
                  placeholder="jane@firm.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
              <Input value={inviteForm.entity_name} onChange={e => setInviteForm(f => ({ ...f, entity_name: e.target.value }))}
                placeholder="Acme Corp Pty Ltd" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <Select value={inviteForm.role} onValueChange={val => setInviteForm(f => ({ ...f, role: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access expires in</label>
                <Select value={String(inviteForm.expires_in_days)} onValueChange={val => setInviteForm(f => ({ ...f, expires_in_days: parseInt(val) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Scope</label>
              <div className="space-y-2">
                {SCOPES.map(s => (
                  <Card key={s.value}
                    className={cn('cursor-pointer transition-colors',
                      inviteForm.scope === s.value ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                    )}
                    onClick={() => setInviteForm(f => ({ ...f, scope: s.value }))}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <input type="radio" name="scope" value={s.value} checked={inviteForm.scope === s.value}
                        onChange={() => setInviteForm(f => ({ ...f, scope: s.value }))} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{s.label}</p>
                        <p className="text-xs text-gray-500">{s.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
              <Textarea value={inviteForm.message} onChange={e => setInviteForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Hi Jane, could you review the March BAS before submission?"
                rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteForm(false)}>Cancel</Button>
            <Button onClick={sendInvite}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Review Request</DialogTitle>
            <DialogDescription>Request a sign-off from external accountants on specific work.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
              <Input value={reviewForm.entity_name} onChange={e => setReviewForm(f => ({ ...f, entity_name: e.target.value }))}
                placeholder="Acme Corp Pty Ltd" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Type</label>
              <Select value={reviewForm.review_type} onValueChange={val => setReviewForm(f => ({ ...f, review_type: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month_end">Month-End Review</SelectItem>
                  <SelectItem value="tax_return">Tax Return Review</SelectItem>
                  <SelectItem value="bas_review">BAS/VAT Review</SelectItem>
                  <SelectItem value="annual_audit">Annual Audit</SelectItem>
                  <SelectItem value="ad_hoc">Ad-Hoc Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <Textarea value={reviewForm.description} onChange={e => setReviewForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Please review the March 2026 month-end close for Acme Corp"
                rows={3} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <Input type="date" value={reviewForm.due_date} onChange={e => setReviewForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewForm(false)}>Cancel</Button>
            <Button onClick={createReview}>Create Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
