// =====================
// AUTH & GLOBAL ROUTES
// =====================
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email/:token",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:token",
  CHANGE_PASSWORD: "/change-password",
};

// =====================
// STUDENT ROUTES
// =====================

// Base path cho Student
export const STUDENT_BASE_PATH = "/student";

// Student Pages
export const STUDENT_ROUTES = {
  HOME: "/user-dashboard", // Đồng bộ với route trong App.jsx
  DEVICES: `${STUDENT_BASE_PATH}/devices`,
  DEVICE_DETAIL: (id) => `${STUDENT_BASE_PATH}/device/${id}`,

  CART: `${STUDENT_BASE_PATH}/cart`,

  // Register borrow (single + multiple)
  BORROW: (id, quantity) => {
    const base = `${STUDENT_BASE_PATH}/borrow/${id}`;
    return quantity ? `${base}?quantity=${quantity}` : base;
  },

  BORROW_MULTIPLE: `${STUDENT_BASE_PATH}/borrow/multiple`,

  // Extra features
  BORROWED: `${STUDENT_BASE_PATH}/borrowed`,
  REQUESTS: `${STUDENT_BASE_PATH}/requests`,
  HISTORY: `${STUDENT_BASE_PATH}/history`,
  NOTIFICATIONS: `${STUDENT_BASE_PATH}/notifications`,
};
