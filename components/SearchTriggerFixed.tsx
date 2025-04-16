import React, { useState, useCallback, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import NotionSearchFixed from './NotionSearchFixed';
import styles from './SearchTrigger.module.css';

const SearchTriggerFixed: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Escキーを押したときに検索を閉じる
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
    
    // Ctrl+K または Command+K で検索を開く (ショートカットキー)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setIsSearchOpen(prev => !prev);
    }
  }, []);

  // キーボードイベントリスナー
  useEffect(() => {
    // キーボードイベントリスナーを追加
    document.addEventListener('keydown', handleKeyDown);
    
    // クリーンアップ
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 検索状態の変化を監視
  useEffect(() => {
    // isSearchOpen が変化したらログを出力
    console.log(`検索状態が変化しました: ${isSearchOpen ? 'オープン' : 'クローズ'}`);
  }, [isSearchOpen]);

  // 検索を開く関数
  const openSearch = useCallback(() => {
    console.log('検索ダイアログを開きます - SearchTriggerFixed');
    document.body.style.overflow = 'hidden'; // スクロールを禁止
    setIsSearchOpen(true);
  }, []);

  // 検索を閉じる関数
  const closeSearch = useCallback(() => {
    console.log('検索ダイアログを閉じます');
    setIsSearchOpen(false);
    // 検索が閉じたらスクロールを再開
    document.body.style.overflow = '';
  }, []);

  return (
    <>
      <button
        className={styles.searchTrigger}
        onClick={() => {
          console.log('検索ボタンがクリックされました');
          openSearch();
        }}
        aria-label="検索を開く"
      >
        <FiSearch size={20} />
        <span className={styles.searchLabel}>検索</span>
        <span className={styles.searchShortcut}>⌘K</span>
      </button>

      {/* 検索モーダル */}
      {isSearchOpen ? <NotionSearchFixed onClose={closeSearch} /> : null}
    </>
  );
};

export default SearchTriggerFixed;
