import api from "./api";

export const conversationService = {
  // Lấy tất cả conversations của user hiện tại
  getAllConversations: () => {
    return api.get("/conversations");
  },

  // Tạo conversation mới
  createConversation: (receiverId) => {
    return api.post("/conversations", { receiverId });
  },

  // Lấy chi tiết conversation và messages
  getConversationDetail: (conversationId, page = 1, limit = 50) => {
    return api.get(`/conversations/${conversationId}`, {
      params: { page, limit },
    });
  },

  // Gửi tin nhắn
  sendMessage: (conversationId, content, type = "text", attachmentUrl = null, attachmentName = null, attachmentType = null) => {
    return api.post(`/conversations/${conversationId}/messages`, {
      content,
      type,
      attachmentUrl,
      attachmentName,
      attachmentType,
    });
  },

  // Upload ảnh
  uploadImage: async (formData) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/upload/image`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  },

  // Xóa tin nhắn (thu hồi)
  deleteMessage: (messageId) => {
    return api.delete(`/conversations/messages/${messageId}`);
  },

  // Chỉnh sửa tin nhắn
  editMessage: (messageId, content) => {
    return api.put(`/conversations/messages/${messageId}`, { content });
  },

  // Xóa cuộc trò chuyện
  deleteConversation: (conversationId) => {
    return api.delete(`/conversations/${conversationId}`);
  },

  // Cập nhật biệt danh
  updateNickname: (conversationId, userId, nickname) => {
    return api.put(`/conversations/${conversationId}/nickname`, {
      userId,
      nickname,
    });
  },

  // Lấy tin nhắn đã ghim
  getPinnedMessages: (conversationId) => {
    return api.get(`/conversations/${conversationId}/pinned-messages`);
  },

  // Ghim tin nhắn
  pinMessage: (conversationId, messageId) => {
    return api.post(`/conversations/${conversationId}/pin-message`, {
      messageId,
    });
  },

  // Bỏ ghim tin nhắn
  unpinMessage: (conversationId, messageId) => {
    return api.post(`/conversations/${conversationId}/unpin-message`, {
      messageId,
    });
  },

  // Lấy các file đã gửi (ảnh, file, link)
  getSentFiles: (conversationId, page = 1, limit = 50, type = null) => {
    const params = { page, limit };
    if (type) {
      params.type = type;
    }
    return api.get(`/conversations/${conversationId}/files`, { params });
  },
};

