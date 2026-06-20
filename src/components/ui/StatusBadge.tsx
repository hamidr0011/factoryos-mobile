import { StyleSheet, Text, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import { colors, radii, spacing, typography } from "../../utils/constants";

const statusMap: Record<string, { color: string; label: string; live?: boolean }> = {
  running: { color: colors.emerald, label: "Running", live: true },
  in_stock: { color: colors.emerald, label: "In Stock" },
  low_stock: { color: colors.orange, label: "Low Stock" },
  out_of_stock: { color: colors.red, label: "Out" },
  idle: { color: colors.steel500, label: "Idle" },
  maintenance: { color: colors.orange, label: "Maintenance" },
  breakdown: { color: colors.red, label: "Breakdown" },
  in_progress: { color: colors.blue, label: "In Progress", live: true },
  pending: { color: colors.orange, label: "Pending" },
  completed: { color: colors.steel500, label: "Completed" },
  critical: { color: colors.red, label: "Critical", live: true },
  high: { color: colors.orange, label: "High" },
  medium: { color: colors.blue, label: "Medium" },
  low: { color: colors.steel300, label: "Low" },
  approved: { color: colors.emerald, label: "Approved" },
  rejected: { color: colors.red, label: "Rejected" },
  paid: { color: colors.blue, label: "Paid" },
  pass: { color: colors.emerald, label: "Pass" },
  fail: { color: colors.red, label: "Fail" },
  conditional: { color: colors.orange, label: "Conditional" },
  open: { color: colors.orange, label: "Open" },
  on_hold: { color: colors.orange, label: "On Hold" },
  cancelled: { color: colors.red, label: "Cancelled" },
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
