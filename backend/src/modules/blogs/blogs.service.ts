import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { BlogsRepository } from './blogs.repository';
import { RevalidationService } from '../../common/services/revalidation.service';
import type { QueryBlogDto } from './dto/query-blog.dto';
import type { CreateBlogDto } from './dto/create-blog.dto';
import type { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogsService {
  constructor(
    private readonly blogsRepo: BlogsRepository,
    private readonly revalidation: RevalidationService,
  ) {}

  // ── Public ────────────────────────────────────────────────

  async findAll(query: QueryBlogDto) {
    const { data, total } = await this.blogsRepo.findAll(query);
    const { page = 1, limit = 9 } = query;

    return {
      items: data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const blog = await this.blogsRepo.findBySlug(slug);
    if (!blog) throw new NotFoundException(`Blog with slug "${slug}" not found`);

    const related = await this.blogsRepo.findRelated(slug, blog.category);
    return { ...blog, related };
  }

  // ── Admin ─────────────────────────────────────────────────

  async adminFindAll(query: QueryBlogDto) {
    const { data, total } = await this.blogsRepo.adminFindAll(query);
    const { page = 1, limit = 20 } = query;

    return {
      items: data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adminFindById(id: string) {
    const blog = await this.blogsRepo.findById(id);
    if (!blog) throw new NotFoundException(`Blog with id "${id}" not found`);
    return blog;
  }

  async adminCreate(dto: CreateBlogDto) {
    const slugTaken = await this.blogsRepo.isSlugTaken(dto.slug);
    if (slugTaken) {
      throw new ConflictException(`Slug "${dto.slug}" already exists`);
    }
    const blog = await this.blogsRepo.create(dto);

    // Bài mới đăng cần xuất hiện ngay trên danh sách /blogs
    if (blog.status === 'published') {
      await this.revalidation.revalidate(['/blogs', `/blogs/${blog.slug}`]);
    }

    return blog;
  }

  async adminUpdate(id: string, dto: UpdateBlogDto) {
    const existing = await this.blogsRepo.findById(id);
    if (!existing) throw new NotFoundException(`Blog with id "${id}" not found`);

    if (dto.slug && dto.slug !== existing.slug) {
      const slugTaken = await this.blogsRepo.isSlugTaken(dto.slug, id);
      if (slugTaken) throw new ConflictException(`Slug "${dto.slug}" already exists`);
    }

    const updated = await this.blogsRepo.update(id, dto, existing.status);

    // Xóa cache ngay cho cả slug cũ và mới (phòng khi đổi slug),
    // và trang danh sách — để tắt/đăng bài có hiệu lực tức thì.
    const slugsToRevalidate = new Set([existing.slug, updated.slug]);
    await this.revalidation.revalidate([
      '/blogs',
      ...Array.from(slugsToRevalidate).map((s) => `/blogs/${s}`),
    ]);

    return updated;
  }

  async adminDelete(id: string) {
    const existing = await this.blogsRepo.findById(id);
    if (!existing) throw new NotFoundException(`Blog with id "${id}" not found`);
    await this.blogsRepo.delete(id);

    await this.revalidation.revalidate(['/blogs', `/blogs/${existing.slug}`]);
  }
}
