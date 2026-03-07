import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Send cookies with every request
});

// Request interceptor: attach access token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("access_token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip auto-refresh for auth endpoints (login, register, refresh)
        // Their 401s mean "wrong credentials", not "expired token"
        // Skip auto-refresh for specific auth endpoints that shouldn't trigger refresh
        const url = originalRequest?.url || "";
        const isAuthAction = url.includes("/auth/login") ||
            url.includes("/auth/register") ||
            url.includes("/auth/refresh");

        if (isAuthAction) {
            return Promise.reject(error);
        }

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Call refresh endpoint — cookie is sent automatically
                const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                    withCredentials: true,
                });

                const { access_token } = res.data.data;

                // Store new access token
                localStorage.setItem("access_token", access_token);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch {
                // Refresh failed — clear everything
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");

                if (typeof window !== "undefined") {
                    // Flag for login page to show session expired toast
                    sessionStorage.setItem("session_expired", "true");
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
