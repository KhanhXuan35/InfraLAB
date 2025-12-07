export const ROUTES = {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    VERIFY_EMAIL: "/verify-email/:token",
};

export const STUDENT_ROUTES = {
    HOME: "/user-dashboard",
    DEVICES: "/devices",
    DEVICE_DETAIL: (id) => `/devices/${id}`,
    CART: "/cart",
    BORROWED: "/borrowed",
    REQUESTS: "/requests",
    HISTORY: "/history",
    NOTIFICATIONS: "/notifications",
};