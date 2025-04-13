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
  navigationStyle
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
  // rootNotionPageIdがなければ追加
  if (!params.ancestorId) {
    params.ancestorId = process.env.NOTION_PAGE_ID
  }
  
  // 検索フィルタの最適化
  // 型エラーを回避するために型アサーションを使用
  params.filters = {
    ...(params.filters || {}),
    isDeletedOnly: false,
    excludeTemplates: true,
    isNavigableOnly: false,    // falseに変更して検索範囲を広げる
    requireEditPermissions: false,
  } as any;  // 型アサーションを使用
  
  // 必要なカスタムプロパティを追加
  (params.filters as any).includePublicPagesWithoutExplicitAccess = true;
  (params.filters as any).ancestorIds = [process.env.NOTION_PAGE_ID];
  
  // クエリがない場合や短すぎる場合は空の結果を返す
  if (!params.query || params.query.trim().length < 2) {
    return { results: [], total: 0, recordMap: { block: {} } } as SearchResults
  }

  // 検索クエリの前処理（必要に応じてコメントアウト解除）
  // params.query = params.query.trim();
  
  // 検索結果の最大数を指定
  params.limit = params.limit || 50;  // デフォルトより多くの結果を取得
  
  console.log('Search params:', JSON.stringify(params, null, 2));
  
  try {
    const results = await notion.search(params);
    console.log(`Found ${results.results?.length || 0} results for query: ${params.query}`);
    return results;
  } catch (err) {
    console.error('Search error:', err);
    return { results: [], total: 0, recordMap: { block: {} } } as SearchResults;
  }
}
