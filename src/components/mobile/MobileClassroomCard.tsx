// components/mobile/MobileClassroomCard.tsx
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Tooltip, OverlayTrigger } from 'react-bootstrap';
import type { ClassroomFake } from '../../types/classroom';
import type { Reservation } from '../../types/reservation';
import { getStatusColor, getStatusText } from '../../data/classroomData';
import { getReservationsByClassroomAndDate } from '../../data/reservationData';

interface MobileClassroomCardProps {
  classroom: ClassroomFake;
  onClick?: (classroom: ClassroomFake) => void;
  onReservationClick?: (classroom: ClassroomFake) => void;
}

const MobileClassroomCard: React.FC<MobileClassroomCardProps> = ({ 
  classroom, 
  onClick,
  onReservationClick
}) => {
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'available' | 'occupied' | 'upcoming'>('available');
  
  const statusColor = getStatusColor(classroom.status);
  const statusText = getStatusText(classroom.status);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const reservations = getReservationsByClassroomAndDate(classroom.id, today);
    setTodayReservations(reservations);
    
    // 현재 시간 기준으로 상태 판단
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    const ongoingReservation = reservations.find(res => 
      res.startTime <= currentTime && currentTime <= res.endTime
    );
    
    const upcomingReservation = reservations.find(res => 
      res.startTime > currentTime
    );
    
    if (ongoingReservation) {
      setCurrentStatus('occupied');
    } else if (upcomingReservation) {
      setCurrentStatus('upcoming');
    } else {
      setCurrentStatus('available');
    }
  }, [classroom.id, today]);

  const getNextReservation = () => {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    return todayReservations.find(res => res.startTime > currentTime);
  };

  const getCurrentReservation = () => {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    return todayReservations.find(res => 
      res.startTime <= currentTime && currentTime <= res.endTime
    );
  };

  const handleClick = () => {
    onClick?.(classroom);
  };

  const handleReservationClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    onReservationClick?.(classroom);
  };

  const getStatusBadgeVariant = () => {
    switch (currentStatus) {
      case 'occupied':
        return 'danger';
      case 'upcoming':
        return 'warning';
      case 'available':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'occupied':
        return 'bi-person-fill';
      case 'upcoming':
        return 'bi-clock';
      case 'available':
        return 'bi-check-circle';
      default:
        return 'bi-circle';
    }
  };

  const getStatusMessage = () => {
    const currentRes = getCurrentReservation();
    const nextRes = getNextReservation();
    
    if (currentRes) {
      return `사용중 (${currentRes.endTime}까지)`;
    } else if (nextRes) {
      return `예약됨 (${nextRes.startTime}부터)`;
    } else {
      return '예약 가능';
    }
  };

  const renderReservationTooltip = (props: any) => (
    <Tooltip id={`tooltip-${classroom.id}`} {...props}>
      <div className="text-start">
        <strong>오늘의 예약 현황</strong>
        {todayReservations.length === 0 ? (
          <div className="mt-1">예약이 없습니다</div>
        ) : (
          todayReservations.map((res, index) => (
            <div key={index} className="mt-1 small">
              {res.startTime}-{res.endTime}: {res.title}
            </div>
          ))
        )}
      </div>
    </Tooltip>
  );

  return (
    <Card className="mb-3 shadow-sm border-start border-4" style={{ borderLeftColor: statusColor }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <Card.Title className="h5 mb-1">{classroom.name}</Card.Title>
            <Card.Subtitle className="text-muted small">
              <i className="bi bi-building me-1"></i>
              {classroom.building}
            </Card.Subtitle>
          </div>
          <div className="d-flex flex-column align-items-end gap-1">
            <Badge 
              bg={getStatusBadgeVariant()} 
              className="d-flex align-items-center gap-1"
            >
              <i className={getStatusIcon()}></i>
              {getStatusMessage()}
            </Badge>
            {currentStatus === 'available' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleReservationClick}
                className="d-flex align-items-center gap-1"
              >
                <i className="bi bi-calendar-plus"></i>
                예약
              </Button>
            )}
          </div>
        </div>

        <div className="row text-muted small">
          <div className="col-6">
            <i className="bi bi-people me-1"></i>
            수용: <strong>{classroom.capacity}명</strong>
          </div>
          <div className="col-6">
            <i className="bi bi-person-check me-1"></i>
            현재: <strong>{classroom.currentUsers}명</strong>
          </div>
        </div>

        {todayReservations.length > 0 && (
          <div className="mt-2">
            <OverlayTrigger
              placement="top"
              delay={{ show: 250, hide: 400 }}
              overlay={renderReservationTooltip}
            >
              <Badge bg="info" className="cursor-pointer">
                <i className="bi bi-calendar-event me-1"></i>
                오늘 {todayReservations.length}건 예약
              </Badge>
            </OverlayTrigger>
          </div>
        )}

        {/* 다음 수업 정보가 있는 경우 */}
        {classroom.nextClass && classroom.nextClass !== 'N/A' && (
          <div className="mt-2 p-2 bg-light rounded">
            <small className="text-muted">
              <i className="bi bi-clock me-1"></i>
              다음: {classroom.nextClass}
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MobileClassroomCard;