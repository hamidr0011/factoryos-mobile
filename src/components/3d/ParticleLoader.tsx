import { Canvas, Circle, Group } from "@shopify/react-native-skia";
import { Modal, Platform, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import { colors, spacing, typography } from "../../utils/constants";

export const ParticleLoader = ({ visible, message = "Synchronizing factory floor" }: { visible: boolean; message?: string }) => {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 1200 }), -1, false);
  }, [spin]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.ring, Platform.OS === "web" && styles.webRing, ringStyle]}>
          {Platform.OS === "web" ? null : (
            <Canvas style={styles.canvas}>
              <Group>
                {Array.from({ length: 20 }).map((_, index) => {
                  const angle = (index / 20) * Math.PI * 2;
                  const radius = 32 + (index % 4) * 7;
                  return (
                    <Circle
                      key={index}
                      cx={60 + Math.cos(angle) * radius}
                      cy={60 + Math.sin(angle) * radius}
                      r={2 + (index % 3)}
                      color={index % 2 ? colors.amber400 : colors.amber300}
                      opacity={0.35 + (index % 5) * 0.12}
                    />
                  );
                })}
              </Group>
            </Canvas>
          )}
        </Animated.View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(243,245,241,0.92)",
    bottom: 0,
    gap: spacing.md,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  ring: {
    height: 120,
    width: 120,
  },
  webRing: {
    borderColor: colors.amber400,
    borderRadius: 60,
    borderRightColor: "transparent",
    borderWidth: 3,
  },
  canvas: {
    height: 120,
    width: 120,
  },
  message: {
    color: colors.steel300,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
});
