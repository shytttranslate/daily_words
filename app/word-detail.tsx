import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { speakWord } from "@/hooks/use-speak-word";
import type { WordDetail } from "@/types/word-detail";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

function parsePayload(params: Record<string, string | string[] | undefined>): WordDetail | null {
  const raw = params.payload ?? params.data;
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as WordDetail;
    if (parsed?.word && Array.isArray(parsed?.definitions) && parsed?.phonetics) return parsed;
  } catch {
    // ignore
  }
  return null;
}

export default function WordDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ payload?: string; data?: string }>();
  const detail = useMemo(() => parsePayload(params), [params.payload, params.data]);

  const tint = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const textSecondary = useThemeColor({}, "textSecondary");
  const cardBg = useThemeColor({}, "cardBackground");

  const handleBack = () => router.back();

  if (!detail) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable onPress={handleBack} hitSlop={12} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <IconSymbol name="chevron.left" size={24} color={tint} />
          </Pressable>
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
            Chi tiết từ
          </ThemedText>
        </View>
        <ThemedView style={styles.centered}>
          <ThemedText style={[styles.emptyHint, { color: textSecondary }]}>
            Không có dữ liệu từ. Quay lại và mở từ từ danh sách hoặc kết quả tìm kiếm.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const { word, definitions, phonetics } = detail;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Pressable onPress={handleBack} hitSlop={12} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <IconSymbol name="chevron.left" size={24} color={tint} />
        </Pressable>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle} numberOfLines={1}>
          {word}
        </ThemedText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Word + level + US/UK speak (text-to-speech như màn generate) */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.wordRow}>
            <ThemedText type="title" style={styles.wordTitle}>
              {word}
            </ThemedText>
            {definitions[0]?.level ? (
              <View style={[styles.levelBadge, { backgroundColor: tint + "22" }]}>
                <ThemedText type="defaultSemiBold" style={[styles.levelBadgeText, { color: tint }]}>
                  {definitions[0].level}
                </ThemedText>
              </View>
            ) : null}
          </View>
          <View style={styles.speakRow}>
            <Pressable
              onPress={() => speakWord(word, "en-US")}
              style={[styles.speakBtn, { borderColor, backgroundColor: tint + "18" }]}
            >
              <ThemedText type="defaultSemiBold" style={[styles.speakBtnText, { color: tint }]}>
                US
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => speakWord(word, "en-GB")}
              style={[styles.speakBtn, { borderColor, backgroundColor: tint + "18" }]}
            >
              <ThemedText type="defaultSemiBold" style={[styles.speakBtnText, { color: tint }]}>
                UK
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        {/* Phonetics: uk_pronun, us_pronun, grammar */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: textSecondary }]}>
            Phiên âm
          </ThemedText>
          <View style={styles.phoneticsRow}>
            <View style={styles.phoneticItem}>
              <ThemedText style={[styles.phoneticLabel, { color: textSecondary }]}>UK</ThemedText>
              <ThemedText style={styles.phoneticValue}>{phonetics.uk_pronun || "—"}</ThemedText>
            </View>
            <View style={[styles.phoneticDivider, { backgroundColor: borderColor }]} />
            <View style={styles.phoneticItem}>
              <ThemedText style={[styles.phoneticLabel, { color: textSecondary }]}>US</ThemedText>
              <ThemedText style={styles.phoneticValue}>{phonetics.us_pronun || "—"}</ThemedText>
            </View>
          </View>
          {phonetics.grammar && phonetics.grammar !== phonetics.uk_pronun && phonetics.grammar !== phonetics.us_pronun ? (
            <View style={[styles.grammarRow, { borderTopColor: borderColor }]}>
              <ThemedText style={[styles.phoneticLabel, { color: textSecondary }]}>Grammar</ThemedText>
              <ThemedText style={styles.phoneticValue}>{phonetics.grammar}</ThemedText>
            </View>
          ) : null}
        </ThemedView>

        {/* Definitions */}
        <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: textSecondary }]}>
          Định nghĩa
        </ThemedText>
        {definitions.map((def, index) => (
          <ThemedView
            key={index}
            style={[styles.card, styles.defCard, { backgroundColor: cardBg, borderColor }]}
          >
            <View style={styles.defMeta}>
              {def.pos ? (
                <ThemedText style={[styles.pos, { color: textSecondary }]}>{def.pos}</ThemedText>
              ) : null}
              {def.level ? (
                <View style={[styles.levelBadgeSmall, { backgroundColor: tint + "22" }]}>
                  <ThemedText type="defaultSemiBold" style={[styles.levelBadgeTextSmall, { color: tint }]}>
                    {def.level}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText style={styles.definition}>{def.definition}</ThemedText>
            {def.examples && def.examples.length > 0 ? (
              <View style={styles.examplesBlock}>
                <ThemedText style={[styles.examplesLabel, { color: textSecondary }]}>Ví dụ:</ThemedText>
                {def.examples.map((ex, i) => (
                  <ThemedText key={i} style={styles.example}>
                    • {ex}
                  </ThemedText>
                ))}
              </View>
            ) : null}
          </ThemedView>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyHint: {
    textAlign: "center",
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  wordTitle: {
    marginBottom: 0,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 12,
  },
  speakRow: {
    flexDirection: "row",
    gap: 8,
  },
  speakBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  speakBtnText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  phoneticsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  phoneticItem: {
    flex: 1,
  },
  phoneticLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  phoneticValue: {
    fontSize: 16,
    fontStyle: "italic",
  },
  phoneticDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },
  grammarRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  defCard: {
    marginBottom: 10,
  },
  defMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  pos: {
    fontSize: 13,
    fontStyle: "italic",
  },
  levelBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeTextSmall: {
    fontSize: 11,
  },
  definition: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 0,
  },
  examplesBlock: {
    marginTop: 10,
  },
  examplesLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  example: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
    opacity: 0.9,
    marginBottom: 2,
  },
});
