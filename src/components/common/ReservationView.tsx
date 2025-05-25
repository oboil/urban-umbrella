// src/components/common/ReservationView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { getAllReservations, deleteReservation, updateReservation, checkTimeConflict } from '../../utils/reservationDB';
import { timeService } from '../../utils/timeService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { Reservation } from '../../types/building';
import styles from '../../styles/common/reservation.module.css';
import { eventBus } from '../../utils/eventBus';

interface ReservationViewProps {
  layout?: 'mobile' | 'tablet';
  className?: string;
  serverDate?: string; // 서버 기준 현재 날짜
}

const ReservationView: React.FC<ReservationViewProps> = ({ 
  layout = 'mobile',
  className = '',
  serverDate
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  
  // 편집 관련 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    time: '',
    duration: 1,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string>('');

  useEffect(() => {
    loadReservations();

    const handleReservationUpdate = () => {
      console.log('ReservationView: 예약 업데이트 이벤트 수신');
      loadReservations();
    };

    // 이벤트 리스너 등록
    eventBus.on('reservationUpdated', handleReservationUpdate);
    eventBus.on('dataRefresh', handleReservationUpdate);

    // 컴포넌트 언마운트 시 이벤트 리스너 해제
    return () => {
      eventBus.off('reservationUpdated', handleReservationUpdate);
      eventBus.off('dataRefresh', handleReservationUpdate);
    };
  }, [layout]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const allReservations = await getAllReservations();
      
      // 정렬 로직
      const sortedReservations = await Promise.all(
        allReservations.map(async (reservation) => {
          const status = await getReservationStatus(reservation);
          return { ...reservation, status };
        })
      );
      
      // 상태별 정렬: 진행중 > 예정 > 완료
      sortedReservations.sort((a, b) => {
        const statusOrder = { ongoing: 0, upcoming: 1, completed: 2 };
        
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        
        // 같은 상태 내에서 날짜순 정렬
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
      
      setReservations(sortedReservations);
    } catch (error) {
      console.error('예약 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm('정말로 이 예약을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteReservation(reservationId);
      await loadReservations(); // 목록 새로고침
      alert('예약이 삭제되었습니다.');

      // EventBus를 통해 전역 업데이트 이벤트 발생
      eventBus.emit('reservationUpdated');
    } catch (error) {
      console.error('예약 삭제 실패:', error);
      alert('예약 삭제에 실패했습니다.');
    }
  };

  // 편집 시작
  const handleEditStart = (reservation: Reservation) => {
    setEditingId(reservation.id);
    setEditForm({
      date: reservation.date,
      time: reservation.time,
      duration: reservation.duration,
    });
    setEditError('');
  };

  // 편집 취소
  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({ date: '', time: '', duration: 1 });
    setEditError('');
  };

  // 편집 저장
  const handleEditSave = async (reservation: Reservation) => {
    setIsUpdating(true);
    setEditError('');

    try {
      // 변경 사항이 있는지 확인
      if (editForm.date === reservation.date && 
          editForm.time === reservation.time && 
          editForm.duration === reservation.duration) {
        handleEditCancel();
        return;
      }

      // 과거 날짜 검증 (서버 날짜 기준)
      const currentServerDate = serverDate || await timeService.getTodayString();
      if (editForm.date < currentServerDate) {
        setEditError('과거 날짜로는 수정할 수 없습니다.');
        return;
      }

      // 시간 충돌 검사 (현재 편집 중인 예약은 제외)
      const conflictResult = await checkTimeConflict(reservation.roomId, editForm.date, editForm.time, editForm.duration);
      
      if (conflictResult.hasConflict) {
        // 현재 편집 중인 예약과의 충돌은 제외
        const realConflicts = conflictResult.conflictingReservations.filter(r => r.id !== reservation.id);
        if (realConflicts.length > 0) {
          setEditError(`선택하신 시간대에 다른 예약이 있습니다: ${realConflicts.map(r => `${r.guestName} (${r.time})`).join(', ')}`);
          return;
        }
      }

      // 예약 업데이트
      const updatedReservation = {
        ...reservation,
        date: editForm.date,
        time: editForm.time,
        duration: editForm.duration,
      };

      await updateReservation(updatedReservation);
      await loadReservations(); // 목록 새로고침
      handleEditCancel();
      alert('예약이 수정되었습니다.');

      // EventBus를 통해 전역 업데이트 이벤트 발생
      eventBus.emit('reservationUpdated');
    } catch (error) {
      console.error('예약 수정 실패:', error);
      setEditError('예약 수정에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const formatDuration = (duration: number) => {
    return duration === 1 ? '1시간' : `${duration}시간`;
  };

  // 서버 시간 기준 예약 상태 확인
  const getReservationStatus = async (reservation: Reservation): Promise<'ongoing' | 'upcoming' | 'completed'> => {
    try {
      const now = await timeService.getCurrentTime();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
      
      const reservationStart = new Date(`${reservation.date}T${reservation.time}`);
      const reservationEnd = new Date(reservationStart.getTime() + (reservation.duration * 60 * 60 * 1000));
      
      if (now >= reservationStart && now <= reservationEnd) {
        return 'ongoing';
      } else if (now > reservationEnd) {
        return 'completed';
      } else {
        return 'upcoming';
      }
    } catch (error) {
      console.error('예약 상태 확인 실패:', error);
      // fallback으로 로컬 시간 사용
      const now = new Date();
      const reservationStart = new Date(`${reservation.date}T${reservation.time}`);
      const reservationEnd = new Date(reservationStart.getTime() + (reservation.duration * 60 * 60 * 1000));
      
      if (now >= reservationStart && now <= reservationEnd) {
        return 'ongoing';
      } else if (now > reservationEnd) {
        return 'completed';
      } else {
        return 'upcoming';
      }
    }
  };

  const filteredReservations = useMemo(() => {
    let filtered = reservations;

    // 기존 filter 로직 (all, upcoming, past)
    if (filter !== 'all') {
      filtered = filtered.filter(reservation => {
        if (filter === 'past') {
          return reservation.status === 'completed';
        } else if (filter === 'upcoming') {
          return reservation.status === 'upcoming' || reservation.status === 'ongoing';
        }
        return true;
      });
    }

    return filtered;
  }, [reservations, filter]);

  const getUpcomingCount = () => reservations.filter(r => {
    return r.status === 'upcoming' || r.status === 'ongoing';
  }).length;

  const getPastCount = () => reservations.filter(r => {
    return r.status === 'completed';
  }).length;

  // 서버 날짜 기준 최소 날짜 설정
  const getMinDate = () => {
    if (serverDate) {
      return new Date(serverDate);
    }
    return new Date(); // fallback
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

  if (loading) {
    return (
      <div className={`${getClassName('container')} ${getClassName('loadingContainer')} ${className}`}>
        <div className={styles.spinner}></div>
        <p className={getClassName('loadingText')}>예약 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={`${getClassName('container')} ${className}`}>
      {/* 필터 탭들 */}
      <div className={getClassName('filterTabs')}>
        <button
          className={`${getClassName('filterTab')} ${filter === 'all' ? styles.filterTabActive : ''}`}
          onClick={() => setFilter('all')}
        >
          전체 ({reservations.length})
        </button>
        <button
          className={`${getClassName('filterTab')} ${filter === 'upcoming' ? styles.filterTabActive : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          예정 ({getUpcomingCount()})
        </button>
        <button
          className={`${getClassName('filterTab')} ${filter === 'past' ? styles.filterTabActive : ''}`}
          onClick={() => setFilter('past')}
        >
          완료 ({getPastCount()})
        </button>
      </div>

      {/* 예약 목록 */}
      <div className={getClassName('reservationList')}>
        {filteredReservations.length === 0 ? (
          <div className={getClassName('emptyState')}>
            <div className={getClassName('emptyIcon')}>📅</div>
            <h3 className={getClassName('emptyTitle')}>
              {filter === 'upcoming' ? '예정된 예약이 없습니다' :
               filter === 'past' ? '완료된 예약이 없습니다' :
               '예약이 없습니다'}
            </h3>
            <p className={getClassName('emptyDescription')}>
              {filter === 'all' ? '새로운 예약을 추가해보세요.' :
               filter === 'upcoming' ? '새로운 예약을 추가해보세요.' :
               '아직 완료된 예약이 없습니다.'}
            </p>
          </div>
        ) : (
          filteredReservations.map(reservation => {
            const isEditing = editingId === reservation.id;
            
            return (
              <div 
                key={reservation.id} 
                className={`${getClassName('reservationCard')} ${reservation.status === 'completed' ? styles.reservationCardPast : ''}`}
              >
                <div className={getClassName('reservationHeader')}>
                  <div>
                    <h3 className={getClassName('reservationRoom')}>{reservation.roomId}호</h3>
                    <p className={getClassName('reservationGuest')}>{reservation.guestName}</p>
                  </div>
                  <div>
                    {reservation.status === 'completed' ? (
                      <span className={`${getClassName('statusBadge')} ${styles.statusBadgePast}`}>
                        완료
                      </span>
                    ) : reservation.status === 'ongoing' ? (
                      <span className={`${getClassName('statusBadge')} ${styles.statusBadgeUpcoming}`} style={{backgroundColor: '#10B981', color: 'white'}}>
                        진행중
                      </span>
                    ) : (
                      <span className={`${getClassName('statusBadge')} ${styles.statusBadgeUpcoming}`}>
                        예정
                      </span>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                  // 편집 모드 UI
                  <div className={getClassName('editForm')}>
                    {editError && (
                      <div className={getClassName('editError')}>
                        ⚠️ {editError}
                      </div>
                    )}
                    
                    <div className={getClassName('editRow')}>
                      <label className={getClassName('editLabel')}>📅 날짜:</label>
                      <DatePicker
                        selected={editForm.date ? new Date(editForm.date) : null}
                        onChange={(date) => {
                          if (date) {
                            setEditForm(prev => ({
                              ...prev,
                              date: date.toISOString().split('T')[0]
                            }));
                          }
                        }}
                        dateFormat="yyyy-MM-dd"
                        minDate={getMinDate()}
                        className={getClassName('editInput')}
                      />
                    </div>

                    <div className={getClassName('editRow')}>
                      <label className={getClassName('editLabel')}>🕐 시간:</label>
                      <DatePicker
                        selected={editForm.time ? new Date(`2000-01-01T${editForm.time}:00`) : null}
                        onChange={(date) => {
                          if (date) {
                            const hours = date.getHours().toString().padStart(2, '0');
                            const minutes = date.getMinutes().toString().padStart(2, '0');
                            setEditForm(prev => ({
                              ...prev,
                              time: `${hours}:${minutes}`
                            }));
                          }
                        }}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeFormat="HH:mm"
                        dateFormat="HH:mm"
                        className={getClassName('editInput')}
                      />
                    </div>

                    <div className={getClassName('editRow')}>
                      <label className={getClassName('editLabel')}>⏱️ 사용 시간:</label>
                      <select
                        value={editForm.duration}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          duration: parseInt(e.target.value)
                        }))}
                        className={getClassName('editSelect')}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(hour => (
                          <option key={hour} value={hour}>{hour}시간</option>
                        ))}
                      </select>
                    </div>

                    <div className={getClassName('editActions')}>
                      <button
                        className={getClassName('saveButton')}
                        onClick={() => handleEditSave(reservation)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? '저장 중...' : '저장'}
                      </button>
                      <button
                        className={getClassName('cancelButton')}
                        onClick={handleEditCancel}
                        disabled={isUpdating}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  // 일반 모드 UI
                  <>
                    <div className={getClassName('reservationDetails')}>
                      <div className={getClassName('reservationDateTime')}>
                        <span className={getClassName('reservationDate')}>
                          📅 {formatDate(reservation.date)}
                        </span>
                        <span className={getClassName('reservationTime')}>
                          🕐 {formatTime(reservation.time)} ({formatDuration(reservation.duration)})
                        </span>
                      </div>
                      <p className={getClassName('reservationPurpose')}>{reservation.purpose}</p>
                    </div>

                    <div className={getClassName('reservationActions')}>
                      {reservation.status !== 'completed' && (
                        <button
                          className={getClassName('editButton')}
                          onClick={() => handleEditStart(reservation)}
                        >
                          편집
                        </button>
                      )}
                      <button
                        className={getClassName('deleteButton')}
                        onClick={() => handleDeleteReservation(reservation.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReservationView;