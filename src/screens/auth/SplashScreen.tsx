import { Canvas, Circle, Line } from "@shopify/react-native-skia";
import { StackScreenProps } from "@react-navigation/stack";
import { useEffect } from "react";
import { Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";
import { colors, spacing, typography } from "../../utils/constants";

type Props = StackScreenProps<any, "Splash">;

const Particle = ({ index, frameWidth }: { index: number; frameWidth: number }) => {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const drift = ((index % 9) - 4) * 7;

  useEffect(() => {
    const delay = index * 70;
    y.value = withDelay(delay, withRepeat(withTiming(-140, { duration: 2200, easing: Easing.out(Easing.quad) }), -1, false));
    opacity.value = withDelay(delay, withRepeat(withTiming(1, { duration: 900 }), -1, true));
  }, [index, opacity, y]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.65,
    transform: [{ translateY: y.value }, { translateX: drift * (Math.abs(y.value) / 140) }],
  }));

  return <Animated.View style={[styles.particle, { left: frameWidth / 2 - 2 + drift, top: 330 + (index % 6) * 3 }, style]} />;
};

const Gear = ({ reverse = false, size = 104 }: { reverse?: boolean; size?: number }) => {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(reverse ? -360 : 360, { duration: 3000, easing: Easing.linear }), -1, false);
  }, [reverse, spin]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const c = size / 2;

  if (Platform.OS === "web") {
    return <Animated.View style={[styles.webGear, { width: size, height: size, borderRadius: size / 2 }, style]} />;
  }

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Canvas style={{ width: size, height: size }}>
        <Circle cx={c} cy={c} r={size * 0.31} color={colors.amber400} style="stroke" strokeWidth={3} />
        <Circle cx={c} cy={c} r={size * 0.12} color={colors.amber300} style="stroke" strokeWidth={2} />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / 12;
          return (
            <Line
              key={i}
              p1={{ x: c + Math.cos(angle) * size * 0.35, y: c + Math.sin(angle) * size * 0.35 }}
              p2={{ x: c + Math.cos(angle) * size * 0.48, y: c + Math.sin(angle) * size * 0.48 }}
              color={colors.amber400}
              strokeWidth={4}
            />
          );
        })}
      </Canvas>
    </Animated.View>
  );
};

export const SplashScreen = ({ navigation }: Props) => {
  const progress = useSharedValue(0);
  const exit = useSharedValue(0);
  const { width } = useWindowDimensions();
  const frameWidth = Platform.OS === "web" ? Math.min(width, 430) : width;

  useEffect(() => {
    progress.value = withTiming(1, { duration: 2800, easing: Easing.out(Easing.cubic) });
    const timer1 = setTimeout(() => {
      exit.value = withTiming(1, { duration: 520 });
    }, 3100);
    const timer2 = setTimeout(() => {
      navigation.replace("Onboarding");
    }, 3620);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [exit, navigation, progress]);

  const progressStyle = useAnimatedStyle(() => ({ width: 200 * progress.value }));
  const exitStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ translateY: -70 * exit.value }],
  }));

  return (
    <Animated.View style={[styles.screen, exitStyle]}>
      {Array.from({ length: 40 }).map((_, index) => (
        <Particle key={index} index={index} frameWidth={frameWidth} />
      ))}
      <View style={styles.gearStage}>
        <View style={styles.gearLarge}>
          <Gear />
        </View>
        <View style={styles.gearSmall}>
          <Gear reverse size={72} />
        </View>
      </View>
      <View style={styles.wordmark}>
        <View style={styles.letters}>
          {"FactoryOS".split("").map((letter, index) => (
            <Animated.Text key={`${letter}-${index}`} entering={FadeIn.delay(index * 70).duration(360)} style={styles.logo}>
              {letter}
            </Animated.Text>
          ))}
        </View>
        <Text style={styles.tagline}>OPERATIONS INTELLIGENCE</Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: colors.steel950,
    flex: 1,
    justifyContent: "center",
  },
  particle: {
    backgroundColor: colors.amber400,
    borderRadius: 3,
    height: 4,
    position: "absolute",
    width: 4,
  },
  gearStage: {
    height: 170,
    width: 180,
  },
  gearLarge: {
    left: 22,
    position: "absolute",
    top: 18,
  },
  gearSmall: {
    left: 104,
    position: "absolute",
    top: 74,
  },
  webGear: {
    borderColor: colors.amber400,
    borderWidth: 3,
    shadowColor: colors.amber400,
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  wordmark: {
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  letters: {
    flexDirection: "row",
  },
  logo: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 36,
  },
  tagline: {
    color: colors.steel500,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    letterSpacing: 2,
  },
  progressTrack: {
    backgroundColor: colors.steel800,
    borderRadius: 2,
    bottom: 62,
    height: 3,
    overflow: "hidden",
    position: "absolute",
    width: 200,
  },
  progressFill: {
    backgroundColor: colors.amber400,
    height: "100%",
  },
});
