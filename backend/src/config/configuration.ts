export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
  upstashRedisUrl: process.env.UPSTASH_REDIS_URL ?? '',
  upstashRedisToken: process.env.UPSTASH_REDIS_TOKEN ?? '',
  braveSearchApiKey: process.env.BRAVE_SEARCH_API_KEY ?? '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  sentryDsn: process.env.SENTRY_DSN,
});
