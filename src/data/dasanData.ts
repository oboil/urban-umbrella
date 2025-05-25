import type { Building, Room } from "../types/building";

const ROOM_DEPTH = 4;
const FLOOR_WIDTH = 35;

export const Dasan: Building = {
  id: '3',
  name: '다산관',
  floors: [
    // ───────────── 1층 ─────────────
    {
      id: 1,
      name: '지하1층',
      height: 4,
      width: 35,
      depth: 14,
      color: '#8e44ad',
      rooms: [
        { id: 'D001', name: 'D001호', width: 12, depth: ROOM_DEPTH, color: '#8e44ad', xOffset: -12, zOffset: 7 },
        { id: 'D002', name: 'D002호', width: 12, depth: ROOM_DEPTH, color: '#8e44ad', xOffset: 0, zOffset: 7 },
        { id: 'D003', name: 'D003호', width: 12, depth: ROOM_DEPTH, color: '#8e44ad', xOffset: 12, zOffset: 7 },
        
        { id: 'D실습실1', name: 'D실습실1', width: 18, depth: ROOM_DEPTH, color: '#8e44ad', xOffset: -9, zOffset: -7 },
        { id: 'D실습실2', name: 'D실습실2', width: 18, depth: ROOM_DEPTH, color: '#8e44ad', xOffset: 9, zOffset: -7 },
      ]
    },
    // ───────────── 2층 ─────────────
    {
      id: 2,
      name: '1층',
      height: 4,
      width: FLOOR_WIDTH,
      depth: 14,
      color: '#9b59b6',
      rooms: [
        { id: 'D101', name: 'D101호', width: 10, depth: ROOM_DEPTH, color: '#9b59b6', xOffset: -15, zOffset: 7 },
        { id: 'D102', name: 'D102호', width: 10, depth: ROOM_DEPTH, color: '#9b59b6', xOffset: -3, zOffset: 7 },
        { id: 'D103', name: 'D103호', width: 10, depth: ROOM_DEPTH, color: '#9b59b6', xOffset: 9, zOffset: 7 },
        { id: 'D104', name: 'D104호', width: 10, depth: ROOM_DEPTH, color: '#9b59b6', xOffset: 21, zOffset: 7 },
        
        { id: 'D멀티미디어실', name: 'D멀티미디어실', width: 15, depth: ROOM_DEPTH, color: '#9b59b6', xOffset: -12.5, zOffset: -7 },
        { id: 'D세미나실', name: 'D세미나실', width: 15, depth: ROOM_DEPTH, color: '#9b59b6', xOffset: 7.5, zOffset: -7 },
        { id: 'D라운지', name: 'D라운지', width: 8, depth: ROOM_DEPTH, color: '#9b59b6', xOffset: 24, zOffset: -7 },
      ]
    },
    // ───────────── 3층 ─────────────
    {
      id: 3,
      name: '2층',
      height: 4,
      width: FLOOR_WIDTH,
      depth: 14,
      color: '#c0392b',
      rooms: [
        { id: 'D201', name: 'D201호', width: 8, depth: ROOM_DEPTH, color: '#c0392b', xOffset: -18, zOffset: 7 },
        { id: 'D202', name: 'D202호', width: 8, depth: ROOM_DEPTH, color: '#c0392b', xOffset: -8, zOffset: 7 },
        { id: 'D203', name: 'D203호', width: 8, depth: ROOM_DEPTH, color: '#c0392b', xOffset: 2, zOffset: 7 },
        { id: 'D204', name: 'D204호', width: 8, depth: ROOM_DEPTH, color: '#c0392b', xOffset: 12, zOffset: 7 },
        { id: 'D205', name: 'D205호', width: 8, depth: ROOM_DEPTH, color: '#c0392b', xOffset: 22, zOffset: 7 },
        
        { id: 'D206', name: 'D206호', width: 12, depth: ROOM_DEPTH, color: '#c0392b', xOffset: -14, zOffset: -7 },
        { id: 'D207', name: 'D207호', width: 12, depth: ROOM_DEPTH, color: '#c0392b', xOffset: 0, zOffset: -7 },
        { id: 'D208', name: 'D208호', width: 12, depth: ROOM_DEPTH, color: '#c0392b', xOffset: 14, zOffset: -7 },
      ]
    },
    // ───────────── 4층 ─────────────
    {
      id: 4,
      name: '3층',
      height: 4,
      width: FLOOR_WIDTH,
      depth: 14,
      color: '#27ae60',
      rooms: [
        { id: 'D301', name: 'D301호', width: 15, depth: ROOM_DEPTH, color: '#27ae60', xOffset: -15, zOffset: 7 },
        { id: 'D302', name: 'D302호', width: 15, depth: ROOM_DEPTH, color: '#27ae60', xOffset: 5, zOffset: 7 },
        { id: 'D회의실', name: 'D회의실', width: 10, depth: ROOM_DEPTH, color: '#27ae60', xOffset: 23, zOffset: 7 },
        
        { id: 'D대회의실', name: 'D대회의실', width: 30, depth: ROOM_DEPTH, color: '#27ae60', xOffset: 0, zOffset: -7 },
      ]
    },
    // ───────────── 5층 ─────────────
    {
      id: 5,
      name: '4층',
      height: 4,
      width: FLOOR_WIDTH,
      depth: 14,
      color: '#2980b9',
      rooms: [
        { id: 'D401', name: 'D401호', width: 20, depth: ROOM_DEPTH, color: '#2980b9', xOffset: -12.5, zOffset: 7 },
        { id: 'D402', name: 'D402호', width: 15, depth: ROOM_DEPTH, color: '#2980b9', xOffset: 12.5, zOffset: 7 },
        
        { id: 'D총장실', name: 'D총장실', width: 10, depth: ROOM_DEPTH, color: '#2980b9', xOffset: -15, zOffset: -7 },
        { id: 'D부총장실', name: 'D부총장실', width: 10, depth: ROOM_DEPTH, color: '#2980b9', xOffset: -3, zOffset: -7 },
        { id: 'D교수회의실', name: 'D교수회의실', width: 15, depth: ROOM_DEPTH, color: '#2980b9', xOffset: 12, zOffset: -7 },
      ]
    }
  ],
  totalHeight: 20,
  position: { x: 0, y: 0, z: 0 }
};