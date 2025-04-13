import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './NotionViewTabs.module.css';

// ビュータブの情報
export type ViewTab = {
  id: string;
  name: string;
  path: string;
  pageId?: string; // Notionページ/ビューID（必要に応じて使用）
};

// タブコンポーネントの props 型定義
type NotionViewTabsProps = {
  tabs: ViewTab[];
};

const NotionViewTabs: React.FC<NotionViewTabsProps> = ({ tabs }) => {
  const router = useRouter();
  // 現在のパスを元にアクティブなタブを判断
  const currentPath = router.pathname + (router.query.view ? `/${router.query.view}` : '');
  
  return (
    <div className={styles.tabContainer}>
      {tabs.map((tab) => (
        <Link 
          key={tab.id} 
          href={tab.path}
          className={`${styles.tab} ${tab.path === currentPath || (tab.path === '/' && currentPath === '/') ? styles.active : ''}`}
        >
          {tab.name}
        </Link>
      ))}
    </div>
  );
};

export default NotionViewTabs;
