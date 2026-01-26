import api from "./api";
import { Deal } from "../types";

export const dealService = {
  getDeals: async () => {
    const response = await api.get<Deal[]>("/deals");
    return response.data;
  },

  createDeal: async (deal: {
    entrepreneurId: string;
    amount: string;
    equity: string;
    status?: string;
    stage: string;
    notes?: string;
  }) => {
    const response = await api.post<Deal>("/deals", deal);
    return response.data;
  },

  updateDeal: async (id: string, updates: Partial<Deal>) => {
    const response = await api.put<Deal>(`/deals/${id}`, updates);
    return response.data;
  },

  deleteDeal: async (id: string) => {
    const response = await api.delete<{ message: string }>(`/deals/${id}`);
    return response.data;
  },
};

export default dealService;
