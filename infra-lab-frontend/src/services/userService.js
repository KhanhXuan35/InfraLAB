import api from "./api"; // Import instance axios đã cấu hình của bạn

// 1. Lấy danh sách Active
export const getActiveStudents = async () => {
    const response = await api.get("/users/students");
    return response.data; // Trả về { success: true, data: [...] }
};

// 2. Lấy danh sách Pending (Chờ duyệt)
export const getPendingStudents = async () => {
    const response = await api.get("/users/students/pending");
    return response.data;
};

// 3. Xem chi tiết
export const getStudentDetail = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

// 4. Cập nhật sinh viên
export const updateStudent = async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
};

// 5. Xóa mềm
export const softDeleteStudent = async (id) => {
    const response = await api.patch(`/users/${id}/soft-delete`);
    return response.data;
};

// 6. Xóa cứng
export const hardDeleteStudent = async (id) => {
    const response = await api.patch(`/users/${id}/hard-delete`);
    return response.data;
};

// 7. Duyệt sinh viên
export const approveStudents = async (userIds) => {
    const response = await api.post("/users/approve", { userIds });
    return response.data;
};

export const userService = {
  // Lấy danh sách users có thể chat (tùy theo role)
  getChatableUsers: () => {
    return api.get("/conversations/users/chatable");
  },

  // Lấy thông tin user
  getUserById: (userId) => {
    return api.get(`/users/${userId}`);
  },
};

