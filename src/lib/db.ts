import Database from 'better-sqlite3';

const db = new Database('registrations.db');
db.pragma('journal_mode = WAL');

// Initialize the table
db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    referral TEXT,
    role TEXT,
    company TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Since ALTER TABLE with existing columns will fail, we can't easily put it in .exec() without it stopping.
  -- But for this project, adding them to the CREATE TABLE and perhaps trying to add them once if they are missing is fine.

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  INSERT OR IGNORE INTO admins (username, password) VALUES ('aizen', 'Aizen@2026');
`);

// Try to add columns if they don't exist
try {
  db.exec('ALTER TABLE registrations ADD COLUMN referral TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE registrations ADD COLUMN role TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE registrations ADD COLUMN company TEXT');
} catch (e) {}


export default db;
