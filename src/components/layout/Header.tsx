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
  const defaultSubtitle = `${format(new Date(), "EEEE, d MMMM")} · ${profile?.department || "Factory Floor A"}`;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <Pressable style={styles.iconButton} onPress={onMenu}>
          <Menu color={colors.steel100} size={22} />
        </Pressable>
        <View style={styles.copy}>
          <Text style={styles.title}>{title || `Good morning, ${profile?.full_name?.split(" ")[0] || "Supervisor"}`}</Text>
          <Text style={styles.subtitle}>{subtitle || defaultSubtitle}</Text>
        </View>
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
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.steel950,
    borderBottomColor: colors.steel700,
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 16,
  },
  subtitle: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: 2,
  },
  bellWrap: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 8,
    height: 16,
    justifyContent: "center",
    position: "absolute",
    right: 5,
    top: 5,
    minWidth: 16,
  },
  badgeText: {
    color: colors.steel950,
    fontFamily: typography.display,
    fontSize: 9,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  avatarText: {
    color: colors.steel950,
    fontFamily: typography.display,
    fontSize: 18,
  },
});
