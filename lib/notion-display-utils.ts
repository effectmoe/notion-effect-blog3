import { getPageProperty } from 'notion-utils'

// Notionページからカテゴリを抽出する関数（安全なバージョン）
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

    // カテゴリプロパティが見つからない場合、selectタイプのプロパティを探す
    const propertyId = categoryProp 
      ? categoryProp[0] 
      : Object.entries(collection.schema)
          .find(([_, value]: [string, any]) => (value as any).type === 'select')?.[0]
    
    if (!propertyId) {
      return []
    }

    // ページのブロックからカテゴリ値を抽出
    const categories = new Set<string>()
    
    Object.values(recordMap.block).forEach((block: any) => {
      if (block.value && block.value.properties) {
        const category = getPageProperty(propertyId, block.value, recordMap)
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

// ページのカテゴリを取得する関数
export function getPageCategory(page: any, recordMap: any): string {
  if (!page || !page.value || !recordMap || !recordMap.collection) {
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
        (value as any).name.toLowerCase() === 'category' || 
        (value as any).name.toLowerCase() === 'カテゴリ'
    )

    // カテゴリプロパティが見つからない場合、selectタイプのプロパティを探す
    const propertyId = categoryProp 
      ? categoryProp[0] 
      : Object.entries(collection.schema)
          .find(([_, value]: [string, any]) => (value as any).type === 'select')?.[0]
    
    if (!propertyId) {
      return ''
    }

    // ページのカテゴリを取得
    const category = getPageProperty(propertyId, page.value, recordMap)
    return category ? category.toString() : ''
  } catch (err) {
    console.error('Failed to get page category:', err)
    return ''
  }
}

// ページの作成日時を取得
export function getPageCreationTime(page: any): number {
  if (!page || !page.value || !page.value.created_time) {
    return 0
  }
  
  try {
    return page.value.created_time
  } catch (err) {
    console.error('Failed to get page creation time:', err)
    return 0
  }
}

// ページのタイトルを取得
export function getPageTitle(page: any, recordMap: any): string {
  if (!page || !page.value || !recordMap) {
    return ''
  }
  
  try {
    // ページのプロパティからタイトルを探す
    const titleProp = Object.values(page.value.properties || {}).find(
      (prop: any) => Array.isArray(prop) && prop[0] && prop[0][0] === 'Page'
    )
    
    if (titleProp && Array.isArray(titleProp) && titleProp[0] && titleProp[0][1]) {
      return titleProp[0][1].toString()
    }
    
    // ページ名が見つからない場合は空文字を返す
    return ''
  } catch (err) {
    console.error('Failed to get page title:', err)
    return ''
  }
}

// フィルタとソート条件を適用し、表示すべきページIDのリストを返す
// 元のデータ構造は変更せず、表示/非表示するブロックのIDだけを返す
export function getFilteredSortedPageIds(
  recordMap: any, 
  selectedCategory: string, 
  sortOrder: string
): string[] {
  if (!recordMap || !recordMap.block) {
    return []
  }
  
  try {
    // ページブロックを抽出
    const pageBlocks = Object.entries(recordMap.block)
      .filter(([_, block]: [string, any]) => 
        (block as any).value && (block as any).value.type === 'page'
      )
    
    // カテゴリでフィルタリング
    const filteredBlocks = selectedCategory
      ? pageBlocks.filter(([_, block]: [string, any]) => {
          const category = getPageCategory((block as any), recordMap)
          return category === selectedCategory
        })
      : pageBlocks
    
    // ソート
    let sortedBlocks = [...filteredBlocks]
    
    switch (sortOrder) {
      case 'newest':
        sortedBlocks.sort(([_, a]: [string, any], [__, b]: [string, any]) => {
          const timeA = getPageCreationTime((a as any))
          const timeB = getPageCreationTime((b as any))
          return timeB - timeA // 降順（新しい順）
        })
        break
        
      case 'oldest':
        sortedBlocks.sort(([_, a]: [string, any], [__, b]: [string, any]) => {
          const timeA = getPageCreationTime((a as any))
          const timeB = getPageCreationTime((b as any))
          return timeA - timeB // 昇順（古い順）
        })
        break
        
      case 'title_asc':
        sortedBlocks.sort(([_, a]: [string, any], [__, b]: [string, any]) => {
          const titleA = getPageTitle((a as any), recordMap) || ''
          const titleB = getPageTitle((b as any), recordMap) || ''
          return titleA.localeCompare(titleB) // 昇順（A-Z）
        })
        break
        
      case 'title_desc':
        sortedBlocks.sort(([_, a]: [string, any], [__, b]: [string, any]) => {
          const titleA = getPageTitle((a as any), recordMap) || ''
          const titleB = getPageTitle((b as any), recordMap) || ''
          return titleB.localeCompare(titleA) // 降順（Z-A）
        })
        break
        
      default:
        // デフォルトは新しい順
        sortedBlocks.sort(([_, a]: [string, any], [__, b]: [string, any]) => {
          const timeA = getPageCreationTime((a as any))
          const timeB = getPageCreationTime((b as any))
          return timeB - timeA // 降順（新しい順）
        })
    }
    
    // ページIDのリストとして返す
    return sortedBlocks.map(([id]: [string, any]) => id)
  } catch (err) {
    console.error('Filter/Sort error:', err)
    return Object.keys(recordMap.block).filter(id => {
      const block = (recordMap.block[id] as any)
      return block.value && block.value.type === 'page'
    })
  }
}
