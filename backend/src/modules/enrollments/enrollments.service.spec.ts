import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import { EnrollmentsService } from './enrollments.service';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let mockSupabase: jest.Mocked<SupabaseClient>;

  const mockUser: JwtPayload = { sub: 'user-1', email: 'user@test.com' };

  beforeEach(async () => {
    mockSupabase = {
      from: jest.fn(),
    } as unknown as jest.Mocked<SupabaseClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: SUPABASE_CLIENT, useValue: mockSupabase },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getMyEnrollments ──────────────────────────────────────────────────────

  describe('getMyEnrollments', () => {
    it('should return list of user enrollments', async () => {
      const mockData = [
        { id: 'e-1', status: 'upcoming', courses: { title: 'Course A' } },
      ];

      const builder: Record<string, jest.Mock> = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockResolvedValue({ data: mockData, error: null });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      const result = await service.getMyEnrollments(mockUser);

      expect(result).toEqual(mockData);
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should return empty array when no enrollments', async () => {
      const builder: Record<string, jest.Mock> = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockResolvedValue({ data: null, error: null });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      const result = await service.getMyEnrollments(mockUser);

      expect(result).toEqual([]);
    });

    it('should throw when supabase query fails', async () => {
      const builder: Record<string, jest.Mock> = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockResolvedValue({ data: null, error: new Error('db error') });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      await expect(service.getMyEnrollments(mockUser)).rejects.toThrow();
    });
  });

  // ─── enroll ────────────────────────────────────────────────────────────────

  describe('enroll', () => {
    const enrollDto = { courseId: 'course-1' };

    function setupEnrollMocks(options: {
      courseExists: boolean;
      alreadyEnrolled: boolean;
      insertResult?: { data: unknown; error: unknown };
    }) {
      // Course check
      const mockCourseSingle = jest.fn().mockResolvedValue({
        data: options.courseExists ? { id: 'course-1', title: 'Test' } : null,
        error: options.courseExists ? null : new Error('not found'),
      });
      const mockCourseEq = jest.fn().mockReturnValue({ single: mockCourseSingle });
      const mockCourseSelect = jest.fn().mockReturnValue({ eq: mockCourseEq });

      // Enrollment existence check
      const mockEnrollMaybeSingle = jest.fn().mockResolvedValue({
        data: options.alreadyEnrolled ? { id: 'existing-e' } : null,
        error: null,
      });
      const mockEnrollEq2 = jest.fn().mockReturnValue({ maybeSingle: mockEnrollMaybeSingle });
      const mockEnrollEq1 = jest.fn().mockReturnValue({ eq: mockEnrollEq2 });
      const mockEnrollSelect = jest.fn().mockReturnValue({ eq: mockEnrollEq1 });

      // Insert
      const insertResult = options.insertResult ?? {
        data: { id: 'e-new', status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
        error: null,
      };
      const mockInsertSingle = jest.fn().mockResolvedValue(insertResult);
      const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });

      let enrollCallCount = 0;
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'courses') return { select: mockCourseSelect };
        if (table === 'enrollments') {
          enrollCallCount++;
          if (enrollCallCount === 1) return { select: mockEnrollSelect };
          return { insert: mockInsert };
        }
        return {};
      });
    }

    it('should throw NotFoundException if course does not exist', async () => {
      setupEnrollMocks({ courseExists: false, alreadyEnrolled: false });

      await expect(service.enroll(enrollDto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if already enrolled', async () => {
      setupEnrollMocks({ courseExists: true, alreadyEnrolled: true });

      await expect(service.enroll(enrollDto, mockUser)).rejects.toThrow(ConflictException);
    });

    it('should enroll successfully and return enrollment data', async () => {
      setupEnrollMocks({ courseExists: true, alreadyEnrolled: false });

      const result = await service.enroll(enrollDto, mockUser);

      expect(result).toBeDefined();
      expect(result['id']).toBe('e-new');
    });

    it('should throw when insert fails', async () => {
      setupEnrollMocks({
        courseExists: true,
        alreadyEnrolled: false,
        insertResult: { data: null, error: new Error('insert failed') },
      });

      await expect(service.enroll(enrollDto, mockUser)).rejects.toThrow();
    });
  });

  // ─── getCertificate ────────────────────────────────────────────────────────

  describe('getCertificate', () => {
    it('should throw NotFoundException if enrollment not found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('nf') });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(service.getCertificate('e-999', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if course not completed yet', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'e-1', status: 'upcoming', completed_at: null, courses: { title: 'Test' } },
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(service.getCertificate('e-1', mockUser)).rejects.toThrow(ConflictException);
    });

    it('should return certificate metadata for completed enrollment', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'e-1',
          status: 'completed',
          completed_at: '2026-06-01T00:00:00Z',
          courses: { title: 'AI Pro' },
        },
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await service.getCertificate('e-1', mockUser);

      expect(result.enrollmentId).toBe('e-1');
      expect(result.courseTitle).toBe('AI Pro');
      expect(result.completedAt).toBe('2026-06-01T00:00:00Z');
      expect(result.certificateUrl).toBeNull();
    });
  });
});
