import styled from 'styled-components';
import { List } from 'antd';

export const SearchResultsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 500px;
  overflow-y: auto;
  z-index: 1001;
  margin-top: 4px;
`;

export const SearchResultItem = styled(List.Item)`
  padding: 12px 16px !important;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  .ant-list-item-meta {
    align-items: flex-start;
  }
  
  .ant-avatar {
    flex-shrink: 0;
  }
`;


