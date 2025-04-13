import { NotionPage } from '@/components/NotionPage'
import FilterableImageGallery from '@/components/FilterableImageGallery'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)

    return { props, revalidate: 10 }
  } catch (err) {
    console.error('page error', domain, err)

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export default function NotionDomainPage(props) {
  // より安全なアプローチのフィルタとソート機能を実装
  // NotionPageはそのまま使用し、CSSとグローバルスタイルを使ってフィルタリングを実現
  return (
    <FilterableImageGallery recordMap={props.recordMap}>
      <NotionPage {...props} />
    </FilterableImageGallery>
  )
}
