import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import { ReviewsService } from './reviews.service';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let mockSupabase: jest.Mocked<SupabaseClient>;

  const mockUser: JwtPayload = { sub: 'user-1', email: 'user@test.com' };

  beforeEach(async () => {
    mockSupabase = {
      from: jest.fn(),
    } as unknown as jest.Mocked<SupabaseClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: SUPABASE_CLIENT, useValue: mockSupabase },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findByCourse ──────────────────────────────────────────────────────────

  describe('findByCourse', () => {
    it('should return reviews for a course', async () => {
      const mockData = [
        { id: 'r-1', rating: 5, content: 'Great', created_at: '2026-01-01' },
      ];

      const builder: Record<string, jest.Mock> = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockResolvedValue({ data: mockData, error: null });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      const result = await service.findByCourse('course-1');

      expect(result).toEqual(mockData);
      expect(builder.eq).toHaveBeenCalledWith('course_id', 'course-1');
    });

    it('should return empty array when no reviews exist', async () => {
      const builder: Record<string, jest.Mock> = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockResolvedValue({ data: null, error: null });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      const result = await service.findByCourse('course-1');

      expect(result).toEqual([]);
    });

    it('should throw when query fails', async () => {
      const builder: Record<string, jest.Mock> = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockResolvedValue({ data: null, error: new Error('db error') });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      await expect(service.findByCourse('course-1')).rejects.toThrow();
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    const reviewDto = { courseId: 'course-1', rating: 5, content: 'Excellent!' };

    function setupCreateMocks(options: {
      courseExists: boolean;
      hasEnrollment: boolean;
      enrollmentStatus?: string;
      alreadyReviewed?: boolean;
      insertResult?: { data: unknown; error: unknown };
    }) {
      // Course check
      const mockCourseSingle = jest.fn().mockResolvedValue({
        data: options.courseExists ? { id: 'course-1' } : null,
        error: options.courseExists ? null : new Error('nf'),
      });
      const mockCourseEq = jest.fn().mockReturnValue({ single: mockCourseSingle });
      const mockCourseSelect = jest.fn().mockReturnValue({ eq: mockCourseEq });

      // Enrollment check
      const mockEnrollMaybeSingle = jest.fn().mockResolvedValue({
        data: options.hasEnrollment
          ? { id: 'e-1', status: options.enrollmentStatus ?? 'completed' }
          : null,
        error: null,
      });
      const mockEnrollEq2 = jest.fn().mockReturnValue({ maybeSingle: mockEnrollMaybeSingle });
      const mockEnrollEq1 = jest.fn().mockReturnValue({ eq: mockEnrollEq2 });
      const mockEnrollSelect = jest.fn().mockReturnValue({ eq: mockEnrollEq1 });

      // Review existence check
      const mockReviewMaybeSingle = jest.fn().mockResolvedValue({
        data: options.alreadyReviewed ? { id: 'r-existing' } : null,
        error: null,
      });
      const mockReviewEq2 = jest.fn().mockReturnValue({ maybeSingle: mockReviewMaybeSingle });
      const mockReviewEq1 = jest.fn().mockReturnValue({ eq: mockReviewEq2 });
      const mockReviewSelect = jest.fn().mockReturnValue({ eq: mockReviewEq1 });

      // Insert review
      const insertResult = options.insertResult ?? {
        data: { id: 'r-new', rating: 5, content: 'Excellent!', created_at: '2026-01-01' },
        error: null,
      };
      const mockInsertSingle = jest.fn().mockResolvedValue(insertResult);
      const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });

      let reviewsCallCount = 0;
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'courses') return { select: mockCourseSelect };
        if (table === 'enrollments') return { select: mockEnrollSelect };
        if (table === 'reviews') {
          reviewsCallCount++;
          if (reviewsCallCount === 1) return { select: mockReviewSelect };
          return { insert: mockInsert };
        }
        return {};
      });
    }

    it('should throw NotFoundException if course does not exist', async () => {
      setupCreateMocks({ courseExists: false, hasEnrollment: false });

      await expect(service.create(reviewDto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user not enrolled', async () => {
      setupCreateMocks({ courseExists: true, hasEnrollment: false });

      await expect(service.create(reviewDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if enrollment not completed', async () => {
      setupCreateMocks({
        courseExists: true,
        hasEnrollment: true,
        enrollmentStatus: 'upcoming',
      });

      await expect(service.create(reviewDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already reviewed', async () => {
      setupCreateMocks({
        courseExists: true,
        hasEnrollment: true,
        enrollmentStatus: 'completed',
        alreadyReviewed: true,
      });

      await expect(service.create(reviewDto, mockUser)).rejects.toThrow(ConflictException);
    });

    it('should create review successfully', async () => {
      setupCreateMocks({
        courseExists: true,
        hasEnrollment: true,
        enrollmentStatus: 'completed',
        alreadyReviewed: false,
      });

      const result = await service.create(reviewDto, mockUser);

      expect(result).toBeDefined();
      expect(result['id']).toBe('r-new');
      expect(result['rating']).toBe(5);
    });

    it('should throw when insert fails', async () => {
      setupCreateMocks({
        courseExists: true,
        hasEnrollment: true,
        enrollmentStatus: 'completed',
        alreadyReviewed: false,
        insertResult: { data: null, error: new Error('insert failed') },
      });

      await expect(service.create(reviewDto, mockUser)).rejects.toThrow();
    });
  });
});
