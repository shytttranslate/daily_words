import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useWords } from "@/context/words-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import { speakWord } from "@/hooks/use-speak-word";
import type { CEFRLevel, Word } from "@/types/word";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const PAGE_SIZE = 15;

const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_ORDER: Record<CEFRLevel, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 };

type FilterLearned = "all" | "learned" | "unlearned";
type FilterLevel = "all" | CEFRLevel;
type SortOrder = "easy-first" | "hard-first";

type WordItemProps = {
  word: Word;
  isKnown: boolean;
  onToggleKnown: (id: string) => void;
};

function WordItemInner({ word, isKnown, onToggleKnown }: WordItemProps) {
  const tint = useThemeColor({}, "tint");
  const iconColor = useThemeColor({}, "icon");
  const borderColor = useThemeColor({}, "border");
  const wordId = word.id;
  const level = word.level ?? "A1";

  const handlePress = useCallback(() => {
    onToggleKnown(wordId);
  }, [onToggleKnown, wordId]);

  return (
    <ThemedView style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <View style={styles.wordTitleRow}>
          <ThemedText type="defaultSemiBold" style={styles.wordEn}>
            {word.en}
          </ThemedText>
          <View style={[styles.levelBadge, { backgroundColor: tint + "22" }]}>
            <ThemedText style={[styles.levelBadgeText, { color: tint }]}>{level}</ThemedText>
          </View>
        </View>
        <Pressable
          onPress={handlePress}
          hitSlop={12}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <IconSymbol
            size={24}
            name={isKnown ? "checkmark.circle.fill" : "circle"}
            color={isKnown ? tint : iconColor}
          />
        </Pressable>
      </View>
      <View style={styles.speakRow}>
        <Pressable
          onPress={() => speakWord(word.en, "en-US")}
          style={[styles.speakBtn, { borderColor, backgroundColor: tint + "18" }]}
        >
          <ThemedText type="defaultSemiBold" style={[styles.speakBtnText, { color: tint }]}>
            US
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => speakWord(word.en, "en-GB")}
          style={[styles.speakBtn, { borderColor, backgroundColor: tint + "18" }]}
        >
          <ThemedText type="defaultSemiBold" style={[styles.speakBtnText, { color: tint }]}>
            UK
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText style={styles.wordVi}>{word.vi}</ThemedText>
      {word.example ? (
        <ThemedText style={styles.wordExample}>VD: {word.example}</ThemedText>
      ) : null}
    </ThemedView>
  );
}

const WordItem = React.memo(WordItemInner, (prev, next) => {
  return (
    prev.word.id === next.word.id &&
    prev.word.en === next.word.en &&
    prev.word.vi === next.word.vi &&
    prev.word.example === next.word.example &&
    prev.word.level === next.word.level &&
    prev.isKnown === next.isKnown &&
    prev.onToggleKnown === next.onToggleKnown
  );
});

