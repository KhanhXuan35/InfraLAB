import Conversation from "../../models/conversation.js";
import User from "../../models/User.js";
import Message from "../../models/Message.js";
import mongoose from "mongoose";

// Helper function: Kiểm tra quyền chat giữa hai user
const canUsersChat = (senderRole, receiverRole) => {
  const chatPermissions = {
    student: ["lab_manager"],
    lab_manager: ["student", "school_admin"],
    school_admin: ["lab_manager"],
  };
  
  const allowedRoles = chatPermissions[senderRole] || [];
  return allowedRoles.includes(receiverRole);
};

export const getAllConversationsByUser = async (req, res) => {
  try {
    const userId = req.user._id; // middleware auth gắn vào req.user

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "name email role avatar",
      })
      .populate({
        path: "lastMessage",
        select: "content sender createdAt type attachmentUrl",
        populate: { path: "sender", select: "name avatar role _id" },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required and must be valid",
      });
    }

    // Lấy thông tin user hiện tại để kiểm tra role
    const sender = await User.findById(senderId).select("role");
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Kiểm tra receiver tồn tại
    const receiver = await User.findById(receiverId).select("_id role");
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    // ===== KIỂM TRA QUYỀN CHAT =====
    if (!canUsersChat(sender.role, receiver.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chat với người dùng này",
      });
    }

    // Kiểm tra xem cuộc trò chuyện giữa hai người này đã tồn tại chưa
    let existingConversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 },
    });

    if (existingConversation) {
      // Populate participants trước khi trả về
      await existingConversation.populate({
        path: "participants",
        select: "name email role avatar",
      });
      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        data: existingConversation,
      });
    }

    // Nếu chưa có -> tạo mới
    const newConversation = await Conversation.create({
      participants: [senderId, receiverId],
    });

    // Populate participants trước khi trả về
    await newConversation.populate({
      path: "participants",
      select: "name email role avatar",
    });

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: newConversation,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete conversation
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation id",
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Kiểm tra user có thuộc conversation không
    const isParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(userId.toString());
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa cuộc trò chuyện này",
      });
    }

    // Xóa conversation (hard delete)
    await Conversation.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update nickname for a participant in conversation
export const updateNickname = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, nickname } = req.body;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation id",
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Kiểm tra user hiện tại có thuộc conversation không
    const isParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(currentUserId.toString());
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Bạn không thuộc cuộc trò chuyện này",
      });
    }

    // Kiểm tra userId có thuộc conversation không
    const isTargetParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(userId.toString());
    
    if (!isTargetParticipant) {
      return res.status(400).json({
        success: false,
        message: "User không thuộc cuộc trò chuyện này",
      });
    }

    // Cập nhật hoặc xóa nickname
    if (!nickname || nickname.trim() === "") {
      // Xóa nickname nếu để trống
      conversation.nicknames.delete(userId.toString());
    } else {
      // Cập nhật nickname
      conversation.nicknames.set(userId.toString(), nickname.trim());
    }

    await conversation.save();

    // Populate participants trước khi trả về
    await conversation.populate({
      path: "participants",
      select: "name email role avatar",
    });

    res.status(200).json({
      success: true,
      message: "Nickname updated successfully",
      data: conversation,
    });
  } catch (error) {
    console.error("Error updating nickname:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get pinned messages
export const getPinnedMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation id",
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Kiểm tra user có thuộc conversation không
    const isParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(userId.toString());
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Bạn không thuộc cuộc trò chuyện này",
      });
    }

    // Lấy các tin nhắn đã ghim
    const pinnedMessages = await Message.find({
      _id: { $in: conversation.pinnedMessages },
      deleted: { $ne: true },
    })
      .populate("sender", "name email role avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: pinnedMessages,
    });
  } catch (error) {
    console.error("Error fetching pinned messages:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Pin a message
export const pinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { messageId } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation id",
      });
    }

    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message id",
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Kiểm tra user có thuộc conversation không
    const isParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(userId.toString());
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Bạn không thuộc cuộc trò chuyện này",
      });
    }

    // Kiểm tra message có thuộc conversation không
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.conversationId.toString() !== id) {
      return res.status(400).json({
        success: false,
        message: "Message không thuộc cuộc trò chuyện này",
      });
    }

    // Kiểm tra message đã được ghim chưa
    if (conversation.pinnedMessages.includes(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Message đã được ghim",
      });
    }

    // Thêm message vào danh sách ghim
    conversation.pinnedMessages.push(messageId);
    await conversation.save();

    // Populate message trước khi trả về
    const populatedMessage = await message.populate("sender", "name email role avatar");

    res.status(200).json({
      success: true,
      message: "Message pinned successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error pinning message:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Unpin a message
export const unpinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { messageId } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation id",
      });
    }

    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message id",
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Kiểm tra user có thuộc conversation không
    const isParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(userId.toString());
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Bạn không thuộc cuộc trò chuyện này",
      });
    }

    // Xóa message khỏi danh sách ghim
    conversation.pinnedMessages = conversation.pinnedMessages.filter(
      (msgId) => msgId.toString() !== messageId
    );
    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Message unpinned successfully",
    });
  } catch (error) {
    console.error("Error unpinning message:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get sent files (images and links) in conversation
export const getSentFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, type } = req.query;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation id",
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Kiểm tra user có thuộc conversation không
    const isParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(userId.toString());
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Bạn không thuộc cuộc trò chuyện này",
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Xây dựng query để lấy file và link
    let query = {
      conversationId: id,
      deleted: { $ne: true },
      $or: [
        { type: "image" },
        { type: "file" },
        { attachmentUrl: { $exists: true, $ne: null } },
        // Lấy các tin nhắn có link (kiểm tra content có chứa URL)
        {
          type: "text",
          content: {
            $regex: /https?:\/\/[^\s]+/i,
          },
        },
      ],
    };

    // Nếu có filter theo type
    if (type === "image") {
      query = {
        conversationId: id,
        deleted: { $ne: true },
        type: "image",
      };
    } else if (type === "file") {
      query = {
        conversationId: id,
        deleted: { $ne: true },
        type: "file",
      };
    } else if (type === "link") {
      query = {
        conversationId: id,
        deleted: { $ne: true },
        type: "text",
        content: {
          $regex: /https?:\/\/[^\s]+/i,
        },
      };
    }

    const messages = await Message.find(query)
      .populate("sender", "name email role avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Message.countDocuments(query);

    // Phân loại messages thành images, files, và links
    const categorized = {
      images: [],
      files: [],
      links: [],
    };

    messages.forEach((msg) => {
      if (msg.type === "image") {
        categorized.images.push(msg);
      } else if (msg.type === "file") {
        categorized.files.push(msg);
      } else if (msg.type === "text" && msg.content && /https?:\/\/[^\s]+/i.test(msg.content)) {
        // Extract links from content
        const linkMatches = msg.content.match(/https?:\/\/[^\s]+/gi);
        if (linkMatches) {
          categorized.links.push({
            ...msg.toObject(),
            extractedLinks: linkMatches,
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        all: messages.reverse(),
        categorized,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching sent files:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};