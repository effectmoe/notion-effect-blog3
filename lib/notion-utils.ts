import { getPageProperty } from 'notion-utils'
import { parsePageProperties } from './notion-official-api'

// リッチテキストをプレーンテキストに変換
export function richTextToPlainText(richText: any[]): string {
  if (!richText || !Array.isArray(richText) || richText.length === 0) {
    return '';
  }
  
  return richText.map(text => text.plain_text || '').join('');
}

// リッチテキストをマークダウンに変換
export function richTextToMarkdown(richText: any[]): string {
  if (!richText || !Array.isArray(richText) || richText.length === 0) {
    return '';
  }
  
  const parts = richText.map(text => {
    let content = text.plain_text || '';
    
    // スタイルの適用
    if (text.annotations.bold) {
      content = `**${content}**`;
    }
    
    if (text.annotations.italic) {
      content = `*${content}*`;
    }
    
    if (text.annotations.strikethrough) {
      content = `~~${content}~~`;
    }
    
    if (text.annotations.code) {
      content = `\`${content}\``;
    }
    
    // リンクの処理
    if (text.href) {
      content = `[${content}](${text.href})`;
    }
    
    return content;
  });
  
  return parts.join('');
}

/**
 * 公式APIから取得したブロックをHTMLに変換
 * @param block ブロック
 * @returns HTML
 */
export function renderBlockToHTML(block: any): string {
  // ブロックがない場合は空文字列を返す
  if (!block) return '';
  
  // ブロックタイプを取得
  const type = block.type;
  if (!type) return '';
  
  const content = block[type];
  
  switch (type) {
    case 'paragraph':
      return `<p>${richTextToMarkdown(content.rich_text)}</p>`;
      
    case 'heading_1':
      return `<h1>${richTextToMarkdown(content.rich_text)}</h1>`;
      
    case 'heading_2':
      return `<h2>${richTextToMarkdown(content.rich_text)}</h2>`;
      
    case 'heading_3':
      return `<h3>${richTextToMarkdown(content.rich_text)}</h3>`;
      
    case 'bulleted_list_item':
      return `<li>${richTextToMarkdown(content.rich_text)}</li>`;
      
    case 'numbered_list_item':
      return `<li>${richTextToMarkdown(content.rich_text)}</li>`;
      
    case 'to_do':
      const checked = content.checked ? 'checked' : '';
      return `<div class="to-do-item">
        <input type="checkbox" ${checked} disabled />
        <span>${richTextToMarkdown(content.rich_text)}</span>
      </div>`;
      
    case 'toggle':
      return `<details>
        <summary>${richTextToMarkdown(content.rich_text)}</summary>
        ${block.children ? block.children.map((child: any) => renderBlockToHTML(child)).join('') : ''}
      </details>`;
      
    case 'code':
      return `<pre><code class="language-${content.language || 'plaintext'}">${content.rich_text.map((t: any) => t.plain_text).join('')}</code></pre>`;
      
    case 'quote':
      return `<blockquote>${richTextToMarkdown(content.rich_text)}</blockquote>`;
      
    case 'divider':
      return `<hr />`;
      
    case 'image':
      const imageUrl = content.type === 'external' ? content.external.url : content.file.url;
      const caption = content.caption?.length > 0 ? richTextToMarkdown(content.caption) : '';
      return `<figure>
        <img src="${imageUrl}" alt="${caption}" loading="lazy" />
        ${caption ? `<figcaption>${caption}</figcaption>` : ''}
      </figure>`;
      
    case 'callout':
      const emoji = content.icon?.type === 'emoji' ? content.icon.emoji : '';
      return `<div class="callout">
        ${emoji ? `<div class="callout-emoji">${emoji}</div>` : ''}
        <div class="callout-content">${richTextToMarkdown(content.rich_text)}</div>
      </div>`;
      
    case 'bookmark':
      const url = content.url || '';
      return `<a href="${url}" class="bookmark" target="_blank" rel="noopener noreferrer">${url}</a>`;
      
    default:
      return `<div class="unsupported-block">Unsupported block type: ${type}</div>`;
  }
}

/**
 * 公式APIから取得したブロックの配列をHTMLに変換
 * @param blocks ブロックの配列
 * @returns HTML
 */
export function renderBlocksToHTML(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return '';
  }
  
  let html = '';
  let inList = null; // 'ul' or 'ol' or null
  
  blocks.forEach((block, index) => {
    const type = block.type;
    
    // リスト処理の開始
    if (type === 'bulleted_list_item' && inList !== 'ul') {
      if (inList === 'ol') {
        html += '</ol>';
      }
      html += '<ul>';
      inList = 'ul';
    } else if (type === 'numbered_list_item' && inList !== 'ol') {
      if (inList === 'ul') {
        html += '</ul>';
      }
      html += '<ol>';
      inList = 'ol';
    } else if (type !== 'bulleted_list_item' && type !== 'numbered_list_item' && inList) {
      // リスト終了
      html += inList === 'ul' ? '</ul>' : '</ol>';
      inList = null;
    }
    
    // ブロックをレンダリング
    html += renderBlockToHTML(block);
    
    // 最後のブロックでリスト処理の終了
    if (index === blocks.length - 1 && inList) {
      html += inList === 'ul' ? '</ul>' : '</ol>';
    }
  });
  
  return html;
}

