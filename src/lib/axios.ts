import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const persisted = localStorage.getItem("persist:auth");
    if (persisted) {
      try {
        const token = JSON.parse(JSON.parse(persisted).token || '""');
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        // ignore malformed persisted state
      }
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
