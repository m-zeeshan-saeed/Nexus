import api from "./api";
import { SupportTicket } from "../types";

export const supportService = {
  getTickets: async () => {
    const response = await api.get<SupportTicket[]>("/support/tickets");
    return response.data;
  },

  createTicket: async (ticket: {
    name: string;
    email: string;
    subject?: string;
    message: string;
    priority?: string;
  }) => {
    const response = await api.post<SupportTicket>("/support/tickets", ticket);
    return response.data;
  },

  updateTicket: async (
    id: string,
    updates: { status?: string; priority?: string },
  ) => {
    const response = await api.put<SupportTicket>(
      `/support/tickets/${id}`,
      updates,
    );
    return response.data;
  },
};

export default supportService;
