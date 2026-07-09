import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import type { CreateRegistrationDto } from './dto/create-registration.dto';
import type { CreateGroupRegistrationDto } from './dto/create-group-registration.dto';
import { PromoCodesService } from '../promo-codes/promo-codes.service';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
    private readonly promoCodesService: PromoCodesService,
  ) {}

  // ─────────────────────────────────────────────
  // Đăng ký cá nhân (1 người)
  // ─────────────────────────────────────────────
  async create(dto: CreateRegistrationDto) {
    const course = await this.verifyCourse(dto.courseId);

    // ── Áp dụng mã khuyến mãi nếu có ──
    let discountAmount = 0;
    let appliedPromoCode: string | null = null;

    if (dto.promoCode) {
      const promo = await this.promoCodesService.applyCode(
        dto.promoCode,
        dto.courseId,
        dto.plan === 'group' ? 'group_2' : dto.plan,
      );
      if (!promo.valid) {
        throw new BadRequestException(promo.message);
      }
      appliedPromoCode = dto.promoCode;
      // Tính discount_amount (nếu biết giá khóa học)
      const coursePrice = (course as Record<string, unknown>)['price'] as number | null;
      if (coursePrice && promo.discount_type && promo.discount_value) {
        discountAmount =
          promo.discount_type === 'percent'
            ? Math.round((coursePrice * promo.discount_value) / 100)
            : Math.min(promo.discount_value, coursePrice);
      }
    }

    // UNIQUE constraint in Supabase database:
    // ALTER TABLE registrations ADD CONSTRAINT uq_reg_course_email UNIQUE (course_id, email);
    const { data, error } = await this.supabase
      .from('registrations')
      .insert({
        course_id: dto.courseId,
        full_name: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        company: dto.company ?? null,
        position: dto.position ?? null,
        referral: dto.referral,
        plan: dto.plan,
        promo_code: appliedPromoCode,
        discount_amount: discountAmount,
      })
      .select('id, created_at')
      .single();

    if (error) {
      this.logger.error('Create registration failed', error);
      throw new BadRequestException('Đăng ký thất bại, vui lòng thử lại');
    }

    this.sendLarkIndividual({
      courseTitle: course['title'] as string,
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      company: dto.company,
      position: dto.position,
      referral: dto.referral,
      plan: dto.plan,
      createdAt: data['created_at'] as string,
      promoCode: appliedPromoCode ?? undefined,
      discountAmount,
    }).catch((err: unknown) => this.logger.error('Lark notification failed', err));

    return {
      id: data['id'],
      message: 'Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.',
      createdAt: data['created_at'],
      discountAmount,
    };
  }

  // ─────────────────────────────────────────────
  // Đăng ký nhóm (2 người, 1 request)
  // ─────────────────────────────────────────────
  async createGroup(dto: CreateGroupRegistrationDto) {
    const course = await this.verifyCourse(dto.course_id);

    // Check 2 member không được dùng cùng email
    const emails = dto.members.map((m) => m.email.toLowerCase());
    if (new Set(emails).size !== emails.length) {
      throw new BadRequestException('Hai thành viên không được dùng cùng địa chỉ email');
    }

    // ── Áp dụng mã khuyến mãi nếu có ──
    let discountAmount = 0;
    let appliedPromoCode: string | null = null;

    if (dto.promoCode) {
      const planKey = dto.members.length === 4 ? 'group_4' : 'group_2';
      const promo = await this.promoCodesService.applyCode(
        dto.promoCode,
        dto.course_id,
        planKey,
      );
      if (!promo.valid) {
        throw new BadRequestException(promo.message);
      }
      appliedPromoCode = dto.promoCode;
      const coursePrice = (course as Record<string, unknown>)['price_group'] as number | null;
      if (coursePrice && promo.discount_type && promo.discount_value) {
        discountAmount =
          promo.discount_type === 'percent'
            ? Math.round((coursePrice * promo.discount_value) / 100)
            : Math.min(promo.discount_value, coursePrice);
      }
    }

    // Insert tất cả members - cùng group_id để admin panel gom nhóm hiển thị
    const groupId = randomUUID();
    const rows = dto.members.map((m) => ({
      course_id: dto.course_id,
      full_name: m.full_name,
      phone: m.phone,
      email: m.email,
      company: m.company ?? null,
      position: m.position ?? null,
      referral: dto.referral,
      plan: 'group',
      group_id: groupId,
      promo_code: appliedPromoCode,
      discount_amount: discountAmount,
    }));

    // UNIQUE constraint in Supabase database:
    // ALTER TABLE registrations ADD CONSTRAINT uq_reg_course_email UNIQUE (course_id, email);
    const { data, error } = await this.supabase
      .from('registrations')
      .insert(rows)
      .select('id, created_at');

    if (error) {
      this.logger.error('Create group registration failed', error);
      throw new BadRequestException('Đăng ký thất bại, vui lòng thử lại');
    }

    const createdAt = (data[0] as { created_at: string })?.created_at ?? new Date().toISOString();

    this.sendLarkGroup({
      courseTitle: course['title'] as string,
      members: dto.members,
      referral: dto.referral,
      createdAt,
      promoCode: appliedPromoCode ?? undefined,
      discountAmount,
    }).catch((err: unknown) => this.logger.error('Lark group notification failed', err));

    return {
      message: 'Đăng ký nhóm thành công! Chúng tôi sẽ liên hệ sớm nhất.',
      count: dto.members.length,
      discountAmount,
    };
  }


  // ─────────────────────────────────────────────
  // Admin: list registrations
  // ─────────────────────────────────────────────
  async findAll(params: { page: number; limit: number; search?: string; courseId?: string }) {
    const { page, limit, search, courseId } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from('registrations')
      .select('id, full_name, phone, email, company, position, referral, plan, group_id, created_at, course_id, courses(title, price, price_group)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error, count } = await query;
    if (error) throw new BadRequestException('Lỗi khi truy vấn dữ liệu');

    return {
      data,
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  }

  // ─────────────────────────────────────────────
  // Admin: stats
  // ─────────────────────────────────────────────
  async getStats() {
    const { data, error } = await this.supabase.rpc('get_registration_stats');
    if (error) {
      this.logger.error('Failed to get stats via RPC', error);
      throw new BadRequestException('Lỗi khi truy vấn dữ liệu thống kê');
    }

    return data as {
      total: number;
      today: number;
      byCourse: { courseId: string; title: string; count: number }[];
    };
  }
  // ─────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────
  private async verifyCourse(courseId: string) {
    const { data: course, error } = await this.supabase
      .from('courses')
      .select('id, title, status, price, price_group')
      .eq('id', courseId)
      .single();

    if (error || !course) throw new NotFoundException('Không tìm thấy khóa học');
    if (course['status'] !== 'upcoming') {
      throw new BadRequestException('Khóa học này không còn nhận đăng ký');
    }
    return course;
  }

  private async sendLarkIndividual(params: {
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
  }): Promise<void> {
    const webhookUrl = this.config.get<string>('lark.webhookUrl');
    if (!webhookUrl) return;

    const planLabel = params.plan === 'group' ? 'Nhóm 2 người' : 'Cá nhân (1 người)';
    const companyLine = params.company ? `\nCông ty: ${params.company}` : '';
    const positionLine = params.position ? `\nChức vụ: ${params.position}` : '';
    const promoLine = params.promoCode
      ? `\n🎟️ Mã KM: ${params.promoCode} (giảm ${(params.discountAmount ?? 0).toLocaleString('vi-VN')}đ)`
      : '';
    const vnTime = this.toVnTime(params.createdAt);

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

    await this.postLark(body);
  }

  private async sendLarkGroup(params: {
    courseTitle: string;
    members: Array<{ full_name: string; phone: string; email: string; company?: string; position?: string }>;
    referral: string;
    createdAt: string;
    promoCode?: string;
    discountAmount?: number;
  }): Promise<void> {
    const webhookUrl = this.config.get<string>('lark.webhookUrl');
    if (!webhookUrl) return;

    const vnTime = this.toVnTime(params.createdAt);
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

    await this.postLark(body);
  }

  private async postLark(body: string): Promise<void> {
    const webhookUrl = this.config.get<string>('lark.webhookUrl');
    if (!webhookUrl) {
      this.logger.warn('LARK_WEBHOOK_URL chưa được cấu hình');
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: body,
    });

    if (!response.ok) {
      this.logger.warn(`Lark webhook HTTP ${response.status}: ${await response.text()}`);
    }
  }

  private toVnTime(isoString: string): string {
    return new Date(new Date(isoString).getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
  }
}
