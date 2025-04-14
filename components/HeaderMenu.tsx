import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './HeaderMenu.module.css'

type MenuItem = {
  id: string
  title: string
  url: string
}

type HeaderMenuProps = {
  menuItems: MenuItem[]
}

const HeaderMenu: React.FC<HeaderMenuProps> = ({ menuItems }) => {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 現在のページに基づいてアクティブなメニュー項目を判断
  const isActive = (url: string) => {
    if (url === '/' && router.pathname === '/') {
      return true
    }
    return router.pathname.startsWith(url) && url !== '/'
  }

  // ウィンドウサイズの変更を監視してモバイル表示を判断
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // 初期チェック
    checkIsMobile()
    
    // リサイズイベントリスナーを設定
    window.addEventListener('resize', checkIsMobile)
    
    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  // メニューの開閉を切り替える
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // メニュー項目をクリックした時の処理
  const handleMenuItemClick = () => {
    // モバイル表示の場合はメニューを閉じる
    if (isMobile) {
      setIsMenuOpen(false)
    }
  }

  return (
    <nav className={styles.headerNav}>
      {/* モバイル用ハンバーガーボタン */}
      {isMobile && (
        <button 
          className={styles.hamburgerButton}
          onClick={toggleMenu}
          aria-label="メニューを開く"
          aria-expanded={isMenuOpen}
        >
          <div className={`${styles.hamburgerIcon} ${isMenuOpen ? styles.open : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      )}

      {/* デスクトップメニューまたはモバイルオープン時のメニュー */}
      <div className={`
        ${styles.menuContainer}
        ${isMobile ? styles.mobileMenu : styles.desktopMenu}
        ${isMobile && isMenuOpen ? styles.open : ''}
      `}>
        <ul className={styles.menuList}>
          {menuItems.map((item) => (
            <li key={item.id} className={styles.menuItem}>
              <Link 
                href={item.url}
                className={`${styles.menuLink} ${isActive(item.url) ? styles.active : ''}`}
                onClick={handleMenuItemClick}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default HeaderMenu
