import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseService {
  private readonly _adminClient: SupabaseClient;
  private readonly _anonClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this._adminClient = createClient(
      this.configService.get<string>('supabaseUrl')!,
      this.configService.get<string>('supabaseServiceRoleKey')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    this._anonClient = createClient(
      this.configService.get<string>('supabaseUrl')!,
      this.configService.get<string>('supabaseAnonKey')!,
    );
  }

  get adminClient(): SupabaseClient {
    return this._adminClient;
  }

  get anonClient(): SupabaseClient {
    return this._anonClient;
  }
}
