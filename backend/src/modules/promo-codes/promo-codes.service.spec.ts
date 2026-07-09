import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import { PromoCodesService } from './promo-codes.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';

describe('PromoCodesService', () => {
  let service: PromoCodesService;
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(async () => {
    const fromMock = jest.fn();
    mockSupabase = {
      from: fromMock,
      rpc: jest.fn(),
    } as unknown as jest.Mocked<SupabaseClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoCodesService,
        {
          provide: SUPABASE_CLIENT,
          useValue: mockSupabase,
        },
      ],
    }).compile();

    service = module.get<PromoCodesService>(PromoCodesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────
  // adminFindAll
  // ─────────────────────────────────────────────
  // Supabase query builder thật vừa "chainable" (mọi method trả về chính nó)
  // vừa "thenable" (await được ở bất kỳ điểm nào trong chain). Helper dưới đây
  // mô phỏng đúng hành vi đó để test không phụ thuộc thứ tự gọi .eq()/.range().
  function createQueryBuilderMock(finalResult: { data: any; error: any; count?: any }) {
    const builder: any = {};
    builder.select = jest.fn().mockReturnValue(builder);
    builder.order = jest.fn().mockReturnValue(builder);
    builder.range = jest.fn().mockReturnValue(builder);
    builder.eq = jest.fn().mockReturnValue(builder);
    builder.ilike = jest.fn().mockReturnValue(builder);
    builder.then = (resolve: (v: any) => any) => resolve(finalResult);
    return builder;
  }

  describe('adminFindAll', () => {
    it('should return paginated list with total and totalPages', async () => {
      const mockData = [{ id: 'promo-1', code: 'AIZEN10' }];
      const builder = createQueryBuilderMock({ data: mockData, error: null, count: 25 });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      const result = await service.adminFindAll({ page: 2, limit: 10 });

      expect(builder.range).toHaveBeenCalledWith(10, 19);
      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });

    it('should filter by course_id when provided', async () => {
      const builder = createQueryBuilderMock({ data: [], error: null, count: 0 });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      await service.adminFindAll({ page: 1, limit: 10, course_id: 'course-123' });

      expect(builder.eq).toHaveBeenCalledWith('course_id', 'course-123');
    });

    it('should search by code (uppercased, trimmed) when provided', async () => {
      const builder = createQueryBuilderMock({ data: [], error: null, count: 0 });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      await service.adminFindAll({ page: 1, limit: 10, search: '  aizen10  ' });

      expect(builder.ilike).toHaveBeenCalledWith('code', '%AIZEN10%');
    });

    it('should throw BadRequestException when query fails', async () => {
      const builder = createQueryBuilderMock({ data: null, error: new Error('db down'), count: null });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      await expect(service.adminFindAll({ page: 1, limit: 10 })).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────
  // adminCreate
  // ─────────────────────────────────────────────
  describe('adminCreate', () => {
    const mockDto: CreatePromoCodeDto = {
      code: 'AIZEN50',
      course_id: 'course-123',
      plan: 'all',
      discount_type: 'percent',
      discount_value: 50,
      max_uses: 10,
      note: 'Test discount',
    };

    it('should throw ConflictException if promo code already exists', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: 'existing-id' }, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(service.adminCreate(mockDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if course does not exist', async () => {
      const mockMaybeSingleCode = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEqCode = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingleCode });
      const mockSelectCode = jest.fn().mockReturnValue({ eq: mockEqCode });

      const mockMaybeSingleCourse = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEqCourse = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingleCourse });
      const mockSelectCourse = jest.fn().mockReturnValue({ eq: mockEqCourse });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'promo_codes') return { select: mockSelectCode };
        if (table === 'courses') return { select: mockSelectCourse };
        return {};
      });

      await expect(service.adminCreate(mockDto)).rejects.toThrow(NotFoundException);
    });

    it('should create promo code successfully and return inserted data', async () => {
      // 1. code chưa tồn tại
      const mockMaybeSingleCode = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEqCode = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingleCode });
      const mockSelectCode = jest.fn().mockReturnValue({ eq: mockEqCode });

      // 2. course tồn tại
      const mockMaybeSingleCourse = jest
        .fn()
        .mockResolvedValue({ data: { id: 'course-123', title: 'Khóa AI' }, error: null });
      const mockEqCourse = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingleCourse });
      const mockSelectCourse = jest.fn().mockReturnValue({ eq: mockEqCourse });

      // 3. insert thành công
      const mockCreated = { id: 'promo-new', code: 'AIZEN50', used_count: 0, is_active: true };
      const mockSingleInsert = jest.fn().mockResolvedValue({ data: mockCreated, error: null });
      const mockSelectInsert = jest.fn().mockReturnValue({ single: mockSingleInsert });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelectInsert });

      let promoCodesCallCount = 0;
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'promo_codes') {
          promoCodesCallCount += 1;
          // Lần gọi đầu (check tồn tại) dùng select, lần sau (insert) dùng insert
          if (promoCodesCallCount === 1) return { select: mockSelectCode };
          return { insert: mockInsert };
        }
        if (table === 'courses') return { select: mockSelectCourse };
        return {};
      });

      const result = await service.adminCreate(mockDto);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'AIZEN50',
          course_id: 'course-123',
          is_active: true,
          used_count: 0,
        }),
      );
      expect(result).toEqual(mockCreated);
    });

    it('should throw BadRequestException when insert fails', async () => {
      const mockMaybeSingleCode = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEqCode = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingleCode });
      const mockSelectCode = jest.fn().mockReturnValue({ eq: mockEqCode });

      const mockMaybeSingleCourse = jest
        .fn()
        .mockResolvedValue({ data: { id: 'course-123' }, error: null });
      const mockEqCourse = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingleCourse });
      const mockSelectCourse = jest.fn().mockReturnValue({ eq: mockEqCourse });

      const mockSingleInsert = jest.fn().mockResolvedValue({ data: null, error: new Error('insert failed') });
      const mockSelectInsert = jest.fn().mockReturnValue({ single: mockSingleInsert });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelectInsert });

      let promoCodesCallCount = 0;
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'promo_codes') {
          promoCodesCallCount += 1;
          if (promoCodesCallCount === 1) return { select: mockSelectCode };
          return { insert: mockInsert };
        }
        if (table === 'courses') return { select: mockSelectCourse };
        return {};
      });

      await expect(service.adminCreate(mockDto)).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────
  // adminUpdate
  // ─────────────────────────────────────────────
  describe('adminUpdate', () => {
    const updateDto: UpdatePromoCodeDto = { discount_value: 30, is_active: false };

    it('should throw NotFoundException if promo code does not exist', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(service.adminUpdate('promo-1', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if new course_id does not exist', async () => {
      const mockMaybeSingleExisting = jest.fn().mockResolvedValue({ data: { id: 'promo-1' }, error: null });
      const mockEqExisting = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingleExisting });
      const mockSelectExisting = jest.fn().mockReturnValue({ eq: mockEqExisting });

      const mockMaybeSingleCourse = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEqCourse = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingleCourse });
      const mockSelectCourse = jest.fn().mockReturnValue({ eq: mockEqCourse });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'promo_codes') return { select: mockSelectExisting };
        if (table === 'courses') return { select: mockSelectCourse };
        return {};
      });

      await expect(
        service.adminUpdate('promo-1', { ...updateDto, course_id: 'course-999' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update promo code successfully and return updated data', async () => {
      const mockMaybeSingleExisting = jest.fn().mockResolvedValue({ data: { id: 'promo-1' }, error: null });
      const mockEqExisting = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingleExisting });
      const mockSelectExisting = jest.fn().mockReturnValue({ eq: mockEqExisting });

      const mockUpdated = { id: 'promo-1', discount_value: 30, is_active: false };
      const mockSingleUpdate = jest.fn().mockResolvedValue({ data: mockUpdated, error: null });
      const mockSelectUpdate = jest.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUpdate = jest.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEqUpdate });

      let promoCodesCallCount = 0;
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'promo_codes') {
          promoCodesCallCount += 1;
          if (promoCodesCallCount === 1) return { select: mockSelectExisting };
          return { update: mockUpdate };
        }
        return {};
      });

      const result = await service.adminUpdate('promo-1', updateDto);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ discount_value: 30, is_active: false }),
      );
      expect(result).toEqual(mockUpdated);
    });

    it('should throw BadRequestException when update query fails', async () => {
      const mockMaybeSingleExisting = jest.fn().mockResolvedValue({ data: { id: 'promo-1' }, error: null });
      const mockEqExisting = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingleExisting });
      const mockSelectExisting = jest.fn().mockReturnValue({ eq: mockEqExisting });

      const mockSingleUpdate = jest.fn().mockResolvedValue({ data: null, error: new Error('update failed') });
      const mockSelectUpdate = jest.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUpdate = jest.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEqUpdate });

      let promoCodesCallCount = 0;
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'promo_codes') {
          promoCodesCallCount += 1;
          if (promoCodesCallCount === 1) return { select: mockSelectExisting };
          return { update: mockUpdate };
        }
        return {};
      });

      await expect(service.adminUpdate('promo-1', updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────
  // adminDelete
  // ─────────────────────────────────────────────
  describe('adminDelete', () => {
    it('should throw NotFoundException if promo code does not exist', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(service.adminDelete('promo-1')).rejects.toThrow(NotFoundException);
    });

    it('should delete promo code successfully', async () => {
      const mockMaybeSingle = jest
        .fn()
        .mockResolvedValue({ data: { id: 'promo-1', used_count: 0 }, error: null });
      const mockEqSelect = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqSelect });

      const mockEqDelete = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEqDelete });

      let promoCodesCallCount = 0;
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'promo_codes') {
          promoCodesCallCount += 1;
          if (promoCodesCallCount === 1) return { select: mockSelect };
          return { delete: mockDelete };
        }
        return {};
      });

      const result = await service.adminDelete('promo-1');

      expect(mockDelete).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Đã xóa mã khuyến mãi' });
    });

    it('should throw BadRequestException when delete query fails', async () => {
      const mockMaybeSingle = jest
        .fn()
        .mockResolvedValue({ data: { id: 'promo-1', used_count: 0 }, error: null });
      const mockEqSelect = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqSelect });

      const mockEqDelete = jest.fn().mockResolvedValue({ error: new Error('delete failed') });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEqDelete });

      let promoCodesCallCount = 0;
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'promo_codes') {
          promoCodesCallCount += 1;
          if (promoCodesCallCount === 1) return { select: mockSelect };
          return { delete: mockDelete };
        }
        return {};
      });

      await expect(service.adminDelete('promo-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────
  // validate (preview validation — không tăng used_count)
  // ─────────────────────────────────────────────
  describe('validate (preview validation)', () => {
    const mockPromo = {
      id: 'promo-123',
      code: 'AIZEN50',
      course_id: 'course-123',
      plan: 'individual',
      discount_type: 'percent',
      discount_value: 50,
      max_uses: 10,
      used_count: 2,
      expires_at: null,
      is_active: true,
    };

    const mockLookup = (data: any, error: any = null) => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data, error });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });
    };

    it('should return valid if code is applicable', async () => {
      mockLookup(mockPromo);

      const result = await service.validate('AIZEN50', 'course-123', 'individual');

      expect(result.valid).toBe(true);
      expect(result.discount_type).toBe('percent');
      expect(result.discount_value).toBe(50);
      expect(result.promo_code_id).toBe('promo-123');
    });

    it('should return invalid if plan does not match', async () => {
      mockLookup(mockPromo);

      const result = await service.validate('AIZEN50', 'course-123', 'group_2');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('chỉ áp dụng cho đăng ký cá nhân');
    });

    it('should return invalid if code is expired', async () => {
      const expiredPromo = { ...mockPromo, expires_at: '2020-01-01T00:00:00Z' };
      mockLookup(expiredPromo);

      const result = await service.validate('AIZEN50', 'course-123', 'individual');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('đã hết hạn');
    });

    it('should return invalid if limit reached', async () => {
      const maxedPromo = { ...mockPromo, used_count: 10, max_uses: 10 };
      mockLookup(maxedPromo);

      const result = await service.validate('AIZEN50', 'course-123', 'individual');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('hết lượt sử dụng');
    });

    it('should return invalid if code does not exist', async () => {
      mockLookup(null);

      const result = await service.validate('KHONGTONTAI', 'course-123', 'individual');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Mã khuyến mãi không tồn tại');
    });

    it('should return invalid if code is deactivated', async () => {
      const inactivePromo = { ...mockPromo, is_active: false };
      mockLookup(inactivePromo);

      const result = await service.validate('AIZEN50', 'course-123', 'individual');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Mã khuyến mãi đã bị vô hiệu hóa');
    });

    it('should return invalid if code does not apply to this course', async () => {
      mockLookup(mockPromo);

      const result = await service.validate('AIZEN50', 'course-OTHER', 'individual');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Mã không áp dụng cho khóa học này');
    });

    it('should return generic error message on DB failure', async () => {
      mockLookup(null, new Error('connection lost'));

      const result = await service.validate('AIZEN50', 'course-123', 'individual');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Có lỗi xảy ra, vui lòng thử lại sau');
    });

    it('should format message correctly for fixed discount type', async () => {
      const fixedPromo = { ...mockPromo, discount_type: 'fixed', discount_value: 100000 };
      mockLookup(fixedPromo);

      const result = await service.validate('AIZEN50', 'course-123', 'individual');

      expect(result.valid).toBe(true);
      expect(result.discount_type).toBe('fixed');
      expect(result.message).toBe('Giảm 100.000đ học phí');
    });

    it('should uppercase and trim the code before lookup', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockPromo, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await service.validate('  aizen50  ', 'course-123', 'individual');

      expect(mockEq).toHaveBeenCalledWith('code', 'AIZEN50');
    });
  });

  // ─────────────────────────────────────────────
  // applyCode (validate + tăng used_count qua RPC)
  // ─────────────────────────────────────────────
  describe('applyCode', () => {
    const mockPromo = {
      id: 'promo-123',
      code: 'AIZEN50',
      course_id: 'course-123',
      plan: 'individual',
      discount_type: 'percent',
      discount_value: 50,
      max_uses: 10,
      used_count: 2,
      expires_at: null,
      is_active: true,
    };

    const mockLookup = (data: any, error: any = null) => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data, error });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });
    };

    it('should call increment RPC and return valid result when code is applicable', async () => {
      mockLookup(mockPromo);
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

      const result = await service.applyCode('AIZEN50', 'course-123', 'individual');

      expect(result.valid).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_promo_used_count', {
        p_id: 'promo-123',
      });
    });

    it('should NOT call increment RPC when code is invalid', async () => {
      mockLookup(null); // mã không tồn tại

      const result = await service.applyCode('KHONGTONTAI', 'course-123', 'individual');

      expect(result.valid).toBe(false);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('should NOT call increment RPC when limit is already reached', async () => {
      const maxedPromo = { ...mockPromo, used_count: 10, max_uses: 10 };
      mockLookup(maxedPromo);

      const result = await service.applyCode('AIZEN50', 'course-123', 'individual');

      expect(result.valid).toBe(false);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('should still return valid result even if RPC increment fails (logs warning only)', async () => {
      mockLookup(mockPromo);
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'race condition: max_uses exceeded' },
      });

      const result = await service.applyCode('AIZEN50', 'course-123', 'individual');

      // Không throw, service vẫn trả về kết quả hợp lệ đã tính được trước đó
      expect(result.valid).toBe(true);
      expect(result.promo_code_id).toBe('promo-123');
    });
  });
});
