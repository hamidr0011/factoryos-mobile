import { create } from "zustand";
import type { FactoryNotification } from "../types";
import { readInitialDarkMode, saveDarkModePreference } from "../utils/themePreference";

interface AppStore {
  notifications: FactoryNotification[];
  unreadCount: number;
  isLoading: boolean;
  isDarkMode: boolean;
  toast: { tone: "success" | "error" | "warning"; message: string } | null;
  setNotifications: (notifications: FactoryNotification[]) => void;
  addNotification: (notification: FactoryNotification) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  removeNotification: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setDarkMode: (isDarkMode: boolean) => void;
  showToast: (tone: "success" | "error" | "warning", message: string) => void;
  clearToast: () => void;
}

const unread = (items: FactoryNotification[]) => items.filter((item) => !item.is_read).length;

export const useAppStore = create<AppStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isDarkMode: readInitialDarkMode(),
  toast: null,
  setNotifications: (notifications) => set({ notifications, unreadCount: unread(notifications) }),
  addNotification: (notification) =>
    set((state) => {
      const next = [notification, ...state.notifications];
      return { notifications: next, unreadCount: unread(next) };
    }),
  markAllRead: () =>
    set((state) => {
      const next = state.notifications.map((item) => ({ ...item, is_read: true }));
      return { notifications: next, unreadCount: 0 };
    }),
  markRead: (id) =>
    set((state) => {
      const next = state.notifications.map((item) => (item.id === id ? { ...item, is_read: true } : item));
      return { notifications: next, unreadCount: unread(next) };
    }),
  removeNotification: (id) =>
    set((state) => {
      const next = state.notifications.filter((item) => item.id !== id);
      return { notifications: next, unreadCount: unread(next) };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setDarkMode: (isDarkMode) => {
    saveDarkModePreference(isDarkMode);
    set({ isDarkMode });
  },
  showToast: (tone, message) => set({ toast: { tone, message } }),
  clearToast: () => set({ toast: null }),
}));
