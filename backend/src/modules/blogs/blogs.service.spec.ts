import { NotFoundException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BlogsService } from './blogs.service';
import { BlogsRepository } from './blogs.repository';
import { RevalidationService } from '../../common/services/revalidation.service';
import type { Blog } from './entities/blog.entity';

function makeBlog(overrides: Partial<Blog> = {}): Blog {
  return {
    id: 'blog-1',
    title: 'Blog Test',
    slug: 'blog-test',
    excerpt: 'Excerpt',
    body_html: '<p>Content</p>',
    thumbnail_url: null,
    category: 'blog',
    author: 'Aizen',
    source_name: null,
    source_url: null,
    images: [],
    status: 'published',
    published_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  } as unknown as Blog;
}

function createMockRepo(): jest.Mocked<BlogsRepository> {
  return {
    findAll: jest.fn(),
    findBySlug: jest.fn(),
    findRelated: jest.fn(),
    adminFindAll: jest.fn(),
    adminFindBySlug: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    isSlugTaken: jest.fn(),
  } as unknown as jest.Mocked<BlogsRepository>;
}

function createMockRevalidation(): jest.Mocked<RevalidationService> {
  return {
    revalidate: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<RevalidationService>;
}

describe('BlogsService', () => {
  let service: BlogsService;
  let repo: jest.Mocked<BlogsRepository>;
  let revalidation: jest.Mocked<RevalidationService>;

  beforeEach(async () => {
    repo = createMockRepo();
    revalidation = createMockRevalidation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogsService,
        { provide: BlogsRepository, useValue: repo },
        { provide: RevalidationService, useValue: revalidation },
      ],
    }).compile();

    service = module.get<BlogsService>(BlogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAll (public) ──────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return items with pagination metadata', async () => {
      const blogs = [makeBlog(), makeBlog({ id: 'blog-2', slug: 'blog-2' })];
      repo.findAll.mockResolvedValue({ data: blogs, total: 2 });

      const result = await service.findAll({ page: 1, limit: 9 });

      expect(result.items).toEqual(blogs);
      expect(result.pagination).toEqual({ total: 2, page: 1, limit: 9, totalPages: 1 });
    });

    it('should calculate totalPages correctly', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 25 });

      const result = await service.findAll({ page: 1, limit: 9 });

      expect(result.pagination.totalPages).toBe(3);
    });

    it('should use default page=1, limit=9 when not provided', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      const result = await service.findAll({});

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(9);
    });
  });

  // ─── findBySlug (public) ───────────────────────────────────────────────────

  describe('findBySlug', () => {
    it('should return blog with related posts', async () => {
      const blog = makeBlog();
      const related = [makeBlog({ id: 'blog-2', slug: 'related' })];
      repo.findBySlug.mockResolvedValue(blog);
      repo.findRelated.mockResolvedValue(related);

      const result = await service.findBySlug('blog-test');

      expect(result).toEqual({ ...blog, related });
      expect(repo.findRelated).toHaveBeenCalledWith('blog-test', 'blog');
    });

    it('should throw NotFoundException when slug not found', async () => {
      repo.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('not-exist')).rejects.toThrow(NotFoundException);
    });

    it('should include slug in error message', async () => {
      repo.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('my-slug')).rejects.toThrow(
        'Blog with slug "my-slug" not found',
      );
    });
  });

  // ─── adminFindAll ──────────────────────────────────────────────────────────

  describe('adminFindAll', () => {
    it('should return all blogs with pagination (default limit=20)', async () => {
      repo.adminFindAll.mockResolvedValue({ data: [], total: 50 });

      const result = await service.adminFindAll({ page: 1, limit: 20 });

      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.totalPages).toBe(3);
    });
  });

  // ─── adminFindById ─────────────────────────────────────────────────────────

  describe('adminFindById', () => {
    it('should return blog when found', async () => {
      const blog = makeBlog();
      repo.findById.mockResolvedValue(blog);

      const result = await service.adminFindById('blog-1');

      expect(result).toEqual(blog);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.adminFindById('blog-999')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── adminCreate ───────────────────────────────────────────────────────────

  describe('adminCreate', () => {
    const createDto = {
      title: 'New Blog',
      slug: 'new-blog',
      excerpt: 'Test',
      body_html: '<p>test</p>',
      category: 'blog',
      author: 'Aizen',
      status: 'published' as const,
    };

    it('should create blog and revalidate when published', async () => {
      const created = makeBlog({ slug: 'new-blog', status: 'published' });
      repo.isSlugTaken.mockResolvedValue(false);
      repo.create.mockResolvedValue(created);

      const result = await service.adminCreate(createDto);

      expect(result).toEqual(created);
      expect(revalidation.revalidate).toHaveBeenCalledWith(['/blogs', '/blogs/new-blog']);
    });

    it('should NOT revalidate when created as draft', async () => {
      const created = makeBlog({ slug: 'new-blog', status: 'draft' });
      repo.isSlugTaken.mockResolvedValue(false);
      repo.create.mockResolvedValue(created);

      await service.adminCreate({ ...createDto, status: 'draft' as const });

      expect(revalidation.revalidate).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already taken', async () => {
      repo.isSlugTaken.mockResolvedValue(true);

      await expect(service.adminCreate(createDto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── adminUpdate ───────────────────────────────────────────────────────────

  describe('adminUpdate', () => {
    it('should throw NotFoundException when blog not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.adminUpdate('blog-999', { title: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new slug is already taken', async () => {
      repo.findById.mockResolvedValue(makeBlog());
      repo.isSlugTaken.mockResolvedValue(true);

      await expect(
        service.adminUpdate('blog-1', { slug: 'taken-slug' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should update blog and revalidate both old and new slugs', async () => {
      const existing = makeBlog({ slug: 'old-slug' });
      const updated = makeBlog({ slug: 'new-slug' });
      repo.findById.mockResolvedValue(existing);
      repo.isSlugTaken.mockResolvedValue(false);
      repo.update.mockResolvedValue(updated);

      const result = await service.adminUpdate('blog-1', { slug: 'new-slug' });

      expect(result).toEqual(updated);
      expect(revalidation.revalidate).toHaveBeenCalledWith(
        expect.arrayContaining(['/blogs', '/blogs/old-slug', '/blogs/new-slug']),
      );
    });

    it('should skip slug uniqueness check if slug unchanged', async () => {
      const existing = makeBlog({ slug: 'same-slug' });
      const updated = makeBlog({ slug: 'same-slug', title: 'Updated' });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue(updated);

      await service.adminUpdate('blog-1', { title: 'Updated' });

      expect(repo.isSlugTaken).not.toHaveBeenCalled();
    });
  });

  // ─── adminDelete ───────────────────────────────────────────────────────────

  describe('adminDelete', () => {
    it('should throw NotFoundException when blog not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.adminDelete('blog-999')).rejects.toThrow(NotFoundException);
    });

    it('should delete blog and revalidate', async () => {
      const existing = makeBlog({ slug: 'to-delete' });
      repo.findById.mockResolvedValue(existing);
      repo.delete.mockResolvedValue(undefined);

      await service.adminDelete('blog-1');

      expect(repo.delete).toHaveBeenCalledWith('blog-1');
      expect(revalidation.revalidate).toHaveBeenCalledWith(['/blogs', '/blogs/to-delete']);
    });
  });
});
