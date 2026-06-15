import { PropsWithChildren, useEffect } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { colors, radii, spacing } from "../../utils/constants";

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  snapPoint?: number;
}

const screenHeight = Dimensions.get("window").height;

export const BottomSheet = ({ visible, onClose, children, snapPoint = screenHeight * 0.62 }: BottomSheetProps) => {
  const translateY = useSharedValue(screenHeight);

  useEffect(() => {
    translateY.value = visible ? withSpring(screenHeight - snapPoint, { mass: 0.8, damping: 18 }) : withTiming(screenHeight);
  }, [snapPoint, translateY, visible]);

  const pan = Gesture.Pan()
    .onChange((event) => {
      translateY.value = Math.max(screenHeight - snapPoint, translateY.value + event.changeY);
    })
    .onEnd((event) => {
      if (event.velocityY > 900 || translateY.value > screenHeight - snapPoint + 120) {
        translateY.value = withTiming(screenHeight, {}, () => runOnJS(onClose)());
      } else {
        translateY.value = withSpring(screenHeight - snapPoint, { mass: 0.8, damping: 18 });
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.sheet, { height: snapPoint }, style]}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(24,34,29,0.26)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: colors.steel900,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    bottom: 0,
    left: 0,
    padding: spacing.lg,
    position: "absolute",
    right: 0,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.steel700,
    borderRadius: 2,
    height: 4,
    marginBottom: spacing.lg,
    width: 40,
  },
});
