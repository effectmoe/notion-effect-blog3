import {
  type ExtendedRecordMap,
  type SearchParams,
  type SearchResults
} from 'notion-types'
import { mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle,
  rootNotionPageId
} from './config'
import { getTweetsMap } from './get-tweets'
import { notion } from './notion-api'
import { getPreviewImageMap } from './preview-images'

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => link.pageId)
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) =>
          notion.getPage(navigationLinkPageId, {
            chunkLimit: 1,
            fetchMissingBlocks: false,
            fetchCollections: false,
            signFileUrls: false
          }),
        {
          concurrency: 4
        }
      )
    }

    return []
  }
)

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  let recordMap = await notion.getPage(pageId)

  if (navigationStyle !== 'default') {
    // ensure that any pages linked to in the custom navigation header have
    // their block info fully resolved in the page record map so we know
    // the page title, slug, etc.
    const navigationLinkRecordMaps = await getNavigationLinkPages()

    if (navigationLinkRecordMaps?.length) {
      recordMap = navigationLinkRecordMaps.reduce(
        (map, navigationLinkRecordMap) =>
          mergeRecordMaps(map, navigationLinkRecordMap),
        recordMap
      )
    }
  }

  if (isPreviewImageSupportEnabled) {
    const previewImageMap = await getPreviewImageMap(recordMap)
    ;(recordMap as any).preview_images = previewImageMap
  }

  await getTweetsMap(recordMap)

  return recordMap
}

export async function search(params: SearchParams): Promise<SearchResults> {
  // パラメータをログに出力
  console.log('Search function params (original):', JSON.stringify(params, null, 2));
  
  // ancestorIdを強制的にrootNotionPageIdに設定
  params.ancestorId = rootNotionPageId;
  
  // 基本的なフィルタを設定
  params.filters = {
    isDeletedOnly: false,
    excludeTemplates: true,
    isNavigableOnly: true,
    requireEditPermissions: false,
  };
  
  // クエリがない場合や短すぎる場合は空の結果を返す
  if (!params.query || params.query.trim().length < 2) {
    return { results: [], total: 0, recordMap: { block: {} } } as SearchResults
  }
  
  // 検索結果の最大数を設定
  params.limit = params.limit || 20;
  
  console.log('Search params (final):', JSON.stringify(params, null, 2));
  
  try {
    // 検索実行
    console.log('Starting Notion search with params:', JSON.stringify(params, null, 2));
    const results = await notion.search(params);
    console.log(`Notion search complete. Found ${results.results?.length || 0} results for query: ${params.query}`);
    
    // 検索結果のURLを修正（/p/id形式から/id形式に変更）
    if (results && results.results) {
      results.results = results.results.map(result => {
        // URLを生成する際に /p/pageId から /pageId に変更
        if (result.url && result.url.startsWith('/p/')) {
          result.url = result.url.replace('/p/', '/');
        }
        // ハイライトのpathTextも修正
        if (result.highlight && result.highlight.pathText && result.highlight.pathText.startsWith('/p/')) {
          result.highlight.pathText = result.highlight.pathText.replace('/p/', '/');
        }
        return result;
      });
    }
    
    // 検索結果の詳細をログに出力
    if (results.results?.length > 0) {
      console.log('Search results sample:', JSON.stringify(results.results[0], null, 2));
    } else {
      console.log('No results found, full response:', JSON.stringify(results, null, 2));
    }
    
    return results;
  } catch (err) {
    console.error('Search error:', err);
    return { results: [], total: 0, recordMap: { block: {} } } as SearchResults;
  }
}

