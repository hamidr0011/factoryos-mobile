import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  supabaseUrl !== "your-project-url" &&
  supabaseAnonKey !== "your-anon-key" &&
  supabaseAnonKey !== "your-publishable-key";

const createSupabaseClient = () => {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};

const missingSupabaseClient = new Proxy({} as SupabaseClient, {
  get() {
    throw new Error("Supabase is not configured for this build.");
  },
});

export const supabase: SupabaseClient = createSupabaseClient() || missingSupabaseClient;

export const getSupabaseSession = async () => {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const shouldUseSupabase = async () => Boolean(await getSupabaseSession());
