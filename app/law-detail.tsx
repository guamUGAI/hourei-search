import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { LawTypeBadge } from "@/components/law-type-badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { getLawData, extractArticles } from "@/lib/hourei-api";
import type { ArticleItem } from "@/lib/hourei-api";
import type { LawType } from "@/types/hourei";
import type { LawDataResponse } from "@/types/hourei";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function LawDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    law_id: string;
    law_title: string;
    law_num: string;
    law_type: string;
  }>();

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [lawData, setLawData] = useState<LawDataResponse | null>(null);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookmarked = isBookmarked(params.law_id);

  useEffect(() => {
    loadLawData();
  }, [params.law_id]);

  const loadLawData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLawData(params.law_id);
      setLawData(data);
      const extracted = extractArticles(data.law_full_text);
      setArticles(extracted);
    } catch (e) {
      setError(e instanceof Error ? e.message : '法令データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await toggleBookmark({
      law_id: params.law_id,
      law_title: params.law_title,
      law_num: params.law_num,
      law_type: params.law_type as LawType,
    });
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right"]}>
      {/* ナビゲーションバー */}
      <View style={[styles.navbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.navButton, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>
          法令詳細
        </Text>
        <Pressable
          style={({ pressed }) => [styles.navButton, { opacity: pressed ? 0.6 : 1 }]}
          onPress={handleBookmark}
        >
          <IconSymbol
            name={bookmarked ? "bookmark.fill" : "bookmark"}
            size={24}
            color={bookmarked ? colors.primary : colors.muted}
          />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>法令データを取得中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadLawData}
          >
            <Text style={styles.retryButtonText}>再試行</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 法令ヘッダー */}
          <View style={[styles.lawHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LawTypeBadge lawType={params.law_type} />
            <Text style={[styles.lawTitle, { color: colors.foreground }]}>
              {params.law_title || lawData?.revision_info.law_title}
            </Text>
            {params.law_num ? (
              <Text style={[styles.lawNum, { color: colors.muted }]}>
                {params.law_num}
              </Text>
            ) : null}
            {lawData?.revision_info.amendment_enforcement_date && (
              <Text style={[styles.lawDate, { color: colors.muted }]}>
                施行日: {lawData.revision_info.amendment_enforcement_date}
              </Text>
            )}
          </View>

          {/* 条文一覧 */}
          {articles.length > 0 ? (
            <View style={styles.articlesContainer}>
              {articles.map((article, index) => (
                <View
                  key={index}
                  style={[styles.articleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.articleHeader}>
                    {article.caption ? (
                      <Text style={[styles.articleCaption, { color: colors.muted }]}>
                        {article.caption}
                      </Text>
                    ) : null}
                    <Text style={[styles.articleTitle, { color: colors.primary }]}>
                      {article.title || `第${article.num}条`}
                    </Text>
                  </View>
                  {article.paragraphs.map((para, pIdx) => (
                    <Text key={pIdx} style={[styles.paragraphText, { color: colors.foreground }]}>
                      {para.trim()}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noArticlesContainer}>
              <Text style={[styles.noArticlesText, { color: colors.muted }]}>
                条文データを表示できません
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  navButton: {
    padding: 8,
    width: 44,
    alignItems: 'center',
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  lawHeader: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  lawTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 28,
  },
  lawNum: {
    fontSize: 13,
    lineHeight: 18,
  },
  lawDate: {
    fontSize: 12,
    lineHeight: 16,
  },
  articlesContainer: {
    gap: 10,
  },
  articleCard: {
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  articleHeader: {
    gap: 2,
  },
  articleCaption: {
    fontSize: 12,
    lineHeight: 16,
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  paragraphText: {
    fontSize: 14,
    lineHeight: 24,
  },
  noArticlesContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noArticlesText: {
    fontSize: 14,
  },
});
