import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScheduleItem } from '@/types/schedule';

const STORAGE_KEY = 'hourei_schedule_items';

export function useSchedule() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load schedule items:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveItems = async (newItems: ScheduleItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      setItems(newItems);
    } catch (e) {
      console.error('Failed to save schedule items:', e);
    }
  };

  const addItem = useCallback(async (item: ScheduleItem) => {
    const updated = [item, ...items];
    await saveItems(updated);
  }, [items]);

  const removeItem = useCallback(async (id: string) => {
    const updated = items.filter(item => item.id !== id);
    await saveItems(updated);
  }, [items]);

  return {
    items,
    loading,
    addItem,
    removeItem,
  };
}
