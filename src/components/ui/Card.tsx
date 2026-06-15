import * as Haptics from "expo-haptics";
import { PropsWithChildren } from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
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
      <Animated.View style={[styles.card, accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 2 } : null, style, animatedStyle]}>
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
    padding: spacing.md,
    shadowColor: "#2F362F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
});
