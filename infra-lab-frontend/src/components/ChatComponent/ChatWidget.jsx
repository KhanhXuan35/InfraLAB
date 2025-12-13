import React, { useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { FiMessageSquare, FiSend, FiX, FiCopy } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { chatService } from "../../services/chatService";
import QuickReplies from "./QuickReplies";

const LOCAL_KEY = "jellycat_chat_history";
const POSITION_KEY = "jellycat_chat_position";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Xin chào 👋! Mình là Jellycat Assistant 🧸. Bạn muốn tìm hiểu sản phẩm nào hôm nay?",
      products: [],
      timestamp: new Date().toISOString()
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 90 }); // Vị trí mặc định
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const currentPositionRef = useRef(position);
  const navigate = useNavigate();

  // 🔹 Load chat history và vị trí
  useEffect(() => {
    const savedChat = localStorage.getItem(LOCAL_KEY);
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Lỗi đọc chat history:", e);
      }
    }

    // Load vị trí đã lưu
    const savedPosition = localStorage.getItem(POSITION_KEY);
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        console.error("Lỗi đọc vị trí chat:", e);
      }
    }
  }, []);

  // 🔹 Save chat history
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
  }, [messages]);

  // 🔹 Scroll to bottom
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // 🔹 Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 🔹 Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to toggle chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      // Escape to close chat
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 🔹 Drag & Drop handlers
  const handleMouseDown = (e) => {
    if (!chatContainerRef.current) return;
    
    const rect = chatContainerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    e.preventDefault();
  };

  // Cập nhật ref khi position thay đổi
  useEffect(() => {
    currentPositionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Giới hạn trong viewport
      const maxX = window.innerWidth - (chatContainerRef.current?.offsetWidth || 380);
      const maxY = window.innerHeight - (chatContainerRef.current?.offsetHeight || 600);
      
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      const newPosition = { x: constrainedX, y: constrainedY };
      currentPositionRef.current = newPosition;
      setPosition(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Lưu vị trí vào localStorage
      localStorage.setItem(POSITION_KEY, JSON.stringify(currentPositionRef.current));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 🔹 Format message content (support markdown-like formatting)
  const formatMessage = (content) => {
    if (!content) return "";
    
    // Convert **text** to bold
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert *text* to italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Convert `text` to code
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    // Convert URLs to links
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br />');
    
    return formatted;
  };

  // 🔹 Copy message to clipboard
  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      message.success("Đã sao chép!");
    }).catch(() => {
      message.error("Không thể sao chép");
    });
  };

  // 🔹 Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleString("vi-VN", { 
      day: "2-digit", 
      month: "2-digit", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  // 🔹 Send message
  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = { 
      role: "user", 
      content: input.trim(),
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setIsTyping(true);

    try {
      const res = await chatService.sendMessageWithAi(input);

      const aiMessage = {
        role: "assistant",
        content:
          res.response || "Xin lỗi, hiện mình chưa hiểu rõ câu hỏi của bạn 😅",
        products: res.relevantProducts || [], // Lưu sản phẩm liên quan
        timestamp: new Date().toISOString()
      };

      // Hiển thị typing effect 1-2s cho mượt mà
      setTimeout(() => {
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
        setIsSending(false);
      }, 1000);
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "Xin lỗi, mình đang gặp chút sự cố 💔", 
          products: [],
          timestamp: new Date().toISOString()
        },
      ]);
      setIsTyping(false);
      setIsSending(false);
    }
  };

  // 🔹 Clear chat
  const handleClearChat = () => {
    localStorage.removeItem(LOCAL_KEY);
    setMessages([
      {
        role: "assistant",
        content:
          "Xin chào 👋! Mình là Jellycat Assistant 🧸. Bạn muốn tìm hiểu sản phẩm nào hôm nay?",
        products: [],
        timestamp: new Date().toISOString()
      },
    ]);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <ChatButton onClick={() => setIsOpen(true)}>
          <FiMessageSquare size={24} />
        </ChatButton>
      )}

      {/* Chat Window */}
      {isOpen && (
        <ChatContainer
          ref={chatContainerRef}
          $position={position}
          $isDragging={isDragging}
          style={{
            left: `${position.x}px`,
            bottom: 'auto',
            top: `${position.y}px`,
            right: 'auto'
          }}
        >
          <ChatHeader
            onMouseDown={handleMouseDown}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <span>💬 Chat with Jellycat AI {isDragging ? '🔄' : '↕️'}</span>
            <HeaderActions>
              <button onClick={handleClearChat} title="Xoá lịch sử chat">
                🗑
              </button>
              <FiX size={18} onClick={() => setIsOpen(false)} />
            </HeaderActions>
          </ChatHeader>

          <ChatBody>
            {messages.map((msg, idx) => (
              <React.Fragment key={idx}>
                <MessageWrapper $isUser={msg.role === "user"}>
                  <Message $isUser={msg.role === "user"}>
                    <MessageContent 
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                    <MessageFooter>
                      <MessageTime>{formatTime(msg.timestamp)}</MessageTime>
                      {msg.role === "assistant" && (
                        <CopyButton 
                          onClick={() => handleCopyMessage(msg.content)}
                          title="Sao chép"
                        >
                          <FiCopy size={12} />
                        </CopyButton>
                      )}
                    </MessageFooter>
                  </Message>
                </MessageWrapper>
                {/* Hiển thị sản phẩm nếu có */}
                {msg.role === "assistant" && msg.products && msg.products.length > 0 && (
                  <ProductsContainer>
                    <ProductsTitle>🛍️ Sản phẩm gợi ý:</ProductsTitle>
                    {msg.products.map((product) => (
                      <ProductCard
                        key={product._id}
                        onClick={() => {
                          navigate(`/product/${product._id}`);
                          setIsOpen(false);
                        }}
                      >
                        {product.image && (
                          <ProductImage 
                            src={product.image.startsWith('http') ? product.image : `http://localhost:8080${product.image}`} 
                            alt={product.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <ProductInfo>
                          <ProductName>{product.name}</ProductName>
                          <ProductPrice>
                            {product.price?.toLocaleString("vi-VN")} ₫
                          </ProductPrice>
                          <ProductStock $inStock={product.inStock}>
                            {product.inStock ? "✅ Còn hàng" : "❌ Hết hàng"}
                          </ProductStock>
                        </ProductInfo>
                      </ProductCard>
                    ))}
                  </ProductsContainer>
                )}
              </React.Fragment>
            ))}

            {/* Hiển thị hiệu ứng Jellycat đang gõ */}
            {isTyping && (
              <Message $isUser={false}>
                <TypingDots>
                  <Dot delay="0s" />
                  <Dot delay="0.2s" />
                  <Dot delay="0.4s" />
                </TypingDots>
              </Message>
            )}

            <div ref={messageEndRef} />
          </ChatBody>

          {/* Quick Replies - chỉ hiển thị khi không có tin nhắn nào (trừ welcome message) */}
          {messages.length === 1 && !isTyping && (
            <QuickRepliesContainer>
              <QuickReplies onSend={(msg) => {
                setInput(msg);
                // Auto send after setting input
                setTimeout(() => {
                  const userMessage = { 
                    role: "user", 
                    content: msg.trim(),
                    timestamp: new Date().toISOString()
                  };
                  setMessages((prev) => [...prev, userMessage]);
                  setIsSending(true);
                  setIsTyping(true);
                  
                  chatService.sendMessageWithAi(msg).then((res) => {
                    const aiMessage = {
                      role: "assistant",
                      content: res.response || "Xin lỗi, hiện mình chưa hiểu rõ câu hỏi của bạn 😅",
                      products: res.relevantProducts || [],
                      timestamp: new Date().toISOString()
                    };
                    setTimeout(() => {
                      setMessages((prev) => [...prev, aiMessage]);
                      setIsTyping(false);
                      setIsSending(false);
                    }, 1000);
                  }).catch((err) => {
                    console.error("Chatbot error:", err);
                    setMessages((prev) => [
                      ...prev,
                      { 
                        role: "assistant", 
                        content: "Xin lỗi, mình đang gặp chút sự cố 💔", 
                        products: [],
                        timestamp: new Date().toISOString()
                      },
                    ]);
                    setIsTyping(false);
                    setIsSending(false);
                  });
                }, 100);
              }} />
            </QuickRepliesContainer>
          )}

          <ChatInputBox>
            <InputWrapper>
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  isSending ? "Jellycat đang trả lời..." : "Nhập tin nhắn... (Ctrl+K để mở/đóng)"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isSending}
                maxLength={500}
              />
              {input.length > 0 && (
                <CharCount>{input.length}/500</CharCount>
              )}
            </InputWrapper>
            <SendButton 
              onClick={handleSend} 
              disabled={isSending || !input.trim()}
              $active={input.trim().length > 0}
            >
              <FiSend size={18} />
            </SendButton>
          </ChatInputBox>
        </ChatContainer>
      )}
    </>
  );
};

