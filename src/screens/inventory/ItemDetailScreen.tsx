import { useQuery } from "@tanstack/react-query";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Minus, Plus, SlidersHorizontal } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "../../components/charts/LineChart";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { inventoryService } from "../../services/inventory.service";
import { inventoryItems, inventoryTransactions, colors, spacing, typography } from "../../utils/constants";
import type { InventoryItem } from "../../types";
import { DetailRow, ProgressBar, ScreenContainer, WorkCard } from "../shared/ScreenScaffold";

const movement = [
  { label: "D-6", value: 118 },
  { label: "D-5", value: 132 },
  { label: "D-4", value: 126 },
  { label: "D-3", value: 151 },
  { label: "D-2", value: 140 },
  { label: "D-1", value: 148 },
  { label: "Now", value: 122 },
];

export const ItemDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const item: InventoryItem = route.params?.item || inventoryItems[0];
  const { data: transactions = inventoryTransactions } = useQuery({
    queryKey: ["inventory_transactions", item.id],
    queryFn: () => inventoryService.getTransactions(item.id),
  });
  const ratio = item.reorder_level ? Math.min(100, (item.quantity_on_hand / (item.reorder_level * 3)) * 100) : 80;
  const color = ratio < 20 ? colors.maintenance : ratio < 50 ? colors.amber400 : colors.inventory;
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
        <LineChart data={movement} color={colors.inventory} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {transactions.filter((tx) => tx.item_id === item.id).map((tx) => (
          <WorkCard key={tx.id} title={tx.reference} eyebrow={tx.type.toUpperCase()} accentColor={tx.type === "in" ? colors.inventory : tx.type === "out" ? colors.maintenance : colors.production}>
            <Text style={styles.txQty}>{tx.quantity > 0 ? "+" : ""}{tx.quantity} {item.unit}</Text>
          </WorkCard>
        ))}
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
    fontSize: 48,
  },
  unit: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 13,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 17,
  },
  txQty: {
    color: colors.steel300,
    fontFamily: typography.mono,
    fontSize: 13,
  },
  actions: {
    gap: spacing.sm,
  },
});
