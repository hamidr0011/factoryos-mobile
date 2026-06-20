import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ModuleId } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { ModuleIllustration } from "../visuals/ModuleArtwork";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  cta?: string;
  onPress?: () => void;
  variant?: ModuleId;
  children?: ReactNode;
}

export const EmptyState = ({ title, subtitle, cta, onPress, variant = "production", children }: EmptyStateProps) => (
  <View style={styles.wrap}>
    <ModuleIllustration id={variant} color={moduleColors[variant]} />
    <Text numberOfLines={2} style={styles.title}>{title}</Text>
    {subtitle ? <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text> : null}
    {children}
    {cta ? <Button title={cta} onPress={onPress} style={styles.cta} /> : null}
  </View>
);

const moduleColors: Record<ModuleId, string> = {
  production: colors.production,
  inventory: colors.inventory,
  quality: colors.quality,
  hr: colors.hr,
  maintenance: colors.maintenance,
  finance: colors.finance,
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 20,
    lineHeight: 24,
    textAlign: "center",
  },
  subtitle: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  cta: {
    marginTop: spacing.sm,
  },
});
