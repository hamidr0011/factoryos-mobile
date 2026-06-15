import { BlurView } from "expo-blur";
import { Factory } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { isSupabaseConfigured } from "../../services/supabase";
import { colors, spacing, typography } from "../../utils/constants";
import { isEmail } from "../../utils/validators";

export const LoginScreen = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const shake = useSharedValue(0);
  const spin = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const gearStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const handleLogin = async () => {
    if (!isEmail(email)) {
      setError("Enter a valid email address.");
      shake.value = withSequence(withTiming(-10), withTiming(10), withTiming(-6), withTiming(0));
      return;
    }
    setLoading(true);
    setError("");
    spin.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1, false);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Check credentials.");
      shake.value = withSequence(withTiming(-10), withTiming(10), withTiming(-6), withTiming(0));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
                <Text style={styles.heading}>Secure Access</Text>
                <Text style={styles.subheading}>{isSupabaseConfigured ? "Sign in with your FactoryOS account." : "Supabase credentials are not configured for this build."}</Text>
              </View>
              <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="name@company.com" />
              <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" />
              <Pressable style={styles.remember} onPress={() => setRemember((value) => !value)}>
                <View style={[styles.toggle, remember && styles.toggleOn]}>
                  <View style={[styles.thumb, remember && styles.thumbOn]} />
                </View>
                <Text style={styles.rememberText}>Remember Me</Text>
              </Pressable>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button title="Login" loading={loading} disabled={!isSupabaseConfigured} onPress={handleLogin} />
              <Text style={styles.forgot}>Forgot Password</Text>
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
    fontSize: 34,
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
    backgroundColor: "rgba(255,252,245,0.92)",
    borderColor: colors.steel700,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  heading: {
    color: colors.steel100,
    fontFamily: typography.display,
    fontSize: 22,
  },
  subheading: {
    color: colors.steel500,
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
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
    color: colors.maintenance,
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
});
