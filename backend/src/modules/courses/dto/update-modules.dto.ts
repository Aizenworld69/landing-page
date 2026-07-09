import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseModuleItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  duration_minutes: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiProperty({ enum: ['module', 'break', 'event'] })
  @IsEnum(['module', 'break', 'event'])
  item_type: 'module' | 'break' | 'event';
}

export class UpdateCourseModulesDto {
  @ApiProperty({ type: [CourseModuleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseModuleItemDto)
  modules: CourseModuleItemDto[];
}
