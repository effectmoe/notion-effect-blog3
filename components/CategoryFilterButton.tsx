import React, { useState } from 'react'
import styles from './CategoryFilterButton.module.css'

type CategoryFilterButtonProps = {
  categories: string[];
}

const CategoryFilterButton: React.FC<CategoryFilterButtonProps> = ({ categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setIsOpen(false);
    
    // カテゴリフィルタリングのロジック
    // DOM操作で直接要素を表示/非表示にする
    if (category) {
      // すべてのカードを一旦半透明にする
      document.querySelectorAll('.notion-collection-card').forEach((card: HTMLElement) => {
        card.style.opacity = '0.4';
        card.style.filter = 'grayscale(50%)';
        card.style.transition = 'opacity 0.3s ease, filter 0.3s ease';
      });
      
      // 選択したカテゴリに一致するカードだけを表示
      document.querySelectorAll(`[data-category="${category}"]`).forEach((card: HTMLElement) => {
        card.style.opacity = '1';
        card.style.filter = 'none';
      });
    } else {
      // カテゴリ未選択の場合はすべて表示
      document.querySelectorAll('.notion-collection-card').forEach((card: HTMLElement) => {
        card.style.opacity = '1';
        card.style.filter = 'none';
      });
    }
  };

  // カテゴリがない場合は何も表示しない
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className={styles.filterContainer} id="category-filter-button">
      <button 
        className={styles.filterButton} 
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {selectedCategory || 'すべてのカテゴリ'} ▼
      </button>
      
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div 
            className={`${styles.dropdownItem} ${selectedCategory === '' ? styles.active : ''}`}
            onClick={() => selectCategory('')}
          >
            すべて表示
          </div>
          
          {categories.map(category => (
            <div 
              key={category}
              className={`${styles.dropdownItem} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => selectCategory(category)}
            >
              {category}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryFilterButton;
