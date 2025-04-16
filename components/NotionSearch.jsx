import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiSearch } from 'react-icons/fi';
import { FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import cs from 'classnames';

// スマートなインポート方法
import * as config from '@/lib/config';
import styles from './NotionSearch.module.css';

// 検索クエリをハイライト表示する関数
const highlightText = (text, query) => {
  if (!query || !text) return text;
  
  try {
    // 検索ワードをエスケープして正規表現で使用可能にする
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    // テキストを分割してハイライト
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  } catch (e) {
    // エラー時は元のテキストを返す
    return text;
  }
};

// タイトル表示を改善する関数
const getDisplayTitle = (result, searchQuery) => {
  // 実際のタイトルがある場合はそれを使用
  if (result.title && typeof result.title === 'string' && result.title.trim() && 
      !result.title.startsWith('ページ ')) {
    // 検索クエリに一致する部分をハイライト
    return highlightText(result.title, searchQuery);
  }
  
  // タイトルがない場合、プレビューテキストから生成
  if (result.preview && result.preview.text) {
    // プレビューテキストの最初の部分をタイトルとして使用
    const previewText = result.preview.text;
    const endIndex = Math.min(
      previewText.indexOf('.') > 0 ? previewText.indexOf('.') : 50,
      50
    );
    const titleFromPreview = previewText.substring(0, endIndex) + (previewText.length > endIndex ? '...' : '');
    return titleFromPreview.length > 10 ? highlightText(titleFromPreview, searchQuery) : getDefaultTitle(result);
  }
  
  // それ以外の場合はデフォルトタイトル
  return getDefaultTitle(result);
};

// デフォルトのタイトルを生成
const getDefaultTitle = (result) => {
  switch(result.object) {
    case 'page':
      return '無題のページ';
    case 'database':
      return 'データベース';
    case 'block':
      return result.type === 'image' ? '画像' : 
             result.type === 'code' ? 'コードブロック' :
             result.type === 'heading_1' ? '見出し' :
             'コンテンツ';
    default:
      return 'Notionコンテンツ';
  }
};

// プレビューテキストを表示
const getPreviewText = (result, searchQuery) => {
  if (!result.preview || !result.preview.text) return null;
  
  return (
    <p className={styles.searchResultPreview}>
      {highlightText(result.preview.text, searchQuery)}
    </p>
  );
};

// 結果タイプのラベルを取得
const getResultTypeLabel = (result) => {
  switch(result.object) {
    case 'page':
      return 'ページ';
    case 'database':
      return 'データベース';
    case 'block':
      if (result.type === 'image') return '画像';
      if (result.type === 'code') return 'コード';
      if (result.type && result.type.startsWith('heading')) return '見出し';
      return `ブロック${result.type ? ` (${result.type})` : ''}`;
    default:
      return 'コンテンツ';
  }
};

// 日付を読みやすい形式に変換
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    if (diffDays < 7) return `${diffDays}日前`;
    
    // それ以外は日付表示
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  } catch (e) {
    return dateStr;
  }
};

// SearchNotion関数を直接インポートするのではなく、ラッパーを作成
const searchNotion = async (params) => {
  // APIエンドポイントを使って検索を実行
  try {
    const response = await fetch(config.api.searchNotion, {
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        'content-type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Search request failed: ' + response.statusText);
    }
    
    return await response.json();
  } catch (err) {
    console.error('Error in searchNotion:', err);
    return { 
      results: [], 
      total: 0, 
      recordMap: { block: {} } 
    };
  }
};

