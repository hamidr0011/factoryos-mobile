import { StyleSheet, Text, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import { colors, radii, spacing, typography } from "../../utils/constants";

const statusMap: Record<string, { color: string; label: string; live?: boolean }> = {
  running: { color: colors.inventory, label: "Running", live: true },
  in_stock: { color: colors.inventory, label: "In Stock" },
  low_stock: { color: colors.amber400, label: "Low Stock" },
  out_of_stock: { color: colors.maintenance, label: "Out" },
  idle: { color: colors.steel500, label: "Idle" },
  maintenance: { color: colors.amber400, label: "Maintenance" },
  breakdown: { color: colors.maintenance, label: "Breakdown" },
  in_progress: { color: colors.production, label: "In Progress", live: true },
  pending: { color: colors.amber400, label: "Pending" },
  completed: { color: colors.steel500, label: "Completed" },
  critical: { color: colors.maintenance, label: "Critical", live: true },
  high: { color: colors.amber400, label: "High" },
  medium: { color: colors.production, label: "Medium" },
  low: { color: colors.steel300, label: "Low" },
  approved: { color: colors.inventory, label: "Approved" },
  rejected: { color: colors.maintenance, label: "Rejected" },
  paid: { color: colors.production, label: "Paid" },
  pass: { color: colors.inventory, label: "Pass" },
  fail: { color: colors.maintenance, label: "Fail" },
  conditional: { color: colors.amber400, label: "Conditional" },
  open: { color: colors.amber400, label: "Open" },
  on_hold: { color: colors.amber400, label: "On Hold" },
  cancelled: { color: colors.maintenance, label: "Cancelled" },
};

export const statusPalette = (status: string) => statusMap[status] || { color: colors.steel300, label: status.replaceAll("_", " ") };

export const StatusBadge = ({ status }: { status: string }) => {
  const pulse = useSharedValue(0);
  const config = statusPalette(status);

  useEffect(() => {
    if (config.live) {
      pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    }
  }, [config.live, pulse]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: config.live ? interpolate(pulse.value, [0, 1], [0.35, 1]) : 1,
    transform: [{ scale: config.live ? interpolate(pulse.value, [0, 1], [0.8, 1.3]) : 1 }],
  }));

  return (
    <View style={[styles.badge, { borderColor: `${config.color}55`, backgroundColor: `${config.color}1F` }]}>
      <Animated.View style={[styles.dot, { backgroundColor: config.color }, dotStyle]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.cell,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 24,
    paddingHorizontal: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: typography.display,
    fontSize: 10,
    letterSpacing: 0,
  },
});
