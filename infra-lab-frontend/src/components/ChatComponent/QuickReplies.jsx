import React, { useState } from "react";
import styled from "styled-components";

const SUGGESTED_MESSAGES = [
  "Tôi muốn mua thỏ bông",
  "Có sản phẩm nào màu hồng không?",
  "Tư vấn quà cho bé gái 5 tuổi",
  "Sản phẩm này giá bao nhiêu?",
  "Còn hàng không?",
  "Cách đặt hàng như thế nào?",
  "Chính sách đổi trả",
  "Jellycat là gì?",
];

const QuickReplies = ({ onSend }) => {
  const [showMore, setShowMore] = useState(false);
  const displayedMessages = showMore ? SUGGESTED_MESSAGES : SUGGESTED_MESSAGES.slice(0, 4);

  return (
    <Container>
      <QuickRepliesGrid>
        {displayedMessages.map((msg, index) => (
          <ReplyButton key={index} onClick={() => onSend(msg)}>
            {msg}
          </ReplyButton>
        ))}
      </QuickRepliesGrid>
      {SUGGESTED_MESSAGES.length > 4 && (
        <ToggleButton onClick={() => setShowMore(!showMore)}>
          {showMore ? "Ẩn bớt" : "Xem thêm câu hỏi"}
        </ToggleButton>
      )}
    </Container>
  );
};

export default QuickReplies;

// 🎨 Styled
const Container = styled.div`
  padding: 10px 15px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
`;

const QuickRepliesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

const ReplyButton = styled.button`
  padding: 8px 14px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 18px;
  cursor: pointer;
  font-size: 12px;
  color: #333;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: #ff9f1c;
    color: white;
    border-color: #ff9f1c;
    transform: translateY(-1px);
  }
`;

const ToggleButton = styled.button`
  width: 100%;
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 11px;
  color: #666;
  text-align: center;
  transition: 0.2s;

  &:hover {
    background: #f0f0f0;
    color: #ff9f1c;
  }
`;