export default ChatWidget;

/* ===================== STYLES ===================== */

const ChatButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #ff9f1c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(255, 159, 28, 0.4);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  animation: pulse 2s infinite;

  &:hover {
    background: #ffa933;
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 20px rgba(255, 159, 28, 0.5);
  }

  &:active {
    transform: translateY(0) scale(0.95);
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 4px 16px rgba(255, 159, 28, 0.4);
    }
    50% {
      box-shadow: 0 4px 20px rgba(255, 159, 28, 0.6);
    }
  }
`;

const ChatContainer = styled.div`
  position: fixed;
  width: 380px;
  height: 600px;
  background: #fff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: ${props => props.$isDragging 
    ? '0 12px 40px rgba(0, 0, 0, 0.2)' 
    : '0 8px 32px rgba(0, 0, 0, 0.12)'};
  z-index: 999;
  animation: ${props => props.$isDragging ? 'none' : 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};
  transition: ${props => props.$isDragging ? 'none' : 'box-shadow 0.2s'};
  user-select: none;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @media (max-width: 768px) {
    width: calc(100vw - 32px);
    height: calc(100vh - 120px);
    left: 16px !important;
    top: 16px !important;
    right: auto !important;
    bottom: auto !important;
  }
`;

const ChatHeader = styled.div`
  background: linear-gradient(135deg, #ff9f1c 0%, #ffa933 100%);
  color: #fff;
  padding: 14px 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: grab;
  user-select: none;
  
  &:active {
    cursor: grabbing;
  }

  span {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    flex: 1;
  }

  svg {
    cursor: pointer;
    transition: transform 0.2s;
    flex-shrink: 0;
    
    &:hover {
      transform: scale(1.1);
    }
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: white;
    font-size: 16px;
    margin-right: 6px;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s;
    flex-shrink: 0;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ChatBody = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
    
    &:hover {
      background: #999;
    }
  }
`;

const MessageWrapper = styled.div`
  display: flex;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  width: 100%;
  margin-bottom: 4px;
`;

const Message = styled.div`
  max-width: 75%;
  position: relative;
  background: ${(props) => (props.$isUser ? "#ff9f1c" : "#e4e6eb")};
  color: ${(props) => (props.$isUser ? "#fff" : "#333")};
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  
  /* Markdown styling */
  strong {
    font-weight: 600;
  }
  
  em {
    font-style: italic;
  }
  
  code {
    background: rgba(0, 0, 0, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
  }
  
  a {
    color: ${(props) => (props.$isUser ? "#fff" : "#1890ff")};
    text-decoration: underline;
    word-break: break-all;
  }
`;

const MessageContent = styled.div`
  margin-bottom: 4px;
`;

const MessageFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 4px;
  opacity: 0.7;
`;

const MessageTime = styled.span`
  font-size: 10px;
  color: inherit;
`;

const CopyButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  padding: 2px;
  display: flex;
  align-items: center;
  opacity: 0.6;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

const ChatInputBox = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #eee;
  background: #fff;
`;

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  
  input {
    width: 100%;
    border: 1px solid #e0e0e0;
    padding: 10px 12px;
    font-size: 14px;
    border-radius: 20px;
    background: #f5f5f5;
    outline: none;
    transition: all 0.2s;
    
    &:focus {
      border-color: #ff9f1c;
      background: #fff;
      box-shadow: 0 0 0 2px rgba(255, 159, 28, 0.1);
    }
  }

  input:disabled {
    background: #f0f0f0;
    color: #999;
    cursor: not-allowed;
  }
`;

const CharCount = styled.span`
  position: absolute;
  bottom: -16px;
  right: 8px;
  font-size: 10px;
  color: #999;
`;

const SendButton = styled.button`
  border: none;
  background: ${props => props.$active ? "#ff9f1c" : "#e0e0e0"};
  color: ${props => props.$active ? "#fff" : "#999"};
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.disabled ? "not-allowed" : "pointer"};
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover:not(:disabled) {
    background: ${props => props.$active ? "#ffa933" : "#d0d0d0"};
    transform: scale(1.05);
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
  
  &:disabled {
    opacity: 0.5;
  }
`;

/* 💬 Hiệu ứng dấu ... nhấp nháy */
const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
`;

const TypingDots = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  background: #555;
  border-radius: 50%;
  display: inline-block;
  animation: ${bounce} 1.4s infinite;
  animation-delay: ${(props) => props.delay};
`;

// 🛍️ Product Cards
const ProductsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 4px;
  max-width: 100%;
`;

const ProductsTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 4px;
  padding: 0 4px;
`;

const ProductCard = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 100%;

  &:hover {
    border-color: #ff9f1c;
    box-shadow: 0 2px 8px rgba(255, 159, 28, 0.2);
    transform: translateY(-2px);
  }
`;

const ProductImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
`;

const ProductInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const ProductName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductPrice = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #ff6b6b;
`;

const ProductStock = styled.div`
  font-size: 11px;
  color: ${props => props.$inStock ? "#52c41a" : "#ff4d4f"};
  font-weight: 500;
`;

const QuickRepliesContainer = styled.div`
  padding: 0 12px 8px;
  background: #fff;
  border-top: 1px solid #eee;
`;
