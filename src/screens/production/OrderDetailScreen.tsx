import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "@react-navigation/native";
import { CheckCircle2, PauseCircle, Plus, RotateCcw } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GaugeChart } from "../../components/charts/GaugeChart";
import { Button } from "../../components/ui/Button";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { productionService } from "../../services/production.service";
import { useAppStore } from "../../store/appStore";
import type { ProductionLog, ProductionOrder } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";
import { DetailRow, ScreenContainer } from "../shared/ScreenScaffold";

export const OrderDetailScreen = () => {
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const order = route.params?.order as ProductionOrder | undefined;
  const [sheet, setSheet] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const progress = order ? (order.quantity_produced / order.quantity_planned) * 100 : 0;
  const { data: logData = [] } = useQuery({
    queryKey: ["production_logs", order?.id],
    queryFn: () => productionService.getOrderLogs(order!.id),
    enabled: Boolean(order?.id),
  });
  const logs = logData as ProductionLog[];
  const refreshProduction = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["production_orders"] }),
      queryClient.invalidateQueries({ queryKey: ["machines"] }),
      queryClient.invalidateQueries({ queryKey: ["production_logs", order?.id] }),
    ]);
  };

  const progressMutation = useMutation({
    mutationFn: () => {
      if (!order) throw new Error("No production order selected.");
      return productionService.updateProgress(order.id, Number(quantity), notes.trim() || undefined);
    },
    onSuccess: async () => {
      await refreshProduction();
      setSheet(false);
      showToast("success", "Production progress updated.");
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not update production progress.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: ProductionOrder["status"]) => {
      if (!order) throw new Error("No production order selected.");
      return productionService.updateStatus(order.id, status, notes.trim() || undefined);
    },
    onSuccess: async () => {
      await refreshProduction();
      showToast("success", "Production order status updated.");
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not update order status.");
    },
  });

  const submitProgress = () => {
    const parsed = Number(quantity);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      showToast("warning", "Enter a produced quantity greater than zero.");
      return;
    }
    progressMutation.mutate();
  };

  if (!order) {
    return (
      <ScreenContainer title="Order Detail">
        <EmptyState variant="production" title="No order selected" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title={order.order_number} subtitle={order.product_name}>
      <Card style={styles.hero} accentColor={order.priority === "critical" ? colors.red : colors.blue}>
        <View style={styles.heroHead}>
          <StatusBadge status={order.status} />
          <StatusBadge status={order.priority} />
        </View>
        <View style={styles.progressRow}>
          <GaugeChart value={progress} color={colors.blue} label="complete" />
          <View style={styles.progressCopy}>
            <Text style={styles.big}>{order.quantity_produced.toLocaleString()}</Text>
            <Text numberOfLines={1} style={styles.muted}>of {order.quantity_planned.toLocaleString()} units</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Machine Assignment</Text>
        <DetailRow label="Machine" value={order.machine?.name || "Unassigned"} />
        <DetailRow label="Operator" value={order.operator?.full_name || "No operator"} />
        <DetailRow label="Start" value={formatDate(order.start_date, "dd MMM HH:mm")} />
        <DetailRow label="Target" value={formatDate(order.end_date, "dd MMM HH:mm")} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {logs.length ? (
          logs.map((log) => (
            <View key={log.id} style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: colors.amber400 }]} />
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineTitle}>
                  +{Number(log.quantity_delta).toLocaleString()} units logged · {Number(log.quantity_after).toLocaleString()} total
                </Text>
                <Text style={styles.timelineMeta}>
                  {formatDate(log.created_at, "dd MMM HH:mm")}
                  {log.entered_by?.full_name ? ` · ${log.entered_by.full_name}` : ""}
                </Text>
                {log.notes ? <Text numberOfLines={2} style={styles.timelineNotes}>{log.notes}</Text> : null}
              </View>
            </View>
          ))
        ) : (
          <EmptyState variant="production" title="No progress logs" />
        )}
      </Card>

      <View style={styles.actions}>
        <Button title="Update Progress" icon={<Plus color={colors.steel950} size={18} />} onPress={() => setSheet(true)} />
        <Button title="Put On Hold" variant="secondary" icon={<PauseCircle color={colors.steel100} size={18} />} loading={statusMutation.isPending} onPress={() => statusMutation.mutate("on_hold")} />
        <Button title="Mark Complete" variant="secondary" icon={<CheckCircle2 color={colors.steel100} size={18} />} loading={statusMutation.isPending} onPress={() => statusMutation.mutate("completed")} />
      </View>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Update Progress</Text>
          <Input label="Produced quantity" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
          <Input label="Notes" placeholder="Shift note, scrap reason, or audit note" value={notes} onChangeText={setNotes} />
          <Button title="Submit Update" icon={<RotateCcw color={colors.steel950} size={18} />} loading={progressMutation.isPending} onPress={submitProgress} />
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
  },
  heroHead: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
  },
  progressCopy: {
    flex: 1,
  },
  big: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 24,
    lineHeight: 30,
  },
  muted: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 15,
  },
  timelineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
  },
  timelineDot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  timelineCopy: {
    flex: 1,
  },
  timelineTitle: {
    color: colors.steel100,
    fontFamily: typography.bodyMedium,
    fontSize: 12,
  },
  timelineMeta: {
    color: colors.steel500,
    fontFamily: typography.mono,
    fontSize: 11,
  },
  timelineNotes: {
    color: colors.steel300,
    fontFamily: typography.body,
    fontSize: 11,
    marginTop: 3,
  },
  actions: {
    gap: spacing.sm,
  },
  sheetContent: {
    gap: spacing.md,
  },
  sheetTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 18,
  },
});
