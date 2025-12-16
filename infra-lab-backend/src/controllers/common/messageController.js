import mongoose from "mongoose";
import Conversation from "../../models/conversation.js";
import Message from "../../models/Message.js";
import { emitNewMessage, emitConversationUpdate } from "../../socket/socketServer.js";

export const getConversationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid conversation id" });
    }

    // ✅ Kiểm tra conversation tồn tại
    const conversation = await Conversation.findById(id).populate(
      "participants",
      "name email role avatar"
    );
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // ✅ Lấy danh sách tin nhắn theo conversationId (phân trang)
    const messages = await Message.find({ conversationId: id })
      .populate("sender", "name email role avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Message.countDocuments({ conversationId: id });

    res.status(200).json({
      success: true,
      data: {
        conversation,
        messages: messages.reverse(), // trả về theo thời gian tăng dần
        pagination: { page: Number(page), limit: Number(limit), total },
      },
    });
  } catch (error) {
    console.error("Error fetching conversation detail:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createMessage = async (req, res) => {
  try {
    const conversationId = req.params.id || req.body.conversationId;
    const { content, type = "text", attachmentUrl, attachmentName, attachmentType } = req.body;
    const senderId = req.user._id;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: "conversationId không hợp lệ" });
    }
    // Với image type, có thể không có content (chỉ có attachmentUrl)
    if (type !== "image" && !content && !attachmentUrl) {
      return res.status(400).json({ success: false, message: "Thiếu nội dung tin nhắn" });
    }
    
    // Với image type, phải có attachmentUrl hoặc content
    if (type === "image" && !attachmentUrl && !content) {
      return res.status(400).json({ success: false, message: "Thiếu URL ảnh" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    // Đảm bảo người gửi thuộc cuộc hội thoại
    const isParticipant = conversation.participants
      .map((id) => id.toString())
      .includes(senderId.toString());
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Bạn không thuộc cuộc trò chuyện này" });
    }

    const message = await Message.create({
      conversationId,
      sender: senderId,
      content: content || "",
      type,
      attachmentUrl,
      attachmentName,
      attachmentType,
      status: "sent",
    });

    // Cập nhật lastMessage để danh sách hội thoại luôn mới nhất
    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await message.populate("sender", "name email role avatar _id");
    
    // Convert message to plain object và đảm bảo có đầy đủ thông tin
    const messageObj = populatedMessage.toObject();
    const messageData = {
      ...messageObj,
      conversationId: String(conversationId), // Đảm bảo là string
      // Đảm bảo các trường quan trọng cho image message
      type: messageObj.type || "text",
      attachmentUrl: messageObj.attachmentUrl || null,
      attachmentName: messageObj.attachmentName || null,
      attachmentType: messageObj.attachmentType || null,
      content: messageObj.content || "",
      // Đảm bảo có timestamps
      createdAt: messageObj.createdAt || new Date(),
      updatedAt: messageObj.updatedAt || new Date(),
    };

    console.log("📤 [MESSAGE] Created message, emitting to socket:", {
      messageId: messageData._id,
      conversationId: messageData.conversationId,
      type: messageData.type,
      senderId: messageData.sender?._id,
      hasAttachmentUrl: !!messageData.attachmentUrl,
      attachmentUrl: messageData.attachmentUrl,
      content: messageData.content?.substring(0, 50),
    });

    // Emit socket event để gửi tin nhắn real-time đến các clients trong conversation
    emitNewMessage(conversationId, messageData);

    // Emit conversation update để cập nhật lastMessage trong sidebar
    const updatedConversation = await Conversation.findById(conversationId)
      .populate({
        path: "participants",
        select: "name email role avatar",
      })
      .populate({
        path: "lastMessage",
        select: "content sender createdAt type attachmentUrl",
        populate: { path: "sender", select: "name avatar role _id" },
      });
    
    emitConversationUpdate(conversationId, updatedConversation);

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete/Recall message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: "Invalid message id" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Chỉ cho phép người gửi xóa tin nhắn của chính họ
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa tin nhắn này" });
    }

    // Soft delete - đánh dấu là deleted
    message.deleted = true;
    message.deletedAt = new Date();
    message.content = "Tin nhắn đã được thu hồi";
    await message.save();

    const populatedMessage = await message.populate("sender", "name email role avatar _id");
    
    // Emit socket event để cập nhật real-time
    emitNewMessage(message.conversationId.toString(), populatedMessage.toObject());
    
    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, message: "Invalid message id" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Nội dung tin nhắn không được để trống" });
    }

    if (content.length > 2000) {
      return res.status(400).json({ success: false, message: "Nội dung tin nhắn quá dài (tối đa 2000 ký tự)" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Kiểm tra tin nhắn đã bị xóa chưa
    if (message.deleted) {
      return res.status(400).json({ success: false, message: "Không thể chỉnh sửa tin nhắn đã bị xóa" });
    }

    // Chỉ cho phép người gửi chỉnh sửa tin nhắn của chính họ
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa tin nhắn này" });
    }

    // Cập nhật nội dung
    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await message.populate("sender", "name email role avatar _id");
    
    // Emit socket event để cập nhật real-time
    emitNewMessage(message.conversationId.toString(), populatedMessage.toObject());
    
    res.status(200).json({
      success: true,
      message: "Message edited successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};