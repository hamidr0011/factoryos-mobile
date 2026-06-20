import { useQuery } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Minus, Plus, SlidersHorizontal } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "../../components/charts/LineChart";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { inventoryService } from "../../services/inventory.service";
import { colors, spacing, typography } from "../../utils/constants";
import type { InventoryItem, InventoryTransaction } from "../../types";
import { DetailRow, ProgressBar, ScreenContainer, WorkCard } from "../shared/ScreenScaffold";

export const ItemDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const item = route.params?.item as InventoryItem | undefined;
  const { data: transactions = [] } = useQuery({
    queryKey: ["inventory_transactions", item?.id],
    queryFn: () => inventoryService.getTransactions(item!.id),
    enabled: Boolean(item?.id),
  });
  const itemTransactions = useMemo(
    () => (transactions as InventoryTransaction[]).filter((tx) => tx.item_id === item?.id),
    [item?.id, transactions],
  );
  const movement = useMemo(
    () =>
      itemTransactions.slice(-7).map((tx) => ({
        label: new Date(tx.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
        value: Math.abs(Number(tx.quantity || 0)),
      })),
    [itemTransactions],
  );

  if (!item) {
    return (
      <ScreenContainer title="Item Detail">
        <EmptyState variant="inventory" title="No item selected" />
      </ScreenContainer>
    );
  }

  const ratio = item.reorder_level ? Math.min(100, (item.quantity_on_hand / (item.reorder_level * 3)) * 100) : 0;
  const color = ratio < 20 ? colors.red : ratio < 50 ? colors.orange : colors.blue;
  const openTransaction = (type: "In" | "Out" | "Adjustment") => {
    navigation.navigate("StockTransaction", { item, type });
  };

  return (
    <ScreenContainer title={item.name} subtitle={item.sku}>
      <Card style={styles.stock} accentColor={color}>
        <Text style={[styles.quantity, { color }]}>{item.quantity_on_hand.toLocaleString()}</Text>
        <Text style={styles.unit}>{item.unit} on hand</Text>
        <ProgressBar value={ratio} color={color} />
        <DetailRow label="Warehouse" value={item.warehouse_location} />
        <DetailRow label="Category" value={item.category} />
        <DetailRow label="Unit cost" value={`PKR ${item.unit_cost.toLocaleString()}`} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>30-day Stock Movement</Text>
        {movement.length ? <LineChart data={movement} color={colors.blue} /> : <EmptyState variant="inventory" title="No stock movement" />}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {itemTransactions.length ? (
          itemTransactions.map((tx) => (
            <WorkCard
              key={tx.id}
              title={tx.reference || (tx.type === "in" ? "Receive Stock" : tx.type === "out" ? "Issue Stock" : "Stock Adjustment")}
              eyebrow={tx.type.toUpperCase()}
              accentColor={tx.type === "in" ? colors.emerald : tx.type === "out" ? colors.red : colors.blue}
            >
              <Text style={styles.txQty}>{tx.quantity > 0 ? "+" : ""}{tx.quantity} {item.unit}</Text>
            </WorkCard>
          ))
        ) : (
          <EmptyState variant="inventory" title="No transactions" />
        )}
      </Card>

      <View style={styles.actions}>
        <Button title="Stock In" icon={<Plus color={colors.steel950} size={18} />} onPress={() => openTransaction("In")} />
        <Button title="Stock Out" variant="secondary" icon={<Minus color={colors.steel100} size={18} />} onPress={() => openTransaction("Out")} />
        <Button title="Adjust" variant="secondary" icon={<SlidersHorizontal color={colors.steel100} size={18} />} onPress={() => openTransaction("Adjustment")} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  stock: {
    gap: spacing.sm,
  },
  quantity: {
    fontFamily: typography.display,
    fontSize: 32,
    lineHeight: 38,
  },
  unit: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 16,
  },
  txQty: {
    color: colors.steel300,
    fontFamily: typography.mono,
    fontSize: 12,
  },
  actions: {
    gap: spacing.sm,
  },
});
