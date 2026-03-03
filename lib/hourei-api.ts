import type {
  KeywordSearchResponse,
  LawListResponse,
  LawDataResponse,
  LawType,
} from '@/types/hourei';

const BASE_URL = 'https://laws.e-gov.go.jp/api/2';

async function fetchJson<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  
  // response_format=json を常に指定
  url.searchParams.set('response_format', 'json');

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * キーワード検索API
 * 法令本文内のキーワードを含む法令を検索する
 */
export async function searchByKeyword(params: {
  keyword: string;
  law_type?: LawType[];
  limit?: number;
  offset?: number;
  sentence_text_size?: number;
  highlight_tag?: string;
}): Promise<KeywordSearchResponse> {
  const { law_type, ...rest } = params;
  const queryParams: Record<string, string | number | boolean | undefined> = {
    ...rest,
    sentence_text_size: rest.sentence_text_size ?? 150,
    highlight_tag: rest.highlight_tag ?? 'mark',
  };
  
  if (law_type && law_type.length > 0) {
    queryParams['law_type'] = law_type.join(',');
  }

  return fetchJson<KeywordSearchResponse>('/keyword', queryParams);
}

/**
 * 法令一覧取得API
 * 法令名や種別で法令一覧を取得する
 */
export async function getLaws(params: {
  law_title?: string;
  law_type?: LawType[];
  limit?: number;
  offset?: number;
}): Promise<LawListResponse> {
  const { law_type, ...rest } = params;
  const queryParams: Record<string, string | number | boolean | undefined> = { ...rest };
  
  if (law_type && law_type.length > 0) {
    queryParams['law_type'] = law_type.join(',');
  }

  return fetchJson<LawListResponse>('/laws', queryParams);
}

/**
 * 法令本文取得API
 * 法令IDまたは法令番号で法令本文を取得する
 */
export async function getLawData(lawIdOrNum: string): Promise<LawDataResponse> {
  return fetchJson<LawDataResponse>(`/law_data/${encodeURIComponent(lawIdOrNum)}`);
}

/**
 * 法令種別の日本語表示名
 */
export const LAW_TYPE_LABELS: Record<string, string> = {
  Constitution: '憲法',
  Act: '法律',
  CabinetOrder: '政令',
  ImperialOrder: '勅令',
  MinisterialOrdinance: '省令',
  Rule: '規則',
  Misc: 'その他',
};

/**
 * 法令種別のバッジカラー
 */
export const LAW_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Constitution: { bg: '#7C3AED', text: '#FFFFFF' },
  Act: { bg: '#1A56DB', text: '#FFFFFF' },
  CabinetOrder: { bg: '#059669', text: '#FFFFFF' },
  ImperialOrder: { bg: '#0891B2', text: '#FFFFFF' },
  MinisterialOrdinance: { bg: '#D97706', text: '#FFFFFF' },
  Rule: { bg: '#DB2777', text: '#FFFFFF' },
  Misc: { bg: '#64748B', text: '#FFFFFF' },
};

/**
 * 法令本文のJSONノードからプレーンテキストを抽出する
 */
export function extractText(node: unknown): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object') {
    const n = node as { children?: unknown[] };
    if (n.children) return n.children.map(extractText).join('');
  }
  return '';
}

/**
 * 法令本文ノードから条文一覧を抽出する
 */
export interface ArticleItem {
  num: string;
  caption: string;
  title: string;
  paragraphs: string[];
}

export function extractArticles(lawFullText: unknown): ArticleItem[] {
  const articles: ArticleItem[] = [];
  
  function traverse(node: unknown) {
    if (!node || typeof node !== 'object') return;
    const n = node as { tag?: string; attr?: Record<string, string> | string; children?: unknown[] };
    
    if (n.tag === 'Article') {
      const article: ArticleItem = {
        num: '',
        caption: '',
        title: '',
        paragraphs: [],
      };
      
      if (n.attr && typeof n.attr === 'object') {
        article.num = (n.attr as Record<string, string>).Num || '';
      }
      
      if (n.children) {
        for (const child of n.children) {
          if (child && typeof child === 'object') {
            const c = child as { tag?: string; children?: unknown[] };
            if (c.tag === 'ArticleCaption') {
              article.caption = extractText(c.children);
            } else if (c.tag === 'ArticleTitle') {
              article.title = extractText(c.children);
            } else if (c.tag === 'Paragraph') {
              article.paragraphs.push(extractText(c));
            }
          }
        }
      }
      
      articles.push(article);
    } else if (n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }
  
  traverse(lawFullText);
  return articles;
}
