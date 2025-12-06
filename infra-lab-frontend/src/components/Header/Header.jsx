import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Badge, Avatar, Dropdown, Space, Typography } from 'antd';
import { 
  SearchOutlined, 
  ShoppingCartOutlined, 
  UserOutlined,
  MessageOutlined,
  BellOutlined,
  ClockCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { HeaderContainer, LogoText, SearchContainer, RightSection, SearchWrapper } from './style';
import SearchResults from '../SearchResults/SearchResults';
import { STUDENT_ROUTES } from '../../constants/routes';

const { Search } = Input;
const { Text } = Typography;

// Utility functions for search history
const SEARCH_HISTORY_KEY = 'infralab_search_history';
const MAX_HISTORY_ITEMS = 10;

const getSearchHistory = () => {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error loading search history:', error);
    return [];
  }
};

const saveSearchHistory = (query) => {
  try {
    if (!query || query.trim() === '') return;
    
    let history = getSearchHistory();
    // Remove duplicate
    history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
    // Add to beginning
    history.unshift(query);
    // Keep only last MAX_HISTORY_ITEMS
    history = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
};

const clearSearchHistory = () => {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
};

const Header = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const performSearch = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      // Search by name only (not category)
      const response = await fetch(`http://localhost:5000/api/devices?location=lab&search=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const queryLower = query.toLowerCase().trim();
        // Filter by device name only, not category
        const results = (data.data || [])
          .filter(device => 
            device.inventory && 
            device.inventory.location === 'lab' &&
            device.name && 
            device.name.toLowerCase().includes(queryLower)
          );
        setSearchResults(results);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error searching devices:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search - search after 300ms of no typing
    if (value.trim() !== '') {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSearch = (value) => {
    if (!value || value.trim() === '') {
      setShowResults(false);
      return;
    }

    saveSearchHistory(value);
    setSearchHistory(getSearchHistory());
    performSearch(value);
    
    // Navigate to devices page with search query
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

  const handleViewAllResults = () => {
    if (searchValue.trim() !== '') {
      saveSearchHistory(searchValue);
      setSearchHistory(getSearchHistory());
      navigate(`${STUDENT_ROUTES.DEVICES}?search=${encodeURIComponent(searchValue)}`);
      setShowResults(false);
    }
  };

  const handleHistoryClick = (historyItem) => {
    setSearchValue(historyItem);
    handleSearch(historyItem);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Thông tin cá nhân',
    },
    {
      key: 'settings',
      label: 'Cài đặt',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
    },
  ];

  return (
    <HeaderContainer>
      <LogoText onClick={() => navigate('/')}>InfraLAB</LogoText>
      
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
              if (searchResults.length > 0) {
                setShowResults(true);
              } else if (searchValue.trim() === '' && searchHistory.length > 0) {
                setShowResults(true);
              }
            }}
            style={{ width: '100%' }}
          />
          {showResults && (
            <>
              {searchResults.length > 0 ? (
                <SearchResults
                  results={searchResults}
                  loading={loading}
                  onSelect={handleSelectDevice}
                  onViewAll={handleViewAllResults}
                />
              ) : searchValue.trim() === '' && searchHistory.length > 0 ? (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 1001,
                  marginTop: '4px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <div style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Text strong>Lịch sử tìm kiếm</Text>
                    <DeleteOutlined 
                      onClick={handleClearHistory}
                      style={{ cursor: 'pointer', color: '#999' }}
                    />
                  </div>
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleHistoryClick(item)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <ClockCircleOutlined style={{ color: '#999' }} />
                      <Text>{item}</Text>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </SearchWrapper>
      </SearchContainer>

      <RightSection>
        <Space size="large">
          <MessageOutlined 
            style={{ fontSize: '20px', cursor: 'pointer', color: '#666' }} 
            onClick={() => console.log('Chat clicked')}
          />
          
          <Badge count={0} showZero={false}>
            <ShoppingCartOutlined 
              style={{ fontSize: '20px', cursor: 'pointer', color: '#666' }} 
              onClick={() => console.log('Cart clicked')}
            />
          </Badge>

          <BellOutlined 
            style={{ fontSize: '20px', cursor: 'pointer', color: '#666' }} 
            onClick={() => console.log('Notifications clicked')}
          />

          <Dropdown 
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Avatar 
              icon={<UserOutlined />} 
              style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
            />
          </Dropdown>
        </Space>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;

