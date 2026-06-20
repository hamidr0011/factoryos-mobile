import { Check, Minus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Role } from "../../types";
import type { AppArea } from "../../utils/permissions";
import { appAreas, roleMatrixRows } from "../../utils/permissions";
import { colors, spacing, typography } from "../../utils/constants";

export interface AccessDraft {
  area: AppArea;
  canRead: boolean;
  canWrite: boolean;
  canApprove: boolean;
  canAdmin: boolean;
}

const areaLabels: Record<AppArea, string> = {
  dashboard: "Dashboard",
  production: "Production",
  inventory: "Inventory",
  quality: "Quality",
  hr: "HR & Workforce",
  maintenance: "Maintenance",
  finance: "Finance",
  notifications: "Notifications",
  settings: "Settings",
};

const actions: Array<{ key: keyof Omit<AccessDraft, "area">; label: string }> = [
  { key: "canRead", label: "Read" },
  { key: "canWrite", label: "Write" },
  { key: "canApprove", label: "Approve" },
  { key: "canAdmin", label: "Admin" },
];

export const accessForRole = (role: Role): AccessDraft[] =>
  appAreas.map((area) => {
    const baseline = roleMatrixRows.find((row) => row.role === role && row.area === area);
    return {
      area,
      canRead: Boolean(baseline?.canRead),
      canWrite: Boolean(baseline?.canWrite),
      canApprove: Boolean(baseline?.canApprove),
      canAdmin: Boolean(baseline?.canAdmin),
    };
  });

const normalizeAccess = (row: AccessDraft): AccessDraft => {
  if (row.canAdmin) return { ...row, canRead: true, canWrite: true, canApprove: true };
  if (row.canApprove || row.canWrite) return { ...row, canRead: true };
  if (!row.canRead) return { ...row, canWrite: false, canApprove: false, canAdmin: false };
  return row;
};

export const toggleAccess = (rows: AccessDraft[], area: AppArea, key: keyof Omit<AccessDraft, "area">) =>
  rows.map((row) => {
    if (row.area !== area) return row;
    return normalizeAccess({ ...row, [key]: !row[key] });
  });

export const AccessMatrixEditor = ({
  value,
  onChange,
  title = "Personal Access Matrix",
  subtitle = "Grant or revoke exactly what this person can do in each module.",
}: {
  value: AccessDraft[];
  onChange: (next: AccessDraft[]) => void;
  title?: string;
  subtitle?: string;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionMeta}>{subtitle}</Text>
    <View style={styles.grid}>
      {value.map((row) => {
        const enabledCount = actions.filter((action) => row[action.key]).length;
        return (
          <View key={row.area} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.area}>{areaLabels[row.area]}</Text>
              <Text style={styles.count}>{enabledCount}/4</Text>
            </View>
            <View style={styles.actions}>
              {actions.map((action) => {
                const active = row[action.key];
                return (
                  <Pressable key={action.key} style={[styles.action, active && styles.actionActive]} onPress={() => onChange(toggleAccess(value, row.area, action.key))}>
                    {active ? <Check color={colors.steel950} size={13} /> : <Minus color={colors.steel500} size={13} />}
                    <Text style={[styles.actionText, active && styles.actionTextActive]}>{action.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 16,
  },
  sectionMeta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: -spacing.sm,
  },
  grid: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.steel800,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  cardHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  area: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 14,
  },
  count: {
    color: colors.steel500,
    fontFamily: typography.mono,
    fontSize: 11,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  action: {
    alignItems: "center",
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    minHeight: 34,
    paddingHorizontal: spacing.xs,
  },
  actionActive: {
    backgroundColor: colors.amber400,
    borderColor: colors.amber400,
  },
  actionText: {
    color: colors.steel500,
    fontFamily: typography.bodyMedium,
    fontSize: 11,
  },
  actionTextActive: {
    color: colors.steel950,
  },
});
