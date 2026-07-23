import { NextRequest } from 'next/server';
import { supabaseAdmin, verifyAdmin, successResponse, errorResponse } from '@/lib/portal/supabase-server';
import { applyCode } from '@/lib/portal/promo-codes';
import { checkRateLimit, getClientIp } from '@/lib/portal/rate-limit';

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

async function sendLarkIndividual(params: {
  courseTitle: string;
  fullName: string;
  phone: string;
  email: string;
  company?: string;
  position?: string;
  referral: string;
  plan: 'individual' | 'group';
  createdAt: string;
  promoCode?: string;
  discountAmount?: number;
}) {
  const planLabel = params.plan === 'group' ? 'Nhóm 2 người' : 'Cá nhân (1 người)';
  const companyLine = params.company ? `\nCông ty: ${params.company}` : '';
  const positionLine = params.position ? `\nChức vụ: ${params.position}` : '';
  const promoLine = params.promoCode
    ? `\n🎟️ Mã KM: ${params.promoCode} (giảm ${(params.discountAmount ?? 0).toLocaleString('vi-VN')}đ)`
    : '';
  const vnTime = toVnTime(params.createdAt);

  const body = [
    `🆕 Đăng ký khóa học mới!`,
    `Khóa học: ${params.courseTitle}`,
    `Họ tên: ${params.fullName}`,
    `Điện thoại: ${params.phone}`,
    `Email: ${params.email}${companyLine}${positionLine}`,
    `Nguồn: ${params.referral}`,
    `Gói: ${planLabel}${promoLine}`,
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
    const { courseId, fullName, phone, email, company, position, referral, plan, promoCode } = body;

    if (!courseId || !fullName || !phone || !email || !referral || !plan) {
      return errorResponse('Thiếu thông tin đăng ký bắt buộc', 400, req.nextUrl.pathname);
    }

    const course = await verifyCourse(courseId);
    if (!course) {
      return errorResponse('Khóa học không tồn tại hoặc đã đóng nhận đăng ký', 400, req.nextUrl.pathname);
    }

    let discountAmount = 0;
    let appliedPromoCode: string | null = null;

    if (promoCode) {
      const planKey = plan === 'group' ? 'group_2' : plan;
      const promoResult = await applyCode(promoCode, courseId, planKey);
      if (!promoResult.valid) {
        return errorResponse(promoResult.message, 400, req.nextUrl.pathname);
      }
      appliedPromoCode = promoCode;
      const coursePrice = course.price as number | null;
      if (coursePrice && promoResult.discount_type && promoResult.discount_value) {
        discountAmount =
          promoResult.discount_type === 'percent'
            ? Math.round((coursePrice * promoResult.discount_value) / 100)
            : Math.min(promoResult.discount_value, coursePrice);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('registrations')
      .insert({
        course_id: courseId,
        full_name: fullName,
        phone,
        email,
        company: company ?? null,
        position: position ?? null,
        referral,
        plan,
        promo_code: appliedPromoCode,
        discount_amount: discountAmount,
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Insert registration failed:', error);
      return errorResponse('Đăng ký thất bại, vui lòng thử lại', 400, req.nextUrl.pathname);
    }

    sendLarkIndividual({
      courseTitle: course.title,
      fullName,
      phone,
      email,
      company,
      position,
      referral,
      plan,
      createdAt: data.created_at,
      promoCode: appliedPromoCode || undefined,
      discountAmount,
    }).catch((err) => console.error('Lark notification failed', err));

    return successResponse({
      id: data.id,
      message: 'Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.',
      createdAt: data.created_at,
      discountAmount,
    }, 201);
  } catch (err) {
    console.error('POST /api/registrations error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500, req.nextUrl.pathname);
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return errorResponse('Quyền truy cập bị từ chối', 403, req.nextUrl.pathname);
    }

    const { searchParams } = req.nextUrl;
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 20);
    const search = searchParams.get('search');
    const courseId = searchParams.get('courseId');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('registrations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data: regData, error: regError, count } = await query;

    if (regError) {
      console.error('List registrations failed details:', JSON.stringify(regError));
      return errorResponse(regError.message || 'Lỗi khi truy vấn dữ liệu', 400, req.nextUrl.pathname);
    }

    // Safely join course details without relying on PostgREST relationship cache
    const courseIds = Array.from(new Set((regData || []).map((r) => r.course_id).filter(Boolean)));
    const courseMap = new Map<string, { title: string; price?: number; price_group?: number }>();

    if (courseIds.length > 0) {
      const { data: courseList } = await supabaseAdmin
        .from('courses')
        .select('id, title, price, price_group')
        .in('id', courseIds);
      (courseList || []).forEach((c) => courseMap.set(c.id, c));
    }

    const formattedData = (regData || []).map((r) => ({
      ...r,
      courses: courseMap.get(r.course_id) || null,
    }));

    return successResponse({
      data: formattedData,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('GET /api/registrations error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500, req.nextUrl.pathname);
  }
}
