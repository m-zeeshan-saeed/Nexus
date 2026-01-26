import api from "./api";
import { Notification } from "../types";

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get<Notification[]>("/notifications");
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put<{ message: string }>(
      "/notifications/read-all",
    );
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await api.delete<{ message: string }>(
      `/notifications/${id}`,
    );
    return response.data;
  },
};

export default notificationService;
