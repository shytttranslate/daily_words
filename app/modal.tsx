import { CameraCaptureModal } from "@/components/camera-capture-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useWords } from "@/context/words-context";
import { useRouteLoading } from "@/context/route-loading-context";
import { useFocusEffect } from "@react-navigation/native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { speakWord } from "@/hooks/use-speak-word";
import { generateWordsByTopic } from "@/services/generate-words";
import { getSuggestions } from "@/services/vocabup-api";
import { pickImageFromGallery, recognizeTextFromUri } from "@/services/ocr";
import type { GeneratedWord } from "@/services/vocabup-api";
import type { WordDetail } from "@/types/word-detail";
import type { CEFRLevel } from "@/types/word";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const SUGGESTIONS = ["Công nghệ", "Du lịch", "Kinh doanh"];
const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

type AddMode = "choice" | "ai" | "ocr" | "manual";

/** Chuyển GeneratedWord (màn generate) sang WordDetail cho màn word-detail */
function generatedWordToDetail(item: GeneratedWord): WordDetail {
  return {
    word: item.word,
    definitions: [
      {
        definition: item.meaning_vi,
        examples: item.example ? [item.example] : [],
        level: item.level ?? "A1",
        pos: item.pos ?? "",
      },
    ],
    phonetics: {
      uk_pronun: item.ipa ?? "",
      uk_sound: "",
      us_pronun: item.ipa ?? "",
      us_sound: "",
      grammar: item.ipa ?? "",
    },
  };
}

