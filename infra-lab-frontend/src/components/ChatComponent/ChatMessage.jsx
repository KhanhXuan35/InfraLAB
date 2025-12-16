import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Image, Dropdown, Modal, Input, message as antdMessage } from "antd";
import { useNavigate } from "react-router-dom";
import { STUDENT_ROUTES } from "../../constants/routes";
import { EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const ChatMessage = ({ message, isOwn, highlightText, onEdit, onDelete, messageId }) => {
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const messageRef = useRef(null);
  const isImage = message.type === "image";
  const isDeleted = message.deleted;
  const isEdited = message.edited;
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
  
  // Parse content to render product links
  const renderContentWithLinks = (text, query) => {
    if (!text) return null;
    
    // Pattern to match product links: /student/device/:id or full URL containing /student/device/:id
    // Supports both relative paths and full URLs
    const productLinkPattern = /(https?:\/\/[^\s]*\/student\/device\/([a-zA-Z0-9_-]+)|(?:^|\s)(\/student\/device\/([a-zA-Z0-9_-]+)))/g;
    
    let lastIndex = 0;
    const parts = [];
    let match;
    let key = 0;
    const matches = [];
    
    // Collect all matches first (to avoid issues with regex exec in a loop)
    let tempMatch;
    while ((tempMatch = productLinkPattern.exec(text)) !== null) {
      matches.push(tempMatch);
    }
    
    // Process each match
    matches.forEach((match) => {
      // Add text before the link
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          parts.push({ type: 'text', content: beforeText, key: key++ });
        }
      }
      
      // Extract device ID (match[2] for full URL, match[4] for relative path)
      const deviceId = match[2] || match[4];
      const fullMatch = match[0].trim();
      
      // Add the link
      if (deviceId) {
        parts.push({ 
          type: 'productLink', 
          content: fullMatch,
          deviceId,
          key: key++
        });
      }
      
      lastIndex = match.index + match[0].length;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push({ type: 'text', content: remainingText, key: key++ });
      }
    }
    
    // If no product links found, return original text (with highlight if needed)
    if (parts.length === 0) {
      return query ? highlightContent(text, query) : text;
    }
    
    // Render parts with product links and highlight search text
    return parts.map((part) => {
      if (part.type === 'productLink') {
        return (
          <ProductLink
            key={part.key}
            onClick={(e) => {
              e.preventDefault();
              navigate(STUDENT_ROUTES.DEVICE_DETAIL(part.deviceId));
            }}
            $isOwn={isOwn}
          >
            {part.content}
          </ProductLink>
        );
      } else {
        // Apply highlight to text parts if query exists
        return query ? (
          <span key={part.key}>{highlightContent(part.content, query)}</span>
        ) : (
          <span key={part.key}>{part.content}</span>
        );
      }
    });
  };
  
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

  const handleEditClick = () => {
    setEditContent(message.content);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim()) {
      antdMessage.error("Nội dung không được để trống");
      return;
    }
    if (editContent.trim() === message.content) {
      setShowEditModal(false);
      return;
    }
    setIsEditing(true);
    try {
      await onEdit(messageId, editContent.trim());
      setShowEditModal(false);
      antdMessage.success("Đã chỉnh sửa tin nhắn");
    } catch (error) {
      console.error("Error editing message:", error);
      antdMessage.error(error.response?.data?.message || "Không thể chỉnh sửa tin nhắn");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteClick = () => {
    Modal.confirm({
      title: "Xóa tin nhắn",
      content: "Bạn có chắc chắn muốn thu hồi tin nhắn này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await onDelete(messageId);
          antdMessage.success("Đã thu hồi tin nhắn");
        } catch (error) {
          console.error("Error deleting message:", error);
          antdMessage.error(error.response?.data?.message || "Không thể xóa tin nhắn");
        }
      },
    });
  };

  const menuItems = isOwn && !isDeleted && !isImage ? [
    {
      key: "edit",
      label: "Chỉnh sửa",
      icon: <EditOutlined />,
      onClick: handleEditClick,
    },
    {
      key: "delete",
      label: "Thu hồi",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDeleteClick,
    },
  ] : isOwn && !isDeleted ? [
    {
      key: "delete",
      label: "Thu hồi",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDeleteClick,
    },
  ] : [];

  return (
    <>
      <MessageRow $isOwn={isOwn} ref={messageRef}>
        <BubbleContainer>
          {menuItems.length > 0 && (
            <Dropdown
              menu={{ items: menuItems }}
              trigger={["click"]}
              placement={isOwn ? "bottomRight" : "bottomLeft"}
            >
              <MoreButton className="more-button" $isOwn={isOwn}>
                <MoreOutlined />
              </MoreButton>
            </Dropdown>
          )}
          <Bubble $isOwn={isOwn} $isImage={isImage} $isDeleted={isDeleted}>
            {isImage && imageUrl && !isDeleted ? (
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
              {renderContentWithLinks(message.content, highlightText)}
            </MessageText>
          )}
            <MessageFooter>
              <MessageTime $isDeleted={isDeleted}>
                {formatTime(message.createdAt || message.time)}
                {isEdited && !isDeleted && (
                  <EditedLabel $isOwn={isOwn}> (Đã chỉnh sửa)</EditedLabel>
                )}
              </MessageTime>
            </MessageFooter>
          </Bubble>
        </BubbleContainer>
      </MessageRow>

      <Modal
        title="Chỉnh sửa tin nhắn"
        open={showEditModal}
        onOk={handleEditSubmit}
        onCancel={() => setShowEditModal(false)}
        confirmLoading={isEditing}
        okText="Lưu"
        cancelText="Hủy"
      >
        <TextArea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          maxLength={2000}
          showCount
          placeholder="Nhập nội dung tin nhắn"
        />
      </Modal>
    </>
  );
};

