import { useNavigation } from "@react-navigation/native";
import { Home, MoreHorizontal } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../../utils/constants";
import { ModuleIconMark } from "../visuals/ModuleArtwork";

const items = [
  { route: "Dashboard", label: "Dashboard", moduleId: null },
  { route: "Production", label: "Production", moduleId: "production" },
  { route: "Inventory", label: "Inventory", moduleId: "inventory" },
  { route: "HR", label: "HR", moduleId: "hr" },
  { route: "More", label: "More", moduleId: null },
] as const;

const findDrawerNavigation = (navigation: any) => {
  let current = navigation;

  while (current) {
    if (typeof current.openDrawer === "function") return current;
    current = current.getParent?.();
  }

  return undefined;
};

export const PersistentBottomNav = ({ activeRoute = "More" }: { activeRoute?: string }) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const drawerNavigation = findDrawerNavigation(navigation);
  const bottomPad = Math.max(insets.bottom, spacing.sm);

  const openRoute = (route: string) => {
    if (route === "More") {
      drawerNavigation?.openDrawer?.();
      return;
    }

    drawerNavigation?.navigate?.("MainTabs", { screen: route });
  };

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      {items.map((item) => {
        const focused = activeRoute === item.route || (activeRoute === "More" && item.route === "More");
        const Icon = item.route === "Dashboard" ? Home : MoreHorizontal;
        return (
          <Pressable key={item.route} accessibilityRole="button" style={styles.item} onPress={() => openRoute(item.route)}>
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              {item.moduleId ? (
                <ModuleIconMark id={item.moduleId} color={focused ? colors.amber400 : colors.steel300} size={23} />
              ) : (
                <Icon color={focused ? colors.amber400 : colors.steel300} size={item.route === "More" ? 24 : 21} />
              )}
            </View>
            <Text numberOfLines={1} style={[styles.label, { color: focused ? colors.amber400 : colors.steel500 }]}>
              {item.label}
            </Text>
            <View style={[styles.underline, { opacity: focused ? 1 : 0 }]} />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.steel900,
    borderTopColor: colors.steel700,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    left: 0,
    minHeight: 82,
    paddingTop: spacing.xs,
    position: "absolute",
    right: 0,
  },
  item: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 2,
  },
  iconWrap: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 44,
  },
  iconWrapActive: {
    backgroundColor: `${colors.amber400}14`,
    borderRadius: 18,
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 3,
  },
  underline: {
    backgroundColor: colors.amber400,
    borderRadius: 2,
    height: 3,
    marginTop: 4,
    width: 16,
  },
});
