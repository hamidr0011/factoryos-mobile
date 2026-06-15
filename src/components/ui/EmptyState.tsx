import { Canvas, Circle, Line, Path, Rect } from "@shopify/react-native-skia";
import { ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../utils/constants";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  subtitle: string;
  cta?: string;
  onPress?: () => void;
  variant?: "production" | "inventory" | "quality" | "hr" | "maintenance" | "finance";
  children?: ReactNode;
}

export const EmptyState = ({ title, subtitle, cta, onPress, variant = "production", children }: EmptyStateProps) => (
  <View style={styles.wrap}>
    {Platform.OS === "web" ? <View style={styles.webIllustration} /> : <Canvas style={styles.canvas}>
      {variant === "production" ? (
        <>
          <Rect x={32} y={80} width={124} height={52} color="transparent" style="stroke" strokeWidth={2} />
          <Path path="M42 80 L64 54 L88 80 M92 80 L118 42 L146 80" color={colors.amber400} style="stroke" strokeWidth={2} />
          <Line p1={{ x: 32, y: 132 }} p2={{ x: 170, y: 132 }} color={colors.steel500} strokeWidth={2} />
        </>
      ) : null}
      {variant === "inventory" ? (
        <>
          <Rect x={42} y={50} width={118} height={84} color="transparent" style="stroke" strokeWidth={2} />
          <Line p1={{ x: 42, y: 78 }} p2={{ x: 160, y: 78 }} color={colors.steel500} strokeWidth={2} />
          <Line p1={{ x: 42, y: 106 }} p2={{ x: 160, y: 106 }} color={colors.steel500} strokeWidth={2} />
          <Circle cx={70} cy={92} r={8} color={colors.amber400} style="stroke" strokeWidth={2} />
        </>
      ) : null}
      {variant === "quality" ? (
        <>
          <Rect x={58} y={36} width={88} height={112} color="transparent" style="stroke" strokeWidth={2} />
          <Path path="M76 92 L94 110 L128 74" color={colors.amber400} style="stroke" strokeWidth={4} />
        </>
      ) : null}
      {variant === "hr" ? (
        <>
          <Circle cx={78} cy={70} r={18} color={colors.amber400} style="stroke" strokeWidth={2} />
          <Circle cx={122} cy={70} r={18} color={colors.steel500} style="stroke" strokeWidth={2} />
          <Path path="M48 136 C54 104 102 104 108 136 M92 136 C98 104 146 104 152 136" color={colors.steel500} style="stroke" strokeWidth={2} />
        </>
      ) : null}
      {variant === "maintenance" ? (
        <Path path="M62 132 L138 56 L154 72 L78 148 Z M52 64 L78 38 L96 56 L70 82 Z" color={colors.amber400} style="stroke" strokeWidth={2} />
      ) : null}
      {variant === "finance" ? (
        <>
          <Rect x={58} y={42} width={92} height={112} color="transparent" style="stroke" strokeWidth={2} />
          <Line p1={{ x: 76, y: 74 }} p2={{ x: 132, y: 74 }} color={colors.amber400} strokeWidth={2} />
          <Line p1={{ x: 76, y: 98 }} p2={{ x: 132, y: 98 }} color={colors.steel500} strokeWidth={2} />
          <Line p1={{ x: 76, y: 122 }} p2={{ x: 118, y: 122 }} color={colors.steel500} strokeWidth={2} />
        </>
      ) : null}
    </Canvas>}
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
    {children}
    {cta ? <Button title={cta} onPress={onPress} style={styles.cta} /> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
  },
  canvas: {
    height: 180,
    width: 220,
  },
  webIllustration: {
    borderColor: colors.amber400,
    borderRadius: 8,
    borderWidth: 2,
    height: 128,
    opacity: 0.8,
    width: 180,
  },
  title: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 22,
  },
  subtitle: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 13,
    textAlign: "center",
  },
  cta: {
    marginTop: spacing.sm,
  },
});
