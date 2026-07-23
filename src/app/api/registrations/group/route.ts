import { NextRequest } from 'next/server';
import { supabaseAdmin, successResponse, errorResponse } from '@/lib/portal/supabase-server';
import { applyCode } from '@/lib/portal/promo-codes';
import { checkRateLimit, getClientIp } from '@/lib/portal/rate-limit';
import { randomUUID } from 'crypto';

async function verifyCourse(courseId: string) {
  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .select('id, title, status, price, price_group')
    .eq('id', courseId)
    .single();

  if (error || !course) return null;
  if (course.status !== 'upcoming') return null;
  return course;
}

async function postLark(body: string) {
  const webhookUrl = process.env.LARK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('LARK_WEBHOOK_URL chưa được cấu hình');
    return;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: body,
  });

  if (!response.ok) {
    console.warn(`Lark webhook HTTP ${response.status}: ${await response.text()}`);
  }
}

function toVnTime(isoString: string): string {
  return new Date(new Date(isoString).getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .replace('T', ' ')
    .substring(0, 19);
}

async function sendLarkGroup(params: {
  courseTitle: string;
  members: Array<{ full_name: string; phone: string; email: string; company?: string; position?: string }>;
  referral: string;
  createdAt: string;
  promoCode?: string;
  discountAmount?: number;
}) {
  const vnTime = toVnTime(params.createdAt);
  const promoLine = params.promoCode
    ? `\n🎟️ Mã KM: ${params.promoCode} (giảm ${(params.discountAmount ?? 0).toLocaleString('vi-VN')}đ)`
    : '';

  const memberLines = params.members
    .map((m, i) => {
      const companyLine = m.company ? `\n   Công ty: ${m.company}` : '';
      const positionLine = m.position ? `\n   Chức vụ: ${m.position}` : '';
      return `👤 Người ${i + 1}: ${m.full_name}\n   📞 ${m.phone} | ✉️ ${m.email}${companyLine}${positionLine}`;
    })
    .join('\n\n');

  const body = [
    `🆕 Đăng ký NHÓM ${params.members.length} người mới!`,
    `Khóa học: ${params.courseTitle}`,
    `Nguồn: ${params.referral}${promoLine}`,
    ``,
    memberLines,
    ``,
    `Thời gian: ${vnTime}`,
  ].join('\n');

  await postLark(body);
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    if (!checkRateLimit(clientIp, 'registrations', 5, 60_000)) {
      return errorResponse('Bạn đã gửi quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau ít phút.', 429, req.nextUrl.pathname);
    }

    const body = await req.json();
    const { course_id, referral, promoCode, members } = body;

    if (!course_id || !referral || !members || !Array.isArray(members) || members.length === 0) {
      return errorResponse('Thiếu thông tin đăng ký bắt buộc', 400, req.nextUrl.pathname);
    }

    const course = await verifyCourse(course_id);
    if (!course) {
      return errorResponse('Khóa học không tồn tại hoặc đã đóng nhận đăng ký', 400, req.nextUrl.pathname);
    }

    // Check emails are unique
    const emails = members.map((m) => m.email.toLowerCase());
    if (new Set(emails).size !== emails.length) {
      return errorResponse('Hai thành viên không được dùng cùng địa chỉ email', 400, req.nextUrl.pathname);
    }

    let discountAmount = 0;
    let appliedPromoCode: string | null = null;

    if (promoCode) {
      const planKey = members.length === 4 ? 'group_4' : 'group_2';
      const promoResult = await applyCode(promoCode, course_id, planKey);
      if (!promoResult.valid) {
        return errorResponse(promoResult.message, 400, req.nextUrl.pathname);
      }
      appliedPromoCode = promoCode;
      const coursePrice = course.price_group as number | null;
      if (coursePrice && promoResult.discount_type && promoResult.discount_value) {
        discountAmount =
          promoResult.discount_type === 'percent'
            ? Math.round((coursePrice * promoResult.discount_value) / 100)
            : Math.min(promoResult.discount_value, coursePrice);
      }
    }

    const groupId = randomUUID();
    const rows = members.map((m) => ({
      course_id,
      full_name: m.full_name,
      phone: m.phone,
      email: m.email,
      company: m.company ?? null,
      position: m.position ?? null,
      referral,
      plan: 'group',
      group_id: groupId,
      promo_code: appliedPromoCode,
      discount_amount: discountAmount,
    }));

    const { data, error } = await supabaseAdmin
      .from('registrations')
      .insert(rows)
      .select('id, created_at');

    if (error) {
      console.error('Insert group registration failed:', error);
      return errorResponse('Đăng ký thất bại, vui lòng thử lại', 400, req.nextUrl.pathname);
    }

    const createdAt = data?.[0]?.created_at || new Date().toISOString();

    sendLarkGroup({
      courseTitle: course.title,
      members,
      referral,
      createdAt,
      promoCode: appliedPromoCode || undefined,
      discountAmount,
    }).catch((err) => console.error('Lark group notification failed', err));

    return successResponse({
      message: 'Đăng ký nhóm thành công! Chúng tôi sẽ liên hệ sớm nhất.',
      count: members.length,
      discountAmount,
    }, 201);
  } catch (err) {
    console.error('POST /api/registrations/group error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500, req.nextUrl.pathname);
  }
}
