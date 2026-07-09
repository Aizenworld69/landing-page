import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePromoCodeDto } from './create-promo-code.dto';

// Admin có thể sửa tất cả ngoại trừ `code` (mã không được đổi sau khi tạo)
export class UpdatePromoCodeDto extends PartialType(
  OmitType(CreatePromoCodeDto, ['code'] as const),
) {
  @ApiPropertyOptional({ description: 'Bật / tắt mã khuyến mãi' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
