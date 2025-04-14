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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 現在のパスに基づいてアクティブなメニュー項目を判定
  const isActive = (url: string) => {
    return router.asPath === url || 
           (url !== '/' && router.asPath.startsWith(url))
  }

  // ウィンドウサイズの変更を監視
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    // 初期チェック
    checkIfMobile()
    
    // リサイズイベントのリスナー
    window.addEventListener('resize', checkIfMobile)
    
    // モバイルメニューを開いているときにスクロールを無効化
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // デフォルトの「すべて」タブを追加
  const allMenuItems = [
    { id: 'all', title: 'すべて', url: '/' },
    ...menuItems
  ]

  // モバイルメニューの切り替え
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // ナビゲーションリンクをクリックしたときの処理
  const handleNavLinkClick = () => {
    // モバイルメニューが開いている場合は閉じる
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <nav className={styles.headerNav}>
      {/* モバイル表示のハンバーガーボタン */}
      {isMobile && (
        <button
          className={styles.hamburgerButton}
          onClick={toggleMobileMenu}
          aria-label="メニューを開く"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={`${styles.hamburgerIcon} ${isMobileMenuOpen ? styles.open : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      )}

      {/* デスクトップ表示のタブメニュー */}
      {!isMobile && (
        <div className={styles.desktopMenu}>
          {allMenuItems.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              className={`${styles.menuItem} ${isActive(item.url) ? styles.active : ''}`}
              onClick={handleNavLinkClick}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}

      {/* モバイル表示のドロップダウンメニュー */}
      {isMobile && isMobileMenuOpen && (
        <div className={styles.mobileMenuOverlay}>
          <div className={styles.mobileMenu}>
            {allMenuItems.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                className={`${styles.mobileMenuItem} ${isActive(item.url) ? styles.active : ''}`}
                onClick={handleNavLinkClick}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

export default HeaderMenu
