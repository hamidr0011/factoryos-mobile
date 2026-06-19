import { useCallback, useEffect } from "react";
import { authService } from "../services/auth.service";
import { isSupabaseConfigured, supabase } from "../services/supabase";
import { useAuthStore } from "../store/authStore";

export const useAuth = () => {
  const { session, profile, userRole, hydrated, setSession, setProfile, setHydrated, logout: clearAuth } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      if (!isSupabaseConfigured) {
        if (mounted) setHydrated(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);

      const userId = data.session?.user.id;
      if (userId) {
        const found = await authService.getProfile(userId);
        if (mounted) setProfile(found);
      } else {
        setProfile(null);
      }
      if (mounted) setHydrated(true);
    };

    hydrate();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      const userId = nextSession?.user.id;
      setProfile(userId ? await authService.getProfile(userId) : null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [setHydrated, setProfile, setSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await authService.signIn(email, password);
      setSession(result.session);
      setProfile(result.profile || null);
      return result;
    },
    [setProfile, setSession],
  );

  const logout = useCallback(async () => {
    await authService.signOut();
    clearAuth();
  }, [clearAuth]);

  return {
    session,
    profile,
    userRole,
    hydrated,
    isAuthenticated: Boolean(session),
    signIn,
    logout,
  };
};
