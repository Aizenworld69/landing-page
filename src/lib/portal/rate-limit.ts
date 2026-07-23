interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Dọn dẹp các record đã hết hạn định kỳ mỗi 60s để tránh phình bộ nhớ (memory leak)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60_000);
}

/**
 * Helper kiểm tra rate limit cho API (In-Memory Map)
 * @param ip IP của client
 * @param key Tên hành động / endpoint (vd: 'registrations', 'promo-validate')
 * @param limit Số lượng request tối đa trong cửa sổ thời gian
 * @param windowMs Cửa sổ thời gian (ms) - ví dụ 60_000 (1 phút)
 * @returns `true` nếu hợp lệ (dưới limit), `false` nếu vượt quá limit
 */
export function checkRateLimit(
  ip: string,
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const compositeKey = `${key}:${ip}`;
  const now = Date.now();
  const record = rateLimitStore.get(compositeKey);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(compositeKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Trích xuất IP người dùng từ HTTP Request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || '127.0.0.1';
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
