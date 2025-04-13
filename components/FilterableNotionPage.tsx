import React, { useState, useEffect } from 'react'
import { NotionPage } from './NotionPage'
import FilterSort from './FilterSort'
import { extractCategories, getFilteredSortedPageIds } from '../lib/notion-display-utils'

// NotionPageをフィルタとソート機能で拡張するラッパーコンポーネント
const FilterableNotionPage: React.FC<any> = (props) => {
  const { recordMap } = props
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [visiblePageIds, setVisiblePageIds] = useState<string[]>([])
  
  // 利用可能なカテゴリを抽出
  const categories = extractCategories(recordMap)

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
  const handleFilterChange = (category: string) => {
    console.log(`Changing category to: ${category || 'All'}`)
    setSelectedCategory(category)
  }
  
  // ソート順の変更を処理
  const handleSortChange = (order: string) => {
    console.log(`Changing sort order to: ${order}`)
    setSortOrder(order)
  }

  // NotionPageに拡張プロパティを渡す
  const enhancedProps = {
    ...props,
    // visiblePageIds: 表示するページIDのリスト
    // 重要: ここでrecordMapは変更せず、追加のプロパティとして渡す
    visiblePageIds
  }
  
  return (
    <>
      {categories.length > 0 && (
        <FilterSort 
          categories={categories}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
        />
      )}
      
      <NotionPage {...enhancedProps} />
    </>
  )
}

export default FilterableNotionPage
