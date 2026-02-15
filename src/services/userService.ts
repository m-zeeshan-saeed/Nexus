import api from "./api";
import { User } from "../types";

export const userService = {
  searchUsers: async (query: string = "") => {
    const response = await api.get<User[]>(`/users/search?query=${query}`);
    return response.data;
  },
};
