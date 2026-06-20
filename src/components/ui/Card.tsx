import * as Haptics from "expo-haptics";
import { PropsWithChildren } from "react";
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, radii, spacing } from "../../utils/constants";

interface CardProps extends PropsWithChildren {
  accentColor?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Card = ({ children, accentColor, onPress, style }: CardProps) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      disabled={!onPress}
      onPress={async () => {
        if (!onPress) return;
        await Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 18, mass: 0.8 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, mass: 0.8 });
      }}
    >
      <Animated.View style={[styles.card, style, animatedStyle]}>
        {accentColor ? <View style={[styles.accentStrip, { backgroundColor: accentColor }]} /> : null}
        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: "hidden",
    padding: spacing.md,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === "ios" ? 0.05 : 0,
    shadowRadius: 12,
  },
  accentStrip: {
    height: "100%",
    left: 0,
    position: "absolute",
    top: 0,
    width: 4,
  },
});
