import { useEffect } from "react";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { shouldUseSupabase, supabase } from "../services/supabase";

export const useRealtime = <T extends Record<string, unknown>>(
  table: string,
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void,
) => {
  useEffect(() => {
    if (!onChange) return undefined;
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    shouldUseSupabase().then((enabled) => {
      if (!enabled || !active) return;
      channel = supabase
        .channel(`realtime:${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, onChange)
        .subscribe();
    });

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [onChange, table]);
};
