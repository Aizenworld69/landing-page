import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePromoCodeDto {
  @ApiProperty({ description: 'Mã do admin tự đặt, VD: AIZEN50', example: 'AIZEN50' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/, { message: 'Mã chỉ gồm chữ hoa, số, gạch dưới, gạch ngang' })
  @Transform(({ value }: { value: string }) => value?.toUpperCase().trim())
  code: string;

  @ApiProperty({ description: 'UUID của khóa học áp dụng' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'course_id phải là định dạng UUID hợp lệ',
  })
  course_id: string;

  @ApiProperty({ enum: ['early_bird', 'individual', 'group_2', 'group_4', 'all'], default: 'all' })
  @IsIn(['early_bird', 'individual', 'group_2', 'group_4', 'all'])
  plan: 'early_bird' | 'individual' | 'group_2' | 'group_4' | 'all';

  @ApiProperty({ enum: ['percent', 'fixed'], description: 'percent = % giảm, fixed = giảm cố định (VND)' })
  @IsIn(['percent', 'fixed'])
  discount_type: 'percent' | 'fixed';

  @ApiProperty({ description: 'Giá trị giảm (% hoặc VND)', example: 50 })
  @IsNumber()
  @IsPositive()
  discount_value: number;

  @ApiProperty({ description: 'Giới hạn số lượt sử dụng', example: 100 })
  @IsNumber()
  @Min(1)
  max_uses: number;

  @ApiPropertyOptional({ description: 'Ngày hết hạn (ISO 8601), bỏ trống = không hết hạn' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined) ? undefined : value)
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsISO8601()
  expires_at?: string | null;

  @ApiPropertyOptional({ description: 'Ghi chú nội bộ cho marketing' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
