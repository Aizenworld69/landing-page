import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RevalidationService } from './revalidation.service';

describe('RevalidationService', () => {
  let service: RevalidationService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevalidationService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RevalidationService>(RevalidationService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should skip revalidation when REVALIDATE_SECRET is not configured', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'app.revalidateSecret') return undefined;
      return 'http://localhost:3000';
    });

    global.fetch = jest.fn();

    await service.revalidate(['/blogs']);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should call frontend revalidation endpoint with correct payload', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'app.revalidateSecret') return 'my-secret';
      if (key === 'app.frontendUrl') return 'http://localhost:3000';
      return undefined;
    });

    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await service.revalidate(['/blogs', '/blogs/test-slug']);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/revalidate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-revalidate-secret': 'my-secret',
        }),
        body: JSON.stringify({ paths: ['/blogs', '/blogs/test-slug'] }),
      }),
    );
  });

  it('should not throw when fetch returns non-ok status (logs warning)', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'app.revalidateSecret') return 'secret';
      if (key === 'app.frontendUrl') return 'http://localhost:3000';
      return undefined;
    });

    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    // Should NOT throw — revalidation failures are non-critical
    await expect(service.revalidate(['/blogs'])).resolves.not.toThrow();
  });

  it('should not throw when fetch fails with network error (logs warning)', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'app.revalidateSecret') return 'secret';
      if (key === 'app.frontendUrl') return 'http://localhost:3000';
      return undefined;
    });

    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.revalidate(['/blogs'])).resolves.not.toThrow();
  });
});
