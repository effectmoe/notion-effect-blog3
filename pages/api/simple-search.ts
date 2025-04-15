import { type NextApiRequest, type NextApiResponse } from 'next'

import { simpleSearch } from '../../lib/simple-search'
import * as config from '../../lib/config'

export default async function simpleSearchHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'method not allowed' })
  }

  const { query } = req.body

  // 検索クエリのバリデーション
  if (!query || query.length < 2) {
    return res.status(400).json({ 
      error: '検索クエリが短すぎます', 
      results: [], 
      total: 0 
    })
  }

  // 環境変数のロギング（デバッグ用）
  console.log('Environment config:', {
    rootNotionPageId: config.rootNotionPageId || 'not set',
    hasNotionToken: process.env.NOTION_TOKEN ? 'yes' : 'no',
    hasNotionActiveUser: process.env.NOTION_ACTIVE_USER ? 'yes' : 'no',
    apiBaseUrl: config.api.searchNotion || 'not set'
  })

  try {
    console.log(`Processing simple search request for "${query}"`)
    
    // シンプル検索を実行
    const results = await simpleSearch(query)
    
    // キャッシュヘッダーを設定
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, max-age=60, stale-while-revalidate=60'
    )
    
    // 結果を返す
    res.status(200).json(results)
  } catch (error) {
    console.error('Simple search API error:', error)
    return res.status(500).json({ 
      error: '検索中にエラーが発生しました', 
      results: [], 
      total: 0 
    })
  }
}
