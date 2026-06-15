import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import { colors, radii } from "../../utils/constants";

export const SkeletonPlaceholder = ({ style }: { style?: ViewStyle }) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1100 }), -1, false);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.35, 0.75, 0.35]),
  }));

  return (
    <View style={[styles.base, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.shimmer, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.steel800,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  shimmer: {
    backgroundColor: colors.steel700,
  },
});
