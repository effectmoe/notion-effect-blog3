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
  const [isFilterMounted, setIsFilterMounted] = useState(false)
  
  // Notionデータからカテゴリを抽出
  useEffect(() => {
    if (!props.recordMap) return
    
    // テスト用カテゴリ
    const mockCategories = ['Webサイト', 'プロフィール', 'ブログ']
    setCategories(mockCategories)
    
    // 1秒後にギャラリーを探してフィルターボタンを挿入
    const mountFilterButton = () => {
      const galleryView = document.querySelector('.notion-gallery-view')
      const header = document.querySelector('.notion-header')
      
      // 最初はギャラリービューに挿入を試みる
      if (galleryView) {
        const filterButton = document.getElementById('category-filter-button')
        if (filterButton && !isFilterMounted) {
          galleryView.style.position = 'relative'
          galleryView.insertBefore(filterButton, galleryView.firstChild)
          setIsFilterMounted(true)
          console.log('Filter mounted in gallery view')
          
          // カードにカテゴリ属性を追加
          const cards = document.querySelectorAll('.notion-collection-card')
          if (cards.length > 0) {
            // テスト用にランダムにカテゴリを割り当て
            cards.forEach((card, index) => {
              const category = mockCategories[index % mockCategories.length]
              card.setAttribute('data-category', category)
            })
            console.log('Added category attributes to cards')
          }
          
          return
        }
      }
      
      // ギャラリーが見つからない場合はヘッダーに挿入
      if (header && !isFilterMounted) {
        const filterButton = document.getElementById('category-filter-button')
        if (filterButton) {
          header.appendChild(filterButton)
          setIsFilterMounted(true)
          console.log('Filter mounted in header')
        }
      }
    }
    
    // DOMが完全に読み込まれるのを待つ
    setTimeout(mountFilterButton, 1000)
    
    // MutationObserverを設定してDOM変更を監視
    const observer = new MutationObserver((mutations) => {
      if (!isFilterMounted) {
        mountFilterButton()
      }
    })
    
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => {
      observer.disconnect()
    }
  }, [props.recordMap, isFilterMounted])
  
  return (
    <>
      <CategoryFilterButton categories={categories} />
      <NotionPage {...props} />
    </>
  )
}
