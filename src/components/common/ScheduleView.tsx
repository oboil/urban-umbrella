// src/components/common/ScheduleView.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Card, Badge, Button, Modal } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import type { ClassroomFake } from '../../types/classroom';
import type { ScheduleItem, TimeSlot, DaySchedule } from '../../types/schedule';
import { generateTimeSlots, getScheduleByRoomAndDate, isTimeSlotAvailable } from '../../data/scheduleData';
import ReservationForm from '../reservation/ReservationForm';
import styles from '../../styles/common/schedules.module.css';
import { eventBus } from '../../utils/eventBus';
import { formatDateToString } from '../../utils/timeFormat';

interface ScheduleViewProps {
  classroom: ClassroomFake;
  selectedDate?: string;
  layout?: 'mobile' | 'tablet';
  onClose?: () => void;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({
  classroom,
  selectedDate,
  layout = 'mobile',
  onClose
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || formatDateToString(new Date()));
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string } | null>(null);
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [loading, setLoading] = useState(false);

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // 스케줄 로드
  const loadSchedule = async () => {
    setLoading(true);
    try {
      // classroom.roomId를 직접 사용
      const roomId = classroom.roomId;
      console.log('Loading schedule for room:', roomId, 'from classroom:', classroom.name);

      const scheduleData = await getScheduleByRoomAndDate(roomId, currentDate);
      console.log('Loaded schedule data:', scheduleData);
      setSchedule(scheduleData);
    } catch (error) {
      console.error('스케줄 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();

    const handleReservationUpdate = () => {
      console.log('ScheduleView: 예약 업데이트 이벤트 수신');
      loadSchedule();
    };

    // 이벤트 리스너 등록
    eventBus.on('reservationUpdated', handleReservationUpdate);
    eventBus.on('dataRefresh', handleReservationUpdate);

    // 컴포넌트 언마운트 시 이벤트 리스너 해제
    return () => {
      eventBus.off('reservationUpdated', handleReservationUpdate);
      eventBus.off('dataRefresh', handleReservationUpdate);
    };
  }, [classroom.id, currentDate]);

  const currentTime = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (currentDate === today) {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      return hours * 60 + minutes;
    }
    return -1; // 다른 날짜면 현재 시간 표시 안함
  }, [currentDate]);

  // 시간 슬롯의 상태 확인 (수정된 버전)
  const getTimeSlotStatus = (slot: TimeSlot, nextSlot?: TimeSlot): 'available' | 'occupied' | 'maintenance' => {
    if (!schedule || !nextSlot) return 'available';

    const startTime = slot.display;
    const endTime = nextSlot.display;

    const item = schedule.items.find(item =>
      (item.startTime <= startTime && item.endTime > startTime) ||
      (item.startTime < endTime && item.endTime >= endTime) ||
      (item.startTime >= startTime && item.endTime <= endTime)
    );

    if (item) {
      return item.type === 'maintenance' ? 'maintenance' : 'occupied';
    }

    return 'available';
  };

  // 예약 가능한 시간대 찾기
  const getAvailableSlots = (startIndex: number): number => {
    let count = 0;
    for (let i = startIndex; i < timeSlots.length - 1; i++) {
      const status = getTimeSlotStatus(timeSlots[i], timeSlots[i + 1]);
      if (status === 'available') {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  const handleReservationClick = (startTime: string) => {
    // 기본적으로 1시간 슬롯으로 설정
    const startIndex = timeSlots.findIndex(slot => slot.display === startTime);
    const endIndex = Math.min(startIndex + 2, timeSlots.length - 1); // 1시간 = 2슬롯
    const endTime = timeSlots[endIndex].display;

    setSelectedTimeSlot({ start: startTime, end: endTime });
    setShowReservationModal(true);
  };

  const handleReservationSuccess = async () => {
    setShowReservationModal(false);
    setSelectedTimeSlot(null);

    // EventBus를 통해 전역 업데이트 이벤트 발생
    eventBus.emit('reservationUpdated');

    // 로컬 스케줄 새로고침
    await loadSchedule();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'lecture': return '#3B82F6';
      case 'reservation': return '#10B981';
      case 'maintenance': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusBadge = (item: ScheduleItem) => {
    const colors = {
      lecture: 'primary',
      reservation: 'success',
      maintenance: 'warning'
    };

    return (
      <Badge bg={colors[item.type] as any} className="me-1">
        {item.type === 'lecture' ? '수업' :
          item.type === 'reservation' ? '예약' : '점검'}
      </Badge>
    );
  };

  // 스타일 클래스 생성
  const getClassName = (baseClass: string) => {
    const layoutClass = layout === 'tablet' ? `${baseClass}Tablet` : `${baseClass}Mobile`;
    return `${styles[baseClass] || ''} ${styles[layoutClass] || ''}`.trim();
  };

  if (loading) {
    return (
      <div className={getClassName('container')}>
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩중...</span>
          </div>
          <p className="mt-2">시간표를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={getClassName('container')}>
        {/* 헤더 */}
        <div className={getClassName('header')}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">
              <i className="bi bi-calendar-week me-2"></i>
              {classroom.name} 시간표
            </h4>
            {onClose && (
              <Button variant="outline-secondary" size="sm" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </Button>
            )}
          </div>

          <div className="d-flex align-items-center gap-3 mb-3">
            <div>
              <DatePicker
                selected={new Date(currentDate)}
                onChange={(date) => {
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    setCurrentDate(`${year}-${month}-${day}`);
                  } else {
                    setCurrentDate('');
                  }
                }}
                dateFormat="yyyy년 MM월 dd일"
                className="form-control form-control-sm"
                minDate={new Date()}
              />
            </div>
            <div className="text-muted small">
              {formatDate(currentDate)}
            </div>
          </div>
        </div>

        {/* 시간표 */}
        <Card>
          <Card.Header className="bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">일정 현황</h6>
              <div className="d-flex gap-2">
                <Badge bg="primary">수업</Badge>
                <Badge bg="success">예약</Badge>
                <Badge bg="warning">점검</Badge>
                <Badge bg="danger">이용불가</Badge>
              </div>
            </div>
          </Card.Header>

          <Card.Body className="p-0">
            <div className={getClassName('timeTable')}>
              {timeSlots.map((slot, index) => {
                const nextSlot = timeSlots[index + 1];
                if (!nextSlot) return null;

                const status = getTimeSlotStatus(slot, nextSlot);
                const scheduleItem = schedule?.items.find(item =>
                  item.startTime <= slot.display && item.endTime > slot.display
                );

                const isCurrentTime = currentTime >= 0 &&
                  currentTime >= (slot.hour * 60 + slot.minute) &&
                  currentTime < (nextSlot.hour * 60 + nextSlot.minute);

                const availableSlots = status === 'available' ? getAvailableSlots(index) : 0;

                return (
                  <div
                    key={slot.display}
                    className={`${getClassName('timeSlot')} ${isCurrentTime ? getClassName('currentTimeSlot') : ''
                      }`}
                  >
                    <div className={getClassName('timeLabel')}>
                      {slot.display}
                      {isCurrentTime && (
                        <Badge bg="info" className="ms-1">현재</Badge>
                      )}
                    </div>

                    <div className={getClassName('timeContent')}>
                      {scheduleItem ? (
                        <div
                          className={getClassName('scheduleItem')}
                          style={{ 
                            borderLeft: `4px solid ${getStatusColor(scheduleItem.type)}`,
                            backgroundColor: scheduleItem.type === 'maintenance' ? '#FEF3C7' : 
                                           scheduleItem.type === 'lecture' ? '#DBEAFE' : 
                                           scheduleItem.type === 'reservation' ? '#D1FAE5' : '#F9FAFB'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              {getStatusBadge(scheduleItem)}
                              <strong>{scheduleItem.title}</strong>
                            </div>
                            <small className="text-muted">
                              {scheduleItem.startTime} - {scheduleItem.endTime}
                            </small>
                          </div>
                          <div className="text-muted small mt-1">
                            {scheduleItem.instructor && (
                              <span><i className="bi bi-person me-1"></i>{scheduleItem.instructor}</span>
                            )}
                            {scheduleItem.reservedBy && (
                              <span><i className="bi bi-person-check me-1"></i>{scheduleItem.reservedBy}</span>
                            )}
                          </div>
                        </div>
                      ) : status === 'available' ? (
                        <div className={getClassName('availableSlot')}>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-success small">
                              <i className="bi bi-check-circle me-1"></i>
                              이용 가능
                            </span>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleReservationClick(slot.display)}
                            >
                              <i className="bi bi-plus me-1"></i>
                              예약
                            </Button>
                          </div>
                          {availableSlots > 1 && (
                            <small className="text-muted">
                              연속 {Math.floor(availableSlots / 2)}시간 이용 가능
                            </small>
                          )}
                        </div>
                      ) : (
                        <div 
                          className={getClassName('unavailableSlot')}
                          style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                        >
                          <span className="text-danger small">
                            <i className="bi bi-x-circle me-1"></i>
                            이용 불가
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>

        {/* 범례 */}
        <Card className="mt-3">
          <Card.Body className="py-2">
            <div className="d-flex justify-content-center gap-4 text-small">
              <span><i className="bi bi-check-circle text-success me-1"></i>이용 가능</span>
              <span><i className="bi bi-person text-primary me-1"></i>수업 중</span>
              <span><i className="bi bi-calendar-check text-success me-1"></i>예약됨</span>
              <span><i className="bi bi-tools text-warning me-1"></i>점검 중</span>
              <span><i className="bi bi-x-circle text-danger me-1"></i>이용 불가</span>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* 예약 모달 */}
      {selectedTimeSlot && (
        <ReservationForm
          show={showReservationModal}
          onHide={() => setShowReservationModal(false)}
          classroom={classroom}
          onReservationSuccess={handleReservationSuccess}
          defaultDate={currentDate}
          defaultStartTime={selectedTimeSlot.start}
          defaultEndTime={selectedTimeSlot.end}
        />
      )}
    </>
  );
};

export default ScheduleView;