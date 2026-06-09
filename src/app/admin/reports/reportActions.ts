'use server';

import db from '@/lib/db';

export interface RevenueByCoursData {
  course: string;
  total_registrations: number;
  paid_count: number;
  unpaid_count: number;
  total_revenue: number;
  payment_rate: number;
}

export interface RegistrationReportData {
  total_registrations: number;
  paid_count: number;
  unpaid_count: number;
  total_paid_amount: number;
  total_unpaid_amount: number;
  conversion_rate: number;
  monthly_trends: Array<{
    month: string;
    registrations: number;
    paid: number;
    unpaid: number;
    revenue: number;
  }>;
}

export interface ExportRegistration {
  id: number;
  fullname: string;
  phone: string;
  email: string;
  amount: number;
  payment_status: string;
  created_at: string;
  course: string;
  company: string;
}

/**
 * Lấy dữ liệu doanh thu theo khóa học
 */
export async function getRevenueByCoursData(): Promise<RevenueByCoursData[]> {
  try {
    const data = db
      .prepare(
        `
        SELECT 
          COALESCE(course, 'Chưa xác định') as course,
          COUNT(*) as total_registrations,
          SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END) as paid_count,
          SUM(CASE WHEN payment_status = 'UNPAID' THEN 1 ELSE 0 END) as unpaid_count,
          SUM(CASE WHEN payment_status = 'PAID' THEN amount ELSE 0 END) as total_revenue
        FROM registrations
        GROUP BY course
        ORDER BY total_revenue DESC
        `
      )
      .all() as Array<{
      course: string;
      total_registrations: number;
      paid_count: number;
      unpaid_count: number;
      total_revenue: number;
    }>;

    return data.map((item) => ({
      ...item,
      payment_rate:
        item.total_registrations > 0
          ? Math.round((item.paid_count / item.total_registrations) * 100)
          : 0,
    }));
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return [];
  }
}

/**
 * Lấy báo cáo chi tiết đăng ký vs thanh toán
 */
export async function getRegistrationReportData(
  startDate?: string,
  endDate?: string
): Promise<RegistrationReportData> {
  try {
    // Xây dựng WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: string[] = [];

    if (startDate) {
      whereClause += ' AND DATE(created_at) >= DATE(?)';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND DATE(created_at) <= DATE(?)';
      params.push(endDate);
    }

    // Lấy tổng thể stats
    const stats = db
      .prepare(
        `
        SELECT 
          COUNT(*) as total_registrations,
          SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END) as paid_count,
          SUM(CASE WHEN payment_status = 'UNPAID' THEN 1 ELSE 0 END) as unpaid_count,
          SUM(CASE WHEN payment_status = 'PAID' THEN amount ELSE 0 END) as total_paid_amount,
          SUM(CASE WHEN payment_status = 'UNPAID' THEN amount ELSE 0 END) as total_unpaid_amount
        FROM registrations
        ${whereClause}
        `
      )
      .get(...params) as {
      total_registrations: number;
      paid_count: number;
      unpaid_count: number;
      total_paid_amount: number;
      total_unpaid_amount: number;
    };

    // Lấy trends theo tháng
    const trends = db
      .prepare(
        `
        SELECT 
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as registrations,
          SUM(CASE WHEN payment_status = 'PAID' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN payment_status = 'UNPAID' THEN 1 ELSE 0 END) as unpaid,
          SUM(CASE WHEN payment_status = 'PAID' THEN amount ELSE 0 END) as revenue
        FROM registrations
        ${whereClause}
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
        `
      )
      .all(...params) as Array<{
      month: string;
      registrations: number;
      paid: number;
      unpaid: number;
      revenue: number;
    }>;

    const conversion_rate =
      stats.total_registrations > 0
        ? Math.round((stats.paid_count / stats.total_registrations) * 100)
        : 0;

    return {
      total_registrations: stats.total_registrations,
      paid_count: stats.paid_count,
      unpaid_count: stats.unpaid_count,
      total_paid_amount: stats.total_paid_amount || 0,
      total_unpaid_amount: stats.total_unpaid_amount || 0,
      conversion_rate,
      monthly_trends: trends.reverse(),
    };
  } catch (error) {
    console.error('Error fetching registration report:', error);
    return {
      total_registrations: 0,
      paid_count: 0,
      unpaid_count: 0,
      total_paid_amount: 0,
      total_unpaid_amount: 0,
      conversion_rate: 0,
      monthly_trends: [],
    };
  }
}

/**
 * Lấy dữ liệu để export Excel
 */
export async function getExportData(
  startDate?: string,
  endDate?: string,
  courseFilter?: string
): Promise<ExportRegistration[]> {
  try {
    let whereClause = 'WHERE 1=1';
    const params: (string | null)[] = [];

    if (startDate) {
      whereClause += ' AND DATE(created_at) >= DATE(?)';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND DATE(created_at) <= DATE(?)';
      params.push(endDate);
    }
    if (courseFilter) {
      whereClause += ' AND course = ?';
      params.push(courseFilter);
    }

    const data = db
      .prepare(
        `
        SELECT 
          id, fullname, phone, email, amount, payment_status, 
          created_at, course, company
        FROM registrations
        ${whereClause}
        ORDER BY created_at DESC
        `
      )
      .all(...params) as ExportRegistration[];

    return data;
  } catch (error) {
    console.error('Error fetching export data:', error);
    return [];
  }
}

/**
 * Lấy danh sách khóa học duy nhất (cho dropdown)
 */
export async function getUniqueCourses(): Promise<string[]> {
  try {
    const courses = db
      .prepare(
        `
        SELECT DISTINCT course FROM registrations 
        WHERE course IS NOT NULL AND course != ''
        ORDER BY course
        `
      )
      .all() as Array<{ course: string }>;

    return courses.map((c) => c.course);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}
