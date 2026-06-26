import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic'; // Không cache, luôn truy vấn DB mới nhất

export async function GET() {
  try {
    const MAX_SLOTS = 10;

    // Đếm số đăng ký Early Bird (bao gồm cả UNPAID và PAID)
    const row = db
      .prepare(
        `SELECT COUNT(*) as count FROM registrations 
         WHERE package_type = 'Early Bird'`
      )
      .get() as { count: number };

    const used = row?.count ?? 0;
    const remaining = Math.max(0, MAX_SLOTS - used);

    return NextResponse.json({ used, remaining, total: MAX_SLOTS });
  } catch (error) {
    console.error('Lỗi đếm suất Early Bird:', error);
    return NextResponse.json({ used: 0, remaining: 10, total: 10 }, { status: 500 });
  }
}
