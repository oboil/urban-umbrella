import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Center } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { BuildingViewerProps, Floor, Room, Reservation } from '../../types/building';
import * as THREE from 'three';
import RoomComponent from '../RoomComponent';
import RoomReservationModal from '../RoomReservationModal';
import { getReservationsByRoom, addReservation } from '../../utils/reservationDB';

const FloorComponent = ({ floor, position, onClick }: { floor: Floor; position: number; onClick: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);


  return (
    <mesh
      ref={meshRef}
      position={[0, position, 0]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[floor.width, floor.height, floor.depth]} />
      <meshStandardMaterial
        color={hovered ? '#ff6b6b' : floor.color}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

const BuildingModel = ({ building, onFloorSelect, onRoomClick }: BuildingViewerProps & { onRoomClick: (room: Room) => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [smallHall, setSmallHall] = useState(false);

  useFrame(() => {
    if (groupRef.current) {
      const center = new THREE.Vector3(
        building.position.x,
        building.position.y + building.totalHeight / 2,
        building.position.z
      );
      groupRef.current.position.sub(center);
      groupRef.current.position.add(center);
    }
  });

  let currentHeight = 0;
  const FLOOR_OFFSET = 3; // 층별 오프셋 간격

  return (
    <group ref={groupRef} position={[building.position.x, building.position.y, building.position.z]}>
      {building.floors.map((floor) => {
        const floorBaseY = currentHeight;
        currentHeight += floor.height + FLOOR_OFFSET; // 층 높이 + 오프셋 추가
        if (floor.rooms && floor.rooms.length > 0) {
          return (
            <group key={`floor-${floor.id}`} position={[0, floorBaseY, 0]}>
              {floor.rooms.map((room) => (
                <RoomComponent
                  key={room.id}
                  room={room}
                  floorHeight={floor.height}
                  onRoomClick={onRoomClick}
                  setSmallHall={setSmallHall}
                  smallHall={smallHall}
                />
              ))}
            </group>
          );
        }
        return (
          <FloorComponent
            key={floor.id}
            floor={floor}
            position={floorBaseY}
            onClick={() => onFloorSelect?.(floor.id)}
          />
        );
      })}
    </group>
  );
};

export const BuildingViewer = ({ building, onFloorSelect }: BuildingViewerProps) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [roomReservations, setRoomReservations] = useState<{ [roomId: string]: Reservation[] }>({});

  const handleResetCamera = () => {
    controlsRef.current?.reset();
  };

  // 방의 예약 데이터를 로드하는 함수
  const loadRoomReservations = async (roomId: string) => {
    try {
      const reservations = await getReservationsByRoom(roomId);
      setRoomReservations(prev => ({
        ...prev,
        [roomId]: reservations
      }));
    } catch (error) {
      console.error('Failed to load reservations:', error);
    }
  };

  const handleRoomClick = async (room: Room) => {
    if (room.name.includes('소극장')) 
      room = { id: '소극장',   name: '소극장',   width: 0, depth: 0, color: '#', xOffset: 0, zOffset: 0 };
    
    // DB에서 최신 예약 데이터 로드
    await loadRoomReservations(room.id);

    // 방 정보에 DB 데이터를 포함하여 설정
    const roomWithReservations = {
      ...room,
      reservations: roomReservations[room.id] || []
    };

    setSelectedRoom(roomWithReservations);
    setShowModal(true);
  };

  const handleReservation = async (roomId: string, date: string, time: string, guestName: string, purpose: string, duration: number = 1) => {
    try {
      // 새 예약 객체 생성
      const newReservation: Reservation = {
        id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId: roomId,
        date: date,
        time: time,
        duration: duration, // 전달받은 duration 사용
        guestName: guestName,
        purpose: purpose,
        createdAt: new Date().toISOString()
      };

      // DB에 저장
      await addReservation(newReservation);

      // 성공 메시지 표시
      const formattedDate = new Date(date);
      const [hours, minutes] = time.split(':');

      const year = formattedDate.getFullYear().toString().slice(-2);
      const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
      const day = String(formattedDate.getDate()).padStart(2, '0');

      alert(`${roomId}호가 예약되었습니다! 날짜: ${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분 (${duration}시간)`);

      // 해당 방의 예약 데이터 다시 로드
      await loadRoomReservations(roomId);

      // 모달의 선택된 방 정보도 업데이트
      if (selectedRoom && selectedRoom.id === roomId) {
        const updatedReservations = await getReservationsByRoom(roomId);
        setSelectedRoom(prev => prev ? {
          ...prev,
          reservations: updatedReservations
        } : null);
      }
    } catch (error) {
      console.error('Failed to save reservation:', error);
      alert('예약 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 모달을 닫을 때 최신 데이터 다시 로드
  const handleModalClose = async () => {
    if (selectedRoom) {
      await loadRoomReservations(selectedRoom.id);
    }
    setShowModal(false);
  };

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.rotateSpeed = 2.0; // 기본값은 1.0, 더 크면 더 빠르게 회전
      controlsRef.current.panSpeed = 10;
      controlsRef.current.zoomSpeed = 2.0;
      console.log("설정")
    }
  }, [controlsRef.current]);

  // 컴포넌트 마운트 시 모든 방의 예약 데이터 미리 로드
  useEffect(() => {
    const loadAllReservations = async () => {
      const allRooms: Room[] = [];
      building.floors.forEach(floor => {
        if (floor.rooms) {
          allRooms.push(...floor.rooms);
        }
      });

      for (const room of allRooms) {
        await loadRoomReservations(room.id);
      }
    };

    loadAllReservations();
  }, [building.floors]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* 배경 이미지 - background.png */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        <img
          src="/background.jpeg"
          alt="Background"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(8px) brightness(0.7)',
          }}
        />

        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1,
          pointerEvents: 'none'
        }} />
      </div>

      {/* Canvas 컨테이너 */}
      <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[60, 50, 50]} />
          <OrbitControls ref={controlsRef} enablePan={true} enableZoom={true} enableRotate={true} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />

          <Center>
            <BuildingModel building={building} onFloorSelect={onFloorSelect} onRoomClick={handleRoomClick} />
          </Center>
        </Canvas>
      </div>

      {/* ✅ 초기화 버튼 */}
      <button
        style={{
          position: 'absolute',
          bottom: '100px',
          right: '20px',
          padding: '10px 16px',
          fontSize: '16px',
          textAlign: 'center',
          background: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 2,
        }}
        onClick={handleResetCamera}
      >
        <i className="bi bi-arrow-clockwise me-2"></i>
      </button>

      <RoomReservationModal
        show={showModal}
        onHide={handleModalClose}
        room={selectedRoom}
        onReservation={handleReservation}
      />
    </div>
  );
}; 