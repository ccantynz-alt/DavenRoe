import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

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

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
  expired: 'bg-amber-100 text-amber-600',
  revoked: 'bg-red-50 text-red-400',
  in_progress: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  changes_requested: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};

export default function PeerReview() {
  const [tab, setTab] = useState('invites'); // invites | reviews
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Peer Review</h2>
          <p className="text-gray-500 mt-1">Authorize external accountants for manual checks and sign-offs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInviteForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Invite Reviewer
          </button>
          <button onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-white border text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            Create Review
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[['invites', `Invitations (${invites.length})`], ['reviews', `Reviews (${reviews.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{label}</button>
        ))}
      </div>

      {/* Invitations Tab */}
      {tab === 'invites' && (
        <div className="space-y-3">
          {invites.length === 0 && !showInviteForm && (
            <div className="bg-white border rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Invitations Yet</h3>
              <p className="text-sm text-gray-500 mb-4">Invite external accountants or auditors to review your work</p>
              <button onClick={() => setShowInviteForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                Send First Invitation
              </button>
            </div>
          )}

          {invites.map(inv => (
            <div key={inv.id} className="bg-white border rounded-xl p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{inv.invitee_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
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
                <button onClick={() => revokeInvite(inv.id)}
                  className="text-xs text-red-400 hover:text-red-600 font-medium">Revoke</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length === 0 && !showReviewForm && (
            <div className="bg-white border rounded-xl p-12 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-sm text-gray-500 mb-4">Create a review to request sign-off from external accountants</p>
              <button onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                Create First Review
              </button>
            </div>
          )}

          {reviews.map(rev => (
            <div key={rev.id} className="bg-white border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{rev.description}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[rev.status]}`}>{rev.status}</span>
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
                        <div className={`w-2 h-2 rounded-full ${
                          so.decision === 'approved' ? 'bg-green-500' :
                          so.decision === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                        <span className="font-medium">{so.reviewer_name}</span>
                        <span className="text-gray-400">— {so.decision}</span>
                        {so.notes && <span className="text-gray-400 text-xs italic">"{so.notes}"</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Invite External Reviewer</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={inviteForm.invitee_name} onChange={e => setInviteForm(f => ({ ...f, invitee_name: e.target.value }))}
                    placeholder="Jane Smith" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={inviteForm.invitee_email} onChange={e => setInviteForm(f => ({ ...f, invitee_email: e.target.value }))}
                    placeholder="jane@firm.com" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
                <input value={inviteForm.entity_name} onChange={e => setInviteForm(f => ({ ...f, entity_name: e.target.value }))}
                  placeholder="Acme Corp Pty Ltd" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access expires in</label>
                  <select value={inviteForm.expires_in_days} onChange={e => setInviteForm(f => ({ ...f, expires_in_days: parseInt(e.target.value) }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access Scope</label>
                <div className="space-y-2">
                  {SCOPES.map(s => (
                    <label key={s.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      inviteForm.scope === s.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input type="radio" name="scope" value={s.value} checked={inviteForm.scope === s.value}
                        onChange={e => setInviteForm(f => ({ ...f, scope: e.target.value }))} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{s.label}</p>
                        <p className="text-xs text-gray-500">{s.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                <textarea value={inviteForm.message} onChange={e => setInviteForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Hi Jane, could you review the March BAS before submission?"
                  rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowInviteForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={sendInvite}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Send Invitation</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Create Review Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
                <input value={reviewForm.entity_name} onChange={e => setReviewForm(f => ({ ...f, entity_name: e.target.value }))}
                  placeholder="Acme Corp Pty Ltd" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Type</label>
                <select value={reviewForm.review_type} onChange={e => setReviewForm(f => ({ ...f, review_type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="month_end">Month-End Review</option>
                  <option value="tax_return">Tax Return Review</option>
                  <option value="bas_review">BAS/VAT Review</option>
                  <option value="annual_audit">Annual Audit</option>
                  <option value="ad_hoc">Ad-Hoc Review</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea value={reviewForm.description} onChange={e => setReviewForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Please review the March 2026 month-end close for Acme Corp"
                  rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={reviewForm.due_date} onChange={e => setReviewForm(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={createReview}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Create Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
