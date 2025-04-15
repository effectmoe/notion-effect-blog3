import { NotionAPI } from 'notion-client'

// Notion API初期化設定をログ出力
console.log('Initializing Notion API with:', {
  apiBaseUrl: process.env.NOTION_API_BASE_URL || 'default',
  authToken: process.env.NOTION_TOKEN ? 'defined' : 'undefined',
  activeUser: process.env.NOTION_ACTIVE_USER || 'default',
  userTimeZone: process.env.NOTION_USER_TIMEZONE || 'default'
});

export const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  authToken: process.env.NOTION_TOKEN,
  activeUser: process.env.NOTION_ACTIVE_USER,
  userTimeZone: process.env.NOTION_USER_TIMEZONE
})
