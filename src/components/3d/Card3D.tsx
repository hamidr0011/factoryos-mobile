import { PropsWithChildren } from "react";
import { Platform, StyleSheet, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, radii, spacing } from "../../utils/constants";

interface Card3DProps extends PropsWithChildren {
  accentColor?: string;
  style?: ViewStyle;
}

export const Card3D = ({ children, accentColor = colors.amber400, style }: Card3DProps) => {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onChange((event) => {
      rotateY.value = Math.max(-12, Math.min(12, event.translationX / 8));
      rotateX.value = Math.max(-12, Math.min(12, -event.translationY / 8));
    })
    .onEnd(() => {
      rotateX.value = withSpring(0, { damping: 18, mass: 0.8 });
      rotateY.value = withSpring(0, { damping: 18, mass: 0.8 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    if (Platform.OS === "web") {
      return {
        transform: [{ perspective: 900 }, { rotateX: `${rotateX.value}deg` }, { rotateY: `${rotateY.value}deg` }],
      };
    }
    return {
      transform: [
        { scale: 1 + Math.abs(rotateX.value + rotateY.value) / 120 },
        { translateX: rotateY.value / 2 },
        { translateY: -rotateX.value / 2 },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, { borderColor: `${accentColor}55` }, style, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.steel900,
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: "hidden",
    padding: spacing.md,
    shadowColor: "#2F362F",
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
});
