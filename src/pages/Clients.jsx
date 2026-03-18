import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { getTierClass, STAGE_STYLES, STAGES, getInitials } from '../data/constants';
import AddClientModal from '../components/AddClientModal';
import SendDocModal from '../components/SendDocModal';

// ── STATUS BADGE ──────────────────────────────────────
const DOC_STATUS_LABELS = {
  pending: { label: 'Pending', cls: 'db-pending' },
  signed:  { label: 'Signed',  cls: 'db-signed'  },
  approved:{ label: 'Approved',cls: 'db-signed'  },
  paid:    { label: 'Paid',    cls: 'db-paid'     },
  draft:   { label: 'Draft',   cls: 'db-draft'    },
};

const DEL_STATUS = {
  pending:     { label: 'Not Started', color: '#bbb' },
  'in-progress': { label: 'In Progress', color: '#c4901a' },
  done:        { label: 'Done', color: '#1a6b3a' },
};

// ── CLIENTS LIST ─────────────────────────────────────
export function ClientsList() {
  const { searchClients } = useApp();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');

  let results = searchClients(query);
  if (stageFilter !== 'All') results = results.filter(c => c.stage === stageFilter);

  return (
    <div className="page-content">
      <div className="section-header">
        <div className="section-title">All Clients</div>
        <button className="btn" onClick={() => setShowAdd(true)}>+ New Client</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <input
          className="form-input"
          style={{ maxWidth: 280 }}
          placeholder="Search clients..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select className="form-input" style={{ width: 160 }} value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
          <option value="All">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Client</th>
              <th style={{ width: '16%' }}>Tier</th>
              <th style={{ width: '13%' }}>Stage</th>
              <th style={{ width: '12%' }}>Value</th>
              <th style={{ width: '13%' }}>Added</th>
              <th style={{ width: '13%' }}>Last Activity</th>
              <th style={{ width: '11%' }}></th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--mauve)', fontSize: 12 }}>
                  {query || stageFilter !== 'All' ? 'No clients match your search.' : 'No clients yet. Add your first client to get started.'}
                </td>
              </tr>
            ) : (
              results.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{c.firstName} {c.lastName}</div>
                    {c.company && <div style={{ fontSize: 10, color: 'var(--mauve)' }}>{c.company}</div>}
                  </td>
                  <td>
                    <span className={`tier-tag ${getTierClass(c.tier)}`} style={{ fontSize: 9 }}>
                      {c.tier.length > 14 ? c.tier.slice(0, 14) + '…' : c.tier}
                    </span>
                  </td>
                  <td><span className={`status-pill ${STAGE_STYLES[c.stage]?.pill || 'pill-lead'}`}>{c.stage}</span></td>
                  <td style={{ fontWeight: 600 }}>{c.value || '—'}</td>
                  <td style={{ color: 'var(--mauve)', fontSize: 11 }}>{c.added}</td>
                  <td style={{ color: 'var(--mauve)', fontSize: 11 }}>{c.lastActivity}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/clients/${c.id}`)}>View →</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

// ── CLIENT DETAIL ─────────────────────────────────────
export function ClientDetail() {
  const { id } = useParams();
  const { clients, documents, updateClient, deleteClient, addNote, deleteNote, toggleDeliverable, addDeliverable, updateDocStatus } = useApp();
  const navigate = useNavigate();
  const [showSendDoc, setShowSendDoc] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newDelLabel, setNewDelLabel] = useState('');
  const [addingDel, setAddingDel] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const client = clients.find(c => c.id === id);
  if (!client) {
    return (
      <div className="page-content">
        <button className="back-link" onClick={() => navigate('/clients')}>← Back to Clients</button>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--mauve)' }}>Client not found.</div>
      </div>
    );
  }

  const clientDocs = documents.filter(d => d.clientId === id);
  const deliverables = client.deliverables || [];
  const doneCount = deliverables.filter(d => d.status === 'done').length;
  const progress = deliverables.length > 0 ? Math.round((doneCount / deliverables.length) * 100) : 0;

  const handleStageChange = (e) => updateClient(id, { stage: e.target.value });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote(id, newNote.trim());
    setNewNote('');
  };

  const handleAddDeliverable = () => {
    if (!newDelLabel.trim()) return;
    addDeliverable(id, newDelLabel.trim());
    setNewDelLabel('');
    setAddingDel(false);
  };

  const handleDelete = () => {
    deleteClient(id);
    navigate('/clients');
  };

  const tabs = ['overview', 'deliverables', 'documents', 'notes', 'timeline'];

  return (
    <div className="page-content">
      <button className="back-link" onClick={() => navigate('/clients')}>← Back to Clients</button>
      <div className="cr-bar" />

      {/* Client Header */}
      <div className="client-header">
        <div className="client-avatar">{getInitials(client.firstName, client.lastName)}</div>
        <div style={{ flex: 1 }}>
          <div className="client-header-name">{client.firstName.toUpperCase()} {client.lastName.toUpperCase()}</div>
          <div className="client-header-sub">
            {client.company || 'No company'} · <span className={`tier-tag ${getTierClass(client.tier)}`} style={{ fontSize: 9 }}>{client.tier}</span>
          </div>
        </div>
        <div className="client-header-actions">
          <select
            className="form-input"
            style={{ width: 140, fontSize: 11, padding: '5px 8px' }}
            value={client.stage}
            onChange={handleStageChange}
          >
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-outline btn-sm" onClick={() => setShowSendDoc(true)}>+ Send Doc</button>
          <button className="btn btn-sm" onClick={() => setShowDelete(true)} style={{ background: '#888' }}>⋯</button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        <div className="stat-card" style={{ padding: '10px 14px' }}>
          <div className="stat-label">Value</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{client.value || '—'}</div>
        </div>
        <div className="stat-card" style={{ padding: '10px 14px' }}>
          <div className="stat-label">Stage</div>
          <div style={{ marginTop: 4 }}><span className={`status-pill ${STAGE_STYLES[client.stage]?.pill || 'pill-lead'}`}>{client.stage}</span></div>
        </div>
        <div className="stat-card" style={{ padding: '10px 14px' }}>
          <div className="stat-label">Documents</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{clientDocs.length}</div>
        </div>
        <div className="stat-card" style={{ padding: '10px 14px' }}>
          <div className="stat-label">Progress</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{progress}%</div>
          <div style={{ height: 3, background: 'var(--soft)', marginTop: 6 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--cr)', transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--soft)', marginBottom: 18 }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', padding: '8px 16px',
              fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700,
              letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
              color: activeTab === tab ? 'var(--cr)' : '#aaa',
              borderBottom: activeTab === tab ? '2px solid var(--cr)' : '2px solid transparent',
              marginBottom: -2
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="detail-grid">
          <div className="detail-card">
            <div className="detail-card-title">Contact Info</div>
            <div className="detail-row"><span className="detail-label">Email</span><span className="detail-val">{client.email || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-val">{client.phone || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">Company</span><span className="detail-val">{client.company || '—'}</span></div>
          </div>
          <div className="detail-card">
            <div className="detail-card-title">Engagement</div>
            <div className="detail-row"><span className="detail-label">Package</span><span className="detail-val">{client.tier}</span></div>
            <div className="detail-row"><span className="detail-label">Value</span><span className="detail-val" style={{ color: 'var(--cr)', fontWeight: 700 }}>{client.value || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">Stage</span><span className="detail-val">{client.stage}</span></div>
            <div className="detail-row"><span className="detail-label">Added</span><span className="detail-val">{client.added}</span></div>
            <div className="detail-row"><span className="detail-label">Last Activity</span><span className="detail-val">{client.lastActivity}</span></div>
          </div>
        </div>
      )}

      {/* ── DELIVERABLES TAB ── */}
      {activeTab === 'deliverables' && (
        <div className="detail-card full" style={{ maxWidth: '100%' }}>
          <div className="detail-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Deliverables — {doneCount}/{deliverables.length} complete</span>
            <button className="btn btn-outline btn-sm" onClick={() => setAddingDel(!addingDel)}>+ Add</button>
          </div>
          {deliverables.length === 0 && !addingDel && (
            <div style={{ color: 'var(--mauve)', fontSize: 12 }}>No deliverables yet.</div>
          )}
          {deliverables.map(d => {
            const s = DEL_STATUS[d.status] || DEL_STATUS.pending;
            return (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '0.5px solid var(--soft)' }}>
                <button
                  onClick={() => toggleDeliverable(id, d.id)}
                  style={{
                    width: 20, height: 20, border: `2px solid ${d.status === 'done' ? 'var(--cr)' : 'var(--soft)'}`,
                    background: d.status === 'done' ? 'var(--cr)' : d.status === 'in-progress' ? '#fff3e0' : 'transparent',
                    cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--white)', fontSize: 11, fontWeight: 700
                  }}
                >
                  {d.status === 'done' ? '✓' : d.status === 'in-progress' ? '→' : ''}
                </button>
                <span style={{ flex: 1, fontSize: 12, color: d.status === 'done' ? 'var(--mauve)' : 'var(--nbk)', textDecoration: d.status === 'done' ? 'line-through' : 'none' }}>
                  {d.label}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: s.color, letterSpacing: 1, textTransform: 'uppercase' }}>{s.label}</span>
              </div>
            );
          })}
          {addingDel && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Deliverable name..."
                value={newDelLabel}
                onChange={e => setNewDelLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDeliverable()}
                autoFocus
              />
              <button className="btn btn-sm" onClick={handleAddDeliverable}>Add</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAddingDel(false)}>Cancel</button>
            </div>
          )}
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 10 }}>Click checkbox to cycle: Not Started → In Progress → Done</div>
        </div>
      )}

      {/* ── DOCUMENTS TAB ── */}
      {activeTab === 'documents' && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <button className="btn btn-sm" onClick={() => setShowSendDoc(true)}>+ Send Document</button>
          </div>
          {clientDocs.length === 0 ? (
            <div style={{ color: 'var(--mauve)', fontSize: 12, padding: '20px 0' }}>No documents sent yet.</div>
          ) : (
            clientDocs.map(doc => {
              const s = DOC_STATUS_LABELS[doc.status] || DOC_STATUS_LABELS.pending;
              return (
                <div key={doc.id} className="doc-row">
                  <div className="doc-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div className="doc-info">
                    <div className="doc-name">{doc.docName}{doc.invoiceNumber ? ` #${doc.invoiceNumber}` : ''}</div>
                    <div className="doc-meta">{doc.docType} · {doc.actionRequired} · Sent {doc.sentDate}</div>
                  </div>
                  <div className="doc-actions">
                    <span className={`doc-badge ${s.cls}`}>{s.label}</span>
                    {doc.status === 'pending' && (
                      <>
                        <button className="btn btn-sm" style={{ fontSize: 9 }} onClick={() => updateDocStatus(doc.id, 'signed')}>Mark Signed</button>
                        <button className="btn btn-outline btn-sm" style={{ fontSize: 9 }} onClick={() => updateDocStatus(doc.id, 'approved')}>Approve</button>
                      </>
                    )}
                    {doc.docType === 'Invoice' && doc.status !== 'paid' && (
                      <button className="btn btn-sm" style={{ fontSize: 9, background: '#1a6b3a' }} onClick={() => updateDocStatus(doc.id, 'paid')}>Mark Paid</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── NOTES TAB ── */}
      {activeTab === 'notes' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <textarea
              className="form-input"
              style={{ flex: 1, minHeight: 70, resize: 'vertical' }}
              placeholder="Add a note..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
            />
            <button className="btn" style={{ alignSelf: 'flex-end' }} onClick={handleAddNote}>Add Note</button>
          </div>
          {(client.notes || []).length === 0 ? (
            <div style={{ color: 'var(--mauve)', fontSize: 12 }}>No notes yet.</div>
          ) : (
            [...(client.notes || [])].reverse().map(note => (
              <div key={note.id} style={{ background: 'var(--white)', border: '0.5px solid var(--border)', padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ fontSize: 12, color: 'var(--nbk)', lineHeight: 1.7, flex: 1, whiteSpace: 'pre-wrap' }}>{note.text}</div>
                  <button onClick={() => deleteNote(id, note.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✕</button>
                </div>
                <div style={{ fontSize: 10, color: 'var(--mauve)', marginTop: 6 }}>{note.date}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TIMELINE TAB ── */}
      {activeTab === 'timeline' && (
        <div className="detail-card full">
          <div className="detail-card-title">Activity Timeline</div>
          {(client.timeline || []).length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--mauve)' }}>No activity yet.</div>
          ) : (
            (client.timeline || []).map((item, i) => (
              <div key={item.id || i} className="timeline-item">
                <div className={`tl-dot ${item.type === 'added' ? 'gray' : ''}`} />
                <div>
                  <div className="tl-text">{item.text}</div>
                  <div className="tl-date">{item.date}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <div className="modal-backdrop" onClick={() => setShowDelete(false)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Remove Client</span><button className="modal-close" onClick={() => setShowDelete(false)}>✕</button></div>
            <div className="modal-body">
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>Are you sure you want to remove <strong>{client.firstName} {client.lastName}</strong> and all their documents? This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDelete(false)}>Cancel</button>
              <button className="btn btn-sm" style={{ background: '#c0392b' }} onClick={handleDelete}>Remove Client</button>
            </div>
          </div>
        </div>
      )}

      {showSendDoc && <SendDocModal onClose={() => setShowSendDoc(false)} preselectedClientId={id} />}
    </div>
  );
}
