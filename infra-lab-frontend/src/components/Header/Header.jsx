import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Badge, Avatar, Dropdown, Space, Typography, Popover, Button, Image, Empty } from 'antd';
import { 
  SearchOutlined, 
  ShoppingCartOutlined, 
  UserOutlined,
  MessageOutlined,
  BellOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ShoppingOutlined as ShoppingIcon
} from '@ant-design/icons';
import { HeaderContainer, LogoText, SearchContainer, RightSection, SearchWrapper, CartPopoverContent } from './style';
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

// ===============================
// MAIN HEADER COMPONENT
// ===============================
const Header = () => {
  const navigate = useNavigate();
  const { getCartCount, cartItems } = useCart();

  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [cartPopoverVisible, setCartPopoverVisible] = useState(false);

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
        const q = query.toLowerCase();
        const results = (data.data || []).filter(
          (d) =>
            d.inventory &&
            d.inventory.location === 'lab' &&
            d.name &&
            d.name.toLowerCase().includes(q)
        );
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
    } else {
      setSearchResults([]);
      setShowResults(false);
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

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const userMenuItems = [
    { key: 'profile', label: 'Thông tin cá nhân' },
    { key: 'settings', label: 'Cài đặt' },
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
            onFocus={() => setShowResults(true)}
          />

          {showResults && (
            <>
              {searchResults.length > 0 ? (
                <SearchResults results={searchResults} loading={loading} onSelect={handleSelectDevice} />
              ) : searchHistory.length > 0 ? (
                <div className="search-history-box">
                  <div className="history-header">
                    <Text strong>Lịch sử tìm kiếm</Text>
                    <DeleteOutlined onClick={clearSearchHistory} />
                  </div>
                  {searchHistory.map((item, i) => (
                    <div key={i} className="history-item" onClick={() => handleSearch(item)}>
                      <ClockCircleOutlined />
                      <Text>{item}</Text>
                    </div>
                  ))}
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
