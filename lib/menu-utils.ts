import { Client } from '@notionhq/client'
// 不要なインポートを削除

// Notion API クライアントのインスタンスを作成
const notion = new Client({
  auth: process.env.NOTION_API_SECRET, // 環境変数の名前を修正
})

// メニュー用データベースID - Notionのデータベース表示URLから取得
const DATABASE_ID = '1ceb802cb0c6814ab43eddb38e80f2e0'

// NotionデータベースからMenuプロパティがtrueのページを取得
export async function getMenuItems() {
  try {
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
          property: 'Order',  // もし順序を指定するプロパティがあれば
          direction: 'ascending'
        }
      ],
    })

    // 結果をメニュー項目の配列に変換
    const menuItems = response.results.map((page: any) => {
      // タイトルプロパティから値を取得
      const titleProperty = page.properties.Name || page.properties.Title
      const title = titleProperty.title[0]?.plain_text || 'Untitled'
      
      // URLを構築（既存のサイトのURL構造に合わせる）
      const pageId = page.id.replace(/-/g, '')
      
      // URLパスを取得（Slugプロパティがあればそれを使用）
      let url = `/${pageId}`
      if (page.properties.Slug && page.properties.Slug.rich_text && page.properties.Slug.rich_text[0]) {
        url = `/${page.properties.Slug.rich_text[0].plain_text}`
      }
      
      return {
        id: page.id,
        title,
        url
      }
    })
    
    // Menuチェックボックスが付いたページがない場合は空の配列を返す
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
