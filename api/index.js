const express = require('express');
const { pool, createTables } = require('./db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
app.use(express.json());

// Initialize tables when the app starts
createTables();

// Test route
app.get('/api', (req, res) => {
  res.status(200).send('Hello from Vercel Serverless Function!');
});

// CLIENTS ROUTES
// Get all clients
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a new client
app.post('/api/clients', async (req, res) => {
  const { id, firstName, lastName, company, email, phone, tier, stage, value, added, lastActivity, notes, timeline, deliverables } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO clients (id, "firstName", "lastName", company, email, phone, tier, stage, value, added, "lastActivity", notes, timeline, deliverables)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [id, firstName, lastName, company, email, phone, tier, stage, value, added, lastActivity, JSON.stringify(notes), JSON.stringify(timeline), JSON.stringify(deliverables)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding client:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a client
app.put('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, company, email, phone, tier, stage, value, added, lastActivity, notes, timeline, deliverables } = req.body;
  try {
    const result = await pool.query(
      `UPDATE clients SET "firstName" = $1, "lastName" = $2, company = $3, email = $4, phone = $5, tier = $6, stage = $7, value = $8, added = $9, "lastActivity" = $10, notes = $11, timeline = $12, deliverables = $13 WHERE id = $14 RETURNING *`,
      [firstName, lastName, company, email, phone, tier, stage, value, added, lastActivity, JSON.stringify(notes), JSON.stringify(timeline), JSON.stringify(deliverables), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a client
app.delete('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM documents WHERE "clientId" = $1', [id]);
    await pool.query('DELETE FROM clients WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({ error: err.message });
  }
});

// Clear all data
app.delete('/api/data', async (req, res) => {
  try {
    await pool.query('DELETE FROM documents');
    await pool.query('DELETE FROM clients');
    res.status(204).send();
  } catch (err) {
    console.error('Error clearing data:', err);
    res.status(500).json({ error: err.message });
  }
});


// DOCUMENTS ROUTES (basic structure, will expand later)
// Get all documents
app.get('/api/documents', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a new document
app.post('/api/documents', async (req, res) => {
  const { id, clientId, docType, docName, sentDate, status, invoiceNumber, updatedDate, actionRequired, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO documents (id, "clientId", "docType", "docName", "sentDate", status, "invoiceNumber", "updatedDate", "actionRequired", notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, clientId, docType, docName, sentDate, status, invoiceNumber, updatedDate, actionRequired, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding document:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update document status
app.put('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  const { status, updatedDate } = req.body;
  try {
    const result = await pool.query(
      `UPDATE documents SET status = $1, "updatedDate" = $2 WHERE id = $3 RETURNING *`,
      [status, updatedDate, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get documents for a specific client
app.get('/api/clients/:clientId/documents', async (req, res) => {
  const { clientId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM documents WHERE "clientId" = $1', [clientId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching client documents:', err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = app;

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`API Server listening on port ${PORT}`);
  });
}