import api from "./api";

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

