import { useNavigation } from "@react-navigation/native";
import { Pencil, ShieldCheck, UserPlus, Users } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "../../components/ui/Badge";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { hrService } from "../../services/hr.service";
import { useAppStore } from "../../store/appStore";
import type { Profile, Role } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { roleDescriptions, roleLabels } from "../../utils/permissions";
import { ChipRow, ScreenContainer, SearchField, WorkCard } from "../shared/ScreenScaffold";

const assignableRoles: Role[] = ["admin", "manager", "supervisor", "operator", "viewer"];
const roleColors: Record<Role, string> = {
  admin: colors.maintenance,
  manager: colors.finance,
  supervisor: colors.production,
  operator: colors.inventory,
  viewer: colors.steel500,
};

export const EmployeeListScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const [editRole, setEditRole] = useState<Role>("operator");
  const [editDepartment, setEditDepartment] = useState("");
  const { data = [] } = useQuery({ queryKey: ["employees"], queryFn: hrService.getEmployees });
  const employees = data as Profile[];
  const departments = useMemo(() => ["All", ...Array.from(new Set(employees.map((employee) => employee.department).filter(Boolean)))], [employees]);
  const roleCounts = useMemo(
    () =>
      assignableRoles.map((item) => ({
        role: item,
        count: employees.filter((employee) => employee.role === item).length,
      })),
    [employees],
  );

  const filtered = useMemo(
    () =>
      employees.filter((employee) => {
        const matchesSearch = `${employee.full_name} ${employee.employee_id}`.toLowerCase().includes(search.toLowerCase());
        const matchesDepartment = department === "All" || employee.department === department;
        return matchesSearch && matchesDepartment;
      }),
    [department, employees, search],
  );

  const openEdit = (employee: Profile) => {
    setSelectedEmployee(employee);
    setEditRole(employee.role);
    setEditDepartment(employee.department || "");
  };

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!selectedEmployee) throw new Error("Select an employee first.");
      return hrService.updateAccount(selectedEmployee.id, {
        role: editRole,
        department: editDepartment.trim(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      showToast("success", "Role access updated.");
      setSelectedEmployee(null);
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not update access.");
    },
  });

  const submitRoleUpdate = () => {
    if (!selectedEmployee || editDepartment.trim().length < 2) {
      showToast("warning", "Choose a role and enter department.");
      return;
    }

    updateMutation.mutate();
  };

  return (
    <ScreenContainer
      title="Access Management"
      subtitle="Create accounts and assign role permissions"
      scroll={false}
      action={
        <PermissionGate roles={["admin"]}>
          <Pressable style={styles.fabSmall} onPress={() => navigation.navigate("CreateStaffAccount")}>
            <UserPlus color={colors.steel950} size={21} />
          </Pressable>
        </PermissionGate>
      }
    >
      <PermissionGate roles={["admin"]}>
        <View style={styles.adminPanel}>
          <View style={styles.adminHead}>
            <View style={styles.adminIcon}>
              <ShieldCheck color={colors.steel950} size={24} />
            </View>
            <View style={styles.adminCopy}>
              <Text style={styles.adminTitle}>Role-based access control</Text>
              <Text style={styles.adminSubtitle}>Create manager, supervisor, operator, and viewer accounts. Tap any staff card to edit role access.</Text>
            </View>
          </View>
          <View style={styles.roleStats}>
            {roleCounts.map((item) => (
              <View key={item.role} style={[styles.roleStatCard, { borderColor: `${roleColors[item.role]}55` }]}>
                <Text style={[styles.roleStatValue, { color: roleColors[item.role] }]}>{item.count}</Text>
                <Text style={styles.roleStatLabel}>{roleLabels[item.role]}</Text>
              </View>
            ))}
          </View>
          <Button title="Create Staff Account" icon={<UserPlus color={colors.steel950} size={18} />} onPress={() => navigation.navigate("CreateStaffAccount")} />
        </View>
      </PermissionGate>
      <SearchField value={search} onChangeText={setSearch} placeholder="Search employee" />
      <ChipRow items={departments} active={department} onChange={setDepartment} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <PermissionGate
            roles={["admin"]}
            fallback={<EmptyState variant="hr" title="No employees found" subtitle="Ask an admin to create staff accounts and assign role access." />}
          >
            <EmptyState
              variant="hr"
              title="No employees found"
              subtitle="Create staff accounts and assign access roles"
              cta="Create account"
              onPress={() => navigation.navigate("CreateStaffAccount")}
            />
          </PermissionGate>
        }
        renderItem={({ item }) => (
          <WorkCard title={item.full_name} eyebrow={item.employee_id} accentColor={roleColors[item.role]} onPress={() => openEdit(item)}>
            <View style={styles.row}>
              <View style={styles.employeeMeta}>
                <Text style={styles.meta}>{item.department}</Text>
                <Text style={styles.roleHint}>{roleDescriptions[item.role]}</Text>
              </View>
              <View style={styles.roleAction}>
                <Badge label={roleLabels[item.role]} color={roleColors[item.role]} />
                <PermissionGate roles={["admin"]}>
                  <Pencil color={colors.steel500} size={16} />
                </PermissionGate>
              </View>
            </View>
          </WorkCard>
        )}
      />
      <BottomSheet visible={Boolean(selectedEmployee)} onClose={() => setSelectedEmployee(null)}>
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <View style={styles.sheetIconMuted}>
              <Users color={colors.hr} size={20} />
            </View>
            <View style={styles.sheetCopy}>
              <Text style={styles.sheetTitle}>Edit Access</Text>
              <Text style={styles.sheetMeta}>{selectedEmployee?.full_name} · {selectedEmployee?.employee_id}</Text>
            </View>
          </View>
          <Input label="Department" value={editDepartment} onChangeText={setEditDepartment} placeholder="Production" />
          <View style={styles.roleBlock}>
            <Text style={styles.label}>Role permission</Text>
            <View style={styles.roleList}>
              {assignableRoles.map((item) => {
                const active = item === editRole;
                return (
                  <Pressable key={item} style={[styles.roleOption, active && styles.roleOptionActive, { borderColor: active ? roleColors[item] : colors.steel700 }]} onPress={() => setEditRole(item)}>
                    <View style={[styles.roleDot, { backgroundColor: roleColors[item] }]} />
                    <View style={styles.roleOptionCopy}>
                      <Text style={[styles.roleText, active && { color: roleColors[item] }]}>{roleLabels[item]}</Text>
                      <Text style={styles.roleDescription}>{roleDescriptions[item]}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Button title="Save Role Access" loading={updateMutation.isPending} onPress={submitRoleUpdate} />
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  fabSmall: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  list: {
    gap: spacing.md,
    paddingBottom: 180,
  },
  adminPanel: {
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  adminHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  adminIcon: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  adminCopy: {
    flex: 1,
  },
  adminTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 17,
  },
  adminSubtitle: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  roleStats: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  roleStatCard: {
    backgroundColor: colors.steel800,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 64,
    padding: spacing.xs,
  },
  roleStatValue: {
    fontFamily: typography.display,
    fontSize: 20,
  },
  roleStatLabel: {
    color: colors.steel500,
    fontFamily: typography.bodyMedium,
    fontSize: 10,
    marginTop: 2,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  employeeMeta: {
    flex: 1,
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 13,
  },
  roleHint: {
    color: colors.steel300,
    fontFamily: typography.body,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  roleAction: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  sheet: {
    gap: spacing.md,
  },
  sheetHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  sheetIcon: {
    alignItems: "center",
    backgroundColor: colors.amber400,
    borderRadius: 10,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sheetIconMuted: {
    alignItems: "center",
    backgroundColor: `${colors.hr}20`,
    borderColor: `${colors.hr}55`,
    borderRadius: 10,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sheetCopy: {
    flex: 1,
  },
  sheetTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 22,
  },
  sheetMeta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  roleBlock: {
    gap: spacing.xs,
  },
  label: {
    color: colors.steel300,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  roleList: {
    gap: spacing.xs,
  },
  roleOption: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 40,
    padding: spacing.sm,
  },
  roleOptionActive: {
    backgroundColor: colors.steel900,
  },
  roleDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  roleOptionCopy: {
    flex: 1,
  },
  roleText: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 13,
  },
  roleDescription: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