export const NotionSearch = () => {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(true); // 最初から開く
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useOfficialApi, setUseOfficialApi] = useState(false);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  // 検索結果をリセット
  const resetSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError('');
  }, []);

  // 検索パネルを開く
  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
    resetSearch();
    
    // 入力欄にフォーカス
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, [resetSearch]);

  // 検索パネルを閉じる
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    resetSearch();
  }, [resetSearch]);

  // 検索実行
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 検索リクエストのパラメータをログに出力
      console.log('Search request params:', { 
        query: searchQuery,
        ancestorId: config.api.notionPageId,
        useOfficialApi
      });
      
      const results = await searchNotion({
        query: searchQuery,
        ancestorId: config.api.notionPageId, // NotionページIDを設定
        useOfficialApi
      });
      
      console.log('Search results:', results?.results?.length || 0);
      setSearchResults(results?.results || []);
    } catch (err) {
      console.error('Error performing search:', err);
      setError('検索中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, useOfficialApi]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESCキーで検索パネルを閉じる
      if (e.key === 'Escape') {
        closeSearch();
      }
      
      // Enterキーで検索を実行（検索ボックスにフォーカスがある場合）
      if (e.key === 'Enter' && document.activeElement === searchInputRef.current && searchQuery.trim()) {
        e.preventDefault();
        performSearch();
      }
      
      // Ctrl+K または Command+K で検索パネルを開く
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSearch, closeSearch, searchQuery, performSearch]);

  // 検索パネル外のクリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isSearchOpen && 
        searchResultsRef.current && 
        !searchResultsRef.current.contains(e.target) &&
        e.target !== searchInputRef.current
      ) {
        closeSearch();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen, closeSearch]);
  
  // コンポーネント初期化時に検索入力欄にフォーカス
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // 検索クエリが変更されたら自動検索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      }
    }, 300); // 300msの遅延で検索実行
    
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // 検索結果クリック時に検索パネルを閉じる
  const handleResultClick = useCallback(() => {
    closeSearch();
  }, [closeSearch]);

  // API切り替え
  const toggleApiType = useCallback(() => {
    setUseOfficialApi(!useOfficialApi);
    // API切り替え時に再検索
    if (searchQuery.trim()) {
      setTimeout(performSearch, 0);
    }
  }, [useOfficialApi, searchQuery, performSearch]);

  return (
    <>
      {/* 検索ボタン */}
      <button
        className={styles.searchTrigger}
        onClick={openSearch}
        aria-label="検索"
        title="検索 (Ctrl+K)"
      >
        <FiSearch size={20} />
      </button>
      
      {/* 検索パネル */}
      {isSearchOpen && (
        <div className={styles.searchOverlay}>
          <div className={styles.searchContainer} ref={searchResultsRef}>
            <div className={styles.searchHeader}>
              <div className={styles.searchInputWrapper}>
                <FiSearch className={styles.searchIcon} size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  placeholder="検索..."
                  aria-label="検索"
                />
                {searchQuery && (
                  <button
                    className={styles.clearButton}
                    onClick={() => setSearchQuery('')}
                    aria-label="検索クエリをクリア"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>
              
              <div className={styles.searchActions}>
                <label className={styles.apiToggle} title="Notion公式APIを使用して検索精度を向上（APIキーが設定されている場合）">
                  <input
                    type="checkbox"
                    checked={useOfficialApi}
                    onChange={toggleApiType}
                  />
                  <span className={styles.apiToggleText}>
                    公式API使用
                  </span>
                  <span className={styles.apiToggleHelp} title="Notion公式APIを使用して検索精度を向上（APIキーが設定されている場合）">
                    ℹ️
                  </span>
                </label>
                
                <button
                  className={styles.closeButton}
                  onClick={closeSearch}
                  aria-label="検索を閉じる"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>
            
            <div className={styles.searchBody}>
              {/* エラーメッセージ */}
              {error && (
                <div className={styles.searchError}>{error}</div>
              )}
              
              {/* 読み込み中 */}
              {isLoading && (
                <div className={styles.searchLoading}>
                  <span className={styles.loadingDot}></span>
                  <span className={styles.loadingDot}></span>
                  <span className={styles.loadingDot}></span>
                </div>
              )}
              
              {/* 検索結果 */}
              {!isLoading && searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  <h3 className={styles.searchResultsTitle}>検索結果 ({searchResults.length}件)</h3>
                  <ul className={styles.searchResultsList}>
                    {searchResults.map((result) => (
                      <li key={result.id} className={styles.searchResultItem}>
                        <Link
                          href={result.url && typeof result.url === 'string' 
                            ? (result.url.startsWith('/p/') 
                               ? result.url.replace('/p/', '/') 
                               : (result.url.startsWith('/') ? result.url : `/${result.id}`))
                            : `/${result.id || ''}`}
                          onClick={handleResultClick}
                          className={cs(styles.searchResultLink, {
                            [styles.pageResult]: result.object === 'page',
                            [styles.databaseResult]: result.object === 'database',
                            [styles.blockResult]: result.object === 'block',
                          })}
                        >
                          {/* 結果タイプのアイコン */}
                          <div className={styles.resultTypeIcon}>
                            {result.object === 'page' ? (
                              <span title="ページ">📄</span>
                            ) : result.object === 'database' ? (
                              <span title="データベース">📊</span>
                            ) : result.object === 'block' && result.type === 'image' ? (
                              <span title="画像">🖼️</span>
                            ) : result.object === 'block' ? (
                              <span title="ブロック">📝</span>
                            ) : (
                              <span title="Notionアイテム">📌</span>
                            )}
                          </div>
                          
                          <div className={styles.resultContent}>
                            <h4 className={styles.searchResultTitle}>
                              {result.title && !result.title.startsWith('ページ ') 
                                ? result.title 
                                : (result.preview && result.preview.text 
                                  ? result.preview.text.substring(0, 50) + (result.preview.text.length > 50 ? '...' : '')
                                  : (result.object === 'page' ? '無題のページ' : 
                                     result.object === 'database' ? 'データベース' : 
                                     result.object === 'block' ? 'ブロック内容' : 'Notionコンテンツ')
                                )}
                            </h4>
                            
                            {/* 親ページ情報の表示 */}
                            {result.parent?.title && (
                              <div className={styles.parentInfo}>
                                <span className={styles.parentTitle}>親ページ: {result.parent.title}</span>
                              </div>
                            )}
                            
                            {/* プレビューテキスト */}
                            {result.preview && result.preview.text && (
                              <p className={styles.searchResultPreview}>
                                {searchQuery && typeof result.preview.text === 'string' 
                                  ? highlightSearchQuery(result.preview.text, searchQuery)
                                  : (result.preview.text || 'プレビューなし')}
                              </p>
                            )}
                            
                            {/* 追加情報 */}
                            <div className={styles.resultMeta}>
                              {result.object === 'page' && result.date && (
                                <span className={styles.resultDate}>
                                  {result.date}
                                </span>
                              )}
                              
                              {result.object && (
                                <span className={styles.resultType}>
                                  {result.object === 'page' ? 'ページ' : 
                                    result.object === 'database' ? 'データベース' : 
                                    result.object === 'block' ? `ブロック (${result.type})` : 
                                    result.object}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* ページにカバー画像がある場合は表示 */}
                          {result.object === 'page' && result.cover && (
                            <div className={styles.resultThumbnail}>
                              <img 
                                src={result.cover} 
                                alt={result.title || 'ページサムネイル'} 
                                className={styles.thumbnailImage}
                              />
                            </div>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 検索結果なし */}
              {!isLoading && searchQuery && !error && searchResults.length === 0 && (
                <div className={styles.searchNoResults}>
                  「{searchQuery}」に一致する結果はありませんでした
                </div>
              )}
            </div>
            
            <div className={styles.searchFooter}>
              <p className={styles.searchHint}>
                <span className={styles.keyboardShortcut}>ESC</span> で閉じる | 
                <span className={styles.keyboardShortcut}>↑↓</span> で移動 |
                <span className={styles.keyboardShortcut}>Enter</span> で選択
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotionSearch;