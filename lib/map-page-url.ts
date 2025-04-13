import { type ExtendedRecordMap } from 'notion-types'
import { parsePageId, uuidToId } from 'notion-utils'

import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { type Site } from './types'
import { viewPageIds } from './notion-views'

// ページIDがビューかどうかをチェック
export const isPageView = (pageId: string): { isView: boolean; viewId?: string } => {
  // viewPageIds からビューIDとページIDのペアを取得
  const viewEntries = Object.entries(viewPageIds);
  
  // 指定されたページIDに一致するビューを探す
  const matchedView = viewEntries.find(([_, viewPageId]) => viewPageId === pageId);
  
  if (matchedView) {
    return { isView: true, viewId: matchedView[0] };
  }
  
  return { isView: false };
}

// include UUIDs in page URLs during local development but not in production
// (they're nice for debugging and speed up local dev)
const uuid = !!includeNotionIdInUrls

export const mapPageUrl =
  (site: Site, recordMap: ExtendedRecordMap, searchParams: URLSearchParams) =>
  (pageId = '') => {
    const pageUuid = parsePageId(pageId, { uuid: true })
    
    // ビューIDをチェック
    const viewCheck = isPageView(pageUuid);
    if (viewCheck.isView && viewCheck.viewId) {
      return createUrl(`/view/${viewCheck.viewId}`, searchParams);
    }

    if (uuidToId(pageUuid) === site.rootNotionPageId) {
      return createUrl('/', searchParams)
    } else {
      return createUrl(
        `/${getCanonicalPageId(pageUuid, recordMap, { uuid })}`,
        searchParams
      )
    }
  }

export const getCanonicalPageUrl =
  (site: Site, recordMap: ExtendedRecordMap) =>
  (pageId = '') => {
    const pageUuid = parsePageId(pageId, { uuid: true })
    
    // ビューIDをチェック
    const viewCheck = isPageView(pageUuid);
    if (viewCheck.isView && viewCheck.viewId) {
      return `https://${site.domain}/view/${viewCheck.viewId}`;
    }

    if (uuidToId(pageId) === site.rootNotionPageId) {
      return `https://${site.domain}`
    } else {
      return `https://${site.domain}/${getCanonicalPageId(pageUuid, recordMap, {
        uuid
      })}`
    }
  }

function createUrl(path: string, searchParams: URLSearchParams) {
  return [path, searchParams.toString()].filter(Boolean).join('?')
}
