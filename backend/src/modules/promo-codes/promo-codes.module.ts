import { Module } from '@nestjs/common';
import { PromoCodesController } from './promo-codes.controller';
import { PromoCodesService } from './promo-codes.service';
import { SupabaseModule } from '../../database/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [PromoCodesController],
  providers: [PromoCodesService],
  exports: [PromoCodesService], // Export để RegistrationsModule dùng
})
export class PromoCodesModule {}
