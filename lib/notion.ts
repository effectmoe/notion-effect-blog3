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
    
    // ブロックを取得してテキストを検索
    if (recordMap.block) {
      Object.entries(recordMap.block).forEach(([id, blockData]) => {
        const block = blockData.value;
        if (!block) return;
        
        // タイトルブロックやテキストブロックを確認
        if (block.properties) {
          const title = block.properties.title;
          let blockText = '';
          
          if (title && Array.isArray(title)) {
            // Notionのテキスト配列からテキストを抽出
            title.forEach(textChunk => {
              if (Array.isArray(textChunk) && textChunk.length > 0 && typeof textChunk[0] === 'string') {
                blockText += textChunk[0];
              }
            });
          }
          
          // テキスト内に検索クエリが含まれるか確認
          if (blockText.toLowerCase().includes(searchLowerCase)) {
            results.push({
              id,
              title: blockText.substring(0, 80) + (blockText.length > 80 ? '...' : ''),
              url: `/p/${id}`,
              preview: {
                text: blockText.substring(0, 200) + (blockText.length > 200 ? '...' : '')
              },
              isNavigable: true,
              score: 1.0,
              highlight: {
                pathText: `/p/${id}`,
                text: blockText.substring(0, 200) + (blockText.length > 200 ? '...' : '')
              }
            });
          }
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