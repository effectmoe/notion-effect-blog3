import React, { useState, useEffect } from 'react'
import FilterSort from './FilterSort'
import { extractCategories, getFilteredSortedPageIds } from '../lib/notion-display-utils'
import styles from './FilterableImageGallery.module.css'

type FilterableImageGalleryProps = {
  recordMap: any;
  children: React.ReactNode;
}

const FilterableImageGallery: React.FC<FilterableImageGalleryProps> = ({ 
  recordMap, 
  children 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [visiblePageIds, setVisiblePageIds] = useState<string[]>([])
  
  // 利用可能なカテゴリを抽出
  const categories = extractCategories(recordMap)

  // フィルタとソートの変更に応じて表示するページIDを更新
  useEffect(() => {
    if (!recordMap) return

    try {
      // ページブロックのIDを取得
      const pageBlocks = Object.entries(recordMap.block || {}).filter(
        ([_, block]: [string, any]) => block?.value?.type === 'page'
      )
      
      console.log(`Total page blocks found: ${pageBlocks.length}`)
      
      if (pageBlocks.length > 0) {
        // 一部のページブロック情報をデバッグ用に表示
        const sampleBlock = pageBlocks[0][1]?.value
        console.log('Sample page block:', {
          id: sampleBlock?.id,
          type: sampleBlock?.type,
          parent_id: sampleBlock?.parent_id,
          parent_table: sampleBlock?.parent_table,
          properties: sampleBlock?.properties ? Object.keys(sampleBlock.properties) : 'none'
        })
      }
      
      // 表示するページIDを取得
      const pageIds = getFilteredSortedPageIds(recordMap, selectedCategory, sortOrder)
      setVisiblePageIds(pageIds)
      
      console.log(`Filter applied: ${selectedCategory || 'All'}, Sort: ${sortOrder}, Visible pages: ${pageIds.length}`)
      if (pageIds.length > 0) {
        console.log('First few visible page IDs:', pageIds.slice(0, 3))
      }
    } catch (err) {
      console.error('Error applying filter/sort:', err)
      // エラー時はすべてのページIDを表示
      setVisiblePageIds([])
    }
  }, [recordMap, selectedCategory, sortOrder])
  
  // カテゴリの変更を処理
  const handleFilterChange = (category: string) => {
    console.log(`Changing category to: ${category || 'All'}`)
    setSelectedCategory(category)
  }
  
  // ソート順の変更を処理
  const handleSortChange = (order: string) => {
    console.log(`Changing sort order to: ${order}`)
    setSortOrder(order)
  }

  // CSSを使用してフィルタリングされたアイテムを制御
  // 全体をラップして、フィルターとソートコントロールを追加するだけ
  return (
    <div className={styles.filterableGalleryContainer}>
      {categories.length > 0 && (
        <FilterSort 
          categories={categories}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
        />
      )}
      
      <style jsx global>{`
        /* Notionのギャラリービューのコレクションカードを対象にするスタイル */
        .notion-collection-card,
        .notion-gallery-view [data-block-id],
        .notion-collection-view-table [data-block-id] {
          /* デフォルトは表示 */
          transition: opacity 0.3s ease-in-out;
        }
        
        ${visiblePageIds.length > 0 ? 
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

          /* カテゴリが選択されていない場合はすべて表示 */
          ${!selectedCategory ? `
          .notion-collection-card,
          .notion-gallery-view [data-block-id],
          .notion-collection-view-table [data-block-id] {
            opacity: 1;
            filter: none;
          }
          ` : ''}
          `
          : 
          /* 表示すべきIDのリストがない場合はすべて表示 */
          `
          .notion-collection-card,
          .notion-gallery-view [data-block-id],
          .notion-collection-view-table [data-block-id] {
            opacity: 1;
            filter: none;
          }
          `
        }
      `}</style>
      
      {/* 元のNotionページコンテンツをそのまま表示 */}
      {children}
    </div>
  )
}

export default FilterableImageGallery
