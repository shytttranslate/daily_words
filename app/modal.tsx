import { useWords } from '@/context/words-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

export default function ModalScreen() {
  const { addWord } = useWords();
  const router = useRouter();
  const [en, setEn] = useState('');
  const [vi, setVi] = useState('');
  const [example, setExample] = useState('');
  const [saving, setSaving] = useState(false);
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#333' }, 'background');
  const tint = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const handleSave = async () => {
    const wordEn = en.trim();
    const wordVi = vi.trim();
    if (!wordEn || !wordVi) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập từ tiếng Anh và nghĩa tiếng Việt.');
      return;
    }
    setSaving(true);
    try {
      await addWord({
        en: wordEn,
        vi: wordVi,
        example: example.trim(),
      });
      router.back();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu từ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Thêm từ mới
      </ThemedText>
      <TextInput
        style={[styles.input, { borderColor, color: textColor }]}
        placeholder="Từ tiếng Anh"
        placeholderTextColor="#888"
        value={en}
        onChangeText={setEn}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { borderColor, color: textColor }]}
        placeholder="Nghĩa tiếng Việt"
        placeholderTextColor="#888"
        value={vi}
        onChangeText={setVi}
      />
      <TextInput
        style={[styles.input, styles.inputMulti, { borderColor, color: textColor }]}
        placeholder="Ví dụ (tùy chọn)"
        placeholderTextColor="#888"
        value={example}
        onChangeText={setExample}
        multiline
        numberOfLines={3}
      />
      <View style={styles.actions}>
        <Link href="/" asChild>
          <Pressable style={[styles.btn, styles.btnSecondary, { borderColor }]}>
            <ThemedText type="defaultSemiBold">Hủy</ThemedText>
          </Pressable>
        </Link>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.btn, styles.btnPrimary, { backgroundColor: tint }]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="defaultSemiBold" style={styles.btnPrimaryText}>
              Lưu
            </ThemedText>
          )}
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    borderWidth: 1,
  },
  btnPrimary: {},
  btnPrimaryText: {
    color: '#fff',
  },
});
