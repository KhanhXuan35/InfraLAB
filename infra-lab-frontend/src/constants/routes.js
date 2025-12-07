// Base path for student routes
export const STUDENT_BASE_PATH = '/student';

// Student routes
export const STUDENT_ROUTES = {
  DEVICES: `${STUDENT_BASE_PATH}/devices`,
  DEVICE_DETAIL: (id) => `${STUDENT_BASE_PATH}/device/${id}`,
  BORROW: (id, quantity) => {
    const base = `${STUDENT_BASE_PATH}/borrow/${id}`;
    return quantity ? `${base}?quantity=${quantity}` : base;
  },
  BORROW_MULTIPLE: `${STUDENT_BASE_PATH}/borrow/multiple`,
  CART: `${STUDENT_BASE_PATH}/cart`
};