function ResultWordCard({
  item,
  onAdd, 
  onPressDetail,
  added,
  tint,
  borderColor,
  textSecondary,
}: {
  item: GeneratedWord;
  onAdd: () => void;
  onPressDetail: () => void;
  added: boolean;
  tint: string;
  borderColor: string;
  textSecondary: string;
}) {
  return (
    <View style={[styles.resultCard, { borderColor }]}>
      <Pressable
        onPress={onPressDetail}
        style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={styles.resultCardContent}>
        <View style={styles.resultWordRow}>
          <ThemedText type="defaultSemiBold" style={styles.resultEn}>
            {item.word}
          </ThemedText>
          <View style={styles.speakBtnRow}>
            <Pressable
              onPress={() => speakWord(item.word, "en-US")}
              style={[styles.speakBtn, { borderColor, backgroundColor: tint + "18" }]}
            >
              <ThemedText type="defaultSemiBold" style={[styles.speakBtnText, { color: tint }]}>
                US
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => speakWord(item.word, "en-GB")}
              style={[styles.speakBtn, { borderColor, backgroundColor: tint + "18" }]}
            >
              <ThemedText type="defaultSemiBold" style={[styles.speakBtnText, { color: tint }]}>
                UK
              </ThemedText>
            </Pressable>
          </View>
        </View>
        <ThemedText style={[styles.resultIpa, { color: textSecondary }]}>
          {item.ipa ?? "—"}
        </ThemedText>
        {item.pos || item.level ? (
          <View style={styles.resultMeta}>
            {item.pos ? (
              <ThemedText style={[styles.resultPos, { color: textSecondary }]}>
                {item.pos}
              </ThemedText>
            ) : null}
            {item.level ? (
              <ThemedText style={[styles.resultLevel, { color: tint }]}>
                {item.level}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
        <ThemedText style={styles.resultVi}>{item.meaning_vi}</ThemedText>
        {item.example ? (
          <ThemedText style={styles.resultEx}>VD: {item.example}</ThemedText>
        ) : null}
      </View>
      </Pressable>
      <Pressable
        onPress={onAdd}
        disabled={added}
        style={[
          styles.addWordBtn,
          { backgroundColor: added ? borderColor : tint },
        ]}
      >
        {added ? (
          <ThemedText type="defaultSemiBold" style={styles.addWordBtnText}>
            Đã thêm
          </ThemedText>
        ) : (
          <IconSymbol name="plus" size={20} color="#fff" />
        )}
      </Pressable>
    </View>
  );
}

export default function AddWordModalScreen() {
  const { addWord } = useWords();
  const { setRouteLoading } = useRouteLoading();
  const router = useRouter();
  const [mode, setMode] = useState<AddMode>("choice");

  useFocusEffect(
    useCallback(() => {
      setRouteLoading(false);
    }, [setRouteLoading])
  );

  // Manual form
  const [en, setEn] = useState("");
  const [vi, setVi] = useState("");
  const [example, setExample] = useState("");
  const [manualLevel, setManualLevel] = useState<CEFRLevel>("A1");
  const [saving, setSaving] = useState(false);

  // AI
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedWord[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(SUGGESTIONS);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // OCR
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [ocrText, setOcrText] = useState("");

  const tint = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const cardBg = useThemeColor({}, "cardBackground");
  const inputBg = useThemeColor({}, "inputBackground");
  const placeholderColor = useThemeColor({}, "placeholder");

  const goBack = useCallback(() => {
    if (mode !== "choice") {
      setMode("choice");
      setOcrText("");
    } else {
      router.back();
    }
  }, [mode, router]);

  const runOcrOnUri = useCallback(async (uri: string) => {
    setOcrLoading(true);
    try {
      const text = await recognizeTextFromUri(uri);
      if (text) {
        setOcrText(text);
        setTopic((prev) => (prev ? `${prev}\n${text}` : text));
      } else {
        Alert.alert(
          "Không nhận diện được chữ",
          "Ảnh không có text hoặc không rõ. Thử ảnh khác.",
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi khi quét ảnh.";
      if (/development build|native module|expo go/i.test(String(e))) {
        Alert.alert(
          "Cần development build",
          'Tính năng quét ảnh cần build app có native module. Chạy "npx expo prebuild" rồi build Android/iOS, không dùng Expo Go.',
        );
      } else {
        Alert.alert("Lỗi", msg);
      }
    } finally {
      setOcrLoading(false);
    }
  }, []);

  const handleScanFromGallery = useCallback(async () => {
    try {
      const result = await pickImageFromGallery();
      if ("cancelled" in result && result.cancelled) return;
      if ("uri" in result) await runOcrOnUri(result.uri);
    } catch (e) {
      Alert.alert(
        "Lỗi",
        e instanceof Error ? e.message : "Không thể mở thư viện ảnh.",
      );
    }
  }, [runOcrOnUri]);

  const handleScanFromCamera = useCallback(() => setShowCameraModal(true), []);
  const handleCameraCapture = useCallback(
    (uri: string) => {
      setShowCameraModal(false);
      runOcrOnUri(uri);
    },
    [runOcrOnUri],
  );

  const handleGenerate = useCallback(async () => {
    const trimmed = topic.trim();
    if (!trimmed) return;
    setLoading(true);
    setResults([]);
    setAddedIds(new Set());
    setHasSearched(true);
    try {
      const words = await generateWordsByTopic(trimmed);
      setResults(words);
      setSuggestionsLoading(true);
      try {
        const next = await getSuggestions({ userInput: trimmed });
        if (next.length > 0) setSuggestions(next);
      } catch {
        // keep current suggestions on error
      } finally {
        setSuggestionsLoading(false);
      }
    } catch (e) {
      setResults([]);
      const msg = e instanceof Error ? e.message : "Không thể tạo từ vựng.";
      Alert.alert("Lỗi", msg);
    } finally {
      setLoading(false);
    }
  }, [topic]);

  const handleAddOne = useCallback(
    async (item: GeneratedWord) => {
      await addWord({
        en: item.word,
        vi: item.meaning_vi,
        example: item.example ?? "",
        level: item.level as CEFRLevel | undefined,
      });
      setAddedIds((prev) => new Set(prev).add(item.id));
    },
    [addWord],
  );

  const handleAddAll = useCallback(async () => {
    for (const w of results) {
      if (addedIds.has(w.id)) continue;
      await addWord({
        en: w.word,
        vi: w.meaning_vi,
        example: w.example ?? "",
        level: w.level as CEFRLevel | undefined,
      });
      setAddedIds((prev) => new Set(prev).add(w.id));
    }
  }, [results, addedIds, addWord]);

  const allAdded = results.length > 0 && addedIds.size === results.length;

  const handleSaveManual = async () => {
    const wordEn = en.trim();
    const wordVi = vi.trim();
    if (!wordEn || !wordVi) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập từ tiếng Anh và nghĩa tiếng Việt.",
      );
      return;
    }
    setSaving(true);
    try {
      await addWord({
        en: wordEn,
        vi: wordVi,
        example: example.trim(),
        level: manualLevel,
      });
      router.back();
    } catch {
      Alert.alert("Lỗi", "Không thể lưu từ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const useOcrAsTopic = useCallback(() => {
    setTopic(ocrText);
    setMode("ai");
  }, [ocrText]);

  // —— Choice: 3 options ——
  if (mode === "choice") {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={24} color={tint} />
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Thêm từ
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            Chọn cách bạn muốn thêm từ vựng
          </ThemedText>

          <Pressable
            onPress={() => setMode("ai")}
            style={({ pressed }) => [
              styles.optionCard,
              {
                backgroundColor: cardBg,
                borderColor,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View
              style={[styles.optionIconWrap, { backgroundColor: tint + "22" }]}
            >
              <IconSymbol name="sparkles" size={28} color={tint} />
            </View>
            <View style={styles.optionTextWrap}>
              <ThemedText type="defaultSemiBold" style={styles.optionTitle}>
                Tạo từ bằng AI
              </ThemedText>
              <ThemedText style={[styles.optionDesc, { color: textSecondary }]}>
                Nhập chủ đề, AI sẽ gợi ý danh sách từ vựng liên quan
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => {
              setOcrText("");
              setMode("ocr");
            }}
            style={({ pressed }) => [
              styles.optionCard,
              {
                backgroundColor: cardBg,
                borderColor,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View
              style={[styles.optionIconWrap, { backgroundColor: tint + "22" }]}
            >
              <IconSymbol name="camera.viewfinder" size={28} color={tint} />
            </View>
            <View style={styles.optionTextWrap}>
              <ThemedText type="defaultSemiBold" style={styles.optionTitle}>
                Đọc từ hình ảnh
              </ThemedText>
              <ThemedText style={[styles.optionDesc, { color: textSecondary }]}>
                Chụp hoặc chọn ảnh có chữ để lấy nội dung làm chủ đề
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => setMode("manual")}
            style={({ pressed }) => [
              styles.optionCard,
              {
                backgroundColor: cardBg,
                borderColor,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View
              style={[styles.optionIconWrap, { backgroundColor: tint + "22" }]}
            >
              <IconSymbol name="pencil" size={28} color={tint} />
            </View>
            <View style={styles.optionTextWrap}>
              <ThemedText type="defaultSemiBold" style={styles.optionTitle}>
                Thêm từ vựng
              </ThemedText>
              <ThemedText style={[styles.optionDesc, { color: textSecondary }]}>
                Nhập từ tiếng Anh, nghĩa tiếng Việt và ví dụ (nếu có)
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={textSecondary} />
          </Pressable>
        </ScrollView>
      </ThemedView>
    );
  }

  // —— OCR: show result + "Dùng làm chủ đề AI" ——
  if (mode === "ocr") {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={24} color={tint} />
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Đọc từ ảnh
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!ocrText ? (
            <>
              <ThemedText style={[styles.ocrHint, { color: textSecondary }]}>
                Chọn ảnh từ thư viện hoặc chụp ảnh mới để nhận diện chữ.
              </ThemedText>
              <View style={styles.scanRow}>
                <Pressable
                  onPress={handleScanFromGallery}
                  disabled={ocrLoading}
                  style={[
                    styles.scanBtn,
                    { borderColor, backgroundColor: cardBg },
                  ]}
                >
                  {ocrLoading ? (
                    <ActivityIndicator size="small" color={tint} />
                  ) : (
                    <IconSymbol name="photo" size={24} color={tint} />
                  )}
                  <ThemedText
                    type="defaultSemiBold"
                    style={[styles.scanBtnText, { color: textColor }]}
                  >
                    Chọn ảnh
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleScanFromCamera}
                  disabled={ocrLoading}
                  style={[
                    styles.scanBtn,
                    { borderColor, backgroundColor: cardBg },
                  ]}
                >
                  {ocrLoading ? (
                    <ActivityIndicator size="small" color={tint} />
                  ) : (
                    <IconSymbol name="camera" size={24} color={tint} />
                  )}
                  <ThemedText
                    type="defaultSemiBold"
                    style={[styles.scanBtnText, { color: textColor }]}
                  >
                    Chụp ảnh
                  </ThemedText>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <ThemedText style={[styles.chipLabel, { color: textSecondary }]}>
                Nội dung nhận diện được
              </ThemedText>
              <TextInput
                style={[
                  styles.topicInput,
                  { borderColor, color: textColor, backgroundColor: inputBg },
                ]}
                placeholder="..."
                placeholderTextColor={placeholderColor}
                value={ocrText}
                onChangeText={setOcrText}
                multiline
                numberOfLines={4}
              />
              <Pressable
                onPress={useOcrAsTopic}
                style={[styles.primaryBtn, { backgroundColor: tint }]}
              >
                <IconSymbol name="sparkles" size={20} color="#fff" />
                <ThemedText
                  type="defaultSemiBold"
                  style={styles.primaryBtnText}
                >
                  Dùng làm chủ đề AI
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setOcrText("")}
                style={[styles.secondaryBtn, { borderColor }]}
              >
                <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
                  Quét ảnh khác
                </ThemedText>
              </Pressable>
            </>
          )}
        </ScrollView>
        <CameraCaptureModal
          visible={showCameraModal}
          onCapture={handleCameraCapture}
          onCancel={() => setShowCameraModal(false)}
        />
      </ThemedView>
    );
  }

  // —— AI: topic + OCR + generate + results ——
  if (mode === "ai") {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={24} color={tint} />
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Tạo từ bằng AI
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText style={[styles.chipLabel, { color: textSecondary }]}>
            Chủ đề hoặc nội dung
          </ThemedText>
          <TextInput
            style={[
              styles.topicInput,
              { borderColor, color: textColor, backgroundColor: inputBg },
            ]}
            placeholder="Ví dụ: Công nghệ, Du lịch, Email công việc..."
            placeholderTextColor={placeholderColor}
            value={topic}
            onChangeText={setTopic}
            multiline
            numberOfLines={2}
            editable={!loading}
          />

          <ThemedText style={[styles.chipLabel, { color: textSecondary }]}>
            Gợi ý nhanh
          </ThemedText>
          <View style={styles.chips}>
            {suggestionsLoading ? (
              <ActivityIndicator size="small" color={tint} style={{ marginRight: 8 }} />
            ) : null}
            {suggestions.map((label) => (
              <Pressable
                key={label}
                onPress={() => setTopic(label)}
                style={[styles.chip, { borderColor, backgroundColor: cardBg }]}
              >
                <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
                  {label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={handleGenerate}
            disabled={loading || !topic.trim()}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: loading || !topic.trim() ? borderColor : tint,
              },
            ]}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <ThemedText
                  type="defaultSemiBold"
                  style={styles.primaryBtnText}
                >
                  Đang tạo...
                </ThemedText>
              </>
            ) : (
              <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>
                Tạo từ vựng
              </ThemedText>
            )}
          </Pressable>

          {!loading && results.length > 0 && (
            <View style={styles.resultSection}>
              <View style={styles.resultHeader}>
                <ThemedText type="subtitle">
                  Kết quả ({results.length} từ)
                </ThemedText>
                {!allAdded && (
                  <Pressable
                    onPress={handleAddAll}
                    style={[styles.addAllBtn, { backgroundColor: tint }]}
                  >
                    <ThemedText
                      type="defaultSemiBold"
                      style={styles.addAllBtnText}
                    >
                      Thêm tất cả
                    </ThemedText>
                  </Pressable>
                )}
              </View>
              {results.map((item) => (
                <ResultWordCard
                  key={item.id}
                  item={item}
                  onAdd={() => handleAddOne(item)}
                  onPressDetail={() => {
                    router.push({
                      pathname: "/word-detail",
                      params: { payload: JSON.stringify(generatedWordToDetail(item)) },
                    });
                  }}
                  added={addedIds.has(item.id)}
                  tint={tint}
                  borderColor={borderColor}
                  textSecondary={textSecondary}
                />
              ))}
            </View>
          )}

          {!loading && results.length === 0 && hasSearched && (
            <ThemedText style={[styles.emptyHint, { color: textSecondary }]}>
              Không tìm thấy từ nào. Thử chủ đề khác.
            </ThemedText>
          )}
        </ScrollView>
        <CameraCaptureModal
          visible={showCameraModal}
          onCapture={handleCameraCapture}
          onCancel={() => setShowCameraModal(false)}
        />
      </ThemedView>
    );
  }

  // —— Manual form ——
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={tint} />
        </Pressable>
        <ThemedText type="title" style={styles.title}>
          Thêm từ thủ công
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={[
            styles.input,
            { borderColor, color: textColor, backgroundColor: inputBg },
          ]}
          placeholder="Từ tiếng Anh"
          placeholderTextColor={placeholderColor}
          value={en}
          onChangeText={setEn}
          autoCapitalize="none"
        />
        <TextInput
          style={[
            styles.input,
            { borderColor, color: textColor, backgroundColor: inputBg },
          ]}
          placeholder="Nghĩa tiếng Việt"
          placeholderTextColor={placeholderColor}
          value={vi}
          onChangeText={setVi}
        />
        <TextInput
          style={[
            styles.input,
            styles.inputMulti,
            { borderColor, color: textColor, backgroundColor: inputBg },
          ]}
          placeholder="Ví dụ (tùy chọn)"
          placeholderTextColor={placeholderColor}
          value={example}
          onChangeText={setExample}
          multiline
          numberOfLines={3}
        />
        <ThemedText style={[styles.chipLabel, { color: textSecondary }]}>
          Level (CEFR)
        </ThemedText>
        <View style={styles.chips}>
          {CEFR_LEVELS.map((level) => (
            <Pressable
              key={level}
              onPress={() => setManualLevel(level)}
              style={[
                styles.chip,
                {
                  borderColor,
                  backgroundColor: manualLevel === level ? tint + "30" : cardBg,
                },
              ]}
            >
              <ThemedText
                type="defaultSemiBold"
                style={{ color: manualLevel === level ? tint : textColor }}
              >
                {level}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={handleSaveManual}
          disabled={saving}
          style={[styles.primaryBtn, { backgroundColor: tint }]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>
              Lưu từ
            </ThemedText>
          )}
        </Pressable>
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
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 52,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 18,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.85,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
    opacity: 0.8,
  },
  chipLabel: {
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 8,
  },
  topicInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 72,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  scanRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  scanBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  scanBtnText: {
    fontSize: 14,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
  },
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  ocrHint: {
    fontSize: 14,
    opacity: 0.85,
    marginBottom: 16,
  },
  resultSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  addAllBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addAllBtnText: {
    color: "#fff",
    fontSize: 14,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  resultCardContent: {
    flex: 1,
  },
  resultWordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  speakBtnRow: {
    flexDirection: "row",
    gap: 6,
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
  resultEn: {
    fontSize: 16,
    marginBottom: 0,
  },
  resultIpa: {
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 4,
  },
  resultMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  resultPos: {
    fontSize: 12,
    textTransform: "lowercase",
  },
  resultLevel: {
    fontSize: 12,
    fontWeight: "600",
  },
  resultVi: {
    fontSize: 14,
    marginBottom: 2,
  },
  resultEx: {
    fontSize: 12,
    opacity: 0.85,
    fontStyle: "italic",
  },
  addWordBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  addWordBtnText: {
    color: "#fff",
    fontSize: 12,
  },
  emptyHint: {
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 16,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: "top",
  },
});