export default ChatMessage;

// 🎨 Styled Components - Facebook Messenger Style
const MessageRow = styled.div`
  display: flex;
  justify-content: ${({ $isOwn }) => ($isOwn ? "flex-end" : "flex-start")};
  margin: 2px 0;
  padding: 0 4px;
  position: relative;
`;

const BubbleContainer = styled.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 65%;
  
  &:hover .more-button {
    opacity: 1;
  }
`;

const MoreButton = styled.button`
  opacity: 0;
  transition: opacity 0.2s;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #65676b;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  
  &:hover {
    background: #f0f2f5;
  }
`;

const Bubble = styled.div`
  background: ${({ $isOwn, $isImage, $isDeleted }) =>
    $isImage ? "transparent" : $isDeleted 
      ? "#f0f0f0" 
      : $isOwn ? "#0084ff" : "#ffffff"};
  color: ${({ $isOwn, $isImage, $isDeleted }) =>
    $isImage ? "inherit" : $isDeleted
      ? "#999"
      : $isOwn ? "#ffffff" : "#050505"};
  padding: ${({ $isImage }) => ($isImage ? "0" : "8px 12px")};
  border-radius: ${({ $isOwn }) => 
    $isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px"};
  flex: 1;
  word-wrap: break-word;
  box-shadow: ${({ $isImage, $isOwn, $isDeleted }) =>
    $isImage || $isDeleted ? "none" : $isOwn 
      ? "0 1px 2px rgba(0, 132, 255, 0.3)" 
      : "0 1px 2px rgba(0, 0, 0, 0.1)"};
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;

  &:hover {
    box-shadow: ${({ $isImage, $isOwn, $isDeleted }) =>
      $isImage || $isDeleted ? "none" : $isOwn 
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
  font-style: ${({ $isDeleted }) => $isDeleted ? "italic" : "normal"};
  opacity: ${({ $isDeleted }) => $isDeleted ? 0.7 : 1};
`;

const MessageFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
`;

const MessageTime = styled.div`
  font-size: 11px;
  opacity: ${({ $isDeleted }) => $isDeleted ? 0.5 : 0.7};
  color: inherit;
`;

const EditedLabel = styled.span`
  font-size: 10px;
  opacity: 0.6;
  font-style: italic;
  color: inherit;
`;

const HighlightedText = styled.span`
  background: #fff3cd;
  color: #856404;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
`;

const ProductLink = styled.span`
  color: ${({ $isOwn }) => $isOwn ? "#ffffff" : "#1890ff"};
  text-decoration: underline;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
  
  &:active {
    opacity: 0.6;
  }
`;
