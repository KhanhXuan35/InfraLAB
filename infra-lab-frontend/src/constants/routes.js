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
export const SCHOOL_BASE_PATH = "/school";
export const LAB_MANAGER_BASE_PATH = "/lab-manager";
// =====================
// STUDENT ROUTES
// =====================

// Base path cho Student
export const STUDENT_BASE_PATH = "/student";

// Student Pages
export const STUDENT_ROUTES = {
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
  Conversation :`${STUDENT_BASE_PATH}/conversation`
};

export const SCHOOL_ROUTES = {
  DASHBOARD: "/school-dashboard",
  DEVICES: "/school/dashboard",
  REPAIRS: `${SCHOOL_BASE_PATH}/repairs`,
  REPAIR_DETAIL: (id) => `${SCHOOL_BASE_PATH}/repairs/${id}`,
};

export const LAB_MANAGER_ROUTES = {
  DASHBOARD: "/teacher-dashboard",
  DEVICES: `${LAB_MANAGER_BASE_PATH}/devices`,
  DEVICE_DETAIL: (id) => `${LAB_MANAGER_BASE_PATH}/device/${id}`,
  SCHOOL_DEVICES: `${LAB_MANAGER_BASE_PATH}/school-devices`,
  BORROW_RETURN: `${LAB_MANAGER_BASE_PATH}/borrow-return`,
  REPAIRS: `${LAB_MANAGER_BASE_PATH}/repairs`,
  REPAIR_DETAIL: (id) => `${LAB_MANAGER_BASE_PATH}/repairs/${id}`,
  STUDENTS: `${LAB_MANAGER_BASE_PATH}/students`,
  CERTIFICATES: `${LAB_MANAGER_BASE_PATH}/certificates`,
  REPORTS: "/reports",
  NOTIFICATIONS: "/notifications",
  CHAT: "/chat",
};