import { Platform } from "react-native";
import { spacing } from "./constants";

const ANDROID_SYSTEM_NAV_GUARD = spacing.xxl;

export const getBottomSafePadding = (bottomInset: number, basePadding = 0) => {
  if (Platform.OS === "web") return basePadding;

  // Some Android classic navigation modes report little or no bottom inset.
  return Math.max(bottomInset + basePadding, Platform.OS === "android" ? ANDROID_SYSTEM_NAV_GUARD : basePadding);
};
