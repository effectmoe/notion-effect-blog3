import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './HamburgerMenu.module.css';

type MenuItem = {
  id: string;
  title: string;
  url: string;
  isActive?: boolean;
};

// 仮のメニュー項目（後でNotion DBから取得する内容に置き換え）
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'all', title: 'すべて', url: '/' },
  { id: 'blog', title: 'ブログ', url: '/blog' },
  { id: 'website', title: 'Webサイト', url: '/website' },
  { id: 'profile', title: 'プロフィール', url: '/profile' },
  { id: 'latest', title: '新着順', url: '/latest' }
];

type HamburgerMenuProps = {
  menuItems?: MenuItem[];
  currentPath?: string;
};

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ 
  menuItems = DEFAULT_MENU_ITEMS,
  currentPath = '/'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // アクティブなメニュー項目を設定
  const items = menuItems.map(item => ({
    ...item,
    isActive: currentPath === item.url
  }));

  // ウィンドウサイズによるモバイル判定
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // 初期チェック
    checkIfMobile();

    // リサイズイベント
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // メニュー開閉の切り替え
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // モバイルメニューが開いているときにページ外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest(`.${styles.hamburgerMenu}`)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <nav className={styles.hamburgerMenu}>
      {isMobile ? (
        <>
          <button 
            className={`${styles.hamburgerButton} ${isOpen ? styles.open : ''}`}
            onClick={toggleMenu}
            aria-label="メニュー"
            aria-expanded={isOpen}
          >
            <span className={styles.hamburgerIcon}></span>
            <span className={styles.hamburgerIcon}></span>
            <span className={styles.hamburgerIcon}></span>
          </button>
          
          <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
            {items.map(item => (
              <Link 
                key={item.id} 
                href={item.url}
                className={`${styles.menuItem} ${item.isActive ? styles.active : ''}`}
                onClick={() => setIsOpen(false)}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.desktopMenu}>
          {items.map(item => (
            <Link 
              key={item.id} 
              href={item.url}
              className={`${styles.menuItem} ${item.isActive ? styles.active : ''}`}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default HamburgerMenu;
