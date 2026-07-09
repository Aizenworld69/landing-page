import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import type { QueryCourseDto } from './dto/query-course.dto';
import type { CreateCourseDto } from './dto/create-course.dto';
import type { UpdateCourseDto } from './dto/update-course.dto';
import type { Course, CourseModule, CourseStatus, CourseWithDetails } from './entities/course.entity';
import { CourseModuleItemDto } from './dto/update-modules.dto';

@Injectable()
export class CoursesRepository {
  private readonly logger = new Logger(CoursesRepository.name);

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Tinh trang thai hien thi: neu khoa hoc da qua start_date nhung admin
   * chua cap nhat status thanh 'completed' thi tu dong hien thi 'completed'.
   * Day la luoi an toan o tang DOC DU LIEU (real-time), dung kem voi
   * syncCompletedStatuses() o duoi — ham do se ghi that gia tri nay
   * xuong DB moi dem qua cron job.
   */
  private adjustCourseStatus<T extends { status: CourseStatus; start_date?: string | null }>(
    course: T,
  ): T {
    if (course.status === 'completed' || !course.start_date) return course;

    const today = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const startDateStr = course.start_date.slice(0, 10);

    if (startDateStr < today) {
      return { ...course, status: 'completed' };
    }
    return course;
  }

  async findAll(query: QueryCourseDto): Promise<{ data: Course[]; total: number }> {
    const { search, status, category, year, page = 1, limit = 9 } = query;
    const offset = (page - 1) * limit;

    let builder = this.supabase
      .from('courses')
      .select('*', { count: 'exact' })
      .order('start_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (search) builder = builder.ilike('title', `%${search}%`);

    const today = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (status === 'upcoming') {
      builder = builder.eq('status', 'upcoming').or(`start_date.gte.${today},start_date.is.null`);
    } else if (status === 'completed') {
      builder = builder.or(`status.eq.completed,start_date.lt.${today}`);
    } else if (status) {
      builder = builder.eq('status', status);
    }

    if (category) builder = builder.eq('category', category);
    if (year) builder = builder.like('start_date', `${year}%`);

    const { data, error, count } = await builder;

    if (error) {
      this.logger.error('findAll courses failed', error);
      throw error;
    }

    const mappedData = (data ?? []).map((c) => this.adjustCourseStatus(c as Course));
    return { data: mappedData, total: count ?? 0 };
  }

  async findBySlug(slug: string): Promise<CourseWithDetails | null> {
    const { data, error } = await this.supabase
      .from('courses')
      .select(`
        *,
        course_modules (
          id,
          title,
          subtitle,
          description,
          duration_minutes,
          order_index,
          start_time,
          item_type
        ),
        instructors (id, name, title, avatar_url, bio)
      `)
      .eq('slug', slug)
      .order('order_index', { referencedTable: 'course_modules', ascending: true })
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      this.logger.error('findBySlug failed', error);
      throw error;
    }

    return this.adjustCourseStatus(data as CourseWithDetails);
  }

  async findById(id: string): Promise<Course | null> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.adjustCourseStatus(data as Course);
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .insert([dto])
      .select()
      .single();

    if (error) {
      this.logger.error('create course failed', error);
      throw error;
    }

    return this.adjustCourseStatus(data as Course);
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`update course ${id} failed`, error);
      throw error;
    }

    return this.adjustCourseStatus(data as Course);
  }

  async delete(id: string): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`delete course ${id} failed`, error);
      throw error;
    }

    return this.adjustCourseStatus(data as Course);
  }

  async uploadThumbnail(file: Express.Multer.File): Promise<string> {
    const cleanFileName = file.originalname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}_${cleanFileName}`;

    const { error } = await this.supabase.storage
      .from('courses')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      this.logger.error('uploadThumbnail failed', error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from('courses').getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Thay toan bo module cua 1 khoa hoc bang danh sach moi.
   * Vi Supabase JS khong ho tro multi-statement transaction, ham nay
   * dung chien luoc "compensating transaction":
   *  1. Backup du lieu module cu.
   *  2. Xoa module cu.
   *  3. Chen module moi — neu loi, phuc hoi lai du lieu cu vua backup
   *     truoc khi nem loi ra ngoai, tranh mat trang du lieu module.
   */
  async updateModules(courseId: string, modules: CourseModuleItemDto[]): Promise<void> {
    const { data: oldModules, error: fetchError } = await this.supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId);

    if (fetchError) {
      this.logger.error(`fetch old modules failed for course ${courseId}`, fetchError);
      throw fetchError;
    }

    const { error: deleteError } = await this.supabase
      .from('course_modules')
      .delete()
      .eq('course_id', courseId);

    if (deleteError) {
      this.logger.error(`delete old modules failed for course ${courseId}`, deleteError);
      throw deleteError;
    }

    if (modules.length === 0) return;

    const insertData = modules.map((m, idx) => ({
      course_id: courseId,
      title: m.title,
      subtitle: m.subtitle || null,
      description: m.description || null,
      duration_minutes: m.duration_minutes,
      start_time: m.start_time || null,
      item_type: m.item_type,
      order_index: idx,
    }));

    const { error: insertError } = await this.supabase.from('course_modules').insert(insertData);

    if (insertError) {
      this.logger.error(`insert new modules failed for course ${courseId}`, insertError);

      // Phuc hoi lai du lieu cu de tranh mat module khi insert that bai giua chung
      if (oldModules && oldModules.length > 0) {
        const restoreData = oldModules.map(({ id, ...rest }) => rest);
        const { error: restoreError } = await this.supabase.from('course_modules').insert(restoreData);
        if (restoreError) {
          this.logger.error(
            `KHAN CAP: phuc hoi module cu cho course ${courseId} that bai sau khi insert moi loi`,
            restoreError,
          );
        } else {
          this.logger.warn(`Da phuc hoi lai module cu cho course ${courseId} sau khi insert moi that bai`);
        }
      }

      throw insertError;
    }
  }

  async findModulesByCourseId(courseId: string): Promise<CourseModule[]> {
    const { data, error } = await this.supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      this.logger.error(`findModulesByCourseId failed for course ${courseId}`, error);
      throw error;
    }

    return (data ?? []) as CourseModule[];
  }

  /**
   * GHI THAT xuong DB: chuyen status='upcoming' -> 'completed' cho cac
   * khoa hoc da qua start_date. Duoc goi boi CoursesCronService moi dem.
   * Tra ve so luong ban ghi da cap nhat.
   */
  async syncCompletedStatuses(): Promise<number> {
    const today = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data, error } = await this.supabase
      .from('courses')
      .update({ status: 'completed' })
      .eq('status', 'upcoming')
      .lt('start_date', today)
      .select('id');

    if (error) {
      this.logger.error('syncCompletedStatuses failed', error);
      throw error;
    }

    return data?.length ?? 0;
  }
}
