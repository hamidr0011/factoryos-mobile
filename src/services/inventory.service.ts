import { inventoryItems, inventoryTransactions } from "../utils/constants";
import { shouldUseSupabase, supabase } from "./supabase";

export const inventoryService = {
  async getItems() {
    if (!(await shouldUseSupabase())) return inventoryItems;
    const { data, error } = await supabase.from("inventory_items").select("*, supplier:suppliers(*)").order("name");
    if (error) throw error;
    return data;
  },

  async getTransactions(itemId?: string) {
    if (!(await shouldUseSupabase())) return itemId ? inventoryTransactions.filter((tx) => tx.item_id === itemId) : inventoryTransactions;
    let query = supabase.from("inventory_transactions").select("*").order("created_at", { ascending: false });
    if (itemId) query = query.eq("item_id", itemId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async recordTransaction(input: { itemId: string; type: "In" | "Out" | "Transfer" | "Adjustment"; quantity: number; reference?: string; notes?: string; toLocation?: string }) {
    if (!(await shouldUseSupabase())) return null;
    const { data, error } = await supabase.rpc("record_inventory_transaction", {
      p_item_id: input.itemId,
      p_type: input.type.toLowerCase(),
      p_quantity: input.quantity,
      p_reference: input.reference || null,
      p_notes: input.notes || null,
      p_to_location: input.toLocation || null,
    });
    if (error) throw error;
    return data;
  },
};
