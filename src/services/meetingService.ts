import api from "./api";
import { Meeting } from "../types";

export const meetingService = {
  getMeetings: async () => {
    const response = await api.get<Meeting[]>("/meetings");
    return response.data;
  },

  scheduleMeeting: async (
    meetingData: Omit<Meeting, "id" | "status" | "createdAt">,
  ) => {
    const response = await api.post<Meeting>("/meetings", meetingData);
    return response.data;
  },

  updateMeetingStatus: async (
    meetingId: string,
    status: "accepted" | "rejected" | "cancelled",
  ) => {
    const response = await api.put<Meeting>(`/meetings/${meetingId}/status`, {
      status,
    });
    return response.data;
  },

  getMeetingById: async (meetingId: string) => {
    const response = await api.get<Meeting>(`/meetings/${meetingId}`);
    return response.data;
  },
};

export default meetingService;
