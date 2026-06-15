import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import type { Profile, Role } from "../types";

interface AuthStore {
  session: Session | null;
  profile: Profile | null;
  userRole: Role;
  hydrated: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  profile: null,
  userRole: "viewer",
  hydrated: false,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile, userRole: profile?.role || "viewer" }),
  setHydrated: (hydrated) => set({ hydrated }),
  logout: () => set({ session: null, profile: null, userRole: "viewer" }),
}));
