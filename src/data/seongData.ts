import type { Building } from "../types/building";

const ROOM_DEPTH = 6;           // 모든 방의 앞뒤(복도-외곽) 방향 깊이
const FLOOR_WIDTH = 28;         // 전체 복도 기준 가로 길이
const GAP = 5;

export const Seong: Building = {
  id: '1',
  name: '성호관',
  floors: [
    // ───────────── 1층 ─────────────
    {
      id: 1,
      name: '1층',
      height: 4,
      width: 28,
      depth: 10,
      color: '#4a90e2',
      rooms: [
        // 뒤쪽(이미지 상[단) 방들 (zOffset: +3)
        { id: 'CU 및 라운지', name: 'CU 및 라운지', width: 13.17, depth: ROOM_DEPTH, color: 'false', xOffset: -22.94, zOffset: GAP },
        { id: '103-1호', name: '103-1호', width: 4.34, depth: ROOM_DEPTH, color: 'false', xOffset: -3.0, zOffset: GAP },
        { id: '103호', name: '103호', width: 6.63, depth: ROOM_DEPTH, color: 'false', xOffset: 2.885, zOffset: GAP },
        { id: '104호', name: '104호', width: 6.63, depth: ROOM_DEPTH, color: 'false', xOffset: 10.215, zOffset: GAP },
        { id: '105호', name: '105호', width: 3.7, depth: ROOM_DEPTH, color: '#4a90e2', xOffset: 27.41, zOffset: GAP },

        // 앞쪽(이미지 하단) 방들 (zOffset: -3)
        { id: '안경점 및 글쓰기 튜터실', name: '안경점 및 글쓰기 튜터실', width: 13.17, depth: ROOM_DEPTH, color: 'false', xOffset: -22.94, zOffset: -GAP },
        { id: '1층 화장실(남) 및 계단', name: '1층 화장실(남) 및 계단', width: 9.52, depth: ROOM_DEPTH, color: 'false', xOffset: -11.12, zOffset: -GAP },
        { id: '131호', name: '131호', width: 8.4, depth: ROOM_DEPTH, color: '#4a90e2', xOffset: -1.0, zOffset: -GAP },
        { id: '132호', name: '132호', width: 6, depth: ROOM_DEPTH, color: '#4a90e2', xOffset: 7.58, zOffset: -GAP },
        { id: '132-1호', name: '132-1호', width: 1.95, depth: ROOM_DEPTH, color: '#4a90e2', xOffset: 12.555, zOffset: -GAP },
        { id: '1층 화장실(여) 및 계단', name: '1층 화장실(여) 및 계단', width: 10.58, depth: ROOM_DEPTH, color: 'false', xOffset: 19.72, zOffset: -GAP },
        { id: '133-1호', name: '133-1호', width: 1.3, depth: ROOM_DEPTH, color: 'false', xOffset: 26.31, zOffset: -GAP },
        { id: '133호', name: '133호', width: 2, depth: ROOM_DEPTH, color: '#4a90e2', xOffset: 28.525, zOffset: -GAP },

        //소극장
        { id: '소극장', name: '소극장', width: 8.00, depth: ROOM_DEPTH, color: '#4a90e2', xOffset: 25.56, zOffset: -12 },
        { id: 'ig소극장1', name: 'ig소극장1', width: 0.1, depth: 10, color: '#4a90e2', xOffset: 22.86, zOffset: -14.4, rotation: [0, Math.PI / 6, 0] },
        { id: 'ig소극장2', name: 'ig소극장2', width: 0.1, depth: 10, color: '#4a90e2', xOffset: 27.66, zOffset: -14.4, rotation: [0, -Math.PI / 6, 0] },
        // ✅ 부채꼴 추가
        {
          id: "igSector",
          name: "ig소극장3",
          shape: "sector" as const,
          color: "#4a90e2", // 빨간색으로 변경해서 더 잘 보이게
          xOffset: 25.26, // 중앙으로 이동
          zOffset: -10, // 중앙으로 이동
          radius: 10, // 반지름을 더 크게
          angleDeg: 60, // 각도를 60도로 변경
          triLeft: 2,
          triRight: 2,
          scale: [1, 1, 1] as [number, number, number], // Y축 스케일을 늘려서 더 높게
          rotation: [-Math.PI / 2, Math.PI, Math.PI / 6] as [number, number, number] // 회전을 기본값으로 초기화
        }
      ]
    },
    // ───────────────────── 2층 ─────────────────────
    {
      id: 2,
      name: '2층',
      height: 4,
      width: FLOOR_WIDTH,
      depth: 10,
      color: '#50e3c2',
      rooms: [
        { id: '231', name: '231호', color: '#50e3c2', xOffset: -28.20, zOffset: -GAP, width: 2.65, depth: ROOM_DEPTH },
        { id: '232', name: '232호', color: '#50e3c2', xOffset: -21.11, zOffset: -GAP, width: 9.52, depth: ROOM_DEPTH },
        { id: '2층 화장실(여) 및 계단', name: '2층 화장실(여) 및 계단', color: 'false', xOffset: -11.12, zOffset: -GAP, width: 9.52, depth: ROOM_DEPTH },
        { id: '233', name: '233호', color: '#50e3c2', xOffset: -2.98, zOffset: -GAP, width: 3.7, depth: ROOM_DEPTH },
        { id: '234', name: '234호', color: '#50e3c2', xOffset: 1.72, zOffset: -GAP, width: 3.7, depth: ROOM_DEPTH },
        { id: '235', name: '235호', color: '#50e3c2', xOffset: 6.43, zOffset: -GAP, width: 3.7, depth: ROOM_DEPTH },
        { id: '236', name: '236호', color: '#50e3c2', xOffset: 11.13, zOffset: -GAP, width: 3.7, depth: ROOM_DEPTH },
        { id: '2층 화장실(남) 및 계단', name: '2층 화장실(남) 및 계단', color: 'false', xOffset: 19.72, zOffset: -GAP, width: 10.58, depth: ROOM_DEPTH },
        { id: '237', name: '237호', color: '#50e3c2', xOffset: 27.41, zOffset: -GAP, width: 3.7, depth: ROOM_DEPTH },

        { id: '201', name: '201호', color: '#50e3c2', xOffset: -25.02, zOffset: GAP, width: 9.01, depth: ROOM_DEPTH },
        { id: '201-1', name: '201-1호', color: '#50e3c2', xOffset: -15.01, zOffset: GAP, width: 9.01, depth: ROOM_DEPTH },
        { id: '202', name: '202호', color: '#50e3c2', xOffset: -5.01, zOffset: GAP, width: 9.01, depth: ROOM_DEPTH },
        { id: '203', name: '203호', color: '#50e3c2', xOffset: 5.00, zOffset: GAP, width: 9.01, depth: ROOM_DEPTH },
        { id: '204', name: '204호', color: '#50e3c2', xOffset: 15.00, zOffset: GAP, width: 9.01, depth: ROOM_DEPTH },
        { id: '205', name: '205호', color: '#50e3c2', xOffset: 25.02, zOffset: GAP, width: 9.01, depth: ROOM_DEPTH }
      ]
    },

    // ───────────────────── 3층 ─────────────────────
    {
      id: 3,
      name: '3층',
      height: 4,
      width: FLOOR_WIDTH,
      depth: 10,
      color: '#f5a623',
      rooms: [
        // 뒤쪽 행: zOffset = +3

        { id: '교수학습개발센터', name: '교수학습개발센터', width: 13.17, depth: ROOM_DEPTH, color: 'false', xOffset: -22.94, zOffset: -GAP },
        { id: '3층 화장실(남) 및 계단', name: '3층 화장실(남) 및 계단', width: 9.52, depth: ROOM_DEPTH, color: 'false', xOffset: -11.12, zOffset: -GAP },
        { id: '332', name: '332호', width: 3.7, depth: ROOM_DEPTH, color: '#f5a623', xOffset: -2.98, zOffset: -GAP },
        { id: '333', name: '333호', width: 3.7, depth: ROOM_DEPTH, color: '#f5a623', xOffset: 1.72, zOffset: -GAP },
        { id: '334', name: '334호', width: 8.4, depth: ROOM_DEPTH, color: '#f5a623', xOffset: 8.78, zOffset: -GAP },
        { id: '3층 화장실(여) 및 계단', name: '3층 화장실(여) 및 계단', width: 10.58, depth: ROOM_DEPTH, color: 'false', xOffset: 19.72, zOffset: -GAP },
        { id: '335', name: '335호', width: 3.7, depth: ROOM_DEPTH, color: 'false', xOffset: 27.41, zOffset: -GAP },


        // 앞쪽 행: zOffset = -3
        { id: '301', name: '301호', width: 9.01, depth: ROOM_DEPTH, color: 'false', xOffset: -25.02, zOffset: GAP },
        { id: '302', name: '302호', width: 9.01, depth: ROOM_DEPTH, color: 'false', xOffset: -15.01, zOffset: GAP },
        { id: '303', name: '303호', width: 9.01, depth: ROOM_DEPTH, color: '#f5a623', xOffset: -5.01, zOffset: GAP },
        { id: '304', name: '304호', width: 9.01, depth: ROOM_DEPTH, color: '#f5a623', xOffset: 5.01, zOffset: GAP },
        { id: '305', name: '305호', width: 9.01, depth: ROOM_DEPTH, color: '#f5a623', xOffset: 15.00, zOffset: GAP },
        { id: '306', name: '306호', width: 9.01, depth: ROOM_DEPTH, color: '#f5a623', xOffset: 25.02, zOffset: GAP },
      ]
    },

    // ───────────────────── 4층 ─────────────────────
    {
      id: 4,
      name: '4층',
      height: 4,
      width: FLOOR_WIDTH,
      depth: 10,
      color: '#9013fe',
      rooms: [
        // 뒤쪽 행: zOffset = +3
        { id: '사무실 및 연구실', name: '사무실 및 연구실', width: 59.05, depth: ROOM_DEPTH, color: 'false', xOffset: 0, zOffset: GAP },


        { id: '사무실 및 면담실', name: '사무실 및 면담실', width: 13.17, depth: ROOM_DEPTH, color: 'false', xOffset: -22.94, zOffset: -GAP },
        { id: '4층 화장실(여) 및 계단', name: '4층 화장실(여) 및 계단', color: 'false', xOffset: -11.12, zOffset: -GAP, width: 9.52, depth: ROOM_DEPTH },
        { id: '437', name: '437호', width: 4.7, depth: ROOM_DEPTH, color: 'false', xOffset: -2.98, zOffset: -GAP },
        { id: '434~436호', name: '434~436호', width: 7.57, depth: ROOM_DEPTH, color: '#9013fe', xOffset: 3.75, zOffset: -GAP },
        { id: '연구실 및 면담실', name: '연구실 및 면담실', width: 3.7, depth: ROOM_DEPTH, color: 'false', xOffset: 27.41, zOffset: -GAP },
        { id: '4층 화장실(남) 및 계단', name: '4층 화장실(남) 및 계단', color: 'false', xOffset: 19.72, zOffset: -GAP, width: 10.58, depth: ROOM_DEPTH },

        { id: '면담실 및 연구실', name: '면담실 및 연구실', width: 4.895, depth: ROOM_DEPTH, color: 'false', xOffset: 10.9825, zOffset: -GAP },
      ]
    }
  ],
  totalHeight: 12,
  position: {
    x: 0,
    y: 0,
    z: 0
  }
};