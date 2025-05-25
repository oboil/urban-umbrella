// components/mobile/MobileQuickStats.tsx
import React from 'react';
import type { ClassroomFake } from '../../types/classroom';
import styles from '../../styles/mobile/mobile.module.css';

interface MobileQuickStatsProps {
  data: ClassroomFake[];
}

const MobileQuickStats: React.FC<MobileQuickStatsProps> = ({ data }) => {
  const available = data.filter(room => room.status === 'available').length;
  const occupied = data.filter(room => room.status === 'occupied').length;
  const maintenance = data.filter(room => room.status === 'maintenance').length;
  
  return (
    <div className={styles.quickStats}>
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statNumber} style={{ color: '#10B981' }}>
            {available}
          </div>
          <div className={styles.statLabel}>사용가능</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNumber} style={{ color: '#EF4444' }}>
            {occupied}
          </div>
          <div className={styles.statLabel}>사용중</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNumber} style={{ color: '#F59E0B' }}>
            {maintenance}
          </div>
          <div className={styles.statLabel}>점검중</div>
        </div>
      </div>
    </div>
  );
};

export default MobileQuickStats;