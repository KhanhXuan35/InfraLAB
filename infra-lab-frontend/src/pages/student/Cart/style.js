import styled from 'styled-components';

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 64px);
  padding-bottom: 120px; /* Space for footer bar */
`;

export const FooterBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  padding: 16px 0;
`;

export const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
`;

export const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

