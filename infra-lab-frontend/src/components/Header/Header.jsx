import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Badge, Avatar, Dropdown, Space, Typography, Button, Empty } from 'antd';
import { 
  SearchOutlined, 
  ShoppingCartOutlined, 
  UserOutlined,
  MessageOutlined,
  BellOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { HeaderContainer, LogoText, SearchContainer, RightSection, SearchWrapper } from './style';
import SearchResults from '../SearchResults/SearchResults';
import { STUDENT_ROUTES } from '../../constants/routes';
import { useCart } from '../../contexts/CartContext';
import api from '../../services/api';

const { Search } = Input;
const { Text } = Typography;

// ===============================
// SEARCH HISTORY
// ===============================
const SEARCH_HISTORY_KEY = 'infralab_search_history';
const MAX_HISTORY_ITEMS = 10;

const getSearchHistory = () => {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

const saveSearchHistory = (query) => {
  if (!query || query.trim() === '') return;
  let history = getSearchHistory();
  history = history.filter((item) => item.toLowerCase() !== query.toLowerCase());
  history.unshift(query);
  history = history.slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
};

const clearSearchHistory = () => {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
};

const removeFromSearchHistory = (itemToRemove) => {
  let history = getSearchHistory();
  history = history.filter(item => item.toLowerCase() !== itemToRemove.toLowerCase());
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
};

// ===============================
// MAIN HEADER COMPONENT
// ===============================
const Header = () => {
  const navigate = useNavigate();
  const { getCartCount } = useCart();

  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  const cartCount = getCartCount();

  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===============================
  // SEARCH API
  // ===============================
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/devices?location=lab&search=${encodeURIComponent(query)}`);
      const data = response.data;

      if (data.success) {
        const q = query.toLowerCase().trim();
        // Lọc thiết bị có tên chứa ký tự tìm kiếm
        const filtered = (data.data || []).filter(
          (d) =>
            d.inventory &&
            d.inventory.location === 'lab' &&
            d.name &&
            d.name.toLowerCase().includes(q)
        );
        // Giới hạn tối đa 4 thiết bị
        const results = filtered.slice(0, 4);
        setSearchResults(results);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (err) {
      console.error(err);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => performSearch(value), 300);
      setShowResults(true);
    } else {
      setSearchResults([]);
      // Hiển thị lịch sử nếu có và không có text
      if (searchHistory.length > 0) {
        setShowResults(true);
      } else {
        setShowResults(false);
      }
    }
  };

  const handleSearch = (value) => {
    if (!value.trim()) return;

    saveSearchHistory(value);
    setSearchHistory(getSearchHistory());
    performSearch(value);

    navigate(`${STUDENT_ROUTES.DEVICES}?search=${encodeURIComponent(value)}`);
    setShowResults(false);
  };

  const handleSelectDevice = (device) => {
    saveSearchHistory(searchValue);
    setSearchHistory(getSearchHistory());
    navigate(STUDENT_ROUTES.DEVICE_DETAIL(device._id));
    setSearchValue('');
    setShowResults(false);
  };

  const handleHistoryClick = (historyItem) => {
    setSearchValue(historyItem);
    handleSearch(historyItem);
  };

  const handleRemoveHistoryItem = (e, historyItem) => {
    e.stopPropagation(); // Ngăn trigger onClick của parent
    removeFromSearchHistory(historyItem);
    setSearchHistory(getSearchHistory());
  };

  const handleClearAllHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'profile') {
      navigate('/profile');
    } else if (key === 'changepass') {
      navigate('/change-password');
    } else if (key === 'logout') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const userMenuItems = [
    { key: 'profile', label: 'Thông tin cá nhân' },
    { key: 'changepass', label: 'Đổi mật khẩu' },
    { key: 'logout', label: 'Đăng xuất' }
  ];

  // ===============================
  // RENDER
  // ===============================
  return (
    <HeaderContainer>
      <LogoText onClick={() => navigate(STUDENT_ROUTES.HOME)}>InfraLAB</LogoText>

      {/* SEARCH BOX */}
      <SearchContainer ref={searchContainerRef}>
        <SearchWrapper>
          <Search
            placeholder="Tìm kiếm thiết bị theo tên..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchValue}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onFocus={() => {
              if (searchValue.trim()) {
                if (searchResults.length > 0 || loading) {
                  setShowResults(true);
                }
              } else {
                // Hiển thị lịch sử khi focus và không có text
                if (searchHistory.length > 0) {
                  setShowResults(true);
                }
              }
            }}
          />

          {showResults && (
            <>
              {searchValue.trim() && searchResults.length > 0 ? (
                <SearchResults 
                  results={searchResults} 
                  loading={loading} 
                  onSelect={handleSelectDevice}
                  onViewAll={() => {
                    if (searchValue.trim()) {
                      handleSearch(searchValue);
                    }
                  }}
                />
              ) : !searchValue.trim() && searchHistory.length > 0 ? (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 1001,
                  marginTop: '4px',
                  maxHeight: '400px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    background: 'white',
                    zIndex: 1,
                    flexShrink: 0
                  }}>
                    <Text strong style={{ fontSize: 14 }}>Lịch sử tìm kiếm</Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleClearAllHistory}
                      style={{ color: '#999', padding: 0 }}
                    />
                  </div>
                  <div style={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    flex: 1,
                    maxHeight: '350px'
                  }}>
                    {searchHistory.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleHistoryClick(item)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: index < searchHistory.length - 1 ? '1px solid #f0f0f0' : 'none',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                          <ClockCircleOutlined style={{ color: '#999', fontSize: 16 }} />
                          <Text style={{ fontSize: 14 }}>{item}</Text>
                        </div>
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => handleRemoveHistoryItem(e, item)}
                          style={{ 
                            color: '#999', 
                            opacity: 0.6,
                            padding: '4px 8px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.color = '#ff4d4f';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0.6';
                            e.currentTarget.style.color = '#999';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchValue.trim() && !loading && searchResults.length === 0 ? (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 1001,
                  marginTop: '4px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không tìm thấy kết quả"
                  />
                </div>
              ) : null}
            </>
          )}
        </SearchWrapper>
      </SearchContainer>

      {/* RIGHT ICONS */}
      <RightSection>
        <Space size="large">
          <MessageOutlined style={{ fontSize: 20 }} />
          <Badge count={cartCount}>
            <ShoppingCartOutlined style={{ fontSize: 20 }} onClick={() => navigate(STUDENT_ROUTES.CART)} />
          </Badge>
          <BellOutlined style={{ fontSize: 20 }} />

          <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={['click']}>
            <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer', background: '#1890ff' }} />
          </Dropdown>
        </Space>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;
