import { useState, useEffect } from 'react'
import { NotionPage } from '@/components/NotionPage'
import dynamic from 'next/dynamic'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

// クライアントサイドでのみ読み込むためにdynamic importを使用
const CategoryFilterButton = dynamic(
  () => import('@/components/CategoryFilterButton'),
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
  const [categories, setCategories] = useState<string[]>([])
  
  // Notionデータからカテゴリを抽出
  useEffect(() => {
    if (!props.recordMap) return
    
    // 固定のカテゴリリスト（テスト用）
    // 実際の実装では、Notionのデータからカテゴリを抽出する処理を追加
    const mockCategories = ['ブログ', 'チュートリアル', 'お知らせ']
    setCategories(mockCategories)
    
    // カードにdata-category属性を追加
    setTimeout(() => {
      const cards = document.querySelectorAll('.notion-collection-card')
      if (cards.length > 0) {
        // テスト用にランダムにカテゴリを割り当て
        cards.forEach((card, index) => {
          const category = mockCategories[index % mockCategories.length]
          card.setAttribute('data-category', category)
        })
        console.log('Added category attributes to cards')
      }
    }, 1000) // Notionコンテンツが読み込まれるのを待つ
  }, [props.recordMap])
  
  return (
    <>
      <CategoryFilterButton categories={categories} />
      <NotionPage {...props} />
    </>
  )
}
