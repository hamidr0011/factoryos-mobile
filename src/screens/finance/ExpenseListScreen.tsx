import { Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { financeService } from "../../services/finance.service";
import { useAppStore } from "../../store/appStore";
import type { Expense } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { getBottomSafePadding } from "../../utils/safeArea";
import { ChipRow, ScreenContainer, SearchField, WorkCard } from "../shared/ScreenScaffold";

const statuses = ["All", "Pending", "Approved", "Rejected", "Paid"];

export const ExpenseListScreen = () => {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const showToast = useAppStore((state) => state.showToast);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [department, setDepartment] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { data = [], isRefetching, refetch } = useQuery({ queryKey: ["expenses"], queryFn: financeService.getExpenses });
  const refreshFinance = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["budgets"] }),
    ]);
  };
  const createMutation = useMutation({
    mutationFn: () =>
      financeService.createExpense({
        category,
        description,
        amount: Number(amount),
        date,
        department,
      }),
    onSuccess: async () => {
      await refreshFinance();
      setCreateOpen(false);
      setCategory("");
      setDescription("");
      setAmount("");
      setDepartment("");
      setDate(new Date().toISOString().slice(0, 10));
      showToast("success", "Expense submitted for approval.");
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not submit expense.");
    },
  });
  const reviewMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: "approved" | "rejected" | "paid" }) => financeService.reviewExpense(id, nextStatus),
    onSuccess: async () => {
      await refreshFinance();
      showToast("success", "Expense status updated.");
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not update expense.");
    },
  });

  const submitExpense = () => {
    const parsed = Number(amount);
    if (!category.trim() || !description.trim() || !department.trim() || !date || !Number.isFinite(parsed) || parsed <= 0) {
      showToast("warning", "Enter category, description, amount, date, and department.");
      return;
    }
    createMutation.mutate();
  };

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
      navigationMode="back"
      scroll={false}
      action={
        <PermissionGate area="finance" level="write">
          <Pressable style={styles.fabSmall} onPress={() => setCreateOpen(true)}>
            <Plus color={colors.steel950} size={22} />
          </Pressable>
        </PermissionGate>
      }
    >
      <SearchField value={search} onChangeText={setSearch} placeholder="Search expenses" />
      <ChipRow items={statuses} active={status} onChange={setStatus} />
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: getBottomSafePadding(insets.bottom, 180) }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.blue} />}
        ListEmptyComponent={
          <PermissionGate
            area="finance"
            level="write"
            fallback={<EmptyState variant="finance" title="No expenses recorded" />}
          >
            <EmptyState variant="finance" title="No expenses recorded" cta="Submit expense" onPress={() => setCreateOpen(true)} />
          </PermissionGate>
        }
        renderItem={({ item }) => {
          const isReviewing = reviewMutation.isPending && reviewMutation.variables?.id === item.id;
          return (
            <WorkCard title={item.description} eyebrow={`${item.category} · ${formatDate(item.date)}`} status={item.status} accentColor={item.status === "pending" ? colors.orange : item.status === "rejected" ? colors.red : colors.blue}>
              <View style={styles.row}>
                <Text style={styles.amount}>{formatCurrency(item.amount, item.currency)}</Text>
                <Text numberOfLines={1} style={styles.meta}>{item.department}</Text>
              </View>
              {item.status === "pending" ? (
                <PermissionGate area="finance" level="approve">
                  <View style={styles.reviewRow}>
                    <Button title="Approve" variant="secondary" style={styles.reviewButton} loading={isReviewing} onPress={() => reviewMutation.mutate({ id: item.id, nextStatus: "approved" })} />
                    <Button title="Reject" variant="ghost" style={styles.reviewButton} loading={isReviewing} onPress={() => reviewMutation.mutate({ id: item.id, nextStatus: "rejected" })} />
                  </View>
                </PermissionGate>
              ) : null}
              {item.status === "approved" ? (
                <PermissionGate area="finance" level="approve">
                  <Button title="Mark Paid" variant="secondary" loading={isReviewing} onPress={() => reviewMutation.mutate({ id: item.id, nextStatus: "paid" })} />
                </PermissionGate>
              ) : null}
            </WorkCard>
          );
        }}
      />
      <BottomSheet visible={createOpen} onClose={() => setCreateOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Submit Expense</Text>
          <Input label="Category" value={category} onChangeText={setCategory} />
          <Input label="Description" value={description} onChangeText={setDescription} />
          <Input label="Amount" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <Input label="Date" value={date} onChangeText={setDate} />
          <Input label="Department" value={department} onChangeText={setDepartment} />
          <Button title="Submit for Approval" loading={createMutation.isPending} onPress={submitExpense} />
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  fabSmall: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    width: 48,
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
  reviewRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  reviewButton: {
    flex: 1,
  },
  sheet: {
    gap: spacing.md,
  },
  sheetTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 18,
  },
  amount: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 15,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 11,
  },
});
