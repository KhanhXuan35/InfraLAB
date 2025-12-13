import React from "react";
import styled from "styled-components";
import { Image } from "antd";

const ChatMessage = ({ message, isOwn, highlightText }) => {
  const isImage = message.type === "image";
  // Lấy URL ảnh từ content hoặc attachmentUrl
  // Nếu URL là relative path, thêm base URL
  const getImageUrl = () => {
    const url = message.content || message.attachmentUrl;
    if (!url) return null;
    // Nếu URL đã là full URL (http/https), trả về nguyên
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // Nếu là relative path, thêm base URL
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
  };
  
  const imageUrl = getImageUrl();
  
  // Highlight search text in message content
  const highlightContent = (text, query) => {
    if (!query || !text) return text;
    try {
      // Escape special regex characters
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escapedQuery})`, "gi");
      const parts = text.split(regex);
      return parts.map((part, index) => 
        regex.test(part) ? (
          <HighlightedText key={index}>{part}</HighlightedText>
        ) : (
          part
        )
      );
    } catch (error) {
      // Fallback if regex fails
      return text;
    }
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <MessageRow $isOwn={isOwn}>
      <Bubble $isOwn={isOwn} $isImage={isImage}>
        {isImage && imageUrl ? (
          <ImageContainer>
            <Image
              src={imageUrl}
              alt="image-message"
              style={{ borderRadius: "12px", objectFit: "cover" }}
              preview={{
                mask: "Xem ảnh",
              }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBuyh1nDPB6XwHE0MDA3u//9/43oGBvZJDAz/Uv7//9/3////uxkYmC8B3wGgAnZgQyFjW0QAAABWZVhJZk1NACoAAAAIAAGHaQAEAAAAAQAAABoAAAAAAAOShgAHAAAAEgAAESgAAAAAAQVJSU4AAQgJAAABAgADUQIAAQAAAAEAAAAA"
              onError={(e) => {
                console.error("Error loading image:", imageUrl);
                e.target.style.display = "none";
              }}
            />
          </ImageContainer>
        ) : (
          <MessageText>
            {highlightText 
              ? highlightContent(message.content, highlightText)
              : message.content}
          </MessageText>
        )}
        <MessageTime>{formatTime(message.createdAt || message.time)}</MessageTime>
      </Bubble>
    </MessageRow>
  );
};

export default ChatMessage;

// 🎨 Styled Components - Facebook Messenger Style
const MessageRow = styled.div`
  display: flex;
  justify-content: ${({ $isOwn }) => ($isOwn ? "flex-end" : "flex-start")};
  margin: 2px 0;
  padding: 0 4px;
`;

const Bubble = styled.div`
  background: ${({ $isOwn, $isImage }) =>
    $isImage ? "transparent" : $isOwn ? "#0084ff" : "#ffffff"};
  color: ${({ $isOwn, $isImage }) =>
    $isImage ? "inherit" : $isOwn ? "#ffffff" : "#050505"};
  padding: ${({ $isImage }) => ($isImage ? "0" : "8px 12px")};
  border-radius: ${({ $isOwn }) => 
    $isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px"};
  max-width: 65%;
  word-wrap: break-word;
  box-shadow: ${({ $isImage, $isOwn }) =>
    $isImage ? "none" : $isOwn 
      ? "0 1px 2px rgba(0, 132, 255, 0.3)" 
      : "0 1px 2px rgba(0, 0, 0, 0.1)"};
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;

  &:hover {
    box-shadow: ${({ $isImage, $isOwn }) =>
      $isImage ? "none" : $isOwn 
        ? "0 2px 4px rgba(0, 132, 255, 0.4)" 
        : "0 2px 4px rgba(0, 0, 0, 0.15)"};
  }
`;

const ImageContainer = styled.div`
  border-radius: 12px;
  overflow: hidden;
  max-width: 300px;
  max-height: 400px;
  cursor: pointer;
  
  img {
    width: 100%;
    height: auto;
    max-height: 400px;
    object-fit: contain;
    display: block;
  }
  
  /* Ant Design Image preview styles */
  .ant-image {
    display: block;
  }
  
  .ant-image-img {
    border-radius: 12px;
  }
`;

const MessageText = styled.div`
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
  white-space: pre-wrap;
`;

const MessageTime = styled.div`
  font-size: 11px;
  opacity: 0.7;
  margin-top: 2px;
  align-self: flex-end;
  color: inherit;
`;

const HighlightedText = styled.span`
  background: #fff3cd;
  color: #856404;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
`;
