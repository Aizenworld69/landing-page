import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    } as unknown as jest.Mocked<SupabaseClient>;

    guard = new JwtAuthGuard(mockSupabase);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  function createMockContext(headers: Record<string, string> = {}): {
    context: jest.Mocked<ExecutionContext>;
    request: Record<string, unknown>;
  } {
    const request: Record<string, unknown> = { headers };
    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => request,
      }),
    } as unknown as jest.Mocked<ExecutionContext>;
    return { context, request };
  }

  it('should throw UnauthorizedException if no authorization header', async () => {
    const { context } = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('No authorization header found');
  });

  it('should throw UnauthorizedException if token format is invalid (no Bearer)', async () => {
    const { context } = createMockContext({ authorization: 'InvalidFormat' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('Invalid token format');
  });

  it('should throw UnauthorizedException if Bearer but no token value', async () => {
    const { context } = createMockContext({ authorization: 'Bearer ' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if Supabase returns error', async () => {
    const { context } = createMockContext({ authorization: 'Bearer valid-token' });
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Token expired' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user is null', async () => {
    const { context } = createMockContext({ authorization: 'Bearer valid-token' });
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should set request.user and return true for valid token', async () => {
    const { context, request } = createMockContext({ authorization: 'Bearer valid-token' });
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'user@test.com',
          role: 'authenticated',
        },
      },
      error: null,
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request['user']).toEqual({
      sub: 'user-123',
      email: 'user@test.com',
      role: 'authenticated',
    });
  });

  it('should handle unexpected errors gracefully', async () => {
    const { context } = createMockContext({ authorization: 'Bearer valid-token' });
    (mockSupabase.auth.getUser as jest.Mock).mockRejectedValue(new Error('Network failure'));

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
