import styled from 'styled-components';
import { Card, Button } from 'antd'; // <-- thêm Button ở đây

export const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
`;

export const CategoryFilter = styled.div`
  margin-bottom: 24px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

export const DeviceCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  
  .ant-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .ant-card-meta {
    flex: 1;
  }
  
  .ant-card-cover {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 200px;
    background-color: #f5f5f5;
    
    > div {
      width: 100%;
      height: 100%;
      position: relative;
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transition: transform 0.3s ease;
      display: block;
    }
    
    &:hover img {
      transform: scale(1.05);
    }
  }
`;

export const CardOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const BorrowButton = styled(Button)`
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(24, 144, 255, 0.5);
  }
`;
