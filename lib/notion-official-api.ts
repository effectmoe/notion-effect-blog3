import { Client } from '@notionhq/client';
import { QueryDatabaseParameters, GetPageResponse } from '@notionhq/client/build/src/api-endpoints';

// 環境変数から公式Notion APIキーを取得
let apiKey = process.env.NOTION_OFFICIAL_API_KEY;

// Notion APIクライアントの初期化
const notionClient = new Client({
  auth: apiKey,
});

/**
 * APIクライアントを取得（テスト用）
 */
export function getNotionClient() {
  return notionClient;
}

/**
 * データベースからページをクエリで検索
 * @param databaseId データベースID
 * @param filter フィルター条件
 * @param sorts ソート条件
 * @returns 検索結果
 */
export async function queryDatabase(
  databaseId: string,
  filter?: QueryDatabaseParameters['filter'],
  sorts?: QueryDatabaseParameters['sorts'],
  page_size?: number
) {
  try {
    const response = await notionClient.databases.query({
      database_id: databaseId,
      filter,
      sorts,
      page_size: page_size || 100,
    });
    
    return response.results;
  } catch (error) {
    console.error('Error querying database:', error);
    throw error;
  }
}

/**
 * データベース情報を取得
 * @param databaseId データベースID
 * @returns データベース情報
 */
export async function getDatabase(databaseId: string) {
  try {
    const response = await notionClient.databases.retrieve({
      database_id: databaseId,
    });
    
    return response;
  } catch (error) {
    console.error('Error retrieving database:', error);
    throw error;
  }
}

/**
 * ページ情報を取得
 * @param pageId ページID
 * @returns ページ情報
 */
export async function getPage(pageId: string) {
  try {
    const response = await notionClient.pages.retrieve({
      page_id: pageId,
    });
    
    return response;
  } catch (error) {
    console.error('Error retrieving page:', error);
    throw error;
  }
}

/**
 * ページのブロックを取得
 * @param blockId ブロックID
 * @returns ブロック情報
 */
export async function getBlockChildren(blockId: string) {
  try {
    const blocks = [];
    let cursor;
    
    // ページネーション処理
    while (true) {
      const { results, next_cursor } = await notionClient.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
      });
      
      blocks.push(...results);
      
      if (!next_cursor) break;
      cursor = next_cursor;
    }
    
    return blocks;
  } catch (error) {
    console.error('Error retrieving block children:', error);
    throw error;
  }
}

/**
 * ブロックとその子ブロックを再帰的に取得
 * @param blockId ブロックID
 * @returns ブロックとその子ブロック
 */
export async function getBlockWithChildren(blockId: string) {
  try {
    // まずブロックの子要素を取得
    const blocks = await getBlockChildren(blockId);
    
    // 子ブロックを持つブロックに対して再帰的に処理
    const blocksWithChildren = await Promise.all(
      blocks.map(async (block) => {
        // has_childrenがtrueの場合、子ブロックを取得
        if (block.has_children) {
          // 子ブロックを取得して、元のブロックに追加
          const children = await getBlockWithChildren(block.id);
          return {
            ...block,
            children
          };
        }
        return block;
      })
    );
    
    return blocksWithChildren;
  } catch (error) {
    console.error('Error retrieving block with children:', error);
    throw error;
  }
}

/**
 * ページの完全なコンテンツ（メタデータとブロック）を取得
 * @param pageId ページID
 * @returns ページメタデータと全ブロック
 */
export async function getFullPage(pageId: string) {
  try {
    // ページメタデータを取得
    const page = await getPage(pageId);
    
    // ページのブロックを再帰的に取得
    const blocks = await getBlockWithChildren(pageId);
    
    return {
      page,
      blocks
    };
  } catch (error) {
    console.error('Error retrieving full page:', error);
    throw error;
  }
}

/**
 * コメントを作成
 * @param pageId ページID
 * @param content コメント内容
 * @returns 作成したコメント
 */
export async function createComment(pageId: string, content: string) {
  try {
    const response = await notionClient.comments.create({
      parent: {
        page_id: pageId,
      },
      rich_text: [
        {
          type: 'text',
          text: {
            content,
          },
        },
      ],
    });
    
    return response;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
}

/**
 * ページのコメントを取得
 * @param blockId ブロックID
 * @returns コメント一覧
 */
export async function getComments(blockId: string) {
  try {
    const response = await notionClient.comments.list({
      block_id: blockId,
    });
    
    return response.results;
  } catch (error) {
    console.error('Error retrieving comments:', error);
    throw error;
  }
}

/**
 * ブロックを更新
 * @param blockId ブロックID
 * @param properties 更新するプロパティ
 * @returns 更新したブロック
 */
export async function updateBlock(blockId: string, properties: any) {
  try {
    const response = await notionClient.blocks.update({
      block_id: blockId,
      ...properties,
    });
    
    return response;
  } catch (error) {
    console.error('Error updating block:', error);
    throw error;
  }
}

/**
 * データベースを検索
 * @param query 検索クエリ
 * @returns 検索結果
 */
export async function searchNotion(query: string) {
  try {
    const response = await notionClient.search({
      query,
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time',
      },
    });
    
    return response.results;
  } catch (error) {
    console.error('Error searching Notion:', error);
    throw error;
  }
}

