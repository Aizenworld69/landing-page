import { apiClient } from './api-client';
import type { Registration } from '@aizen/types';

// ─── Individual registration ─────────────────────────
export interface CreateRegistrationDto {
  courseId: string;
  fullName: string;
  phone: string;
  email: string;
  company?: string;
  position?: string;
  referral: string;
  plan: string;
  promoCode?: string;
}

export async function createRegistration(
  dto: CreateRegistrationDto,
): Promise<{ message: string; data: Registration }> {
  const { data } = await apiClient.post<{ message: string; data: Registration }>(
    '/registrations',
    {
      courseId: dto.courseId,
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      company: dto.company,
      position: dto.position,
      referral: dto.referral,
      plan: dto.plan,
      promoCode: dto.promoCode || undefined,
    },
  );
  return data;
}

// ─── Group registration (2 members) ─────────────────
export interface GroupMemberDto {
  fullName: string;
  phone: string;
  email: string;
  company?: string;
  position?: string;
}

export interface CreateGroupRegistrationDto {
  courseId: string;
  referral: string;
  members: GroupMemberDto[];
  promoCode?: string;
}

export async function createGroupRegistration(
  dto: CreateGroupRegistrationDto,
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    '/registrations/group',
    {
      course_id: dto.courseId,
      referral: dto.referral,
      promoCode: dto.promoCode || undefined,
      members: dto.members.map((m) => ({
        full_name: m.fullName,
        phone: m.phone,
        email: m.email,
        company: m.company,
        position: m.position,
      })),
    },
  );
  return data;
}

// ─── Validate promo code (public, không tốn lượt) ──────
export interface PromoValidateResult {
  valid: boolean;
  message: string;
  discount_type?: 'percent' | 'fixed';
  discount_value?: number;
  plan?: string;
}

export async function validatePromoCode(
  code: string,
  courseId: string,
  plan: string,
): Promise<PromoValidateResult> {
  const { data } = await apiClient.post<{ data: PromoValidateResult }>(
    '/promo-codes/validate',
    { code, course_id: courseId, plan },
  );
  return data.data;
}

