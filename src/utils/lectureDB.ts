import type { Lecture } from '../types/Lecture';

const LECTURE_DB_NAME = 'LectureDB';
const LECTURE_STORE_NAME = 'Lectures';
const LECTURE_DB_VERSION = 2;

class LectureDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(LECTURE_DB_NAME, LECTURE_DB_VERSION);

      request.onerror = () => reject(new Error('Failed to open Lecture database'));

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db.objectStoreNames.contains(LECTURE_STORE_NAME)) {
          db.deleteObjectStore(LECTURE_STORE_NAME);
        }
        const store = db.createObjectStore(LECTURE_STORE_NAME, { keyPath: 'id' });
        store.createIndex('building', 'building', { unique: false });
        store.createIndex('roomId', 'roomId', { unique: false }); // ✅ 이 줄을 추가하세요
      };
    });
  }

  async addLecture(Lecture: Lecture): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(LECTURE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(LECTURE_STORE_NAME);
      const req = store.add(Lecture);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('Failed to add Lecture'));
    });
  }

  async getAllLectures(): Promise<Lecture[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(LECTURE_STORE_NAME, 'readonly');
      const store = tx.objectStore(LECTURE_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(new Error('Failed to fetch Lectures'));
    });
  }

  async getLecturesByRoom(roomId: string): Promise<Lecture[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([LECTURE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(LECTURE_STORE_NAME);
      const index = store.index('roomId');
      const request = index.getAll(roomId);

      request.onsuccess = () => {
        const Lectures = request.result || [];
        resolve(Lectures);
      };
      request.onerror = () => reject(new Error('Failed to get reservations'));
    });
  }

  async updateLecture(Lecture: Lecture): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(LECTURE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(LECTURE_STORE_NAME);
      const req = store.put(Lecture);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('Failed to update Lecture'));
    });
  }

  async deleteLecture(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(LECTURE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(LECTURE_STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('Failed to delete Lecture'));
    });
  }

  async clearAllLectures(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(LECTURE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(LECTURE_STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error('Failed to clear Lectures'));
    });
  }

  async loadSampleData(): Promise<void> {
    // 더미데이터
    const sampleLectures: Lecture[] = [
    
      { id: 1, name: '선형대수2', roomId: '101-1', week: 'Mon Sun', time: '10:30 02:00', duration: '1.5 1.5', building: '성호관' },
      { id: 2, name: '시스템프로그래밍', roomId: '236', week: 'Mon Tue', time: '10:30 10:30', duration: '1.5 1.5', building: '성호관' },
      { id: 3, name: '해석개론2', roomId: '105', week: 'Mon Tue', time: '10:30 10:30', duration: '1.5 1.5', building: '성호관' },
      { id: 4, name: '논리회로', roomId: '105', week: 'Mon Tue', time: '10:30 10:30', duration: '1.5 1.5', building: '성호관' },
      { id: 5, name: '현대대수2', roomId: '236', week: 'Mon Tue', time: '10:30 10:30', duration: '1.5 1.5', building: '성호관' },
      { id: 6, name: '정수론', roomId: '202', week: 'Mon Tue', time: '10:30 10:30', duration: '1.5 1.5', building: '성호관' },
      { id: 7, name: '운영체제', roomId: '334', week: 'Mon Sun', time: '10:30 02:00', duration: '1.5 1.5', building: '성호관' },
      { id: 8, name: '전자공학 운영체제', roomId: '306', week: 'Mon Sun', time: '10:30 02:00', duration: '1.5 1.5', building: '성호관' },
      { id: 9, name: '오픈소스SW입문', roomId: '442', week: 'Mon Sun', time: '10:30 02:00', duration: '1.5 1.5', building: '성호관' },
    ];

    // 기존 데이터를 모두 삭제하고 새로운 샘플 데이터 로드
    await this.clearAllLectures();
    for (const Lecture of sampleLectures) {
      await this.addLecture(Lecture);
    }
  }
}

export const LectureDB = new LectureDatabase();
export const initializeLectureDB = async () => {
  await LectureDB.init();
  await LectureDB.loadSampleData();
};
export const addLecture = (Lecture: Lecture) => LectureDB.addLecture(Lecture);
export const getAllLectures = () => LectureDB.getAllLectures();
export const getLecturesByRoom = (roomId: string) => LectureDB.getLecturesByRoom(roomId);
export const updateLecture = (Lecture: Lecture) => LectureDB.updateLecture(Lecture);
export const deleteLecture = (id: number) => LectureDB.deleteLecture(id);
