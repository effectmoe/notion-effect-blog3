import { Client } from '@notionhq/client'
import * as config from './config'
import { PageObjectResponse, PartialPageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

// Notion API クライアントのインスタンスを作成
const notion = new Client({
  auth: process.env.NOTION_API_SECRET, // 環境変数の名前を修正
})

// メニュー用データベースID - ユーザーから提供された正確なデータベースID
const DATABASE_ID = '1ceb802cb0c6814ab43eddb38e80f2e0'

// NotionデータベースからMenuプロパティがtrueのページを取得
export async function getMenuItems() {
  try {
    console.log('Fetching menu items with DATABASE_ID:', DATABASE_ID)
    
    // まず、すべてのページを取得して、プロパティの構造を確認
    const allPagesResponse = await notion.databases.query({
      database_id: DATABASE_ID,
    })
    
    console.log('All Pages Response:', JSON.stringify(allPagesResponse, null, 2))
    console.log('Number of all pages:', allPagesResponse.results.length)
    
    // 最初のページのプロパティを確認
    if (allPagesResponse.results.length > 0) {
      const firstPage = allPagesResponse.results[0]
      // PageObjectResponseかどうかを確認するタイプガードを追加
      if ('properties' in firstPage) {
        console.log('First page properties:', JSON.stringify(firstPage.properties, null, 2))
      } else {
        console.log('First page does not have properties field')
      }
    }
    
    // Menuプロパティが見つからない場合のエラー処理
    try {
      // Menuプロパティを持つページをフィルタリング
      const response = await notion.databases.query({
        database_id: DATABASE_ID,
        filter: {
          property: 'Menu',
          checkbox: {
            equals: true
          }
        },
        sorts: [
          {
            property: 'Last Updated',  // 更新日時で並べ替え
            direction: 'descending'
          }
        ],
      })
      
      console.log('Menu Filtered Response:', JSON.stringify(response, null, 2))
      console.log('Number of results with Menu checked:', response.results.length)
      
      // 結果をメニュー項目の配列に変換
      const menuItems = response.results
        .filter((page): page is PageObjectResponse => 'properties' in page) // タイプガードフィルター
        .map((page) => {
          try {
            // タイトルプロパティから値を取得
            const titleProperty = page.properties.Name || page.properties.Title
            const title = titleProperty?.title?.[0]?.plain_text || 'Untitled'
            
            // URLを構築（既存のサイトのURL構造に合わせる）
            const pageId = page.id.replace(/-/g, '')
            
            // URLパスを取得（Slugプロパティがあればそれを使用）
            let url = `/${pageId}`
            const slugProperty = page.properties.Slug
            if (slugProperty && 'rich_text' in slugProperty && 
                slugProperty.rich_text && slugProperty.rich_text[0]) {
              url = `/${slugProperty.rich_text[0].plain_text}`
            }
            
            return {
              id: page.id,
              title,
              url
            }
          } catch (err) {
            console.error(`Error processing page ${page.id}:`, err)
            return null
          }
        })
        .filter((item): item is { id: string; title: string; url: string } => item !== null)
      
      // Menuチェックボックスが付いたページがない場合は空の配列を返す
      if (menuItems.length === 0) {
        console.log('No menu items found with Menu checkbox checked')
        return []
      }
      
      return menuItems
    } catch (error) {
      console.error('Error fetching menu items from Notion:', error)
      // エラーのスタックトレースを出力
      if (error instanceof Error) {
        console.error('Error stack:', error.stack)
        console.error('Error message:', error.message)
      }
      // エラーが発生した場合は空の配列を返す
      return []
    }
  } catch (outerError) {
    console.error('Outer error fetching menu items from Notion:', outerError)
    return []
  }
}

// サーバーサイドでメニュー項目を取得するためのヘルパー関数
export async function getMenuItemsForStaticProps() {
  const menuItems = await getMenuItems()
  return menuItems
}
