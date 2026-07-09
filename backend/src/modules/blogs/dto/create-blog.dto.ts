import {
  IsString,
  IsOptional,
  IsIn,
  IsArray,
  ValidateNested,
  IsUrl,
  IsNotEmpty,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { BlogStatus } from '../entities/blog.entity';

export class BlogImageDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  caption?: string;
}

export class CreateBlogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body_html?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @ApiPropertyOptional({ enum: ['blog', 'news'] })
  @IsOptional()
  @IsIn(['blog', 'news'])
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((o: CreateBlogDto) => !!o.source_url)
  @IsUrl()
  source_url?: string;

  @ApiPropertyOptional({ type: [BlogImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogImageDto)
  images?: BlogImageDto[];

  @ApiPropertyOptional({ enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: BlogStatus;
}