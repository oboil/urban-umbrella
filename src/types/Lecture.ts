export interface Lecture {
  id: number;
  name: string;
  roomId: string;
  week: string; // 'mon tue'
  time: string; // 'hh:mm hh:mm'
  duration: string; // '1.5 1.5'
  building: string;
}