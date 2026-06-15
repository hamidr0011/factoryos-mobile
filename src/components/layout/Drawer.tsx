import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { LogOut, Settings } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { colors, modules, spacing, typography } from "../../utils/constants";
import { ModuleIconMark } from "../visuals/ModuleArtwork";

export const CustomDrawer = ({ navigation }: DrawerContentComponentProps) => {
  const insets = useSafeAreaInsets();
  const { profile, logout } = useAuth();
  const tabModules = new Set(["Production", "Inventory", "HR"]);

  const openModule = (screen: string) => {
    if (tabModules.has(screen)) {
      navigation.navigate("MainTabs", { screen });
      return;
    }

    navigation.navigate(screen);
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.full_name?.slice(0, 1) || "F"}</Text>
        </View>
        <View>
          <Text style={styles.name}>{profile?.full_name || "FactoryOS User"}</Text>
          <Text style={styles.meta}>
            {profile?.role || "viewer"} · {profile?.department || "Operations"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        {modules.map((module) => (
          <Pressable key={module.id} style={styles.item} onPress={() => openModule(module.screen)}>
            <View style={[styles.moduleIcon, { backgroundColor: `${module.color}12`, borderColor: `${module.color}30` }]}>
              <ModuleIconMark id={module.id} color={module.color} size={28} />
            </View>
            <Text style={styles.itemText}>{module.label}</Text>
            <Text style={styles.itemStat}>Open</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.footerItem} onPress={() => navigation.navigate("Settings")}>
          <Settings color={colors.steel300} size={19} />
          <Text style={styles.footerText}>Settings</Text>
        </Pressable>
        <Pressable style={styles.footerItem} onPress={logout}>
          <LogOut color={colors.amber400} size={19} />
          <Text style={[styles.footerText, { color: colors.amber400 }]}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.steel950,
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  profile: {
    alignItems: "center",
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderBottomColor: colors.steel700,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarText: {
    color: colors.steel950,
    fontFamily: typography.display,
    fontSize: 24,
  },
  name: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 16,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: 2,
    textTransform: "capitalize",
  },
  section: {
    gap: spacing.xs,
    paddingTop: spacing.lg,
  },
  item: {
    alignItems: "center",
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  moduleIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  itemText: {
    color: colors.steel100,
    flex: 1,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
  },
  itemStat: {
    color: colors.steel500,
    fontFamily: typography.mono,
    fontSize: 11,
  },
  footer: {
    borderTopColor: colors.steel700,
    borderTopWidth: 1,
    gap: spacing.xs,
    marginTop: "auto",
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  footerItem: {
    alignItems: "center",
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  footerText: {
    color: colors.steel300,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
  },
});
