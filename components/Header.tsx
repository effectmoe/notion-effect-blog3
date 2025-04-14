import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FaGithub } from '@react-icons/all-files/fa/FaGithub'
import { FaInstagram } from '@react-icons/all-files/fa/FaInstagram'
import { FaFacebook } from '@react-icons/all-files/fa/FaFacebook'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import cs from 'classnames'

import * as config from '@/lib/config'
import { useDarkMode } from '@/lib/use-dark-mode'
import styles from './Header.module.css'

// ナビゲーションリンクの型定義
type MenuItem = {
  id: string
  title: string
  url: string
}

// デフォルトのメニュー項目
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'all', title: 'すべて', url: '/' },
  { id: 'blog', title: 'ブログ', url: '/blog' },
  { id: 'website', title: 'Webサイト', url: '/website' },
  { id: 'profile', title: 'プロフィール', url: '/profile' },
  { id: 'news', title: '新着順', url: '/news' }
]

type HeaderProps = {
  menuItems?: MenuItem[]
}

export function HeaderImpl({ menuItems = DEFAULT_MENU_ITEMS }: HeaderProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [hasMounted, setHasMounted] = useState(false)

  // マウント状態の確認
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // スクロール検出用のイベントリスナー
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  // ダークモード切り替え
  const onToggleDarkMode = React.useCallback(
    (e) => {
      e.preventDefault()
      toggleDarkMode()
    },
    [toggleDarkMode]
  )

  // 現在のページに基づいてアクティブなメニュー項目を判断
  const isActive = (url: string) => {
    if (url === '/' && router.pathname === '/') {
      return true
    }
    return router.pathname.startsWith(url) && url !== '/'
  }

  // メニューの開閉を切り替える
  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  // メニュー項目をクリックした時の処理
  const handleMenuItemClick = () => {
    // モバイル表示の場合はメニューを閉じる
    if (isMobile) {
      setMenuOpen(false)
    }
  }

  return (
    <header 
      className={cs(
        styles.header, 
        scrolled && styles.headerScrolled,
        isDarkMode && styles.darkHeader
      )}
    >
      <div className={styles.headerContent}>
        {/* ロゴ部分とデスクトップメニュー */}
        <div className={styles.headerLeftSection}>
          <Link href="/" className={styles.logo} onClick={handleMenuItemClick}>
            <span className={styles.siteName}>{config.name}</span>
          </Link>
          
          {!isMobile && (
            <nav className={styles.desktopNav}>
              <ul className={styles.navList}>
                {menuItems.map((item) => (
                  <li key={item.id} className={styles.navItem}>
                    <Link 
                      href={item.url} 
                      className={cs(
                        styles.navLink,
                        isActive(item.url) && styles.activeLink
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        {/* ヘッダー右側の要素 */}
        <div className={styles.headerRight}>
          {/* ダークモード切り替えボタン */}
          {hasMounted && (
            <button 
              className={styles.iconButton} 
              onClick={onToggleDarkMode}
              aria-label={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {isDarkMode ? <IoSunnyOutline size={22} /> : <IoMoonSharp size={22} />}
            </button>
          )}

          {/* SNSリンク */}
          {config.instagram && (
            <a
              href={`https://instagram.com/${config.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cs(styles.iconButton, styles.instagramButton)}
              aria-label="Instagramを見る"
            >
              <FaInstagram size={20} />
            </a>
          )}

          {config.facebook && (
            <a
              href={`https://facebook.com/${config.facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cs(styles.iconButton, styles.facebookButton)}
              aria-label="Facebookを見る"
            >
              <FaFacebook size={20} />
            </a>
          )}

          {/* モバイルメニューボタン */}
          {isMobile && (
            <button 
              className={styles.mobileMenuButton} 
              onClick={toggleMenu}
              aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
              aria-expanded={menuOpen}
            >
              <div className={`${styles.hamburgerIcon} ${menuOpen ? styles.open : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* モバイルメニュー（ハンバーガーメニュー） */}
      {isMobile && (
        <div className={cs(
          styles.mobileMenu,
          menuOpen ? styles.mobileMenuOpen : styles.mobileMenuClosed
        )}>
          <nav className={styles.mobileNav}>
            <ul className={styles.mobileNavList}>
              {menuItems.map((item) => (
                <li key={item.id} className={styles.mobileNavItem}>
                  <Link 
                    href={item.url} 
                    className={cs(
                      styles.mobileNavLink,
                      isActive(item.url) && styles.activeMobileLink
                    )}
                    onClick={handleMenuItemClick}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}

export const Header = React.memo(HeaderImpl)
