import { Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
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
import { ChipRow, ScreenContainer, SearchField, WorkCard } from "../shared/ScreenScaffold";

const statuses = ["All", "Pending", "Approved", "Rejected", "Paid"];

export const ExpenseListScreen = () => {
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [category, setCategory] = useState("Maintenance");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [department, setDepartment] = useState("Operations");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { data = [] } = useQuery({ queryKey: ["expenses"], queryFn: financeService.getExpenses });
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
      setDescription("");
      setAmount("");
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
      subtitle="Approvals and receipts"
      scroll={false}
      action={
        <Pressable style={styles.fabSmall} onPress={() => setCreateOpen(true)}>
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
            {item.status === "pending" ? (
              <PermissionGate roles={["admin", "manager", "supervisor"]}>
                <View style={styles.reviewRow}>
                  <Button title="Approve" variant="secondary" style={styles.reviewButton} loading={reviewMutation.isPending} onPress={() => reviewMutation.mutate({ id: item.id, nextStatus: "approved" })} />
                  <Button title="Reject" variant="ghost" style={styles.reviewButton} loading={reviewMutation.isPending} onPress={() => reviewMutation.mutate({ id: item.id, nextStatus: "rejected" })} />
                </View>
              </PermissionGate>
            ) : null}
            {item.status === "approved" ? (
              <PermissionGate roles={["admin", "manager", "supervisor"]}>
                <Button title="Mark Paid" variant="secondary" loading={reviewMutation.isPending} onPress={() => reviewMutation.mutate({ id: item.id, nextStatus: "paid" })} />
              </PermissionGate>
            ) : null}
          </WorkCard>
        )}
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
    fontSize: 22,
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
