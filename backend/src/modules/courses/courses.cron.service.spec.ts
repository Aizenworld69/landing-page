import { Test, TestingModule } from '@nestjs/testing';
import { CoursesCronService } from './courses.cron.service';
import { CoursesRepository } from './courses.repository';

describe('CoursesCronService', () => {
  let cronService: CoursesCronService;
  let mockRepo: jest.Mocked<CoursesRepository>;

  beforeEach(async () => {
    mockRepo = {
      syncCompletedStatuses: jest.fn(),
    } as unknown as jest.Mocked<CoursesRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesCronService,
        { provide: CoursesRepository, useValue: mockRepo },
      ],
    }).compile();

    cronService = module.get<CoursesCronService>(CoursesCronService);
  });

  it('should be defined', () => {
    expect(cronService).toBeDefined();
  });

  describe('handleSyncCompletedStatuses', () => {
    it('should call repository syncCompletedStatuses', async () => {
      mockRepo.syncCompletedStatuses.mockResolvedValue(3);

      await cronService.handleSyncCompletedStatuses();

      expect(mockRepo.syncCompletedStatuses).toHaveBeenCalled();
    });

    it('should not throw when repository returns 0 updates', async () => {
      mockRepo.syncCompletedStatuses.mockResolvedValue(0);

      await expect(cronService.handleSyncCompletedStatuses()).resolves.not.toThrow();
    });

    it('should not throw when repository throws error (error is caught internally)', async () => {
      mockRepo.syncCompletedStatuses.mockRejectedValue(new Error('db connection lost'));

      // Cron job catches errors internally, should not propagate
      await expect(cronService.handleSyncCompletedStatuses()).resolves.not.toThrow();
    });
  });
});
