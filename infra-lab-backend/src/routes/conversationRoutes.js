import express from "express";
import mongoose from "mongoose";
import {
  getAllConversationsByUser,
  createConversation,
} from "../controllers/common/conversationController.js";
import {
  getConversationDetail,
  createMessage,
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
router.post("/:id/messages", checkAuthMiddleware, validateConversationId, createMessage);

// User routes for chat
router.get("/users/chatable", checkAuthMiddleware, getChatableUsers);

export default router;
