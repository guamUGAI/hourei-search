// e-Gov 法令API Version 2 型定義

export type LawType =
  | 'Constitution'
  | 'Act'
  | 'CabinetOrder'
  | 'ImperialOrder'
  | 'MinisterialOrdinance'
  | 'Rule'
  | 'Misc';

export type RepealStatus = 'None' | 'Repeal' | 'Expire' | 'Suspend' | 'LossOfEffectiveness';

export interface LawInfo {
  law_type: LawType;
  law_id: string;
  law_num: string;
  law_num_era: string;
  law_num_year: number;
  law_num_type: LawType;
  law_num_num: string;
  promulgation_date: string;
}

export interface RevisionInfo {
  law_revision_id: string;
  law_type: LawType;
  law_title: string;
  law_title_kana: string;
  abbrev: string | null;
  category: string;
  updated: string;
  amendment_promulgate_date: string | null;
  amendment_enforcement_date: string | null;
  amendment_enforcement_comment: string | null;
  amendment_scheduled_enforcement_date: string | null;
  amendment_law_id: string | null;
  amendment_law_title: string | null;
  amendment_law_title_kana: string | null;
  amendment_law_num: string | null;
  amendment_type: string;
  repeal_status: RepealStatus | boolean;
  repeal_date: string | null;
  remain_in_force: boolean;
  mission: string;
  current_revision_status: string;
}

// キーワード検索API レスポンス
export interface KeywordSearchItem {
  law_info: LawInfo;
  revision_info: RevisionInfo;
  sentences: Array<{
    position: string;
    text: string;
  }>;
}

export interface KeywordSearchResponse {
  total_count: number;
  sentence_count: number;
  next_offset: number;
  items: KeywordSearchItem[];
}

// 法令一覧取得API レスポンス
export interface LawListItem {
  law_info: LawInfo;
  revision_info: RevisionInfo;
  current_revision_info: RevisionInfo;
}

export interface LawListResponse {
  total_count: number;
  count: number;
  laws: LawListItem[];
}

// 法令本文取得API レスポンス
export interface LawNode {
  tag: string;
  attr: Record<string, string> | string;
  children: (LawNode | string)[];
}

export interface LawDataResponse {
  attached_files_info: {
    image_data: string;
    attached_files: Array<{
      law_revision_id: string;
      src: string;
      updated: string;
    }>;
  };
  law_info: LawInfo;
  revision_info: RevisionInfo;
  law_full_text: LawNode;
}

// ブックマーク
export interface Bookmark {
  law_id: string;
  law_title: string;
  law_num: string;
  law_type: LawType;
  saved_at: string;
}
