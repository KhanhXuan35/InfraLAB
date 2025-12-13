import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Spin, message } from "antd";
import ChatSidebar from "../../../components/ChatComponent/ChatSidebar";
import ChatWindow from "../../../components/ChatComponent/ChatWindow";
import { conversationService } from "../../../services/conversationService";
import socketService from "../../../services/socketService";

const Chat = () => {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const previousConversationIdRef = useRef(null);
  const lastUrlConversationIdRef = useRef(null);
  const hasInitialLoadRef = useRef(false);

  // Load current user và kết nối socket
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || null;
    setCurrentUser(user);

    // Kết nối socket
    const token = localStorage.getItem("accessToken");
    if (token) {
      socketService.connect(token);
    }

    // Cleanup khi unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Setup socket listeners
  useEffect(() => {
    // Listen cho tin nhắn mới
    const handleNewMessage = (newMessage) => {
      console.log("📨 [SOCKET] New message received:", {
        id: newMessage._id,
        type: newMessage.type,
        conversationId: newMessage.conversationId,
        hasAttachmentUrl: !!newMessage.attachmentUrl,
        attachmentUrl: newMessage.attachmentUrl,
        content: newMessage.content?.substring(0, 50),
        sender: newMessage.sender?._id || newMessage.sender?.name,
      });
      
      // Normalize conversationId từ message (luôn convert về string)
      let msgConversationId = null;
      if (newMessage.conversationId) {
        if (typeof newMessage.conversationId === 'object' && newMessage.conversationId._id) {
          msgConversationId = newMessage.conversationId._id.toString();
        } else {
          msgConversationId = newMessage.conversationId.toString();
        }
      }
      
      // Normalize current conversationId (luôn convert về string)
      const currentConversationId = selectedConversation?._id 
        ? selectedConversation._id.toString() 
        : null;
      
      console.log("📨 [SOCKET] Message conversationId:", msgConversationId);
      console.log("📨 [SOCKET] Current conversationId:", currentConversationId);
      console.log("📨 [SOCKET] Message type:", newMessage.type);
      if (newMessage.type === "image") {
        console.log("🖼️ [SOCKET] Image message - attachmentUrl:", newMessage.attachmentUrl);
        console.log("🖼️ [SOCKET] Image message - content:", newMessage.content);
      }
      
      // Nếu đang xem conversation này, thêm tin nhắn vào messages ngay lập tức
      if (msgConversationId && msgConversationId === currentConversationId) {
        console.log("✅ [SOCKET] Adding message to current conversation");
        setMessages((prev) => {
          // Kiểm tra xem tin nhắn đã tồn tại chưa (tránh duplicate)
          const exists = prev.some((msg) => {
            const msgId = msg._id?.toString() || msg._id;
            const newMsgId = newMessage._id?.toString() || newMessage._id;
            return msgId === newMsgId;
          });
          if (exists) {
            console.log("⚠️ [SOCKET] Message already exists, skipping");
            return prev;
          }
          console.log("✅ [SOCKET] Message added to messages list", {
            type: newMessage.type,
            hasAttachmentUrl: !!newMessage.attachmentUrl,
          });
          return [...prev, newMessage];
        });
      }
      
      // LUÔN cập nhật conversations list để cập nhật lastMessage trong sidebar
      // (kể cả khi đang xem conversation đó hay không)
      if (msgConversationId) {
        console.log("🔄 [SOCKET] Updating conversations list");
        setConversations((prev) => {
          return prev.map((conv) => {
            const convId = conv._id?.toString() || conv._id;
            if (convId === msgConversationId) {
              console.log("✅ [SOCKET] Updated conversation lastMessage");
              return {
                ...conv,
                lastMessage: newMessage,
                updatedAt: newMessage.createdAt || new Date(),
              };
            }
            return conv;
          });
        });
      }
    };

    // Listen cho conversation update (cập nhật lastMessage)
    const handleConversationUpdate = (updatedConversation) => {
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv._id === updatedConversation._id) {
            // Transform để có otherUser
            const currentUserId = currentUser?._id || currentUser?.id;
            const otherUser = updatedConversation.participants?.find(
              (p) => (p._id || p.id) !== currentUserId
            );
            return {
              ...updatedConversation,
              otherUser,
            };
          }
          return conv;
        });
      });

      // Chỉ cập nhật selectedConversation nếu đang xem conversation này
      // và chỉ cập nhật lastMessage, không thay đổi toàn bộ object để tránh trigger useEffect
      if (selectedConversation?._id === updatedConversation._id) {
        setSelectedConversation((prev) => {
          if (!prev) return null;
          // Chỉ cập nhật lastMessage, giữ nguyên các thông tin khác
          return {
            ...prev,
            lastMessage: updatedConversation.lastMessage,
            updatedAt: updatedConversation.updatedAt,
          };
        });
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onConversationUpdate(handleConversationUpdate);

    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.offConversationUpdate(handleConversationUpdate);
    };
  }, [selectedConversation, currentUser]);

  // Load conversations - với option để không hiển thị loading
  const loadConversations = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await conversationService.getAllConversations();
      const data = response?.data || response || [];
      
      // Transform conversations để có otherUser
      const transformedConversations = data.map((conv) => {
        const currentUserId = currentUser?._id || currentUser?.id;
        const otherUser = conv.participants?.find(
          (p) => (p._id || p.id) !== currentUserId
        );
        return {
          ...conv,
          otherUser,
        };
      });
      
      setConversations((prevConversations) => {
        // Chỉ cập nhật nếu có thay đổi thực sự (tránh re-render không cần thiết)
        const hasChanged = 
          prevConversations.length !== transformedConversations.length ||
          prevConversations.some((prev, idx) => {
            const curr = transformedConversations[idx];
            return !curr || prev._id !== curr._id || 
                   prev.lastMessage?._id !== curr.lastMessage?._id;
          });
        
        return hasChanged ? transformedConversations : prevConversations;
      });

      // Join tất cả conversations vào socket rooms để nhận tin nhắn real-time
      const conversationIds = transformedConversations.map((c) => {
        // Đảm bảo conversationId là string
        return c._id?.toString() || c._id;
      }).filter(Boolean); // Loại bỏ null/undefined
      
      if (conversationIds.length > 0) {
        console.log("📥 [SOCKET] Joining conversations:", conversationIds);
        socketService.joinConversations(conversationIds);
      }

      // Nếu có conversationId trong URL và chưa có selectedConversation, tìm và chọn
      if (conversationId) {
        setSelectedConversation((prev) => {
          // Chỉ set nếu chưa có hoặc conversationId khác
          if (!prev || prev._id !== conversationId) {
            const found = transformedConversations.find(
              (c) => c._id === conversationId
            );
            return found || prev;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      message.error("Không thể tải danh sách cuộc trò chuyện");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [currentUser?.id, conversationId]);

  // Load messages của conversation
  const loadMessages = useCallback(async (convId) => {
    if (!convId) {
      setMessages([]);
      return;
    }

    try {
      setLoadingMessages(true);
      const response = await conversationService.getConversationDetail(convId);
      const data = response?.data || response || {};
      
      setMessages(data.messages || []);
      
      // Không cập nhật selectedConversation ở đây để tránh vòng lặp
      // selectedConversation đã được set từ loadConversations hoặc handleSelectConversation
    } catch (error) {
      console.error("Error loading messages:", error);
      message.error("Không thể tải tin nhắn");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Load conversations chỉ một lần khi component mount
  useEffect(() => {
    if (!hasInitialLoadRef.current && currentUser) {
      hasInitialLoadRef.current = true;
      loadConversations(true); // Hiển thị loading lần đầu
    }
  }, [currentUser, loadConversations]);

  // Load messages khi chọn conversation và join socket room
  useEffect(() => {
    const convId = selectedConversation?._id;
    
    if (convId) {
      // Chỉ load messages nếu conversationId thay đổi
      if (previousConversationIdRef.current !== convId) {
        // Clear messages ngay lập tức để hiển thị loading state
        setMessages([]);
        
        // Load messages mới
        loadMessages(convId);
        
        // Leave conversation cũ và join conversation mới
        if (previousConversationIdRef.current) {
          const prevConvId = previousConversationIdRef.current?.toString() || previousConversationIdRef.current;
          socketService.leaveConversation(prevConvId);
        }
        // Đảm bảo conversationId là string khi join
        const convIdStr = convId?.toString() || convId;
        console.log("📥 [CHAT] Joining conversation:", convIdStr);
        socketService.joinConversation(convIdStr);
        previousConversationIdRef.current = convId;
      }
    } else {
      setMessages([]);
      // Leave conversation khi không chọn conversation nào
      if (previousConversationIdRef.current) {
        socketService.leaveConversation(previousConversationIdRef.current);
        previousConversationIdRef.current = null;
      }
    }
  }, [selectedConversation?._id]);

  // Sync với URL - chỉ khi conversationId trong URL thay đổi
  useEffect(() => {
    // Chỉ xử lý nếu conversationId trong URL thay đổi
    if (lastUrlConversationIdRef.current === conversationId) {
      return;
    }
    
    lastUrlConversationIdRef.current = conversationId;
    
    if (conversationId && selectedConversation?._id !== conversationId) {
      // Tìm conversation trong list hiện tại
      const found = conversations.find((c) => c._id === conversationId);
      if (found) {
        // Chỉ set nếu chưa được set (tránh trigger không cần thiết)
        setSelectedConversation(found);
      }
    } else if (!conversationId && selectedConversation) {
      // Nếu không có conversationId trong URL, clear selection
      setSelectedConversation(null);
    }
  }, [conversationId, conversations, selectedConversation]);

  // Handle select conversation
  const handleSelectConversation = (conversation) => {
    // Chỉ navigate nếu conversationId khác với URL hiện tại
    if (conversation._id !== conversationId) {
      navigate(`/student/conversation/${conversation._id}`, { replace: true });
    }
    // Set selected conversation ngay lập tức (không đợi navigate)
    setSelectedConversation(conversation);
  };

  // Handle send message
  const handleSendMessage = async (content) => {
    if (!selectedConversation?._id || !content.trim()) return;

    try {
      const response = await conversationService.sendMessage(
        selectedConversation._id,
        content.trim(),
        "text"
      );
      
      const newMessage = response?.data || response;
      
      // Thêm tin nhắn vào UI ngay lập tức (optimistic update)
      // Socket sẽ emit tin nhắn này đến các clients khác
      setMessages((prev) => {
        // Kiểm tra xem tin nhắn đã tồn tại chưa (tránh duplicate khi nhận từ socket)
        const exists = prev.some((msg) => msg._id === newMessage._id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
      
      // Cập nhật lastMessage trong conversations list (không cần gọi API)
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv._id === selectedConversation._id) {
            return {
              ...conv,
              lastMessage: newMessage,
              updatedAt: newMessage.createdAt || new Date(),
            };
          }
          return conv;
        });
      });
    } catch (error) {
      console.error("Error sending message:", error);
      message.error("Không thể gửi tin nhắn");
    }
  };

  // Handle send image
  const handleSendImage = async (imageUrl) => {
    if (!selectedConversation?._id || !imageUrl) return;

    try {
      console.log("🖼️ [CHAT] Sending image:", imageUrl);
      
      // Extract filename từ URL nếu có
      const urlParts = imageUrl.split("/");
      const filename = urlParts[urlParts.length - 1];
      
      const response = await conversationService.sendMessage(
        selectedConversation._id,
        imageUrl, // Lưu URL vào content để hiển thị
        "image",
        imageUrl, // attachmentUrl
        filename, // attachmentName
        "image" // attachmentType
      );
      
      const newMessage = response?.data || response;
      
      console.log("🖼️ [CHAT] Image message created:", {
        id: newMessage._id,
        type: newMessage.type,
        attachmentUrl: newMessage.attachmentUrl,
        content: newMessage.content,
      });
      
      // Thêm tin nhắn vào UI ngay lập tức (optimistic update)
      // Socket sẽ emit tin nhắn này đến các clients khác
      setMessages((prev) => {
        const exists = prev.some((msg) => {
          const msgId = msg._id?.toString() || msg._id;
          const newMsgId = newMessage._id?.toString() || newMessage._id;
          return msgId === newMsgId;
        });
        if (exists) {
          console.log("⚠️ [CHAT] Image message already exists in UI");
          return prev;
        }
        console.log("✅ [CHAT] Image message added to UI");
        return [...prev, newMessage];
      });
      
      // Cập nhật lastMessage trong conversations list (không cần gọi API)
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv._id === selectedConversation._id) {
            return {
              ...conv,
              lastMessage: newMessage,
              updatedAt: newMessage.createdAt || new Date(),
            };
          }
          return conv;
        });
      });
    } catch (error) {
      console.error("❌ [CHAT] Error sending image:", error);
      message.error("Không thể gửi ảnh");
    }
  };

  // Handle conversation created (from sidebar)
  const handleConversationCreated = () => {
    loadConversations(false); // Không hiển thị loading khi refresh sau khi tạo mới
  };

  // Memoize sidebar props để tránh re-render không cần thiết
  const sidebarProps = useMemo(() => ({
    conversations,
    loading,
    selectedId: selectedConversation?._id,
    onSelectConversation: handleSelectConversation,
    currentUser,
    onConversationCreated: handleConversationCreated,
  }), [conversations, loading, selectedConversation?._id, currentUser]);

  return (
    <Container>
      <ChatSidebar {...sidebarProps} />
      <ChatWindowContainer>
        {loadingMessages ? (
          <LoadingContainer>
            <Spin size="large" />
            <LoadingText>Đang tải tin nhắn...</LoadingText>
          </LoadingContainer>
        ) : (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            onSend={handleSendMessage}
            onSendImage={handleSendImage}
          />
        )}
      </ChatWindowContainer>
    </Container>
  );
};

export default Chat;

// 🎨 Styled Components
const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  background: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const ChatWindowContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  gap: 16px;
`;

const LoadingText = styled.div`
  color: #65676b;
  font-size: 15px;
`;
