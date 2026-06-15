import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const authOptions = {
  autoRefreshToken: false,
  detectSessionInUrl: false,
  persistSession: false,
};

export const adminSupabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: authOptions,
});

export const createUserSupabase = (accessToken) =>
  createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: authOptions,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
