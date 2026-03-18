import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AddClientModal from '../components/AddClientModal';
import SendDocModal from '../components/SendDocModal';

export default function Dashboard() {
  const { getStats, clients, documents, updateDocStatus } = useApp();
  const navigate = useNavigate();
  const stats = getStats();
  const [showAddClient, setShowAddClient] = useState(false);
  const [showSendDoc, setShowSendDoc] = useState(false);

  const pendingDocs = documents.filter(d => d.status === 'pending').slice(0, 4);
  const recentActivity = clients
    .flatMap(c => (c.timeline || []).map(t => ({ ...t, clientId: c.id, clientName: `${c.firstName} ${c.lastName}` })))
    .sort((a, b) => (b.id > a.id ? 1 : -1))
    .slice(0, 7);

  return (
    <div className="page-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Clients</div>
          <div className="stat-value">{stats.active}</div>
          <div className="stat-hint">{stats.active === 0 ? 'Add your first client' : `${stats.total} total`}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pipeline Value</div>
          <div className="stat-value">${stats.pipelineValue.toLocaleString()}</div>
          <div className="stat-hint">{stats.pipelineValue === 0 ? 'No open deals yet' : 'Open pipeline'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Docs Pending</div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-hint">{stats.pending === 0 ? 'All clear' : 'Awaiting action'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{stats.complete}</div>
          <div className="stat-hint">{stats.complete === 0 ? 'None closed yet' : 'All time'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>

        {/* Activity Feed */}
        <div>
          <div className="section-header"><div className="section-title">Recent Activity</div></div>
          <div style={{ background: 'var(--white)', border: '0.5px solid var(--border)', minHeight: 180 }}>
            {recentActivity.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                </div>
                <div className="empty-sub">Activity will appear here as you add clients and send documents.</div>
              </div>
            ) : (
              recentActivity.map((item, i) => (
                <div key={`${item.id}_${i}`} className="activity-item" style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={() => navigate(`/clients/${item.clientId}`)}>
                  <div className={`activity-icon ${item.type === 'doc' ? 'ai-doc' : item.type === 'stage' ? 'ai-cli' : 'ai-cli'}`}>
                    {item.type === 'doc'
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div><span className="activity-name">{item.clientName}</span> — <span style={{ color: 'var(--dkgray)' }}>{item.text}</span></div>
                    <div className="activity-time">{item.date}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="section-header"><div className="section-title">Needs Action</div></div>
          <div style={{ background: 'var(--white)', border: '0.5px solid var(--border)', marginBottom: 16 }}>
            {pendingDocs.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 16px' }}>
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12l2 2 4-4"/><path d="M5 7h14M5 12h6M5 17h10"/></svg>
                </div>
                <div className="empty-sub" style={{ fontSize: 11 }}>No pending documents.</div>
              </div>
            ) : (
              pendingDocs.map(doc => {
                const client = clients.find(c => c.id === doc.clientId);
                return (
                  <div key={doc.id} style={{ padding: '11px 14px', borderBottom: '0.5px solid var(--lgray)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>
                        {client ? `${client.firstName} ${client.lastName}` : '—'}
                      </span>
                      <span className="doc-badge db-pending" style={{ flexShrink: 0, marginLeft: 6 }}>Pending</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--mauve)', marginBottom: 7 }}>{doc.docName} · {doc.sentDate}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {doc.docType === 'Invoice'
                        ? <button className="btn btn-sm" style={{ fontSize: 9, background: '#1a6b3a' }} onClick={() => updateDocStatus(doc.id, 'paid')}>Mark Paid</button>
                        : <button className="btn btn-sm" style={{ fontSize: 9 }} onClick={() => updateDocStatus(doc.id, 'signed')}>Mark Signed</button>
                      }
                      <button className="btn btn-outline btn-sm" style={{ fontSize: 9 }} onClick={() => navigate(`/clients/${doc.clientId}`)}>View Client</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="section-header"><div className="section-title">Quick Actions</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn" style={{ justifyContent: 'center' }} onClick={() => setShowAddClient(true)}>+ Add New Client</button>
            <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setShowSendDoc(true)}>+ Send Document</button>
            <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => navigate('/pipeline')}>View Pipeline →</button>
          </div>
        </div>
      </div>

      {showAddClient && <AddClientModal onClose={() => setShowAddClient(false)} />}
      {showSendDoc && <SendDocModal onClose={() => setShowSendDoc(false)} />}
    </div>
  );
}
