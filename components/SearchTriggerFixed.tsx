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

  useEffect(() => {
    // キーボードイベントリスナーを追加
    document.addEventListener('keydown', handleKeyDown);
    
    // クリーンアップ
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 検索を開く関数
  const openSearch = useCallback(() => {
    console.log('検索ダイアログを開きます');
    setIsSearchOpen(true);
    // 検索が開いている間はボディのスクロールを禁止
    document.body.style.overflow = 'hidden';
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
        onClick={openSearch}
        aria-label="検索を開く"
      >
        <FiSearch size={20} />
        <span className={styles.searchLabel}>検索</span>
        <span className={styles.searchShortcut}>⌘K</span>
      </button>

      {isSearchOpen && <NotionSearchFixed onClose={closeSearch} />}
    </>
  );
};

export default SearchTriggerFixed;
