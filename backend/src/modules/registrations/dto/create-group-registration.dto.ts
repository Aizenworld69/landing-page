import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GroupMemberDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.trim())
  full_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Email khong hop le' })
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  position?: string;
}

export class CreateGroupRegistrationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({ description: 'Nguồn biết đến chương trình' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn nguồn biết đến chương trình' })
  referral: string;

  @ApiProperty({ type: [GroupMemberDto], description: 'Danh sách thành viên (2 người)' })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2, { message: 'Đăng ký nhóm cần ít nhất 2 người' })
  @ArrayMaxSize(10, { message: 'Đăng ký nhóm tối đa 10 người' })
  @Type(() => GroupMemberDto)
  members: GroupMemberDto[];

  @ApiPropertyOptional({ description: 'Mã khuyến mãi (nếu có)', example: 'AIZEN50' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.toUpperCase().trim())
  promoCode?: string;
}
