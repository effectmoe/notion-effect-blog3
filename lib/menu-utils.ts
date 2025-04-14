// 静的なメニュー項目の定義
export function getMenuItems() {
  // デフォルトのメニュー項目
  return [
    { id: 'all', title: 'すべて', url: '/' },
    { id: 'blog', title: 'ブログ', url: '/blog' },
    { id: 'website', title: 'Webサイト', url: '/website' },
    { id: 'profile', title: 'プロフィール', url: '/profile' },
    { id: 'news', title: '新着順', url: '/news' }
  ]
}

// 静的なメニュー項目を取得するためのヘルパー関数（互換性のため）
export async function getMenuItemsForStaticProps() {
  return getMenuItems()
}
