import styled from 'styled-components';

export const ModalContent = styled.div`
  position: relative;
  padding: 48px 32px;
  text-align: center;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  
  @media (max-width: 768px) {
    padding: 32px 24px;
    min-height: 350px;
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  color: #666;
  font-size: 18px;
  
  &:hover {
    background-color: #f0f0f0;
    color: #333;
  }
`;

export const WelcomeIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
  animation: bounce 0.6s ease-in-out;
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

export const WelcomeTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

export const WelcomeSubtitle = styled.p`
  font-size: 18px;
  color: #4b5563;
  margin: 0 0 16px 0;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

export const UserNameText = styled.span`
  color: #1890ff;
  font-weight: 600;
`;

export const WelcomeMessage = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 32px 0;
  line-height: 1.6;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

export const CheckboxWrapper = styled.div`
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  
  .ant-checkbox-wrapper {
    color: #6b7280;
    font-size: 14px;
  }
`;

export const WelcomeButton = styled.button`
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
    background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

