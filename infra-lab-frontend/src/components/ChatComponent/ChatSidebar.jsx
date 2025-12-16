import React, { useEffect, useMemo, useState, memo } from "react";
import styled from "styled-components";
import { Modal, Button } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { userService } from "../../services/userService";
import { conversationService } from "../../services/conversationService";
import { useNavigate } from "react-router-dom";

const ChatSidebar = ({
  conversations = [],
  loading,
  selectedId,
  onSelectConversation,
  currentUser,
  onConversationCreated,
}) => {
  const navigate = useNavigate();
  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Kiểm tra xem user có thể tạo conversation mới không (tất cả roles đều có thể tạo)
  const canCreateConversation = true;

  // Helper function để navigate về home page dựa trên role
  const handleNavigateHome = () => {
    const userRole = currentUser?.role;
    if (userRole === "student") {
      navigate("/user-dashboard");
    } else if (userRole === "lab_manager") {
      navigate("/teacher-dashboard");
    } else if (userRole === "school_admin") {
      navigate("/school-dashboard");
    } else {
      navigate("/");
    }
  };

  const availableFilters = useMemo(() => {
    const role = currentUser?.role?.toLowerCase();
    switch (role) {
      case "student":
        return [
          { key: "student", label: "Sinh viên", roles: ["student"] },
          { key: "lab_manager", label: "Quản lý phòng lab", roles: ["lab_manager"] },
        ];
      case "lab_manager":
        return [
          { key: "student", label: "Sinh viên", roles: ["student"] },
          { key: "school_admin", label: "Quản trị viên", roles: ["school_admin"] },
        ];
      case "school_admin":
        return [
          { key: "lab_manager", label: "Quản lý phòng lab", roles: ["lab_manager"] },
        ];
      default:
        return [
          { key: "student", label: "Sinh viên", roles: ["student"] },
          { key: "lab_manager", label: "Quản lý phòng lab", roles: ["lab_manager"] },
          { key: "school_admin", label: "Quản trị viên", roles: ["school_admin"] },
        ];
    }
  }, [currentUser?.role]);

  const allowedRoles = useMemo(() => {
    const roles = availableFilters.flatMap((filter) => filter.roles || []);
    return Array.from(new Set(roles));
  }, [availableFilters]);

  useEffect(() => {
    if (availableFilters.length === 0) {
      setActiveFilter(null);
      return;
    }
    if (!activeFilter) {
      setActiveFilter(availableFilters[0].key);
      return;
    }
    const stillValid = availableFilters.some((filter) => filter.key === activeFilter);
    if (!stillValid) {
      setActiveFilter(availableFilters[0].key);
    }
  }, [availableFilters, activeFilter]);

  const handleOpenModal = async () => {
    if (!canCreateConversation) return;
    setModalVisible(true);
    setLoadingUsers(true);
    try {
      const res = await userService.getChatableUsers();
      setUsers(res?.data || res || []);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách người dùng:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleContact = async (userId) => {
    try {
      const res = await conversationService.createConversation(userId);
      const conversation = res?.data;
      if (conversation?._id) {
        setModalVisible(false);
        navigate(`/chat/${conversation._id}`);
        // Refresh conversations list
        if (onConversationCreated) {
          onConversationCreated();
        }
      }
    } catch (error) {
      console.error("Lỗi tạo hoặc lấy conversation:", error);
    }
  };

  const truncateText = (text, maxLength = 30) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = searchQuery === "" || 
      (c.otherUser?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage?.content || "").toLowerCase().includes(searchQuery.toLowerCase());

    const normalizeRole = (c.otherUser?.role || "").toLowerCase();
    const roleAllowed = allowedRoles.length === 0 || allowedRoles.includes(normalizeRole);
    if (!roleAllowed) return false;

    const rolesToMatch =
      availableFilters.find((filter) => filter.key === activeFilter)?.roles || [];
    const matchesRole = rolesToMatch.length === 0 || rolesToMatch.includes(normalizeRole);

    return matchesSearch && matchesRole;
  });

  // Format time
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
    
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  // Check if conversation has unread messages
  const hasUnread = (conversation) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    return conversation.lastMessage?.sender?._id !== currentUserId && 
           conversation.lastMessage?.sender?.id !== currentUserId;
  };

  if (loading) {
    return (
      <Sidebar>
        <Header>
          <Title>Đoạn chat</Title>
          <HeaderIcons>
            <IconButton title="Tùy chọn">⋯</IconButton>
            <IconButton title="Mở rộng">⛶</IconButton>
            {canCreateConversation && (
              <IconButton onClick={handleOpenModal} title="Tin nhắn mới">✎</IconButton>
            )}
            {currentUser && (
              <UserAvatar 
                src={currentUser?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${currentUser?.name || "User"}`}
                alt={currentUser?.name || "User"}
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/9.x/initials/svg?seed=${currentUser?.name || "User"}`;
                }}
              />
            )}
          </HeaderIcons>
        </Header>
        <Loading>Đang tải...</Loading>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <Header>
        <Title>Đoạn chat</Title>
        <HeaderIcons>
          <IconButton 
            title="Quay về trang chủ" 
            onClick={handleNavigateHome}
            style={{ fontSize: 18 }}
          >
            <HomeOutlined />
          </IconButton>
          <IconButton title="Tùy chọn">⋯</IconButton>
          <IconButton title="Mở rộng">⛶</IconButton>
            {canCreateConversation && (
              <IconButton onClick={handleOpenModal} title="Tin nhắn mới">✎</IconButton>
            )}
          {currentUser && (
            <UserAvatar 
              src={currentUser?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${currentUser?.name || "User"}`}
              alt={currentUser?.name || "User"}
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/9.x/initials/svg?seed=${currentUser?.name || "User"}`;
              }}
            />
          )}
        </HeaderIcons>
      </Header>

      <SearchContainer>
        <SearchIcon>🔍</SearchIcon>
        <SearchBox 
          placeholder="Tìm kiếm trên Messenger" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchContainer>

      <FilterTabs>
        {availableFilters.map((filter) => (
          <FilterTab
            key={filter.key}
            $active={activeFilter === filter.key}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </FilterTab>
        ))}
      </FilterTabs>

      <ConversationList>
        {filteredConversations.length === 0 ? (
          <EmptyText>Chưa có cuộc trò chuyện nào</EmptyText>
        ) : (
          filteredConversations.map((c) => {
            const unread = hasUnread(c);
            const isActive = selectedId === c._id;
            
            return (
            <ConversationItem
              key={c._id}
                $active={isActive}
              onClick={() => onSelectConversation(c)}
            >
                <AvatarContainer>
                  <Avatar
                    src={c.otherUser?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${c.otherUser?.name || "User"}`}
                    alt={c.otherUser?.name || "User"}
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/9.x/initials/svg?seed=${c.otherUser?.name || "User"}`;
                    }}
                  />
                </AvatarContainer>
                <InfoContainer>
                  <InfoHeader>
                    <NameWrapper>
                      <Name>{c.otherUser?.name || "Người dùng ẩn danh"}</Name>
                      {c.otherUser?.role === "lab_manager" && <RoleBadge>Quản lý phòng lab</RoleBadge>}
                      {c.otherUser?.role === "school_admin" && <RoleBadge>Quản trị viên</RoleBadge>}
                    </NameWrapper>
                    <Time>{formatTime(c.updatedAt)}</Time>
                  </InfoHeader>
                  <LastMessage>
                    {(() => {
                      const currentUserId = currentUser?._id || currentUser?.id;
                      const senderId = c.lastMessage?.sender?._id || c.lastMessage?.sender?.id;
                      return senderId === currentUserId ? (
                        <span style={{ color: "#65676b" }}>Bạn: {truncateText(c.lastMessage?.content || "Hãy bắt đầu cuộc trò chuyện", 25)}</span>
                      ) : (
                        <span>{truncateText(c.lastMessage?.content || "Hãy bắt đầu cuộc trò chuyện", 25)}</span>
                      );
                    })()}
                  </LastMessage>
                </InfoContainer>
                {unread && !isActive && <UnreadDot />}
              </ConversationItem>
            );
          })
        )}
      </ConversationList>

      <Modal
        title="Chọn người để chat"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {loadingUsers ? (
          <div style={{ textAlign: "center", padding: "20px" }}>Đang tải...</div>
        ) : users.length > 0 ? (
          users.map((user) => (
            <div
              key={user._id}
                style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid #f0f0f0",
                }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: "12px", color: "#999" }}>
                  {user.role === "school_admin"
                    ? "Quản trị viên"
                    : user.role === "lab_manager"
                    ? "Quản lý phòng lab"
                    : user.role === "student"
                    ? "Sinh viên"
                    : user.role}
                </div>
              </div>
              <Button type="primary" size="small" onClick={() => handleContact(user._id)}>
                Chat
              </Button>
              </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
            Không có người dùng nào để hiển thị.
          </div>
        )}
      </Modal>
    </Sidebar>
  );
};

