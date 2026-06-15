import { machines, productionOrders } from "../utils/constants";
import { apiRequest, isApiConfigured } from "./api";
import { shouldUseSupabase, supabase } from "./supabase";

export const productionService = {
  async getOrders(status?: string) {
    if (!(await shouldUseSupabase())) {
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
    if (!(await shouldUseSupabase())) return machines;
    const { data, error } = await supabase.from("machines").select("*").order("machine_code");
    if (error) throw error;
    return data;
  },

  async updateProgress(orderId: string, quantityDelta: number, notes?: string) {
    if (isApiConfigured) {
      return apiRequest(`/api/production/orders/${orderId}/progress`, {
        method: "POST",
        body: JSON.stringify({ quantityDelta, notes }),
      });
    }

    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase.rpc("update_production_progress", {
      p_order_id: orderId,
      p_quantity_delta: quantityDelta,
      p_notes: notes || null,
    });
    if (error) throw error;
    return data;
  },

  async updateStatus(orderId: string, status: "pending" | "in_progress" | "completed" | "on_hold" | "cancelled", notes?: string) {
    if (isApiConfigured) {
      return apiRequest(`/api/production/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes }),
      });
    }

    if (!(await shouldUseSupabase())) return null;
    const payload: { status: string; notes?: string; end_date?: string } = { status };
    if (notes) payload.notes = notes;
    if (status === "completed") payload.end_date = new Date().toISOString();

    const { data, error } = await supabase
      .from("production_orders")
      .update(payload)
      .eq("id", orderId)
      .select("*, machine:machines(*), operator:profiles(*)")
      .single();
    if (error) throw error;
    return data;
  },

  async recordMachineTelemetry(input: { machineId: string; status: string; efficiencyPercent: number; outputRate?: number; temperatureC?: number; vibrationMmS?: number }) {
    if (isApiConfigured) {
      return apiRequest(`/api/production/machines/${input.machineId}/telemetry`, {
        method: "POST",
        body: JSON.stringify(input),
      });
    }

    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase.rpc("record_machine_telemetry", {
      p_machine_id: input.machineId,
      p_status: input.status,
      p_efficiency_percent: input.efficiencyPercent,
      p_output_rate: input.outputRate || null,
      p_temperature_c: input.temperatureC || null,
      p_vibration_mm_s: input.vibrationMmS || null,
    });
    if (error) throw error;
    return data;
  },
};
