import { Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../../utils/constants";
import { getBottomSafePadding } from "../../utils/safeArea";
import { useAppStore } from "../../store/appStore";

export const ToastHost = () => {
  const insets = useSafeAreaInsets();
  const toast = useAppStore((state) => state.toast);
  const clearToast = useAppStore((state) => state.clearToast);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(clearToast, 3600);
    return () => clearTimeout(timer);
  }, [clearToast, toast]);

  if (!toast) return null;

  const color = toast.tone === "success" ? colors.emerald : toast.tone === "warning" ? colors.orange : colors.red;
  return (
    <View style={[styles.toast, { borderColor: `${color}66`, bottom: getBottomSafePadding(insets.bottom, spacing.xl) }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.message}>{toast.message}</Text>
      <Pressable onPress={clearToast} style={styles.retry}>
        <Text style={[styles.retryText, { color }]}>Dismiss</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    left: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    position: "absolute",
    right: spacing.md,
  },
  dot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  message: {
    color: colors.steel100,
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  retry: {
    justifyContent: "center",
    minHeight: 44,
  },
  retryText: {
    fontFamily: typography.display,
    fontSize: 12,
  },
});
