import api from "./api";
import { Meeting } from "../types";

export interface DashboardSummary {
  pendingRequests: number;
  totalConnections: number;
  upcomingMeetings: number;
  unreadMessages: number;
  meetings: Meeting[];
  profileViews?: number;
  totalStartups?: number;
}

export const dashboardService = {
  getSummary: async () => {
    const response = await api.get<DashboardSummary>("/dashboard/summary");
    return response.data;
  },
};

export default dashboardService;
