const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function createTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(255) PRIMARY KEY,
        "firstName" VARCHAR(255) NOT NULL,
        "lastName" VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(255),
        tier VARCHAR(255),
        stage VARCHAR(255),
        value VARCHAR(255),
        added VARCHAR(255),
        "lastActivity" VARCHAR(255),
        notes JSONB,
        timeline JSONB,
        deliverables JSONB
      );

      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY,
        "clientId" VARCHAR(255) REFERENCES clients(id) ON DELETE CASCADE,
        "docType" VARCHAR(255),
        "docName" VARCHAR(255),
        "sentDate" VARCHAR(255),
        status VARCHAR(255),
        "invoiceNumber" INTEGER,
        "updatedDate" VARCHAR(255),
        "actionRequired" VARCHAR(255),
        notes TEXT
      );
    `);
    // Add columns if they don't exist (safe migration for existing databases)
    await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS "actionRequired" VARCHAR(255)`);
    await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes TEXT`);

    console.log('Tables created or already exist.');
  } catch (err) {
    console.error('Error creating tables:', err);
    process.exit(-1);
  }
}

module.exports = {
  pool,
  createTables,
};