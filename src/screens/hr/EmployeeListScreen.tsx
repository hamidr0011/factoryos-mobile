import { Plus, UserPlus } from "lucide-react-native";
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
import { colors, employees, spacing, typography } from "../../utils/constants";
import { ChipRow, ScreenContainer, SearchField, WorkCard } from "../shared/ScreenScaffold";

const departments = ["All", "Production", "Quality", "Maintenance", "Finance", "Factory Floor A"];
const assignableRoles: Role[] = ["admin", "manager", "supervisor", "operator", "viewer"];

export const EmployeeListScreen = () => {
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("operator");
  const [newDepartment, setNewDepartment] = useState("Production");
  const [employeeId, setEmployeeId] = useState("");
  const { data = employees } = useQuery({ queryKey: ["employees"], queryFn: hrService.getEmployees });

  const filtered = useMemo(
    () =>
      (data as Profile[]).filter((employee) => {
        const matchesSearch = `${employee.full_name} ${employee.employee_id}`.toLowerCase().includes(search.toLowerCase());
        const matchesDepartment = department === "All" || employee.department === department;
        return matchesSearch && matchesDepartment;
      }),
    [data, department, search],
  );

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("operator");
    setNewDepartment("Production");
    setEmployeeId("");
  };

  const createMutation = useMutation({
    mutationFn: () =>
      hrService.createAccount({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
        department: newDepartment.trim(),
        employeeId: employeeId.trim(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      showToast("success", "Account created and role assigned.");
      resetForm();
      setCreateOpen(false);
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not create account.");
    },
  });

  const submitAccount = () => {
    if (!email.includes("@") || password.length < 8 || fullName.trim().length < 2 || newDepartment.trim().length < 2 || employeeId.trim().length < 2) {
      showToast("warning", "Enter email, 8+ character password, name, department, and employee ID.");
      return;
    }

    createMutation.mutate();
  };

  return (
    <ScreenContainer
      title="Employees"
      subtitle="Profiles, roles, and access"
      scroll={false}
      action={
        <PermissionGate roles={["admin"]}>
          <Pressable style={styles.fabSmall} onPress={() => setCreateOpen(true)}>
            <UserPlus color={colors.steel950} size={21} />
          </Pressable>
        </PermissionGate>
      }
    >
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
              onPress={() => setCreateOpen(true)}
            />
          </PermissionGate>
        }
        renderItem={({ item }) => (
          <WorkCard title={item.full_name} eyebrow={item.employee_id} accentColor={colors.hr}>
            <View style={styles.row}>
              <Text style={styles.meta}>{item.department}</Text>
              <Badge label={item.role} color={colors.hr} />
            </View>
          </WorkCard>
        )}
      />
      <BottomSheet visible={createOpen} onClose={() => setCreateOpen(false)}>
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <View style={styles.sheetIcon}>
              <Plus color={colors.steel950} size={20} />
            </View>
            <View style={styles.sheetCopy}>
              <Text style={styles.sheetTitle}>Create Account</Text>
              <Text style={styles.sheetMeta}>Admin-only user provisioning with assigned role access.</Text>
            </View>
          </View>

          <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Aisha Khan" />
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="name@company.com" />
          <Input label="Temporary password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimum 8 characters" />
          <Input label="Employee ID" value={employeeId} onChangeText={setEmployeeId} autoCapitalize="characters" placeholder="FOS-1204" />
          <Input label="Department" value={newDepartment} onChangeText={setNewDepartment} placeholder="Production" />

          <View style={styles.roleBlock}>
            <Text style={styles.label}>Access role</Text>
            <View style={styles.roleGrid}>
              {assignableRoles.map((item) => {
                const active = item === role;
                return (
                  <Pressable key={item} style={[styles.roleChip, active && styles.roleChipActive]} onPress={() => setRole(item)}>
                    <Text style={[styles.roleText, active && styles.roleTextActive]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Button title="Create Account" loading={createMutation.isPending} onPress={submitAccount} />
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
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  meta: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 13,
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
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  roleChip: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  roleChipActive: {
    backgroundColor: `${colors.hr}22`,
    borderColor: colors.hr,
  },
  roleText: {
    color: colors.steel500,
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    textTransform: "capitalize",
  },
  roleTextActive: {
    color: colors.hr,
  },
});
