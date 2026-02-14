import api from "./api";
import { Transaction } from "../types";

export const paymentService = {
  getBalance: async () => {
    const response = await api.get<{ balance: number }>("/payments/balance");
    return response.data.balance;
  },

  getTransactions: async () => {
    const response = await api.get<Transaction[]>("/payments/transactions");
    return response.data;
  },

  deposit: async (amount: number, method?: string) => {
    const response = await api.post<{
      message: string;
      balance: number;
      transaction: Transaction;
    }>("/payments/deposit", {
      amount,
      method,
    });
    return response.data;
  },

  withdraw: async (amount: number, method?: string) => {
    const response = await api.post<{
      message: string;
      balance: number;
      transaction: Transaction;
    }>("/payments/withdraw", {
      amount,
      method,
    });
    return response.data;
  },

  transfer: async (
    recipientId: string,
    amount: number,
    description?: string,
  ) => {
    const response = await api.post<{
      message: string;
      balance: number;
      transaction: Transaction;
    }>("/payments/transfer", {
      recipientId,
      amount,
      description,
    });
    return response.data;
  },
  searchUsers: async (query: string) => {
    const response = await api.get<import("../types").User[]>("/users/search", {
      params: { query },
    });
    return response.data;
  },
  getConnections: async () => {
    const response =
      await api.get<import("../types").User[]>("/users/connections");
    return response.data;
  },
};

export default paymentService;
