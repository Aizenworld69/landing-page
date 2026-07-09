import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCourseDto {
  @ApiPropertyOptional({ description: 'Tim kiem theo tieu de khoa hoc' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  search?: string;

  @ApiPropertyOptional({ enum: ['upcoming', 'completed'] })
  @IsOptional()
  @IsEnum(['upcoming', 'completed'])
  status?: 'upcoming' | 'completed';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  year?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 9;
}
