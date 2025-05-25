export interface TimeSlot {
    hour: number;
    minute: number;
    display: string; // "09:00" 형식
  }
  
  export interface ScheduleItem {
    id: string;
    roomId: string;
    title: string;
    startTime: string; // "09:00"
    endTime: string;   // "10:30"
    type: 'lecture' | 'reservation' | 'maintenance';
    instructor?: string;
    reservedBy?: string;
    status: 'ongoing' | 'upcoming' | 'completed';
  }
  
  export interface DaySchedule {
    date: string; // "2024-12-20"
    roomId: string;
    items: ScheduleItem[];
  }