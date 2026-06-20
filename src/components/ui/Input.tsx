import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { colors, radii, spacing, typography } from "../../utils/constants";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const Input = ({ label, error, secureTextEntry, style, ...props }: InputProps) => {
  const [visible, setVisible] = useState(false);
  const focus = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: focus.value ? colors.amber400 : colors.steel700,
    borderWidth: focus.value ? 2 : 1,
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.inputShell, animatedStyle]}>
        <TextInput
          {...props}
          placeholderTextColor={colors.steel500}
          secureTextEntry={secureTextEntry && !visible}
          style={[styles.input, style]}
          onFocus={(event) => {
            focus.value = withTiming(1, { duration: 180 });
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            focus.value = withTiming(0, { duration: 180 });
            props.onBlur?.(event);
          }}
        />
        {secureTextEntry ? (
          <Pressable style={styles.eye} onPress={() => setVisible((value) => !value)}>
            {visible ? <EyeOff color={colors.steel300} size={18} /> : <Eye color={colors.steel300} size={18} />}
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    color: colors.steel300,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  inputShell: {
    minHeight: 50,
    borderRadius: 22,
    backgroundColor: colors.steel900,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    color: colors.steel100,
    flex: 1,
    fontFamily: typography.body,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  eye: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  error: {
    color: colors.red,
    fontFamily: typography.body,
    fontSize: 12,
  },
});
