import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { LawTypeBadge } from "@/components/law-type-badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useBookmarks } from "@/hooks/use-bookmarks";
import type { Bookmark } from "@/types/hourei";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function BookmarksScreen() {
  const colors = useColors();
  const router = useRouter();
  const { bookmarks, loading, removeBookmark } = useBookmarks();

  const handleItemPress = (item: Bookmark) => {
    router.push({
      pathname: '/law-detail' as never,
      params: {
        law_id: item.law_id,
        law_title: item.law_title,
        law_num: item.law_num,
        law_type: item.law_type,
      },
    });
  };

  const handleDelete = async (item: Bookmark) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      'お気に入りを削除',
      `「${item.law_title}」をお気に入りから削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => removeBookmark(item.law_id),
        },
      ]
    );
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: Bookmark }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.75 },
      ]}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <LawTypeBadge lawType={item.law_type} size="sm" />
          <Text style={[styles.savedDate, { color: colors.muted }]}>
            {formatDate(item.saved_at)}
          </Text>
        </View>
        <Text style={[styles.lawTitle, { color: colors.foreground }]} numberOfLines={2}>
          {item.law_title}
        </Text>
        <Text style={[styles.lawNum, { color: colors.muted }]} numberOfLines={1}>
          {item.law_num}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.deleteButton,
          { opacity: pressed ? 0.6 : 1 },
        ]}
        onPress={() => handleDelete(item)}
        hitSlop={8}
      >
        <IconSymbol name="xmark" size={16} color={colors.muted} />
      </Pressable>
    </Pressable>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="bookmark" size={56} color={colors.muted} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          お気に入りなし
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
          法令詳細画面のブックマークボタンから{'\n'}お気に入りに追加できます
        </Text>
      </View>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* ヘッダー */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>お気に入り</Text>
        {bookmarks.length > 0 && (
          <Text style={[styles.countText, { color: colors.muted }]}>
            {bookmarks.length}件
          </Text>
        )}
      </View>

      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.law_id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          bookmarks.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedDate: {
    fontSize: 12,
  },
  lawTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  lawNum: {
    fontSize: 12,
    lineHeight: 16,
  },
  deleteButton: {
    padding: 4,
    marginTop: 2,
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
});
