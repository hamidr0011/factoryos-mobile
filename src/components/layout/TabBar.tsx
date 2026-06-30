import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, MoreHorizontal } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { colors, spacing, typography } from "../../utils/constants";
import { getBottomSafePadding } from "../../utils/safeArea";
import { ModuleIconMark } from "../visuals/ModuleArtwork";

const icons = {
  Dashboard: Home,
  More: MoreHorizontal,
};

const TabBarItem = ({
  routeName,
  label,
  isFocused,
  onPress,
}: {
  routeName: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
}) => {
  const Icon = icons[routeName as keyof typeof icons] || Home;
  const moduleId = routeName === "Production" ? "production" : routeName === "Inventory" ? "inventory" : routeName === "HR" ? "hr" : null;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(isFocused ? -3 : 0, { damping: 14 }) }],
  }));

  return (
    <Pressable accessibilityRole="button" style={styles.item} onPress={onPress}>
      <Animated.View style={[styles.iconWrap, isFocused && styles.iconWrapActive, animatedStyle]}>
        {moduleId ? (
          <ModuleIconMark id={moduleId} color={isFocused ? colors.amber400 : colors.steel300} size={24} />
        ) : (
          <Icon color={isFocused ? colors.amber400 : colors.steel300} size={22} />
        )}
      </Animated.View>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={[styles.label, { color: isFocused ? colors.amber400 : colors.steel500 }]}
      >
        {label}
      </Text>
      <View style={[styles.underline, { opacity: isFocused ? 1 : 0 }]} />
    </Pressable>
  );
};

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const bottomPad = getBottomSafePadding(insets.bottom, spacing.sm);

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      {state.routes.map((route, index) => {
        const label = descriptors[route.key].options.tabBarLabel?.toString() || route.name;
        return (
          <TabBarItem
            key={route.key}
            routeName={route.name}
            label={label}
            isFocused={state.index === index}
            onPress={() => {
              if (route.name === "More") {
                (navigation.getParent() as any)?.openDrawer?.();
                return;
              }
              navigation.navigate(route.name);
            }}
          />
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
    flexDirection: "row",
    minHeight: 82,
    paddingTop: spacing.xs,
  },
  item: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
    minWidth: 0,
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
    fontSize: 9,
    lineHeight: 11,
    marginTop: 3,
    maxWidth: "100%",
    textAlign: "center",
  },
  underline: {
    backgroundColor: colors.amber400,
    borderRadius: 2,
    height: 3,
    marginTop: 4,
    width: 16,
  },
});
