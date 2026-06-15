import { machines, productionOrders } from "../utils/constants";
import { isSupabaseConfigured, supabase } from "./supabase";

export const productionService = {
  async getOrders(status?: string) {
    if (!isSupabaseConfigured) {
      return status && status !== "all" ? productionOrders.filter((order) => order.status === status) : productionOrders;
    }

    let query = supabase
      .from("production_orders")
      .select("*, machine:machines(*), operator:profiles(*)")
      .order("created_at", { ascending: false });

    if (status && status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getMachines() {
    if (!isSupabaseConfigured) return machines;
    const { data, error } = await supabase.from("machines").select("*").order("machine_code");
    if (error) throw error;
    return data;
  },
};
