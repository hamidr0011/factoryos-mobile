import { qualityChecks } from "../utils/constants";
import { isSupabaseConfigured, supabase } from "./supabase";

export const qualityService = {
  async getChecks() {
    if (!isSupabaseConfigured) return qualityChecks;
    const { data, error } = await supabase
      .from("quality_checks")
      .select("*, inspector:profiles(*), order:production_orders(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
};
