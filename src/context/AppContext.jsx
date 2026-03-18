import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();
const STORAGE_KEY = 'notable_portal_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { clients: [], documents: [] };
}

function defaultDeliverables(tier) {
  const maps = {
    'Ready 2 Roll': [
      { label: '7-Page Qualifications Package', status: 'pending' },
      { label: 'Project Deck Template', status: 'pending' },
      { label: '1-Page Website', status: 'pending' },
    ],
    'Get Loud': [
      { label: '8–12 Page Qualifications Package', status: 'pending' },
      { label: 'Project Deck Template (About + Founder)', status: 'pending' },
      { label: '2–4 Page Website', status: 'pending' },
      { label: 'Monthly Maintenance Setup', status: 'pending' },
    ],
    'Marquis': [
      { label: 'Full Qualifications Package', status: 'pending' },
      { label: 'Full Presentation Deck', status: 'pending' },
      { label: '2–4 Page Premium Website', status: 'pending' },
      { label: '1 Year Maintenance Setup', status: 'pending' },
    ],
    'LinkedIn Voice Intensive': [
      { label: 'Profile Audit & Rewrite', status: 'pending' },
      { label: 'Brand Voice + Content Pillars', status: 'pending' },
      { label: '2 Months of LinkedIn Posts', status: 'pending' },
      { label: '30-Day Content Calendar', status: 'pending' },
      { label: 'Strategy Session (60 min)', status: 'pending' },
    ],
    'Notable Amplify': [
      { label: 'Phase 1 — Platform Assessment', status: 'pending' },
      { label: 'Phase 2 — Platform Opportunity Map', status: 'pending' },
      { label: 'Phase 3 — Build & Execute', status: 'pending' },
      { label: 'Phase 4 — Launch Package', status: 'pending' },
    ],
    'Notable Amplify+ Ongoing': [
      { label: 'Monthly Strategy Session', status: 'pending' },
      { label: 'Ongoing Content Production', status: 'pending' },
      { label: 'Quarterly Revenue Stream Review', status: 'pending' },
      { label: 'Brand Asset Updates', status: 'pending' },
    ],
  };
  return (maps[tier] || []).map((d, i) => ({ ...d, id: `${Date.now()}_${i}` }));
}

export function AppProvider({ children }) {
  const initial = loadState();
  const [clients, setClients] = useState(initial.clients || []);
  const [documents, setDocuments] = useState(initial.documents || []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ clients, documents })); } catch (e) {}
  }, [clients, documents]);

  const now = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const nowFull = () => new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  // ── CLIENTS ──
  const addClient = (data) => {
    const client = {
      ...data,
      id: Date.now().toString(),
      added: now(),
      lastActivity: now(),
      deliverables: defaultDeliverables(data.tier),
      notes: data.notes ? [{ id: Date.now().toString(), text: data.notes, date: nowFull() }] : [],
      timeline: [{ id: Date.now().toString(), text: `${data.firstName} ${data.lastName} added to portal`, date: nowFull(), type: 'added' }]
    };
    setClients(prev => [client, ...prev]);
    return client;
  };

  const updateClient = (id, updates) => {
    setClients(prev => prev.map(c => {
      if (c.id !== id) return c;
      const merged = { ...c, ...updates };
      if (updates.stage && updates.stage !== c.stage) {
        const entry = { id: Date.now().toString(), text: `Stage updated: ${c.stage} → ${updates.stage}`, date: nowFull(), type: 'stage' };
        merged.timeline = [entry, ...(c.timeline || [])];
        merged.lastActivity = now();
      }
      return merged;
    }));
  };

  const deleteClient = (id) => {
    setClients(prev => prev.filter(c => c.id !== id));
    setDocuments(prev => prev.filter(d => d.clientId !== id));
  };

  const addNote = (clientId, text) => {
    const noteObj = { id: Date.now().toString(), text, date: nowFull() };
    const tlEntry = { id: Date.now().toString(), text: `Note: "${text.slice(0, 55)}${text.length > 55 ? '…' : ''}"`, date: nowFull(), type: 'note' };
    setClients(prev => prev.map(c =>
      c.id === clientId
        ? { ...c, notes: [...(c.notes || []), noteObj], timeline: [tlEntry, ...(c.timeline || [])], lastActivity: now() }
        : c
    ));
  };

  const deleteNote = (clientId, noteId) => {
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, notes: (c.notes || []).filter(n => n.id !== noteId) } : c
    ));
  };

  const toggleDeliverable = (clientId, deliverableId) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      const deliverables = (c.deliverables || []).map(d => {
        if (d.id !== deliverableId) return d;
        const next = d.status === 'pending' ? 'in-progress' : d.status === 'in-progress' ? 'done' : 'pending';
        return { ...d, status: next };
      });
      return { ...c, deliverables };
    }));
  };

  const addDeliverable = (clientId, label) => {
    const newDel = { id: Date.now().toString(), label, status: 'pending' };
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, deliverables: [...(c.deliverables || []), newDel] } : c
    ));
  };

  // ── DOCUMENTS ──
  const nextInvoiceNumber = () => documents.filter(d => d.docType === 'Invoice').length + 1;

  const addDocument = (data) => {
    const doc = {
      ...data,
      id: Date.now().toString(),
      sentDate: now(),
      status: 'pending',
      invoiceNumber: data.docType === 'Invoice' ? nextInvoiceNumber() : null
    };
    setDocuments(prev => [doc, ...prev]);
    const entry = { id: Date.now().toString(), text: `${data.docType} "${data.docName}" sent — ${data.actionRequired}`, date: nowFull(), type: 'doc' };
    setClients(prev => prev.map(c =>
      c.id === data.clientId ? { ...c, timeline: [entry, ...(c.timeline || [])], lastActivity: now() } : c
    ));
    return doc;
  };

  const updateDocStatus = (docId, status) => {
    setDocuments(prev => prev.map(d => {
      if (d.id !== docId) return d;
      const entry = { id: Date.now().toString(), text: `${d.docType} "${d.docName}" marked as ${status}`, date: nowFull(), type: 'doc' };
      setClients(prev2 => prev2.map(c =>
        c.id === d.clientId ? { ...c, timeline: [entry, ...(c.timeline || [])], lastActivity: now() } : c
      ));
      return { ...d, status, updatedDate: now() };
    }));
  };

  const getClientDocs = (clientId) => documents.filter(d => d.clientId === clientId);

  // ── STATS ──
  const getStats = () => {
    const active = clients.filter(c => c.stage === 'Active').length;
    const complete = clients.filter(c => c.stage === 'Complete').length;
    const pending = documents.filter(d => d.status === 'pending').length;
    const pipelineValue = clients
      .filter(c => ['Active', 'Discovery', 'Lead', 'In Review'].includes(c.stage))
      .reduce((sum, c) => sum + (parseInt((c.value || '').replace(/[^0-9]/g, '')) || 0), 0);
    return { active, complete, pending, pipelineValue, total: clients.length };
  };

  const searchClients = (query) => {
    if (!query.trim()) return clients;
    const q = query.toLowerCase();
    return clients.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.tier || '').toLowerCase().includes(q) ||
      (c.stage || '').toLowerCase().includes(q)
    );
  };

  return (
    <AppContext.Provider value={{
      clients, documents,
      addClient, updateClient, deleteClient,
      addNote, deleteNote, toggleDeliverable, addDeliverable,
      addDocument, updateDocStatus, getClientDocs,
      getStats, searchClients, nextInvoiceNumber
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
