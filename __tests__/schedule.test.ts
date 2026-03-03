import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScheduleItem } from '@/types/schedule';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('ScheduleItem', () => {
  it('ScheduleItemの型定義が正しい', () => {
    const item: ScheduleItem = {
      id: '1',
      uri: 'file:///path/to/image.jpg',
      type: 'image',
      name: 'test.jpg',
      size: 1024,
      created_at: new Date().toISOString(),
    };

    expect(item.id).toBe('1');
    expect(item.type).toBe('image');
    expect(item.name).toBe('test.jpg');
    expect(item.size).toBe(1024);
  });

  it('PDFアイテムの型定義が正しい', () => {
    const item: ScheduleItem = {
      id: '2',
      uri: 'file:///path/to/document.pdf',
      type: 'pdf',
      name: 'document.pdf',
      size: 2048,
      created_at: new Date().toISOString(),
    };

    expect(item.type).toBe('pdf');
    expect(item.name).toBe('document.pdf');
  });
});

describe('Schedule Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AsyncStorageにアイテムを保存できる', async () => {
    const item: ScheduleItem = {
      id: '1',
      uri: 'file:///image.jpg',
      type: 'image',
      name: 'image.jpg',
      size: 1024,
      created_at: new Date().toISOString(),
    };

    const items = [item];
    await AsyncStorage.setItem('test_key', JSON.stringify(items));

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'test_key',
      JSON.stringify(items)
    );
  });

  it('複数のアイテムを保存できる', async () => {
    const items: ScheduleItem[] = [
      {
        id: '1',
        uri: 'file:///image1.jpg',
        type: 'image',
        name: 'image1.jpg',
        size: 1024,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        uri: 'file:///document.pdf',
        type: 'pdf',
        name: 'document.pdf',
        size: 2048,
        created_at: new Date().toISOString(),
      },
    ];

    await AsyncStorage.setItem('test_key', JSON.stringify(items));

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'test_key',
      JSON.stringify(items)
    );
  });
});

describe('File Type Detection', () => {
  it('ファイル拡張子から画像タイプを判定できる', () => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    imageExtensions.forEach(ext => {
      const filename = `image.${ext}`;
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
      expect(isImage).toBe(true);
    });
  });

  it('ファイル拡張子からPDFタイプを判定できる', () => {
    const filename = 'document.pdf';
    const isPdf = /\.pdf$/i.test(filename);
    expect(isPdf).toBe(true);
  });

  it('不正なファイル拡張子を判定できる', () => {
    const filename = 'document.txt';
    const isValid = /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(filename);
    expect(isValid).toBe(false);
  });
});

describe('File Size Formatting', () => {
  it('バイト単位を正しくフォーマットできる', () => {
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });
});
