import { type NextApiRequest, type NextApiResponse } from 'next'

import type * as types from '../../lib/types'
import { search, searchManually } from '../../lib/notion'
import { searchNotion as searchNotionOfficial, parsePageProperties } from '../../lib/notion-official-api'
import { richTextToPlainText } from '../../lib/notion-utils'
import * as config from '../../lib/config'

export default async function searchNotionHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'method not allowed' })
  }

  const searchParams: any = req.body
  const query = searchParams.query || '';
  // ancestorIdが必須になったため、確実に設定
  if (!searchParams.ancestorId && config.api.notionPageId) {
    searchParams.ancestorId = config.api.notionPageId
  }
  const useOfficialApi = req.query.useOfficialApi === 'true';

  console.log('<<< lambda search-notion', searchParams, { useOfficialApi })
  
  let results;
  
  try {
    if (useOfficialApi && process.env.NOTION_OFFICIAL_API_KEY) {
      // 公式APIを使用した検索
      const officialResults = await searchNotionOfficial(query);
      
      // 結果を非公式APIの形式に合わせて変換して、サイト内URLに変換
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
              for (const [key, value] of Object.entries(result.properties as Record<string, any>)) {
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
              for (const [key, value] of Object.entries(result.properties as Record<string, any>)) {
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
              url: `/${result.id}`, // サイト内URLに変換（/p/プレフィックスを削除）
              preview: {
                text: previewText,
              },
              cover,
              date: publishDate,
              object: 'page',
              properties: properties, // 詳細表示のために全プロパティを渡す
              parent: result.parent?.type === 'database_id' ? {
                id: result.parent.database_id,
                title: 'Database' // データベースからのページ
              } : undefined,
              isNavigable: true, // notion-typesの互換性のために追加
              score: 0.9, // notion-typesの互換性のために追加
              highlight: {
                pathText: `/${result.id}`,
                text: previewText || 'No preview available'
              }
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
              url: `/${result.id}`, // サイト内URLに変換（/p/プレフィックスを削除）
              preview: {
                text: `データベース: ${title}`,
              },
              object: 'database',
              schema: result.properties as Record<string, any>, // データベースのスキーマ情報
              parent: result.parent?.type === 'page_id' ? {
                id: result.parent.page_id,
                title: 'Page' // ページの中のデータベース
              } : undefined,
              isNavigable: true,
              score: 0.8,
              highlight: {
                pathText: `/${result.id}`,
                text: `データベース: ${title}`
              }
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
            
            // 親ページIDを取得
            const parentId = result.parent?.page_id || result.parent?.database_id || '';
            
            return {
              id: result.id,
              title: blockTitle,
              url: parentId ? `/${parentId}` : `/${result.id}`, // 親ページのURLに変換（/p/プレフィックスを削除）
              preview: {
                text: text || `${blockTypeDisplay}`,
              },
              object: 'block',
              type: blockType,
              parentId: parentId,
              parent: parentId ? {
                id: parentId,
                title: 'Parent Page' // 親ページタイトルのデフォルト値
              } : undefined,
              isNavigable: true,
              score: 0.7,
              highlight: {
                pathText: parentId ? `/${parentId}` : `/${result.id}`,
                text: text || `${blockTypeDisplay}`
              }
            };
          }
          
          // その他のオブジェクト
          return {
            id: result.id,
            title: result.object || 'Notion Item',
            url: `/${result.id}`, // サイト内URLに変換（/p/プレフィックスを削除）
            preview: {
              text: `${result.object || 'item'}`,
            },
            object: result.object || 'unknown',
            isNavigable: true,
            score: 0.5,
            highlight: {
              pathText: `/${result.id}`,
              text: `${result.object || 'item'}`
            }
          };
        }),
        total: officialResults.length,
        recordMap: {
          block: {}
        }
      };
    } else {
      // 標準の検索が動かない場合、手動検索にフォールバック
      try {
        console.log('Trying standard search first...');
        // 非公式APIを使用した検索（既存の実装）
        // リクエストのパラメータをそのまま渡す
        // search関数内部でrootNotionPageIdが設定される
        results = await search(searchParams as types.SearchParams);

        // 結果が空の場合、手動検索にフォールバック
        if (!results.results || results.results.length === 0) {
          console.log('No results from standard search, falling back to manual search...');
          results = await searchManually(searchParams.query);
        }
        
        // 検索結果のURLを修正（/p/id形式から/id形式に変更）
        if (results && results.results) {
          results.results = results.results.map(result => {
            const typedResult = result as any; // 型アサーションを使用
            if (typedResult.url && typeof typedResult.url === 'string' && typedResult.url.startsWith('/p/')) {
              typedResult.url = typedResult.url.replace('/p/', '/');
            }
            if (typedResult.highlight && typedResult.highlight.pathText && 
                typeof typedResult.highlight.pathText === 'string' && 
                typedResult.highlight.pathText.startsWith('/p/')) {
              typedResult.highlight.pathText = typedResult.highlight.pathText.replace('/p/', '/');
            }
            return typedResult;
          });
        }
      } catch (searchError) {
        console.error('Standard search failed, trying manual search...', searchError);
        // 標準の検索が失敗した場合、手動検索で再試行
        results = await searchManually(searchParams.query);
        
        // 手動検索の結果のURLも修正
        if (results && results.results) {
          results.results = results.results.map(result => {
            const typedResult = result as any; // 型アサーションを使用
            if (typedResult.url && typeof typedResult.url === 'string' && typedResult.url.startsWith('/p/')) {
              typedResult.url = typedResult.url.replace('/p/', '/');
            }
            if (typedResult.highlight && typedResult.highlight.pathText && 
                typeof typedResult.highlight.pathText === 'string' && 
                typedResult.highlight.pathText.startsWith('/p/')) {
              typedResult.highlight.pathText = typedResult.highlight.pathText.replace('/p/', '/');
            }
            return typedResult;
          });
        }
      }
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
