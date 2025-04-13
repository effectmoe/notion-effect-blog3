import { NotionPage } from '@/components/NotionPage'
import dynamic from 'next/dynamic'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

// クライアントサイドでのみ読み込むためにdynamic importを使用
const FilterableImageGallery = dynamic(
  () => import('@/components/FilterableImageGallery'),
  { ssr: false }
)

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
  return (
    <FilterableImageGallery recordMap={props.recordMap}>
      <NotionPage {...props} />
    </FilterableImageGallery>
  )
}
