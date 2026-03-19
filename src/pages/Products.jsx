import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const TIER_OPTIONS = ['Notable Essentials', 'Notable Amplify', 'Notable Amplify & Retainer'];
const TIER_CLASSES = {
  'Notable Essentials': 'tier-ess',
  'Notable Amplify': 'tier-amp',
  'Notable Amplify & Retainer': 'tier-on',
};

function ProductForm({ product, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    tier: product?.tier || TIER_OPTIONS[0],
    deliverables: product?.deliverables || [],
    active: product?.active !== false,
  });
  const [newDel, setNewDel] = useState('');
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addDeliverable = () => {
    if (!newDel.trim()) return;
    set('deliverables', [...form.deliverables, { label: newDel.trim(), status: 'pending' }]);
    setNewDel('');
  };

  const removeDeliverable = (idx) => {
    set('deliverables', form.deliverables.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Product name is required.'); return; }
    onSave(form);
  };

  return (
    <Modal
      title={product ? 'Edit Product' : 'New Product'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : (product ? 'Save Changes' : 'Create Product')}
          </button>
        </>
      }
    >
      {error && <div style={{ color: '#c0392b', fontSize: 11, marginBottom: 12 }}>{error}</div>}
      <div className="form-group">
        <label className="form-label">Product Name</label>
        <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ready 2 Roll" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Tier</label>
          <select className="form-input" value={form.tier} onChange={e => set('tier', e.target.value)}>
            {TIER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Price</label>
          <input className="form-input" value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. $1,000" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-input" value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief description of this product..." />
      </div>
      <div className="form-group">
        <label className="form-label">Default Deliverables</label>
        {form.deliverables.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ flex: 1, fontSize: 12 }}>{d.label}</span>
            <button onClick={() => removeDeliverable(i)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14 }}>x</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <input
            className="form-input"
            style={{ flex: 1 }}
            value={newDel}
            onChange={e => setNewDel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
            placeholder="Add deliverable..."
          />
          <button className="btn btn-outline btn-sm" onClick={addDeliverable}>+</button>
        </div>
      </div>
      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
          Active (visible to users)
        </label>
      </div>
    </Modal>
  );
}

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const grouped = {};
  TIER_OPTIONS.forEach(t => { grouped[t] = []; });
  products.forEach(p => {
    if (!grouped[p.tier]) grouped[p.tier] = [];
    grouped[p.tier].push(p);
  });

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await updateProduct(editing.id, form);
      } else {
        await addProduct(form);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      alert('Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setDeleteConfirm(null);
    } catch (err) {
      alert('Failed to delete product.');
    }
  };

  return (
    <div className="page-content">
      <div className="section-header">
        <div className="section-title">Products & Services</div>
        <button className="btn" onClick={() => { setEditing(null); setShowForm(true); }}>+ New Product</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">Total Products</div><div className="stat-value">{products.length}</div></div>
        <div className="stat-card"><div className="stat-label">Active</div><div className="stat-value">{products.filter(p => p.active).length}</div></div>
        <div className="stat-card"><div className="stat-label">Tiers</div><div className="stat-value">{TIER_OPTIONS.length}</div></div>
      </div>

      {TIER_OPTIONS.map(tier => (
        <div key={tier} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span className={`tier-tag ${TIER_CLASSES[tier] || 'tier-ess'}`}>{tier}</span>
            <span style={{ fontSize: 10, color: '#aaa' }}>{grouped[tier]?.length || 0} products</span>
          </div>

          {(!grouped[tier] || grouped[tier].length === 0) ? (
            <div style={{ background: 'var(--white)', border: '1px dashed var(--soft)', padding: '20px', textAlign: 'center', color: '#bbb', fontSize: 11 }}>
              No products in this tier yet.
            </div>
          ) : (
            grouped[tier].map(product => (
              <div key={product.id} className="doc-row" style={{ opacity: product.active ? 1 : 0.5 }}>
                <div className="doc-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <div className="doc-info">
                  <div className="doc-name">{product.name}</div>
                  <div className="doc-meta">
                    {product.price && `${product.price} · `}
                    {product.deliverables?.length || 0} deliverables
                    {product.description && ` · ${product.description.slice(0, 60)}${product.description.length > 60 ? '...' : ''}`}
                    {!product.active && ' · INACTIVE'}
                  </div>
                </div>
                <div className="doc-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => { setEditing(product); setShowForm(true); }}>Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: '#c0392b' }} onClick={() => setDeleteConfirm(product)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      ))}

      {(showForm || editing) && (
        <ProductForm
          product={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={saving}
        />
      )}

      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Delete Product</span><button className="modal-close" onClick={() => setDeleteConfirm(null)}>x</button></div>
            <div className="modal-body">
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>Delete <strong>{deleteConfirm.name}</strong>? This will also remove it from any assigned clients.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-sm" style={{ background: '#c0392b' }} onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
