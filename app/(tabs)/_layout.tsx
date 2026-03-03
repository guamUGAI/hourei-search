import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, FlatList, Pressable, Text, StyleSheet } from "react-native";
import { useState } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { LawType } from "@/types/hourei";

const LAW_TYPE_TABS: { label: string; value: LawType | 'all' }[] = [
  { label: '憲法・法律', value: 'Act' },
  { label: '政令', value: 'CabinetOrder' },
  { label: '省令', value: 'MinisterialOrdinance' },
  { label: '規則', value: 'Rule' },
  { label: '条例', value: 'all' },
];

function LawTypeTabBar() {
  const colors = useColors();
  const [selectedType, setSelectedType] = useState<LawType | 'all'>('Act');

  return (
    <View style={[styles.lawTypeContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={LAW_TYPE_TABS}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.lawTypeList}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.lawTypeTab,
              {
                borderBottomColor: selectedType === item.value ? colors.primary : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => setSelectedType(item.value)}
          >
            <Text
              style={[
                styles.lawTypeTabText,
                { color: selectedType === item.value ? colors.primary : colors.muted },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <>
      <LawTypeTabBar />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            paddingTop: 8,
            paddingBottom: bottomPadding,
            height: tabBarHeight,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 0.5,
          },
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="search"
          options={{
            title: "法令検索",
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="book.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "条文検索",
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="magnifyingglass" color={color} />,
          }}
        />
        <Tabs.Screen
          name="bookmarks"
          options={{
            title: "お気に入り",
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="bookmark.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: "日程",
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="calendar" color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  lawTypeContainer: {
    borderBottomWidth: 0.5,
  },
  lawTypeList: {
    paddingHorizontal: 8,
  },
  lawTypeTab: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
  },
  lawTypeTabText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
