import type { Profile } from "../types";
import { apiRequest } from "./api";
import { isSupabaseConfigured, supabase } from "./supabase";

export const authService = {
  async getProfile(userId: string) {
    if (!isSupabaseConfigured || !userId) return null;
    const data = await apiRequest<{ profile: Profile | null }>("/api/me");
    return data.profile || null;
  },

  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured for this build.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const userId = data.session?.user.id;
    if (!userId) return { session: data.session, profile: null };

    const profile = await this.getProfile(userId);
    return { session: data.session, profile };
  },

  async signOut() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },
};
