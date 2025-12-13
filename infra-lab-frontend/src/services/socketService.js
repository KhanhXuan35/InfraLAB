import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const serverUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    
    this.socket = io(serverUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket.id);
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join một conversation
  joinConversation(conversationId) {
    if (this.socket?.connected) {
      // Đảm bảo conversationId là string
      const convId = String(conversationId);
      console.log("📥 [SOCKET SERVICE] Joining conversation:", convId);
      this.socket.emit("join_conversation", convId);
    } else {
      console.warn("⚠️ [SOCKET SERVICE] Socket not connected, cannot join conversation");
    }
  }

  // Join nhiều conversations
  joinConversations(conversationIds) {
    if (this.socket?.connected && Array.isArray(conversationIds)) {
      // Đảm bảo tất cả conversationIds là string
      const normalizedIds = conversationIds.map(id => String(id));
      console.log("📥 [SOCKET SERVICE] Joining conversations:", normalizedIds);
      this.socket.emit("join_conversations", normalizedIds);
    } else {
      console.warn("⚠️ [SOCKET SERVICE] Socket not connected, cannot join conversations");
    }
  }

  // Leave một conversation
  leaveConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit("leave_conversation", conversationId);
    }
  }

  // Listen cho tin nhắn mới
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  // Remove listener cho tin nhắn mới
  offNewMessage(callback) {
    if (this.socket) {
      this.socket.off("new_message", callback);
    }
  }

  // Listen cho conversation update
  onConversationUpdate(callback) {
    if (this.socket) {
      this.socket.on("conversation_updated", callback);
    }
  }

  // Remove listener cho conversation update
  offConversationUpdate(callback) {
    if (this.socket) {
      this.socket.off("conversation_updated", callback);
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;

