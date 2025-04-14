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

  // ページが読み込まれたら実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addLink);
  } else {
    addLink();
  }

  // 動的に読み込まれる可能性があるので、数秒後にももう一度実行
  setTimeout(addLink, 1000);
}
