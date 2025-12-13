import React, { useEffect, useRef, useState, useMemo } from "react";
import styled from "styled-components";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";

const ChatWindow = ({ conversation, messages, onSend, onSendImage }) => {
  const currentUser = JSON.parse(localStorage.getItem("user")) || null;
  const currentUserId = currentUser?._id || currentUser?.id;
  const messageEndRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Reset search when conversation changes
  useEffect(() => {
    setSearchQuery("");
    setShowSearch(false);
  }, [conversation?._id]);

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) {
      return messages;
    }
    const query = searchQuery.toLowerCase().trim();
    return messages.filter((msg) => {
      if (msg.type === "text") {
        return (msg.content || "").toLowerCase().includes(query);
      }
      return false;
    });
  }, [messages, searchQuery]);

  if (!conversation) {
    return (
      <EmptyChat>
        <EmptyIcon>💬</EmptyIcon>
        <EmptyText>Chọn một đoạn chat để bắt đầu trò chuyện</EmptyText>
      </EmptyChat>
    );
  }

  const otherUser = conversation.participants?.find((p) => p._id !== currentUserId);

  return (
    <Window>
      <Header>
        <HeaderLeft>
          <HeaderAvatar
            src={otherUser?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${otherUser?.name || "User"}`}
            alt={otherUser?.name || "User"}
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/9.x/initials/svg?seed=${otherUser?.name || "User"}`;
            }}
          />
          <HeaderInfo>
            <HeaderName>{otherUser?.name || "Người dùng ẩn danh"}</HeaderName>
            <HeaderStatus>
              {otherUser?.role === "school_admin"
                ? "Quản trị viên"
                : otherUser?.role === "lab_manager"
                ? "Quản lý phòng lab"
                : otherUser?.role === "student"
                ? "Sinh viên"
                : "Người dùng"}
            </HeaderStatus>
          </HeaderInfo>
        </HeaderLeft>
        <HeaderIcons>
          <HeaderIconButton 
            title="Tìm kiếm" 
            aria-label="Tìm kiếm"
            onClick={() => setShowSearch(!showSearch)}
            style={{ background: showSearch ? "#e7f3ff" : "transparent" }}
          >
            <SearchOutlined style={{ fontSize: 18 }} />
          </HeaderIconButton>
          <HeaderIconButton title="Thông tin" aria-label="Thông tin">ℹ️</HeaderIconButton>
          <HeaderIconButton title="Tùy chọn" aria-label="Tùy chọn">⋯</HeaderIconButton>
        </HeaderIcons>
      </Header>

      {/* Search Bar */}
      {showSearch && (
        <SearchBarContainer>
          <Input
            placeholder="Tìm kiếm tin nhắn..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            size="large"
            style={{ borderRadius: 20 }}
          />
          {searchQuery && (
            <SearchResultText>
              Tìm thấy {filteredMessages.length} tin nhắn
            </SearchResultText>
          )}
        </SearchBarContainer>
      )}

      <MessageArea>
        <MessagesWrapper>
          {filteredMessages.length === 0 ? (
            <EmptyMessageText>
              {searchQuery 
                ? `Không tìm thấy tin nhắn nào với "${searchQuery}"`
                : "Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!"}
            </EmptyMessageText>
          ) : (
            filteredMessages.map((m) => (
              <ChatMessage
                key={m._id}
                message={{
                  type: m.type,
                  content: m.content,
                  sender: m.sender,
                  time: m.createdAt,
                  createdAt: m.createdAt,
                }}
                isOwn={(m.sender?._id || m.sender?.id) === currentUserId}
                highlightText={searchQuery}
              />
            ))
          )}
          <div ref={messageEndRef} />
        </MessagesWrapper>
      </MessageArea>
      
      <ChatInput onSend={onSend} onSendImage={onSendImage} />
    </Window>
  );
};

export default ChatWindow;

// 🎨 Styled Components - Facebook Messenger Style
const Window = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Header = styled.div`
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e4e6eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const HeaderAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: #e4e6eb;
  flex-shrink: 0;
`;

const HeaderInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const HeaderName = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: #050505;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
`;

const HeaderStatus = styled.div`
  font-size: 13px;
  color: #65676b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  margin-top: 2px;
`;

const HeaderIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const HeaderIconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  color: #050505;
  transition: background-color 0.2s;
  flex-shrink: 0;

  &:hover {
    background: #f0f2f5;
  }

  &:active {
    background: #e4e6eb;
  }
`;

const MessageArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }
`;

const MessagesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 100%;
`;

const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  color: #65676b;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 15px;
  color: #65676b;
  text-align: center;
  padding: 0 32px;
`;

const EmptyMessageText = styled.div`
  text-align: center;
  color: #65676b;
  font-size: 15px;
  padding: 32px 16px;
  background: #ffffff;
  border-radius: 12px;
  margin: 16px auto;
  max-width: 400px;
`;

const SearchBarContainer = styled.div`
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e4e6eb;
`;

const SearchResultText = styled.div`
  font-size: 12px;
  color: #65676b;
  margin-top: 8px;
  text-align: center;
`;
