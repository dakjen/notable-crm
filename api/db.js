const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');
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

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        "clientId" VARCHAR(255) REFERENCES clients(id) ON DELETE SET NULL,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price VARCHAR(255),
        tier VARCHAR(255) NOT NULL,
        deliverables JSONB DEFAULT '[]',
        active BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS client_products (
        id SERIAL PRIMARY KEY,
        "clientId" VARCHAR(255) REFERENCES clients(id) ON DELETE CASCADE,
        "productId" INTEGER REFERENCES products(id) ON DELETE CASCADE,
        "addedAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("clientId", "productId")
      );
    `);

    // Safe migrations for existing databases
    await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS "actionRequired" VARCHAR(255)`);
    await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes TEXT`);
    await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS "fileUrl" VARCHAR(1024)`);
    await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS "fileName" VARCHAR(255)`);
    await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS "fileSize" INTEGER`);

    // Seed default admin account if none exists
    const adminCheck = await pool.query(`SELECT id FROM users WHERE email = 'admin@gobenotable.com'`);
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash('changeme123', 10);
      await pool.query(
        `INSERT INTO users (email, password, role) VALUES ($1, $2, 'admin')`,
        ['admin@gobenotable.com', hash]
      );
      console.log('Default admin account created (admin@gobenotable.com / changeme123)');
    }

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
