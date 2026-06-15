import { qualityChecks } from "../utils/constants";
import { shouldUseSupabase, supabase } from "./supabase";

export const qualityService = {
  async getChecks() {
    if (!(await shouldUseSupabase())) return qualityChecks;
    const { data, error } = await supabase
      .from("quality_checks")
      .select("*, inspector:profiles(*), order:production_orders(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async uploadEvidence(uri: string, batchNumber: string) {
    if (!(await shouldUseSupabase())) return uri;

    const response = await fetch(uri);
    const body = await response.arrayBuffer();
    const extension = uri.split("?")[0].split(".").pop()?.toLowerCase() || "jpg";
    const contentType = extension === "png" ? "image/png" : "image/jpeg";
    const safeBatch = batchNumber.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const path = `${safeBatch}/${Date.now()}.${extension}`;

    const { error } = await supabase.storage.from("quality-evidence").upload(path, body, {
      contentType,
      upsert: false,
    });
    if (error) throw error;
    return path;
  },

  async submitCheck(input: { orderId: string; batchNumber: string; totalInspected: number; passed: number; failed: number; defectTypes?: string[]; notes?: string; images?: string[] }) {
    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase.rpc("submit_quality_check", {
      p_order_id: input.orderId,
      p_batch_number: input.batchNumber,
      p_total_inspected: input.totalInspected,
      p_passed: input.passed,
      p_failed: input.failed,
      p_defect_type: input.defectTypes || [],
      p_notes: input.notes || null,
      p_images: input.images || [],
    });
    if (error) throw error;
    return data;
  },
};
