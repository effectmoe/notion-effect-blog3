import { type NextApiRequest, type NextApiResponse } from 'next'

import type * as types from '../../lib/types'
import { search } from '../../lib/notion'
import { searchNotion as searchNotionOfficial, parsePageProperties } from '../../lib/notion-official-api'
import { richTextToPlainText } from '../../lib/notion-utils'

export default async function searchNotionHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'method not allowed' })
  }

  const searchParams: types.SearchParams = req.body
  const query = searchParams.query || '';
  const useOfficialApi = req.query.useOfficialApi === 'true';

  console.log('<<< lambda search-notion', searchParams, { useOfficialApi })
  
  let results;
  
  try {
    if (useOfficialApi && process.env.NOTION_OFFICIAL_API_KEY) {
      // 公式APIを使用した検索
      const officialResults = await searchNotionOfficial(query);
      
      // 結果を非公式APIの形式に合わせて変換
      results = {
        results: officialResults.map((result: any) => {
          // ページの場合
          if (result.object === 'page') {
            // ページプロパティを解析
            const properties = parsePageProperties(result);
            
            // タイトルを取得（複数のプロパティから試行）
            let title = 'Untitled';
            if (properties.Title) {
              title = properties.Title;
            } else if (properties.Name) {
              title = properties.Name;
            } else if (result.properties) {
              // プロパティを順番に確認
              for (const [key, value] of Object.entries(result.properties)) {
                if (value.type === 'title' && value.title?.length > 0) {
                  title = richTextToPlainText(value.title);
                  break;
                }
              }
            }
            
            // 説明／プレビューテキストを取得
            let previewText = '';
            if (properties.Description) {
              previewText = properties.Description;
            } else if (properties.Summary) {
              previewText = properties.Summary;
            } else if (properties.Preview) {
              previewText = properties.Preview;
            } else if (result.properties) {
              // リッチテキストプロパティから最初のものを使用
              for (const [key, value] of Object.entries(result.properties)) {
                if (value.type === 'rich_text' && value.rich_text?.length > 0) {
                  previewText = richTextToPlainText(value.rich_text);
                  if (previewText) break;
                }
              }
            }
            
            // ページのプロパティから公開日を取得
            let publishDate = '';
            if (properties.Date) {
              publishDate = properties.Date;
            } else if (properties['公開日']) {
              publishDate = properties['公開日'];
            } else if (properties.Published) {
              publishDate = properties.Published;
            }
            
            // カバー画像
            const cover = properties.cover || null;
            
            return {
              id: result.id,
              title,
              url: result.url,
              preview: {
                text: previewText,
              },
              cover,
              date: publishDate,
              object: 'page',
              properties: properties, // 詳細表示のために全プロパティを渡す
            };
          }
          
          // データベースの場合
          if (result.object === 'database') {
            const title = result.title?.length > 0 
              ? richTextToPlainText(result.title)
              : 'Untitled Database';
              
            return {
              id: result.id,
              title,
              url: result.url,
              preview: {
                text: `Database with ${result.title?.length || 0} columns`,
              },
              object: 'database',
              schema: result.properties, // データベースのスキーマ情報
            };
          }
          
          // ブロックの場合
          if (result.object === 'block') {
            let text = '';
            let blockType = result.type || 'unknown';
            
            // ブロックタイプに応じた内容の抽出
            if (result.type === 'paragraph' && result.paragraph?.rich_text?.length > 0) {
              text = richTextToPlainText(result.paragraph.rich_text);
            } else if (result.type === 'heading_1' && result.heading_1?.rich_text?.length > 0) {
              text = `# ${richTextToPlainText(result.heading_1.rich_text)}`;
            } else if (result.type === 'heading_2' && result.heading_2?.rich_text?.length > 0) {
              text = `## ${richTextToPlainText(result.heading_2.rich_text)}`;
            } else if (result.type === 'heading_3' && result.heading_3?.rich_text?.length > 0) {
              text = `### ${richTextToPlainText(result.heading_3.rich_text)}`;
            } else if (result.type === 'bulleted_list_item' && result.bulleted_list_item?.rich_text?.length > 0) {
              text = `• ${richTextToPlainText(result.bulleted_list_item.rich_text)}`;
            } else if (result.type === 'numbered_list_item' && result.numbered_list_item?.rich_text?.length > 0) {
              text = `1. ${richTextToPlainText(result.numbered_list_item.rich_text)}`;
            } else if (result.type === 'code' && result.code?.rich_text?.length > 0) {
              text = `Code: ${richTextToPlainText(result.code.rich_text)}`;
            } else if (result.type === 'quote' && result.quote?.rich_text?.length > 0) {
              text = `"${richTextToPlainText(result.quote.rich_text)}"`;
            } else if (result.type === 'image') {
              text = 'Image';
              blockType = 'image';
            }
            
            // ブロックタイプを人間が読める形式に変換
            const blockTypeDisplay = blockType.replace(/_/g, ' ');
            const blockTitle = text ? text.substring(0, 30) + (text.length > 30 ? '...' : '') : blockTypeDisplay;
            
            return {
              id: result.id,
              title: blockTitle,
              url: result.url || '',
              preview: {
                text: text || `${blockTypeDisplay} block`,
              },
              object: 'block',
              type: blockType,
              parentId: result.parent?.page_id || result.parent?.database_id || '',
            };
          }
          
          // その他のオブジェクト
          return {
            id: result.id,
            title: result.object || 'Notion Item',
            url: result.url || '',
            preview: {
              text: `Notion ${result.object || 'item'}`,
            },
            object: result.object || 'unknown',
          };
        }),
        total: officialResults.length,
        recordMap: {
          block: {}
        }
      };
    } else {
      // 非公式APIを使用した検索（既存の実装）
      results = await search(searchParams);
    }
    
    console.log('>>> lambda search-notion', results);
  } catch (error) {
    console.error('Error searching Notion:', error);
    return res.status(500).json({ error: 'Failed to search Notion' });
  }

  res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, max-age=60, stale-while-revalidate=60'
  )
  res.status(200).json(results)
}
