import { NextApiRequest, NextApiResponse } from 'next';
import type * as types from '../../lib/types';
import { searchNotion } from '../../lib/search-notion';
import * as config from '../../lib/config';

/**
 * 検索修正API - 既存の検索APIのエラーハンドリングを強化
 */
export default async function searchFixHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid query', 
      message: '検索クエリが正しく指定されていません' 
    });
  }

  console.log(`MCPサーバー: 検索リクエスト開始 - クエリ: "${query}"`);

  try {
    // 検索パラメータを構築
    const searchParams: types.SearchParams = {
      query,
      ancestorId: config.api.notionPageId
    };

    // 検索を実行
    const results = await searchNotion(searchParams);
    
    // 検索結果のデバッグログ
    console.log(`MCPサーバー: 検索結果 ${results?.results?.length || 0}件`);

    // レスポンスヘッダーを設定
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=30, max-age=30, stale-while-revalidate=30'
    );
    
    // 検索結果を返す
    return res.status(200).json(results);
  } catch (err) {
    console.error('MCPサーバー: 検索エラー', err);
    
    // エラーレスポンスを返す
    return res.status(500).json({
      error: 'Search failed',
      message: '検索中にエラーが発生しました',
      details: err instanceof Error ? err.message : String(err)
    });
  }
}
