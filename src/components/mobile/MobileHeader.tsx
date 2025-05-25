// components/mobile/MobileHeader.tsx
import React from 'react';
import styles from '../../styles/mobile/mobile.module.css';

interface MobileHeaderProps {
  searchQuery?: string;
  onSearch?: (query: string) => void;
  onMenuClick?: () => void;
  title?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  searchQuery = '',
  onSearch, 
  onMenuClick,
  title = '강의실 현황'
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value);
  };

  const handleMenuClick = () => {
    console.log('🍔 햄버거 아이콘 클릭됨!');
    onMenuClick?.();
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        {/* 햄버거 아이콘 */}
        <button 
          className={styles.menuButton}
          onClick={handleMenuClick}
          aria-label="메뉴 열기"
        >
          <div className={styles.menuIcon}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
        
        <h1 className={styles.headerTitle}>{title}</h1>
        <div className={styles.headerSpacer}></div>
      </div>
      
      <div className={styles.searchContainer}>
        <input 
          type="text" 
          placeholder="강의실 검색..." 
          className={styles.searchInput}
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
    </header>
  );
};

export default MobileHeader;