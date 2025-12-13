import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io = null;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware để xác thực socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
      
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
      const user = await User.findById(decoded.id).select("-password -refreshToken");
      
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: " + error.message));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.user.name})`);

    // Join room cho user (để nhận tin nhắn gửi đến user này)
    socket.join(`user:${socket.userId}`);

    // Join các conversation rooms mà user tham gia
    socket.on("join_conversations", async (conversationIds) => {
      if (Array.isArray(conversationIds)) {
        conversationIds.forEach((convId) => {
          const roomId = String(convId);
          const room = `conversation:${roomId}`;
          socket.join(room);
          console.log(`📥 [SOCKET] User ${socket.userId} joined conversation: ${roomId}`);
        });
        console.log(`📥 [SOCKET] User ${socket.userId} joined ${conversationIds.length} conversation(s)`);
      }
    });

    // Join một conversation cụ thể
    socket.on("join_conversation", (conversationId) => {
      // Đảm bảo conversationId là string
      const convId = String(conversationId);
      const room = `conversation:${convId}`;
      socket.join(room);
      console.log(`📥 [SOCKET] User ${socket.userId} joined conversation: ${convId}`);
      
      // Log số lượng clients trong room sau khi join
      const roomClients = io.sockets.adapter.rooms.get(room);
      const clientCount = roomClients ? roomClients.size : 0;
      console.log(`📥 [SOCKET] Room ${room} now has ${clientCount} client(s)`);
    });

    // Leave một conversation
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`📤 User ${socket.userId} left conversation: ${conversationId}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Helper function để emit message đến conversation
export const emitNewMessage = (conversationId, message) => {
  if (io) {
    // Đảm bảo conversationId là string
    const convId = typeof conversationId === 'object' ? conversationId.toString() : String(conversationId);
    
    // Đảm bảo message có conversationId là string
    const messageData = {
      ...message,
      conversationId: convId, // Đảm bảo conversationId trong message là string
    };
    
    const room = `conversation:${convId}`;
    console.log(`📤 [SOCKET] Emitting new_message to room: ${room}`);
    console.log(`📤 [SOCKET] Message data:`, {
      _id: messageData._id,
      conversationId: messageData.conversationId,
      type: messageData.type,
      sender: messageData.sender?._id || messageData.sender,
    });
    
    // Emit đến room conversation
    io.to(room).emit("new_message", messageData);
    
    // Log số lượng clients trong room
    const roomClients = io.sockets.adapter.rooms.get(room);
    const clientCount = roomClients ? roomClients.size : 0;
    console.log(`📤 [SOCKET] Room ${room} has ${clientCount} client(s)`);
  } else {
    console.error("❌ [SOCKET] io is not initialized");
  }
};

// Helper function để emit message đến user cụ thể
export const emitMessageToUser = (userId, message) => {
  if (io) {
    io.to(`user:${userId}`).emit("new_message", message);
    console.log(`📤 Emitted new message to user: ${userId}`);
  }
};

// Helper function để emit conversation update
export const emitConversationUpdate = (conversationId, conversation) => {
  if (io) {
    // Đảm bảo conversationId là string
    const convId = typeof conversationId === 'object' ? conversationId.toString() : conversationId;
    io.to(`conversation:${convId}`).emit("conversation_updated", conversation);
    console.log(`📤 Emitted conversation update: ${convId}`);
  }
};

export default io;

