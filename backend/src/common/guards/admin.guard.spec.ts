import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let mockSupabaseClient: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
    } as unknown as jest.Mocked<SupabaseClient>;

    guard = new AdminGuard(mockSupabaseClient);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: jest.Mocked<ExecutionContext>;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {},
      };
      mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => mockRequest,
        }),
      } as unknown as jest.Mocked<ExecutionContext>;
    });

    it('should throw UnauthorizedException if no authorization header found', async () => {
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('No authorization header found'),
      );
    });

    it('should throw UnauthorizedException if token format is invalid', async () => {
      mockRequest.headers.authorization = 'InvalidTokenFormat';
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Invalid token format'),
      );
    });

    it('should throw UnauthorizedException if Supabase getUser fails', async () => {
      mockRequest.headers.authorization = 'Bearer mock-token';
      (mockSupabaseClient.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid or expired token' },
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired token'),
      );
    });

    it('should throw ForbiddenException if user is not an admin', async () => {
      mockRequest.headers.authorization = 'Bearer mock-token';
      (mockSupabaseClient.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'user@example.com',
            app_metadata: { role: 'user' },
          },
        },
        error: null,
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('Admin access required'),
      );
    });

    it('should set request.user and return true if user is an admin', async () => {
      mockRequest.headers.authorization = 'Bearer mock-token';
      (mockSupabaseClient.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'admin-id',
            email: 'admin@aizen.edu.vn',
            app_metadata: { role: 'admin' },
          },
        },
        error: null,
      });

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockRequest.user).toEqual({
        sub: 'admin-id',
        email: 'admin@aizen.edu.vn',
        role: 'admin',
      });
    });
  });
});
