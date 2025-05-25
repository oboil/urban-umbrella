// components/common/Sidebar.tsx
import React, { useMemo } from 'react';
import type { ClassroomFake } from '../../types/classroom';
import { useDeviceType } from '../../hooks/useDeviceType';
import { buildingNames, getBuildingDisplayName } from '../../data/buildingData';
import { Seong } from '../../data/seongData';
import { Paldal } from '../../data/paldalData'
import { Dasan } from '../../data/dasanData'
import styles from '../../styles/common/sidebar.module.css';

interface SidebarProps {
  data: ClassroomFake[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  selectedFloor?: number;
  onFloorSelect?: (floorId: number) => void;
  selectedBuilding?: string;
  onBuildingChange?: (buildingId: string) => void;
  // 모바일 전용 props
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  data, 
  activeFilter,
  onFilterChange,
  selectedFloor = -1,
  onFloorSelect,
  selectedBuilding,
  onBuildingChange,
  isOpen = false,
  onClose
}) => {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  
  const available = data.filter(room => room.status === 'available').length;
  const occupied = data.filter(room => room.status === 'occupied').length;
  const totalCapacity = data.reduce((sum, room) => sum + room.capacity, 0);
  const currentUsers = data.reduce((sum, room) => sum + room.currentUsers, 0);

  // 선택된 건물에 따른 층 정보 생성
  const floors = useMemo(() => {
    const baseFloors = [{ id: -1, name: '전체' }];
    
    if (selectedBuilding === 'seongho') {
      const buildingFloors = Seong.floors.map(floor => ({
        id: floor.id - 1,
        name: floor.name
      }));
      return [...baseFloors, ...buildingFloors];
    } else if (selectedBuilding === 'paldal') {
      const buildingFloors = Paldal.floors.map(floor => ({
        id: floor.id - 1,
        name: floor.name
      }));
      return [...baseFloors, ...buildingFloors];
    } else if (selectedBuilding === 'dasan') {
      const buildingFloors = Dasan.floors.map(floor => ({
        id: floor.id - 1,
        name: floor.name
      }));
      return [...baseFloors, ...buildingFloors];
    }
    
    // 기본값
    return baseFloors;
  }, [selectedBuilding]);

  const handleFilterClick = (filter: string) => {
    onFilterChange(filter);
    if (isMobile && onClose) {
      onClose(); // 모바일에서 필터 선택 후 사이드바 닫기
    }
  };

  const handleFloorSelect = (floorId: number) => {
    onFloorSelect?.(floorId);
    if (isMobile && onClose) {
      onClose(); // 모바일에서 층 선택 후 사이드바 닫기
    }
  };

  const handleBuildingSelect = (buildingId: string) => {
    onBuildingChange?.(buildingId);
    // 건물이 바뀌면 층 선택을 초기화
    onFloorSelect?.(-1);
    // if (isMobile && onClose) {
    //   onClose(); // 모바일에서 건물 선택 후 사이드바 닫기
    // }
  };

  const statusFilters = [
    { id: 'all', label: '전체 강의실' },
    { id: 'available', label: '사용 가능' },
    { id: 'occupied', label: '사용 중' },
    { id: 'maintenance', label: '점검 중' }
  ];

  // 현재 선택된 건물의 표시명
  const currentBuildingName = selectedBuilding 
    ? getBuildingDisplayName(selectedBuilding) 
    : '전체';

  // 모바일 렌더링
  if (isMobile) {
    return (
      <>
        {/* 오버레이 */}
        <div 
          className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
          onClick={onClose}
        />
        
        {/* 사이드바 */}
        <div className={`${styles.mobileSidebar} ${isOpen ? styles.mobileSidebarOpen : ''}`}>
          <div className={styles.mobileHeader}>
            <h2 className={styles.mobileTitle}>
              {currentBuildingName} 관리
            </h2>
            <button 
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="사이드바 닫기"
            >
              ✕
            </button>
          </div>

          <div className={styles.content}>
            {/* 건물별 선택 */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>건물 선택</h3>
              <div className={styles.floorGrid}>
                <button
                  className={`${styles.floorButton} ${
                    !selectedBuilding ? styles.floorButtonActive : ''
                  }`}
                  onClick={() => handleBuildingSelect('')}
                >
                  전체
                </button>
                {buildingNames.map(building => (
                  <button
                    key={building.id}
                    className={`${styles.floorButton} ${
                      selectedBuilding === building.id ? styles.floorButtonActive : ''
                    }`}
                    onClick={() => handleBuildingSelect(building.id)}
                  >
                    {building.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 층별 선택 - 건물이 선택된 경우에만 표시 */}
            {selectedBuilding && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  {currentBuildingName} 층별 보기
                </h3>
                <div className={styles.floorGrid}>
                  {floors.map(floor => (
                    <button
                      key={floor.id}
                      className={`${styles.floorButton} ${
                        selectedFloor === floor.id ? styles.floorButtonActive : ''
                      }`}
                      onClick={() => handleFloorSelect(floor.id)}
                    >
                      {floor.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 상태별 필터 */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>상태별 필터</h3>
              {statusFilters.map(filter => (
                <button
                  key={filter.id}
                  className={`${styles.filterButton} ${
                    activeFilter === filter.id ? styles.filterButtonActive : ''
                  }`}
                  onClick={() => handleFilterClick(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* 실시간 현황 */}
            <div className={styles.dashboardSection}>
              <h3 className={styles.dashboardTitle}>
                {currentBuildingName} 실시간 현황
              </h3>
              <div className={styles.dashboardStats}>
                <div className={styles.dashboardStat}>
                  <div className={styles.dashboardNumber} style={{ color: '#10B981' }}>
                    {available}
                  </div>
                  <div className={styles.dashboardLabel}>사용가능</div>
                </div>
                <div className={styles.dashboardStat}>
                  <div className={styles.dashboardNumber} style={{ color: '#EF4444' }}>
                    {occupied}
                  </div>
                  <div className={styles.dashboardLabel}>사용중</div>
                </div>
                <div className={styles.dashboardStat}>
                  <div className={styles.dashboardNumber} style={{ color: '#3B82F6' }}>
                    {totalCapacity}
                  </div>
                  <div className={styles.dashboardLabel}>총 수용</div>
                </div>
                <div className={styles.dashboardStat}>
                  <div className={styles.dashboardNumber} style={{ color: '#F59E0B' }}>
                    {currentUsers}
                  </div>
                  <div className={styles.dashboardLabel}>현재 사용</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 태블릿/데스크톱 렌더링
  return (
    <aside className={styles.tabletSidebar}>
      <h1 className={styles.tabletTitle}>
        {currentBuildingName} 관리
      </h1>
      
      {/* 건물별 선택 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>건물 선택</h3>
        <div className={styles.floorGrid}>
          <button
            className={`${styles.floorButton} ${
              !selectedBuilding ? styles.floorButtonActive : ''
            }`}
            onClick={() => handleBuildingSelect('')}
          >
            전체
          </button>
          {buildingNames.map(building => (
            <button
              key={building.id}
              className={`${styles.floorButton} ${
                selectedBuilding === building.id ? styles.floorButtonActive : ''
              }`}
              onClick={() => handleBuildingSelect(building.id)}
            >
              {building.name}
            </button>
          ))}
        </div>
      </div>

      {/* 층별 선택 - 건물이 선택된 경우에만 표시 */}
      {selectedBuilding && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {currentBuildingName} 층별 보기
          </h3>
          <div className={styles.floorGrid}>
            {floors.map(floor => (
              <button
                key={floor.id}
                className={`${styles.floorButton} ${
                  selectedFloor === floor.id ? styles.floorButtonActive : ''
                }`}
                onClick={() => handleFloorSelect(floor.id)}
              >
                {floor.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 상태별 필터 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>상태별 필터</h3>
        {statusFilters.map(filter => (
          <button
            key={filter.id}
            className={`${styles.filterButton} ${
              activeFilter === filter.id ? styles.filterButtonActive : ''
            }`}
            onClick={() => handleFilterClick(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      
      {/* 실시간 현황 */}
      <div className={styles.dashboardSection}>
        <h3 className={styles.dashboardTitle}>
          {currentBuildingName} 실시간 현황
        </h3>
        <div className={styles.dashboardStats}>
          <div className={styles.dashboardStat}>
            <div className={styles.dashboardNumber} style={{ color: '#10B981' }}>
              {available}
            </div>
            <div className={styles.dashboardLabel}>사용가능</div>
          </div>
          <div className={styles.dashboardStat}>
            <div className={styles.dashboardNumber} style={{ color: '#EF4444' }}>
              {occupied}
            </div>
            <div className={styles.dashboardLabel}>사용중</div>
          </div>
          <div className={styles.dashboardStat}>
            <div className={styles.dashboardNumber} style={{ color: '#3B82F6' }}>
              {totalCapacity}
            </div>
            <div className={styles.dashboardLabel}>총 수용</div>
          </div>
          <div className={styles.dashboardStat}>
            <div className={styles.dashboardNumber} style={{ color: '#F59E0B' }}>
              {currentUsers}
            </div>
            <div className={styles.dashboardLabel}>현재 사용</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;