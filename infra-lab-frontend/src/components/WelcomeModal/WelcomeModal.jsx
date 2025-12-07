import React, { useState, useEffect } from 'react';
import { Modal, Button, Checkbox } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import * as S from './WelcomeModal.styles';

const WELCOME_MODAL_DISABLED_KEY = 'infralab_welcome_disabled';

const WelcomeModal = ({ userName }) => {
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Kiểm tra xem user đã chọn "Không hiển thị lại" chưa
    const isDisabled = localStorage.getItem(WELCOME_MODAL_DISABLED_KEY);
    
    if (isDisabled === 'true') {
      return; // Không hiển thị nếu user đã tắt
    }

    // Luôn hiển thị popup mỗi khi vào trang (sau khi đăng nhập)
    // Đợi một chút để trang load xong
    const timer = setTimeout(() => {
      setVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [userName]); // Hiển thị lại khi userName thay đổi (đăng nhập mới)

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_MODAL_DISABLED_KEY, 'true');
    }
    setVisible(false);
  };

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={null}
      closable={false}
      width={500}
      centered={true}
      maskClosable={true}
      maskStyle={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      styles={{
        content: {
          padding: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        },
        body: {
          padding: 0,
        },
      }}
      zIndex={10000}
    >
      <S.ModalContent>
        <S.CloseButton onClick={handleClose}>
          <CloseOutlined />
        </S.CloseButton>
        
        <S.WelcomeIcon>🎉</S.WelcomeIcon>
        
        <S.WelcomeTitle>
          Chào mừng đến với InfraLAB
        </S.WelcomeTitle>
        
        <S.WelcomeSubtitle>
          Xin chào, <S.UserNameText>{userName || 'Sinh viên'}</S.UserNameText>!
        </S.WelcomeSubtitle>
        
        <S.WelcomeMessage>
          Hệ thống quản lý thiết bị phòng Lab của bạn. 
          Bắt đầu khám phá và mượn thiết bị ngay hôm nay!
        </S.WelcomeMessage>
        
        <S.CheckboxWrapper>
          <Checkbox checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)}>
            Không hiển thị lại
          </Checkbox>
        </S.CheckboxWrapper>
        
        <S.WelcomeButton onClick={handleClose}>
          Bắt đầu khám phá
        </S.WelcomeButton>
      </S.ModalContent>
    </Modal>
  );
};

export default WelcomeModal;