export default function HomeScreen() {
  const { words, loaded, toggleKnown, isKnown } = useWords();
  const [query, setQuery] = useState("");
  const [filterLearned, setFilterLearned] = useState<FilterLearned>("all");
  const [filterLevel, setFilterLevel] = useState<FilterLevel>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("easy-first");

  const router = useRouter();
  const tint = useThemeColor({}, "tint");
  const iconColor = useThemeColor({}, "icon");
  const borderColor = useThemeColor({}, "border");
  const inputBg = useThemeColor({}, "inputBackground");
  const placeholderColor = useThemeColor({}, "placeholder");
  const textColor = useThemeColor({}, "text");
  const cardBg = useThemeColor({}, "cardBackground");

  const openAddModal = useCallback(() => {
    router.push("/modal");
  }, [router]);

  const filtered = useMemo(() => {
    let list = words;
    if (filterLearned === "learned") list = list.filter((w) => isKnown(w.id));
    else if (filterLearned === "unlearned") list = list.filter((w) => !isKnown(w.id));
    if (filterLevel !== "all") list = list.filter((w) => (w.level ?? "A1") === filterLevel);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (w) =>
          w.en.toLowerCase().includes(q) ||
          w.vi.toLowerCase().includes(q) ||
          (w.example && w.example.toLowerCase().includes(q)),
      );
    }
    const levelOrder = (w: Word) => LEVEL_ORDER[(w.level ?? "A1") as CEFRLevel];
    list = [...list].sort((a, b) => {
      const diff = levelOrder(a) - levelOrder(b);
      return sortOrder === "easy-first" ? diff : -diff;
    });
    return list;
  }, [words, query, filterLearned, filterLevel, sortOrder, isKnown]);

  const handleToggleKnown = useCallback(
    (id: string) => {
      toggleKnown(id);
    },
    [toggleKnown],
  );

  const renderItem = useCallback(
    ({ item }: { item: Word }) => (
      <WordItem
        word={item}
        isKnown={isKnown(item.id)}
        onToggleKnown={handleToggleKnown}
      />
    ),
    [isKnown, handleToggleKnown],
  );

  const keyExtractor = useCallback((item: Word) => item.id, []);

  const listHeaderComponent = useMemo(
    () => (
      <View style={styles.addSection}>
        <Pressable
          onPress={openAddModal}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: tint,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <IconSymbol name="plus" size={22} color="#fff" />
          <ThemedText type="defaultSemiBold" style={styles.addButtonText}>
            Thêm từ vựng (AI, ảnh hoặc thủ công)
          </ThemedText>
        </Pressable>
      </View>
    ),
    [tint, openAddModal],
  );

  const listEmptyComponent = useMemo(
    () => (
      <ThemedView style={styles.empty}>
        <ThemedText style={styles.emptyText}>
          {words.length === 0
            ? "Chưa có từ nào. Thêm từ mới để bắt đầu."
            : "Không tìm thấy từ nào phù hợp."}
        </ThemedText>
        <Pressable
          onPress={openAddModal}
          style={({ pressed }) => [
            styles.emptyButton,
            { backgroundColor: tint, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <IconSymbol name="plus" size={22} color="#fff" />
          <ThemedText type="defaultSemiBold" style={styles.emptyButtonText}>
            Thêm từ
          </ThemedText>
        </Pressable>
      </ThemedView>
    ),
    [words.length, openAddModal, tint],
  );

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
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.title}>
            Từ vựng
          </ThemedText>
          <Pressable
            onPress={openAddModal}
            style={({ pressed }) => [
              styles.headerAddBtn,
              { backgroundColor: tint, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
            <ThemedText type="defaultSemiBold" style={styles.headerAddBtnText}>
              Thêm từ
            </ThemedText>
          </Pressable>
        </View>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: inputBg,
              color: textColor,
              borderColor,
              borderWidth: 1,
            },
          ]}
          placeholder="Tìm từ (tiếng Anh hoặc tiếng Việt)..."
          placeholderTextColor={placeholderColor}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <ThemedText style={styles.filterLabel}>Trạng thái</ThemedText>
        <View style={styles.filterRow}>
          {(["all", "unlearned", "learned"] as const).map((key) => (
            <Pressable
              key={key}
              onPress={() => setFilterLearned(key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filterLearned === key ? tint : cardBg,
                  borderColor: filterLearned === key ? tint : borderColor,
                },
              ]}
            >
              <ThemedText
                type="defaultSemiBold"
                style={[styles.filterChipText, filterLearned === key && styles.filterChipTextActive]}
                numberOfLines={1}
              >
                {key === "all" ? "Tất cả" : key === "learned" ? "Đã học" : "Chưa học"}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        <ThemedText style={styles.filterLabel}>Level (CEFR)</ThemedText>
        <View style={styles.filterRowWrap}>
          <Pressable
            onPress={() => setFilterLevel("all")}
            style={[
              styles.filterChip,
              {
                backgroundColor: filterLevel === "all" ? tint : cardBg,
                borderColor: filterLevel === "all" ? tint : borderColor,
              },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[styles.filterChipText, filterLevel === "all" && styles.filterChipTextActive]}
            >
              Tất cả
            </ThemedText>
          </Pressable>
          {CEFR_LEVELS.map((level) => (
            <Pressable
              key={level}
              onPress={() => setFilterLevel(level)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filterLevel === level ? tint : cardBg,
                  borderColor: filterLevel === level ? tint : borderColor,
                },
              ]}
            >
              <ThemedText
                type="defaultSemiBold"
                style={[styles.filterChipText, filterLevel === level && styles.filterChipTextActive]}
              >
                {level}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        <ThemedText style={styles.filterLabel}>Sắp xếp</ThemedText>
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setSortOrder("easy-first")}
            style={[
              styles.filterChip,
              {
                backgroundColor: sortOrder === "easy-first" ? tint : cardBg,
                borderColor: sortOrder === "easy-first" ? tint : borderColor,
              },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[styles.filterChipText, sortOrder === "easy-first" && styles.filterChipTextActive]}
            >
              Dễ → Khó
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setSortOrder("hard-first")}
            style={[
              styles.filterChip,
              {
                backgroundColor: sortOrder === "hard-first" ? tint : cardBg,
                borderColor: sortOrder === "hard-first" ? tint : borderColor,
              },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[styles.filterChipText, sortOrder === "hard-first" && styles.filterChipTextActive]}
            >
              Khó → Dễ
            </ThemedText>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={7}
        removeClippedSubviews={true}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={listEmptyComponent}
        style={styles.list}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    marginBottom: 0,
  },
  headerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  headerAddBtnText: {
    color: "#fff",
    fontSize: 14,
  },
  searchInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  filterRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  list: {
    flex: 1,
    zIndex: 0,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  addSection: {
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  wordCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  wordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  wordTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  wordEn: {
    fontSize: 18,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  speakRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  speakBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  speakBtnText: {
    fontSize: 12,
  },
  wordVi: {
    fontSize: 15,
    marginBottom: 4,
  },
  wordExample: {
    fontSize: 13,
    opacity: 0.85,
    fontStyle: "italic",
  },
  empty: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
