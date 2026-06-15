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
import type { ProductionOrder } from "../../types";
import { colors, productionOrders, spacing, typography } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";
import { DetailRow, ScreenContainer } from "../shared/ScreenScaffold";

export const OrderDetailScreen = () => {
  const route = useRoute<any>();
  const order: ProductionOrder = route.params?.order || productionOrders[0];
  const [sheet, setSheet] = useState(false);
  const progress = (order.quantity_produced / order.quantity_planned) * 100;

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
        <Button title="Put On Hold" variant="secondary" icon={<PauseCircle color={colors.steel100} size={18} />} />
        <Button title="Mark Complete" variant="secondary" icon={<CheckCircle2 color={colors.steel100} size={18} />} />
      </View>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Update Progress</Text>
          <Input label="Produced quantity" keyboardType="numeric" defaultValue="120" />
          <Input label="Notes" placeholder="Shift note, scrap reason, or audit note" />
          <Button title="Submit Update" icon={<RotateCcw color={colors.steel950} size={18} />} onPress={() => setSheet(false)} />
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
