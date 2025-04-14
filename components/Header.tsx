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
    // メニューを閉じる
    setMenuOpen(false)
  }

  useEffect(() => {
    // DOMが完全にロードされた後に実行
    const moveHeaderElements = () => {
      // 検索ボックスの要素を取得
      const searchBox = document.querySelector('.notion-search');
      
      if (!searchBox) {
        // 要素が見つからない場合は少し待ってから再試行
        setTimeout(moveHeaderElements, 100);
        return;
      }
      
      // ヘッダー右側要素を取得
      const headerRight = document.querySelector(`.${styles.headerRight}`);
      
      if (!headerRight) return;
      
      // 親要素（body）を取得
      const parentElement = searchBox.parentElement;
      
      if (!parentElement) return;
      
      // ヘッダー右側要素を検索ボックスの前に移動
      parentElement.insertBefore(headerRight, searchBox);
      
      // クラスを追加して検索ボックスの隣に配置されるようにする
      headerRight.classList.add(styles.alignedWithSearch);
      searchBox.classList.add(styles.searchContainer);
    };
    
    // ページが読み込まれたら実行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', moveHeaderElements);
    } else {
      moveHeaderElements();
    }
    
    // 動的に読み込まれる可能性があるので、数秒後にももう一度実行
    setTimeout(moveHeaderElements, 1000);
    
    // クリーンアップ
    return () => {
      document.removeEventListener('DOMContentLoaded', moveHeaderElements);
    };
  }, [styles.headerRight, styles.alignedWithSearch, styles.searchContainer]);

  return (
    <header 
      className={cs(
        styles.header, 
        scrolled && styles.headerScrolled,
        isDarkMode && styles.darkHeader
      )}
    >
      <div className={styles.headerContent}>
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

          {/* ハンバーガーメニューボタン（すべての画面サイズで表示） */}
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

      {/* メニュー（すべての画面サイズで同じ動作） */}
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
