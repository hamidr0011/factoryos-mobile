import { apiRequest } from "./api";
import { stripSeedData } from "./seedDataGuard";
import { shouldUseSupabase, supabase } from "./supabase";

export const qualityService = {
  async getChecks() {
    return stripSeedData("quality", await apiRequest("/api/quality/checks"));
  },

  async getDefectTypes() {
    return apiRequest("/api/quality/defect-types");
  },

  async uploadEvidence(uri: string, batchNumber: string) {
    if (!(await shouldUseSupabase())) {
      throw new Error("Supabase session is required to upload quality evidence.");
    }

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
    return apiRequest("/api/quality/checks", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
