import styled from 'styled-components';

export const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
`;

export const LogoText = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  margin-right: 24px;
  
  &:hover {
    color: #40a9ff;
  }
`;

export const SearchContainer = styled.div`
  flex: 1;
  max-width: 600px;
  margin: 0 24px;
  
  @media (max-width: 768px) {
    max-width: 300px;
    margin: 0 12px;
  }
`;

export const SearchWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 200px;
  
  @media (max-width: 768px) {
    min-width: 150px;
  }
`;

export const CartPopoverContent = styled.div`
  width: 100%;
  min-width: 320px;
`;