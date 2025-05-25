// src/data/classroomData.ts
import type { ClassroomFake } from '../types/classroom';
import { Seong } from './seongData';
import { Paldal } from './paldalData';
import { Dasan } from './dasanData';
import { getAllReservations } from '../utils/reservationDB';
import { getAllLectures } from '../utils/lectureDB';
import { timeService } from '../utils/timeService';
import type { Reservation } from '../types/building';
import type { Lecture } from '../types/Lecture';

// 모든 건물 데이터
const ALL_BUILDINGS = [Seong, Paldal, Dasan];

// 강의실 상태 계산 함수 (서버 시간 기반)
const calculateRoomStatus = async (
  roomId: string, 
  reservations: Reservation[], 
  lectures: Lecture[]
): Promise<'available' | 'occupied' | 'maintenance'> => {
  const now = await timeService.getCurrentTime();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

  // 현재 시점의 예약 확인 (종료 시간까지 포함)
  const currentReservation = reservations.find(res => {
    if (res.roomId !== roomId || res.date !== today) return false;
    
    const startTime = res.time;
    const endTime = addHours(res.time, res.duration);
    
    return startTime <= currentTime && currentTime < endTime;
  });

  if (currentReservation) {
    return 'occupied';
  }

  // 현재 시점의 강의 확인
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[now.getDay()];

  const currentLecture = lectures.find(lecture => {
    if (lecture.roomId !== roomId) return false;
    
    const lectureDays = lecture.week.split(' ');
    const lectureTimes = lecture.time.split(' ');
    const lectureDurations = lecture.duration.split(' ');

    return lectureDays.some((day, index) => {
      if (day !== dayName) return false;
      
      const startTime = lectureTimes[index];
      const duration = parseFloat(lectureDurations[index]);
      const endTime = addHours(startTime, duration);
      
      return startTime <= currentTime && currentTime < endTime;
    });
  });

  if (currentLecture) {
    return 'occupied';
  }

  return 'available';
};

// 시간에 시간을 더하는 헬퍼 함수
const addHours = (time: string, hours: number): string => {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + (hours * 60);
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
};

// 다음 수업/예약 시간 계산 (서버 시간 기반)
const getNextClass = async (
  roomId: string, 
  reservations: Reservation[], 
  lectures: Lecture[]
): Promise<string> => {
  const now = await timeService.getCurrentTime();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

  // 오늘의 남은 예약들
  const upcomingReservations = reservations
    .filter(res => res.roomId === roomId && res.date === today && res.time > currentTime)
    .sort((a, b) => a.time.localeCompare(b.time));

  // 오늘의 남은 강의들
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[now.getDay()];

  const upcomingLectures: string[] = [];
  lectures.forEach(lecture => {
    if (lecture.roomId !== roomId) return;
    
    const lectureDays = lecture.week.split(' ');
    const lectureTimes = lecture.time.split(' ');

    lectureDays.forEach((day, index) => {
      if (day === dayName && lectureTimes[index] > currentTime) {
        upcomingLectures.push(lectureTimes[index]);
      }
    });
  });

  upcomingLectures.sort();

  // 가장 빠른 다음 일정 반환
  const nextReservation = upcomingReservations[0]?.time;
  const nextLecture = upcomingLectures[0];

  if (!nextReservation && !nextLecture) return 'N/A';
  if (!nextReservation) return nextLecture;
  if (!nextLecture) return nextReservation;
  
  return nextReservation < nextLecture ? nextReservation : nextLecture;
};

// 현재 사용자 수 계산 (임시 로직)
const getCurrentUsers = (status: 'available' | 'occupied' | 'maintenance'): number => {
  if (status === 'occupied') {
    return Math.floor(Math.random() * 25) + 5; // 5-30명 랜덤
  }
  return 0;
};

// 건물명 매핑
const getBuildingName = (buildingId: string): string => {
  switch (buildingId) {
    case '1': return '성호관';
    case '2': return '팔달관';
    case '3': return '다산관';
    default: return '알 수 없음';
  }
};

