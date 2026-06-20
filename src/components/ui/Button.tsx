import * as Haptics from "expo-haptics";
import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, radii, spacing, typography } from "../../utils/constants";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  title: string;
  onPress?: () => void | Promise<void>;
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { backgroundColor: string; borderColor: string; color: string }> = {
  primary: { backgroundColor: colors.amber400, borderColor: colors.amber400, color: "#FFFFFF" },
  secondary: { backgroundColor: colors.steel800, borderColor: colors.steel700, color: colors.steel100 },
  ghost: { backgroundColor: "transparent", borderColor: "transparent", color: colors.amber400 },
  danger: { backgroundColor: colors.red, borderColor: colors.red, color: "#FFFFFF" },
};

export const Button = ({ title, onPress, variant = "primary", icon, loading, disabled, style }: ButtonProps) => {
  const scale = useSharedValue(1);
  const palette = variantStyles[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onPress?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 18, mass: 0.8 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, mass: 0.8 });
      }}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: disabled ? colors.steel700 : palette.backgroundColor,
            borderColor: disabled ? colors.steel700 : palette.borderColor,
          },
          style,
          animatedStyle,
        ]}
      >
        {loading ? <ActivityIndicator color={palette.color} /> : icon}
        <Text numberOfLines={1} style={[styles.title, { color: disabled ? colors.steel500 : palette.color }]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    lineHeight: 19,
  },
});
