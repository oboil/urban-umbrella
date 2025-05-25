// components/tablet/TabletBottomNav.tsx
import React from 'react';
import styles from '../../styles/tablet/tablet.module.css';

interface TabletBottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const TabletBottomNav: React.FC<TabletBottomNavProps> = ({ 
  activeTab = 'status',
  onTabChange 
}) => {
  const navItems = [
    { 
      id: 'status', 
      label: '현황', 
    },
    { 
      id: 'reservation', 
      label: '예약', 
    },
    { 
      id: 'settings', 
      label: '설정',
    }
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map(item => (
        <button
          key={item.id}
          className={`${styles.navItem} ${
            activeTab === item.id ? styles.navItemActive : ''
          }`}
          onClick={() => onTabChange?.(item.id)}
        >
          <div 
            className={styles.navIcon}
            style={{ 
              backgroundColor: activeTab === item.id ? '#3B82F6' : '#6B7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
          >
            {item.icon}
          </div>
          <span style={{
            color: activeTab === item.id ? '#3B82F6' : '#6B7280'
          }}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default TabletBottomNav;