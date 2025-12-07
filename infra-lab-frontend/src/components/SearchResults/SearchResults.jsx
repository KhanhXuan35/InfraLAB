import React from 'react';
import { List, Spin, Typography, Button, Image } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';
import * as S from './SearchResults.styles';

const { Text } = Typography;

const SearchResults = ({ results, loading, onSelect, onViewAll }) => {
  if (loading) {
    return (
      <S.ResultsContainer>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      </S.ResultsContainer>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <S.ResultsContainer>
      <List
        dataSource={results.slice(0, 5)}
        renderItem={(device) => (
          <List.Item
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => onSelect(device)}
          >
            <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
              {device.image ? (
                <Image
                  src={device.image}
                  alt={device.name}
                  width={50}
                  height={50}
                  style={{ objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                  fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
                />
              ) : (
                <div style={{
                  width: 50,
                  height: 50,
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  flexShrink: 0
                }}>
                  <ShoppingOutlined style={{ fontSize: 20, color: '#d9d9d9' }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                  {device.name}
                </Text>
                {device.inventory && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Có sẵn: {device.inventory.available || 0}
                  </Text>
                )}
              </div>
            </div>
          </List.Item>
        )}
      />
      {results.length > 5 && (
        <div style={{
          borderTop: '1px solid #f0f0f0',
          padding: '12px 16px',
          textAlign: 'center'
        }}>
          <Button type="link" onClick={onViewAll}>
            Xem tất cả {results.length} kết quả
          </Button>
        </div>
      )}
    </S.ResultsContainer>
  );
};

export default SearchResults;
