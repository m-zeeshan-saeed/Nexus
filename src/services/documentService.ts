import api from "./api";
import { Document } from "../types";

export const documentService = {
  getDocuments: async () => {
    const response = await api.get<Document[]>("/documents");
    return response.data;
  },

  uploadDocument: async (doc: {
    name: string;
    type: string;
    size: string;
    content: string;
    shared?: boolean;
  }) => {
    const response = await api.post<Document>("/documents", doc);
    return response.data;
  },

  deleteDocument: async (id: string) => {
    const response = await api.delete<{ message: string }>(`/documents/${id}`);
    return response.data;
  },

  toggleShare: async (id: string) => {
    const response = await api.put<Document>(`/documents/${id}/share`);
    return response.data;
  },
};

export default documentService;
