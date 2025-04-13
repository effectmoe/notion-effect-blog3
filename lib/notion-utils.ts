import { getPage, getBlocks } from './notion'
import { getPageProperty } from 'notion-utils'

// Notionページからカテゴリを抽出する関数
export function extractCategories(recordMap: any): string[] {
  if (!recordMap || !recordMap.collection) {
    console.log('No recordMap or collection found')
    return []
  }

  try {
    // コレクションからスキーマ情報を取得
    const collection = Object.values(recordMap.collection)[0]?.value
    if (!collection || !collection.schema) {
      console.log('No collection or schema found')
      return []
    }

    console.log('Found collection schema:', Object.keys(collection.schema))

    // カテゴリとしてマークされたプロパティを探す（通常は 'select' タイプ）
    const categoryProp = Object.entries(collection.schema).find(
      ([_, value]: [string, any]) => {
        console.log('Checking property:', (value as any).name)
        return (value as any).name.toLowerCase() === 'category' || 
               (value as any).name.toLowerCase() === 'カテゴリ'
      }
    )

    if (!categoryProp) {
      console.log('No category property found in schema')
      
      // バックアップ：タグやタイプなど他の選択系プロパティを探す
      const selectProps = Object.entries(collection.schema).filter(
        ([_, value]: [string, any]) => (value as any).type === 'select'
      )
      
      console.log('Found select properties:', selectProps.map(p => (p[1] as any).name))
      
      if (selectProps.length > 0) {
        const firstSelectProp = selectProps[0]
        console.log('Using first select property as fallback:', (firstSelectProp[1] as any).name)
        
        const categoryPropId = firstSelectProp[0]
        // ページのブロックからカテゴリ値を抽出
        const categories = new Set<string>()
        
        Object.values(recordMap.block).forEach((block: any) => {
          if (block.value && block.value.properties) {
            const category = getPageProperty(categoryPropId, block.value, recordMap)
            if (category && typeof category === 'string') {
              categories.add(category)
              console.log('Found category:', category)
            }
          }
        })
        
        const result = Array.from(categories).sort()
        console.log('Extracted categories:', result)
        return result
      }
      
      return []
    }

    const categoryPropId = categoryProp[0]
    console.log('Found category property ID:', categoryPropId)

    // ページのブロックからカテゴリ値を抽出
    const categories = new Set<string>()
    
    Object.values(recordMap.block).forEach((block: any) => {
      if (block.value && block.value.properties) {
        const category = getPageProperty(categoryPropId, block.value, recordMap)
        if (category && typeof category === 'string') {
          categories.add(category)
          console.log('Found category:', category)
        }
      }
    })

    const result = Array.from(categories).sort()
    console.log('Extracted categories:', result)
    return result
  } catch (err) {
    console.error('Failed to extract categories:', err)
    return []
  }
}

// Notionブロック配列からカテゴリを抽出
export function getPageCategory(page: any, recordMap: any): string {
  if (!page || !recordMap || !recordMap.collection) {
    console.log('getPageCategory: Missing page or recordMap')
    return ''
  }
  
  try {
    // コレクションからスキーマ情報を取得
    const collection = Object.values(recordMap.collection)[0]?.value
    if (!collection || !collection.schema) {
      console.log('getPageCategory: Missing collection or schema')
      return ''
    }

    // カテゴリプロパティを見つける
    const categoryProp = Object.entries(collection.schema).find(
      ([_, value]: [string, any]) => 
        value.name.toLowerCase() === 'category' || 
        value.name.toLowerCase() === 'カテゴリ'
    )

    if (!categoryProp) {
      console.log('getPageCategory: No category property found')
      
      // バックアップ：最初のセレクトタイプのプロパティを使用
      const selectProps = Object.entries(collection.schema).filter(
        ([_, value]: [string, any]) => value.type === 'select'
      )
      
      if (selectProps.length > 0) {
        const fallbackProp = selectProps[0]
        console.log('getPageCategory: Using fallback select property:', (fallbackProp[1] as any).name)
        
        const fallbackPropId = fallbackProp[0]
        const fallbackCategory = getPageProperty(fallbackPropId, page, recordMap)
        console.log('getPageCategory: Got fallback category:', fallbackCategory)
        return fallbackCategory ? fallbackCategory.toString() : ''
      }
      
      return ''
    }

    const categoryPropId = categoryProp[0]
    console.log('getPageCategory: Using category property ID:', categoryPropId)
    
    // ページのカテゴリを取得
    const category = getPageProperty(categoryPropId, page, recordMap)
    console.log('getPageCategory: Got category:', category)
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
    console.log('filterPagesByCategory: No pages to filter')
    return []
  }
  if (!category) {
    console.log('filterPagesByCategory: No category specified, returning all pages')
    return pages
  }
  
  console.log(`filterPagesByCategory: Filtering ${pages.length} pages by category: ${category}`)
  
  const filteredPages = pages.filter(page => {
    const pageCategory = getPageCategory(page, recordMap)
    const match = pageCategory === category
    if (match) {
      console.log(`Page ${page.id} matches category ${category}`)
    }
    return match
  })
  
  console.log(`filterPagesByCategory: Found ${filteredPages.length} pages matching category ${category}`)
  return filteredPages
}
