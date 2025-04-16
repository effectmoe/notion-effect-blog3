import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import cs from 'classnames';
import { FiSearch } from 'react-icons/fi';
import { FaTimes } from 'react-icons/fa';
import styles from './NotionSearch.module.css';
import * as config from '../lib/config';

// 検索結果の型定義
interface SearchResult {
  id: string;
  title: string;
  url?: string;
  object: 'page' | 'database' | 'block';
  type?: string;
  preview?: {
    text: string;
  };
  date?: string;
  cover?: string;
}

// 検索関数の型定義
interface SearchNotionParams {
  query: string;
  ancestorId?: string;
  useOfficialApi?: boolean;
}

// 検索機能のメイン関数
const NotionSearchFixed: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchMode, setSearchMode] = useState('standard');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 検索実行関数
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 修正したAPIエンドポイントを使用
      const searchEndpoint = '/api/mcp-search-fix';
      
      console.log(`検索実行: "${searchQuery}" (モード: ${searchMode})`);
      
      // 検索リクエストの実行
      const response = await fetch(searchEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          ancestorId: config.rootNotionPageId,
          useOfficialApi: searchMode === 'advanced'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('検索APIエラー:', response.status, errorData);
        throw new Error(errorData.message || `検索リクエストが失敗しました: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`検索結果: ${data.results?.length || 0}件取得`);
      
      // 検索結果のタイトル処理を改善
      const processedResults = data.results?.map((result: SearchResult) => {
        // タイトルがない場合はプレビューテキストから生成
        if (!result.title || result.title === 'Untitled' || result.title.startsWith('ページ ')) {
          if (result.preview && result.preview.text) {
            // 最初のピリオドまたは50文字で切る
            const previewText = result.preview.text;
            const endIndex = Math.min(
              previewText.indexOf('.') > 0 ? previewText.indexOf('.') : 50,
              50
            );
            result.title = previewText.substring(0, endIndex) + '...';
          } else {
            // デフォルトタイトル
            result.title = getDefaultTitle(result);
          }
        }
        
        // URLが設定されていない場合にデフォルトURLを設定
        if (!result.url) {
          result.url = `/${result.id}`;
        }
        
        return result;
      }) || [];
      
      setSearchResults(processedResults);
    } catch (err) {
      console.error('検索エラー:', err);
      setError(err instanceof Error ? err.message : '検索中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, searchMode]);

  // 検索クエリが変更されたら検索実行（ディバウンス処理）
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return undefined;
    }
    
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // コンポーネントがマウントされたらフォーカス
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // 結果アイテムクリック時の処理
  const handleResultClick = () => {
    onClose();
  };

  // 検索を閉じる処理
  const closeSearch = () => {
    onClose();
  };

  // デフォルトのタイトルを生成
  const getDefaultTitle = (result: SearchResult) => {
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

  // 検索クエリをハイライト表示する関数
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    
    try {
      // 検索クエリをエスケープして正規表現で使用可能にする
      const escapedQuery = query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
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
  const getDisplayTitle = (result: SearchResult, searchQuery: string) => {
    // 実際のタイトルがある場合はそれを使用
    if (result.title && typeof result.title === 'string' && result.title.trim()) {
      // 検索クエリに一致する部分をハイライト
      return highlightText(result.title, searchQuery);
    }
    
    // タイトルがない場合、プレビューテキストから生成
    if (result.preview && result.preview.text) {
      // プレビューテキストの最初の部分をタイトルとして使用
      const previewText = result.preview.text;
      const titleFromPreview = previewText.split('.')[0].trim() + '...';
      return titleFromPreview.length > 10 ? titleFromPreview : getDefaultTitle(result);
    }
    
    // それ以外の場合はデフォルトタイトル
    return getDefaultTitle(result);
  };

  // プレビューテキストを表示
  const getPreviewText = (result: SearchResult, searchQuery: string) => {
    if (!result.preview || !result.preview.text) return null;
    
    return (
      <p className={styles.searchResultPreview}>
        {highlightText(result.preview.text, searchQuery)}
      </p>
    );
  };

  // 結果タイプのラベルを取得
  const getResultTypeLabel = (result: SearchResult) => {
    switch(result.object) {
      case 'page':
        return 'ページ';
      case 'database':
        return 'データベース';
      case 'block':
        if (result.type === 'image') return '画像';
        if (result.type === 'code') return 'コード';
        if (result.type && result.type.startsWith('heading')) return '見出し';
        return `ブロック (${result.type || '不明'})`;
      default:
        return 'コンテンツ';
    }
  };

  // 日付を読みやすい形式に変換
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return '今日';
      if (diffDays === 1) return '昨日';
      if (diffDays < 7) return `${diffDays}日前`;
      
      // それ以外は日付表示
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchHeader}>
        <div className={styles.searchInputWrapper}>
          <FiSearch className={styles.searchIcon} size={18} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            placeholder="ページやコンテンツを検索..."
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
          <div className={styles.searchMode}>
            <select 
              value={searchMode} 
              onChange={(e) => setSearchMode(e.target.value)}
              className={styles.searchModeSelect}
              title="検索モードを選択"
            >
              <option value="standard">標準検索</option>
              <option value="advanced">詳細検索（高精度）</option>
            </select>
          </div>
          
          <button
            className={styles.closeButton}
            onClick={closeSearch}
            aria-label="検索を閉じる"
          >
            <FaTimes size={16} />
          </button>
        </div>
      </div>

      <div className={styles.searchResults}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <span>検索中...</span>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button 
              onClick={performSearch} 
              className={styles.retryButton}
            >
              再試行
            </button>
          </div>
        ) : searchResults.length === 0 && searchQuery ? (
          <div className={styles.emptyState}>
            <p>「{searchQuery}」に一致する結果が見つかりませんでした。</p>
            <p className={styles.searchTipsText}>検索のヒント：</p>
            <ul className={styles.searchTips}>
              <li>別のキーワードで試してみてください</li>
              <li>キーワードの一部だけを入力してみてください</li>
              <li>日本語と英語の両方で試してみてください</li>
            </ul>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className={styles.resultsCount}>
              検索結果 ({searchResults.length}件)
            </div>
            <ul className={styles.searchResultsList}>
              {searchResults.map((result) => (
                <li key={result.id} className={styles.searchResultItem}>
                  <Link
                    href={result.url && typeof result.url === 'string' 
                      ? (result.url.startsWith('/p/') 
                        ? result.url.replace('/p/', '/') 
                        : (result.url.startsWith('/') ? result.url : `/${result.id}`))}
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
                      {/* タイトルをわかりやすく表示 */}
                      <h4 className={styles.searchResultTitle}>
                        {getDisplayTitle(result, searchQuery)}
                      </h4>
                      
                      {/* プレビューテキスト */}
                      {getPreviewText(result, searchQuery)}
                      
                      {/* いつ更新されたかなど追加情報 */}
                      <div className={styles.resultMeta}>
                        {result.date && (
                          <span className={styles.resultDate}>
                            {formatDate(result.date)}
                          </span>
                        )}
                        
                        <span className={styles.resultType}>
                          {getResultTypeLabel(result)}
                        </span>
                      </div>
                    </div>
                    
                    {/* サムネイル画像 */}
                    {result.cover && (
                      <div className={styles.resultThumbnail}>
                        <img 
                          src={result.cover} 
                          alt={typeof result.title === 'string' ? result.title : '検索結果'} 
                          className={styles.thumbnailImage}
                        />
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default NotionSearchFixed;
