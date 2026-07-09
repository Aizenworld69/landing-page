import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseSkillDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badge?: string;
}

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @ApiProperty({ enum: ['upcoming', 'completed'] })
  @IsEnum(['upcoming', 'completed'])
  status: 'upcoming' | 'completed';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price_group: number;

  @ApiProperty()
  @IsUUID()
  instructor_id: string;

  @ApiPropertyOptional({ type: [CourseSkillDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseSkillDto)
  skills?: CourseSkillDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  curriculum_headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qr_early_bird?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qr_individual?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qr_group_2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qr_group_4?: string;

  @ApiPropertyOptional()
  @IsOptional()
  plans_config?: any;

  @ApiPropertyOptional({ description: 'QR chuyển khoản gói Early Bird sau khuyến mãi' })
  @IsOptional()
  @IsString()
  qr_early_bird_promo?: string;

  @ApiPropertyOptional({ description: 'QR chuyển khoản gói Cá nhân sau khuyến mãi' })
  @IsOptional()
  @IsString()
  qr_individual_promo?: string;

  @ApiPropertyOptional({ description: 'QR chuyển khoản gói Nhóm 2 người sau khuyến mãi' })
  @IsOptional()
  @IsString()
  qr_group_2_promo?: string;

  @ApiPropertyOptional({ description: 'QR chuyển khoản gói Nhóm 4 người sau khuyến mãi' })
  @IsOptional()
  @IsString()
  qr_group_4_promo?: string;

  @ApiPropertyOptional({ description: 'Hạn chót đăng ký gói Early Bird (ISO datetime). Để trống = không giới hạn.' })
  @IsOptional()
  @IsDateString()
  early_bird_deadline?: string;
}
