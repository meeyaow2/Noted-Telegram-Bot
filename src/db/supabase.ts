import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Config } from "../config.js";

/**
 * Creates the server-side Supabase client. The service role key never leaves
 * this process: it is only read from the environment and passed here.
 */
export function createSupabaseClient(config: Config): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
