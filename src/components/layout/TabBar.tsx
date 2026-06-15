import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Factory, Home, MoreHorizontal, Package, Users } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { colors, spacing, typography } from "../../utils/constants";

const icons = {
  Dashboard: Home,
  Production: Factory,
  Inventory: Package,
  HR: Users,
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
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(isFocused ? -3 : 0, { damping: 14 }) }],
  }));

  return (
    <Pressable accessibilityRole="button" style={styles.item} onPress={onPress}>
      <Animated.View style={[styles.iconWrap, isFocused && styles.iconWrapActive, animatedStyle]}>
        <Icon color={isFocused ? colors.amber400 : colors.steel300} size={22} />
      </Animated.View>
      <Text style={[styles.label, { color: isFocused ? colors.amber400 : colors.steel500 }]}>{label}</Text>
      <View style={[styles.underline, { opacity: isFocused ? 1 : 0 }]} />
    </Pressable>
  );
};

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => (
  <View style={styles.bar}>
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

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.steel950,
    borderTopColor: colors.steel700,
    borderTopWidth: 1,
    flexDirection: "row",
    minHeight: 74,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  item: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  iconWrap: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    width: 36,
  },
  iconWrapActive: {
    backgroundColor: `${colors.amber400}1A`,
    borderColor: `${colors.amber400}40`,
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: 11,
    marginTop: 2,
  },
  underline: {
    backgroundColor: colors.amber400,
    borderRadius: 1,
    height: 2,
    marginTop: 5,
    width: 24,
  },
});