/**
 * ページプロパティを解析して使いやすい形式に変換
 * @param page ページ情報
 * @returns 解析されたプロパティ
 */
export function parsePageProperties(page: any) {
  const properties: Record<string, any> = {};
  
  // プロパティがない場合は空オブジェクトを返す
  if (!page || !page.properties) {
    return properties;
  }
  
  // 各プロパティを型に応じて解析
  Object.entries(page.properties).forEach(([key, property]: [string, any]) => {
    switch (property.type) {
      case 'title':
        properties[key] = property.title.map((t: any) => t.plain_text).join('');
        break;
        
      case 'rich_text':
        properties[key] = property.rich_text.map((t: any) => t.plain_text).join('');
        break;
        
      case 'date':
        properties[key] = property.date?.start || null;
        break;
        
      case 'select':
        properties[key] = property.select?.name || null;
        break;
        
      case 'multi_select':
        properties[key] = property.multi_select.map((item: any) => item.name);
        break;
        
      case 'files':
        if (property.files.length > 0) {
          if (property.files[0].type === 'external') {
            properties[key] = property.files[0].external.url;
          } else if (property.files[0].type === 'file') {
            properties[key] = property.files[0].file.url;
          } else {
            properties[key] = null;
          }
        } else {
          properties[key] = null;
        }
        break;
        
      case 'url':
        properties[key] = property.url;
        break;
        
      case 'number':
        properties[key] = property.number;
        break;
        
      case 'checkbox':
        properties[key] = property.checkbox;
        break;
        
      case 'email':
        properties[key] = property.email;
        break;
        
      case 'phone_number':
        properties[key] = property.phone_number;
        break;
        
      case 'formula':
        // フォーミュラの型に応じて解析
        if (property.formula.type === 'string') {
          properties[key] = property.formula.string;
        } else if (property.formula.type === 'number') {
          properties[key] = property.formula.number;
        } else if (property.formula.type === 'boolean') {
          properties[key] = property.formula.boolean;
        } else if (property.formula.type === 'date') {
          properties[key] = property.formula.date?.start || null;
        }
        break;
        
      case 'relation':
        properties[key] = property.relation.map((item: any) => item.id);
        break;
        
      case 'rollup':
        // ロールアップの型に応じて解析
        if (property.rollup.type === 'number') {
          properties[key] = property.rollup.number;
        } else if (property.rollup.type === 'date') {
          properties[key] = property.rollup.date?.start || null;
        } else if (property.rollup.type === 'array') {
          properties[key] = property.rollup.array;
        }
        break;
        
      case 'created_time':
        properties[key] = property.created_time;
        break;
        
      case 'created_by':
        properties[key] = property.created_by;
        break;
        
      case 'last_edited_time':
        properties[key] = property.last_edited_time;
        break;
        
      case 'last_edited_by':
        properties[key] = property.last_edited_by;
        break;
        
      default:
        // 未知の型の場合はJSONとして保存
        properties[key] = JSON.stringify(property);
    }
  });
  
  // ページカバー画像がある場合は追加
  if (page.cover) {
    if (page.cover.type === 'external') {
      properties.cover = page.cover.external.url;
    } else if (page.cover.type === 'file') {
      properties.cover = page.cover.file.url;
    } else {
      properties.cover = null;
    }
  } else {
    properties.cover = null;
  }
  
  // ページアイコンがある場合は追加
  if (page.icon) {
    if (page.icon.type === 'emoji') {
      properties.icon = page.icon.emoji;
    } else if (page.icon.type === 'external') {
      properties.icon = page.icon.external.url;
    } else if (page.icon.type === 'file') {
      properties.icon = page.icon.file.url;
    } else {
      properties.icon = null;
    }
  } else {
    properties.icon = null;
  }
  
  // 基本的なページ情報を追加
  properties.id = page.id;
  properties.url = page.url;
  properties.created_time = page.created_time;
  properties.last_edited_time = page.last_edited_time;
  
  return properties;
}

/**
 * データベースアイテムのリストを取得して解析
 * @param databaseId データベースID
 * @param filter フィルター条件
 * @param sorts ソート条件
 * @returns 解析済みのアイテムリスト
 */
export async function getAndParseDatabase(
  databaseId: string,
  filter?: QueryDatabaseParameters['filter'],
  sorts?: QueryDatabaseParameters['sorts'],
  page_size?: number
) {
  try {
    // データベースからページを取得
    const pages = await queryDatabase(databaseId, filter, sorts, page_size);
    
    // 各ページのプロパティを解析
    const parsedPages = pages.map(page => parsePageProperties(page));
    
    return parsedPages;
  } catch (error) {
    console.error('Error getting and parsing database:', error);
    throw error;
  }
}
