// components/mobile/MobileBottomNav.tsx
import React from 'react';
import styles from '../../styles/mobile/mobile.module.css';

interface MobileBottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ 
  activeTab = 'status',
  onTabChange 
}) => {
  const navItems = [
    { id: 'status', label: '현황', color: '#3B82F6' },
    { id: 'reservation', label: '예약', color: '#6B7280' },
    { id: 'settings', label: '설정', color: '#6B7280' }
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map(item => (
        <a
          key={item.id}
          href="#"
          className={`${styles.navItem} ${
            activeTab === item.id ? styles.navItemActive : ''
          }`}
          onClick={(e) => {
            e.preventDefault();
            onTabChange?.(item.id);
          }}
        >
          <div 
            className={styles.navIcon}
            style={{ 
              backgroundColor: activeTab === item.id ? '#3B82F6' : '#6B7280' 
            }}
          />
          {item.label}
        </a>
      ))}
    </nav>
  );
};

export default MobileBottomNav;