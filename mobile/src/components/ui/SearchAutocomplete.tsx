import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClientColors, AppLayout } from '../../constants/sucarTheme';

export interface AutocompleteItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

interface SearchAutocompleteProps {
  visible: boolean;
  loading?: boolean;
  items: AutocompleteItem[];
  onSelect: (item: AutocompleteItem) => void;
  emptyMessage?: string;
  headerLabel?: string;
  maxHeight?: number;
  /** Removes outer horizontal margin — use inside forms like LocationPicker */
  embedded?: boolean;
}

const SearchAutocomplete = ({
  visible,
  loading = false,
  items,
  onSelect,
  emptyMessage = 'No suggestions found',
  headerLabel = 'Suggestions',
  maxHeight = 260,
  embedded = false,
}: SearchAutocompleteProps) => {
  if (!visible) return null;

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelTitle}>{headerLabel}</Text>
          {loading && <ActivityIndicator size="small" color={ClientColors.primary} />}
        </View>

        {loading && items.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>Searching…</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyRow}>
            <Ionicons name="search-outline" size={18} color={ClientColors.textMuted} />
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            style={{ maxHeight }}
          >
            {items.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.row, index === items.length - 1 && styles.rowLast]}
                onPressIn={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={item.icon || 'search-outline'}
                    size={18}
                    color={ClientColors.primary}
                  />
                </View>
                <View style={styles.textWrap}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : (
                  <Ionicons name="arrow-forward" size={16} color={ClientColors.textMuted} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: AppLayout.screenPadding,
    marginTop: -6,
    marginBottom: 8,
    zIndex: 100,
    elevation: 12,
  },
  wrapEmbedded: {
    marginHorizontal: 0,
    marginTop: 6,
    marginBottom: 0,
    zIndex: 1,
    elevation: 0,
  },
  panel: {
    backgroundColor: ClientColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ClientColors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ClientColors.border,
    backgroundColor: '#FAFAFC',
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: ClientColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: ClientColors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ClientColors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: ClientColors.text },
  subtitle: { fontSize: 12, color: ClientColors.textSecondary, marginTop: 2 },
  badge: {
    backgroundColor: ClientColors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: ClientColors.accent,
    textTransform: 'uppercase',
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 14,
  },
  emptyText: { fontSize: 13, color: ClientColors.textSecondary },
});

export default SearchAutocomplete;
