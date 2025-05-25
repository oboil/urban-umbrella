import React, { useState, useEffect } from 'react';
import { Navbar, Container, Button, Badge, Dropdown } from 'react-bootstrap';
import PasskeyRegistrationModal from './PasskeyRegistrationModal';
import { getCurrentSession, logout, getRegisteredUsers } from '../utils/passkeyAuth';
import type { AuthSession, PasskeyUser } from '../types/auth';

const AppHeader: React.FC = () => {
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<PasskeyUser[]>([]);

  useEffect(() => {
    const session = getCurrentSession();
    setAuthSession(session);
    setRegisteredUsers(getRegisteredUsers());
  }, []);

  const handleRegistrationSuccess = (user: PasskeyUser) => {
    setRegisteredUsers(prev => {
      const existing = prev.find(u => u.id === user.id);
      if (existing) {
        return prev.map(u => u.id === user.id ? user : u);
      }
      return [...prev, user];
    });
    
    // 등록 성공 후 세션 상태 업데이트
    const session = getCurrentSession();
    setAuthSession(session);
    
    // 등록 성공 메시지
    alert(`${user.displayName}님의 Passkey가 성공적으로 등록되었습니다!`);
  };

  const handleLogout = () => {
    logout();
    setAuthSession(null);
    alert('로그아웃되었습니다.');
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" fixed="top" style={{ zIndex: 1000 }}>
        <Container fluid>
          <Navbar.Brand>
            <i className="bi bi-building me-2"></i>
            강의실 예약 시스템
          </Navbar.Brand>
          
          <div className="d-flex align-items-center gap-2">
            {authSession ? (
              <>
                <div className="text-white me-3">
                  <i className="bi bi-shield-check me-1"></i>
                  <small>{authSession.displayName}님</small>
                </div>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-light" size="sm">
                    <i className="bi bi-person-circle me-1"></i>
                    계정
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setShowRegistrationModal(true)}>
                      <i className="bi bi-shield-plus me-2"></i>
                      새 Passkey 등록
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      로그아웃
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowRegistrationModal(true)}
              >
                <i className="bi bi-shield-plus me-1"></i>
                Passkey 등록
                {registeredUsers.length > 0 && (
                  <Badge bg="success" className="ms-1">
                    {registeredUsers.length}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </Container>
      </Navbar>

      <PasskeyRegistrationModal
        show={showRegistrationModal}
        onHide={() => setShowRegistrationModal(false)}
        onSuccess={handleRegistrationSuccess}
      />
    </>
  );
};

export default AppHeader; 