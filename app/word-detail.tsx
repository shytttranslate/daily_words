import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { speakWord } from "@/hooks/use-speak-word";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { WordDetail } from "@/types/word-detail";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

function parsePayload(
  params: Record<string, string | string[] | undefined>,
): WordDetail | null {
  const raw = params.payload ?? params.data;
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as WordDetail;
    if (parsed?.word && Array.isArray(parsed?.definitions) && parsed?.phonetics)
      return parsed;
  } catch {
    // ignore
  }
  return null;
}

export default function WordDetailScreen() {
  const params = useLocalSearchParams<{ payload?: string; data?: string }>();
  const detail = useMemo(
    () => parsePayload(params),
    [params.payload, params.data],
  );

  const tint = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const textSecondary = useThemeColor({}, "textSecondary");
  const cardBg = useThemeColor({}, "cardBackground");

  if (!detail) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centered}>
          <ThemedText style={[styles.emptyHint, { color: textSecondary }]}>
            Không có dữ liệu từ. Quay lại và mở từ từ danh sách hoặc kết quả tìm
            kiếm.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const { word, definitions, phonetics } = detail;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Word + level + US/UK speak (text-to-speech như màn generate) */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.wordRow}>
            <ThemedText type="title" style={styles.wordTitle}>
              {word}
            </ThemedText>
            {definitions[0]?.level ? (
              <View
                style={[styles.levelBadge, { backgroundColor: tint + "22" }]}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={[styles.levelBadgeText, { color: tint }]}
                >
                  {definitions[0].level}
                </ThemedText>
              </View>
            ) : null}
          </View>
          <View style={styles.speakRow}>
            <Pressable
              onPress={() => speakWord(word, "en-US")}
              style={[styles.speakBtn, { backgroundColor: tint + "18" }]}
            >
              <IconSymbol
                name="speaker.wave.2"
                size={18}
                color={tint}
                style={styles.speakBtnIcon}
              />
              <ThemedText
                type="defaultSemiBold"
                style={[styles.speakBtnText, { color: tint }]}
              >
                US
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => speakWord(word, "en-GB")}
              style={[styles.speakBtn, { backgroundColor: tint + "18" }]}
            >
              <IconSymbol
                name="speaker.wave.2"
                size={18}
                color={tint}
                style={styles.speakBtnIcon}
              />
              <ThemedText
                type="defaultSemiBold"
                style={[styles.speakBtnText, { color: tint }]}
              >
                UK
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        {/* Phonetics: uk_pronun, us_pronun, grammar */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textSecondary }]}>
            Phiên âm
          </ThemedText>
          <View style={styles.phoneticsRow}>
            <View style={styles.phoneticItem}>
              <ThemedText
                style={[styles.phoneticLabel, { color: textSecondary }]}
              >
                UK
              </ThemedText>
              <ThemedText style={styles.phoneticValue}>
                {phonetics.uk_pronun || "—"}
              </ThemedText>
            </View>
            <View
              style={[styles.phoneticDivider, { backgroundColor: borderColor }]}
            />
            <View style={styles.phoneticItem}>
              <ThemedText
                style={[styles.phoneticLabel, { color: textSecondary }]}
              >
                US
              </ThemedText>
              <ThemedText style={styles.phoneticValue}>
                {phonetics.us_pronun || "—"}
              </ThemedText>
            </View>
          </View>
          {phonetics.grammar &&
          phonetics.grammar !== phonetics.uk_pronun &&
          phonetics.grammar !== phonetics.us_pronun ? (
            <View style={[styles.grammarRow, { borderTopColor: borderColor }]}>
              <ThemedText
                style={[styles.phoneticLabel, { color: textSecondary }]}
              >
                Grammar
              </ThemedText>
              <ThemedText style={styles.phoneticValue}>
                {phonetics.grammar}
              </ThemedText>
            </View>
          ) : null}
        </ThemedView>

        {/* Definitions */}
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: textSecondary }]}>
          Định nghĩa
        </ThemedText>
        {definitions.map((def, index) => (
          <ThemedView
            key={index}
            style={[styles.card, styles.defCard, { backgroundColor: cardBg }]}
          >
            <View style={styles.defMeta}>
              {def.pos ? (
                <View style={[styles.posChip, { backgroundColor: tint + "12" }]}>
                  <ThemedText style={[styles.posChipText, { color: textSecondary }]}>
                    {def.pos}
                  </ThemedText>
                </View>
              ) : null}
              {def.level ? (
                <View
                  style={[
                    styles.levelBadgeSmall,
                    { backgroundColor: tint + "22" },
                  ]}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={[styles.levelBadgeTextSmall, { color: tint }]}
                  >
                    {def.level}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText style={styles.definition}>{def.definition}</ThemedText>
            {def.examples && def.examples.length > 0 ? (
              <View style={[styles.examplesBlock, { borderLeftColor: tint }]}>
                <ThemedText
                  style={[styles.examplesLabel, { color: textSecondary }]}
                >
                  Ví dụ:
                </ThemedText>
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
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
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
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  speakBtnIcon: {
    marginRight: 6,
  },
  speakBtnText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: 12,
    marginLeft: 0,
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
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  defCard: {
    marginBottom: 16,
  },
  defMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  posChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  posChipText: {
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
    marginTop: 16,
    paddingLeft: 12,
    borderLeftWidth: 3,
  },
  examplesLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  example: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
    opacity: 0.9,
    marginBottom: 4,
  },
});
