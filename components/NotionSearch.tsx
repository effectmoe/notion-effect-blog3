import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiSearch } from 'react-icons/fi';
import { FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import cs from 'classnames';

import * as types from '@/lib/types';
import { searchNotion } from '@/lib/search-notion';
import * as config from '@/lib/config';
import styles from './NotionSearch.module.css';

export const NotionSearch: React.FC = () => {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<types.SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useOfficialApi, setUseOfficialApi] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

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

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESCキーで検索パネルを閉じる
      if (e.key === 'Escape') {
        closeSearch();
      }
      
      // Ctrl+K または Command+K で検索パネルを開く
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSearch, closeSearch]);

  // 検索パネル外のクリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isSearchOpen && 
        searchResultsRef.current && 
        !searchResultsRef.current.contains(e.target as Node) &&
        e.target !== searchInputRef.current
      ) {
        closeSearch();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen, closeSearch]);

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
                <label className={styles.apiToggle}>
                  <input
                    type="checkbox"
                    checked={useOfficialApi}
                    onChange={toggleApiType}
                  />
                  <span className={styles.apiToggleText}>
                    公式API使用
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
                          href={result.url || `/p/${result.id}`}
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
                              {result.title || 'Untitled'}
                            </h4>
                            
                            {/* プレビューテキスト */}
                            {result.preview && result.preview.text && (
                              <p className={styles.searchResultPreview}>
                                {result.preview.text || 'プレビューなし'}
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
