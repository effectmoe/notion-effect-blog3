import React from 'react';
import { type Block, type ExtendedRecordMap } from 'notion-types';

import { getPageTweet } from '@/lib/get-page-tweet';

import { PageActions } from './PageActions';
import { PageSocial } from './PageSocial';
import NotionComments from './NotionComments';

export function PageAside({
  block,
  recordMap,
  isBlogPost
}: {
  block: Block;
  recordMap: ExtendedRecordMap;
  isBlogPost: boolean;
}) {
  if (!block) {
    return null;
  }

  // ブログ投稿ページの場合はコメントとページアクションを表示
  if (isBlogPost) {
    // Tweet機能（既存の機能）
    const tweet = getPageTweet(block, recordMap);
    
    return (
      <React.Fragment>
        {tweet && <PageActions tweet={tweet} />}
        
        {/* Notionコメント機能（新機能） */}
        {process.env.NEXT_PUBLIC_ENABLE_COMMENTS === 'true' && (
          <NotionComments pageId={block.id} />
        )}
      </React.Fragment>
    );
  }

  // ブログ投稿ページ以外ではソーシャルコンポーネントを表示
  return <PageSocial />;
}
