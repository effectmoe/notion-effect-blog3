import { GetStaticProps, GetStaticPaths } from 'next';
import { NotionPage } from '@/components/NotionPage';
import NotionViewTabs from '@/components/NotionViewTabs';
import { resolveNotionPage } from '@/lib/resolve-notion-page';
import { notionViews, viewPageIds } from '@/lib/notion-views';

// 静的パスの生成
export const getStaticPaths: GetStaticPaths = async () => {
  // notionViews から 'all' 以外のビューのIDを取得
  const paths = notionViews
    .filter(view => view.id !== 'all')
    .map(view => ({
      params: { view: view.id }
    }));

  return {
    paths,
    fallback: false // 未定義のパスは404に
  };
};

// 各ビューのプロパティを取得
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const viewId = params?.view as string;
  const pageId = viewPageIds[viewId];

  if (!pageId) {
    // 該当するビューIDがない場合はエラー
    return {
      notFound: true
    };
  }

  try {
    // Notionページのデータを取得
    const props = await resolveNotionPage(pageId);
    return { 
      props,
      revalidate: 10 // ISRを有効化（10秒ごとに再検証）
    };
  } catch (err) {
    console.error('page error', viewId, err);
    throw err;
  }
};

// ビュー別ページコンポーネント
export default function ViewPage(props) {
  return (
    <>
      <NotionViewTabs tabs={notionViews} />
      <NotionPage {...props} />
    </>
  );
}
