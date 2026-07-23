import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/portal/supabase-server';
import { lookupCode } from '@/lib/portal/promo-codes';
import { checkRateLimit, getClientIp } from '@/lib/portal/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    if (!checkRateLimit(clientIp, 'promo-validate', 10, 60_000)) {
      return errorResponse('Bạn đã kiểm tra mã quá nhiều lần. Vui lòng thử lại sau 1 phút.', 429, req.nextUrl.pathname);
    }

    const body = await req.json();
    const { code, course_id, plan } = body;

    const VALID_PLANS = ['early_bird', 'individual', 'group_2', 'group_4'] as const;
    type PlanType = typeof VALID_PLANS[number];

    if (!VALID_PLANS.includes(plan as PlanType)) {
      return successResponse({ valid: false, message: 'Gói đăng ký không hợp lệ' });
    }

    const result = await lookupCode(code, course_id, plan as PlanType);
    return successResponse(result);
  } catch (err) {
    console.error('POST /api/promo-codes/validate error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500, req.nextUrl.pathname);
  }
}
