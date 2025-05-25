// src/data/scheduleData.ts
import type { DaySchedule, ScheduleItem, TimeSlot } from '../types/schedule';
import { getAllReservations } from '../utils/reservationDB';
import { getAllLectures } from '../utils/lectureDB';
import type { Reservation } from '../types/building';
import type { Lecture } from '../types/Lecture';
import { timeService } from '../utils/timeService';

// 시간 슬롯 생성 (09:00 ~ 21:00, 30분 단위)
export const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 9; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 21 && minute > 0) break; // 21:00까지만
      const display = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push({ hour, minute, display });
    }
  }
  return slots;
};

// Reservation을 ScheduleItem으로 변환
const reservationToScheduleItem = (reservation: Reservation): ScheduleItem => {
  const endTime = minutesToTime(timeToMinutes(reservation.time) + (reservation.duration * 60));
  
  return {
    id: reservation.id,
    roomId: reservation.roomId,
    title: reservation.purpose,
    startTime: reservation.time,
    endTime: endTime,
    type: 'reservation',
    reservedBy: reservation.guestName,
    status: getReservationStatus(reservation.date, reservation.time, endTime)
  };
};

// Lecture를 ScheduleItem으로 변환
const lectureToScheduleItem = (lecture: Lecture, date: string): ScheduleItem[] => {
  const items: ScheduleItem[] = [];
  const days = lecture.week.split(' ');
  const times = lecture.time.split(' ');
  const durations = lecture.duration.split(' ');
  
  const dayName = getDayName(date);
  
  days.forEach((day, index) => {
    if (day.toLowerCase() === dayName.toLowerCase()) {
      const startTime = times[index];
      const duration = parseFloat(durations[index]);
      const endTime = minutesToTime(timeToMinutes(startTime) + (duration * 60));
      
      items.push({
        id: `lecture_${lecture.id}_${date}_${index}`,
        roomId: lecture.roomId,
        title: lecture.name,
        startTime: startTime,
        endTime: endTime,
        type: 'lecture',
        instructor: '교수',
        status: getReservationStatus(date, startTime, endTime)
      });
    }
  });
  
  return items;
};

// 날짜에서 요일 이름 추출
const getDayName = (date: string): string => {
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayIndex = new Date(date).getDay();
  return dayNames[dayIndex];
};

// 예약/수업 상태 확인 (동기 함수로 변경)
const getReservationStatus = (date: string, startTime: string, endTime: string): 'ongoing' | 'upcoming' | 'completed' => {
    // 로컬 시간 기준으로 간단히 처리 (실시간 반영을 위해)
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
  
    if (date < today) {
      return 'completed';
    } else if (date === today) {
      if (currentTime >= startTime && currentTime < endTime) {
        return 'ongoing';
      } else if (currentTime >= endTime) {
        return 'completed';
      } else {
        return 'upcoming';
      }
    } else {
      return 'upcoming';
    }
  };

// 특정 강의실, 날짜의 스케줄 가져오기
export const getScheduleByRoomAndDate = async (roomId: string, date: string): Promise<DaySchedule | null> => {
  try {
    const [reservations, lectures] = await Promise.all([
      getAllReservations(),
      getAllLectures()
    ]);

    // 해당 강의실, 날짜의 예약 필터링
    const roomReservations = reservations.filter(res => 
      res.roomId === roomId && res.date === date
    );

    // 해당 강의실의 수업 필터링
    const roomLectures = lectures.filter(lecture => 
      lecture.roomId === roomId
    );

    const scheduleItems: ScheduleItem[] = [];

    // 예약을 ScheduleItem으로 변환
    roomReservations.forEach(reservation => {
      scheduleItems.push(reservationToScheduleItem(reservation));
    });

    // 수업을 ScheduleItem으로 변환
    roomLectures.forEach(lecture => {
      const items = lectureToScheduleItem(lecture, date);
      scheduleItems.push(...items);
    });

    // 시간순 정렬
    scheduleItems.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    return {
      date,
      roomId,
      items: scheduleItems
    };
  } catch (error) {
    console.error('스케줄 로드 오류:', error);
    return null;
  }
};

// 시간 슬롯이 사용 가능한지 확인
export const isTimeSlotAvailable = async (roomId: string, date: string, startTime: string, endTime: string): Promise<boolean> => {
  const schedule = await getScheduleByRoomAndDate(roomId, date);
  if (!schedule) return true;

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  return !schedule.items.some(item => {
    const itemStart = timeToMinutes(item.startTime);
    const itemEnd = timeToMinutes(item.endTime);
    
    // 시간 겹침 체크
    return !(endMinutes <= itemStart || startMinutes >= itemEnd);
  });
};

// 시간을 분으로 변환
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// 분을 시간으로 변환
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};