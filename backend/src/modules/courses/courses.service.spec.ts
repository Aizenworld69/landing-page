import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { CoursesRepository } from './courses.repository';
import type { Course, CourseModule } from './entities/course.entity';
import type { CourseModuleItemDto } from './dto/update-modules.dto';

// ── Stub factory ──────────────────────────────────────────────────────────────

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'course-1',
    title: 'Khoa AI Co Ban',
    slug: 'ai-co-ban',
    description: 'Mo ta khoa hoc',
    thumbnail_url: null,
    status: 'upcoming',
    category: 'AI',
    start_date: '2030-01-01',
    price: 2000000,
    price_group: 1500000,
    instructor_id: 'inst-1',
    skills: [],
    curriculum_headline: null,
    qr_early_bird: null,
    qr_individual: null,
    qr_group_2: null,
    qr_group_4: null,
    plans_config: null,
    qr_early_bird_promo: null,
    qr_individual_promo: null,
    qr_group_2_promo: null,
    qr_group_4_promo: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  } as unknown as Course;
}

function makeCourseModule(overrides: Partial<CourseModule> = {}): CourseModule {
  return {
    id: 'module-1',
    course_id: 'course-1',
    title: 'Module 1',
    subtitle: null,
    description: null,
    duration_minutes: 60,
    order_index: 0,
    start_time: null,
    item_type: 'lesson',
    ...overrides,
  } as unknown as CourseModule;
}

// ── Mock repo factory ─────────────────────────────────────────────────────────

function createMockRepo(): jest.Mocked<CoursesRepository> {
  return {
    findAll: jest.fn(),
    findBySlug: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    uploadThumbnail: jest.fn(),
    updateModules: jest.fn(),
    findModulesByCourseId: jest.fn(),
    syncCompletedStatuses: jest.fn(),
  } as unknown as jest.Mocked<CoursesRepository>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CoursesService', () => {
  let service: CoursesService;
  let repo: jest.Mocked<CoursesRepository>;

  beforeEach(async () => {
    repo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: CoursesRepository, useValue: repo },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return items with pagination metadata', async () => {
      const courses = [makeCourse(), makeCourse({ id: 'course-2', slug: 'ai-nang-cao' })];
      repo.findAll.mockResolvedValue({ data: courses, total: 2 });

      const result = await service.findAll({ page: 1, limit: 9 });

      expect(result.items).toEqual(courses);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(9);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should calculate totalPages correctly for multiple pages', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 25 });

      const result = await service.findAll({ page: 1, limit: 9 });

      expect(result.pagination.totalPages).toBe(3); // ceil(25/9)
    });

    it('should use default page=1 and limit=9 when not provided', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      const result = await service.findAll({});

      expect(repo.findAll).toHaveBeenCalledWith({});
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(9);
    });

    it('should propagate repository errors', async () => {
      repo.findAll.mockRejectedValue(new Error('db error'));

      await expect(service.findAll({})).rejects.toThrow('db error');
    });
  });

  // ─── findBySlug ────────────────────────────────────────────────────────────

  describe('findBySlug', () => {
    it('should return course when slug is found', async () => {
      const course = makeCourse();
      repo.findBySlug.mockResolvedValue(course as any);

      const result = await service.findBySlug('ai-co-ban');

      expect(result).toEqual(course);
      expect(repo.findBySlug).toHaveBeenCalledWith('ai-co-ban');
    });

    it('should throw NotFoundException when slug not found', async () => {
      repo.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('khong-ton-tai')).rejects.toThrow(NotFoundException);
    });

    it('should include slug in NotFoundException message', async () => {
      repo.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('my-slug')).rejects.toThrow(
        'Course with slug "my-slug" not found',
      );
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should delegate to repository and return created course', async () => {
      const dto = {
        title: 'Khoa Moi',
        slug: 'khoa-moi',
        description: 'Mo ta',
        status: 'upcoming' as const,
        category: 'AI',
        price: 1000000,
        price_group: 800000,
        instructor_id: 'inst-1',
      };
      const created = makeCourse({ title: 'Khoa Moi', slug: 'khoa-moi' });
      repo.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });

    it('should propagate repository errors on create', async () => {
      repo.create.mockRejectedValue(new Error('duplicate slug'));

      await expect(
        service.create({ title: 'T', slug: 's', description: '', status: 'upcoming', category: 'AI', price: 0, price_group: 0, instructor_id: 'i' }),
      ).rejects.toThrow('duplicate slug');
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.update('course-999', { title: 'New Title' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update and return updated course when exists', async () => {
      const existing = makeCourse();
      const updated = makeCourse({ title: 'Updated Title' });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue(updated);

      const result = await service.update('course-1', { title: 'Updated Title' });

      expect(repo.findById).toHaveBeenCalledWith('course-1');
      expect(repo.update).toHaveBeenCalledWith('course-1', { title: 'Updated Title' });
      expect(result).toEqual(updated);
    });
  });

  // ─── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.delete('course-999')).rejects.toThrow(NotFoundException);
    });

    it('should delete and return deleted course when exists', async () => {
      const existing = makeCourse();
      repo.findById.mockResolvedValue(existing);
      repo.delete.mockResolvedValue(existing);

      const result = await service.delete('course-1');

      expect(repo.delete).toHaveBeenCalledWith('course-1');
      expect(result).toEqual(existing);
    });
  });

  // ─── uploadThumbnail ───────────────────────────────────────────────────────

  describe('uploadThumbnail', () => {
    it('should return public URL from repository', async () => {
      const mockFile = {
        originalname: 'thumb.jpg',
        buffer: Buffer.from('data'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      repo.uploadThumbnail.mockResolvedValue('https://cdn.example.com/thumb.jpg');

      const url = await service.uploadThumbnail(mockFile);

      expect(url).toBe('https://cdn.example.com/thumb.jpg');
      expect(repo.uploadThumbnail).toHaveBeenCalledWith(mockFile);
    });
  });

  // ─── updateModules ─────────────────────────────────────────────────────────

  describe('updateModules', () => {
    const moduleItems: CourseModuleItemDto[] = [
      { title: 'Buoi 1', duration_minutes: 90, item_type: 'module' },
    ];

    it('should throw NotFoundException if course does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.updateModules('course-999', moduleItems)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should call repo.updateModules when course exists', async () => {
      repo.findById.mockResolvedValue(makeCourse());
      repo.updateModules.mockResolvedValue(undefined);

      await service.updateModules('course-1', moduleItems);

      expect(repo.updateModules).toHaveBeenCalledWith('course-1', moduleItems);
    });
  });

  // ─── findModulesByCourseId ─────────────────────────────────────────────────

  describe('findModulesByCourseId', () => {
    it('should throw NotFoundException if course does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findModulesByCourseId('course-999')).rejects.toThrow(NotFoundException);
    });

    it('should return modules for existing course', async () => {
      const modules = [makeCourseModule(), makeCourseModule({ id: 'module-2', order_index: 1 })];
      repo.findById.mockResolvedValue(makeCourse());
      repo.findModulesByCourseId.mockResolvedValue(modules);

      const result = await service.findModulesByCourseId('course-1');

      expect(result).toEqual(modules);
      expect(repo.findModulesByCourseId).toHaveBeenCalledWith('course-1');
    });
  });

  // ─── syncCompletedStatuses ─────────────────────────────────────────────────

  describe('syncCompletedStatuses', () => {
    it('should return updatedCount from repository', async () => {
      repo.syncCompletedStatuses.mockResolvedValue(5);

      const result = await service.syncCompletedStatuses();

      expect(result).toEqual({ updatedCount: 5 });
      expect(repo.syncCompletedStatuses).toHaveBeenCalled();
    });

    it('should return zero when no records updated', async () => {
      repo.syncCompletedStatuses.mockResolvedValue(0);

      const result = await service.syncCompletedStatuses();

      expect(result).toEqual({ updatedCount: 0 });
    });
  });
});
