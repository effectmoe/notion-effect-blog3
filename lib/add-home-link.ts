// ページタイトルに自動的にホームリンクを追加するスクリプト
export function addHomeLinkToPageTitle() {
  if (typeof window === 'undefined') return; // サーバーサイドでは実行しない

  // DOMが読み込まれるのを待つ
  const addLink = () => {
    // ページタイトル要素を取得
    const pageTitleElement = document.querySelector('.notion-page-title-text');
    if (!pageTitleElement) {
      // 要素が見つからない場合は少し待ってから再試行
      setTimeout(addLink, 100);
      return;
    }

    // すでにリンクが設定されている場合は何もしない
    if (pageTitleElement.parentElement?.tagName === 'A') return;

    // リンク要素を作成
    const linkElement = document.createElement('a');
    linkElement.href = '/';
    linkElement.title = 'ホームに戻る';
    
    // クリックイベントを追加
    linkElement.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/';
    });

    // 親要素を取得して置き換え
    const parentElement = pageTitleElement.parentElement;
    if (parentElement) {
      // 元の要素をリンクで包む
      parentElement.insertBefore(linkElement, pageTitleElement);
      linkElement.appendChild(pageTitleElement);
    }
  };

  // 検索ボックスの位置調整
  const moveSearchBox = () => {
    // 検索ボックスと画面タイトル要素を取得
    const searchBox = document.querySelector('.notion-search');
    const pageTitle = document.querySelector('.notion-page-title');
    
    if (!searchBox || !pageTitle) {
      // 要素が見つからない場合は少し待ってから再試行
      setTimeout(moveSearchBox, 100);
      return;
    }
    
    // すでに移動済みの場合は何もしない
    if (pageTitle.contains(searchBox)) return;
    
    // 検索ボックスをページタイトルの子要素として移動
    pageTitle.appendChild(searchBox);
    
    // 検索ボックスのスタイルを調整
    const searchInput = searchBox.querySelector('input');
    if (searchInput) {
      searchInput.classList.add('notion-search-input');
      searchInput.placeholder = '検索...';
    }
  };

  // ページが読み込まれたら実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addLink();
      moveSearchBox();
    });
  } else {
    addLink();
    moveSearchBox();
  }

  // 動的に読み込まれる可能性があるので、数秒後にももう一度実行
  setTimeout(() => {
    addLink();
    moveSearchBox();
  }, 1000);
}
