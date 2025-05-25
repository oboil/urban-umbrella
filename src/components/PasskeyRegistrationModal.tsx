import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { registerPasskey } from '../utils/passkeyAuth';
import type { PasskeyUser } from '../types/auth';

interface PasskeyRegistrationModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: (user: PasskeyUser) => void;
}

const PasskeyRegistrationModal: React.FC<PasskeyRegistrationModalProps> = ({
  show,
  onHide,
  onSuccess
}) => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await registerPasskey(username.trim(), displayName.trim());
      onSuccess(user);
      handleClose();
    } catch (error) {
      console.error('Passkey 등록 오류:', error);
      setError(error instanceof Error ? error.message : 'Passkey 등록에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setDisplayName('');
    setError(null);
    setIsLoading(false);
    onHide();
  };

  const isPasskeySupported = () => {
    // 기본 WebAuthn API 지원 확인
    if (!navigator.credentials) {
      console.log('navigator.credentials가 지원되지 않습니다.');
      return false;
    }
    
    if (!window.PublicKeyCredential) {
      console.log('PublicKeyCredential API가 지원되지 않습니다.');
      return false;
    }

    // HTTPS 환경 확인 (localhost는 예외)
    const isSecureContext = window.isSecureContext;
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '[::1]';
    
    if (!isSecureContext && !isLocalhost) {
      console.log('HTTPS 환경이 아닙니다. Passkey는 HTTPS에서만 작동합니다.');
      return false;
    }

    return true;
  };

  const getDetailedErrorMessage = () => {
    const hasCredentials = !!navigator.credentials;
    const hasPublicKey = !!window.PublicKeyCredential;
    const isSecureContext = window.isSecureContext;
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '[::1]';

    let messages = [];
    
    if (!hasCredentials) {
      messages.push('• navigator.credentials API가 지원되지 않습니다.');
    }
    
    if (!hasPublicKey) {
      messages.push('• PublicKeyCredential API가 지원되지 않습니다.');
    }
    
    if (!isSecureContext && !isLocalhost) {
      messages.push('• HTTPS 환경이 아닙니다. (현재: ' + window.location.protocol + ')');
      messages.push('• 해결방법: HTTPS로 접속하거나 localhost에서 테스트하세요.');
    }

    return messages;
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-shield-check me-2"></i>
          Passkey 계정 등록
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!isPasskeySupported() ? (
          <Alert variant="danger">
            <h6>
              <i className="bi bi-exclamation-triangle me-2"></i>
              Passkey를 사용할 수 없습니다
            </h6>
            <div className="mt-2">
              {getDetailedErrorMessage().map((message, index) => (
                <div key={index} className="small">{message}</div>
              ))}
            </div>
            <hr className="my-3" />
            <div className="small">
              <strong>환경 정보:</strong><br/>
              • 브라우저: {navigator.userAgent.split(' ').pop()}<br/>
              • 프로토콜: {window.location.protocol}<br/>
              • 호스트: {window.location.hostname}<br/>
              • 보안 컨텍스트: {window.isSecureContext ? '✅ 예' : '❌ 아니오'}
            </div>
          </Alert>
        ) : (
          <>
            <div className="mb-4">
              <div className="text-center mb-3">
                <i className="bi bi-person-plus" style={{ fontSize: '3rem', color: '#0d6efd' }}></i>
              </div>
              <p className="text-muted text-center">
                Passkey를 사용하여 간편하고 안전하게 예약할 수 있습니다.<br/>
                생체 인증이나 PIN을 사용하여 계정이 보호됩니다.
              </p>
            </div>

            {error && (
              <Alert variant="danger">
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="bi bi-at me-1"></i>
                  사용자 ID
                </Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="예: john.doe@company.com"
                  required
                  disabled={isLoading}
                />
                <Form.Text className="text-muted">
                  이메일 또는 고유한 사용자 ID를 입력하세요.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>
                  <i className="bi bi-person me-1"></i>
                  표시 이름 (예약자명)
                </Form.Label>
                <Form.Control
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="예: 홍길동"
                  required
                  disabled={isLoading}
                />
                <Form.Text className="text-muted">
                  예약 시 표시될 이름입니다.
                </Form.Text>
              </Form.Group>

              <div className="d-grid">
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        className="me-2"
                      />
                      등록 중...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-plus me-2"></i>
                      Passkey 등록하기
                    </>
                  )}
                </Button>
              </div>
            </Form>

            <div className="mt-4 p-3 bg-light rounded">
              <h6 className="mb-2">
                <i className="bi bi-info-circle me-1"></i>
                안전한 인증 방법
              </h6>
              <ul className="mb-0 small text-muted">
                <li>Face ID, Touch ID, Windows Hello 등 생체 인증</li>
                <li>디바이스 PIN 또는 패스워드</li>
                <li>하드웨어 보안 키 (FIDO2 호환)</li>
              </ul>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          취소
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PasskeyRegistrationModal; 