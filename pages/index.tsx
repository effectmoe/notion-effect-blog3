import { useState, useEffect } from 'react'
import { NotionPage } from '@/components/NotionPage'
import NotionViewTabs from '@/components/NotionViewTabs'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { notionViews } from '@/lib/notion-views'
import { getMenuItems } from '@/lib/menu-utils'

export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)
    
    // NotionデータベースからMenuがtrueの項目を取得
    const menuItems = await getMenuItems()
    
    // propsにmenuItemsを追加
    return { 
      props: {
        ...props,
        menuItems
      }, 
      revalidate: 10 
    }
  } catch (err) {
    console.error('page error', domain, err)

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export default function NotionDomainPage(props) {
  return (
    <>
      {/* NotionViewTabsは削除 - ヘッダーメニューと重複するため */}
      <NotionPage {...props} />
    </>
  )
}
