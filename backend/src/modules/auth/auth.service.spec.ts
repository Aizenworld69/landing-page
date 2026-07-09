import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(async () => {
    mockSupabase = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
      },
    } as unknown as jest.Mocked<SupabaseClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SUPABASE_CLIENT, useValue: mockSupabase },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123',
      fullName: 'Nguyen Van A',
      phone: '0987654321',
      company: 'Aizen',
    };

    it('should register successfully and return user + session', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockSession = { access_token: 'token-123' };

      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await service.register(registerDto);

      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        options: {
          data: {
            full_name: registerDto.fullName,
            phone: registerDto.phone,
            company: registerDto.company,
          },
        },
      });
    });

    it('should throw ConflictException if email already registered', async () => {
      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for other signup errors', async () => {
      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid email format' },
      });

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });

    it('should pass null for optional fields when not provided', async () => {
      const minimalDto = { email: 'test@example.com', password: 'Pass123', fullName: 'Test' };
      (mockSupabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: '1' }, session: null },
        error: null,
      });

      await service.register(minimalDto);

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            data: expect.objectContaining({
              phone: null,
              company: null,
            }),
          },
        }),
      );
    });
  });

  // ─── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'Password123' };

    it('should login successfully and return accessToken, refreshToken, user', async () => {
      const mockData = {
        session: { access_token: 'at-123', refresh_token: 'rt-456' },
        user: {
          id: 'user-1',
          email: 'test@example.com',
          user_metadata: { full_name: 'Nguyen Van A' },
        },
      };

      (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('at-123');
      expect(result.refreshToken).toBe('rt-456');
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Nguyen Van A',
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' },
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with correct message', async () => {
      (mockSupabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' },
      });

      await expect(service.login(loginDto)).rejects.toThrow('Invalid email or password');
    });
  });
});
