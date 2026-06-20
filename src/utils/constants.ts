import type { ModuleDefinition } from "../types";
import { readInitialDarkMode } from "./themePreference";

const lightColors = {
  steel950: "#F6F7FA",
  steel900: "#FFFFFF",
  steel800: "#EEF0F4",
  steel700: "#DDE1E8",
  steel500: "#6F7785",
  steel300: "#303640",
  steel100: "#111827",
  amber400: "#1A62E8",
  amber300: "#4D8AF5",
  production: "#2B63E5",
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
  steel950: "#080B10",
  steel900: "#141922",
  steel800: "#202633",
  steel700: "#343B49",
  steel500: "#9AA4B2",
  steel300: "#D1D6DE",
  steel100: "#F7F8FA",
  amber400: "#6EA8FF",
  amber300: "#93BEFF",
  production: "#6EA8FF",
  inventory: "#22C55E",
  quality: "#A78BFA",
  hr: "#FDBA74",
  maintenance: "#F87171",
  finance: "#22D3EE",
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
  cell: 10,
  card: 24,
  modal: 28,
  sheet: 32,
};

export const typeScale = {
  hero: 24,
  title: 21,
  section: 16,
  body: 14,
  bodySmall: 12,
  caption: 11,
  micro: 10,
};

export const modules: ModuleDefinition[] = [
  { id: "production", label: "Production", icon: "factory", color: colors.production, screen: "Production" },
  { id: "inventory", label: "Inventory", icon: "package", color: colors.inventory, screen: "Inventory" },
  { id: "quality", label: "Quality", icon: "shield-check", color: colors.quality, screen: "Quality" },
  { id: "hr", label: "HR & People", icon: "users", color: colors.hr, screen: "HR" },
  { id: "maintenance", label: "Maintenance", icon: "wrench", color: colors.maintenance, screen: "Maintenance" },
  { id: "finance", label: "Finance", icon: "trending-up", color: colors.finance, screen: "Finance" },
];
