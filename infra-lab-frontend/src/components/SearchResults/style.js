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
  overflow: hidden;
  z-index: 1001;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
`;

export const SearchResultsList = styled(List)`
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
    
    &:hover {
      background: #555;
    }
  }
  
  .ant-list-item {
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
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



