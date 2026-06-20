import { apiRequest } from "./api";
import { stripSeedData } from "./seedDataGuard";

export const inventoryService = {
  async getItems() {
    return stripSeedData("inventory", await apiRequest("/api/inventory/items"));
  },

  async getTransactions(itemId?: string) {
    const params = itemId ? `?itemId=${encodeURIComponent(itemId)}` : "";
    return apiRequest(`/api/inventory/transactions${params}`);
  },

  async recordTransaction(input: { itemId: string; type: "In" | "Out" | "Transfer" | "Adjustment"; quantity: number; reference?: string; notes?: string; toLocation?: string }) {
    return apiRequest("/api/inventory/transactions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
