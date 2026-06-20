import { useNavigation } from "@react-navigation/native";
import { Pencil, ShieldCheck, UserPlus, Users } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { usePermissions } from "../../hooks/usePermissions";
import { hrService } from "../../services/hr.service";
import type { Profile, Role } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { roleLabels } from "../../utils/permissions";
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
  const { isAdmin } = usePermissions();
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
      scroll={false}
      action={
        isAdmin ? (
          <Pressable style={styles.fabSmall} onPress={() => navigation.navigate("CreateStaffAccount")}>
            <UserPlus color={colors.steel950} size={21} />
          </Pressable>
        ) : null
      }
    >
      <PermissionGate roles={["admin"]}>
        <View style={styles.adminPanel}>
          <View style={styles.adminHead}>
            <View style={styles.adminIcon}>
              <ShieldCheck color={colors.steel950} size={24} />
            </View>
            <View style={styles.adminCopy}>
              <Text style={styles.adminTitle}>Role Access</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleStats}>
            {roleCounts.map((item) => (
              <View key={item.role} style={[styles.roleStatCard, { borderColor: `${roleColors[item.role]}55` }]}>
                <Text style={[styles.roleStatValue, { color: roleColors[item.role] }]}>{item.count}</Text>
                <Text numberOfLines={1} style={styles.roleStatLabel}>{roleLabels[item.role]}</Text>
              </View>
            ))}
          </ScrollView>
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
            fallback={<EmptyState variant="hr" title="No employees found" />}
          >
            <EmptyState
              variant="hr"
              title="No employees found"
              cta="Create account"
              onPress={() => navigation.navigate("CreateStaffAccount")}
            />
          </PermissionGate>
        }
        renderItem={({ item }) => (
          <WorkCard title={item.full_name} eyebrow={item.employee_id} accentColor={roleColors[item.role]} onPress={isAdmin ? () => navigation.navigate("EditStaffAccess", { employee: item }) : undefined}>
            <View style={styles.row}>
              <View style={styles.employeeMeta}>
                <Text numberOfLines={1} style={styles.meta}>{item.department}</Text>
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
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  list: {
    gap: spacing.sm,
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
    fontSize: 15,
  },
  roleStats: {
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  roleStatCard: {
    backgroundColor: colors.steel800,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 64,
    padding: spacing.xs,
    width: 82,
  },
  roleStatValue: {
    fontFamily: typography.display,
    fontSize: 18,
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
  roleAction: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
});
