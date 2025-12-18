import express from "express";
import mongoose from "mongoose";
import {
  getAllConversationsByUser,
  createConversation,
  deleteConversation,
  updateNickname,
  getPinnedMessages,
  pinMessage,
  unpinMessage,
  getSentFiles,
} from "../controllers/common/conversationController.js";
import {
  getConversationDetail,
  createMessage,
  deleteMessage,
  editMessage,
} from "../controllers/common/messageController.js";
import { getChatableUsers } from "../controllers/common/userController.js";
import { checkAuthMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

const validateConversationId = (req, res, next) => {
  const { id } = req.params;
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid conversation id" });
  }
  next();
};

router.get("/", checkAuthMiddleware, getAllConversationsByUser);
router.get("/:id", checkAuthMiddleware, validateConversationId, getConversationDetail);
router.post("/", checkAuthMiddleware, createConversation);
router.delete("/:id", checkAuthMiddleware, validateConversationId, deleteConversation);
router.post("/:id/messages", checkAuthMiddleware, validateConversationId, createMessage);

// Message routes
router.delete("/messages/:messageId", checkAuthMiddleware, deleteMessage);
router.put("/messages/:messageId", checkAuthMiddleware, editMessage);

// Conversation features routes
router.put("/:id/nickname", checkAuthMiddleware, validateConversationId, updateNickname);
router.get("/:id/pinned-messages", checkAuthMiddleware, validateConversationId, getPinnedMessages);
router.post("/:id/pin-message", checkAuthMiddleware, validateConversationId, pinMessage);
router.post("/:id/unpin-message", checkAuthMiddleware, validateConversationId, unpinMessage);
router.get("/:id/files", checkAuthMiddleware, validateConversationId, getSentFiles);

// User routes for chat
router.get("/users/chatable", checkAuthMiddleware, getChatableUsers);

export default router;
