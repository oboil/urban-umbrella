// src/pages/ClassroomManagement.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useDeviceType } from '../hooks/useDeviceType';
import { getClassroomData, refreshClassroomData } from '../data/classroomData';
import { timeService } from '../utils/timeService';
import { buildingNames } from '../data/buildingData';
import { Seong } from '../data/seongData';
import { Paldal } from '../data/paldalData';
import { Dasan } from '../data/dasanData';
import type { ClassroomFake } from '../types/classroom';

// Common Components
import Sidebar from '../components/common/Sidebar';
import ReservationView from '../components/common/ReservationView';
import SettingsView from '../components/common/SettingsView';
import StatusView from '../components/common/StatusView';

// Mobile Components
import MobileBottomNav from '../components/mobile/MobileBottomNav';

// Tablet Components
import TabletBottomNav from '../components/tablet/TabletBottomNav';

// Styles
import mobileStyles from '../styles/mobile/mobile.module.css';
import tabletStyles from '../styles/tablet/tablet.module.css';
import '../styles/common/variables.css';
import MobileHeader from '../components/mobile/MobileHeader';

const ClassroomManagement: React.FC = () => {
  const deviceType = useDeviceType();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('status');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(-1);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
   
  // 실제 강의실 데이터 상태
  const [classroomData, setClassroomData] = useState<ClassroomFake[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 서버 날짜 상태 (UI에 표시하지 않지만 내부적으로 사용)
  const [serverDate, setServerDate] = useState<string>('');

  // 초기 데이터 로드 및 시간 동기화
  useEffect(() => {
    initializeApp();
  }, []);

  // 앱 초기화 - 시간 동기화 후 데이터 로드
  const initializeApp = async () => {
    try {
      // 시간 동기화 먼저 수행
      await timeService.getCurrentTime();
      
      // 서버 기준 현재 날짜 설정
      const today = await timeService.getTodayString();
      setServerDate(today);
      
      // 데이터 로드
      await loadClassroomData();
      
      console.log('✅ 앱 초기화 완료 - 서버 날짜:', today);
    } catch (error) {
      console.error('앱 초기화 실패:', error);
      // fallback으로 로컬 날짜 사용
      setServerDate(new Date().toISOString().split('T')[0]);
      await loadClassroomData();
    }
  };

  // 30초마다 자동 새로고침 (서버 시간 기반)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // 백그라운드에서 시간 동기화 및 날짜 업데이트
        await timeService.getCurrentTime();
        const currentDate = await timeService.getTodayString();
        
        // 날짜가 바뀌었다면 상태 업데이트
        if (currentDate !== serverDate) {
          setServerDate(currentDate);
          console.log('📅 날짜 변경 감지:', serverDate, '->', currentDate);
        }
        
        await loadClassroomData();
      } catch (error) {
        console.warn('자동 새로고침 실패:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [serverDate]);

  const loadClassroomData = async () => {
    try {
      setLoading(true);
      
      // 시간 동기화와 함께 데이터 로드
      const data = await getClassroomData();
      setClassroomData(data);
      
    } catch (error) {
      console.error('강의실 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 건물별 데이터 매핑 함수
  const getBuildingFloorMapping = (buildingId: string) => {
    switch (buildingId) {
      case 'seongho':
        return Seong.floors.reduce((acc, floor, index) => {
          acc[`Floor${floor.id}`] = index;
          return acc;
        }, {} as { [key: string]: number });
      case 'paldal':
        return { 'Floor1': 0, 'Floor2': 1, 'Floor3': 2 };
      case 'dasan':
        return { 'Floor1': 0, 'Floor2': 1, 'Floor3': 2, 'Floor4': 3 };
      default:
        return {};
    }
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let filtered = classroomData;

    // 검색 필터
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(query) ||
        room.building.toLowerCase().includes(query) ||
        (room.roomId && room.roomId.toLowerCase().includes(query))
      );
    }

    // 건물별 필터
    if (selectedBuilding) {
      const targetBuildingName = buildingNames.find(b => b.id === selectedBuilding)?.name;
      if (targetBuildingName) {
        filtered = filtered.filter(room => room.building === targetBuildingName);
      }
    }

    // 층별 필터 (건물이 선택된 경우에만)
    if (selectedBuilding && selectedFloor !== -1) {
      let targetFloorRooms: string[] = [];
      
      if (selectedBuilding === 'seongho' && selectedFloor < Seong.floors.length) {
        const targetFloor = Seong.floors[selectedFloor];
        if (targetFloor.rooms) {
          targetFloorRooms = targetFloor.rooms.map(room => room.name);
        }
      } else if (selectedBuilding === 'paldal' && selectedFloor < Paldal.floors.length) {
        const targetFloor = Paldal.floors[selectedFloor];
        if (targetFloor.rooms) {
          targetFloorRooms = targetFloor.rooms.map(room => room.name);
        }
      } else if (selectedBuilding === 'dasan' && selectedFloor < Dasan.floors.length) {
        const targetFloor = Dasan.floors[selectedFloor];
        if (targetFloor.rooms) {
          targetFloorRooms = targetFloor.rooms.map(room => room.name);
        }
      }
      
      // 해당 층의 강의실만 필터링
      filtered = filtered.filter(room => targetFloorRooms.includes(room.name));
    }

    // 상태 필터
    if (activeFilter !== 'all') {
      filtered = filtered.filter(room => room.status === activeFilter);
    }

    return filtered;
  }, [classroomData, searchQuery, activeFilter, selectedFloor, selectedBuilding]);

  // 이벤트 핸들러들
  const handleSearch = (query: string) => {
    try {
      setSearchQuery(query || '');
    } catch (error) {
      console.error('검색 처리 오류:', error);
      setSearchQuery('');
    }
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // 탭 변경 시 검색어 초기화 (선택적)
    if (tab !== 'status') {
      setSearchQuery('');
    }
  };

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setSelectedFloor(-1);
  };

  const handleClassroomClick = (classroom: ClassroomFake) => {
    console.log('Classroom clicked:', classroom);
  };

  const handleRefresh = async () => {
    console.log('🔄 수동 새로고침 시작...');
    try {
      setLoading(true);
      // 시간 서버 강제 동기화
      await timeService.forceRefresh();
      
      // 서버 날짜 업데이트
      const currentDate = await timeService.getTodayString();
      setServerDate(currentDate);
      
      // 데이터 새로고침
      const data = await refreshClassroomData();
      setClassroomData(data);
      setRefreshKey(prev => prev + 1);
      
      console.log('✅ 수동 새로고침 완료 - 현재 날짜:', currentDate);
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    console.log('Exporting data...');
  };

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleFloorSelect = (floorId: number) => {
    setSelectedFloor(floorId);
  };

  // 서버 날짜를 하위 컴포넌트에 전달하는 함수
  const getServerDate = () => serverDate;

  // 모바일 메인 콘텐츠 렌더링
  const renderMobileContent = () => {
    if (loading && activeTab === 'status') {
      return (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          border: '1px solid gray'
        }}>
          <div className="spinner-border text-primary mb-2" role="status">
            <span className="visually-hidden">로딩중...</span>
          </div>
          <div>데이터 로딩 중...</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'reservation':
        return <ReservationView layout="mobile" serverDate={serverDate} />;
      case 'settings':
        return <SettingsView layout="mobile" />;
      case 'status':
      default:
        return (
          <StatusView
            data={filteredData}
            layout="mobile"
            selectedBuilding={selectedBuilding}
            onClassroomClick={handleClassroomClick}
            onRefresh={handleRefresh}
            loading={loading}
            serverDate={serverDate}
          />
        );
    }
  };

  // 태블릿 메인 콘텐츠 렌더링
  const renderTabletContent = () => {
    if (loading && activeTab === 'status') {
      return (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
        }}>
          <div className="spinner-border text-primary mb-2" role="status">
            <span className="visually-hidden">로딩중...</span>
          </div>
          <div>데이터 로딩 중...</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'reservation':
        return <ReservationView layout="tablet" serverDate={serverDate} />;
      case 'settings':
        return <SettingsView layout="tablet" />;
      case 'status':
      default:
        return (
          <StatusView
            data={filteredData}
            layout="tablet"
            onRefresh={handleRefresh}
            onExport={handleExport}
            selectedBuilding={selectedBuilding}
            onClassroomClick={handleClassroomClick}
            loading={loading}
            serverDate={serverDate}
          />
        );
    }
  };

  // 모바일 렌더링
  if (deviceType === 'mobile') {
    return (
      <div className={mobileStyles.container}>
        <MobileHeader searchQuery={searchQuery} onSearch={handleSearch} onMenuClick={handleMenuClick} />
        
        <Sidebar
          data={filteredData}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          selectedFloor={selectedFloor}
          onFloorSelect={handleFloorSelect}
          selectedBuilding={selectedBuilding}
          onBuildingChange={handleBuildingChange}
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
        />
        
        {renderMobileContent()}
        
        <MobileBottomNav 
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
    );
  }

  // 태블릿 렌더링
  return (
    <div className={tabletStyles.container} style={{ paddingBottom: '80px' }}>
      <Sidebar 
        data={filteredData}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        selectedFloor={selectedFloor}
        onFloorSelect={handleFloorSelect}
        selectedBuilding={selectedBuilding}
        onBuildingChange={handleBuildingChange}
      />
      
      {renderTabletContent()}
      
      <TabletBottomNav 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
};

export default ClassroomManagement;