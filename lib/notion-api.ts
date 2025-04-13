import { NotionAPI } from 'notion-client'

export const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3',
  authToken: process.env.NOTION_API_SECRET  // 認証トークンを追加
})
