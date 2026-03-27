const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/candy_studio',
  waitForConnections: true, 
  connectionLimit: 10, 
  charset: 'utf8mb4',
});

async function query(text, params = []) {
  let sql = text.replace(/\$(\d+)/g, '?');
  // Strip PostgreSQL-style RETURNING clause (not supported in MySQL)
  const returningMatch = sql.match(/\s+RETURNING\s+(.+)$/i);
  if (returningMatch) sql = sql.replace(/\s+RETURNING\s+.+$/i, '');
  const [rows] = await pool.query(sql, params);
  // If it was an INSERT with RETURNING, synthesize a compatible result
  if (returningMatch && rows.insertId) {
    const cols = returningMatch[1].split(',').map(c => c.trim());
    const fakeRow = { id: rows.insertId };
    cols.forEach(c => { if (c !== 'id') fakeRow[c] = undefined; });
    return { rows: [fakeRow], insertId: rows.insertId, affectedRows: rows.affectedRows };
  }
  return { rows: Array.isArray(rows) ? rows : [], insertId: rows.insertId, affectedRows: rows.affectedRows };
}

async function getClient() {
  const conn = await pool.getConnection();
  return {
    async query(text, params) { 
      const [rows] = await conn.query(text.replace(/\$(\d+)/g,'?'), params); 
      return { rows: Array.isArray(rows)?rows:[] }; 
    },
    async beginTransaction() { await conn.beginTransaction(); },
    async commit() { await conn.commit(); },
    async rollback() { await conn.rollback(); },
    release() { conn.release(); },
  };
}

async function initDB() {
  try {
    const sqlFile = path.join(__dirname, '../../sql/init-mysql.sql');
    if (fs.existsSync(sqlFile)) {
        const stmts = fs.readFileSync(sqlFile,'utf8').split(';').filter(s=>s.trim());
        for (const s of stmts) { 
          try { await pool.query(s); } 
          catch(e) { if(!e.message.includes('already exists')) console.warn('SQL Warning:', e.message.substring(0,80)); } 
        }
    }
    console.log(`Database initialized (mysql)`);
    
    // Auto-migrate new columns
    try { await pool.query("ALTER TABLE users ADD COLUMN membership_tier VARCHAR(50) DEFAULT 'none'"); } catch(e) {}
    try { await pool.query("ALTER TABLE users ADD COLUMN membership_expire_at DATETIME"); } catch(e) {}
    try { await pool.query("ALTER TABLE orders ADD COLUMN package_id VARCHAR(100)"); } catch(e) {}
    try { await pool.query("ALTER TABLE api_calls ADD COLUMN refunded TINYINT(1) DEFAULT 0"); } catch(e) {}

    const bcrypt = require('bcryptjs');
    const email = process.env.ADMIN_EMAIL || 'admin@candy.com';
    const pass = process.env.ADMIN_PASSWORD || 'admin123456';
    const r = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (!r.rows.length) {
      const hash = await bcrypt.hash(pass, 12);
      await query('INSERT INTO users (email, password_hash, nickname, role, points) VALUES (?,?,?,?,?)', [email, hash, 'Admin', 'admin', 9999]);
      console.log(`Admin created: ${email}`);
    }
  } catch (err) { 
    console.error('DB init error:', err.message); 
  }
}

function getDbType() { return 'mysql'; }

module.exports = { query, getClient, initDB, getDbType, pool };
