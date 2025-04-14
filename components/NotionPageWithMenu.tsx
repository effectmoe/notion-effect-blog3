import React from 'react';
import { useRouter } from 'next/router';
import { NotionPage } from './NotionPage';
import HamburgerMenu from './HamburgerMenu';
import styles from './NotionPageWithMenu.module.css';

type NotionPageWithMenuProps = {
  [key: string]: any; // NotionPageに渡すpropsの型
};

const NotionPageWithMenu: React.FC<NotionPageWithMenuProps> = (props) => {
  const router = useRouter();
  const currentPath = router.asPath;
  
  return (
    <div className={styles.container}>
      <div className={styles.menuContainer}>
        <HamburgerMenu currentPath={currentPath} />
      </div>
      
      <div className={styles.pageContainer}>
        <NotionPage {...props} />
      </div>
    </div>
  );
};

export default NotionPageWithMenu;
