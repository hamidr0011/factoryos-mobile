import type { Profile } from "../types";
import { isSupabaseConfigured, supabase } from "./supabase";

export const authService = {
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured for this build.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const userId = data.session?.user.id;
    if (!userId) return { session: data.session, profile: null };

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single<Profile>();
    return { session: data.session, profile: profile || null };
  },

  async signOut() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },
};
