import React, { useState } from 'react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';
import { DOC_TYPES, DOC_ACTIONS } from '../data/constants';

export default function SendDocModal({ onClose, preselectedClientId }) {
  const { clients, addDocument } = useApp();
  const [form, setForm] = useState({
    clientId: preselectedClientId || '',
    docType: DOC_TYPES[0],
    docName: '',
    actionRequired: DOC_ACTIONS[0],
    notes: ''
  });
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.clientId) { setError('Please select a client.'); return; }
    if (!form.docName.trim()) { setError('Please enter a document name.'); return; }
    addDocument(form);
    onClose();
  };

  return (
    <Modal
      title="Send Document"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm" onClick={handleSubmit}>Send Document →</button>
        </>
      }
    >
      {error && <div style={{ color: '#c0392b', fontSize: 11, marginBottom: 12 }}>{error}</div>}
      <div className="form-group">
        <label className="form-label">Client</label>
        <select className="form-input" value={form.clientId} onChange={e => set('clientId', e.target.value)}>
          <option value="">— Select client —</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName} {c.company ? `— ${c.company}` : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Document Type</label>
        <select className="form-input" value={form.docType} onChange={e => set('docType', e.target.value)}>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Document Name</label>
        <input
          className="form-input"
          value={form.docName}
          onChange={e => set('docName', e.target.value)}
          placeholder="e.g. Service Agreement — Client Name"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Action Required</label>
        <select className="form-input" value={form.actionRequired} onChange={e => set('actionRequired', e.target.value)}>
          {DOC_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Notes to Client (optional)</label>
        <textarea
          className="form-input"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          placeholder="Optional message to include with the document..."
        />
      </div>
    </Modal>
  );
}
