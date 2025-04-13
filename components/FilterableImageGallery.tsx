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
  
  // デバッグ用にカテゴリ情報を出力
  useEffect(() => {
    console.log('Filterable Gallery - Available categories:', categories)
    console.log('RecordMap structure:', recordMap ? Object.keys(recordMap) : 'null')
    
    if (recordMap && recordMap.block) {
      // ページブロックの数をカウント
      const pageBlocks = Object.entries(recordMap.block).filter(
        ([_, block]: [string, any]) => (block as any)?.value?.type === 'page'
      )
      console.log(`Page blocks count: ${pageBlocks.length}`)
      
      // カテゴリが取得できない場合のデバッグ情報
      if (categories.length === 0 && recordMap.collection) {
        const collectionKeys = Object.keys(recordMap.collection)
        console.log('Collection keys:', collectionKeys)
        
        if (collectionKeys.length > 0) {
          const firstCollection = recordMap.collection[collectionKeys[0]]
          console.log('First collection:', firstCollection ? 'exists' : 'null')
          
          if (firstCollection && firstCollection.value) {
            console.log('Collection schema keys:', 
              firstCollection.value.schema ? Object.keys(firstCollection.value.schema) : 'no schema')
              
            // スキーマのプロパティを確認
            if (firstCollection.value.schema) {
              Object.entries(firstCollection.value.schema).forEach(([key, value]) => {
                console.log(`Schema property ${key}:`, (value as any).name, (value as any).type)
              })
            }
          }
        }
      }
    }
  }, [recordMap, categories])

  // フィルタとソートの変更に応じて表示するページIDを更新
  useEffect(() => {
    if (!recordMap) return

    try {
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
      {/* デバッグ用に情報を表示 */}
      <div style={{ padding: '10px', margin: '10px 0', backgroundColor: '#ffefef', border: '1px solid #ffcfcf', borderRadius: '4px', fontSize: '14px', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
        <p><strong>デバッグ情報</strong>:</p>
        <p>利用可能なカテゴリ数: {categories.length}</p>
        {categories.length > 0 ? (
          <ul style={{margin: '5px 0', paddingLeft: '20px'}}>
            {categories.map(cat => <li key={cat}>{cat}</li>)}
          </ul>
        ) : (
          <p>カテゴリが見つかりませんでした。</p>
        )}
        <p>表示可能なページID数: {visiblePageIds.length}</p>
      </div>
      
      {categories.length > 0 ? (
        <FilterSort 
          categories={categories}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
        />
      ) : (
        <div style={{ padding: '15px', margin: '15px 0', backgroundColor: '#f0f0ff', border: '1px solid #d0d0ff', borderRadius: '4px', textAlign: 'center', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
          <p>カテゴリが見つかりませんでした。Notionデータベースに「カテゴリ」または「Category」プロパティを追加してください。</p>
        </div>
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
