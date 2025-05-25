// components/common/StatusView.tsx
import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import type { ClassroomFake } from '../../types/classroom';
import { getStatusColor, getStatusText } from '../../data/classroomData';
import { getBuildingName } from '../../data/buildingData';
import ScheduleView from './ScheduleView';
import ReservationForm from '../reservation/ReservationForm';
import styles from '../../styles/common/status.module.css';
import { eventBus } from '../../utils/eventBus';

interface StatusViewProps {
  data: ClassroomFake[];
  layout?: 'mobile' | 'tablet';
  onRefresh?: () => void;
  onExport?: () => void;
  selectedBuilding?: string;
  onClassroomClick?: (classroom: ClassroomFake) => void;
  loading?: boolean;
}

const StatusView: React.FC<StatusViewProps> = ({ 
  data, 
  layout = 'mobile',
  onRefresh, 
  onExport,
  selectedBuilding,
  onClassroomClick,
  loading = false
}) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomFake | null>(null);

  const handleCardAction = (action: string, classroom: ClassroomFake) => {
    console.log(`${action} action for ${classroom.name}`);
    if (action === 'detail') {
      setSelectedClassroom(classroom);
      setShowScheduleModal(true);
    } else if (action === 'reserve') {
      setSelectedClassroom(classroom);
      setShowReservationModal(true);
    }
  };

  const handleClassroomCardClick = (classroom: ClassroomFake) => {
    setSelectedClassroom(classroom);
    setShowScheduleModal(true);
    if (onClassroomClick) {
      onClassroomClick(classroom);
    }
  };

  const handleReservationSuccess = () => {
    setShowReservationModal(false);
    setSelectedClassroom(null);
    
    // EventBus를 통해 전역 업데이트 이벤트 발생
    eventBus.emit('reservationUpdated');
    
    // 부모 컴포넌트의 새로고침 함수 호출
    if (onRefresh) {
      onRefresh();
    }
  };

  // 현재 선택된 건물명 표시
  const currentBuildingName = selectedBuilding 
    ? getBuildingName(selectedBuilding) 
    : '강의실';

  // 통계 계산
  const available = data.filter(room => room.status === 'available').length;
  const occupied = data.filter(room => room.status === 'occupied').length;
  const maintenance = data.filter(room => room.status === 'maintenance').length;
  const totalCapacity = data.reduce((sum, room) => sum + room.capacity, 0);
  const currentUsers = data.reduce((sum, room) => sum + room.currentUsers, 0);

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
    <div className={getClassName('container')}>
      {/* 태블릿에서만 헤더 표시 */}
      {layout === 'tablet' && (
        <div className={getClassName('contentHeader')}>
          <h2 className={getClassName('contentTitle')}>
            {currentBuildingName} 현황 대시보드
          </h2>
          <div className={getClassName('actionButtons')}>
            {/* <button 
              className={getClassName('secondaryButton')}
              onClick={onExport}
            >
              내보내기
            </button> */}
            <button 
    className={getClassName('primaryButton')}
    onClick={onRefresh}
    disabled={loading}
  >
    {loading ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
        새로고침 중...
      </>
    ) : (
      '새로고침'
    )}
  </button>
          </div>
        </div>
      )}

      {/* 통계 섹션 */}
      <div className={getClassName('quickStats')}>
        <div className={getClassName('statsGrid')}>
          <div className={getClassName('statItem')}>
            <div className={getClassName('statNumber')} style={{ color: '#10B981' }}>
              {available}
            </div>
            <div className={getClassName('statLabel')}>사용가능</div>
          </div>
          <div className={getClassName('statItem')}>
            <div className={getClassName('statNumber')} style={{ color: '#EF4444' }}>
              {occupied}
            </div>
            <div className={getClassName('statLabel')}>사용중</div>
          </div>
          <div className={getClassName('statItem')}>
            <div className={getClassName('statNumber')} style={{ color: '#F59E0B' }}>
              {maintenance}
            </div>
            <div className={getClassName('statLabel')}>점검중</div>
          </div>
          {layout === 'tablet' && (
            <div className={getClassName('statItem')}>
              <div className={getClassName('statNumber')} style={{ color: '#3B82F6' }}>
                {totalCapacity}
              </div>
              <div className={getClassName('statLabel')}>총 수용</div>
            </div>
          )}
        </div>
      </div>
      
      {/* 강의실 목록/그리드 */}
      <div className={getClassName('classroomContainer')}>
  {data.length === 0 ? (
    <div className={getClassName('emptyState')}>
      <div className={getClassName('emptyIcon')}>🏫</div>
      <h3 className={getClassName('emptyTitle')}>검색 결과가 없습니다</h3>
      <p className={getClassName('emptyDescription')}>다른 검색어나 필터를 시도해보세요.</p>
    </div>
  ) : (
    data.map((classroom, idx) => {
      const statusColor = getStatusColor(classroom.status);
      const statusText = getStatusText(classroom.status);
      
      // 전체 보기일 때와 특정 건물 선택일 때 이름 표시 형식 변경
      const displayName = selectedBuilding 
        ? classroom.name 
        : `[${classroom.building}] ${classroom.name}`;
      
      return (
        <div 
          key={idx}
          className={getClassName('classroomCard')}
          style={{
            borderColor: layout === 'tablet' ? statusColor + '40' : 'transparent',
            borderLeftColor: statusColor,
            transform: hoveredCard === classroom.id ? 'translateY(-2px)' : 'translateY(0)',
            boxShadow: hoveredCard === classroom.id 
              ? '0 8px 25px rgba(0,0,0,0.1)' 
              : '0 4px 6px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={() => setHoveredCard(classroom.id)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => handleClassroomCardClick(classroom)}
        >
          <div className={getClassName('cardHeader')}>
            <h3 className={getClassName('roomName')}>{displayName}</h3>
            <span 
              className={getClassName('statusBadge')}
              style={{
                backgroundColor: statusColor + '20',
                color: statusColor
              }}
            >
              {statusText}
            </span>
          </div>
                
                <div className={getClassName('cardContent')}>
                  {layout === 'mobile' ? (
                    <div className={getClassName('cardInfo')}>
                      <span>수용: {classroom.capacity}명</span>
                      <span>현재: {classroom.currentUsers}명</span>
                      <span>다음: {classroom.nextClass}</span>
                    </div>
                  ) : (
                    <div className={getClassName('gridInfoSection')}>
                      <div className={getClassName('gridInfoItem')}>
                        <span className={getClassName('gridInfoLabel')}>수용인원</span>
                        <span className={getClassName('gridInfoValue')}>{classroom.capacity}명</span>
                      </div>
                      <div className={getClassName('gridInfoItem')}>
                        <span className={getClassName('gridInfoLabel')}>현재사용</span>
                        <span className={getClassName('gridInfoValue')}>{classroom.currentUsers}명</span>
                      </div>
                      <div className={getClassName('gridInfoItem')}>
                        <span className={getClassName('gridInfoLabel')}>다음수업</span>
                        <span className={getClassName('gridInfoValue')}>{classroom.nextClass}</span>
                      </div>
                      <div className={getClassName('gridInfoItem')}>
                        <span className={getClassName('gridInfoLabel')}>건물</span>
                        <span className={getClassName('gridInfoValue')}>{classroom.building}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {layout === 'tablet' && (
                  <div className={getClassName('gridActions')}>
                    <button 
                      className={getClassName('gridActionButton')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardAction('reserve', classroom);
                      }}
                    >
                      예약
                    </button>
                    <button 
                      className={`${getClassName('gridActionButton')} ${getClassName('gridPrimaryAction')}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardAction('detail', classroom);
                      }}
                    >
                      상세보기
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 스케줄 모달 */}
      <Modal 
        show={showScheduleModal} 
        onHide={() => setShowScheduleModal(false)}
        size="xl"
        centered
      >
        <Modal.Body className="p-0">
          {selectedClassroom && (
            <ScheduleView
              classroom={selectedClassroom}
              layout={layout}
              onClose={() => setShowScheduleModal(false)}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* 예약 모달 */}
      <ReservationForm
        show={showReservationModal}
        onHide={() => setShowReservationModal(false)}
        classroom={selectedClassroom}
        onReservationSuccess={handleReservationSuccess}
      />
    </div>
  );
};

export default StatusView;