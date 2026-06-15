import type { Profile } from "../types";
import { demoProfile } from "../utils/constants";
import { isSupabaseConfigured, supabase } from "./supabase";

export const authService = {
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      return { session: null, profile: demoProfile, demo: true };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const userId = data.session?.user.id;
    if (!userId) return { session: data.session, profile: null, demo: false };

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single<Profile>();
    return { session: data.session, profile: profile || null, demo: false };
  },

  async signOut() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },
};