// seongData, paldalData, dasanData에서 실제 강의실 데이터 생성 (서버 시간 기반)
export const generateClassroomData = async (): Promise<ClassroomFake[]> => {
  try {
    const [reservations, lectures] = await Promise.all([
      getAllReservations(),
      getAllLectures()
    ]);

    const classrooms: ClassroomFake[] = [];

    // 모든 건물의 모든 층을 순회
    for (const building of ALL_BUILDINGS) {
      for (const floor of building.floors) {
        if (floor.rooms) {
          for (const room of floor.rooms) {
            if (room.name.includes('ig') || room.color == 'false') {
              continue;
            }

            const status = await calculateRoomStatus(room.id, reservations, lectures);
            const nextClass = await getNextClass(room.id, reservations, lectures);
            const currentUsers = getCurrentUsers(status);
            
            // 강의실 용량을 room 크기 기반으로 계산 (임시 로직)
            const capacity = Math.max(20, Math.floor(10 * 2));

            classrooms.push({
              id: parseInt(room.id.replace(/[^0-9]/g, '') || '0'), // 숫자만 추출
              name: room.name,
              roomId: room.id,
              status,
              capacity,
              currentUsers,
              nextClass,
              building: getBuildingName(building.id)
            });
          }
        }
      }
    }

    // 호실 이름으로 정렬 (자연 정렬)
    return classrooms.sort((a, b) => {
      // 건물별로 먼저 정렬
      if (a.building !== b.building) {
        return a.building.localeCompare(b.building);
      }
      
      // 같은 건물 내에서 호실 번호로 정렬
      const extractNumbers = (str: string) => {
        const match = str.match(/(\d+)/g);
        return match ? match.map(Number) : [0];
      };
      
      const aNumbers = extractNumbers(a.name);
      const bNumbers = extractNumbers(b.name);
      
      // 첫 번째 숫자로 비교 (층수)
      if (aNumbers[0] !== bNumbers[0]) {
        return aNumbers[0] - bNumbers[0];
      }
      
      // 두 번째 숫자로 비교 (호수)
      if (aNumbers[1] && bNumbers[1] && aNumbers[1] !== bNumbers[1]) {
        return aNumbers[1] - bNumbers[1];
      }
      
      // 숫자가 같으면 전체 문자열로 비교
      return a.name.localeCompare(b.name, 'ko', { numeric: true });
    });
  } catch (error) {
    console.error('강의실 데이터 생성 실패:', error);
    return [];
  }
};

// 특정 건물의 강의실 데이터만 생성 (서버 시간 기반)
export const generateClassroomDataByBuilding = async (buildingId: string): Promise<ClassroomFake[]> => {
  const allData = await generateClassroomData();
  const buildingName = getBuildingName(buildingId);
  return allData.filter(classroom => classroom.building === buildingName);
};

// 캐시된 데이터와 업데이트 함수
let cachedClassroomData: ClassroomFake[] = [];
let lastUpdateTime = 0;
const CACHE_DURATION = 30000; // 30초 캐시

export const getClassroomData = async (): Promise<ClassroomFake[]> => {
  const now = Date.now();
  
  if (cachedClassroomData.length === 0 || now - lastUpdateTime > CACHE_DURATION) {
    cachedClassroomData = await generateClassroomData();
    lastUpdateTime = now;
  }
  
  return cachedClassroomData;
};

// 데이터 강제 새로고침 (서버 시간 재동기화)
export const refreshClassroomData = async (): Promise<ClassroomFake[]> => {
  // timeService 캐시도 함께 갱신하기 위해 getCurrentTime 호출
  await timeService.getCurrentTime();
  
  cachedClassroomData = await generateClassroomData();
  lastUpdateTime = Date.now();
  return cachedClassroomData;
};

export const getStatusColor = (status: ClassroomFake['status']): string => {
  switch(status) {
    case 'available': return '#10B981';
    case 'occupied': return '#EF4444';
    case 'maintenance': return '#F59E0B';
    default: return '#6B7280';
  }
};

export const getStatusText = (status: ClassroomFake['status']): string => {
  switch(status) {
    case 'available': return '사용가능';
    case 'occupied': return '사용중';
    case 'maintenance': return '점검중';
    default: return '알 수 없음';
  }
};