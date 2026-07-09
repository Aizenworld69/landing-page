import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import type { CreateReviewDto } from './dto/create-review.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
  ) {}

  async findByCourse(courseId: string) {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('id, rating, content, created_at, profiles(full_name, avatar_url)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async create(dto: CreateReviewDto, user: JwtPayload) {
    // Verify course exists
    const { data: course } = await this.supabase
      .from('courses')
      .select('id')
      .eq('id', dto.courseId)
      .single();

    if (!course) throw new NotFoundException('Course not found');

    // Only enrolled + completed users can review
    const { data: enrollment } = await this.supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.sub)
      .eq('course_id', dto.courseId)
      .maybeSingle();

    if (!enrollment) {
      throw new BadRequestException('Ban chua dang ky khoa hoc nay');
    }

    if (enrollment['status'] !== 'completed') {
      throw new BadRequestException('Ban phai hoan thanh khoa hoc truoc khi danh gia');
    }

    // No duplicate reviews
    const { data: existing } = await this.supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.sub)
      .eq('course_id', dto.courseId)
      .maybeSingle();

    if (existing) throw new ConflictException('Ban da danh gia khoa hoc nay roi');

    const { data, error } = await this.supabase
      .from('reviews')
      .insert({
        user_id: user.sub,
        course_id: dto.courseId,
        rating: dto.rating,
        content: dto.content,
      })
      .select('id, rating, content, created_at')
      .single();

    if (error) {
      this.logger.error('Create review failed', error);
      throw error;
    }

    return data;
  }
}
