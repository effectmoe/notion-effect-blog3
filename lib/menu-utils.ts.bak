import { Client } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'
import { mapNotionImageUrl } from './map-image-url'

// Notion API クライアントのインスタンスを作成
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

// メニュー用データベースID
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
      
      // URLを構築（Notion PageへのリンクまたはSlugベースのURLなど）
      const slug = page.id.replace(/-/g, '')
      const url = `/${slug}`
      
      return {
        id: page.id,
        title,
        url
      }
    })
    
    return menuItems
  } catch (error) {
    console.error('Error fetching menu items from Notion:', error)
    // エラーが発生した場合はデフォルトメニューを返す
    return [
      { id: 'all', title: 'すべて', url: '/' },
      { id: 'blog', title: 'ブログ', url: '/blog' },
      { id: 'website', title: 'Webサイト', url: '/website' },
      { id: 'profile', title: 'プロフィール', url: '/profile' },
      { id: 'news', title: '新着順', url: '/news' }
    ]
  }
}

// サーバーサイドでメニュー項目を取得するためのヘルパー関数
export async function getMenuItemsForStaticProps() {
  const menuItems = await getMenuItems()
  return menuItems
}
