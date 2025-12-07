import styled from 'styled-components';
import { Card } from 'antd';

export const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
`;

export const FormCard = styled(Card)`
  .ant-card-body {
    padding: 24px;
  }
`;

