const express = require('express');
const multer = require('multer');
const { put } = require('@vercel/blob');
const { pool, createTables } = require('./db');
const { router: authRouter, requireAuth, requireAdmin } = require('./auth');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Initialize tables when the app starts
createTables();

// Test route
app.get('/api', (req, res) => {
  res.status(200).send('Hello from Vercel Serverless Function!');
});

// Auth routes (no auth required for login)
app.use('/api/auth', authRouter);

// ── CLIENTS ROUTES ──────────────────────────────────────
app.get('/api/clients', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', requireAuth, requireAdmin, async (req, res) => {
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

app.put('/api/clients/:id', requireAuth, requireAdmin, async (req, res) => {
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

app.delete('/api/clients/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM client_products WHERE "clientId" = $1', [id]);
    await pool.query('DELETE FROM documents WHERE "clientId" = $1', [id]);
    await pool.query('DELETE FROM clients WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/data', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM client_products');
    await pool.query('DELETE FROM documents');
    await pool.query('DELETE FROM clients');
    res.status(204).send();
  } catch (err) {
    console.error('Error clearing data:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── DOCUMENTS ROUTES ────────────────────────────────────
app.get('/api/documents', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents', requireAuth, requireAdmin, async (req, res) => {
  const { id, clientId, docType, docName, sentDate, status, invoiceNumber, updatedDate, actionRequired, notes, fileUrl, fileName, fileSize } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO documents (id, "clientId", "docType", "docName", "sentDate", status, "invoiceNumber", "updatedDate", "actionRequired", notes, "fileUrl", "fileName", "fileSize")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [id, clientId, docType, docName, sentDate, status, invoiceNumber, updatedDate, actionRequired, notes, fileUrl || null, fileName || null, fileSize || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding document:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/documents/:id', requireAuth, requireAdmin, async (req, res) => {
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

app.get('/api/clients/:clientId/documents', requireAuth, async (req, res) => {
  const { clientId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM documents WHERE "clientId" = $1', [clientId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching client documents:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── FILE UPLOAD (Vercel Blob) ───────────────────────────
app.post('/api/documents/upload', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    const blob = await put(req.file.originalname, req.file.buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    res.json({
      fileUrl: blob.url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

app.get('/api/documents/:id/download', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT "fileUrl", "fileName" FROM documents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const doc = result.rows[0];
    if (!doc.fileUrl) {
      return res.status(404).json({ error: 'No file attached to this document' });
    }
    res.json({ fileUrl: doc.fileUrl, fileName: doc.fileName });
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── PRODUCTS ROUTES ─────────────────────────────────────
app.get('/api/products', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY tier, name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', requireAuth, requireAdmin, async (req, res) => {
  const { name, description, price, tier, deliverables, active } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, tier, deliverables, active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description || '', price || '', tier, JSON.stringify(deliverables || []), active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, tier, deliverables, active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET name = $1, description = $2, price = $3, tier = $4, deliverables = $5, active = $6 WHERE id = $7 RETURNING *`,
      [name, description || '', price || '', tier, JSON.stringify(deliverables || []), active !== false, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM client_products WHERE "productId" = $1', [id]);
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── CLIENT-PRODUCT ASSOCIATION ──────────────────────────
app.get('/api/clients/:id/products', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, cp."addedAt" FROM client_products cp
       JOIN products p ON p.id = cp."productId"
       WHERE cp."clientId" = $1
       ORDER BY cp."addedAt"`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching client products:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients/:id/products', requireAuth, requireAdmin, async (req, res) => {
  const { productIds } = req.body;
  const clientId = req.params.id;
  try {
    for (const productId of productIds) {
      await pool.query(
        `INSERT INTO client_products ("clientId", "productId") VALUES ($1, $2)
         ON CONFLICT ("clientId", "productId") DO NOTHING`,
        [clientId, productId]
      );
    }
    const products = await pool.query(
      `SELECT p.*, cp."addedAt" FROM client_products cp
       JOIN products p ON p.id = cp."productId"
       WHERE cp."clientId" = $1
       ORDER BY cp."addedAt"`,
      [clientId]
    );
    res.json(products.rows);
  } catch (err) {
    console.error('Error adding client products:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clients/:id/products/:productId', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM client_products WHERE "clientId" = $1 AND "productId" = $2',
      [req.params.id, req.params.productId]
    );
    res.status(204).send();
  } catch (err) {
    console.error('Error removing client product:', err);
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
