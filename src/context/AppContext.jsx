import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

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
      { label: '1 Year Maintenance Setup', 'status': 'pending' },
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

function parseJsonField(val) {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return val;
}

function parseClient(client) {
  return {
    ...client,
    notes: parseJsonField(client.notes),
    timeline: parseJsonField(client.timeline),
    deliverables: parseJsonField(client.deliverables),
  };
}

export function AppProvider({ children }) {
  const [clients, setClients] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const clientsResponse = await fetch('/api/clients');
        const clientsData = await clientsResponse.json();
        setClients(clientsData.map(parseClient));

        const documentsResponse = await fetch('/api/documents');
        const documentsData = await documentsResponse.json();
        setDocuments(documentsData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const now = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const nowFull = () => new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  // ── CLIENTS ──
  const addClient = async (data) => {
    const client = {
      ...data,
      id: Date.now().toString(),
      added: now(),
      lastActivity: now(),
      deliverables: defaultDeliverables(data.tier),
      notes: data.notes ? [{ id: Date.now().toString(), text: data.notes, date: nowFull() }] : [],
      timeline: [{ id: Date.now().toString(), text: `${data.firstName} ${data.lastName} added to portal`, date: nowFull(), type: 'added' }]
    };
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });
      if (!response.ok) throw new Error('Failed to add client');
      const newClient = await response.json();
      setClients(prev => [parseClient(newClient), ...prev]);
      return newClient;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const updateClient = async (id, updates) => {
    try {
      const clientToUpdate = clients.find(c => c.id === id);
      if (!clientToUpdate) throw new Error('Client not found');

      const merged = { ...clientToUpdate, ...updates };
      if (updates.stage && updates.stage !== clientToUpdate.stage) {
        const entry = { id: Date.now().toString(), text: `Stage updated: ${clientToUpdate.stage} → ${updates.stage}`, date: nowFull(), type: 'stage' };
        merged.timeline = [entry, ...(clientToUpdate.timeline || [])];
        merged.lastActivity = now();
      }

      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      if (!response.ok) throw new Error('Failed to update client');
      const updatedClient = await response.json();
      setClients(prev => prev.map(c =>
        c.id === id ? parseClient(updatedClient) : c
      ));
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const deleteClient = async (id) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete client');
      setClients(prev => prev.filter(c => c.id !== id));
      setDocuments(prev => prev.filter(d => d.clientId !== id)); // Also remove associated documents
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const addNote = async (clientId, text) => {
    const noteObj = { id: Date.now().toString(), text, date: nowFull() };
    const tlEntry = { id: (Date.now() + 1).toString(), text: `Note: "${text.slice(0, 55)}${text.length > 55 ? '…' : ''}"`, date: nowFull(), type: 'note' };
    const clientToUpdate = clients.find(c => c.id === clientId);
    if (clientToUpdate) {
      const updatedClient = {
        ...clientToUpdate,
        notes: [...(clientToUpdate.notes || []), noteObj],
        timeline: [tlEntry, ...(clientToUpdate.timeline || [])],
        lastActivity: now(),
      };
      await updateClient(clientId, updatedClient);
    }
  };

  const deleteNote = async (clientId, noteId) => {
    const clientToUpdate = clients.find(c => c.id === clientId);
    if (clientToUpdate) {
      const updatedClient = {
        ...clientToUpdate,
        notes: (clientToUpdate.notes || []).filter(n => n.id !== noteId),
      };
      await updateClient(clientId, updatedClient);
    }
  };

  const toggleDeliverable = async (clientId, deliverableId) => {
    const clientToUpdate = clients.find(c => c.id === clientId);
    if (clientToUpdate) {
      const updatedDeliverables = (clientToUpdate.deliverables || []).map(d => {
        if (d.id !== deliverableId) return d;
        const next = d.status === 'pending' ? 'in-progress' : d.status === 'in-progress' ? 'done' : 'pending';
        return { ...d, status: next };
      });
      const updatedClient = { ...clientToUpdate, deliverables: updatedDeliverables };
      await updateClient(clientId, updatedClient);
    }
  };

  const addDeliverable = async (clientId, label) => {
    const newDel = { id: Date.now().toString(), label, status: 'pending' };
    const clientToUpdate = clients.find(c => c.id === clientId);
    if (clientToUpdate) {
      const updatedClient = {
        ...clientToUpdate,
        deliverables: [...(clientToUpdate.deliverables || []), newDel],
      };
      await updateClient(clientId, updatedClient);
    }
  };

  // ── DOCUMENTS ──
  const nextInvoiceNumber = () => documents.filter(d => d.docType === 'Invoice').length + 1;

  const addDocument = async (data) => {
    const doc = {
      ...data,
      id: Date.now().toString(),
      sentDate: now(),
      status: 'pending',
      invoiceNumber: data.docType === 'Invoice' ? nextInvoiceNumber() : null
    };
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      if (!response.ok) throw new Error('Failed to add document');
      const newDoc = await response.json();
      setDocuments(prev => [newDoc, ...prev]);

      // Update client's timeline
      const entry = { id: Date.now().toString(), text: `${data.docType} "${data.docName}" sent — ${data.actionRequired}`, date: nowFull(), type: 'doc' };
      const clientToUpdate = clients.find(c => c.id === data.clientId);
      if (clientToUpdate) {
        const updatedClient = {
          ...clientToUpdate,
          timeline: [entry, ...(clientToUpdate.timeline || [])],
          lastActivity: now(),
        };
        await updateClient(data.clientId, updatedClient);
      }
      return newDoc;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const updateDocStatus = async (docId, status) => {
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, updatedDate: now() }),
      });
      if (!response.ok) throw new Error('Failed to update document status');
      const updatedDoc = await response.json();
      setDocuments(prev => prev.map(d => (d.id === docId ? updatedDoc : d)));

      // Update client's timeline
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        const entry = { id: Date.now().toString(), text: `${doc.docType} "${doc.docName}" marked as ${status}`, date: nowFull(), type: 'doc' };
        const clientToUpdate = clients.find(c => c.id === doc.clientId);
        if (clientToUpdate) {
          const updatedClient = {
            ...clientToUpdate,
            timeline: [entry, ...(clientToUpdate.timeline || [])],
            lastActivity: now(),
          };
          await updateClient(doc.clientId, updatedClient);
        }
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const getClientDocs = (clientId) => documents.filter(d => d.clientId === clientId);

  const clearAllData = async () => {
    try {
      const response = await fetch('/api/data', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to clear data');
      setClients([]);
      setDocuments([]);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

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
      clients, documents, loading, error,
      addClient, updateClient, deleteClient,
      addNote, deleteNote, toggleDeliverable, addDeliverable,
      addDocument, updateDocStatus, getClientDocs,
      getStats, searchClients, nextInvoiceNumber,
      clearAllData
    }}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Montserrat, sans-serif', color: '#7B4F5E', fontSize: 13, letterSpacing: 2 }}>
          Loading portal…
        </div>
      ) : children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
