import type { ModuleDefinition } from "../types";
import { readInitialDarkMode } from "./themePreference";

const lightColors = {
  steel950: "#F3F4F6",
  steel900: "#FFFFFF",
  steel800: "#ECEFF3",
  steel700: "#E0E3E8",
  steel500: "#747D8C",
  steel300: "#22242A",
  steel100: "#000000",
  amber400: "#0067FF",
  amber300: "#3385FF",
  production: "#1A62E8",
  inventory: "#1FA869",
  quality: "#7E57C2",
  hr: "#E65100",
  maintenance: "#D32F2F",
  finance: "#00838F",
  red: "#D32F2F",
  emerald: "#2E7D32",
  cyan: "#0097A7",
  blue: "#0067FF",
  violet: "#8E24AA",
  orange: "#E65100",
};

const darkColors: typeof lightColors = {
  steel950: "#050B14",
  steel900: "#0F172A",
  steel800: "#1E293B",
  steel700: "#334155",
  steel500: "#94A3B8",
  steel300: "#CBD5E1",
  steel100: "#F8FAFC",
  amber400: "#3B82F6",
  amber300: "#60A5FA",
  production: "#3B82F6",
  inventory: "#22C55E",
  quality: "#38BDF8",
  hr: "#A78BFA",
  maintenance: "#F97316",
  finance: "#FACC15",
  red: "#F87171",
  emerald: "#34D399",
  cyan: "#22D3EE",
  blue: "#60A5FA",
  violet: "#A78BFA",
  orange: "#FB923C",
};

export const colors = readInitialDarkMode() ? darkColors : lightColors;

export const typography = {
  display: "Inter_700Bold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  mono: "JetBrainsMono_400Regular",
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radii = {
  cell: 8,
  card: 24,
  modal: 26,
  sheet: 32,
};

export const modules: ModuleDefinition[] = [
  { id: "production", label: "Production", icon: "factory", color: colors.production, screen: "Production" },
  { id: "inventory", label: "Inventory", icon: "package", color: colors.inventory, screen: "Inventory" },
  { id: "quality", label: "Quality", icon: "shield-check", color: colors.quality, screen: "Quality" },
  { id: "hr", label: "HR & People", icon: "users", color: colors.hr, screen: "HR" },
  { id: "maintenance", label: "Maintenance", icon: "wrench", color: colors.maintenance, screen: "Maintenance" },
  { id: "finance", label: "Finance", icon: "trending-up", color: colors.finance, screen: "Finance" },
];
