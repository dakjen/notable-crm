import React, { useState } from 'react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';
import { TIERS, STAGES } from '../data/constants';

const empty = {
  firstName: '', lastName: '', email: '', phone: '',
  company: '', tier: TIERS[0].value, stage: 'Lead', value: '', notes: ''
};

export default function AddClientModal({ onClose, onAdded }) {
  const { addClient } = useApp();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.firstName.trim() && !form.lastName.trim()) {
      setError('Please enter a client name.');
      return;
    }
    setSaving(true);
    try {
      const client = await addClient(form);
      onAdded && onAdded(client);
      onClose();
    } catch (err) {
      setError('Failed to add client. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Modal
      title="New Client"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm" onClick={handleSubmit} disabled={saving}>{saving ? 'Adding…' : 'Add Client →'}</button>
        </>
      }
    >
      {error && <div style={{ color: '#c0392b', fontSize: 11, marginBottom: 12 }}>{error}</div>}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">First Name</label>
          <input className="form-input" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" />
        </div>
        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input className="form-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="client@company.com" />
      </div>
      <div className="form-group">
        <label className="form-label">Phone</label>
        <input className="form-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
      </div>
      <div className="form-group">
        <label className="form-label">Company / Title</label>
        <input className="form-input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Company name or professional title" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Service Tier</label>
          <select className="form-input" value={form.tier} onChange={e => set('tier', e.target.value)}>
            {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Pipeline Stage</label>
          <select className="form-input" value={form.stage} onChange={e => set('stage', e.target.value)}>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Value / Est. Amount</label>
        <input className="form-input" value={form.value} onChange={e => set('value', e.target.value)} placeholder="e.g. $8,000" />
      </div>
      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          className="form-input"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={3}
          placeholder="How did they find Notable? Goals, context, referral source..."
        />
      </div>
    </Modal>
  );
}
