import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CoursesRepository } from './courses.repository';

@Injectable()
export class CoursesCronService {
  private readonly logger = new Logger(CoursesCronService.name);

  constructor(private readonly coursesRepo: CoursesRepository) {}

  /**
   * Chay moi ngay luc 00:05 (gio server) de dong bo status='completed'
   * xuong DB cho cac khoa hoc da qua start_date nhung van con
   * status='upcoming'. Day la ban ghi THAT trong DB, khac voi
   * adjustCourseStatus() o repository (chi tinh tam khi doc).
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleSyncCompletedStatuses() {
    try {
      const updatedCount = await this.coursesRepo.syncCompletedStatuses();
      if (updatedCount > 0) {
        this.logger.log(`Da tu dong chuyen ${updatedCount} khoa hoc sang trang thai 'completed'`);
      }
    } catch (err) {
      this.logger.error('Cron dong bo status khoa hoc that bai', err);
    }
  }
}
