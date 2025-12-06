import React from 'react';
import { List, Avatar, Typography, Space, Tag, Empty } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { SearchResultsContainer, SearchResultItem } from './style';

const { Text } = Typography;

const SearchResults = ({ results, loading, onSelect, onViewAll }) => {
  if (loading) {
    return (
      <SearchResultsContainer>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Text type="secondary">Đang tìm kiếm...</Text>
        </div>
      </SearchResultsContainer>
    );
  }

  if (!results || results.length === 0) {
    return (
      <SearchResultsContainer>
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Không tìm thấy kết quả"
          style={{ padding: '16px' }}
        />
      </SearchResultsContainer>
    );
  }

  const getAvailabilityStatus = (inventory) => {
    if (!inventory) {
      return { status: 'no-data', text: 'Chưa có thông tin', color: 'default' };
    }
    if (inventory.available > 0) {
      return { status: 'available', text: 'Có sẵn', color: 'success' };
    }
    return { status: 'unavailable', text: 'Hết hàng', color: 'error' };
  };

  return (
    <SearchResultsContainer>
      <List
        dataSource={results}
        renderItem={(device) => {
          const availability = getAvailabilityStatus(device.inventory);
          return (
            <SearchResultItem
              onClick={() => onSelect(device)}
            >
              <List.Item.Meta
                avatar={
                  device.image ? (
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#f5f5f5'
                    }}>
                      <img
                        src={device.image}
                        alt={device.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f5f5f5',
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: '#d9d9d9'
                      }}>
                        📦
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: '4px',
                      backgroundColor: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: '#d9d9d9',
                      flexShrink: 0
                    }}>
                      📦
                    </div>
                  )
                }
                title={
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: '16px' }}>{device.name}</Text>
                    {device.category && (
                      <Tag color="blue" style={{ margin: 0 }}>{device.category.name}</Tag>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={4} style={{ marginTop: 8 }}>
                    <Tag 
                      color={availability.color} 
                      icon={availability.status === 'available' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                      style={{ margin: 0 }}
                    >
                      {availability.text}
                    </Tag>
                    {device.inventory && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Có sẵn: {device.inventory.available}/{device.inventory.total}
                      </Text>
                    )}
                  </Space>
                }
              />
            </SearchResultItem>
          );
        }}
      />
      {results.length > 0 && onViewAll && (
        <div style={{ 
          padding: '12px', 
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: '#fafafa'
        }} onClick={onViewAll}>
          <Text strong style={{ color: '#1890ff' }}>
            Xem tất cả kết quả ({results.length})
          </Text>
        </div>
      )}
    </SearchResultsContainer>
  );
};

export default SearchResults;

