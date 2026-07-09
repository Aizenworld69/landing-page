import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import type { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
  ) {}

  async getMyEnrollments(user: JwtPayload) {
    const { data, error } = await this.supabase
      .from('enrollments')
      .select(`
        id, status, completed_at, created_at,
        courses (id, title, slug, thumbnail_url, status, start_date, category)
      `)
      .eq('user_id', user.sub)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('getMyEnrollments failed', error);
      throw error;
    }

    return data ?? [];
  }

  async enroll(dto: CreateEnrollmentDto, user: JwtPayload) {
    // Check course exists
    const { data: course } = await this.supabase
      .from('courses')
      .select('id, title')
      .eq('id', dto.courseId)
      .single();

    if (!course) throw new NotFoundException('Course not found');

    // Check already enrolled
    const { data: existing } = await this.supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.sub)
      .eq('course_id', dto.courseId)
      .maybeSingle();

    if (existing) throw new ConflictException('Already enrolled in this course');

    const { data, error } = await this.supabase
      .from('enrollments')
      .insert({ user_id: user.sub, course_id: dto.courseId, status: 'upcoming' })
      .select('id, status, created_at')
      .single();

    if (error) {
      this.logger.error('enroll failed', error);
      throw error;
    }

    return data;
  }

  async getCertificate(enrollmentId: string, user: JwtPayload) {
    const { data, error } = await this.supabase
      .from('enrollments')
      .select('id, status, completed_at, courses(title)')
      .eq('id', enrollmentId)
      .eq('user_id', user.sub) // Verify ownership — KHONG de user lay cert cua nguoi khac
      .single();

    if (error || !data) throw new NotFoundException('Enrollment not found');
    if (data['status'] !== 'completed') {
      throw new ConflictException('Course not completed yet');
    }

    // TODO: Generate actual PDF certificate — currently returns metadata
    return {
      enrollmentId: data['id'],
      courseTitle: Array.isArray(data['courses'])
        ? (data['courses'] as any)[0]?.title
        : (data['courses'] as any)?.title,
      completedAt: data['completed_at'],
      certificateUrl: null, // Implement with PDF generation later
    };
  }
}
