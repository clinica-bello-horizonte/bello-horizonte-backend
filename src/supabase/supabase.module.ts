import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('SUPABASE_URL');
        const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
        if (!url || !key) return null;
        return createClient(url, key);
      },
      inject: [ConfigService],
    },
    SupabaseService,
  ],
  exports: [SupabaseService],
})
export class SupabaseModule {}
