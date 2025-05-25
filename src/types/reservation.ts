export interface Reservation {
  id: string;
  classroomId: number;
  date: string; // YYYY-MM-DD 형식
  startTime: string; // HH:MM 형식
  endTime: string; // HH:MM 형식
  title: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface ReservationRequest {
  classroomId: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  userName: string;
}

export interface TimeSlotConflict {
  hasConflict: boolean;
  conflictingReservations: Reservation[];
  message?: string;
} 