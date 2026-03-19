import React, { useState } from 'react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';
import { STAGES } from '../data/constants';

const TIER_OPTIONS = ['Notable Essentials', 'Notable Amplify', 'Notable Amplify & Retainer'];

const empty = {
  firstName: '', lastName: '', email: '', phone: '',
  company: '', tier: TIER_OPTIONS[0], stage: 'Lead', notes: '',
  selectedProducts: [],
};

export default function AddClientModal({ onClose, onAdded }) {
  const { addClient, products, addClientProducts } = useApp();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleProduct = (productId) => {
    setForm(f => ({
      ...f,
      selectedProducts: f.selectedProducts.includes(productId)
        ? f.selectedProducts.filter(id => id !== productId)
        : [...f.selectedProducts, productId]
    }));
  };

  const activeProducts = products.filter(p => p.active);
  const grouped = {};
  TIER_OPTIONS.forEach(t => { grouped[t] = activeProducts.filter(p => p.tier === t); });

  const handleSubmit = async () => {
    if (!form.firstName.trim() && !form.lastName.trim()) {
      setError('Please enter a client name.');
      return;
    }
    setSaving(true);
    try {
      const client = await addClient({
        ...form,
        tier: form.selectedProducts.length > 0
          ? products.find(p => p.id === form.selectedProducts[0])?.tier || form.tier
          : form.tier,
      });
      if (form.selectedProducts.length > 0 && client?.id) {
        await addClientProducts(client.id, form.selectedProducts);
      }
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
          <button className="btn btn-sm" onClick={handleSubmit} disabled={saving}>{saving ? 'Adding...' : 'Add Client'}</button>
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
      <div className="form-group">
        <label className="form-label">Pipeline Stage</label>
        <select className="form-input" value={form.stage} onChange={e => set('stage', e.target.value)}>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Products / Services</label>
        {activeProducts.length === 0 ? (
          <div style={{ fontSize: 11, color: '#aaa', padding: '8px 0' }}>No products created yet. Add products from the Products page first.</div>
        ) : (
          TIER_OPTIONS.map(tier => {
            const tierProducts = grouped[tier];
            if (!tierProducts || tierProducts.length === 0) return null;
            return (
              <div key={tier} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#888', marginBottom: 4 }}>{tier}</div>
                {tierProducts.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.selectedProducts.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                    />
                    <span>{p.name}</span>
                    {p.price && <span style={{ color: '#888', fontSize: 10 }}>{p.price}</span>}
                  </label>
                ))}
              </div>
            );
          })
        )}
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
