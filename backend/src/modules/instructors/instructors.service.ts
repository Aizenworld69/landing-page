import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import type { QueryInstructorDto } from './dto/query-instructor.dto';

@Injectable()
export class InstructorsService {
  private readonly logger = new Logger(InstructorsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
  ) {}

  async findAll(query: QueryInstructorDto) {
    let builder = this.supabase
      .from('instructors')
      .select('id, name, title, bio, avatar_url, social_links')
      .order('created_at', { ascending: true });

    if (query.search) {
      builder = builder.ilike('name', `%${query.search}%`);
    }

    const { data, error } = await builder;

    if (error) {
      this.logger.error('findAll instructors failed', error);
      throw error;
    }

    return data ?? [];
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('instructors')
      .select(`
        id, name, title, bio, avatar_url, social_links,
        courses (id, title, slug, status, thumbnail_url, start_date)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException(`Instructor ${id} not found`);
      this.logger.error('findOne instructor failed', error);
      throw error;
    }

    return data;
  }
}
