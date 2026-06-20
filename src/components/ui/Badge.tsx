import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../../utils/constants";

interface BadgeProps {
  label: string;
  color?: string;
  subtle?: boolean;
}

export const Badge = ({ label, color = colors.amber400, subtle = true }: BadgeProps) => (
  <View style={[styles.badge, { backgroundColor: subtle ? `${color}22` : color, borderColor: `${color}55` }]}>
    <Text style={[styles.label, { color: subtle ? color : colors.steel950 }]}>{label.toUpperCase()}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.cell,
    borderWidth: 1,
    minHeight: 26,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  label: {
    fontFamily: typography.display,
    fontSize: 10,
    letterSpacing: 0,
  },
});
