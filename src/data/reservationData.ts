import type { Reservation, ReservationRequest, TimeSlotConflict } from '../types/reservation';

// 예시 예약 데이터
export const reservationData: Reservation[] = [
  {
    id: 'res_001',
    classroomId: 1,
    date: '2024-12-20',
    startTime: '09:00',
    endTime: '10:30',
    title: '웹 프로그래밍 수업',
    userId: 'user_001',
    userName: '김교수',
    createdAt: '2024-12-19T10:00:00Z'
  },
  {
    id: 'res_002',
    classroomId: 1,
    date: '2024-12-20',
    startTime: '14:00',
    endTime: '15:30',
    title: '데이터베이스 특강',
    userId: 'user_002',
    userName: '이교수',
    createdAt: '2024-12-19T11:00:00Z'
  },
  {
    id: 'res_003',
    classroomId: 2,
    date: '2024-12-20',
    startTime: '10:00',
    endTime: '12:00',
    title: '알고리즘 수업',
    userId: 'user_003',
    userName: '박교수',
    createdAt: '2024-12-19T12:00:00Z'
  }
];

// 상태 변경 알림을 위한 콜백 배열
let onDataChangeCallbacks: (() => void)[] = [];

// 데이터 변경 감지를 위한 구독 함수
export const subscribeToReservationChanges = (callback: () => void) => {
  onDataChangeCallbacks.push(callback);
  return () => {
    onDataChangeCallbacks = onDataChangeCallbacks.filter(cb => cb !== callback);
  };
};

// 데이터 변경 알림 함수
const notifyDataChange = () => {
  onDataChangeCallbacks.forEach(callback => callback());
};

// 시간 문자열을 분 단위로 변환하는 함수
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// 향상된 시간 겹침 확인 함수 (경계값 포함)
const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  // 시작시간과 종료시간이 정확히 맞는 경우도 중복으로 처리
  return !(end1Min <= start2Min || end2Min <= start1Min);
};

// 향상된 예약 중복 확인 함수
export const checkTimeSlotConflict = (request: ReservationRequest): TimeSlotConflict => {
  // 입력 데이터 검증
  if (!request.classroomId || !request.date || !request.startTime || !request.endTime) {
    return {
      hasConflict: true,
      conflictingReservations: [],
      message: '필수 정보가 누락되었습니다.'
    };
  }

  // 시작 시간이 종료 시간보다 늦은 경우
  if (timeToMinutes(request.startTime) >= timeToMinutes(request.endTime)) {
    return {
      hasConflict: true,
      conflictingReservations: [],
      message: '시작 시간은 종료 시간보다 빨라야 합니다.'
    };
  }

  const conflictingReservations = reservationData.filter(reservation => 
    reservation.classroomId === request.classroomId &&
    reservation.date === request.date &&
    isTimeOverlap(request.startTime, request.endTime, reservation.startTime, reservation.endTime)
  );

  const hasConflict = conflictingReservations.length > 0;
  let message = '';

  if (hasConflict) {
    const conflictDetails = conflictingReservations.map(res => 
      `${res.startTime}-${res.endTime} (${res.title}, 예약자: ${res.userName})`
    ).join(', ');
    message = `⚠️ 선택한 시간대에 이미 예약이 있습니다:\n${conflictDetails}\n\n다른 시간대를 선택해주세요.`;
  }

  return {
    hasConflict,
    conflictingReservations,
    message
  };
};

// 실시간 중복 검사 함수 (입력 중에 사용)
export const checkRealTimeConflict = (classroomId: number, date: string, startTime: string, endTime: string): string[] => {
  if (!classroomId || !date || !startTime || !endTime) {
    return [];
  }

  // 시간 형식 검증
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return ['올바른 시간 형식을 입력해주세요. (HH:MM)'];
  }

  const warnings: string[] = [];

  // 시작 시간과 종료 시간 비교
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    warnings.push('시작 시간은 종료 시간보다 빨라야 합니다.');
  }

  // 기존 예약과의 중복 확인
  const conflicts = reservationData.filter(reservation => 
    reservation.classroomId === classroomId &&
    reservation.date === date &&
    isTimeOverlap(startTime, endTime, reservation.startTime, reservation.endTime)
  );

  if (conflicts.length > 0) {
    conflicts.forEach(conflict => {
      warnings.push(`${conflict.startTime}-${conflict.endTime} 시간대에 "${conflict.title}" 예약이 있습니다.`);
    });
  }

  return warnings;
};

// 새 예약 추가 함수 (트랜잭션 방식)
export const addReservation = (request: ReservationRequest): { success: boolean; message: string; reservation?: Reservation } => {
  try {
    // 최종 시간 중복 확인
    const conflict = checkTimeSlotConflict(request);
    
    if (conflict.hasConflict) {
      return {
        success: false,
        message: conflict.message || '시간 충돌이 발생했습니다.'
      };
    }

    // 새 예약 생성
    const newReservation: Reservation = {
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...request,
      userId: `user_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    // 데이터에 추가
    reservationData.push(newReservation);
    
    // 상태 변경 알림
    notifyDataChange();

    return {
      success: true,
      message: '✅ 예약이 성공적으로 완료되었습니다!',
      reservation: newReservation
    };
  } catch (error) {
    console.error('예약 추가 중 오류:', error);
    return {
      success: false,
      message: '예약 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }
};

// 예약 삭제 함수
export const deleteReservation = (reservationId: string): { success: boolean; message: string } => {
  try {
    const index = reservationData.findIndex(res => res.id === reservationId);
    
    if (index === -1) {
      return {
        success: false,
        message: '해당 예약을 찾을 수 없습니다.'
      };
    }

    reservationData.splice(index, 1);
    notifyDataChange();

    return {
      success: true,
      message: '예약이 성공적으로 취소되었습니다.'
    };
  } catch (error) {
    console.error('예약 삭제 중 오류:', error);
    return {
      success: false,
      message: '예약 취소 중 오류가 발생했습니다.'
    };
  }
};

// 특정 강의실의 특정 날짜 예약 목록 조회
export const getReservationsByClassroomAndDate = (classroomId: number, date: string): Reservation[] => {
  return reservationData.filter(reservation => 
    reservation.classroomId === classroomId && reservation.date === date
  ).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
};

// 모든 예약 목록 조회
export const getAllReservations = (): Reservation[] => {
  return [...reservationData].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
};

// 특정 날짜 범위의 예약 조회
export const getReservationsByDateRange = (startDate: string, endDate: string): Reservation[] => {
  return reservationData.filter(reservation => 
    reservation.date >= startDate && reservation.date <= endDate
  ).sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}; 