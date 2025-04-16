import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import NotionSearch from './NotionSearch';
import styles from './SearchTrigger.module.css';

const SearchTrigger: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openSearch = () => {
    setIsSearchOpen(true);
    // 検索が開いている間はボディのスクロールを禁止
    document.body.style.overflow = 'hidden';
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    // 検索が閉じたらスクロールを再開
    document.body.style.overflow = '';
  };

  return (
    <>
      <button
        className={styles.searchTrigger}
        onClick={openSearch}
        aria-label="検索を開く"
      >
        <FiSearch size={20} />
        <span className={styles.searchLabel}>検索</span>
      </button>

      {isSearchOpen && <NotionSearch onClose={closeSearch} />}
    </>
  );
};

export default SearchTrigger;