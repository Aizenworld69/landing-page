import { Injectable, NotFoundException } from '@nestjs/common';
import { CoursesRepository } from './courses.repository';
import type { QueryCourseDto } from './dto/query-course.dto';
import type { CreateCourseDto } from './dto/create-course.dto';
import type { UpdateCourseDto } from './dto/update-course.dto';
import type { CourseModule } from './entities/course.entity';
import { CourseModuleItemDto } from './dto/update-modules.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly coursesRepo: CoursesRepository) {}

  async findAll(query: QueryCourseDto) {
    const { data, total } = await this.coursesRepo.findAll(query);
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
    const course = await this.coursesRepo.findBySlug(slug);
    if (!course) {
      throw new NotFoundException(`Course with slug "${slug}" not found`);
    }
    return course;
  }

  async create(dto: CreateCourseDto) {
    return this.coursesRepo.create(dto);
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.coursesRepo.findById(id);
    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }
    return this.coursesRepo.update(id, dto);
  }

  async delete(id: string) {
    const course = await this.coursesRepo.findById(id);
    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }
    return this.coursesRepo.delete(id);
  }

  async uploadThumbnail(file: Express.Multer.File): Promise<string> {
    return this.coursesRepo.uploadThumbnail(file);
  }

  async updateModules(courseId: string, modules: CourseModuleItemDto[]): Promise<void> {
    const course = await this.coursesRepo.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID "${courseId}" not found`);
    }
    return this.coursesRepo.updateModules(courseId, modules);
  }

  async findModulesByCourseId(courseId: string): Promise<CourseModule[]> {
    const course = await this.coursesRepo.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID "${courseId}" not found`);
    }
    return this.coursesRepo.findModulesByCourseId(courseId);
  }

  /** Chay dong bo status='completed' xuong DB ngay lap tuc (Admin trigger thu cong) */
  async syncCompletedStatuses(): Promise<{ updatedCount: number }> {
    const updatedCount = await this.coursesRepo.syncCompletedStatuses();
    return { updatedCount };
  }
}
