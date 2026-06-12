import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const db = new Database(path.join(process.cwd(), 'registrations.db'), {
  timeout: 20000 // Tăng timeout lên 20 giây để giảm thiểu lỗi SQLITE_BUSY
});
db.pragma('journal_mode = WAL');

// Bỏ qua việc tạo bảng/seeds/indexes khi đang chạy Next.js Build Phase
// (Để tránh việc 10 Next.js build workers cùng lúc ghi vào file DB gây khóa)
if (process.env.NEXT_PHASE !== 'phase-production-build') {
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

    -- Bảng sessions: lưu token xác thực thay vì chỉ dùng cookie boolean
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      admin_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
    );

    -- Bảng group_members: lưu thông tin từng thành viên trong nhóm
    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL,
      member_index INTEGER NOT NULL,
      fullname TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      role TEXT,
      company TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
    );

    -- Bảng courses: quản lý khóa học
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      month TEXT NOT NULL,
      implementation_date TEXT NOT NULL,
      location TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Bảng vouchers: quản lý mã giảm giá
    CREATE TABLE IF NOT EXISTS vouchers (
      code TEXT PRIMARY KEY,
      discount_percent INTEGER NOT NULL DEFAULT 20,
      max_uses INTEGER NOT NULL DEFAULT 1,
      used_count INTEGER NOT NULL DEFAULT 0,
      expires_at DATETIME NOT NULL,
      applicable_package TEXT NOT NULL DEFAULT '1 người',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed admin (password is hashed)
  db.prepare("INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)").run('aizen', bcrypt.hashSync('Aizen@2026', 10));

  // Seeding 10 vouchers AISM01 to AISM10 if they do not exist
  try {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM vouchers").get() as { cnt: number };
    if (count.cnt === 0) {
      const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const insertVoucher = db.prepare(`
        INSERT OR IGNORE INTO vouchers (code, discount_percent, max_uses, used_count, expires_at, applicable_package)
        VALUES (?, 20, 1, 0, ?, '1 người')
      `);

      for (let i = 1; i <= 10; i++) {
        const code = `AISM${String(i).padStart(2, '0')}`;
        insertVoucher.run(code, expiresAt);
      }
    }
  } catch (err) {
    console.error('Lỗi khi seed vouchers:', err);
  }

  // Thêm cột nếu chưa tồn tại (ALTER TABLE sẽ lỗi nếu cột đã có — bỏ qua)
  try { db.exec('ALTER TABLE registrations ADD COLUMN referral TEXT'); } catch (_) { }
  try { db.exec('ALTER TABLE registrations ADD COLUMN role TEXT'); } catch (_) { }
  try { db.exec('ALTER TABLE registrations ADD COLUMN company TEXT'); } catch (_) { }
  try { db.exec("ALTER TABLE registrations ADD COLUMN payment_status TEXT DEFAULT 'UNPAID'"); } catch (_) { }
  try { db.exec('ALTER TABLE registrations ADD COLUMN payment_content TEXT'); } catch (_) { }
  try { db.exec('ALTER TABLE registrations ADD COLUMN amount INTEGER DEFAULT 150000'); } catch (_) { }
  try { db.exec('ALTER TABLE registrations ADD COLUMN members INTEGER DEFAULT 1'); } catch (_) { }
  try { db.exec('ALTER TABLE registrations ADD COLUMN package_type TEXT DEFAULT \'\''); } catch (_) { }
  try { db.exec('ALTER TABLE registrations ADD COLUMN course TEXT DEFAULT \'\''); } catch (_) { }
  try { db.exec('ALTER TABLE registrations ADD COLUMN cohort_month TEXT DEFAULT \'\''); } catch (_) { }
  try { db.exec('ALTER TABLE registrations ADD COLUMN voucher_code TEXT DEFAULT \'\''); } catch (_) { }

  // Tối ưu hóa database bằng Indexes cho Production
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone)'); } catch (_) { }
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email)'); } catch (_) { }
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at)'); } catch (_) { }
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_registrations_voucher_code ON registrations(voucher_code)'); } catch (_) { }
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_group_members_registration_id ON group_members(registration_id)'); } catch (_) { }
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_courses_month ON courses(month)'); } catch (_) { }

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
}

export default db;
