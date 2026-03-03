import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSchedule } from "@/hooks/use-schedule";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
// import { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
// import Animated from "react-native-reanimated";
import type { ScheduleItem } from "@/types/schedule";

const { width: screenWidth } = Dimensions.get('window');

export default function ScheduleScreen() {
  const colors = useColors();
  const { items, loading, addItem, removeItem } = useSchedule();
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const handlePickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('権限が必要です', 'ギャラリーにアクセスするには写真へのアクセス権限が必要です');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const item: ScheduleItem = {
          id: `${Date.now()}`,
          uri: asset.uri,
          type: 'image',
          name: asset.fileName || `Image_${Date.now()}`,
          size: asset.fileSize || 0,
          created_at: new Date().toISOString(),
        };
        await addItem(item);
      }
    } catch (error) {
      Alert.alert('エラー', '画像の選択に失敗しました');
    }
  };

  const handlePickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const item: ScheduleItem = {
          id: `${Date.now()}`,
          uri: asset.uri,
          type: 'pdf',
          name: asset.name,
          size: asset.size || 0,
          created_at: new Date().toISOString(),
        };
        await addItem(item);
      }
    } catch (error) {
      Alert.alert('エラー', 'PDFの選択に失敗しました');
    }
  };

  const handleDelete = (item: ScheduleItem) => {
    Alert.alert(
      'ファイルを削除',
      `「${item.name}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => removeItem(item.id),
        },
      ]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: ScheduleItem }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.75 },
      ]}
      onPress={() => setSelectedItem(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.fileIcon, { backgroundColor: item.type === 'image' ? '#E0E7FF' : '#FEF3C7' }]}>
            <IconSymbol
              name={item.type === 'image' ? 'photo' : 'doc.text'}
              size={20}
              color={item.type === 'image' ? '#4F46E5' : '#D97706'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.fileInfo, { color: colors.muted }]}>
              {formatFileSize(item.size)} • {formatDate(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        onPress={() => handleDelete(item)}
        hitSlop={8}
      >
        <IconSymbol name="xmark" size={18} color={colors.muted} />
      </Pressable>
    </Pressable>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="calendar" size={56} color={colors.muted} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          ファイルがありません
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
          下のボタンから画像またはPDFを{'\n'}インポートしてください
        </Text>
      </View>
    );
  };

  if (selectedItem) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right"]}>
        {/* ナビゲーションバー */}
        <View style={[styles.navbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [styles.navButton, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => setSelectedItem(null)}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          </Pressable>
          <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>
            {selectedItem.name}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {/* ファイルビューア */}
        {selectedItem.type === 'image' ? (
          <ScrollView
            contentContainerStyle={styles.imageViewerContainer}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={{ uri: selectedItem.uri }}
              style={styles.image}
              resizeMode="contain"
            />
          </ScrollView>
        ) : (
          <View style={styles.pdfViewerContainer}>
            <View style={[styles.pdfPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="doc.text.fill" size={64} color={colors.muted} />
              <Text style={[styles.pdfText, { color: colors.foreground }]}>PDF ファイル</Text>
              <Text style={[styles.pdfSubtext, { color: colors.muted }]}>
                {selectedItem.name}
              </Text>
              <Pressable
                style={[styles.openButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Alert.alert('注意', 'PDFの表示機能は実装予定です');
                }}
              >
                <Text style={styles.openButtonText}>PDFを開く</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* ヘッダー */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>日程</Text>
        {items.length > 0 && (
          <Text style={[styles.countText, { color: colors.muted }]}>
            {items.length}件
          </Text>
        )}
      </View>

      {/* ファイル一覧 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* インポートボタン */}
      <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handlePickImage}
        >
          <IconSymbol name="photo" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>画像をインポート</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handlePickPDF}
        >
          <IconSymbol name="doc.text" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>PDFをインポート</Text>
        </Pressable>
      </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  fileInfo: {
    fontSize: 12,
    lineHeight: 16,
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
  actionBar: {
    borderTopWidth: 0.5,
    padding: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
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
  imageViewerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  image: {
    width: screenWidth - 32,
    height: screenWidth - 32,
  },
  pdfViewerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  pdfPlaceholder: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  pdfText: {
    fontSize: 18,
    fontWeight: '600',
  },
  pdfSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  openButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
