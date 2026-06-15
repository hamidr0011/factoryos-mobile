import { useEffect } from "react";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../services/supabase";

export const useRealtime = <T extends Record<string, unknown>>(
  table: string,
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void,
) => {
  useEffect(() => {
    if (!isSupabaseConfigured || !onChange) return undefined;

    const channel = supabase
      .channel(`realtime:${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange, table]);
};
