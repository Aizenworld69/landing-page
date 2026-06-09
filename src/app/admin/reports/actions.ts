'use server';

import db from '@/lib/db';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CourseRevenue = {
  course: string;
  total_registrations: number;
  paid_count: number;
  unpaid_count: number;
  total_revenue: number;         // tổng tiền đã thu (PAID)
  potential_revenue: number;     // tổng tiền chưa thu (UNPAID)
  conversion_rate: number;       // % đã thanh toán
};

export type MonthlyStats = {
  month: string;                 // 'YYYY-MM'
  label: string;                 // 'Tháng 01/2026'
  total_registrations: number;
  paid_count: number;
  unpaid_count: number;
  collected: number;             // tiền đã thu
  pending: number;               // tiền còn nợ
};

export type ReportSummary = {
  total_registrations: number;
  total_paid: number;
  total_unpaid: number;
  total_collected: number;
  total_pending: number;
  best_course: string;
  best_month: string;
};

// ─── Action 1: Revenue by Course ─────────────────────────────────────────────

export async function getRevenueByCoursAction(): Promise<CourseRevenue[]> {
  const rows = db.prepare(`
    SELECT
      CASE WHEN TRIM(COALESCE(course, '')) = '' THEN 'Chưa phân loại' ELSE TRIM(course) END AS course,
      COUNT(*) AS total_registrations,
      SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END) AS paid_count,
      SUM(CASE WHEN payment_status = 'UNPAID' THEN 1 ELSE 0 END) AS unpaid_count,
      SUM(CASE WHEN payment_status = 'PAID' THEN COALESCE(amount, 0) ELSE 0 END) AS total_revenue,
      SUM(CASE WHEN payment_status = 'UNPAID' THEN COALESCE(amount, 0) ELSE 0 END) AS potential_revenue
    FROM registrations
    GROUP BY CASE WHEN TRIM(COALESCE(course, '')) = '' THEN 'Chưa phân loại' ELSE TRIM(course) END
    ORDER BY total_revenue DESC
  `).all() as Array<{
    course: string;
    total_registrations: number;
    paid_count: number;
    unpaid_count: number;
    total_revenue: number;
    potential_revenue: number;
  }>;

  return rows.map(r => ({
    ...r,
    conversion_rate: r.total_registrations > 0
      ? Math.round((r.paid_count / r.total_registrations) * 100)
      : 0,
  }));
}

// ─── Action 2: Monthly Registration & Payment Stats ──────────────────────────

export async function getMonthlyStatsAction(): Promise<MonthlyStats[]> {
  const rows = db.prepare(`
    SELECT
      strftime('%Y-%m', created_at) AS month,
      COUNT(*) AS total_registrations,
      SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END) AS paid_count,
      SUM(CASE WHEN payment_status = 'UNPAID' THEN 1 ELSE 0 END) AS unpaid_count,
      SUM(CASE WHEN payment_status = 'PAID' THEN COALESCE(amount, 0) ELSE 0 END) AS collected,
      SUM(CASE WHEN payment_status = 'UNPAID' THEN COALESCE(amount, 0) ELSE 0 END) AS pending
    FROM registrations
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
  `).all() as MonthlyStats[];

  return rows.map(r => ({
    ...r,
    label: formatMonthLabel(r.month),
  }));
}

// ─── Action 3: Summary KPIs ──────────────────────────────────────────────────

export async function getReportSummaryAction(): Promise<ReportSummary> {
  const summary = db.prepare(`
    SELECT
      COUNT(*) AS total_registrations,
      SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END) AS total_paid,
      SUM(CASE WHEN payment_status = 'UNPAID' THEN 1 ELSE 0 END) AS total_unpaid,
      SUM(CASE WHEN payment_status = 'PAID' THEN COALESCE(amount, 0) ELSE 0 END) AS total_collected,
      SUM(CASE WHEN payment_status = 'UNPAID' THEN COALESCE(amount, 0) ELSE 0 END) AS total_pending
    FROM registrations
  `).get() as {
    total_registrations: number;
    total_paid: number;
    total_unpaid: number;
    total_collected: number;
    total_pending: number;
  };

  // best course by revenue
  const bestCourse = db.prepare(`
    SELECT TRIM(COALESCE(course, 'Chưa phân loại')) AS course, SUM(COALESCE(amount,0)) AS rev
    FROM registrations WHERE payment_status = 'PAID'
    GROUP BY course ORDER BY rev DESC LIMIT 1
  `).get() as { course: string } | undefined;

  // best month by count
  const bestMonth = db.prepare(`
    SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS cnt
    FROM registrations
    GROUP BY month ORDER BY cnt DESC LIMIT 1
  `).get() as { month: string } | undefined;

  return {
    total_registrations: summary.total_registrations ?? 0,
    total_paid: summary.total_paid ?? 0,
    total_unpaid: summary.total_unpaid ?? 0,
    total_collected: summary.total_collected ?? 0,
    total_pending: summary.total_pending ?? 0,
    best_course: bestCourse?.course ?? '—',
    best_month: bestMonth ? formatMonthLabel(bestMonth.month) : '—',
  };
}

// ─── Action 4: Export Data ────────────────────────────────────────────────────

export type ExportRow = {
  id: number;
  fullname: string;
  phone: string;
  email: string;
  course: string;
  package_type: string;
  payment_status: string;
  amount: number;
  created_at: string;
};

export async function getExportDataAction(filters?: {
  month?: string;     // 'YYYY-MM'
  course?: string;
}): Promise<ExportRow[]> {
  let sql = `
    SELECT id, fullname, phone, email,
      TRIM(COALESCE(course, '')) AS course,
      TRIM(COALESCE(package_type, '')) AS package_type,
      payment_status,
      COALESCE(amount, 0) AS amount,
      created_at
    FROM registrations WHERE 1=1
  `;
  const params: string[] = [];

  if (filters?.month) {
    sql += ` AND strftime('%Y-%m', created_at) = ?`;
    params.push(filters.month);
  }
  if (filters?.course && filters.course !== 'all') {
    sql += ` AND TRIM(COALESCE(course, '')) = ?`;
    params.push(filters.course);
  }

  sql += ` ORDER BY created_at DESC`;

  return db.prepare(sql).all(...params) as ExportRow[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatMonthLabel(ym: string): string {
  if (!ym) return '—';
  const [year, month] = ym.split('-');
  return `Tháng ${month}/${year}`;
}
