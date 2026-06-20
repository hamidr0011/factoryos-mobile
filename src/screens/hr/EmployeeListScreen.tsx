import { useNavigation } from "@react-navigation/native";
import { Pencil, ShieldCheck, UserPlus, Users } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { hrService } from "../../services/hr.service";
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
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
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
          <WorkCard title={item.full_name} eyebrow={item.employee_id} accentColor={roleColors[item.role]} onPress={() => navigation.navigate("EditStaffAccess", { employee: item })}>
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
});
