import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
                </div>
                <div className="doc-meta">
                  {client ? `${client.firstName} ${client.lastName}` : '—'} · {doc.docType} · {doc.actionRequired} · Sent {doc.sentDate}
                </div>
              </div>
              <div className="doc-actions">
                <span className={`doc-badge ${s.cls}`}>{s.label}</span>
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
                    Client →
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
                      <div className="doc-meta">{client ? `${client.firstName} ${client.lastName}` : '—'} · Sent {doc.sentDate}</div>
                    </div>
                    <div className="doc-actions">
                      <span className="doc-badge db-pending">Awaiting</span>
                      <button className="btn btn-sm" style={{ fontSize: 9 }} onClick={() => updateDocStatus(doc.id, 'signed')}>Mark Signed</button>
                      {client && <button className="btn btn-outline btn-sm" style={{ fontSize: 9 }} onClick={() => navigate(`/clients/${client.id}`)}>Client →</button>}
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
                      <div className="doc-meta">{client ? `${client.firstName} ${client.lastName}` : '—'} · Signed {doc.updatedDate || doc.sentDate}</div>
                    </div>
                    <div className="doc-actions">
                      <span className="doc-badge db-signed">Signed</span>
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
                  <div className="doc-name">Invoice #{doc.invoiceNumber} — {doc.docName}</div>
                  <div className="doc-meta">{client ? `${client.firstName} ${client.lastName}` : '—'} · Sent {doc.sentDate}</div>
                </div>
                <div className="doc-actions">
                  <span className={`doc-badge ${doc.status === 'paid' ? 'db-paid' : 'db-pending'}`}>
                    {doc.status === 'paid' ? 'Paid' : 'Outstanding'}
                  </span>
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
  const { clients, documents, getStats } = useApp();
  const stats = getStats();

  const byTier = {};
  clients.forEach(c => { byTier[c.tier] = (byTier[c.tier] || 0) + 1; });

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
            <div className="stat-card"><div className="stat-label">Pipeline Value</div><div className="stat-value">${stats.pipelineValue.toLocaleString()}</div></div>
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── TEAM ─────────────────────────────────────────────
export function Team() {
  return (
    <div className="page-content">
      <div className="section-header">
        <div className="section-title">Team</div>
        <button className="btn">+ Invite Member</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Name</th>
              <th style={{ width: '35%' }}>Email</th>
              <th style={{ width: '20%' }}>Role</th>
              <th style={{ width: '15%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 700 }}>Admin</td>
              <td>admin@gobenotable.com</td>
              <td><span className="tier-tag tier-amp">Owner</span></td>
              <td><span className="status-pill pill-active">Active</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--white)', border: '0.5px solid var(--border)', fontSize: 12, color: 'var(--mauve)', lineHeight: 1.7 }}>
        Team member invites and role-based permissions are planned for Phase 2.
      </div>
    </div>
  );
}

// ── SETTINGS ─────────────────────────────────────────
export function Settings() {
  const { clients, documents, clearAllData } = useApp();

  const handleClearData = async () => {
    if (window.confirm('Clear ALL portal data? This cannot be undone.')) {
      try {
        await clearAllData();
      } catch (err) {
        alert('Failed to clear data. Please try again.');
      }
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
          <div className="detail-card-title">Notifications</div>
          <div style={{ fontSize: 12, color: 'var(--dkgray)', lineHeight: 2.2 }}>
            <div>☑ Email when a client signs a document</div>
            <div>☑ Email when a payment is received</div>
            <div>☐ Email when a client views a document</div>
            <div>☑ Weekly pipeline summary</div>
          </div>
          <button className="btn btn-sm" style={{ marginTop: 12 }}>Save Preferences</button>
        </div>
        <div className="detail-card">
          <div className="detail-card-title">Data</div>
          <div className="detail-row"><span className="detail-label">Clients stored</span><span>{clients.length}</span></div>
          <div className="detail-row"><span className="detail-label">Documents stored</span><span>{documents.length}</span></div>
          <div className="detail-row"><span className="detail-label">Storage</span><span>Neon PostgreSQL</span></div>
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--cr-bg)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--mauve)', lineHeight: 1.6 }}>
            Data is stored in your Neon PostgreSQL database and syncs across all devices.
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, color: '#c0392b', borderColor: '#c0392b' }} onClick={handleClearData}>
            Clear All Data
          </button>
        </div>
        <div className="detail-card">
          <div className="detail-card-title">Phase 2 Roadmap</div>
          <div style={{ fontSize: 12, color: 'var(--dkgray)', lineHeight: 2 }}>
            <div style={{ color: '#1a6b3a' }}>&#x2611; Backend database (Neon PostgreSQL)</div>
            <div>&#x2610; Client-facing portal with login</div>
            <div>&#x2610; E-signature integration</div>
            <div>&#x2610; Stripe payment processing</div>
            <div>&#x2610; Essentials package purchase flow</div>
            <div>&#x2610; Auto-generate proposals/invoices</div>
            <div>&#x2610; Team member accounts</div>
            <div>&#x2610; Email notifications</div>
          </div>
        </div>
      </div>
    </div>
  );
}
