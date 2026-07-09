import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import { RegistrationsService } from './registrations.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let mockPromoCodesService: jest.Mocked<PromoCodesService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Mock Supabase methods
    const fromMock = jest.fn();
    mockSupabase = {
      from: fromMock,
    } as unknown as jest.Mocked<SupabaseClient>;

    // Mock PromoCodesService
    mockPromoCodesService = {
      applyCode: jest.fn(),
    } as unknown as jest.Mocked<PromoCodesService>;

    // Mock ConfigService
    mockConfigService = {
      get: jest.fn().mockReturnValue('https://mock-lark-webhook-url.com'),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsService,
        {
          provide: SUPABASE_CLIENT,
          useValue: mockSupabase,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PromoCodesService,
          useValue: mockPromoCodesService,
        },
      ],
    }).compile();

    service = module.get<RegistrationsService>(RegistrationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create registration (individual)', () => {
    const mockCourse = {
      id: 'course-123',
      title: 'Khóa học AI Pro',
      status: 'upcoming',
      price: 1000000,
      price_group: 800000,
    };

    const mockDto: CreateRegistrationDto = {
      courseId: 'course-123',
      fullName: 'Nguyễn Văn A',
      phone: '0987654321',
      email: 'a@gmail.com',
      referral: 'Facebook',
      plan: 'individual',
    };

    it('should throw NotFoundException if course does not exist', async () => {
      // Mock Supabase course query to return null
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(service.create(mockDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if course is not upcoming', async () => {
      const inactiveCourse = { ...mockCourse, status: 'closed' };
      const mockSingle = jest.fn().mockResolvedValue({ data: inactiveCourse, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(service.create(mockDto)).rejects.toThrow(BadRequestException);
    });

    it('should register successfully without promo code', async () => {
      // 1. Mock course query
      const mockSingleCourse = jest.fn().mockResolvedValue({ data: mockCourse, error: null });
      const mockEqCourse = jest.fn().mockReturnValue({ single: mockSingleCourse });
      const mockSelectCourse = jest.fn().mockReturnValue({ eq: mockEqCourse });

      // 2. Mock registration insertion
      const mockRegistrationData = { id: 'reg-999', created_at: '2026-07-01T00:00:00Z' };
      const mockSingleReg = jest.fn().mockResolvedValue({ data: mockRegistrationData, error: null });
      const mockSelectReg = jest.fn().mockReturnValue({ single: mockSingleReg });
      const mockInsertReg = jest.fn().mockReturnValue({ select: mockSelectReg });

      // Mock from() to route requests correctly
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'courses') {
          return { select: mockSelectCourse };
        }
        if (table === 'registrations') {
          return { insert: mockInsertReg };
        }
        return {};
      });

      // Mock fetch global for Lark notification
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('ok'),
      });

      const result = await service.create(mockDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('reg-999');
      expect(result.discountAmount).toBe(0);
      expect(mockPromoCodesService.applyCode).not.toHaveBeenCalled();
    });

    it('should apply discount percent successfully with valid promo code', async () => {
      // 1. Mock course query
      const mockSingleCourse = jest.fn().mockResolvedValue({ data: mockCourse, error: null });
      const mockEqCourse = jest.fn().mockReturnValue({ single: mockSingleCourse });
      const mockSelectCourse = jest.fn().mockReturnValue({ eq: mockEqCourse });

      // 2. Mock registration insertion
      const mockRegistrationData = { id: 'reg-999', created_at: '2026-07-01T00:00:00Z' };
      const mockSingleReg = jest.fn().mockResolvedValue({ data: mockRegistrationData, error: null });
      const mockSelectReg = jest.fn().mockReturnValue({ single: mockSingleReg });
      const mockInsertReg = jest.fn().mockReturnValue({ select: mockSelectReg });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'courses') {
          return { select: mockSelectCourse };
        }
        if (table === 'registrations') {
          return { insert: mockInsertReg };
        }
        return {};
      });

      // 3. Mock promo code service returning 20% discount
      mockPromoCodesService.applyCode.mockResolvedValue({
        valid: true,
        message: 'Giảm 20% học phí',
        discount_type: 'percent',
        discount_value: 20,
        promo_code_id: 'promo-111',
      });

      const dtoWithPromo: CreateRegistrationDto = {
        ...mockDto,
        promoCode: 'AIZEN20',
      };

      const result = await service.create(dtoWithPromo);

      expect(mockPromoCodesService.applyCode).toHaveBeenCalledWith('AIZEN20', 'course-123', 'individual');
      expect(result.discountAmount).toBe(200000); // 20% of 1,000,000 = 200,000
    });

    it('should throw BadRequestException if applied promo code is invalid', async () => {
      // Mock course query
      const mockSingleCourse = jest.fn().mockResolvedValue({ data: mockCourse, error: null });
      const mockEqCourse = jest.fn().mockReturnValue({ single: mockSingleCourse });
      const mockSelectCourse = jest.fn().mockReturnValue({ eq: mockEqCourse });
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'courses') return { select: mockSelectCourse };
        return {};
      });

      // Mock promo code service returning invalid result
      mockPromoCodesService.applyCode.mockResolvedValue({
        valid: false,
        message: 'Mã khuyến mãi đã hết hạn',
      });

      const dtoWithPromo: CreateRegistrationDto = {
        ...mockDto,
        promoCode: 'EXPIRED',
      };

      await expect(service.create(dtoWithPromo)).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────
  // createGroup
  // ─────────────────────────────────────────────

  describe('createGroup', () => {
    const mockCourse = {
      id: 'course-123',
      title: 'Khóa học AI Pro',
      status: 'upcoming',
      price: 1000000,
      price_group: 800000,
    };

    const groupDto = {
      course_id: 'course-123',
      referral: 'Google',
      members: [
        { full_name: 'Nguyen A', phone: '0901111111', email: 'a@gmail.com' },
        { full_name: 'Nguyen B', phone: '0902222222', email: 'b@gmail.com' },
      ],
    };

    it('should throw BadRequestException if 2 members have same email', async () => {
      // Mock course query
      const mockSingleCourse = jest.fn().mockResolvedValue({ data: mockCourse, error: null });
      const mockEqCourse = jest.fn().mockReturnValue({ single: mockSingleCourse });
      const mockSelectCourse = jest.fn().mockReturnValue({ eq: mockEqCourse });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelectCourse });

      const dupeDto = {
        ...groupDto,
        members: [
          { full_name: 'A', phone: '0901', email: 'same@gmail.com' },
          { full_name: 'B', phone: '0902', email: 'same@gmail.com' },
        ],
      };

      await expect(service.createGroup(dupeDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if course does not exist', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('nf') });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(service.createGroup(groupDto)).rejects.toThrow(NotFoundException);
    });

    it('should register group successfully without promo code', async () => {
      const mockSingleCourse = jest.fn().mockResolvedValue({ data: mockCourse, error: null });
      const mockEqCourse = jest.fn().mockReturnValue({ single: mockSingleCourse });
      const mockSelectCourse = jest.fn().mockReturnValue({ eq: mockEqCourse });

      const mockRegData = [
        { id: 'reg-1', created_at: '2026-07-01T00:00:00Z' },
        { id: 'reg-2', created_at: '2026-07-01T00:00:00Z' },
      ];
      const mockSelectReg = jest.fn().mockResolvedValue({ data: mockRegData, error: null });
      const mockInsertReg = jest.fn().mockReturnValue({ select: mockSelectReg });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'courses') return { select: mockSelectCourse };
        if (table === 'registrations') return { insert: mockInsertReg };
        return {};
      });

      global.fetch = jest.fn().mockResolvedValue({ ok: true, text: jest.fn().mockResolvedValue('ok') });

      const result = await service.createGroup(groupDto);

      expect(result.count).toBe(2);
      expect(result.discountAmount).toBe(0);
      expect(mockPromoCodesService.applyCode).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when DB insert fails', async () => {
      const mockSingleCourse = jest.fn().mockResolvedValue({ data: mockCourse, error: null });
      const mockEqCourse = jest.fn().mockReturnValue({ single: mockSingleCourse });
      const mockSelectCourse = jest.fn().mockReturnValue({ eq: mockEqCourse });

      const mockSelectReg = jest.fn().mockResolvedValue({ data: null, error: new Error('db error') });
      const mockInsertReg = jest.fn().mockReturnValue({ select: mockSelectReg });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'courses') return { select: mockSelectCourse };
        if (table === 'registrations') return { insert: mockInsertReg };
        return {};
      });

      await expect(service.createGroup(groupDto)).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────
  // findAll (Admin)
  // ─────────────────────────────────────────────

  describe('findAll', () => {
    function createQueryBuilderMock(finalResult: { data: unknown; error: unknown; count?: number }) {
      const builder: Record<string, jest.Mock> = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockReturnValue(builder);
      builder.range = jest.fn().mockReturnValue(builder);
      builder.or = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      (builder as any).then = (resolve: (v: unknown) => unknown) => resolve(finalResult);
      return builder;
    }

    it('should return paginated registrations', async () => {
      const mockData = [{ id: 'reg-1', full_name: 'Test' }];
      const builder = createQueryBuilderMock({ data: mockData, error: null, count: 50 });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(50);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(3);
    });

    it('should apply search filter when provided', async () => {
      const builder = createQueryBuilderMock({ data: [], error: null, count: 0 });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      await service.findAll({ page: 1, limit: 20, search: 'Nguyen' });

      expect(builder.or).toHaveBeenCalledWith(
        expect.stringContaining('Nguyen'),
      );
    });

    it('should apply courseId filter when provided', async () => {
      const builder = createQueryBuilderMock({ data: [], error: null, count: 0 });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      await service.findAll({ page: 1, limit: 20, courseId: 'course-123' });

      expect(builder.eq).toHaveBeenCalledWith('course_id', 'course-123');
    });

    it('should throw BadRequestException on query error', async () => {
      const builder = createQueryBuilderMock({ data: null, error: new Error('db error'), count: undefined });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      await expect(service.findAll({ page: 1, limit: 20 })).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────
  // getStats (Admin)
  // ─────────────────────────────────────────────

  describe('getStats', () => {
    it('should return stats from RPC', async () => {
      const mockStats = { total: 100, today: 5, byCourse: [] };
      (mockSupabase as unknown as { rpc: jest.Mock }).rpc = jest.fn().mockResolvedValue({
        data: mockStats,
        error: null,
      });

      const result = await service.getStats();

      expect(result).toEqual(mockStats);
    });

    it('should throw BadRequestException when RPC fails', async () => {
      (mockSupabase as unknown as { rpc: jest.Mock }).rpc = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('rpc failed'),
      });

      await expect(service.getStats()).rejects.toThrow(BadRequestException);
    });
  });
});
