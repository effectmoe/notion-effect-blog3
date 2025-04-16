import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FaGithub } from '@react-icons/all-files/fa/FaGithub'
import { FaInstagram } from '@react-icons/all-files/fa/FaInstagram'
import { FaFacebook } from '@react-icons/all-files/fa/FaFacebook'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import { IoSearchOutline } from '@react-icons/all-files/io5/IoSearchOutline'
import cs from 'classnames'

import * as config from '@/lib/config'
import { useDarkMode } from '@/lib/use-dark-mode'
import styles from './Header.module.css'
import { notionViews } from '@/lib/notion-views'

// ナビゲーションリンクの型定義
type MenuItem = {
  id: string
  title: string
  url: string
}

// notionViewsからメニュー項目に変換
const DEFAULT_MENU_ITEMS: MenuItem[] = notionViews.map(view => ({
  id: view.id,
  title: view.name,
  url: view.path
}))

type HeaderProps = {
  menuItems?: MenuItem[]
}

export function HeaderImpl({ menuItems = DEFAULT_MENU_ITEMS }: HeaderProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [hasMounted, setHasMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSearchVisible, setIsSearchVisible] = useState(false)

  // マウント状態の確認
  useEffect(() => {
    setHasMounted(true)
    
    // 画面サイズのチェック
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // 初期チェック
    checkIsMobile()
    
    // リサイズイベントリスナーを設定
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // スクロール検出用のイベントリスナー
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
    // メニューを開くときは検索を閉じる
    if (!menuOpen) {
      setIsSearchVisible(false)
    }
  }

  // 検索の表示/非表示を切り替える
  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible)
    // 検索を開くときはメニューを閉じる
    if (!isSearchVisible) {
      setMenuOpen(false)
    }
  }

  // メニュー項目をクリックした時の処理
  const handleMenuItemClick = () => {
    // メニューを閉じる
    setMenuOpen(false)
  }

  // ロゴコンポーネント
  const Logo = () => (
    <Link href="/" className={styles.logo}>
      <span className={styles.logoText}>CafeKinesi</span>
    </Link>
  )

  return (
    <header 
      className={cs(
        styles.header, 
        scrolled && styles.headerScrolled,
        isDarkMode && styles.darkHeader
      )}
    >
      <div className={styles.headerContent}>
        {/* ロゴ */}
        <div className={styles.headerLeft}>
          <Logo />
        </div>

        {/* デスクトップ用ナビゲーション - メニュー項目はハンバーガーメニューにのみ表示 */}
        <div className={styles.desktopNav}>
          {/* ここは空にして、メニュー項目はハンバーガーメニューにのみ表示する */}
        </div>

        {/* ヘッダー右側の要素 */}
        <div className={styles.headerRight}>
          {/* 検索ボタン */}
          <button 
            className={styles.iconButton} 
            onClick={toggleSearch}
            aria-label={isSearchVisible ? '検索を閉じる' : '検索を開く'}
          >
            <IoSearchOutline size={22} />
          </button>

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

          {/* ハンバーガーメニューボタン（常に表示） */}
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
        </div>
      </div>

      {/* 検索オーバーレイ */}
      <div className={cs(
        styles.searchOverlay,
        isSearchVisible ? styles.searchVisible : styles.searchHidden
      )}>
        <div className={styles.searchContainer}>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="検索..."
            aria-label="検索"
          />
        </div>
      </div>

      {/* モバイルメニュー（常に表示） */}
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
    </header>
  )
}

export const Header = React.memo(HeaderImpl)
