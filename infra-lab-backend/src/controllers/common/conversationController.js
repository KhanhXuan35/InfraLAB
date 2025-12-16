import Conversation from "../../models/conversation.js";
import User from "../../models/User.js";
import mongoose from "mongoose";

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