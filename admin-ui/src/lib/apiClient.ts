import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LINKEST_API_SERVER_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true,
});