import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SendDocModal from '../components/SendDocModal';

function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      {title && <div className="empty-title">{title}</div>}
      <div className="empty-sub">{sub}</div>
      {action}
    </div>
  );
}

const DOC_STATUS_LABELS = {
  pending:  { label: 'Pending',  cls: 'db-pending' },
  signed:   { label: 'Signed',   cls: 'db-signed' },
  approved: { label: 'Approved', cls: 'db-signed' },
  paid:     { label: 'Paid',     cls: 'db-paid' },
  draft:    { label: 'Draft',    cls: 'db-draft' },
};

// ── DOCUMENTS ────────────────────────────────────────
export function Documents() {
  const { documents, clients, updateDocStatus } = useApp();
  const navigate = useNavigate();
  const [showSend, setShowSend] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const DOC_TYPES_FILTER = ['All', 'Service Agreement / Contract', 'Proposal / Scope of Work', 'Invoice', 'Platform Opportunity Map', 'Launch Package', 'Other'];
  const STATUS_FILTER = ['All', 'pending', 'signed', 'approved', 'paid', 'draft'];

  let filtered = documents;
  if (typeFilter !== 'All') filtered = filtered.filter(d => d.docType === typeFilter);
  if (statusFilter !== 'All') filtered = filtered.filter(d => d.status === statusFilter);

  const pending = documents.filter(d => d.status === 'pending').length;
  const signed = documents.filter(d => ['signed', 'approved', 'paid'].includes(d.status)).length;

  const handleDownload = (doc) => {
    if (doc.fileUrl) window.open(doc.fileUrl, '_blank');
  };

  return (
    <div className="page-content">
      <div className="section-header">
        <div className="section-title">Documents</div>
        <button className="btn" onClick={() => setShowSend(true)}>+ Send Document</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        <div className="stat-card"><div className="stat-label">Awaiting Action</div><div className="stat-value">{pending}</div></div>
        <div className="stat-card"><div className="stat-label">Signed / Approved</div><div className="stat-value">{signed}</div></div>
        <div className="stat-card"><div className="stat-label">Total Sent</div><div className="stat-value">{documents.length}</div></div>
      </div>

      {documents.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <select className="form-input" style={{ width: 220 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            {DOC_TYPES_FILTER.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="form-input" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUS_FILTER.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : DOC_STATUS_LABELS[s]?.label || s}</option>)}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
          title={documents.length === 0 ? 'No Documents Yet' : 'No Matches'}
          sub={documents.length === 0
            ? 'Send contracts, proposals, invoices, and opportunity maps to clients. Track signatures and approvals here.'
            : 'Try adjusting your filters.'}
          action={documents.length === 0 ? <button className="btn" onClick={() => setShowSend(true)}>+ Send First Document</button> : null}
        />
      ) : (
        filtered.map(doc => {
          const s = DOC_STATUS_LABELS[doc.status] || DOC_STATUS_LABELS.pending;
          const client = clients.find(c => c.id === doc.clientId);
          return (
            <div key={doc.id} className="doc-row">
              <div className="doc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="doc-info">
                <div className="doc-name">
                  {doc.docName}{doc.invoiceNumber ? ` #${doc.invoiceNumber}` : ''}
                  {doc.fileName && <span style={{ fontSize: 10, color: 'var(--cr)', marginLeft: 6 }}>{doc.fileName}</span>}
                </div>
                <div className="doc-meta">
                  {client ? `${client.firstName} ${client.lastName}` : '--'} · {doc.docType} · {doc.actionRequired} · Sent {doc.sentDate}
                </div>
              </div>
              <div className="doc-actions">
                <span className={`doc-badge ${s.cls}`}>{s.label}</span>
                {doc.fileUrl && (
                  <button className="btn btn-outline btn-sm" style={{ fontSize: 9 }} onClick={() => handleDownload(doc)}>Download</button>
                )}
                {doc.status === 'pending' && (
                  <>
                    {doc.docType === 'Invoice'
                      ? <button className="btn btn-sm" style={{ fontSize: 9, background: '#1a6b3a' }} onClick={() => updateDocStatus(doc.id, 'paid')}>Mark Paid</button>
                      : <button className="btn btn-sm" style={{ fontSize: 9 }} onClick={() => updateDocStatus(doc.id, 'signed')}>Mark Signed</button>
                    }
                  </>
                )}
                {client && (
                  <button className="btn btn-outline btn-sm" style={{ fontSize: 9 }} onClick={() => navigate(`/clients/${client.id}`)}>
                    Client
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
      {showSend && <SendDocModal onClose={() => setShowSend(false)} />}
    </div>
  );
}

// ── SIGNATURES ────────────────────────────────────────
export function Signatures() {
  const { documents, clients, updateDocStatus } = useApp();
  const navigate = useNavigate();
  const sigDocs = documents.filter(d => d.actionRequired === 'Signature Required');
  const pending = sigDocs.filter(d => d.status === 'pending');
  const completed = sigDocs.filter(d => d.status !== 'pending');

  return (
    <div className="page-content">
      <div className="section-header"><div className="section-title">Signature Requests</div></div>

      {sigDocs.length === 0 ? (
        <EmptyState
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>}
          title="No Signature Requests"
          sub='Documents sent with "Signature Required" will appear here.'
        />
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <div className="section-header" style={{ marginBottom: 10 }}><div className="section-title" style={{ fontSize: 10 }}>Awaiting Signature ({pending.length})</div></div>
              {pending.map(doc => {
                const client = clients.find(c => c.id === doc.clientId);
                return (
                  <div key={doc.id} className="doc-row">
                    <div className="doc-icon" style={{ color: 'var(--cr)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    </div>
                    <div className="doc-info">
                      <div className="doc-name">{doc.docName}</div>
                      <div className="doc-meta">{client ? `${client.firstName} ${client.lastName}` : '--'} · Sent {doc.sentDate}</div>
                    </div>
                    <div className="doc-actions">
                      <span className="doc-badge db-pending">Awaiting</span>
                      {doc.fileUrl && <button className="btn btn-outline btn-sm" style={{ fontSize: 9 }} onClick={() => window.open(doc.fileUrl, '_blank')}>Download</button>}
                      <button className="btn btn-sm" style={{ fontSize: 9 }} onClick={() => updateDocStatus(doc.id, 'signed')}>Mark Signed</button>
                      {client && <button className="btn btn-outline btn-sm" style={{ fontSize: 9 }} onClick={() => navigate(`/clients/${client.id}`)}>Client</button>}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {completed.length > 0 && (
            <>
              <div className="section-header" style={{ margin: '18px 0 10px' }}><div className="section-title" style={{ fontSize: 10 }}>Signed ({completed.length})</div></div>
              {completed.map(doc => {
                const client = clients.find(c => c.id === doc.clientId);
                return (
                  <div key={doc.id} className="doc-row" style={{ opacity: 0.7 }}>
                    <div className="doc-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    </div>
                    <div className="doc-info">
                      <div className="doc-name">{doc.docName}</div>
                      <div className="doc-meta">{client ? `${client.firstName} ${client.lastName}` : '--'} · Signed {doc.updatedDate || doc.sentDate}</div>
                    </div>
                    <div className="doc-actions">
                      <span className="doc-badge db-signed">Signed</span>
                      {doc.fileUrl && <button className="btn btn-outline btn-sm" style={{ fontSize: 9 }} onClick={() => window.open(doc.fileUrl, '_blank')}>Download</button>}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── PAYMENTS ─────────────────────────────────────────
export function Payments() {
  const { documents, clients } = useApp();
  const invoices = documents.filter(d => d.docType === 'Invoice');
  const paid = invoices.filter(d => d.status === 'paid');
  const unpaid = invoices.filter(d => d.status !== 'paid');

  return (
    <div className="page-content">
      <div className="section-header"><div className="section-title">Payments</div></div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
          title="Payment Tracking"
          sub="Invoices you send will appear here. Mark them as paid to track revenue. Stripe integration is planned for Phase 2."
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
            <div className="stat-card"><div className="stat-label">Total Invoices</div><div className="stat-value">{invoices.length}</div></div>
            <div className="stat-card"><div className="stat-label">Paid</div><div className="stat-value" style={{ color: '#1a6b3a' }}>{paid.length}</div></div>
            <div className="stat-card"><div className="stat-label">Outstanding</div><div className="stat-value" style={{ color: 'var(--cr)' }}>{unpaid.length}</div></div>
          </div>
          {invoices.map(doc => {
            const client = clients.find(c => c.id === doc.clientId);
            return (
              <div key={doc.id} className="doc-row">
                <div className="doc-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                </div>
                <div className="doc-info">
                  <div className="doc-name">Invoice #{doc.invoiceNumber} -- {doc.docName}</div>
                  <div className="doc-meta">{client ? `${client.firstName} ${client.lastName}` : '--'} · Sent {doc.sentDate}</div>
                </div>
                <div className="doc-actions">
                  <span className={`doc-badge ${doc.status === 'paid' ? 'db-paid' : 'db-pending'}`}>
                    {doc.status === 'paid' ? 'Paid' : 'Outstanding'}
                  </span>
                  {doc.fileUrl && <button className="btn btn-outline btn-sm" style={{ fontSize: 9 }} onClick={() => window.open(doc.fileUrl, '_blank')}>Download</button>}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────
export function Reports() {
  const { clients, documents, products, getStats } = useApp();
  const stats = getStats();

  const byTier = {};
  clients.forEach(c => {
    const tier = c.tier || 'Unassigned';
    byTier[tier] = (byTier[tier] || 0) + 1;
  });

  const byStage = {};
  clients.forEach(c => { byStage[c.stage] = (byStage[c.stage] || 0) + 1; });

  return (
    <div className="page-content">
      <div className="section-header"><div className="section-title">Reports</div></div>

      {stats.total === 0 ? (
        <EmptyState
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          title="Reports & Analytics"
          sub="Revenue by tier, pipeline velocity, and performance metrics will appear here once you have clients."
        />
      ) : (
        <>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-label">Total Clients</div><div className="stat-value">{stats.total}</div></div>
            <div className="stat-card"><div className="stat-label">Active</div><div className="stat-value">{stats.active}</div></div>
            <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value">{stats.complete}</div></div>
            <div className="stat-card"><div className="stat-label">Products</div><div className="stat-value">{products.length}</div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="detail-card">
              <div className="detail-card-title">Clients by Tier</div>
              {Object.entries(byTier).map(([tier, count]) => (
                <div key={tier} className="detail-row">
                  <span className="detail-label" style={{ fontSize: 11 }}>{tier}</span>
                  <span style={{ fontWeight: 700, color: 'var(--cr)' }}>{count}</span>
                </div>
              ))}
            </div>
            <div className="detail-card">
              <div className="detail-card-title">Clients by Stage</div>
              {Object.entries(byStage).map(([stage, count]) => (
                <div key={stage} className="detail-row">
                  <span className="detail-label" style={{ fontSize: 11 }}>{stage}</span>
                  <span style={{ fontWeight: 700, color: 'var(--cr)' }}>{count}</span>
                </div>
              ))}
            </div>
            <div className="detail-card">
              <div className="detail-card-title">Documents</div>
              <div className="detail-row"><span className="detail-label">Total Sent</span><span>{documents.length}</span></div>
              <div className="detail-row"><span className="detail-label">Pending</span><span>{documents.filter(d => d.status === 'pending').length}</span></div>
              <div className="detail-row"><span className="detail-label">Signed / Approved</span><span>{documents.filter(d => ['signed','approved'].includes(d.status)).length}</span></div>
              <div className="detail-row"><span className="detail-label">Invoices Paid</span><span style={{ color: '#1a6b3a', fontWeight: 700 }}>{documents.filter(d => d.status === 'paid').length}</span></div>
              <div className="detail-row"><span className="detail-label">With Files</span><span>{documents.filter(d => d.fileUrl).length}</span></div>
            </div>
            <div className="detail-card">
              <div className="detail-card-title">Products</div>
              {products.length === 0 ? (
                <div style={{ fontSize: 12, color: '#aaa' }}>No products created yet.</div>
              ) : (
                products.map(p => (
                  <div key={p.id} className="detail-row">
                    <span className="detail-label" style={{ fontSize: 11 }}>{p.name}</span>
                    <span style={{ fontSize: 10, color: '#888' }}>{p.tier} {p.price && `· ${p.price}`}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── TEAM ─────────────────────────────────────────────
export function Team() {
  const { user } = useAuth();
  const { authFetch } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'admin' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  React.useEffect(() => {
    authFetch('/api/auth/users')
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authFetch]);

  const handleAdd = async () => {
    setError('');
    if (!form.email.trim() || !form.password.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add member');
      }
      const newUser = await res.json();
      setUsers(prev => [...prev, newUser]);
      setShowAdd(false);
      setForm({ email: '', password: '', role: 'admin' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`/api/auth/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove member');
      }
      setUsers(prev => prev.filter(u => u.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message);
      setDeleteConfirm(null);
    }
  };

  const ROLE_LABELS = {
    admin: { label: 'Admin', cls: 'tier-amp' },
    client: { label: 'Client', cls: 'tier-ess' },
  };

  return (
    <div className="page-content">
      <div className="section-header">
        <div className="section-title">Team</div>
        <button className="btn" onClick={() => setShowAdd(true)}>+ Add Member</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        <div className="stat-card"><div className="stat-label">Total Members</div><div className="stat-value">{users.length}</div></div>
        <div className="stat-card"><div className="stat-label">Admins</div><div className="stat-value">{users.filter(u => u.role === 'admin').length}</div></div>
        <div className="stat-card"><div className="stat-label">Client Logins</div><div className="stat-value">{users.filter(u => u.role === 'client').length}</div></div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Email</th>
              <th style={{ width: '15%' }}>Role</th>
              <th style={{ width: '20%' }}>Created</th>
              <th style={{ width: '15%' }}>Status</th>
              <th style={{ width: '15%' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px 0', color: '#aaa' }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px 0', color: '#aaa' }}>No team members found.</td></tr>
            ) : (
              users.map(u => {
                const role = ROLE_LABELS[u.role] || ROLE_LABELS.client;
                const isYou = u.id === user?.id;
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>
                      {u.email}
                      {isYou && <span style={{ fontSize: 9, color: '#888', marginLeft: 6 }}>(you)</span>}
                    </td>
                    <td><span className={`tier-tag ${role.cls}`}>{role.label}</span></td>
                    <td style={{ color: 'var(--mauve)', fontSize: 11 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><span className="status-pill pill-active">Active</span></td>
                    <td>
                      {!isYou && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#c0392b', fontSize: 9 }}
                          onClick={() => setDeleteConfirm(u)}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Team Member</span>
              <button className="modal-close" onClick={() => setShowAdd(false)}>x</button>
            </div>
            <div className="modal-body">
              {error && <div style={{ color: '#c0392b', fontSize: 11, marginBottom: 12 }}>{error}</div>}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="team@gobenotable.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="admin">Admin (full access)</option>
                  <option value="client">Client (restricted)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-sm" onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Member'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Remove Member</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>x</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>Remove <strong>{deleteConfirm.email}</strong> from the team? They will no longer be able to log in.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-sm" style={{ background: '#c0392b' }} onClick={() => handleDelete(deleteConfirm.id)}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SETTINGS ─────────────────────────────────────────
export function Settings() {
  const { clients, documents, products, clearAllData } = useApp();
  const { changePassword } = useAuth();
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const handleClearData = async () => {
    if (window.confirm('Clear ALL portal data? This cannot be undone.')) {
      try {
        await clearAllData();
      } catch (err) {
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    setPwMsg('');
    if (!pwForm.current || !pwForm.new) {
      setPwError('Fill in all fields.');
      return;
    }
    if (pwForm.new !== pwForm.confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.new.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    try {
      await changePassword(pwForm.current, pwForm.new);
      setPwMsg('Password updated successfully.');
      setPwForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPwError(err.message);
    }
  };

  return (
    <div className="page-content">
      <div className="section-header"><div className="section-title">Settings</div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="detail-card">
          <div className="detail-card-title">Business Info</div>
          <div className="form-group"><label className="form-label">Business Name</label><input className="form-input" defaultValue="DakJen Creative LLC" /></div>
          <div className="form-group"><label className="form-label">Portal Email</label><input className="form-input" defaultValue="admin@gobenotable.com" /></div>
          <div className="form-group"><label className="form-label">Website</label><input className="form-input" defaultValue="gobenotable.com" /></div>
          <button className="btn btn-sm">Save Changes</button>
        </div>
        <div className="detail-card">
          <div className="detail-card-title">Change Password</div>
          {pwError && <div style={{ color: '#c0392b', fontSize: 11, marginBottom: 8 }}>{pwError}</div>}
          {pwMsg && <div style={{ color: '#1a6b3a', fontSize: 11, marginBottom: 8 }}>{pwMsg}</div>}
          <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={pwForm.new} onChange={e => setPwForm(f => ({ ...f, new: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-input" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} /></div>
          <button className="btn btn-sm" onClick={handleChangePassword}>Update Password</button>
        </div>
        <div className="detail-card">
          <div className="detail-card-title">Data</div>
          <div className="detail-row"><span className="detail-label">Clients stored</span><span>{clients.length}</span></div>
          <div className="detail-row"><span className="detail-label">Documents stored</span><span>{documents.length}</span></div>
          <div className="detail-row"><span className="detail-label">Products</span><span>{products.length}</span></div>
          <div className="detail-row"><span className="detail-label">Storage</span><span>Neon PostgreSQL</span></div>
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--cr-bg)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--mauve)', lineHeight: 1.6 }}>
            Data is stored in your Neon PostgreSQL database. Files stored via Vercel Blob.
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, color: '#c0392b', borderColor: '#c0392b' }} onClick={handleClearData}>
            Clear All Data
          </button>
        </div>
        <div className="detail-card">
          <div className="detail-card-title">Phase 2 Roadmap</div>
          <div style={{ fontSize: 12, color: 'var(--dkgray)', lineHeight: 2 }}>
            <div style={{ color: '#1a6b3a' }}>&#x2611; Backend database (Neon PostgreSQL)</div>
            <div style={{ color: '#1a6b3a' }}>&#x2611; Authentication & login system</div>
            <div style={{ color: '#1a6b3a' }}>&#x2611; Products & tier management</div>
            <div style={{ color: '#1a6b3a' }}>&#x2611; Document file uploads</div>
            <div>&#x2610; Client-facing portal</div>
            <div>&#x2610; E-signature integration</div>
            <div>&#x2610; Stripe payment processing</div>
            <div>&#x2610; Email notifications</div>
          </div>
        </div>
      </div>
    </div>
  );
}
