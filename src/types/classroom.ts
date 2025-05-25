export interface ClassroomFake {
  id: number;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  capacity: number;
  currentUsers: number;
  nextClass: string;
  building: string;
  roomId: string;
}

export interface ClassroomStats {
  available: number;
  occupied: number;
  maintenance: number;
  totalCapacity: number;
  currentUsers: number;
}