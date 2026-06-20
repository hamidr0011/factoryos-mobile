import { useNavigation, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AccessDraft, AccessMatrixEditor, accessForRole } from "../../components/access/AccessMatrixEditor";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { hrService } from "../../services/hr.service";
import { permissionService } from "../../services/permission.service";
import { useAppStore } from "../../store/appStore";
import type { Profile, Role } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { roleLabels } from "../../utils/permissions";
import { ScreenContainer } from "../shared/ScreenScaffold";

const roles: Role[] = ["admin", "manager", "supervisor", "operator", "viewer"];
const roleColors: Record<Role, string> = {
  admin: colors.maintenance,
  manager: colors.finance,
  supervisor: colors.production,
  operator: colors.inventory,
  viewer: colors.steel500,
};

export const EditStaffAccessScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const employee = route.params?.employee as Profile;
  const [role, setRole] = useState<Role>(employee.role);
  const [department, setDepartment] = useState(employee.department || "");
  const [access, setAccess] = useState<AccessDraft[]>([]);
  const roleAccessQuery = useQuery({ queryKey: ["role_access"], queryFn: permissionService.getRoleAccess });

  const accessQuery = useQuery({
    queryKey: ["employee_access", employee.id],
    queryFn: () => hrService.getUserAccess(employee.id),
  });

  useEffect(() => {
    if (!accessQuery.data?.access) return;
    setAccess(
      accessQuery.data.access.map((row) => ({
        area: row.area,
        canRead: row.effective.canRead,
        canWrite: row.effective.canWrite,
        canApprove: row.effective.canApprove,
        canAdmin: row.effective.canAdmin,
      })),
    );
  }, [accessQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await hrService.updateAccount(employee.id, { role, department: department.trim() });
      return hrService.updateUserAccess(employee.id, access, "Manual admin grant/revoke from Access Management");
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["employees"] }),
        queryClient.invalidateQueries({ queryKey: ["employee_access", employee.id] }),
        queryClient.invalidateQueries({ queryKey: ["role_access"] }),
      ]);
      showToast("success", "Staff access updated.");
      navigation.goBack();
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not update staff access.");
    },
  });

  const applyRoleDefaults = (nextRole: Role) => {
    setRole(nextRole);
    setAccess(accessForRole(nextRole, roleAccessQuery.data?.matrix || []));
  };

  return (
    <PermissionGate
      roles={["admin"]}
      fallback={
        <ScreenContainer title="Edit Staff Access" navigationMode="back">
          <EmptyState variant="hr" title="Admin access required" />
        </ScreenContainer>
      }
    >
      <ScreenContainer title="Edit Staff Access" subtitle={`${employee.full_name} · ${employee.employee_id}`} navigationMode="back">
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Users color={colors.blue} size={24} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{employee.full_name}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <ShieldCheck color={colors.amber400} size={18} />
            <Text style={styles.sectionTitle}>Role Baseline</Text>
          </View>
          <Input label="Department" value={department} onChangeText={setDepartment} placeholder="Department" />
          <View style={styles.roleList}>
            {roles.map((item) => {
              const active = item === role;
              return (
                <Pressable key={item} style={[styles.roleCard, active && styles.roleCardActive, { borderColor: active ? roleColors[item] : colors.steel700 }]} onPress={() => applyRoleDefaults(item)}>
                  <View style={[styles.roleDot, { backgroundColor: roleColors[item] }]} />
                  <View style={styles.roleCopy}>
                    <Text style={[styles.roleName, active && { color: roleColors[item] }]}>{roleLabels[item]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <AccessMatrixEditor value={access} onChange={setAccess} />
        <Button title="Save Grants & Revokes" loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
      </ScreenContainer>
    </PermissionGate>
  );
};

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: `${colors.blue}20`,
    borderColor: `${colors.blue}55`,
    borderRadius: 12,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 18,
  },
  section: {
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 16,
  },
  roleList: {
    gap: spacing.xs,
  },
  roleCard: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 64,
    padding: spacing.sm,
  },
  roleCardActive: {
    backgroundColor: colors.steel900,
  },
  roleDot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  roleCopy: {
    flex: 1,
  },
  roleName: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 14,
  },
});
