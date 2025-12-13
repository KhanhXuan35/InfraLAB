import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import {
  SendOutlined,
  SmileOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { Upload, Button } from "antd";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import { conversationService } from "../../services/conversationService";
import { 
  saveEmojiToFrequentlyUsed, 
  getFrequentlyUsedEmojiStrings 
} from "../../utils/emojiUtils";

const ChatInput = ({ onSend, onSendImage }) => {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [frequentlyUsedEmojis, setFrequentlyUsedEmojis] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);

  // Load frequently used emojis khi component mount
  useEffect(() => {
    const emojis = getFrequentlyUsedEmojiStrings();
    setFrequentlyUsedEmojis(emojis);
  }, [showEmojiPicker]); // Reload khi mở emoji picker để cập nhật danh sách

  const handleSend = () => {
    if (text.trim() === "") return;
    onSend(text);
    setText("");
    setShowEmojiPicker(false);
  };

  // Đóng emoji picker khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest('[data-emoji-button]')
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    
    // Lưu emoji vào frequently used
    saveEmojiToFrequentlyUsed(emoji);
    
    // Cập nhật danh sách frequently used
    const updatedEmojis = getFrequentlyUsedEmojiStrings();
    setFrequentlyUsedEmojis(updatedEmojis);
    
    // Chèn emoji vào input
    setText((prev) => prev + emoji);
    
    // Focus lại input sau khi chọn emoji
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    // Không giới hạn file size

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      onError(new Error("Chỉ cho phép upload file ảnh (jpeg, jpg, png, gif, webp)"));
      return;
    }

    // Tạo preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await conversationService.uploadImage(formData);

      if (res.imageUrl || res.data?.imageUrl) {
        const imageUrl = res.imageUrl || res.data?.imageUrl;
        onSendImage(imageUrl); // Gửi về ChatPage để emit socket
        setPreviewImage(null); // Clear preview sau khi gửi
        onSuccess();
      } else {
        throw new Error("Không nhận được URL ảnh từ server");
      }
    } catch (err) {
      console.error("❌ Upload failed:", err);
      setPreviewImage(null);
      onError(err);
      message.error(err.message || "Không thể upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container>
      {previewImage && (
        <PreviewContainer>
          <PreviewImage src={previewImage} alt="Preview" />
          <RemovePreviewButton onClick={() => setPreviewImage(null)}>
            ×
          </RemovePreviewButton>
        </PreviewContainer>
      )}
      <IconsContainer>
        <Upload
          showUploadList={false}
          customRequest={handleUpload}
          accept="image/*"
          maxCount={1}
          disabled={uploading}
        >
          <IconButton 
            title="Đính kèm ảnh" 
            disabled={uploading}
            $uploading={uploading}
          >
            {uploading ? "⏳" : <PaperClipOutlined />}
          </IconButton>
        </Upload>
        <IconButton 
          title="Emoji" 
          onClick={toggleEmojiPicker}
          data-emoji-button
          $active={showEmojiPicker}
        >
          <SmileOutlined />
        </IconButton>
      </IconsContainer>
      <InputContainer>
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Aa"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
      </InputContainer>
      {showEmojiPicker && (
        <EmojiPickerContainer ref={emojiPickerRef}>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            autoFocusSearch={false}
            skinTonesDisabled={true}
            previewConfig={{
              showPreview: false,
            }}
            width="100%"
            height="350px"
            lazyLoadEmojis={true}
            // Prop frequentlyUsedEmojis để hiển thị emoji thường dùng
            {...(frequentlyUsedEmojis.length > 0 && {
              frequentlyUsedEmojis: frequentlyUsedEmojis.slice(0, 20), // Giới hạn 20 emoji
            })}
          />
        </EmojiPickerContainer>
      )}
      {text.trim() && (
        <SendButton onClick={handleSend} title="Gửi">
          <SendOutlined />
        </SendButton>
      )}
    </Container>
  );
};

export default ChatInput;

// 🎨 Styled Components - Facebook Messenger Style
const Container = styled.div`
  display: flex;
  align-items: center;
  background: #ffffff;
  padding: 8px 16px;
  border-top: 1px solid #e4e6eb;
  gap: 8px;
  min-height: 60px;
  position: relative;
`;

const IconsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: ${props => props.$active ? "#e7f3ff" : "transparent"};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.$active ? "#1877f2" : "#65676b"};
  font-size: 20px;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: ${props => props.$active ? "#e7f3ff" : "#f0f2f5"};
    color: ${props => props.$active ? "#1877f2" : "#050505"};
  }

  &:active {
    background: #e4e6eb;
  }
`;

const InputContainer = styled.div`
  flex: 1;
  min-width: 0;
`;

const Input = styled.textarea`
  width: 100%;
  min-height: 36px;
  max-height: 120px;
  padding: 8px 12px;
  border-radius: 20px;
  border: none;
  background: #f0f2f5;
  outline: none;
  font-size: 15px;
  color: #050505;
  font-family: inherit;
  resize: none;
  line-height: 1.4;
  overflow-y: auto;

  &::placeholder {
    color: #8a8d91;
  }

  &:focus {
    background: #e4e6eb;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
`;

const SendButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #0084ff;
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: #0066cc;
    transform: scale(1.05);
  }

  &:active {
    background: #0052a3;
    transform: scale(0.95);
  }
`;

const EmojiPickerContainer = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  z-index: 1000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  background: #ffffff;

  /* Custom styles cho emoji picker */
  .epr-emoji-category-label {
    background: #ffffff !important;
  }

  .epr-search-container {
    background: #ffffff !important;
  }

  .epr-body {
    background: #ffffff !important;
  }
`;

const PreviewContainer = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  padding: 8px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PreviewImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
`;

const RemovePreviewButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #ff4d4f;
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: all 0.2s;

  &:hover {
    background: #ff7875;
    transform: scale(1.1);
  }
`;
