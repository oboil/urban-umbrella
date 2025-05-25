import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';
import type { Room } from '../types/building';
import { getReservationsByRoom } from '../utils/reservationDB';
import { getLecturesByRoom } from '../utils/lectureDB';
import { timeService } from '../utils/timeService';

// 부채꼴 Geometry 생성 함수
const createSectorGeometry = (radius: number, angleDeg: number, height: number) => {
  const angleRad = (angleDeg * Math.PI) / 180;
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 32, 1, false, 0, angleRad);

  // 기본적으로 Y축 중심으로 생성되는 CylinderGeometry를 X-Z 평면으로 회전
  geometry.rotateX(-Math.PI / 2);

  return geometry;
};

const RoomComponent = ({ room, floorHeight, onRoomClick, smallHall, setSmallHall }: { room: Room; floorHeight: number; onRoomClick?: (room: Room) => void; smallHall: boolean; setSmallHall: (small: boolean) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Mesh>(null);
  const [color, setColor] = useState('yellow');
  const [hovered, setHovered] = useState(false);

  const { camera } = useThree();


  useEffect(() => {
    const load = async () => {
      try {
        if (room.color == 'false') {
          setColor('gray')
          return
        }

        const reservations = await getReservationsByRoom(room.id);
        const lectures = await getLecturesByRoom(room.id);
        const now = await timeService.getCurrentTime();

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[now.getDay()];
        const today = now.toISOString().split('T')[0];



        for (const reservation of reservations) {
          const start = new Date(`${reservation.date}T${reservation.time}`);
          const end = new Date(start.getTime() + reservation.duration * 60 * 60 * 1000); // duration: 시간 단위

          if (now >= start && now < end) {
            setColor('red')
            return
          }
        }


        for (const lecture of lectures) {
          const days = lecture.week.split(' ');
          const times = lecture.time.split(' ');
          const durations = lecture.duration.split(' ');
          if (!days.includes(dayName)) continue;

          days.map((day, idx) => {
            if (day !== dayName) return;
            const time = times[idx];
            const duration = durations[idx];

            const start = new Date(`${today}T${time}`);
            const end = new Date(start.getTime() + parseFloat(duration) * 60 * 60 * 1000); // duration: 시간 단위
            if (now >= start && now < end) {
              setColor('red')
              return
            }
          })

          for (let idx = 0; idx < days.length; idx++) {
            if (days[idx] !== dayName) continue;

            const time = times[idx];
            const duration = durations[idx];

            const start = new Date(`${today}T${time}`);
            const end = new Date(start.getTime() + parseFloat(duration) * 60 * 60 * 1000);

            if (now >= start && now < end) {
              setColor('red');
              return;
            }
          }
        }

        setColor('lightgreen')
        return
      } catch (err) {
        console.error('예약 불러오기 실패:', err);
      }
    };

    load();
  }, [room]);

  useFrame(() => {
    if (textRef.current) {
      // 텍스트 위치와 카메라 위치 차이 계산
      const textPos = textRef.current.position.clone();
      const cameraPos = camera.position.clone();

      const direction = cameraPos.sub(new THREE.Vector3(0, 0, 0));
      const target = textPos.clone().add(direction);

      // 텍스트가 Y축만 반영한 카메라 위치를 바라보게
      textRef.current.lookAt(target);
    }
  });

  const position: [number, number, number] = [
    room.xOffset,
    0,
    room.zOffset,
  ];

  // 부채꼴인지 확인
  const isRoomSector = room.shape === 'sector';

  return (
    <group>
      {/* 일반 박스 방의 경우 */}
      {!isRoomSector && (
        <group
          position={position}
          rotation={('rotation' in room && room.rotation) ? room.rotation : [0, 0, 0]}
        >
          <mesh
            ref={meshRef}
            onClick={(e) => {
              e.stopPropagation();
              if (room.color != 'false' && color != 'yellow')
                onRoomClick?.(room);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              if (room.color != 'false' && color != 'yellow')
                setHovered(true);
              if (room.name.includes('소극장') && color != 'yellow')
                setSmallHall(true);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              if (room.color != 'false' && color != 'yellow')
                setHovered(false);
              if (room.name.includes('소극장') && color != 'yellow')
                setSmallHall(false);
            }}
          >
            <boxGeometry args={[
              'width' in room ? room.width : 4,
              floorHeight,
              'depth' in room ? room.depth : 4
            ]} />
            <meshStandardMaterial
              color={room.name.includes('소극장') && smallHall ? 'skyblue' : (hovered ? 'skyblue' : color)}
              transparent
              opacity={room.name.includes('소극장') ? 1 : 0.8}
            />
          </mesh>

          {/* ✅ 테두리 라인 추가 */}
          {!room.name.includes('소극장') &&
            <lineSegments>
              <edgesGeometry
                args={[
                  new THREE.BoxGeometry(
                    'width' in room ? room.width : 4,
                    floorHeight,
                    'depth' in room ? room.depth : 4
                  ),
                ]}
              />
              <lineBasicMaterial color="black" linewidth={1} />
            </lineSegments>
          }
        </group>
      )}

      {/* 부채꼴의 경우 회전을 그룹으로 처리 */}
      {isRoomSector && 'radius' in room && 'angleDeg' in room && (
        <group
          position={position}
          rotation={('rotation' in room && room.rotation) ? room.rotation : [0, 0, 0]}
          scale={('scale' in room && room.scale) ? room.scale : [1, 1, 1]}
        >
          {/* 메인 부채꼴 곡면 */}
          <mesh
            ref={meshRef}
            onClick={(e) => {
              e.stopPropagation();
              if (room.color != 'false' && color != 'yellow')
                onRoomClick?.(room);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              if (room.color != 'false' && color != 'yellow')
                setHovered(true);
              if (room.name.includes('소극장') && color != 'yellow')
                setSmallHall(true);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              if (room.color != 'false' && color != 'yellow')
                setHovered(false);
              if (room.name.includes('소극장') && color != 'yellow')
                setSmallHall(false);
            }}
          >
            <primitive object={createSectorGeometry(room.radius, room.angleDeg, floorHeight)} />
            <meshStandardMaterial
              color={room.name.includes('소극장') && smallHall ? 'skyblue' : (hovered ? 'skyblue' : color)}
              transparent
              opacity={1}
            />
          </mesh>
        </group>
      )}
      {!room.name.startsWith('ig') && <Text
        ref={textRef}
        position={[position[0], floorHeight / 2 + 1, position[2]]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineColor="black"
        outlineWidth={0.15}
      >
        {room.name}
      </Text>
      }

    </group>
  );
};

export default RoomComponent;