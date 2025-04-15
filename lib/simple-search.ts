import { rootNotionPageId } from './config'
import { notion } from './notion-api'
import type { SearchResults } from './types'

/**
 * シンプルな検索機能 - Notionページ内のコンテンツを直接取得して検索する
 */
export async function simpleSearch(query: string): Promise<SearchResults> {
  console.log(`Simple search for "${query}" in root page ${rootNotionPageId}`)
  
  try {
    // 検索クエリが短すぎる場合は結果を返さない
    if (!query || query.length < 2) {
      return { results: [], total: 0, recordMap: { block: {} } }
    }
    
    // 検索クエリを小文字に変換して準備
    const searchLowerCase = query.toLowerCase()
    
    // ルートページとそのコンテンツを取得
    const recordMap = await notion.getPage(rootNotionPageId)
    console.log(`Retrieved page data, found ${Object.keys(recordMap.block || {}).length} blocks`)
    
    // 検索結果を格納する配列
    const results: any[] = []
    
    // ブロックを処理
    if (recordMap.block) {
      Object.entries(recordMap.block).forEach(([id, blockData]) => {
        const block = blockData.value
        if (!block) return
        
        // タイトルやテキストを含むブロックを検索
        if (block.properties) {
          const title = block.properties.title
          let blockText = ''
          
          // Notionのテキスト配列を処理
          if (title && Array.isArray(title)) {
            title.forEach(textChunk => {
              if (Array.isArray(textChunk) && textChunk.length > 0 && typeof textChunk[0] === 'string') {
                blockText += textChunk[0]
              }
            })
          }
          
          // テキストが検索クエリを含む場合、結果に追加
          if (blockText.toLowerCase().includes(searchLowerCase)) {
            console.log(`Match found in block ${id}: "${blockText.substring(0, 50)}..."`)
            results.push({
              id,
              title: blockText.substring(0, 80) + (blockText.length > 80 ? '...' : ''),
              url: `/p/${id}`,
              preview: {
                text: blockText.substring(0, 200) + (blockText.length > 200 ? '...' : '')
              },
              object: 'block',
              isNavigable: true,
              score: 1.0,
              highlight: {
                pathText: `/p/${id}`,
                text: blockText.substring(0, 200) + (blockText.length > 200 ? '...' : '')
              }
            })
          }
        }
      })
    }
    
    // コレクションやデータベースも検索対象に含める
    if (recordMap.collection) {
      Object.entries(recordMap.collection).forEach(([id, collectionData]) => {
        const collection = collectionData.value
        if (!collection) return
        
        // コレクション名を検索
        const name = collection.name
        let collectionText = ''
        
        if (name && Array.isArray(name)) {
          name.forEach(textChunk => {
            if (Array.isArray(textChunk) && textChunk.length > 0 && typeof textChunk[0] === 'string') {
              collectionText += textChunk[0]
            }
          })
        }
        
        if (collectionText.toLowerCase().includes(searchLowerCase)) {
          results.push({
            id,
            title: collectionText,
            url: `/p/${id}`,
            preview: {
              text: `データベース: ${collectionText}`
            },
            object: 'collection',
            isNavigable: true,
            score: 0.8,
            highlight: {
              pathText: `/p/${id}`,
              text: `データベース: ${collectionText}`
            }
          })
        }
      })
    }
    
    console.log(`Simple search found ${results.length} results for "${query}"`)
    
    return {
      results,
      total: results.length,
      recordMap: { block: {} }
    }
  } catch (err) {
    console.error('Simple search error:', err)
    return { results: [], total: 0, recordMap: { block: {} } }
  }
}
