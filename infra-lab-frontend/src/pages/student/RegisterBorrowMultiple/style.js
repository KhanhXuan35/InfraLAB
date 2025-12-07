import styled from 'styled-components';
import { Card } from 'antd';

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 64px);
`;

export const FormCard = styled(Card)`
  margin-top: 24px;
  .ant-card-body {
    padding: 24px;
  }
`;

