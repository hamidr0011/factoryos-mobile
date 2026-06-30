import { useNavigation } from "@react-navigation/native";
import { Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../components/ui/EmptyState";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { productionService } from "../../services/production.service";
import type { ProductionOrder } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";
import { getBottomSafePadding } from "../../utils/safeArea";
import { ChipRow, ProgressBar, ScreenContainer, SearchField, WorkCard } from "../shared/ScreenScaffold";

const filters = ["All", "Pending", "In Progress", "Completed"];

export const ProductionListScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const status = filter.toLowerCase().replaceAll(" ", "_");
  const { data = [], isRefetching, refetch } = useQuery({
    queryKey: ["production_orders", status],
    queryFn: () => productionService.getOrders(status),
    refetchInterval: 30_000,
  });

  const orders = useMemo(
    () =>
      (data as ProductionOrder[]).filter((order) => {
        const matchesSearch = `${order.order_number} ${order.product_name}`.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
      }),
    [data, search],
  );

  return (
    <ScreenContainer
      title="Production Orders"
      navigationMode="drawer"
      scroll={false}
      action={
        <PermissionGate area="production" level="write">
          <Pressable style={styles.fabSmall} onPress={() => navigation.navigate("CreateProductionOrder")}>
            <Plus color={colors.steel950} size={22} />
          </Pressable>
        </PermissionGate>
      }
    >
      <SearchField value={search} onChangeText={setSearch} placeholder="Search order or product" />
      <ChipRow items={filters} active={filter} onChange={setFilter} />
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: getBottomSafePadding(insets.bottom, 180) }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.amber400} />}
        ListEmptyComponent={
          <PermissionGate
            area="production"
            level="write"
            fallback={<EmptyState variant="production" title="No orders yet" />}
          >
            <EmptyState variant="production" title="No orders yet" cta="Create order" onPress={() => navigation.navigate("CreateProductionOrder")} />
          </PermissionGate>
        }
        renderItem={({ item }) => {
          const progress = (item.quantity_produced / item.quantity_planned) * 100;
          return (
            <WorkCard title={item.product_name} eyebrow={item.order_number} status={item.status} accentColor={item.priority === "critical" ? colors.red : colors.blue} onPress={() => navigation.navigate("OrderDetail", { order: item })}>
              <View style={styles.orderMeta}>
                <StatusBadge status={item.priority} />
                <Text style={styles.qty}>{item.quantity_produced.toLocaleString()} / {item.quantity_planned.toLocaleString()}</Text>
              </View>
              <ProgressBar value={progress} color={item.priority === "critical" ? colors.red : colors.blue} />
              <Text numberOfLines={1} style={styles.footerText}>
                {item.machine?.name || "Unassigned"} · {item.operator?.full_name || "No operator"} · Due {formatDate(item.end_date, "dd MMM")}
              </Text>
            </WorkCard>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingBottom: 180,
  },
  fabSmall: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  orderMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  qty: {
    color: colors.steel300,
    fontFamily: typography.mono,
    fontSize: 12,
  },
  footerText: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
});
