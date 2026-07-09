import { apiClient } from './api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PromoCode {
  id: string;
  code: string;
  course_id: string;
  plan: 'early_bird' | 'individual' | 'group_2' | 'group_4' | 'all';
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  note: string | null;
  created_at: string;
  courses: { title: string } | null;
}

export interface PaginatedPromoCodes {
  data: PromoCode[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePromoCodePayload {
  code: string;
  course_id: string;
  plan: 'early_bird' | 'individual' | 'group_2' | 'group_4' | 'all';
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_uses: number;
  expires_at?: string | null;
  note?: string | null;
}

export type UpdatePromoCodePayload = Partial<
  Omit<CreatePromoCodePayload, 'code'> & { is_active: boolean }
>;

/** Shape mà ResponseTransformInterceptor wrap tất cả response */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  statusCode: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function adminAuthHeader(): { Authorization: string } {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('admin_access_token')
      : null;
  return { Authorization: `Bearer ${token ?? ''}` };
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function adminGetPromoCodes(params: {
  page?: number;
  limit?: number;
  course_id?: string;
}): Promise<PaginatedPromoCodes> {
  const { data } = await apiClient.get<ApiResponse<PaginatedPromoCodes>>(
    '/promo-codes/admin/list',
    { params, headers: adminAuthHeader() },
  );
  return data.data;
}

export async function adminCreatePromoCode(payload: CreatePromoCodePayload): Promise<PromoCode> {
  const { data } = await apiClient.post<ApiResponse<PromoCode>>(
    '/promo-codes/admin',
    payload,
    { headers: adminAuthHeader() },
  );
  return data.data;
}

export async function adminUpdatePromoCode(
  id: string,
  payload: UpdatePromoCodePayload,
): Promise<PromoCode> {
  const { data } = await apiClient.patch<ApiResponse<PromoCode>>(
    `/promo-codes/admin/${id}`,
    payload,
    { headers: adminAuthHeader() },
  );
  return data.data;
}

export async function adminDeletePromoCode(id: string): Promise<void> {
  await apiClient.delete(`/promo-codes/admin/${id}`, {
    headers: adminAuthHeader(),
  });
}
