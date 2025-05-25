import type { Reservation } from '../types/building';

const DB_NAME = 'RoomReservationDB';
const DB_VERSION = 1;
const STORE_NAME = 'reservations';

type ReservationDB = IDBDatabase;

class ReservationDatabase {
  private db: ReservationDB | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 기존 store가 있다면 삭제
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }

        // 새 object store 생성
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // 인덱스 생성
        store.createIndex('roomId', 'roomId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('guestName', 'guestName', { unique: false });
      };
    });
  }

  async addReservation(reservation: Reservation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(reservation);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to add reservation'));
    });
  }

  async getReservationsByRoom(roomId: string): Promise<Reservation[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('roomId');
      const request = index.getAll(roomId);

      request.onsuccess = () => {
        const reservations = request.result || [];
        // 날짜와 시간 순으로 정렬
        reservations.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });
        resolve(reservations);
      };
      request.onerror = () => reject(new Error('Failed to get reservations'));
    });
  }

  async getAllReservations(): Promise<Reservation[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get all reservations'));
    });
  }

  async deleteReservation(reservationId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(reservationId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete reservation'));
    });
  }

  async updateReservation(reservation: Reservation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(reservation);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to update reservation'));
    });
  }

  async clearAllReservations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear reservations'));
    });
  }

  // 예약 시간 중복 체크 함수
  async checkTimeConflict(roomId: string, date: string, time: string, duration: number = 1): Promise<{
    hasConflict: boolean;
    conflictingReservations: Reservation[];
  }> {
    const existingReservations = await this.getReservationsByRoom(roomId);
    
    // 같은 날짜의 예약만 필터링
    const sameDateReservations = existingReservations.filter(res => res.date === date);
    
    // 새 예약의 시간 범위 계산
    const newStartTime = new Date(`${date}T${time}`);
    const newEndTime = new Date(newStartTime.getTime() + (duration * 60 * 60 * 1000)); // duration 시간 후
    
    const conflictingReservations: Reservation[] = [];
    
    for (const reservation of sameDateReservations) {
      // 기존 예약의 시간 범위 계산 (버퍼 없이 정확한 시간만)
      const existingStartTime = new Date(`${reservation.date}T${reservation.time}`);
      const existingEndTime = new Date(existingStartTime.getTime() + (reservation.duration * 60 * 60 * 1000)); // 기존 예약 시간만
      
      // 시간 중복 체크
      // 새 예약이 기존 예약과 겹치는 경우:
      // 1. 새 예약 시작 시간이 기존 예약 범위 안에 있거나
      // 2. 새 예약 종료 시간이 기존 예약 범위 안에 있거나  
      // 3. 새 예약이 기존 예약을 완전히 포함하는 경우
      const hasOverlap = (
        (newStartTime >= existingStartTime && newStartTime < existingEndTime) ||
        (newEndTime > existingStartTime && newEndTime <= existingEndTime) ||
        (newStartTime <= existingStartTime && newEndTime >= existingEndTime)
      );
      
      if (hasOverlap) {
        conflictingReservations.push(reservation);
      }
    }
    
    return {
      hasConflict: conflictingReservations.length > 0,
      conflictingReservations
    };
  }

  // 초기 샘플 데이터 로드
  async loadSampleData(): Promise<void> {
    const sampleReservations: Reservation[] = [
      {
        id: 'res1',
        roomId: '101-2',
        date: '2024-12-20',
        time: '09:00',
        duration: 2,
        guestName: '김철수',
        purpose: '팀 회의',
        createdAt: new Date().toISOString()
      },
      {
        id: 'res2',
        roomId: '101-2',
        date: '2024-12-20',
        time: '14:00',
        duration: 1,
        guestName: '이영희',
        purpose: '프레젠테이션 준비',
        createdAt: new Date().toISOString()
      },
      {
        id: 'res3',
        roomId: '101-3',
        date: '2024-12-21',
        time: '10:00',
        duration: 3,
        guestName: '박민수',
        purpose: '고객 미팅',
        createdAt: new Date().toISOString()
      },
      {
        id: 'res4',
        roomId: '라운지',
        date: '2024-12-20',
        time: '16:00',
        duration: 2,
        guestName: '최지훈',
        purpose: '네트워킹 이벤트',
        createdAt: new Date().toISOString()
      }
    ];

    // 기존 데이터 확인
    const existingReservations = await this.getAllReservations();
    
    // 데이터가 없을 때만 샘플 데이터 추가
    if (existingReservations.length === 0) {
      for (const reservation of sampleReservations) {
        await this.addReservation(reservation);
      }
    }
  }
}

// 싱글톤 인스턴스 생성
export const reservationDB = new ReservationDatabase();

// DB 초기화 함수
export const initializeReservationDB = async (): Promise<void> => {
  await reservationDB.init();
  await reservationDB.loadSampleData();
};

// 유틸리티 함수들
export const addReservation = (reservation: Reservation) => reservationDB.addReservation(reservation);
export const getReservationsByRoom = (roomId: string) => reservationDB.getReservationsByRoom(roomId);
export const deleteReservation = (reservationId: string) => reservationDB.deleteReservation(reservationId);
export const updateReservation = (reservation: Reservation) => reservationDB.updateReservation(reservation);
export const getAllReservations = () => reservationDB.getAllReservations();
export const checkTimeConflict = (roomId: string, date: string, time: string, duration?: number) => 
  reservationDB.checkTimeConflict(roomId, date, time, duration); 