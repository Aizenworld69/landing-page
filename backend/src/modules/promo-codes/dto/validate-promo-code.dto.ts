import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ValidatePromoCodeDto {
  @ApiProperty({ description: 'Mã khuyến mãi khách nhập', example: 'AIZEN50' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.toUpperCase().trim())
  code: string;

  @ApiProperty({ description: 'UUID khóa học đang đăng ký' })
  @IsNotEmpty()
  @IsString()
  course_id: string;

  @ApiProperty({ enum: ['early_bird', 'individual', 'group_2', 'group_4'] })
  @IsNotEmpty()
  @IsString()
  plan: string;
}
