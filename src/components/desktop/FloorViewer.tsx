import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useState, useEffect, useRef } from 'react';
import type { Floor, Room, Reservation } from '../../types/building';
import RoomReservationModal from '../RoomReservationModal';
import { getReservationsByRoom, addReservation } from '../../utils/reservationDB';
import RoomComponent from '../RoomComponent';

const FloorViewer = ({ floor }: { floor: Floor; }) => {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [roomReservations, setRoomReservations] = useState<{ [roomId: string]: Reservation[] }>({});
  const [smallHall, setSmallHall] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const handleResetCamera = () => {
    controlsRef.current?.reset();
  };

  useEffect(() => {
    handleResetCamera();
  }, [floor])

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

  // 컴포넌트 마운트 시 모든 방의 예약 데이터 미리 로드
  useEffect(() => {
    const loadAllReservations = async () => {
      if (floor.rooms) {
        for (const room of floor.rooms) {
          await loadRoomReservations(room.id);
        }
      }
    };
    
    loadAllReservations();
  }, [floor.rooms]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.rotateSpeed = 2.0; // 기본값은 1.0, 더 크면 더 빠르게 회전
      controlsRef.current.panSpeed = 10;
      controlsRef.current.zoomSpeed = 2.0;
      console.log("설정")
    }
  }, [controlsRef.current]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* 배경 이미지 - background.jpeg */}
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
      <div style={{ paddingTop: '56px', height: 'calc(100vh - 56px)', position: 'relative', zIndex: 1 }}>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 60, 0]} />
          <OrbitControls ref={controlsRef} enableZoom={true} enableRotate={true} enablePan={true} target={[0, 0, 0]} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />

          {(floor.rooms ?? []).map((room) => {
            // DB에서 로드된 예약 데이터를 방 정보에 포함
            const roomWithReservations = {
              ...room,
              reservations: roomReservations[room.id] || []
            };
            
            return (
              <RoomComponent
                key={room.id}
                room={roomWithReservations}
                floorHeight={floor.height}
                onRoomClick={handleRoomClick}
                setSmallHall={setSmallHall}
                smallHall={smallHall}
              />
            );
          })}
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

export default FloorViewer; 