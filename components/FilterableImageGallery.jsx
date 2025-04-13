import React, { useState, useEffect, useRef } from 'react'
import FilterSort from './FilterSort'
import { extractCategories, getFilteredSortedPageIds } from '../lib/notion-display-utils'
import styles from './FilterableImageGallery.module.css'

const FilterableImageGallery = ({ recordMap, children }) => {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [visiblePageIds, setVisiblePageIds] = useState([])
  const [notionGalleryLoaded, setNotionGalleryLoaded] = useState(false)
  const filterSortRef = useRef(null)
  
  // 利用可能なカテゴリを抽出
  const categories = extractCategories(recordMap)
  
  // NotionのギャラリービューのDOM要素を監視
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // MutationObserverを使ってNotionギャラリーが読み込まれたかを検出
    const observer = new MutationObserver((mutations) => {
      const galleryView = document.querySelector('.notion-gallery-view')
      if (galleryView && !notionGalleryLoaded) {
        console.log('Notion gallery view detected')
        setNotionGalleryLoaded(true)
        
        // フィルタとソートをギャラリー内の適切な位置に配置
        if (filterSortRef.current && categories.length > 0) {
          try {
            // フィルタとソートをギャラリーの上部に挿入
            galleryView.style.position = 'relative'
            galleryView.style.paddingTop = '50px'
            galleryView.insertBefore(filterSortRef.current, galleryView.firstChild)
            
            console.log('Filter and sort controls positioned')
          } catch (err) {
            console.error('Error positioning filter and sort controls:', err)
          }
        }
      }
    })
    
    // bodyを監視開始
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => {
      // コンポーネントのアンマウント時に監視を停止
      observer.disconnect()
    }
  }, [categories.length, notionGalleryLoaded])
  
  // フィルタとソートの変更に応じて表示するページIDを更新
  useEffect(() => {
    if (!recordMap) return

    try {
      // 表示するページIDを取得
      const pageIds = getFilteredSortedPageIds(recordMap, selectedCategory, sortOrder)
      setVisiblePageIds(pageIds)
      
      console.log(`Filter applied: ${selectedCategory || 'All'}, Sort: ${sortOrder}, Visible pages: ${pageIds.length}`)
    } catch (err) {
      console.error('Error applying filter/sort:', err)
      // エラー時はすべてのページIDを表示
      setVisiblePageIds([])
    }
  }, [recordMap, selectedCategory, sortOrder])
  
  // カテゴリの変更を処理
  const handleFilterChange = (category) => {
    console.log(`Changing category to: ${category || 'All'}`)
    setSelectedCategory(category)
  }
  
  // ソート順の変更を処理
  const handleSortChange = (order) => {
    console.log(`Changing sort order to: ${order}`)
    setSortOrder(order)
  }

  return (
    <div className={styles.filterableGalleryContainer}>
      {/* 開発環境のみデバッグ情報を表示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className={styles.debugInfo}>
          <p><strong>デバッグ情報</strong>:</p>
          <p>利用可能なカテゴリ数: {categories.length}</p>
          {categories.length > 0 ? (
            <ul>
              {categories.map(cat => <li key={cat}>{cat}</li>)}
            </ul>
          ) : (
            <p>カテゴリが見つかりませんでした。</p>
          )}
          <p>表示可能なページID数: {visiblePageIds.length}</p>
          <p>NotionギャラリーDOM検出: {notionGalleryLoaded ? 'あり' : 'なし'}</p>
        </div>
      )}
      
      {/* フィルタとソートのコントロール（DOMに挿入されるまで非表示） */}
      {categories.length > 0 && (
        <div ref={filterSortRef} className={styles.filterSortWrapper} style={{ display: 'none' }}>
          <FilterSort 
            categories={categories}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
          />
        </div>
      )}
      
      {/* フィルタリングとソートのスタイル */}
      <style jsx global>{`
        /* Notionのギャラリービューのコレクションカードを対象にするスタイル */
        .notion-collection-card,
        .notion-gallery-view [data-block-id],
        .notion-collection-view-table [data-block-id] {
          /* デフォルトは表示 */
          transition: opacity 0.3s ease-in-out;
        }
        
        ${visiblePageIds.length > 0 && selectedCategory ? 
          /* 表示するページを指定 */
          `
          /* 一度すべて非表示にする */
          .notion-collection-card,
          .notion-gallery-view [data-block-id],
          .notion-collection-view-table [data-block-id] {
            opacity: 0.3;
            filter: grayscale(50%);
          }

          /* 対象のページだけ表示 */
          ${visiblePageIds.map(id => 
            `.notion-collection-card[data-block-id="${id}"],
             .notion-gallery-view [data-block-id="${id}"],
             .notion-collection-view-table [data-block-id="${id}"]`
          ).join(', ')} {
            opacity: 1;
            filter: none;
          }
          `
          : 
          /* カテゴリ選択がない場合はすべて表示 */
          `
          .notion-collection-card,
          .notion-gallery-view [data-block-id],
          .notion-collection-view-table [data-block-id] {
            opacity: 1;
            filter: none;
          }
          `
        }
        
        /* DOMに挿入された後のスタイル */
        .notion-gallery-view .${styles.filterSortWrapper} {
          display: block !important;
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
        }
      `}</style>
      
      {/* 元のNotionページコンテンツをそのまま表示 */}
      {children}
    </div>
  )
}

export default FilterableImageGallery
