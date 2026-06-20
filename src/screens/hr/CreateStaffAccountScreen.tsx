import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, KeyRound, Mail, ShieldCheck, UserPlus } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AccessMatrixEditor, accessForRole } from "../../components/access/AccessMatrixEditor";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { PermissionGate } from "../../components/ui/PermissionGate";
import { hrService } from "../../services/hr.service";
import { permissionService } from "../../services/permission.service";
import { useAppStore } from "../../store/appStore";
import type { Role } from "../../types";
import { colors, spacing, typography } from "../../utils/constants";
import { isEmail } from "../../utils/validators";
import { roleDescriptions, roleLabels } from "../../utils/permissions";
import { ScreenContainer } from "../shared/ScreenScaffold";

const roles: Role[] = ["manager", "supervisor", "operator", "viewer", "admin"];
const roleColors: Record<Role, string> = {
  admin: colors.maintenance,
  manager: colors.finance,
  supervisor: colors.production,
  operator: colors.inventory,
  viewer: colors.steel500,
};

const makePassword = () => `FactoryOS-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 8)}`;

export const CreateStaffAccountScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const showToast = useAppStore((state) => state.showToast);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(makePassword);
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<Role>("manager");
  const [access, setAccess] = useState(accessForRole("manager"));
  const [accessInitialized, setAccessInitialized] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const roleAccessQuery = useQuery({ queryKey: ["role_access"], queryFn: permissionService.getRoleAccess });
  const roleMatrix = roleAccessQuery.data?.matrix || [];

  useEffect(() => {
    if (roleMatrix.length && !accessInitialized) {
      setAccess(accessForRole(role, roleMatrix));
      setAccessInitialized(true);
    }
  }, [accessInitialized, role, roleMatrix]);

  const normalizedEmail = email.trim().toLowerCase();
  const formErrors = useMemo(
    () => ({
      fullName: fullName.trim().length >= 2 ? "" : "Enter the staff member's full name.",
      email: isEmail(normalizedEmail) ? "" : "Enter a valid work email address.",
      password: password.length >= 8 ? "" : "Password must be at least 8 characters.",
      employeeId: employeeId.trim().length >= 2 ? "" : "Enter an employee ID.",
      department: department.trim().length >= 2 ? "" : "Enter a department.",
    }),
    [department, employeeId, fullName, normalizedEmail, password],
  );
  const missingItems = useMemo(() => {
    const items = Object.values(formErrors).filter(Boolean);
    if (!roleMatrix.length) items.push("Role access matrix must load from the API.");
    return items;
  }, [formErrors, roleMatrix.length]);
  const isFormReady = missingItems.length === 0;

  const createMutation = useMutation({
    mutationFn: () =>
      hrService.createAccount({
        email: normalizedEmail,
        password,
        fullName: fullName.trim(),
        role,
        department: department.trim(),
        employeeId: employeeId.trim(),
        access,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      showToast("success", `${roleLabels[role]} account created.`);
      navigation.goBack();
    },
    onError: (error) => {
      showToast("error", error instanceof Error ? error.message : "Could not create account.");
    },
  });

  const submit = () => {
    setAttemptedSubmit(true);
    if (!isFormReady) {
      showToast("warning", "Complete the highlighted account fields first.");
      return;
    }

    createMutation.mutate();
  };

  const applyRole = (nextRole: Role) => {
    setRole(nextRole);
    setAccess(accessForRole(nextRole, roleMatrix));
    setAccessInitialized(true);
  };

  return (
    <PermissionGate
      roles={["admin"]}
      fallback={
        <ScreenContainer title="Create Staff Account" subtitle="Admin access required" navigationMode="back">
          <EmptyState variant="hr" title="Admin access required" subtitle="Only admins can create staff accounts and assign role permissions." />
        </ScreenContainer>
      }
    >
      <ScreenContainer title="Create Staff Account" subtitle="Email, password, role, and access permissions" navigationMode="back">
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <UserPlus color={colors.steel950} size={26} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Provision a role-based account</Text>
            <Text style={styles.heroText}>Create login credentials and assign exactly what this staff member can see or change.</Text>
          </View>
        </View>

        <View style={[styles.validationPanel, isFormReady && styles.validationPanelReady]}>
          <View style={styles.validationTop}>
            <View style={[styles.validationDot, { backgroundColor: isFormReady ? colors.inventory : colors.amber400 }]} />
            <Text style={styles.validationTitle}>{isFormReady ? "Ready to create account" : "Account setup incomplete"}</Text>
          </View>
          <Text style={styles.validationText}>
            {isFormReady
              ? `${roleLabels[role]} login credentials and access permissions are complete.`
              : "Fill the required credentials before creating the staff login."}
          </Text>
          {!isFormReady ? (
            <View style={styles.missingList}>
              {missingItems.map((item) => (
                <Text key={item} style={styles.missingItem}>{item}</Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Mail color={colors.amber400} size={19} />
            <Text style={styles.sectionTitle}>Login Credentials</Text>
          </View>
          <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Full name" error={attemptedSubmit ? formErrors.fullName : undefined} />
          <Input label="Work email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Work email" error={attemptedSubmit ? formErrors.email : undefined} />
          <View style={styles.passwordRow}>
            <View style={styles.passwordInput}>
              <Input label="Temporary password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimum 8 characters" error={attemptedSubmit ? formErrors.password : undefined} />
            </View>
            <Pressable style={styles.generateButton} onPress={() => setPassword(makePassword())}>
              <KeyRound color={colors.steel100} size={18} />
            </Pressable>
          </View>
          <Input label="Employee ID" value={employeeId} onChangeText={setEmployeeId} autoCapitalize="characters" placeholder="Employee ID" error={attemptedSubmit ? formErrors.employeeId : undefined} />
          <Input label="Department" value={department} onChangeText={setDepartment} placeholder="Department" error={attemptedSubmit ? formErrors.department : undefined} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <ShieldCheck color={colors.amber400} size={19} />
            <Text style={styles.sectionTitle}>Role & Access</Text>
          </View>
          <View style={styles.roleList}>
            {roles.map((item) => {
              const active = item === role;
              return (
                <Pressable key={item} style={[styles.roleCard, active && styles.roleCardActive, { borderColor: active ? roleColors[item] : colors.steel700 }]} onPress={() => applyRole(item)}>
                  <View style={[styles.roleMark, { backgroundColor: roleColors[item] }]}>
                    {active ? <Check color={colors.steel950} size={14} /> : null}
                  </View>
                  <View style={styles.roleCopy}>
                    <Text style={[styles.roleName, active && { color: roleColors[item] }]}>{roleLabels[item]}</Text>
                    <Text style={styles.roleDescription}>{roleDescriptions[item]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <AccessMatrixEditor
          value={access}
          onChange={setAccess}
          title="Personal Grants & Revokes"
          subtitle="Start from the selected role, then grant or revoke module permissions for this person."
        />

        <View style={styles.reviewPanel}>
          <Text style={styles.reviewTitle}>Creation Summary</Text>
          <Text style={styles.reviewLine}>Email: {normalizedEmail || "Not set"}</Text>
          <Text style={styles.reviewLine}>Role: {roleLabels[role]}</Text>
          <Text style={styles.reviewLine}>Department: {department.trim() || "Not set"}</Text>
        </View>

        <Button title={isFormReady ? "Create Account" : "Complete Required Fields"} disabled={!isFormReady} loading={createMutation.isPending} onPress={submit} />
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
    backgroundColor: colors.amber400,
    borderRadius: 12,
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
  heroText: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  validationPanel: {
    backgroundColor: `${colors.amber400}12`,
    borderColor: `${colors.amber400}55`,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  validationPanelReady: {
    backgroundColor: `${colors.inventory}12`,
    borderColor: `${colors.inventory}55`,
  },
  validationTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  validationDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  validationTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 14,
  },
  validationText: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 17,
  },
  missingList: {
    gap: 3,
    marginTop: spacing.xs,
  },
  missingItem: {
    color: colors.steel300,
    fontFamily: typography.bodyMedium,
    fontSize: 11,
    lineHeight: 16,
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
  passwordRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.xs,
  },
  passwordInput: {
    flex: 1,
  },
  generateButton: {
    alignItems: "center",
    backgroundColor: colors.steel800,
    borderColor: colors.steel700,
    borderRadius: 8,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
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
    minHeight: 72,
    padding: spacing.sm,
  },
  roleCardActive: {
    backgroundColor: colors.steel900,
  },
  roleMark: {
    alignItems: "center",
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    width: 18,
  },
  roleCopy: {
    flex: 1,
  },
  roleName: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 14,
  },
  roleDescription: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  reviewPanel: {
    backgroundColor: colors.steel900,
    borderColor: colors.steel700,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  reviewTitle: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 15,
  },
  reviewLine: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
  },
});
