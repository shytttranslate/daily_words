import { useWords } from '@/context/words-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Word } from '@/types/word';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const PAGE_SIZE = 15;

function WordItem({
  word,
  isKnown,
  onToggleKnown,
}: {
  word: Word;
  isKnown: boolean;
  onToggleKnown: (id: string) => void;
}) {
  const tint = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <ThemedText type="defaultSemiBold" style={styles.wordEn}>
          {word.en}
        </ThemedText>
        <Pressable
          onPress={() => onToggleKnown(word.id)}
          hitSlop={12}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <IconSymbol
            size={24}
            name={isKnown ? 'star.fill' : 'star'}
            color={isKnown ? tint : iconColor}
          />
        </Pressable>
      </View>
      <ThemedText style={styles.wordVi}>{word.vi}</ThemedText>
      {word.example ? (
        <ThemedText style={styles.wordExample}>VD: {word.example}</ThemedText>
      ) : null}
    </ThemedView>
  );
}

export default function HomeScreen() {
  const { words, loaded, toggleKnown, isKnown } = useWords();
  const [query, setQuery] = useState('');
  const [filterUnknownOnly, setFilterUnknownOnly] = useState(false);
  const tint = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#333' }, 'background');
  const textColor = useThemeColor({}, 'text');

  const filtered = useMemo(() => {
    let list = words;
    if (filterUnknownOnly) {
      list = list.filter((w) => !isKnown(w.id));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (w) =>
          w.en.toLowerCase().includes(q) ||
          w.vi.toLowerCase().includes(q) ||
          w.example.toLowerCase().includes(q)
      );
    }
    return list;
  }, [words, query, filterUnknownOnly, isKnown]);

  if (!loaded) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <ThemedText type="title" style={styles.title}>
          Từ vựng
        </ThemedText>
        <TextInput
          style={[styles.searchInput, { backgroundColor: borderColor, color: textColor }]}
          placeholder="Tìm từ (tiếng Anh hoặc tiếng Việt)..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          onPress={() => setFilterUnknownOnly((f) => !f)}
          style={[
            styles.filterBtn,
            { backgroundColor: filterUnknownOnly ? tint : borderColor },
          ]}
        >
          <IconSymbol
            size={20}
            name={filterUnknownOnly ? 'star.fill' : 'star'}
            color={filterUnknownOnly ? '#fff' : iconColor}
          />
          <ThemedText
            type="defaultSemiBold"
            style={filterUnknownOnly ? styles.filterBtnTextActive : undefined}
          >
            {filterUnknownOnly ? 'Chỉ từ chưa đánh dấu' : 'Tất cả'}
          </ThemedText>
        </Pressable>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={5}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Link href="/generate-modal" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.ctaCard,
                { backgroundColor: tint + '22', borderLeftColor: tint },
                pressed && styles.ctaCardPressed,
              ]}
            >
              <IconSymbol name="sparkles" size={28} color={tint} />
              <View style={styles.ctaCardText}>
                <ThemedText type="defaultSemiBold" style={styles.ctaCardTitle}>
                  Tạo từ vựng theo chủ đề
                </ThemedText>
                <ThemedText style={styles.ctaCardSub}>
                  Nhập chủ đề, nhận danh sách từ liên quan
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={22} color={tint} />
            </Pressable>
          </Link>
        }
        renderItem={({ item }) => (
          <WordItem
            word={item}
            isKnown={isKnown(item.id)}
            onToggleKnown={toggleKnown}
          />
        )}
        ListEmptyComponent={
          <ThemedView style={styles.empty}>
            <ThemedText>
              {words.length === 0
                ? 'Chưa có từ nào. Thêm từ mới để bắt đầu.'
                : 'Không tìm thấy từ nào phù hợp.'}
            </ThemedText>
          </ThemedView>
        }
      />
      <Link href="/modal" asChild>
        <Pressable style={[styles.fab, { backgroundColor: tint }]}>
          <IconSymbol name="plus" size={28} color="#fff" />
        </Pressable>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    marginBottom: 12,
  },
  searchInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 10,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  ctaCardPressed: {
    opacity: 0.9,
  },
  ctaCardText: {
    flex: 1,
    marginLeft: 14,
  },
  ctaCardTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  ctaCardSub: {
    fontSize: 13,
    opacity: 0.85,
  },
  wordCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  wordEn: {
    fontSize: 18,
  },
  wordVi: {
    fontSize: 15,
    marginBottom: 4,
  },
  wordExample: {
    fontSize: 13,
    opacity: 0.85,
    fontStyle: 'italic',
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 34,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
