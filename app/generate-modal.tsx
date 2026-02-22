import { useWords } from '@/context/words-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { generateWordsByTopic } from '@/services/generate-words';
import { pickImageFromGallery, recognizeTextFromUri } from '@/services/ocr';
import { CameraCaptureModal } from '@/components/camera-capture-modal';
import type { Word } from '@/types/word';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const SUGGESTIONS = ['Công nghệ', 'Du lịch', 'Kinh doanh'];

function ResultWordCard({
  word,
  onAdd,
  added,
  tint,
  borderColor,
}: {
  word: Word;
  onAdd: () => void;
  added: boolean;
  tint: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.resultCard, { borderColor }]}>
      <View style={styles.resultCardContent}>
        <ThemedText type="defaultSemiBold" style={styles.resultEn}>
          {word.en}
        </ThemedText>
        <ThemedText style={styles.resultVi}>{word.vi}</ThemedText>
        {word.example ? (
          <ThemedText style={styles.resultEx}>VD: {word.example}</ThemedText>
        ) : null}
      </View>
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

export default function GenerateModalScreen() {
  const { addWord } = useWords();
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Word[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#333' }, 'background');
  const textColor = useThemeColor({}, 'text');

  const runOcrOnUri = useCallback(async (uri: string) => {
    setOcrLoading(true);
    try {
      const text = await recognizeTextFromUri(uri);
      if (text) {
        setTopic((prev) => (prev ? `${prev}\n${text}` : text));
      } else {
        Alert.alert('Không nhận diện được chữ', 'Ảnh không có text hoặc không rõ. Thử ảnh khác.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi khi quét ảnh.';
      if (/development build|native module|expo go/i.test(String(e))) {
        Alert.alert(
          'Cần development build',
          'Tính năng quét ảnh cần build app có native module. Chạy "npx expo prebuild" rồi build Android/iOS, không dùng Expo Go.'
        );
      } else {
        Alert.alert('Lỗi', msg);
      }
    } finally {
      setOcrLoading(false);
    }
  }, []);

  const handleScanFromGallery = useCallback(async () => {
    try {
      const result = await pickImageFromGallery();
      if ('cancelled' in result && result.cancelled) return;
      if ('uri' in result) await runOcrOnUri(result.uri);
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể mở thư viện ảnh.');
    }
  }, [runOcrOnUri]);

  const handleScanFromCamera = useCallback(() => {
    setShowCameraModal(true);
  }, []);

  const handleCameraCapture = useCallback(
    (uri: string) => {
      setShowCameraModal(false);
      runOcrOnUri(uri);
    },
    [runOcrOnUri]
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
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [topic]);

  const handleAddOne = useCallback(
    async (word: Word) => {
      await addWord({ en: word.en, vi: word.vi, example: word.example });
      setAddedIds((prev) => new Set(prev).add(word.id));
    },
    [addWord]
  );

  const handleAddAll = useCallback(async () => {
    for (const w of results) {
      if (addedIds.has(w.id)) continue;
      await addWord({ en: w.en, vi: w.vi, example: w.example });
      setAddedIds((prev) => new Set(prev).add(w.id));
    }
  }, [results, addedIds, addWord]);

  const allAdded = results.length > 0 && addedIds.size === results.length;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: tint + '18', borderColor: tint + '40' }]}>
          <IconSymbol name="sparkles" size={40} color={tint} />
          <ThemedText type="title" style={styles.heroTitle}>
            Tạo từ theo chủ đề
          </ThemedText>
          <ThemedText style={styles.heroSub}>
            Nhập chủ đề hoặc nội dung để nhận danh sách từ vựng liên quan.
          </ThemedText>
        </View>

        <TextInput
          style={[styles.input, { borderColor, color: textColor }]}
          placeholder="Ví dụ: Công nghệ, Du lịch, Email công việc..."
          placeholderTextColor="#888"
          value={topic}
          onChangeText={setTopic}
          multiline
          numberOfLines={2}
          editable={!loading}
        />

        <ThemedText style={styles.chipLabel}>Lấy chủ đề từ ảnh (OCR)</ThemedText>
        <View style={styles.scanRow}>
          <Pressable
            onPress={handleScanFromGallery}
            disabled={ocrLoading || loading}
            style={[styles.scanBtn, { borderColor, backgroundColor: borderColor + '60' }]}
          >
            {ocrLoading ? (
              <ActivityIndicator size="small" color={tint} />
            ) : (
              <IconSymbol name="photo" size={24} color={tint} />
            )}
            <ThemedText type="defaultSemiBold" style={styles.scanBtnText}>
              Chọn ảnh
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={handleScanFromCamera}
            disabled={ocrLoading || loading}
            style={[styles.scanBtn, { borderColor, backgroundColor: borderColor + '60' }]}
          >
            {ocrLoading ? (
              <ActivityIndicator size="small" color={tint} />
            ) : (
              <IconSymbol name="camera" size={24} color={tint} />
            )}
            <ThemedText type="defaultSemiBold" style={styles.scanBtnText}>
              Chụp ảnh
            </ThemedText>
          </Pressable>
        </View>

        <CameraCaptureModal
          visible={showCameraModal}
          onCapture={handleCameraCapture}
          onCancel={() => setShowCameraModal(false)}
        />

        <ThemedText style={styles.chipLabel}>Gợi ý nhanh</ThemedText>
        <View style={styles.chips}>
          {SUGGESTIONS.map((label) => (
            <Pressable
              key={label}
              onPress={() => setTopic(label)}
              style={[styles.chip, { borderColor, backgroundColor: borderColor + '80' }]}
            >
              <ThemedText type="defaultSemiBold">{label}</ThemedText>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleGenerate}
          disabled={loading || !topic.trim()}
          style={[
            styles.generateBtn,
            { backgroundColor: loading || !topic.trim() ? borderColor : tint },
          ]}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <ThemedText type="defaultSemiBold" style={styles.generateBtnText}>
                Đang tạo từ vựng...
              </ThemedText>
            </>
          ) : (
            <ThemedText type="defaultSemiBold" style={styles.generateBtnText}>
              Tạo từ vựng
            </ThemedText>
          )}
        </Pressable>

        {!loading && results.length > 0 && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <ThemedText type="subtitle">Kết quả ({results.length} từ)</ThemedText>
              {!allAdded && (
                <Pressable
                  onPress={handleAddAll}
                  style={[styles.addAllBtn, { backgroundColor: tint }]}
                >
                  <ThemedText type="defaultSemiBold" style={styles.addAllBtnText}>
                    Thêm tất cả
                  </ThemedText>
                </Pressable>
              )}
            </View>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <ResultWordCard
                  word={item}
                  onAdd={() => handleAddOne(item)}
                  added={addedIds.has(item.id)}
                  tint={tint}
                  borderColor={borderColor}
                />
              )}
            />
          </View>
        )}

        {!loading && results.length === 0 && (
          <ThemedText style={styles.emptyHint}>
            {hasSearched
              ? 'Không tìm thấy từ nào. Thử chủ đề khác.'
              : 'Nhập chủ đề ở trên và nhấn "Tạo từ vựng" để bắt đầu.'}
          </ThemedText>
        )}

        <View style={styles.footer}>
          <Link href="/" asChild>
            <Pressable style={[styles.closeBtn, { borderColor }]}>
              <ThemedText type="defaultSemiBold">Đóng</ThemedText>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  hero: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
  },
  heroTitle: {
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSub: {
    textAlign: 'center',
    opacity: 0.9,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  chipLabel: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 8,
  },
  scanRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  scanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  scanBtnText: {
    fontSize: 15,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 28,
  },
  generateBtnText: {
    color: '#fff',
  },
  resultSection: {
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  addAllBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  addAllBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  resultCardContent: {
    flex: 1,
  },
  resultEn: {
    fontSize: 17,
    marginBottom: 4,
  },
  resultVi: {
    fontSize: 14,
    marginBottom: 2,
  },
  resultEx: {
    fontSize: 13,
    opacity: 0.85,
    fontStyle: 'italic',
  },
  addWordBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  addWordBtnText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyHint: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 24,
  },
  footer: {
    marginTop: 8,
  },
  closeBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
});
