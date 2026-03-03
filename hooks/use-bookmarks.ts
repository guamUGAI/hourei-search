import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Bookmark, LawType } from '@/types/hourei';

const STORAGE_KEY = 'hourei_bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load bookmarks:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveBookmarks = async (newBookmarks: Bookmark[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
    } catch (e) {
      console.error('Failed to save bookmarks:', e);
    }
  };

  const addBookmark = useCallback(async (item: {
    law_id: string;
    law_title: string;
    law_num: string;
    law_type: LawType;
  }) => {
    const newBookmark: Bookmark = {
      ...item,
      saved_at: new Date().toISOString(),
    };
    const updated = [newBookmark, ...bookmarks.filter(b => b.law_id !== item.law_id)];
    await saveBookmarks(updated);
  }, [bookmarks]);

  const removeBookmark = useCallback(async (lawId: string) => {
    const updated = bookmarks.filter(b => b.law_id !== lawId);
    await saveBookmarks(updated);
  }, [bookmarks]);

  const isBookmarked = useCallback((lawId: string) => {
    return bookmarks.some(b => b.law_id === lawId);
  }, [bookmarks]);

  const toggleBookmark = useCallback(async (item: {
    law_id: string;
    law_title: string;
    law_num: string;
    law_type: LawType;
  }) => {
    if (isBookmarked(item.law_id)) {
      await removeBookmark(item.law_id);
    } else {
      await addBookmark(item);
    }
  }, [isBookmarked, addBookmark, removeBookmark]);

  return {
    bookmarks,
    loading,
    addBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark,
  };
}