// 代替検索実装 - 基本的なNotionページ取得で手動フィルタリング
export async function searchManually(query: string): Promise<SearchResults> {
  try {
    // rootNotionPageIdからページを取得
    console.log(`Manually searching for "${query}" by getting root page ${rootNotionPageId}`);
    const recordMap = await notion.getPage(rootNotionPageId, {
      fetchCollections: true, // コレクションも取得
      signFileUrls: true,
    });
    
    // 検索クエリを小文字に変換
    const searchLowerCase = query.toLowerCase();
    
    // 検索結果を格納する配列
    const results: any[] = [];
    
    // ブロックとコレクションを取得してテキストを検索
    if (recordMap.block) {
      // ページタイトルのマッピングを保存するオブジェクト
      const pageTitles: {[key: string]: string} = {};
      
      // まず、ブロックからページのタイトルを抽出
      Object.entries(recordMap.block).forEach(([id, blockData]) => {
        const block = blockData.value;
        if (!block) return;
        
        // ページタイプのブロックを見つける
        if (block.type === 'page' && block.properties && block.properties.title) {
          const title = block.properties.title;
          let pageTitle = '';
          
          if (Array.isArray(title)) {
            // Notionのテキスト配列からテキストを抽出
            title.forEach(textChunk => {
              if (Array.isArray(textChunk) && textChunk.length > 0 && typeof textChunk[0] === 'string') {
                pageTitle += textChunk[0];
              }
            });
          }
          
          if (pageTitle) {
            pageTitles[id] = pageTitle;
          }
        }
      });
      
      console.log(`Found ${Object.keys(pageTitles).length} page titles`);
      
      // 次に、すべてのブロックをスキャンして検索
      Object.entries(recordMap.block).forEach(([id, blockData]) => {
        const block = blockData.value;
        if (!block) return;
        
        // ブロックのテキストコンテンツを抽出
        let blockText = '';
        let blockTitle = '';
        
        if (block.properties && block.properties.title) {
          const title = block.properties.title;
          
          if (Array.isArray(title)) {
            // Notionのテキスト配列からテキストを抽出
            title.forEach(textChunk => {
              if (Array.isArray(textChunk) && textChunk.length > 0 && typeof textChunk[0] === 'string') {
                blockText += textChunk[0];
              }
            });
          }
        }
        
        // ページのタイトルがあればそれを使用
        if (block.type === 'page' && pageTitles[id]) {
          blockTitle = pageTitles[id];
        } else {
          // ページでない場合は、テキストの最初の部分をタイトルとして使用
          blockTitle = blockText.substring(0, 80) + (blockText.length > 80 ? '...' : '');
        }
        
        // テキスト内に検索クエリが含まれるか確認
        if (blockText.toLowerCase().includes(searchLowerCase)) {
          // 親ページIDを取得（可能な場合）
          const parentId = block.parent_id || block.parent_table === 'collection' ? block.parent_id : null;
          const parentTitle = parentId && pageTitles[parentId] ? pageTitles[parentId] : '';
          
          // 検索結果に追加（親ページのタイトルも含める）
          results.push({
            id,
            title: blockTitle || '無題',
            url: `/${id}`,  // /p/プレフィックスを削除
            preview: {
              text: blockText.substring(0, 200) + (blockText.length > 200 ? '...' : '')
            },
            parent: parentId ? {
              title: parentTitle || 'Parent Page',
              id: parentId
            } : null,
            isNavigable: true,
            score: 1.0,
            object: block.type === 'page' ? 'page' : 'block',
            highlight: {
              pathText: parentTitle ? `${parentTitle} > ${blockTitle}` : blockTitle,
              text: blockText.substring(0, 200) + (blockText.length > 200 ? '...' : '')
            }
          });
        }
      });
    }
    
    // コレクションも検索
    if (recordMap.collection) {
      Object.entries(recordMap.collection).forEach(([collectionId, collectionData]) => {
        const collection = collectionData.value;
        if (!collection) return;
        
        // コレクション名を検索
        let collectionName = '';
        if (collection.name && Array.isArray(collection.name)) {
          collection.name.forEach(textChunk => {
            if (Array.isArray(textChunk) && textChunk.length > 0 && typeof textChunk[0] === 'string') {
              collectionName += textChunk[0];
            }
          });
        }
        
        if (collectionName.toLowerCase().includes(searchLowerCase)) {
          results.push({
            id: collectionId,
            title: collectionName,
            url: `/${collectionId}`,  // /p/プレフィックスを削除
            preview: {
              text: `データベース: ${collectionName}`
            },
            isNavigable: true,
            score: 1.0,
            object: 'collection',
            highlight: {
              pathText: `データベース: ${collectionName}`,
              text: `データベース: ${collectionName}`
            }
          });
        }
      });
    }
    
    console.log(`Manual search found ${results.length} results for "${query}"`);
    
    return {
      results,
      total: results.length,
      recordMap: { block: {} }
    };
  } catch (err) {
    console.error('Manual search error:', err);
    return { results: [], total: 0, recordMap: { block: {} } } as SearchResults;
  }
}