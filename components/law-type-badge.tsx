import { View, Text, StyleSheet } from "react-native";
import { LAW_TYPE_COLORS, LAW_TYPE_LABELS } from "@/lib/hourei-api";
import type { LawType } from "@/types/hourei";

interface LawTypeBadgeProps {
  lawType: LawType | string;
  size?: 'sm' | 'md';
}

export function LawTypeBadge({ lawType, size = 'md' }: LawTypeBadgeProps) {
  const colors = LAW_TYPE_COLORS[lawType] || LAW_TYPE_COLORS.Misc;
  const label = LAW_TYPE_LABELS[lawType] || lawType;
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        isSmall && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text },
          isSmall && styles.textSm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  textSm: {
    fontSize: 11,
    lineHeight: 14,
  },
});
