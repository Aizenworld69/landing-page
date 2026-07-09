import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import type { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import type { UpdatePromoCodeDto } from './dto/update-promo-code.dto';

export interface PromoValidationResult {
  valid: boolean;
  message: string;
  discount_type?: 'percent' | 'fixed';
  discount_value?: number;
  /** Số tiền giảm tính được (nếu biết giá gốc) */
  promo_code_id?: string;
}

@Injectable()
export class PromoCodesService {
  private readonly logger = new Logger(PromoCodesService.name);

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
  ) {}

  // ─────────────────────────────────────────────
  // Public: lấy promo đang active cho từng gói của 1 khóa học
  // Dùng bởi admin tab "Cấu hình Đăng ký" để biết gói nào có KM
  // ─────────────────────────────────────────────

  async getActiveByCourseId(course_id: string): Promise<
    Partial<Record<'early_bird' | 'individual' | 'group_2' | 'group_4', {
      plan: string;
      discount_type: 'percent' | 'fixed';
      discount_value: number;
    }>>
  > {
    const now = new Date().toISOString();

    // Lọc phía app: used_count < max_uses (Supabase JS không hỗ trợ column-to-column filter)
    const { data: raw, error } = await this.supabase
      .from('promo_codes')
      .select('plan, discount_type, discount_value, created_at, used_count, max_uses')
      .eq('course_id', course_id)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`getActiveByCourseId failed for course ${course_id}`, error);
      return {};
    }

    const validPromos = (raw ?? []).filter(
      (p) => (p['used_count'] as number) < (p['max_uses'] as number),
    );

    // Nhóm theo plan — mỗi gói chỉ lấy cái mới nhất (đã sort DESC)
    const PLAN_KEYS = ['early_bird', 'individual', 'group_2', 'group_4'] as const;
    const result: Partial<Record<'early_bird' | 'individual' | 'group_2' | 'group_4', {
      plan: string;
      discount_type: 'percent' | 'fixed';
      discount_value: number;
    }>> = {};

    for (const promo of validPromos) {
      const planVal = promo['plan'] as string;
      const targets: ('early_bird' | 'individual' | 'group_2' | 'group_4')[] =
        planVal === 'all'
          ? ['early_bird', 'individual', 'group_2', 'group_4']
          : PLAN_KEYS.filter((k) => k === planVal) as ('early_bird' | 'individual' | 'group_2' | 'group_4')[];

      for (const key of targets) {
        if (!result[key]) {
          result[key] = {
            plan: planVal,
            discount_type: promo['discount_type'] as 'percent' | 'fixed',
            discount_value: promo['discount_value'] as number,
          };
        }
      }
    }

    return result;
  }

  // ─────────────────────────────────────────────
  // Admin CRUD
  // ─────────────────────────────────────────────


  async adminFindAll(params: { page: number; limit: number; course_id?: string; search?: string }) {
    const { page, limit, course_id, search } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from('promo_codes')
      .select(
        'id, code, plan, discount_type, discount_value, max_uses, used_count, expires_at, is_active, note, created_at, course_id, courses(title)',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (course_id) {
      query = query.eq('course_id', course_id);
    }

    if (search) {
      query = query.ilike('code', `%${search.toUpperCase().trim()}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      this.logger.error('adminFindAll query failed', error);
      throw new BadRequestException('Lỗi khi truy vấn danh sách mã');
    }

    return {
      data,
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  }

  async adminCreate(dto: CreatePromoCodeDto) {
    // Kiểm tra code chưa tồn tại
    const { data: existing } = await this.supabase
      .from('promo_codes')
      .select('id')
      .eq('code', dto.code)
      .maybeSingle();

    if (existing) {
      throw new ConflictException(`Mã "${dto.code}" đã tồn tại`);
    }

    // Kiểm tra khóa học tồn tại
    const { data: course, error: courseErr } = await this.supabase
      .from('courses')
      .select('id, title')
      .eq('id', dto.course_id)
      .maybeSingle();

    if (courseErr || !course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const { data, error } = await this.supabase
      .from('promo_codes')
      .insert({
        code: dto.code,
        course_id: dto.course_id,
        plan: dto.plan,
        discount_type: dto.discount_type,
        discount_value: dto.discount_value,
        max_uses: dto.max_uses,
        expires_at: dto.expires_at || null,
        note: dto.note ?? null,
        is_active: true,
        used_count: 0,
      })
      .select('id, code, plan, discount_type, discount_value, max_uses, used_count, expires_at, is_active, note, created_at, course_id, courses(title)')
      .single();

    if (error) {
      this.logger.error('Create promo code failed', error);
      throw new BadRequestException('Tạo mã khuyến mãi thất bại');
    }

    return data;
  }

  async adminUpdate(id: string, dto: UpdatePromoCodeDto) {
    const { data: existing } = await this.supabase
      .from('promo_codes')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (!existing) throw new NotFoundException('Không tìm thấy mã khuyến mãi');

    if (dto.course_id) {
      const { data: course, error: courseErr } = await this.supabase
        .from('courses')
        .select('id')
        .eq('id', dto.course_id)
        .maybeSingle();
      if (courseErr || !course) throw new NotFoundException('Không tìm thấy khóa học');
    }

    const { data, error } = await this.supabase
      .from('promo_codes')
      .update({
        ...(dto.course_id !== undefined && { course_id: dto.course_id }),
        ...(dto.plan !== undefined && { plan: dto.plan }),
        ...(dto.discount_type !== undefined && { discount_type: dto.discount_type }),
        ...(dto.discount_value !== undefined && { discount_value: dto.discount_value }),
        ...(dto.max_uses !== undefined && { max_uses: dto.max_uses }),
        ...(dto.expires_at !== undefined && { expires_at: dto.expires_at }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      })
      .eq('id', id)
      .select('id, code, plan, discount_type, discount_value, max_uses, used_count, expires_at, is_active, note, created_at, course_id, courses(title)')
      .single();

    if (error) {
      this.logger.error('Update promo code failed', error);
      throw new BadRequestException('Cập nhật mã thất bại');
    }
    return data;
  }

  async adminDelete(id: string) {
    const { data: existing } = await this.supabase
      .from('promo_codes')
      .select('id, used_count')
      .eq('id', id)
      .maybeSingle();

    if (!existing) throw new NotFoundException('Không tìm thấy mã khuyến mãi');

    const { error } = await this.supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Delete promo code failed', error);
      throw new BadRequestException('Xóa mã thất bại');
    }
    return { message: 'Đã xóa mã khuyến mãi' };
  }

  // ─────────────────────────────────────────────
  // Public: validate (preview — không tăng used_count)
  // ─────────────────────────────────────────────

  async validate(
    code: string,
    course_id: string,
    plan: 'early_bird' | 'individual' | 'group_2' | 'group_4',
  ): Promise<PromoValidationResult> {
    return this._lookupCode(code, course_id, plan);
  }

  // ─────────────────────────────────────────────
  // Internal: apply (validate + tăng used_count atomically)
  // Dùng bởi RegistrationsService khi submit form
  // ─────────────────────────────────────────────

  async applyCode(
    code: string,
    course_id: string,
    plan: 'early_bird' | 'individual' | 'group_2' | 'group_4',
  ): Promise<PromoValidationResult> {
    const result = await this._lookupCode(code, course_id, plan);
    if (!result.valid || !result.promo_code_id) return result;

    // Atomic increment via PostgreSQL RPC (SET used_count = used_count + 1 WHERE used_count < max_uses)
    const { error } = await this.supabase.rpc(
      'increment_promo_used_count' as never,
      { p_id: result.promo_code_id } as never,
    );

    if (error) {
      this.logger.warn(
        `Không thể tăng used_count cho mã ${code}: ${JSON.stringify(error)}`,
      );
    }

    return result;
  }


  // ─────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────

  private async _lookupCode(
    code: string,
    course_id: string,
    plan: 'early_bird' | 'individual' | 'group_2' | 'group_4',
  ): Promise<PromoValidationResult> {
    const upperCode = code.toUpperCase().trim();

    const { data: promo, error } = await this.supabase
      .from('promo_codes')
      .select('id, code, course_id, plan, discount_type, discount_value, max_uses, used_count, expires_at, is_active')
      .eq('code', upperCode)
      .maybeSingle();

    if (error) {
      this.logger.error(`DB error khi lookup mã "${upperCode}"`, error);
      return { valid: false, message: 'Có lỗi xảy ra, vui lòng thử lại sau' };
    }

    if (!promo) {
      return { valid: false, message: 'Mã khuyến mãi không tồn tại' };
    }

    if (!promo['is_active']) {
      return { valid: false, message: 'Mã khuyến mãi đã bị vô hiệu hóa' };
    }

    // Kiểm tra đúng khóa học
    if (promo['course_id'] !== course_id) {
      return { valid: false, message: 'Mã không áp dụng cho khóa học này' };
    }

    // Kiểm tra đúng gói
    if (promo['plan'] !== 'all' && promo['plan'] !== plan) {
      const planLabelMap: Record<string, string> = {
        early_bird: 'early bird',
        individual: 'cá nhân',
        group_2: 'nhóm 2 người',
        group_4: 'nhóm 4 người',
      };
      const planLabel = planLabelMap[promo['plan'] as string] ?? String(promo['plan']);
      return { valid: false, message: `Mã chỉ áp dụng cho đăng ký ${planLabel}` };
    }

    // Kiểm tra hết lượt
    if (promo['used_count'] >= promo['max_uses']) {
      return { valid: false, message: 'Mã đã hết lượt sử dụng' };
    }

    // Kiểm tra hết hạn
    if (promo['expires_at'] && new Date(promo['expires_at'] as string) < new Date()) {
      return { valid: false, message: 'Mã khuyến mãi đã hết hạn' };
    }

    const discountType = promo['discount_type'] as 'percent' | 'fixed';
    const discountValue = promo['discount_value'] as number;

    const message =
      discountType === 'percent'
        ? `Giảm ${discountValue}% học phí`
        : `Giảm ${discountValue.toLocaleString('vi-VN')}đ học phí`;

    return {
      valid: true,
      message,
      discount_type: discountType,
      discount_value: discountValue,
      promo_code_id: promo['id'] as string,
    };
  }
}
