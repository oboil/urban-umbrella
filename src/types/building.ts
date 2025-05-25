export type RoomShape = 'box' | 'sector';

export interface Reservation {
  id: string;
  roomId: string;
  date: string;
  time: string;
  duration: number;
  guestName: string;
  purpose: string;
  createdAt: string;
}

// 공통 필드
interface BaseRoom {
  id: string;
  name: string;
  color?: string;
  xOffset: number;
  zOffset: number;
  shape?: RoomShape;
  reservations?: Reservation[];
}

// 사각형 방
interface BoxRoom extends BaseRoom {
  shape?: 'box';
  width: number;
  depth: number;
  rotation?: [number, number, number];
}

// 부채꼴 방
interface SectorRoom extends BaseRoom {
  shape: 'sector';
  radius: number;
  angleDeg: number;
  triLeft: number;
  triRight: number;
  scale?: [number, number, number];
  rotation?: [number, number, number];
}

// Room 전체 타입
export type Room = BoxRoom | SectorRoom;

export interface Floor {
  id: number;
  name: string;
  height: number;
  width: number;
  depth: number;
  color: string;
  rooms?: Room[];
}

export interface Building {
  id: string;
  name: string;
  floors: Floor[];
  totalHeight: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface BuildingViewerProps {
  building: Building;
  onFloorSelect?: (floorId: number) => void;
}