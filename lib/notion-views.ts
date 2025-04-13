import { ViewTab } from '../components/NotionViewTabs';

// Notionのメインデータベースビュー設定
// 注意: 実際のNotionビューIDとページIDに置き換えてください
export const notionViews: ViewTab[] = [
  { 
    id: 'all', 
    name: 'すべて', 
    path: '/', 
    // メインページID（site.config.tsのrootNotionPageIdと同じ）
    pageId: '1ceb802cb0c680f29369dba86095fb38'
  },
  { 
    id: 'blog', 
    name: 'ブログ', 
    path: '/view/blog',
    // ブログカテゴリのビューID（Notionで作成したビューのID）
    pageId: '1ceb802cb0c680f29369dba86095fb38?v=xxxxxxxxxxxx' // 実際のビューIDに置き換え
  },
  { 
    id: 'website', 
    name: 'Webサイト', 
    path: '/view/website',
    pageId: '1ceb802cb0c680f29369dba86095fb38?v=xxxxxxxxxxxx' // 実際のビューIDに置き換え
  },
  { 
    id: 'profile', 
    name: 'プロフィール', 
    path: '/view/profile',
    pageId: '1ceb802cb0c680f29369dba86095fb38?v=xxxxxxxxxxxx' // 実際のビューIDに置き換え
  },
  { 
    id: 'new', 
    name: '新着順', 
    path: '/view/new',
    pageId: '1ceb802cb0c680f29369dba86095fb38?v=xxxxxxxxxxxx' // 実際のビューIDに置き換え
  }
];

// 各ビューIDとページIDのマッピング
export const viewPageIds: Record<string, string> = notionViews.reduce((acc, view) => {
  if (view.id !== 'all') {
    acc[view.id] = view.pageId || '';
  }
  return acc;
}, {} as Record<string, string>);
