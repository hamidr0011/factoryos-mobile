export const darkModeStorageKey = "factoryos.darkMode";

export const readInitialDarkMode = () => {
  try {
    const storage = globalThis.localStorage;
    return storage?.getItem(darkModeStorageKey) === "true";
  } catch {
    return false;
  }
};

export const saveDarkModePreference = (enabled: boolean) => {
  try {
    globalThis.localStorage?.setItem(darkModeStorageKey, enabled ? "true" : "false");
  } catch {
    // Native storage is async; the in-memory setting still updates immediately.
  }
};
