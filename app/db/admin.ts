/**
 * Supabase Admin Client
 *
 * Creates a Supabase client with the service role key.
 * This client bypasses RLS and should only be used for
 * server-side operations that need admin privileges.
 *
 * IMPORTANT: Never expose this client to the browser!
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Creates a Supabase admin client that bypasses RLS.
 * Use this for server-side operations like:
 * - Storage uploads on behalf of users
 * - Admin database operations
 * - Background jobs
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
