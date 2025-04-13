import { getPageProperty } from 'notion-utils'

// Notionページからカテゴリを抽出する関数
export function extractCategories(recordMap: any): string[] {
  if (!recordMap || !recordMap.collection) {
    return []
  }

  try {
    // コレクションからスキーマ情報を取得
    const collectionValues = Object.values(recordMap.collection) as Array<{value: any}>
    const collection = collectionValues[0]?.value
    if (!collection || !collection.schema) {
      return []
    }

    // カテゴリとしてマークされたプロパティを探す（通常は 'select' タイプ）
    const categoryProp = Object.entries(collection.schema).find(
      ([_, value]: [string, any]) => {
        return (value as any).name.toLowerCase() === 'category' || 
               (value as any).name.toLowerCase() === 'カテゴリ'
      }
    )

    if (!categoryProp) {
      // バックアップ：タグやタイプなど他の選択系プロパティを探す
      const selectProps = Object.entries(collection.schema).filter(
        ([_, value]: [string, any]) => (value as any).type === 'select'
      )
      
      if (selectProps.length > 0) {
        const firstSelectProp = selectProps[0]
        
        const categoryPropId = firstSelectProp[0]
        // ページのブロックからカテゴリ値を抽出
        const categories = new Set<string>()
        
        Object.values(recordMap.block).forEach((block: any) => {
          if (block.value && block.value.properties) {
            const category = getPageProperty(categoryPropId, block.value, recordMap)
            if (category && typeof category === 'string') {
              categories.add(category)
            }
          }
        })
        
        return Array.from(categories).sort()
      }
      
      return []
    }

    const categoryPropId = categoryProp[0]

    // ページのブロックからカテゴリ値を抽出
    const categories = new Set<string>()
    
    Object.values(recordMap.block).forEach((block: any) => {
      if (block.value && block.value.properties) {
        const category = getPageProperty(categoryPropId, block.value, recordMap)
        if (category && typeof category === 'string') {
          categories.add(category)
        }
      }
    })

    return Array.from(categories).sort()
  } catch (err) {
    console.error('Failed to extract categories:', err)
    return []
  }
}

// Notionブロック配列からカテゴリを抽出
export function getPageCategory(page: any, recordMap: any): string {
  if (!page || !recordMap || !recordMap.collection) {
    return ''
  }
  
  try {
    // コレクションからスキーマ情報を取得
    const collectionValues = Object.values(recordMap.collection) as Array<{value: any}>
    const collection = collectionValues[0]?.value
    if (!collection || !collection.schema) {
      return ''
    }

    // カテゴリプロパティを見つける
    const categoryProp = Object.entries(collection.schema).find(
      ([_, value]: [string, any]) => 
        value.name.toLowerCase() === 'category' || 
        value.name.toLowerCase() === 'カテゴリ'
    )

    if (!categoryProp) {
      // バックアップ：最初のセレクトタイプのプロパティを使用
      const selectProps = Object.entries(collection.schema).filter(
        ([_, value]: [string, any]) => value.type === 'select'
      )
      
      if (selectProps.length > 0) {
        const fallbackProp = selectProps[0]
        
        const fallbackPropId = fallbackProp[0]
        const fallbackCategory = getPageProperty(fallbackPropId, page, recordMap)
        return fallbackCategory ? fallbackCategory.toString() : ''
      }
      
      return ''
    }

    const categoryPropId = categoryProp[0]
    
    // ページのカテゴリを取得
    const category = getPageProperty(categoryPropId, page, recordMap)
    return category ? category.toString() : ''
  } catch (err) {
    console.error('Failed to get page category:', err)
    return ''
  }
}

// ページの作成日を取得
export function getPageCreationTime(page: any): string {
  if (!page) return ''
  
  try {
    return page.created_time || ''
  } catch (err) {
    console.error('Failed to get page creation time:', err)
    return ''
  }
}

// ページをソートする関数
export function sortPages(pages: any[], sortOrder: string, recordMap: any): any[] {
  if (!pages || !pages.length) return []
  
  const sortedPages = [...pages]
  
  switch (sortOrder) {
    case 'newest':
      sortedPages.sort((a, b) => {
        const dateA = new Date(getPageCreationTime(a)).getTime()
        const dateB = new Date(getPageCreationTime(b)).getTime()
        return dateB - dateA
      })
      break
      
    case 'oldest':
      sortedPages.sort((a, b) => {
        const dateA = new Date(getPageCreationTime(a)).getTime()
        const dateB = new Date(getPageCreationTime(b)).getTime()
        return dateA - dateB
      })
      break
      
    case 'title_asc':
      sortedPages.sort((a, b) => {
        const titleA = a.title || ''
        const titleB = b.title || ''
        return titleA.localeCompare(titleB)
      })
      break
      
    case 'title_desc':
      sortedPages.sort((a, b) => {
        const titleA = a.title || ''
        const titleB = b.title || ''
        return titleB.localeCompare(titleA)
      })
      break
      
    default:
      // デフォルトは新しい順
      sortedPages.sort((a, b) => {
        const dateA = new Date(getPageCreationTime(a)).getTime()
        const dateB = new Date(getPageCreationTime(b)).getTime()
        return dateB - dateA
      })
  }
  
  return sortedPages
}

// カテゴリでページをフィルタリングする関数
export function filterPagesByCategory(pages: any[], category: string, recordMap: any): any[] {
  if (!pages || !pages.length) {
    return []
  }
  if (!category) {
    return pages
  }
  
  return pages.filter(page => {
    const pageCategory = getPageCategory(page, recordMap)
    return pageCategory === category
  })
}
