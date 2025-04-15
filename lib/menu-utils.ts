import { Client } from '@notionhq/client'
import * as config from './config'
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

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
    
    // Menuプロパティがtrueのページをフィルタリング
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
          property: 'Last Updated',
          direction: 'descending'
        }
      ],
    })
    
    console.log('Number of results with Menu checked:', response.results.length)
    
    // 結果をメニュー項目の配列に変換
    const menuItems = response.results
      .filter((page): page is PageObjectResponse => 'properties' in page) // タイプガードフィルター
      .map((page) => {
        try {
          // タイトルプロパティの取得とタイプチェック
          let title = 'Untitled'
          
          // Name プロパティの取得
          const nameProperty = page.properties.Name
          if (nameProperty && nameProperty.type === 'title' && 
              nameProperty.title && nameProperty.title.length > 0 && 
              nameProperty.title[0].plain_text) {
            title = nameProperty.title[0].plain_text
          }
          
          // Title プロパティの取得（Name が存在しない場合のフォールバック）
          else if (page.properties.Title) {
            const titleProperty = page.properties.Title
            if (titleProperty.type === 'title' && 
                titleProperty.title && titleProperty.title.length > 0 && 
                titleProperty.title[0].plain_text) {
              title = titleProperty.title[0].plain_text
            }
          }
          
          // URLを構築（既存のサイトのURL構造に合わせる）
          const pageId = page.id.replace(/-/g, '')
          
          // URLパスを取得（Slugプロパティがあればそれを使用）
          let url = `/${pageId}`
          
          // Slug プロパティの確認
          const slugProperty = page.properties.Slug
          if (slugProperty && slugProperty.type === 'rich_text' && 
              slugProperty.rich_text && slugProperty.rich_text.length > 0 && 
              slugProperty.rich_text[0].plain_text) {
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
    
    // メニュー項目が見つからない場合は空の配列を返す
    if (menuItems.length === 0) {
      console.log('No menu items found with Menu checkbox checked')
      return []
    }
    
    return menuItems
  } catch (error) {
    console.error('Error fetching menu items from Notion:', error)
    // エラーが発生した場合は空の配列を返す
    return []
  }
}

// サーバーサイドでメニュー項目を取得するためのヘルパー関数
export async function getMenuItemsForStaticProps() {
  const menuItems = await getMenuItems()
  return menuItems
}
