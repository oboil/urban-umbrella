import type { Building, Room } from "../types/building";

const ROOM_DEPTH = 4;
const FLOOR_WIDTH = 32;

export const Paldal: Building = {
  id: '2',
  name: '팔달관',
  floors: [
    // ───────────── 1층 ─────────────
    {
      id: 1,
      name: '1층',
      height: 4,
      width: 32,
      depth: 12,
      color: '#e74c3c',
      rooms: [
        { id: 'P101', name: 'P101호', width: 8, depth: ROOM_DEPTH, color: '#e74c3c', xOffset: -12, zOffset: 6 },
        { id: 'P102', name: 'P102호', width: 8, depth: ROOM_DEPTH, color: '#e74c3c', xOffset: -4, zOffset: 6 },
        { id: 'P103', name: 'P103호', width: 8, depth: ROOM_DEPTH, color: '#e74c3c', xOffset: 4, zOffset: 6 },
        { id: 'P104', name: 'P104호', width: 8, depth: ROOM_DEPTH, color: '#e74c3c', xOffset: 12, zOffset: 6 },
        
        { id: 'P105', name: 'P105호', width: 10, depth: ROOM_DEPTH, color: '#e74c3c', xOffset: -11, zOffset: -6 },
        { id: 'P106', name: 'P106호', width: 10, depth: ROOM_DEPTH, color: '#e74c3c', xOffset: 0, zOffset: -6 },
        { id: 'P107', name: 'P107호', width: 10, depth: ROOM_DEPTH, color: '#e74c3c', xOffset: 11, zOffset: -6 },
        
        { id: '팔달라운지', name: '팔달라운지', width: 6, depth: ROOM_DEPTH, color: '#e74c3c', xOffset: -20, zOffset: 0 },
      ]
    },
    // ───────────── 2층 ─────────────
    {
      id: 2,
      name: '2층',
      height: 4,
      width: FLOOR_WIDTH,
      depth: 12,
      color: '#e67e22',
      rooms: [
        { id: 'P201', name: 'P201호', width: 9, depth: ROOM_DEPTH, color: '#e67e22', xOffset: -15, zOffset: 6 },
        { id: 'P202', name: 'P202호', width: 9, depth: ROOM_DEPTH, color: '#e67e22', xOffset: -5, zOffset: 6 },
        { id: 'P203', name: 'P203호', width: 9, depth: ROOM_DEPTH, color: '#e67e22', xOffset: 5, zOffset: 6 },
        { id: 'P204', name: 'P204호', width: 9, depth: ROOM_DEPTH, color: '#e67e22', xOffset: 15, zOffset: 6 },
        
        { id: 'P205', name: 'P205호', width: 12, depth: ROOM_DEPTH, color: '#e67e22', xOffset: -12, zOffset: -6 },
        { id: 'P206', name: 'P206호', width: 12, depth: ROOM_DEPTH, color: '#e67e22', xOffset: 4, zOffset: -6 },
        { id: 'P207', name: 'P207호', width: 8, depth: ROOM_DEPTH, color: '#e67e22', xOffset: 20, zOffset: -6 },
      ]
    },
    // ───────────── 3층 ─────────────
    {
      id: 3,
      name: '3층',
      height: 4,
      width: FLOOR_WIDTH,
      depth: 12,
      color: '#f39c12',
      rooms: [
        { id: 'P301', name: 'P301호', width: 15, depth: ROOM_DEPTH, color: '#f39c12', xOffset: -12.5, zOffset: 6 },
        { id: 'P302', name: 'P302호', width: 15, depth: ROOM_DEPTH, color: '#f39c12', xOffset: 12.5, zOffset: 6 },
        
        { id: 'P303', name: 'P303호', width: 8, depth: ROOM_DEPTH, color: '#f39c12', xOffset: -16, zOffset: -6 },
        { id: 'P304', name: 'P304호', width: 8, depth: ROOM_DEPTH, color: '#f39c12', xOffset: -6, zOffset: -6 },
        { id: 'P305', name: 'P305호', width: 8, depth: ROOM_DEPTH, color: '#f39c12', xOffset: 4, zOffset: -6 },
        { id: 'P306', name: 'P306호', width: 8, depth: ROOM_DEPTH, color: '#f39c12', xOffset: 14, zOffset: -6 },
      ]
    },
    // ───────────── 4층 ─────────────
    {
      id: 4,
      name: '4층',
      height: 4,
      width: FLOOR_WIDTH,
      depth: 12,
      color: '#d35400',
      rooms: [
        { id: 'P401', name: 'P401호', width: 20, depth: ROOM_DEPTH, color: '#d35400', xOffset: -10, zOffset: 6 },
        { id: 'P402', name: 'P402호', width: 20, depth: ROOM_DEPTH, color: '#d35400', xOffset: 10, zOffset: 6 },
        
        { id: 'P대강의실', name: 'P대강의실', width: 25, depth: ROOM_DEPTH, color: '#d35400', xOffset: 0, zOffset: -6 },
      ]
    }
  ],
  totalHeight: 16,
  position: { x: 0, y: 0, z: 0 }
};