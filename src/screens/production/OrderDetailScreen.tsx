import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "@react-navigation/native";
import { CheckCircle2, PauseCircle, Plus, RotateCcw } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GaugeChart } from "../../components/charts/GaugeChart";
import { Button } from "../../components/ui/Button";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { productionService } from "../../services/production.service";
import { useAppStore } from "../../store/appStore";
import type { ProductionOrder } from "../../types";
import { colors, productionOrders, spacing, typography } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";
import { DetailRow, ScreenContainer } from "../shared/ScreenScaffold";

export const OrderDetailScreen = () => {
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const order: ProductionOrder = route.params?.order || productionOrders[0];
  const [sheet, setSheet] = useState(false);
  const [quantity, setQuantity] = useState("120");
  const [notes, setNotes] = useState("");
  const progress = (order.quantity_produced / order.quantity_planned) * 100;
  const refreshProduction = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["production_orders"] }),
      queryClient.invalidateQueries({ queryKey: ["machines"] }),
    ]);
  };

  const progressMutation = useMutation({
    mutationFn: () => productionService.updateProgress(order.id, Number(quantity), notes.trim() || undefined),
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
    mutationFn: (status: ProductionOrder["status"]) => productionService.updateStatus(order.id, status, notes.trim() || undefined),
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

  return (
    <ScreenContainer title={order.order_number} subtitle={order.product_name}>
      <Card style={styles.hero} accentColor={order.priority === "critical" ? colors.maintenance : colors.production}>
        <View style={styles.heroHead}>
          <StatusBadge status={order.status} />
          <StatusBadge status={order.priority} />
        </View>
        <View style={styles.progressRow}>
          <GaugeChart value={progress} color={colors.production} label="complete" />
          <View style={styles.progressCopy}>
            <Text style={styles.big}>{order.quantity_produced.toLocaleString()}</Text>
            <Text style={styles.muted}>of {order.quantity_planned.toLocaleString()} units produced</Text>
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
        {["Order released", "Material staged", "Line running", "Quality sample pulled"].map((event, index) => (
          <View key={event} style={styles.timelineRow}>
            <View style={[styles.timelineDot, { backgroundColor: index < 3 ? colors.amber400 : colors.steel700 }]} />
            <View>
              <Text style={styles.timelineTitle}>{event}</Text>
              <Text style={styles.timelineMeta}>{formatDate(order.created_at, "dd MMM HH:mm")}</Text>
            </View>
          </View>
        ))}
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
    fontSize: 36,
  },
  muted: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 13,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 17,
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
  timelineTitle: {
    color: colors.steel100,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  timelineMeta: {
    color: colors.steel500,
    fontFamily: typography.mono,
    fontSize: 11,
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
    fontSize: 22,
  },
});
