import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Drawer, Input, Button, Tabs, message as antdMessage, Empty, Spin, Image } from "antd";
import {
  UserOutlined,
  PushpinOutlined,
  FileImageOutlined,
  LinkOutlined,
  FileOutlined,
  EditOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { conversationService } from "../../services/conversationService";
import ChatMessage from "./ChatMessage";

const { TabPane } = Tabs;

const ChatSettingsModal = ({ visible, onClose, conversation, currentUser, onRefresh }) => {
  const [activeTab, setActiveTab] = useState("nickname");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loadingPinned, setLoadingPinned] = useState(false);
  const [sentFiles, setSentFiles] = useState({ all: [], categorized: { images: [], files: [], links: [] } });
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileTab, setFileTab] = useState("all");

  const otherUser = conversation?.participants?.find(
    (p) => p._id !== (currentUser?._id || currentUser?.id)
  );
  const currentUserId = currentUser?._id || currentUser?.id;

  // Load nickname hiện tại khi mở modal
  useEffect(() => {
    if (visible && conversation && otherUser) {
      const currentNickname = conversation.nicknames?.get?.(otherUser._id) || 
                              (conversation.nicknames && conversation.nicknames[otherUser._id]) ||
                              "";
      setNickname(currentNickname || "");
    }
  }, [visible, conversation, otherUser]);

  // Load pinned messages khi chuyển tab
  useEffect(() => {
    if (visible && activeTab === "pinned" && conversation?._id) {
      loadPinnedMessages();
    }
  }, [visible, activeTab, conversation?._id]);

  // Load sent files khi chuyển tab
  useEffect(() => {
    if (visible && activeTab === "files" && conversation?._id) {
      loadSentFiles();
    }
  }, [visible, activeTab, conversation?._id]);

  const loadPinnedMessages = async () => {
    if (!conversation?._id) return;
    setLoadingPinned(true);
    try {
      const res = await conversationService.getPinnedMessages(conversation._id);
      setPinnedMessages(res?.data || res || []);
    } catch (error) {
      console.error("Error loading pinned messages:", error);
      antdMessage.error("Không thể tải tin nhắn đã ghim");
      setPinnedMessages([]);
    } finally {
      setLoadingPinned(false);
    }
  };

  const loadSentFiles = async (type = null) => {
    if (!conversation?._id) return;
    setLoadingFiles(true);
    try {
      const res = await conversationService.getSentFiles(conversation._id, 1, 100, type);
      setSentFiles(res?.data || res || { all: [], categorized: { images: [], files: [], links: [] } });
    } catch (error) {
      console.error("Error loading sent files:", error);
      antdMessage.error("Không thể tải các file đã gửi");
      setSentFiles({ all: [], categorized: { images: [], files: [], links: [] } });
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleUpdateNickname = async () => {
    if (!conversation?._id || !otherUser?._id) return;
    setLoading(true);
    try {
      await conversationService.updateNickname(conversation._id, otherUser._id, nickname.trim());
      antdMessage.success("Đã cập nhật biệt danh");
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error updating nickname:", error);
      antdMessage.error(error?.message || "Không thể cập nhật biệt danh");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveNickname = async () => {
    if (!conversation?._id || !otherUser?._id) return;
    setLoading(true);
    try {
      await conversationService.updateNickname(conversation._id, otherUser._id, "");
      setNickname("");
      antdMessage.success("Đã xóa biệt danh");
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error removing nickname:", error);
      antdMessage.error(error?.message || "Không thể xóa biệt danh");
    } finally {
      setLoading(false);
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
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const extractLinks = (content) => {
    if (!content) return [];
    const urlRegex = /https?:\/\/[^\s]+/gi;
    return content.match(urlRegex) || [];
  };

  if (!conversation) return null;

  return (
    <Drawer
      title={
        <DrawerHeader>
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
        </DrawerHeader>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={480}
      closable={false}
      extra={
        <CloseButton onClick={onClose}>
          <CloseOutlined />
        </CloseButton>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Tab Đổi biệt danh */}
        <TabPane
          tab={
            <TabLabel>
              <EditOutlined />
              <span>Đổi biệt danh</span>
            </TabLabel>
          }
          key="nickname"
        >
          <TabContent>
            <SectionTitle>Biệt danh</SectionTitle>
            <Input
              placeholder="Nhập biệt danh (để trống để xóa)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              prefix={<UserOutlined />}
              size="large"
              maxLength={50}
            />
            <ButtonGroup>
              <Button
                type="primary"
                onClick={handleUpdateNickname}
                loading={loading}
                disabled={!nickname.trim() && !conversation.nicknames?.get?.(otherUser?._id)}
              >
                Lưu
              </Button>
              {conversation.nicknames?.get?.(otherUser?._id) && (
                <Button onClick={handleRemoveNickname} loading={loading}>
                  Xóa biệt danh
                </Button>
              )}
            </ButtonGroup>
            <InfoText>
              Biệt danh chỉ hiển thị cho bạn. Người khác vẫn thấy tên gốc của họ.
            </InfoText>
          </TabContent>
        </TabPane>

        {/* Tab Tin nhắn đã ghim */}
        <TabPane
          tab={
            <TabLabel>
              <PushpinOutlined />
              <span>Tin nhắn đã ghim</span>
            </TabLabel>
          }
          key="pinned"
        >
          <TabContent>
            <SectionTitle>Tin nhắn đã ghim</SectionTitle>
            {loadingPinned ? (
              <SpinContainer>
                <Spin size="large" />
              </SpinContainer>
            ) : pinnedMessages.length === 0 ? (
              <EmptyContainer>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có tin nhắn nào được ghim"
                />
              </EmptyContainer>
            ) : (
              <PinnedMessagesList>
                {pinnedMessages.map((msg) => (
                  <PinnedMessageItem key={msg._id}>
                    <ChatMessage
                      messageId={msg._id}
                      message={{
                        type: msg.type,
                        content: msg.content,
                        sender: msg.sender,
                        time: msg.createdAt,
                        createdAt: msg.createdAt,
                        deleted: msg.deleted,
                        edited: msg.edited,
                        attachmentUrl: msg.attachmentUrl,
                        attachmentName: msg.attachmentName,
                      }}
                      isOwn={(msg.sender?._id || msg.sender?.id) === currentUserId}
                    />
                    <MessageTime>{formatTime(msg.createdAt)}</MessageTime>
                  </PinnedMessageItem>
                ))}
              </PinnedMessagesList>
            )}
          </TabContent>
        </TabPane>

        {/* Tab File phương tiện & file */}
        <TabPane
          tab={
            <TabLabel>
              <FileImageOutlined />
              <span>File & Link</span>
            </TabLabel>
          }
          key="files"
        >
          <TabContent>
            <SectionTitle>File phương tiện & file</SectionTitle>
            <FileTabs>
              <FileTabButton
                $active={fileTab === "all"}
                onClick={() => {
                  setFileTab("all");
                  loadSentFiles();
                }}
              >
                Tất cả
              </FileTabButton>
              <FileTabButton
                $active={fileTab === "images"}
                onClick={() => {
                  setFileTab("images");
                  loadSentFiles("image");
                }}
              >
                <FileImageOutlined /> Ảnh
              </FileTabButton>
              <FileTabButton
                $active={fileTab === "files"}
                onClick={() => {
                  setFileTab("files");
                  loadSentFiles("file");
                }}
              >
                <FileOutlined /> File
              </FileTabButton>
              <FileTabButton
                $active={fileTab === "links"}
                onClick={() => {
                  setFileTab("links");
                  loadSentFiles("link");
                }}
              >
                <LinkOutlined /> Link
              </FileTabButton>
            </FileTabs>

            {loadingFiles ? (
              <SpinContainer>
                <Spin size="large" />
              </SpinContainer>
            ) : (
              <>
                {fileTab === "all" && sentFiles.all.length === 0 && (
                  <EmptyContainer>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có file hoặc link nào được gửi"
                    />
                  </EmptyContainer>
                )}
                {fileTab === "images" && sentFiles.categorized.images.length === 0 && (
                  <EmptyContainer>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có ảnh nào được gửi"
                    />
                  </EmptyContainer>
                )}
                {fileTab === "files" && sentFiles.categorized.files.length === 0 && (
                  <EmptyContainer>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có file nào được gửi"
                    />
                  </EmptyContainer>
                )}
                {fileTab === "links" && sentFiles.categorized.links.length === 0 && (
                  <EmptyContainer>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có link nào được gửi"
                    />
                  </EmptyContainer>
                )}

                {/* Hiển thị ảnh */}
                {(fileTab === "all" || fileTab === "images") && sentFiles.categorized.images.length > 0 && (
                  <FilesSection>
                    {fileTab === "images" && <SectionSubtitle>Ảnh</SectionSubtitle>}
                    <ImagesGrid>
                      {sentFiles.categorized.images.map((msg) => (
                        <ImageItem key={msg._id}>
                          <Image
                            src={msg.attachmentUrl}
                            alt={msg.attachmentName || "Image"}
                            style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px" }}
                            preview={{
                              mask: <div style={{ padding: "8px" }}>{formatTime(msg.createdAt)}</div>,
                            }}
                          />
                          <ImageTime>{formatTime(msg.createdAt)}</ImageTime>
                        </ImageItem>
                      ))}
                    </ImagesGrid>
                  </FilesSection>
                )}

                {/* Hiển thị file */}
                {(fileTab === "all" || fileTab === "files") && sentFiles.categorized.files.length > 0 && (
                  <FilesSection>
                    {fileTab === "files" && <SectionSubtitle>File</SectionSubtitle>}
                    <FilesList>
                      {sentFiles.categorized.files.map((msg) => (
                        <FileItem key={msg._id} href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                          <FileIcon>
                            <FileOutlined />
                          </FileIcon>
                          <FileInfo>
                            <FileName>{msg.attachmentName || "File không tên"}</FileName>
                            <FileTime>{formatTime(msg.createdAt)}</FileTime>
                          </FileInfo>
                        </FileItem>
                      ))}
                    </FilesList>
                  </FilesSection>
                )}

                {/* Hiển thị link */}
                {(fileTab === "all" || fileTab === "links") && sentFiles.categorized.links.length > 0 && (
                  <FilesSection>
                    {fileTab === "links" && <SectionSubtitle>Link</SectionSubtitle>}
                    <LinksList>
                      {sentFiles.categorized.links.map((msg) => {
                        const links = msg.extractedLinks || extractLinks(msg.content);
                        return links.map((link, idx) => (
                          <LinkItem key={`${msg._id}-${idx}`} href={link} target="_blank" rel="noopener noreferrer">
                            <LinkIcon>
                              <LinkOutlined />
                            </LinkIcon>
                            <LinkInfo>
                              <LinkUrl>{link}</LinkUrl>
                              <LinkTime>{formatTime(msg.createdAt)}</LinkTime>
                            </LinkInfo>
                          </LinkItem>
                        ));
                      })}
                    </LinksList>
                  </FilesSection>
                )}
              </>
            )}
          </TabContent>
        </TabPane>
      </Tabs>
    </Drawer>
  );
};

export default ChatSettingsModal;

// 🎨 Styled Components
const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderAvatar = styled.img`
  width: 48px;
  height: 48px;
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
  font-size: 16px;
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

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #050505;
  transition: background-color 0.2s;

  &:hover {
    background: #f0f2f5;
  }
`;

const TabLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TabContent = styled.div`
  padding: 16px 0;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #050505;
  margin-bottom: 16px;
`;

const SectionSubtitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #65676b;
  margin-bottom: 12px;
  margin-top: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const InfoText = styled.p`
  font-size: 13px;
  color: #65676b;
  margin-top: 16px;
  line-height: 1.5;
`;

const SpinContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
`;

const EmptyContainer = styled.div`
  padding: 40px 0;
`;

const PinnedMessagesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PinnedMessageItem = styled.div`
  position: relative;
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: #65676b;
  margin-top: 4px;
  text-align: right;
`;

const FileTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FileTabButton = styled.button`
  padding: 6px 12px;
  border-radius: 18px;
  border: none;
  background: ${({ $active }) => ($active ? "#e7f3ff" : "transparent")};
  color: ${({ $active }) => ($active ? "#1877f2" : "#65676b")};
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? "600" : "500")};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: ${({ $active }) => ($active ? "#e7f3ff" : "#f0f2f5")};
  }
`;

const FilesSection = styled.div`
  margin-bottom: 24px;
`;

const ImagesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const ImageItem = styled.div`
  position: relative;
`;

const ImageTime = styled.div`
  font-size: 11px;
  color: #65676b;
  margin-top: 4px;
  text-align: center;
`;

const FilesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FileItem = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f0f2f5;
  border-radius: 8px;
  text-decoration: none;
  color: #050505;
  transition: background-color 0.2s;

  &:hover {
    background: #e4e6eb;
  }
`;

const FileIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #1877f2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #050505;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileTime = styled.div`
  font-size: 12px;
  color: #65676b;
  margin-top: 2px;
`;

const LinksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LinkItem = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f0f2f5;
  border-radius: 8px;
  text-decoration: none;
  color: #050505;
  transition: background-color 0.2s;

  &:hover {
    background: #e4e6eb;
  }
`;

const LinkIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #42b883;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

const LinkInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const LinkUrl = styled.div`
  font-size: 13px;
  color: #1877f2;
  word-break: break-all;
  line-height: 1.4;
`;

const LinkTime = styled.div`
  font-size: 12px;
  color: #65676b;
  margin-top: 2px;
`;


