import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { LawTypeBadge } from "@/components/law-type-badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getLaws } from "@/lib/hourei-api";
import type { LawListItem, LawType } from "@/types/hourei";

const LAW_TYPE_FILTERS: { label: string; value: LawType | null }[] = [
  { label: 'すべて', value: null },
  { label: '法律', value: 'Act' },
  { label: '政令', value: 'CabinetOrder' },
  { label: '省令', value: 'MinisterialOrdinance' },
  { label: '規則', value: 'Rule' },
];

export default function LawsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LawListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedType, setSelectedType] = useState<LawType | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (title: string, lawType: LawType | null, newOffset = 0) => {
    if (newOffset === 0) {
      setLoading(true);
      setError(null);
      setResults([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await getLaws({
        law_title: title.trim() || undefined,
        law_type: lawType ? [lawType] : undefined,
        limit: 30,
        offset: newOffset,
      });

      if (newOffset === 0) {
        setResults(response.laws);
      } else {
        setResults(prev => [...prev, ...response.laws]);
      }
      setTotalCount(response.total_count);
      setOffset(newOffset + response.count);
      setHasSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '取得中にエラーが発生しました');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(text, selectedType, 0);
    }, 500);
  };

  const handleTypeFilter = (type: LawType | null) => {
    setSelectedType(type);
    performSearch(query, type, 0);
  };

  const handleLoadMore = () => {
    if (!loadingMore && results.length < totalCount) {
      performSearch(query, selectedType, offset);
    }
  };

  const handleItemPress = (item: LawListItem) => {
    router.push({
      pathname: '/law-detail' as never,
      params: {
        law_id: item.law_info.law_id,
        law_title: item.revision_info.law_title,
        law_num: item.law_info.law_num,
        law_type: item.law_info.law_type,
      },
    });
  };

  const renderItem = ({ item }: { item: LawListItem }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.75 },
      ]}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.cardHeader}>
        <LawTypeBadge lawType={item.law_info.law_type} size="sm" />
        <Text style={[styles.lawNum, { color: colors.muted }]} numberOfLines={1}>
          {item.law_info.law_num}
        </Text>
      </View>
      <Text style={[styles.lawTitle, { color: colors.foreground }]} numberOfLines={2}>
        {item.revision_info.law_title}
      </Text>
      {item.revision_info.category && (
        <Text style={[styles.category, { color: colors.muted }]}>
          分類: {item.revision_info.category}
        </Text>
      )}
      <View style={styles.cardFooter}>
        <Text style={[styles.dateText, { color: colors.muted }]}>
          公布: {item.law_info.promulgation_date}
        </Text>
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      </View>
    </Pressable>
  );

  const renderEmpty = () => {
    if (loading) return null;
    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol name="book.fill" size={48} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            法令一覧
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            法令名を入力して検索するか、{'\n'}種別を選択して絞り込んでください
          </Text>
          <Pressable
            style={[styles.loadAllButton, { backgroundColor: colors.primary }]}
            onPress={() => performSearch('', selectedType, 0)}
          >
            <Text style={styles.loadAllButtonText}>すべての法令を表示</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          該当なし
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
          条件に一致する法令が見つかりませんでした
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* ヘッダー */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>法令一覧</Text>
        {hasSearched && (
          <Text style={[styles.countText, { color: colors.muted }]}>
            {totalCount.toLocaleString()}件
          </Text>
        )}
      </View>

      {/* 検索バー */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="法令名で検索..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={handleQueryChange}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              performSearch(query, selectedType, 0);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => {
                setQuery('');
                performSearch('', selectedType, 0);
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* 法令種別フィルター */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={LAW_TYPE_FILTERS}
          keyExtractor={(item) => item.value ?? 'all'}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: selectedType === item.value ? colors.primary : colors.background,
                  borderColor: selectedType === item.value ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => handleTypeFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedType === item.value ? '#FFFFFF' : colors.foreground },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* 法令一覧 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>取得中...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => performSearch(query, selectedType, 0)}
          >
            <Text style={styles.retryButtonText}>再試行</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.law_info.law_id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={[
            styles.listContent,
            results.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countText: {
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  filterContainer: {
    borderBottomWidth: 0.5,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  listContentEmpty: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lawNum: {
    fontSize: 12,
    flex: 1,
  },
  lawTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  category: {
    fontSize: 12,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadAllButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  loadAllButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
