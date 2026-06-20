import { Bell, Menu } from "lucide-react-native";
import { format } from "date-fns";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../../utils/constants";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";

export const Header = ({ title, subtitle, onMenu }: { title?: string; subtitle?: string; onMenu?: () => void }) => {
  const insets = useSafeAreaInsets();
  const unreadCount = useAppStore((state) => state.unreadCount);
  const profile = useAuthStore((state) => state.profile);
  const defaultSubtitle = `${format(new Date(), "EEEE, d MMMM")} · ${profile?.department || "Operations"}`;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topActions}>
        <Pressable style={styles.iconButton} onPress={onMenu}>
          <Menu color={colors.steel100} size={22} />
        </Pressable>
        <View style={styles.rightActions}>
          <View style={styles.bellWrap}>
            <Bell color={colors.steel100} size={21} />
            {unreadCount ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.full_name?.slice(0, 1) || "F"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.oneUiTitleArea}>
        <Text adjustsFontSizeToFit minimumFontScale={0.88} numberOfLines={2} style={styles.title}>{title || `Good morning, ${profile?.full_name?.split(" ")[0] || "FactoryOS"}`}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>{subtitle || defaultSubtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.steel950,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  topActions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rightActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  oneUiTitleArea: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  title: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 29,
  },
  subtitle: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: spacing.xxs,
  },
  bellWrap: {
    alignItems: "center",
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.red,
    borderRadius: 8,
    height: 16,
    justifyContent: "center",
    position: "absolute",
    right: 4,
    top: 4,
    minWidth: 16,
  },
  badgeText: {
    color: "#FFFFFF",
    fontFamily: typography.display,
    fontSize: 9,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarText: {
    color: "#FFFFFF",
    fontFamily: typography.display,
    fontSize: 16,
  },
});
