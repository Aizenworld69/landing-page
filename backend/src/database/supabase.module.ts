import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): SupabaseClient => {
        const url = config.get<string>('supabase.url');
        const key = config.get<string>('supabase.serviceRoleKey');

        if (!url || !key) {
          throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined');
        }

        return createClient(url, key, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
      },
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