// Memoize component để tránh re-render không cần thiết
export default memo(ChatSidebar, (prevProps, nextProps) => {
  // Chỉ re-render nếu các props quan trọng thay đổi
  // So sánh arrays bằng length và selectedId
  const conversationsChanged = 
    prevProps.conversations.length !== nextProps.conversations.length ||
    prevProps.conversations.some((conv, idx) => {
      const nextConv = nextProps.conversations[idx];
      return !nextConv || 
             conv._id !== nextConv._id ||
             conv.lastMessage?._id !== nextConv.lastMessage?._id ||
             conv.updatedAt !== nextConv.updatedAt;
    });
  
  return (
    !conversationsChanged &&
    prevProps.loading === nextProps.loading &&
    prevProps.selectedId === nextProps.selectedId &&
    prevProps.currentUser?._id === nextProps.currentUser?._id
  );
});

// 🎨 Styled Components - Facebook Messenger Style
const Sidebar = styled.div`
  width: 360px;
  border-right: 1px solid #e4e6eb;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Header = styled.div`
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e6eb;
  background: #ffffff;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #050505;
  margin: 0;
  line-height: 1.2;
`;

const HeaderIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #050505;
  transition: background-color 0.2s;

  &:hover {
    background: #f0f2f5;
  }

  &:active {
    background: #e4e6eb;
  }
`;

const UserAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;

  &:hover {
    border-color: #e4e6eb;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin: 8px 16px;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 12px;
  font-size: 16px;
  color: #8a8d91;
  pointer-events: none;
`;

const SearchBox = styled.input`
  width: 100%;
  padding: 8px 12px 8px 36px;
  border-radius: 20px;
  border: none;
  background: #f0f2f5;
  outline: none;
  font-size: 15px;
  color: #050505;

  &::placeholder {
    color: #8a8d91;
  }

  &:focus {
    background: #e4e6eb;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterTab = styled.button`
  padding: 6px 16px;
  border-radius: 18px;
  border: none;
  background: ${({ $active }) => ($active ? "#e7f3ff" : "transparent")};
  color: ${({ $active }) => ($active ? "#1877f2" : "#65676b")};
  font-size: 15px;
  font-weight: ${({ $active }) => ($active ? "600" : "500")};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: ${({ $active }) => ($active ? "#e7f3ff" : "#f0f2f5")};
  }
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

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

const ConversationItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: ${({ $active }) => ($active ? "#e7f3ff" : "transparent")};
  cursor: pointer;
  transition: background-color 0.15s;
  position: relative;

  &:hover {
    background: ${({ $active }) => ($active ? "#e7f3ff" : "#f0f2f5")};
  }
`;

const AvatarContainer = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  background: #e4e6eb;
`;

const InfoContainer = styled.div`
    flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
`;

const Name = styled.div`
      font-weight: 600;
  font-size: 15px;
  color: #050505;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  background: #eef3ff;
  color: #275efe;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
`;

const Time = styled.div`
    font-size: 12px;
  color: #65676b;
  white-space: nowrap;
  margin-left: 8px;
`;

const LastMessage = styled.div`
  font-size: 13px;
  color: #65676b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1877f2;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
`;

const Loading = styled.div`
  text-align: center;
  padding: 30px 0;
  color: #65676b;
  font-size: 15px;
`;

const EmptyText = styled.div`
  text-align: center;
  color: #65676b;
  margin-top: 40px;
  font-size: 15px;
  padding: 0 16px;
`;
