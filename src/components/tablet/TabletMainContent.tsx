// components/tablet/TabletMainContent.tsx
import React, { useState } from 'react';
import { type ClassroomFake } from '../../types/classroom';
import { getStatusColor, getStatusText } from '../../data/classroomData';
import { getBuildingName } from '../../data/buildingData';
import styles from '../../styles/tablet/tablet.module.css';

interface TabletMainContentProps {
  data: ClassroomFake[];
  onRefresh?: () => void;
  onExport?: () => void;
  selectedBuilding?: string;
}

const TabletMainContent: React.FC<TabletMainContentProps> = ({ 
  data, 
  onRefresh, 
  // onExport,
  selectedBuilding 
}) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const handleCardAction = (action: string, classroom: ClassroomFake) => {
    console.log(`${action} action for ${classroom.name}`);
    // 실제 액션 로직 구현
  };

  // 현재 선택된 건물명 표시
  const currentBuildingName = selectedBuilding 
    ? getBuildingName(selectedBuilding) 
    : '강의실';

  return (
    <main className={styles.mainContent}>
      <div className={styles.contentHeader}>
        <h2 className={styles.contentTitle}>
          {currentBuildingName} 현황 대시보드
        </h2>
        <div className={styles.actionButtons}>
          {/* <button 
            className={styles.secondaryButton}
            onClick={onExport}
          >
            내보내기
          </button> */}
          <button 
            className={styles.primaryButton}
            onClick={onRefresh}
          >
            새로고침
          </button>
        </div>
      </div>
      
      <div className={styles.gridContainer}>
        {data.map(classroom => {
          const statusColor = getStatusColor(classroom.status);
          const statusText = getStatusText(classroom.status);
          
          return (
            <div 
              key={classroom.id}
              className={styles.gridCard}
              style={{
                borderColor: statusColor + '40',
                transform: hoveredCard === classroom.id ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hoveredCard === classroom.id 
                  ? '0 8px 25px rgba(0,0,0,0.1)' 
                  : '0 4px 6px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={() => setHoveredCard(classroom.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={styles.gridCardHeader}>
                <h3 className={styles.gridRoomName}>{classroom.name}</h3>
                <span 
                  className={styles.gridStatusBadge}
                  style={{
                    backgroundColor: statusColor + '20',
                    color: statusColor
                  }}
                >
                  {statusText}
                </span>
              </div>
              
              <div className={styles.gridInfoSection}>
                <div className={styles.gridInfoItem}>
                  <span className={styles.gridInfoLabel}>수용인원</span>
                  <span className={styles.gridInfoValue}>{classroom.capacity}명</span>
                </div>
                <div className={styles.gridInfoItem}>
                  <span className={styles.gridInfoLabel}>현재사용</span>
                  <span className={styles.gridInfoValue}>{classroom.currentUsers}명</span>
                </div>
                <div className={styles.gridInfoItem}>
                  <span className={styles.gridInfoLabel}>다음수업</span>
                  <span className={styles.gridInfoValue}>{classroom.nextClass}</span>
                </div>
                <div className={styles.gridInfoItem}>
                  <span className={styles.gridInfoLabel}>건물</span>
                  <span className={styles.gridInfoValue}>{classroom.building}</span>
                </div>
              </div>
              
              <div className={styles.gridActions}>
                <button 
                  className={styles.gridActionButton}
                  onClick={() => handleCardAction('reserve', classroom)}
                >
                  예약
                </button>
                <button 
                  className={`${styles.gridActionButton} ${styles.gridPrimaryAction}`}
                  onClick={() => handleCardAction('detail', classroom)}
                >
                  상세보기
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default TabletMainContent;