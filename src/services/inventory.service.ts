import { inventoryItems, inventoryTransactions } from "../utils/constants";
import { isSupabaseConfigured, supabase } from "./supabase";

export const inventoryService = {
  async getItems() {
    if (!isSupabaseConfigured) return inventoryItems;
    const { data, error } = await supabase.from("inventory_items").select("*, supplier:suppliers(*)").order("name");
    if (error) throw error;
    return data;
  },

  async getTransactions(itemId?: string) {
    if (!isSupabaseConfigured) return itemId ? inventoryTransactions.filter((tx) => tx.item_id === itemId) : inventoryTransactions;
    let query = supabase.from("inventory_transactions").select("*").order("created_at", { ascending: false });
    if (itemId) query = query.eq("item_id", itemId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};
