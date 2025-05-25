// components/common/SettingsView.tsx
import React, { useState, useEffect } from 'react';
import { getCurrentSession, getRegisteredUsers, logout } from '../../utils/passkeyAuth';
import { reservationDB } from '../../utils/reservationDB';
import type { AuthSession, PasskeyUser } from '../../types/auth';
import styles from '../../styles/common/settings.module.css';

interface SettingsViewProps {
  layout?: 'mobile' | 'tablet';
  className?: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  layout = 'mobile',
  className = ''
}) => {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<PasskeyUser[]>([]);
  const [showUserList, setShowUserList] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const session = getCurrentSession();
    const users = getRegisteredUsers();
    setAuthSession(session);
    setRegisteredUsers(users);
  };

  const handleLogout = () => {
    if (confirm('로그아웃하시겠습니까?')) {
      logout();
      setAuthSession(null);
      alert('로그아웃되었습니다.');
    }
  };

  const handleClearAllData = async () => {
    if (confirm('모든 예약 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await reservationDB.clearAllReservations();
        alert('모든 예약 데이터가 삭제되었습니다.');
      } catch (error) {
        console.error('데이터 삭제 실패:', error);
        alert('데이터 삭제에 실패했습니다.');
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 스타일 클래스 생성 함수
  const getClassName = (baseClass: string, modifier?: string) => {
    const layoutClass = layout === 'tablet' ? `${baseClass}Tablet` : `${baseClass}Mobile`;
    const classes = [styles[baseClass], styles[layoutClass]];
    if (modifier) {
      classes.push(styles[modifier]);
    }
    return classes.filter(Boolean).join(' ');
  };

  return (
    <div className={`${getClassName('container')} ${className}`}>
      {/* 사용자 정보 섹션 */}
      <div className={getClassName('settingsSection')}>
        <h2 className={getClassName('sectionTitle')}>계정 정보</h2>
        {authSession ? (
          <div className={getClassName('userInfo')}>
            <div className={getClassName('userCard')}>
              <div className={getClassName('userAvatar')}>👤</div>
              <div className={`${getClassName('userDetails')}`}>
                <h3>{authSession.displayName}</h3>
                <p>{authSession.username}</p>
                <small>로그인: {formatDate(authSession.loginTime)}</small>
              </div>
            </div>
            <button 
              className={getClassName('logoutButton')}
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className={getClassName('noAuth')}>
            <p>로그인되지 않았습니다.</p>
            <p>Passkey를 등록하여 간편하게 로그인하세요.</p>
          </div>
        )}
      </div>

      {/* 등록된 사용자 목록 */}
      <div className={getClassName('settingsSection')}>
        <div className={getClassName('sectionHeader')}>
          <h2 className={getClassName('sectionTitle')}>등록된 Passkey</h2>
          <button
            className={getClassName('toggleButton')}
            onClick={() => setShowUserList(!showUserList)}
          >
            {showUserList ? '숨기기' : '보기'} ({registeredUsers.length})
          </button>
        </div>
        
        {showUserList && (
          <div className={getClassName('userList')}>
            {registeredUsers.length === 0 ? (
              <p className={getClassName('emptyText')}>등록된 Passkey가 없습니다.</p>
            ) : (
              registeredUsers.map(user => (
                <div key={user.id} className={getClassName('userListItem')}>
                  <div className={`${getClassName('userListInfo')}`}>
                    <h4>{user.displayName}</h4>
                    <p>{user.username}</p>
                    <small>등록일: {formatDate(user.createdAt)}</small>
                  </div>
                  <div>
                    {authSession?.userId === user.id ? (
                      <span className={`${getClassName('statusBadge')} ${styles.activeStatus}`}>
                        활성
                      </span>
                    ) : (
                      <span className={`${getClassName('statusBadge')} ${styles.inactiveStatus}`}>
                        비활성
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 앱 정보 섹션 */}
      <div className={getClassName('settingsSection')}>
        <h2 className={getClassName('sectionTitle')}>앱 정보</h2>
        <div className={getClassName('appInfo')}>
          <div className={getClassName('infoItem')}>
            <span className={getClassName('infoLabel')}>앱 이름</span>
            <span className={getClassName('infoValue')}>강의실 예약 시스템</span>
          </div>
          <div className={getClassName('infoItem')}>
            <span className={getClassName('infoLabel')}>버전</span>
            <span className={getClassName('infoValue')}>1.0.0</span>
          </div>
          <div className={getClassName('infoItem')}>
            <span className={getClassName('infoLabel')}>개발자</span>
            <span className={getClassName('infoValue')}>Team React</span>
          </div>
          {layout === 'tablet' && (
            <>
              <div className={getClassName('infoItem')}>
                <span className={getClassName('infoLabel')}>플랫폼</span>
                <span className={getClassName('infoValue')}>웹 애플리케이션</span>
              </div>
              <div className={getClassName('infoItem')}>
                <span className={getClassName('infoLabel')}>마지막 업데이트</span>
                <span className={getClassName('infoValue')}>2024년 12월</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 데이터 관리 섹션 */}
      <div className={getClassName('settingsSection')}>
        <h2 className={getClassName('sectionTitle')}>데이터 관리</h2>
        <div className={styles.dataManagement}>
          <p className={getClassName('warningText')}>
            ⚠️ 아래 작업은 되돌릴 수 없습니다.
          </p>
          <button
            className={getClassName('dangerButton')}
            onClick={handleClearAllData}
          >
            모든 예약 데이터 삭제
          </button>
        </div>
      </div>

      {/* 도움말 섹션 */}
      <div className={getClassName('settingsSection')}>
        <h2 className={getClassName('sectionTitle')}>도움말</h2>
        <div className={getClassName('helpSection')}>
          <div className={`${getClassName('helpItem')}`}>
            <h4>Passkey란?</h4>
            <p>생체 인증이나 PIN을 사용하여 안전하고 간편하게 로그인할 수 있는 기술입니다.</p>
          </div>
          <div className={`${getClassName('helpItem')}`}>
            <h4>예약 방법</h4>
            <p>강의실을 선택한 후 Passkey 인증 또는 직접 입력으로 예약할 수 있습니다.</p>
          </div>
          <div className={`${getClassName('helpItem')}`}>
            <h4>문제 신고</h4>
            <p>앱 사용 중 문제가 발생하면 관리자에게 문의하세요.</p>
          </div>
          {layout === 'tablet' && (
            <>
              <div className={`${getClassName('helpItem')}`}>
                <h4>키보드 단축키</h4>
                <p>Ctrl+R: 새로고침, Ctrl+F: 검색, Tab: 다음 요소로 이동</p>
              </div>
              <div className={`${getClassName('helpItem')}`}>
                <h4>브라우저 호환성</h4>
                <p>Chrome, Firefox, Safari, Edge 최신 버전에서 정상 동작합니다.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;