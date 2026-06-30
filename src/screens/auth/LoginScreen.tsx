import { BlurView } from "expo-blur";
import { Factory, ShieldCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { isApiConfigured } from "../../services/api";
import { setupService } from "../../services/setup.service";
import { isSupabaseConfigured } from "../../services/supabase";
import { colors, radii, spacing, typography } from "../../utils/constants";
import { getBottomSafePadding } from "../../utils/safeArea";
import { isEmail } from "../../utils/validators";

type SetupState = "checking" | "ready" | "needed" | "unavailable";

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupState, setSetupState] = useState<SetupState>("checking");
  const [setupMode, setSetupMode] = useState(false);
  const shake = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    let mounted = true;

    const checkSetup = async () => {
      if (!isApiConfigured) {
        if (mounted) setSetupState("unavailable");
        return;
      }

      try {
        const status = await setupService.getStatus();
        if (!mounted) return;
        setSetupState(status.needsSuperAdmin ? "needed" : "ready");
        setSetupMode(status.needsSuperAdmin);
      } catch {
        if (mounted) setSetupState("unavailable");
      }
    };

    checkSetup();
    return () => {
      mounted = false;
    };
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const gearStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const triggerErrorMotion = () => {
    shake.value = withSequence(withTiming(-10), withTiming(10), withTiming(-6), withTiming(0));
  };

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      triggerErrorMotion();
      return;
    }
    setLoading(true);
    setError("");
    spin.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1, false);
    try {
      await signIn(normalizedEmail, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Check credentials.");
      triggerErrorMotion();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuperAdmin = async () => {
    if (!isApiConfigured) {
      setError("Set EXPO_PUBLIC_API_URL to your Render API before creating the first admin.");
      triggerErrorMotion();
      return;
    }

    if (!isSupabaseConfigured) {
      setError("Supabase credentials are not configured for this build.");
      triggerErrorMotion();
      return;
    }

    if (!isEmail(email) || password.length < 8 || fullName.trim().length < 2 || department.trim().length < 2 || employeeId.trim().length < 2) {
      setError("Enter name, email, 8+ character password, department, and employee ID.");
      triggerErrorMotion();
      return;
    }

    setLoading(true);
    setError("");
    spin.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1, false);
    try {
      await setupService.createSuperAdmin({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        department: department.trim(),
        employeeId: employeeId.trim(),
      });
      setSetupState("ready");
      setSetupMode(false);
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the first super admin.");
      triggerErrorMotion();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: getBottomSafePadding(insets.bottom, spacing.lg) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Animated.View style={[styles.gear, gearStyle]}>
            <Factory color={colors.amber400} size={34} strokeWidth={1.8} />
          </Animated.View>
          <Text style={styles.wordmark}>FactoryOS</Text>
          <Text style={styles.tagline}>OPERATIONS INTELLIGENCE</Text>
        </View>
        <Animated.View style={[styles.cardWrap, shakeStyle]}>
          <BlurView intensity={18} tint="light" style={styles.blur}>
            <View style={styles.card}>
              <View>
                <View style={styles.headingRow}>
                  {setupMode ? <ShieldCheck color={colors.amber400} size={22} /> : null}
                  <Text style={styles.heading}>{setupMode ? "Create Super Admin" : "Secure Access"}</Text>
                </View>
                <Text style={styles.subheading}>
                  {setupMode
                    ? "No admin exists yet. Create the owner account first, then manage all other roles from HR."
                    : isSupabaseConfigured
                      ? "Sign in with your FactoryOS account."
                      : "Supabase credentials are not configured for this build."}
                </Text>
              </View>
              {setupMode && setupState === "checking" ? <Text style={styles.status}>Checking first-admin setup...</Text> : null}
              {setupMode && setupState === "unavailable" ? (
                <Text style={styles.warning}>First-admin setup needs your Render API URL in EXPO_PUBLIC_API_URL.</Text>
              ) : null}
              {setupMode ? (
                <>
                  <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Owner Name" />
                  <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Work email" />
                  <Input label="Temporary password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimum 8 characters" />
                  <Input label="Employee ID" value={employeeId} onChangeText={setEmployeeId} autoCapitalize="characters" placeholder="Employee ID" />
                  <Input label="Department" value={department} onChangeText={setDepartment} placeholder="Department" />
                </>
              ) : (
                <>
                  <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Work email" />
                  <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" />
                  <Pressable style={styles.remember} onPress={() => setRemember((value) => !value)}>
                    <View style={[styles.toggle, remember && styles.toggleOn]}>
                      <View style={[styles.thumb, remember && styles.thumbOn]} />
                    </View>
                    <Text style={styles.rememberText}>Remember Me</Text>
                  </Pressable>
                </>
              )}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                title={setupMode ? "Create Super Admin" : "Login"}
                loading={loading}
                disabled={setupMode ? !isSupabaseConfigured || !isApiConfigured : !isSupabaseConfigured}
                onPress={setupMode ? handleCreateSuperAdmin : handleLogin}
              />
              {setupMode ? (
                <Pressable style={styles.setupLink} onPress={() => setSetupMode(false)}>
                  <Text style={styles.forgot}>Back to Login</Text>
                </Pressable>
              ) : (
                <>
                  {setupState === "needed" ? (
                    <Pressable style={styles.setupLink} onPress={() => setSetupMode(true)}>
                      <Text style={styles.setupText}>Create first Super Admin</Text>
                    </Pressable>
                  ) : null}
                  <Text style={styles.forgot}>Forgot Password</Text>
                </>
              )}
            </View>
          </BlurView>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.steel950,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: spacing.lg,
  },
  top: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  gear: {
    alignItems: "center",
    borderColor: `${colors.amber400}55`,
    borderRadius: 24,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  wordmark: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 24,
    marginTop: spacing.sm,
  },
  tagline: {
    color: colors.steel500,
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
  cardWrap: {
    paddingHorizontal: spacing.md,
  },
  blur: {
    borderRadius: 16,
    overflow: "hidden",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderColor: colors.steel700,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  headingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  heading: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 19,
  },
  subheading: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  status: {
    color: colors.steel500,
    fontFamily: typography.bodyMedium,
    fontSize: 12,
  },
  warning: {
    backgroundColor: `${colors.red}16`,
    borderColor: `${colors.red}44`,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.red,
    fontFamily: typography.bodyMedium,
    fontSize: 12,
    lineHeight: 17,
    padding: spacing.sm,
  },
  remember: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 38,
  },
  toggle: {
    backgroundColor: colors.steel700,
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    padding: 3,
    width: 44,
  },
  toggleOn: {
    backgroundColor: `${colors.amber400}55`,
  },
  thumb: {
    backgroundColor: colors.steel300,
    borderRadius: 9,
    height: 18,
    width: 18,
  },
  thumbOn: {
    backgroundColor: colors.amber400,
    marginLeft: 20,
  },
  rememberText: {
    color: colors.steel300,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  error: {
    color: colors.red,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
  },
  forgot: {
    alignSelf: "center",
    color: colors.steel300,
    fontFamily: typography.body,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  setupLink: {
    alignItems: "center",
    minHeight: 36,
    justifyContent: "center",
  },
  setupText: {
    color: colors.amber400,
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
