import { Canvas, Group, RoundedRect, SweepGradient, vec } from "@shopify/react-native-skia";
import { PropsWithChildren } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import { colors, radii } from "../../utils/constants";

interface GlowBorderProps extends PropsWithChildren {
  color?: string;
  duration?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const GlowBorder = ({ children, color = colors.amber400, duration = 3000, borderRadius = radii.card, style }: GlowBorderProps) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration }), -1, false);
  }, [duration, rotation]);

  const rotate = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.wrap, { borderRadius, borderColor: Platform.OS === "web" ? `${color}3D` : "transparent", borderWidth: Platform.OS === "web" ? 1 : 0 }, style]}>
      {Platform.OS === "web" ? null : (
        <Animated.View pointerEvents="none" style={[styles.fill, rotate]}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Group>
              <RoundedRect x={1} y={1} width={1000} height={1000} r={borderRadius} style="stroke" strokeWidth={2}>
                <SweepGradient c={vec(100, 100)} colors={[`${color}00`, `${color}A8`, `${color}00`]} />
              </RoundedRect>
            </Group>
          </Canvas>
        </Animated.View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  wrap: {
    overflow: "hidden",
  },
});
