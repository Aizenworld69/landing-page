import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import type { QueryBlogDto } from './dto/query-blog.dto';
import type { CreateBlogDto } from './dto/create-blog.dto';
import type { UpdateBlogDto } from './dto/update-blog.dto';
import type { Blog } from './entities/blog.entity';

@Injectable()
export class BlogsRepository {
  private readonly logger = new Logger(BlogsRepository.name);

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
  ) {}

  // ── Public ────────────────────────────────────────────────

  async findAll(query: QueryBlogDto): Promise<{ data: Blog[]; total: number }> {
    const { category, page = 1, limit = 9 } = query;
    const offset = (page - 1) * limit;

    let builder = this.supabase
      .from('blogs')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) builder = builder.eq('category', category);

    const { data, error, count } = await builder;

    if (error) {
      this.logger.error('findAll blogs failed', error);
      throw error;
    }

    return { data: data ?? [], total: count ?? 0 };
  }

  async findBySlug(slug: string): Promise<Blog | null> {
    const { data, error } = await this.supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      this.logger.error('findBySlug failed', error);
      throw error;
    }

    return data as Blog;
  }

  async findRelated(slug: string, category: string, limitCount = 5): Promise<Blog[]> {
    const { data, error } = await this.supabase
      .from('blogs')
      .select('*')
      .eq('status', 'published')
      .eq('category', category)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      this.logger.error('findRelated failed', error);
      throw error;
    }

    return data ?? [];
  }

  // ── Admin ─────────────────────────────────────────────────

  async adminFindAll(query: QueryBlogDto): Promise<{ data: Blog[]; total: number }> {
    const { category, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    let builder = this.supabase
      .from('blogs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) builder = builder.eq('category', category);

    const { data, error, count } = await builder;

    if (error) {
      this.logger.error('adminFindAll blogs failed', error);
      throw error;
    }

    return { data: data ?? [], total: count ?? 0 };
  }

  async adminFindBySlug(slug: string): Promise<Blog | null> {
    const { data, error } = await this.supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      this.logger.error('adminFindBySlug failed', error);
      throw error;
    }

    return data as Blog;
  }

  async findById(id: string): Promise<Blog | null> {
    const { data, error } = await this.supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      this.logger.error('findById failed', error);
      throw error;
    }

    return data as Blog;
  }

  async create(dto: CreateBlogDto): Promise<Blog> {
    const payload = {
      title: dto.title,
      slug: dto.slug,
      excerpt: dto.excerpt ?? '',
      body_html: dto.body_html ?? '',
      thumbnail_url: dto.thumbnail_url || null,
      category: dto.category ?? 'blog',
      author: dto.author ?? 'Aizen',
      source_name: dto.source_name || null,
      source_url:  dto.source_url  || null,
      images: dto.images ?? [],
      status: dto.status ?? 'draft',
      published_at: dto.status === 'published' ? new Date().toISOString() : null,
    };

    const { data, error } = await this.supabase
      .from('blogs')
      .insert(payload)
      .select()
      .single();

    if (error) {
      this.logger.error('create blog failed', error);
      throw error;
    }

    return data as Blog;
  }

  async update(id: string, dto: UpdateBlogDto, currentStatus: string): Promise<Blog> {
    const payload: Record<string, unknown> = { ...dto };

    // Set published_at khi lần đầu chuyển sang published
    if (dto.status === 'published' && currentStatus !== 'published') {
      payload.published_at = new Date().toISOString();
    }

    // Reset published_at khi chuyển về draft/archived
    if (dto.status && dto.status !== 'published') {
      payload.published_at = null;
    }

    const { data, error } = await this.supabase
      .from('blogs')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('update blog failed', error);
      throw error;
    }

    return data as Blog;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('blogs')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('delete blog failed', error);
      throw error;
    }
  }

  async isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    let builder = this.supabase
      .from('blogs')
      .select('id')
      .eq('slug', slug);

    if (excludeId) builder = builder.neq('id', excludeId);

    const { data } = await builder.maybeSingle();
    return !!data;
  }
}