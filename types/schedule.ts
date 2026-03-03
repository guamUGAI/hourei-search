// 日程管理用の型定義

export interface ScheduleItem {
  id: string;
  uri: string;
  type: 'image' | 'pdf';
  name: string;
  size: number;
  created_at: string;
}

export interface ScheduleStore {
  items: ScheduleItem[];
}
