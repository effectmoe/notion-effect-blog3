import React, { useState, useEffect } from 'react'
import styles from './FilterSort.module.css'

type FilterSortProps = {
  categories: string[];
  onFilterChange: (category: string) => void;
  onSortChange: (sortOrder: string) => void;
}

const FilterSort: React.FC<FilterSortProps> = ({ categories, onFilterChange, onSortChange }) => {
  return (
    <div className={styles.filterSortContainer}>
      <div className={styles.filterContainer}>
        <label htmlFor="category-filter">カテゴリ:</label>
        <select 
          id="category-filter"
          onChange={(e) => onFilterChange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">すべて</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      
      <div className={styles.sortContainer}>
        <label htmlFor="sort-select">並び順:</label>
        <select 
          id="sort-select"
          onChange={(e) => onSortChange(e.target.value)}
          className={styles.sortSelect}
        >
          <option value="newest">新しい順</option>
          <option value="oldest">古い順</option>
          <option value="title_asc">タイトル (A-Z)</option>
          <option value="title_desc">タイトル (Z-A)</option>
        </select>
      </div>
    </div>
  )
}

export default FilterSort
