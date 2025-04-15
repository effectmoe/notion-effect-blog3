import { type ParsedUrlQuery } from 'node:querystring'

import { type ExtendedRecordMap, type PageMap } from 'notion-types'

export * from 'notion-types'

export type NavigationStyle = 'default' | 'custom'

export interface NavigationLink {
  title: string
  pageId?: string
  url?: string
}

export interface PageError {
  message?: string
  statusCode: number
}

export interface PageProps {
  site?: Site
  recordMap?: ExtendedRecordMap
  pageId?: string
  error?: PageError
}

export interface ExtendedTweetRecordMap extends ExtendedRecordMap {
  tweets: Record<string, any>
}

export interface Params extends ParsedUrlQuery {
  pageId: string
}

export interface Site {
  name: string
  domain: string

  rootNotionPageId: string
  rootNotionSpaceId: string

  // settings
  html?: string
  fontFamily?: string
  darkMode?: boolean
  previewImages?: boolean

  // navigation
  navigationStyle?: NavigationStyle
  navigationLinks?: Array<NavigationLink>

  // opengraph metadata
  description?: string
  image?: string
}

export interface SiteMap {
  site: Site
  pageMap: PageMap
  canonicalPageMap: CanonicalPageMap
}

export interface CanonicalPageMap {
  [canonicalPageId: string]: string
}

export interface PageUrlOverridesMap {
  // maps from a URL path to the notion page id the page should be resolved to
  // (this overrides the built-in URL path generation for these pages)
  [pagePath: string]: string
}

export interface PageUrlOverridesInverseMap {
  // maps from a notion page id to the URL path the page should be resolved to
  // (this overrides the built-in URL path generation for these pages)
  [pageId: string]: string
}

export interface NotionPageInfo {
  pageId: string
  title: string
  image: string
  imageObjectPosition: string
  author: string
  authorImage: string
  detail: string
}

export interface SearchParams {
  query: string
  ancestorId: string
  limit?: number
  userLocale?: string
  useOfficialApi?: boolean
}

export interface SearchResult {
  id: string
  title: string
  url: string
  preview?: {
    text?: string
    imageUrl?: string
  }
  cover?: string
  date?: string
  object?: string
  type?: string
  properties?: Record<string, any>
  parent?: {
    id?: string
    title?: string
  }
  
  // notion-types の SearchResult に必要なプロパティ
  isNavigable: boolean // オプショナルから必須に変更
  score: number // オプショナルから必須に変更
  highlight: {
    pathText: string
    text: string
  }
}

export interface SearchResults {
  results: SearchResult[]
  total: number
  recordMap: {
    block: Record<string, any>
    [key: string]: Record<string, any>
  }
}
