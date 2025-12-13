import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true, maxlength: 2000 },
    type: { type: String, enum: ["text", "image", "file"], default: "text" },
    attachmentUrl: { type: String },
    attachmentName: { type: String },
    attachmentType: { type: String },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
    readAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
