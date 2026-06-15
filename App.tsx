import "./global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useFonts, Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform, StyleSheet, View } from "react-native";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { ParticleLoader } from "./src/components/3d/ParticleLoader";
import { ToastHost } from "./src/components/ui/ToastHost";
import { colors } from "./src/utils/constants";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    JetBrainsMono_400Regular,
    SpaceGrotesk_700Bold,
  });

  return (
    <GestureHandlerRootView style={[styles.root, Platform.OS === "web" && styles.webRoot]}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={[styles.appShell, Platform.OS === "web" && styles.webShell]}>
            <StatusBar style="dark" />
            {fontsLoaded ? <AppNavigator /> : <ParticleLoader visible message="Loading FactoryOS typography" />}
            <ToastHost />
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.steel950,
    flex: 1,
  },
  webRoot: {
    alignItems: "center",
    backgroundColor: "#DDE5DE",
    justifyContent: "center",
  },
  appShell: {
    backgroundColor: colors.steel950,
    flex: 1,
    overflow: "hidden",
    width: "100%",
  },
  webShell: {
    borderColor: colors.steel700,
    borderRadius: 24,
    borderWidth: 1,
    flexBasis: "auto",
    flexGrow: 0,
    height: "100%",
    maxWidth: "100%",
    maxHeight: 932,
    shadowColor: "#3B413C",
    shadowOpacity: 0.12,
    shadowRadius: 32,
    width: 430,
  },
});
