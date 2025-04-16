import ExpiryMap from 'expiry-map'
import pMemoize from 'p-memoize'

import type * as types from './types'
import { api } from './config'

export const searchNotion = pMemoize(searchNotionImpl, {
  cacheKey: (args) => args[0]?.query,
  cache: new ExpiryMap(10_000)
})

async function searchNotionImpl(
  params: types.SearchParams
): Promise<types.SearchResults> {
  // クエリのロギング
  console.log('Client search query:', params.query)
  
  // 検索パラメータの調整
  if (!params.ancestorId && api.notionPageId) {
    params.ancestorId = api.notionPageId
  }
  
  // 複数のポイントでエラーの可能性を回避するために型アサーションを使用
  const searchParams = params as any;
  
  return fetch(api.searchNotion, {
    method: 'POST',
    body: JSON.stringify(searchParams),
    headers: {
      'content-type': 'application/json'
    }
  })
    .then((res) => {
      if (res.ok) {
        return res
      }

      // convert non-2xx HTTP responses into errors
      const error: any = new Error(res.statusText)
      error.response = res
      console.error('Search API error:', error)
      throw error
    })
    .then((res) => res.json())
    .then((results) => {
      // 結果のロギング
      console.log(`Client received ${results.results?.length || 0} results for query: ${params.query}`)
      return results
    })
    .catch((err) => {
      console.error('Search request failed:', err)
      return { results: [], total: 0, recordMap: { block: {} } } as types.SearchResults
    })
}
