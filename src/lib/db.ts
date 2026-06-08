import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const db = new Database(path.join(process.cwd(), 'registrations.db'));
db.pragma('journal_mode = WAL');

// Khởi tạo các bảng cần thiết
db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    referral TEXT,
    role TEXT,
    company TEXT,
    payment_status TEXT DEFAULT 'UNPAID',
    payment_content TEXT,
    amount INTEGER DEFAULT 150000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  -- Seed admin (password is hashed)
  INSERT OR IGNORE INTO admins (username, password) VALUES ('aizen', '${bcrypt.hashSync('Aizen@2026', 10)}');

  -- Bảng sessions: lưu token xác thực thay vì chỉ dùng cookie boolean
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    admin_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
  );
`);

// Thêm cột nếu chưa tồn tại (ALTER TABLE sẽ lỗi nếu cột đã có — bỏ qua)
try { db.exec('ALTER TABLE registrations ADD COLUMN referral TEXT'); } catch (_) {}
try { db.exec('ALTER TABLE registrations ADD COLUMN role TEXT'); } catch (_) {}
try { db.exec('ALTER TABLE registrations ADD COLUMN company TEXT'); } catch (_) {}
try { db.exec("ALTER TABLE registrations ADD COLUMN payment_status TEXT DEFAULT 'UNPAID'"); } catch (_) {}
try { db.exec('ALTER TABLE registrations ADD COLUMN payment_content TEXT'); } catch (_) {}
try { db.exec('ALTER TABLE registrations ADD COLUMN amount INTEGER DEFAULT 150000'); } catch (_) {}
try { db.exec('ALTER TABLE registrations ADD COLUMN members INTEGER DEFAULT 1'); } catch (_) {}
try { db.exec('ALTER TABLE registrations ADD COLUMN package_type TEXT DEFAULT \'\''); } catch (_) {}

// Tối ưu hóa database bằng Indexes cho Production
try { db.exec('CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone)'); } catch (_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email)'); } catch (_) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at)'); } catch (_) {}

export default db;

// One-time migration: if an admin exists with a plain password (not bcrypt prefix),
// replace it with a bcrypt hash. Safe to run multiple times.
try {
  const admins = db.prepare('SELECT id, password FROM admins').all() as { id: number; password: string }[];
  for (const a of admins) {
    if (a.password && !a.password.startsWith('$2a$') && !a.password.startsWith('$2b$') && !a.password.startsWith('$2y$')) {
      const hashed = bcrypt.hashSync(a.password, 10);
      db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashed, a.id);
    }
  }
} catch (err) {
  // ignore migration errors
}
