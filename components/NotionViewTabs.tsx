import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './NotionViewTabs.module.css';

// ビュータブの情報
export type ViewTab = {
  id: string;
  name: string;
  path: string;
  pageId?: string; // Notionページ/ビューID（必要に応じて使用）
};

// タブコンポーネントの props 型定義
type NotionViewTabsProps = {
  tabs: ViewTab[];
};

const NotionViewTabs: React.FC<NotionViewTabsProps> = ({ tabs }) => {
  const router = useRouter();
  // 現在のパスを元にアクティブなタブを判断
  const currentPath = router.pathname + (router.query.view ? `/${router.query.view}` : '');
  
  // モバイル画面でのハンバーガーメニュー状態
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // レスポンシブ対応
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // 初期チェック
    checkIfMobile();
    
    // リサイズイベントで確認
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // メニューの切り替え
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  // クリック時にメニューを閉じる
  const handleTabClick = () => {
    if (isMobile) {
      setIsMenuOpen(false);
    }
  };
  
  // ページ外クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest(`.${styles.mobileTabContainer}`)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);
  
  return (
    <>
      {/* モバイル画面でのハンバーガーメニュー */}
      {isMobile && (
        <div className={styles.mobileTabContainer}>
          <button 
            className={`${styles.hamburgerButton} ${isMenuOpen ? styles.open : ''}`}
            onClick={toggleMenu}
            aria-label="メニュー"
            aria-expanded={isMenuOpen}
          >
            <span className={styles.hamburgerIcon}></span>
            <span className={styles.hamburgerIcon}></span>
            <span className={styles.hamburgerIcon}></span>
          </button>
          
          {isMenuOpen && (
            <div className={styles.mobileMenu}>
              {tabs.map((tab) => (
                <Link 
                  key={tab.id} 
                  href={tab.path}
                  className={`${styles.mobileTab} ${tab.path === currentPath || (tab.path === '/' && currentPath === '/') ? styles.active : ''}`}
                  onClick={handleTabClick}
                >
                  {tab.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* デスクトップ画面でのタブメニュー */}
      {!isMobile && (
        <div className={styles.tabContainer}>
          {tabs.map((tab) => (
            <Link 
              key={tab.id} 
              href={tab.path}
              className={`${styles.tab} ${tab.path === currentPath || (tab.path === '/' && currentPath === '/') ? styles.active : ''}`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export default NotionViewTabs;
