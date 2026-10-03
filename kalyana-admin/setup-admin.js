import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const db = new Database('./db.sqlite', { verbose: null });

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'owner',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

try {
  db.prepare(`
    INSERT OR IGNORE INTO admin_users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `).run('Admin Owner', 'owner@kalyana.test', hash, 'owner');
  
  console.log('✅ Admin user created successfully!');
  console.log('Email: owner@kalyana.test');
  console.log('Password: admin123');
} catch (err) {
  console.log('User may already exist');
}

db.close();
