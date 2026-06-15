import { useNavigation } from "@react-navigation/native";
import { Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { inventoryService } from "../../services/inventory.service";
import type { InventoryItem } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { ChipRow, MetricPill, ProgressBar, ScreenContainer, SearchField, WorkCard } from "../shared/ScreenScaffold";

const categories = ["All", "Raw Material", "Packaging", "Finished", "Spare Parts"];

export const InventoryListScreen = () => {
  const navigation = useNavigation<any>();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const { data = [] } = useQuery({ queryKey: ["inventory_items"], queryFn: inventoryService.getItems });

  const items = useMemo(
    () =>
      (data as InventoryItem[]).filter((item) => {
        const searchMatch = `${item.sku} ${item.name}`.toLowerCase().includes(search.toLowerCase());
        const categoryMatch = category === "All" || item.category === category;
        return searchMatch && categoryMatch;
      }),
    [category, data, search],
  );

  const lowStock = (data as InventoryItem[]).filter((item) => item.quantity_on_hand > 0 && item.quantity_on_hand <= item.reorder_level).length;
  const outStock = (data as InventoryItem[]).filter((item) => item.quantity_on_hand <= 0).length;

  return (
    <ScreenContainer
      title="Inventory"
      subtitle="Materials, spare parts, and finished goods"
      navigationMode="drawer"
      scroll={false}
      action={
        <Pressable style={styles.fabSmall} onPress={() => navigation.navigate("StockTransaction")}>
          <Plus color={colors.steel950} size={22} />
        </Pressable>
      }
    >
      <View style={styles.metrics}>
        <MetricPill label="Total SKUs" value={(data as InventoryItem[]).length.toString()} color={colors.inventory} />
        <MetricPill label="Low Stock" value={lowStock.toString()} color={colors.amber400} />
        <MetricPill label="Out" value={outStock.toString()} color={colors.maintenance} />
      </View>
      <SearchField value={search} onChangeText={setSearch} placeholder="Search SKU or item" />
      <ChipRow items={categories} active={category} onChange={setCategory} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState variant="inventory" title="Inventory is empty" subtitle="Add your first item" cta="Add item" />}
        renderItem={({ item }) => {
          const stockRatio = item.reorder_level ? Math.min(100, (item.quantity_on_hand / (item.reorder_level * 3)) * 100) : 80;
          const danger = item.quantity_on_hand <= 0;
          const low = item.quantity_on_hand > 0 && item.quantity_on_hand <= item.reorder_level;
          return (
            <WorkCard title={item.name} eyebrow={item.sku} accentColor={danger ? colors.maintenance : low ? colors.amber400 : colors.inventory} onPress={() => navigation.navigate("ItemDetail", { item })}>
              <View style={styles.row}>
                <Text style={styles.qty}>{item.quantity_on_hand.toLocaleString()} {item.unit}</Text>
                {danger ? <StatusBadge status="out_of_stock" /> : low ? <StatusBadge status="low_stock" /> : <StatusBadge status="in_stock" />}
              </View>
              <ProgressBar value={stockRatio} color={danger ? colors.maintenance : low ? colors.amber400 : colors.inventory} />
              <Text style={styles.meta}>{item.category} · {item.warehouse_location} · Reorder {item.reorder_level}</Text>
            </WorkCard>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  metrics: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  fabSmall: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  list: {
    gap: spacing.md,
    paddingBottom: 180,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  qty: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 20,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
});