// Notionページからカテゴリを抽出する関数
export function extractCategories(recordMap: any): string[] {
  if (!recordMap || !recordMap.collection) {
    return []
  }

  try {
    // コレクションからスキーマ情報を取得
    const collectionValues = Object.values(recordMap.collection) as Array<{value: any}>
    const collection = collectionValues[0]?.value
    if (!collection || !collection.schema) {
      return []
    }

    // カテゴリとしてマークされたプロパティを探す（通常は 'select' タイプ）
    const categoryProp = Object.entries(collection.schema).find(
      ([_, value]: [string, any]) => {
        return (value as any).name.toLowerCase() === 'category' || 
               (value as any).name.toLowerCase() === 'カテゴリ'
      }
    )

    if (!categoryProp) {
      // バックアップ：タグやタイプなど他の選択系プロパティを探す
      const selectProps = Object.entries(collection.schema).filter(
        ([_, value]: [string, any]) => (value as any).type === 'select'
      )
      
      if (selectProps.length > 0) {
        const firstSelectProp = selectProps[0]
        
        const categoryPropId = firstSelectProp[0]
        // ページのブロックからカテゴリ値を抽出
        const categories = new Set<string>()
        
        Object.values(recordMap.block).forEach((block: any) => {
          if (block.value && block.value.properties) {
            const category = getPageProperty(categoryPropId, block.value, recordMap)
            if (category && typeof category === 'string') {
              categories.add(category)
            }
          }
        })
        
        return Array.from(categories).sort()
      }
      
      return []
    }

    const categoryPropId = categoryProp[0]

    // ページのブロックからカテゴリ値を抽出
    const categories = new Set<string>()
    
    Object.values(recordMap.block).forEach((block: any) => {
      if (block.value && block.value.properties) {
        const category = getPageProperty(categoryPropId, block.value, recordMap)
        if (category && typeof category === 'string') {
          categories.add(category)
        }
      }
    })

    return Array.from(categories).sort()
  } catch (err) {
    console.error('Failed to extract categories:', err)
    return []
  }
}

// Notionブロック配列からカテゴリを抽出
export function getPageCategory(page: any, recordMap: any): string {
  if (!page || !recordMap || !recordMap.collection) {
    return ''
  }
  
  try {
    // コレクションからスキーマ情報を取得
    const collectionValues = Object.values(recordMap.collection) as Array<{value: any}>
    const collection = collectionValues[0]?.value
    if (!collection || !collection.schema) {
      return ''
    }

    // カテゴリプロパティを見つける
    const categoryProp = Object.entries(collection.schema).find(
      ([_, value]: [string, any]) => 
        value.name.toLowerCase() === 'category' || 
        value.name.toLowerCase() === 'カテゴリ'
    )

    if (!categoryProp) {
      // バックアップ：最初のセレクトタイプのプロパティを使用
      const selectProps = Object.entries(collection.schema).filter(
        ([_, value]: [string, any]) => value.type === 'select'
      )
      
      if (selectProps.length > 0) {
        const fallbackProp = selectProps[0]
        
        const fallbackPropId = fallbackProp[0]
        const fallbackCategory = getPageProperty(fallbackPropId, page, recordMap)
        return fallbackCategory ? fallbackCategory.toString() : ''
      }
      
      return ''
    }

    const categoryPropId = categoryProp[0]
    
    // ページのカテゴリを取得
    const category = getPageProperty(categoryPropId, page, recordMap)
    return category ? category.toString() : ''
  } catch (err) {
    console.error('Failed to get page category:', err)
    return ''
  }
}

// ページの作成日を取得
export function getPageCreationTime(page: any): string {
  if (!page) return ''
  
  try {
    return page.created_time || ''
  } catch (err) {
    console.error('Failed to get page creation time:', err)
    return ''
  }
}

// ページをソートする関数
export function sortPages(pages: any[], sortOrder: string, recordMap: any): any[] {
  if (!pages || !pages.length) return []
  
  const sortedPages = [...pages]
  
  switch (sortOrder) {
    case 'newest':
      sortedPages.sort((a, b) => {
        const dateA = new Date(getPageCreationTime(a)).getTime()
        const dateB = new Date(getPageCreationTime(b)).getTime()
        return dateB - dateA
      })
      break
      
    case 'oldest':
      sortedPages.sort((a, b) => {
        const dateA = new Date(getPageCreationTime(a)).getTime()
        const dateB = new Date(getPageCreationTime(b)).getTime()
        return dateA - dateB
      })
      break
      
    case 'title_asc':
      sortedPages.sort((a, b) => {
        const titleA = a.title || ''
        const titleB = b.title || ''
        return titleA.localeCompare(titleB)
      })
      break
      
    case 'title_desc':
      sortedPages.sort((a, b) => {
        const titleA = a.title || ''
        const titleB = b.title || ''
        return titleB.localeCompare(titleA)
      })
      break
      
    default:
      // デフォルトは新しい順
      sortedPages.sort((a, b) => {
        const dateA = new Date(getPageCreationTime(a)).getTime()
        const dateB = new Date(getPageCreationTime(b)).getTime()
        return dateB - dateA
      })
  }
  
  return sortedPages
}

// カテゴリでページをフィルタリングする関数
export function filterPagesByCategory(pages: any[], category: string, recordMap: any): any[] {
  if (!pages || !pages.length) {
    return []
  }
  if (!category) {
    return pages
  }
  
  return pages.filter(page => {
    const pageCategory = getPageCategory(page, recordMap)
    return pageCategory === category
  })
}
