import api from "./api";

export const login = (data) => api.post("/auth/login", data);
export const register = (data) => api.post("/auth/register", data);
export const verifyEmail = (token) => api.get(`/auth/verify-email/${token}`);
export const googleLogin = (token) => api.post("/auth/google-login", { token });