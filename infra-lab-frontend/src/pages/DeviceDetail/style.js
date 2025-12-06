import styled from 'styled-components';
import { Card } from 'antd';

export const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
`;

export const DetailCard = styled(Card)`
  .ant-card-body {
    padding: 24px;
  }
`;

export const ImageContainer = styled.div`
  flex-shrink: 0;
  
  img {
    width: 100%;
    max-width: 500px;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

export const ActionSection = styled.div`
  margin-top: 24px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
`;

