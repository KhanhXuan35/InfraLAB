import styled from 'styled-components';

export const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f0f2f5;
  min-height: 100vh;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

// Style cho scrollbar của container mã serial
export const SerialScrollContainer = styled.div`
  max-height: 120px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0;

  /* Custom scrollbar cho Chrome, Safari, Edge */
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
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Custom scrollbar cho Firefox */
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
`;











