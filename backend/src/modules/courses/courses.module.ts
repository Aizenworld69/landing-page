import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesRepository } from './courses.repository';
import { CoursesService } from './courses.service';
import { CoursesCronService } from './courses.cron.service';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, CoursesRepository, CoursesCronService],
  exports: [CoursesService],
})
export class CoursesModule {}
