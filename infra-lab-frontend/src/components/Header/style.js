import styled from 'styled-components';

export const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

export const LogoText = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  cursor: pointer;
  user-select: none;
  
  &:hover {
    opacity: 0.8;
  }
`;

export const SearchContainer = styled.div`
  flex: 1;
  max-width: 600px;
  margin: 0 24px;
  position: relative;
`;

export const SearchWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  svg {
    cursor: pointer;
    transition: opacity 0.2s;
    
    &:hover {
      opacity: 0.7;
    }
  }
`;
