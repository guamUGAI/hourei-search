// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "magnifyingglass": "search",
  "book.fill": "menu-book",
  "bookmark.fill": "bookmark",
  "bookmark": "bookmark-border",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "arrow.left": "arrow-back",
  "doc.text": "description",
  "doc.text.fill": "description",
  "slider.horizontal.3": "tune",
  "info.circle": "info-outline",
  "info.circle.fill": "info",
  "calendar": "calendar-today",
  "calendar.badge.plus": "event-note",
  "photo": "image",
  "photo.badge.plus": "add-photo-alternate",
  "doc.badge.plus": "note-add",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
