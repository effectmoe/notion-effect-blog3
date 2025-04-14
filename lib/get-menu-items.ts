import { ExtendedRecordMap } from 'notion-types'
import { getPageProperty } from 'notion-utils'
import { ViewTab } from '../components/NotionViewTabs'

/**
 * Notionデータベースから「Menu」チェックボックスがオンのページを取得
 * tabs形式で返す
 */
export function getMenuItemsFromNotion(recordMap: ExtendedRecordMap): ViewTab[] {
  if (!recordMap || !recordMap.collection) {
    return []
  }

  try {
    // 基本のすべて表示タブ
    const tabs: ViewTab[] = [
      { id: 'all', name: 'すべて', path: '/' }
    ]
    
    // コレクションを探す（カフェキネシコンテンツDB）
    const collections = Object.values(recordMap.collection)
    
    for (const collection of collections) {
      const collectionValue = collection.value
      if (!collectionValue || !collectionValue.schema) continue
      
      // Menuプロパティを探す
      const menuPropId = Object.entries(collectionValue.schema).find(
        ([_, prop]: [string, any]) => 
          prop.name === 'Menu' && 
          prop.type === 'checkbox'
      )?.[0]
      
      if (!menuPropId) continue
      
      // タイトルプロパティを探す
      const titlePropId = Object.entries(collectionValue.schema).find(
        ([_, prop]: [string, any]) => prop.type === 'title'
      )?.[0]
      
      if (!titlePropId) continue
      
      // コレクションに属するページを探す
      for (const [blockId, block] of Object.entries(recordMap.block)) {
        const blockValue = block.value
        
        // ページタイプのブロックで、このコレクションに属しているものを探す
        if (
          blockValue?.type === 'page' && 
          blockValue?.parent_table === 'collection' && 
          blockValue?.parent_id === collectionValue.id
        ) {
          // Menuチェックボックスの値を取得
          const menuChecked = getPageProperty(menuPropId, blockValue, recordMap)
          
          // Menuがチェックされている場合
          if (menuChecked === 'Yes' || menuChecked === 'true' || menuChecked === true) {
            // タイトルを取得
            const title = getPageProperty(titlePropId, blockValue, recordMap)
            
            if (title) {
              // URLスラッグを作成（ページのタイトルから）
              const slug = String(title)
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
              
              // タブを追加
              tabs.push({
                id: blockId,
                name: String(title),
                path: `/page/${blockId.replace(/-/g, '')}`,
                pageId: blockId
              })
            }
          }
        }
      }
    }
    
    return tabs
  } catch (error) {
    console.error('Error extracting menu items from Notion:', error)
    return [{ id: 'all', name: 'すべて', path: '/' }]
  }
}
