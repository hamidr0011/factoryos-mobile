import { apiRequest } from "./api";

export const notificationService = {
  getNotifications() {
    return apiRequest("/api/notifications");
  },

  markRead(id: string) {
    return apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" });
  },

  markAllRead() {
    return apiRequest("/api/notifications/read-all", { method: "PATCH" });
  },

  remove(id: string) {
    return apiRequest(`/api/notifications/${id}`, { method: "DELETE" });
  },
};
