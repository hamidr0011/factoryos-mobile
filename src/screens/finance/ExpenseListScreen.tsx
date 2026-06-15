import { useNavigation } from "@react-navigation/native";
import { Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../components/ui/EmptyState";
import { financeService } from "../../services/finance.service";
import type { Expense } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { ChipRow, ScreenContainer, SearchField, WorkCard } from "../shared/ScreenScaffold";

const statuses = ["All", "Pending", "Approved", "Rejected", "Paid"];

export const ExpenseListScreen = () => {
  const navigation = useNavigation<any>();
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const { data = [] } = useQuery({ queryKey: ["expenses"], queryFn: financeService.getExpenses });

  const expenses = useMemo(
    () =>
      (data as Expense[]).filter((expense) => {
        const matchesStatus = status === "All" || expense.status === status.toLowerCase();
        const matchesSearch = `${expense.description} ${expense.category} ${expense.department}`.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
      }),
    [data, search, status],
  );

  return (
    <ScreenContainer
      title="Expenses"
      subtitle="Approvals and receipts"
      scroll={false}
      action={
        <Pressable style={styles.fabSmall}>
          <Plus color={colors.steel950} size={22} />
        </Pressable>
      }
    >
      <SearchField value={search} onChangeText={setSearch} placeholder="Search expenses" />
      <ChipRow items={statuses} active={status} onChange={setStatus} />
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState variant="finance" title="No expenses recorded" subtitle="Log your first expense" cta="New expense" />}
        renderItem={({ item }) => (
          <WorkCard title={item.description} eyebrow={`${item.category} · ${formatDate(item.date)}`} status={item.status} accentColor={item.status === "pending" ? colors.amber400 : item.status === "rejected" ? colors.maintenance : colors.finance}>
            <View style={styles.row}>
              <Text style={styles.amount}>{formatCurrency(item.amount, item.currency)}</Text>
              <Text style={styles.meta}>{item.department}</Text>
            </View>
          </WorkCard>
        )}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
  amount: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 19,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
});
