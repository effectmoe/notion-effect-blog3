import { type NextApiRequest, type NextApiResponse } from 'next';
import { createComment, getComments } from '../../lib/notion-official-api';

/**
 * Notionコメント管理API
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  
  // APIキーが設定されていない場合はエラー
  if (!process.env.NOTION_OFFICIAL_API_KEY) {
    return res.status(500).json({
      error: 'Notion API key is not configured'
    });
  }
  
  try {
    // コメント取得
    if (method === 'GET') {
      const { blockId } = req.query;
      
      if (!blockId || typeof blockId !== 'string') {
        return res.status(400).json({ error: 'Block ID is required' });
      }
      
      const comments = await getComments(blockId);
      return res.status(200).json(comments);
    }
    
    // コメント作成
    if (method === 'POST') {
      const { pageId, content } = req.body;
      
      if (!pageId) {
        return res.status(400).json({ error: 'Page ID is required' });
      }
      
      if (!content) {
        return res.status(400).json({ error: 'Comment content is required' });
      }
      
      const comment = await createComment(pageId, content);
      return res.status(201).json(comment);
    }
    
    // 対応していないメソッド
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling Notion comments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
