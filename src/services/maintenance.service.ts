import { maintenanceTasks } from "../utils/constants";
import { isSupabaseConfigured, supabase } from "./supabase";

export const maintenanceService = {
  async getTasks() {
    if (!isSupabaseConfigured) return maintenanceTasks;
    const { data, error } = await supabase
      .from("maintenance_tasks")
      .select("*, machine:machines(*), assignee:profiles(*)")
      .order("scheduled_date", { ascending: true });
    if (error) throw error;
    return data;
  },
};
