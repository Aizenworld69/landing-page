import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../database/supabase.module';
import { InstructorsService } from './instructors.service';

describe('InstructorsService', () => {
  let service: InstructorsService;
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(async () => {
    mockSupabase = {
      from: jest.fn(),
    } as unknown as jest.Mocked<SupabaseClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstructorsService,
        { provide: SUPABASE_CLIENT, useValue: mockSupabase },
      ],
    }).compile();

    service = module.get<InstructorsService>(InstructorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return list of instructors', async () => {
      const mockData = [
        { id: 'inst-1', name: 'Teacher A', title: 'Professor' },
      ];

      const builder: Record<string, jest.Mock> = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockResolvedValue({ data: mockData, error: null });
      builder.ilike = jest.fn().mockReturnValue(builder);
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      const result = await service.findAll({});

      expect(result).toEqual(mockData);
    });

    it('should return empty array when no instructors', async () => {
      const builder: Record<string, jest.Mock> = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockResolvedValue({ data: null, error: null });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      const result = await service.findAll({});

      expect(result).toEqual([]);
    });

    it('should apply search filter when search is provided', async () => {
      const builder: Record<string, jest.Mock> = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockReturnValue(builder);
      builder.ilike = jest.fn().mockResolvedValue({ data: [], error: null });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      await service.findAll({ search: 'Teacher' });

      expect(builder.ilike).toHaveBeenCalledWith('name', '%Teacher%');
    });

    it('should throw when query fails', async () => {
      const builder: Record<string, jest.Mock> = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockResolvedValue({ data: null, error: new Error('db error') });
      (mockSupabase.from as jest.Mock).mockReturnValue(builder);

      await expect(service.findAll({})).rejects.toThrow();
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return instructor with courses when found', async () => {
      const mockData = {
        id: 'inst-1',
        name: 'Teacher A',
        courses: [{ id: 'c-1', title: 'Course' }],
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await service.findOne('inst-1');

      expect(result).toEqual(mockData);
    });

    it('should throw NotFoundException when instructor not found (PGRST116)', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' },
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(service.findOne('inst-999')).rejects.toThrow(NotFoundException);
    });

    it('should throw on non-PGRST116 errors', async () => {
      const dbError = { code: 'OTHER', message: 'DB error' };
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: dbError,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(service.findOne('inst-1')).rejects.toEqual(dbError);
    });
  });
});
