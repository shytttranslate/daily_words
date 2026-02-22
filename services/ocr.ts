import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { getTextFromFrame } from 'expo-text-recognition';

export type PickImageResult = { uri: string } | { cancelled: true };

/**
 * Chọn ảnh từ thiết bị (file / thư mục) — dùng document picker, không dùng expo-image-picker.
 */
export async function pickImageFromGallery(): Promise<PickImageResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'image/*',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length || !result.assets[0].uri) {
    return { cancelled: true };
  }
  return { uri: result.assets[0].uri };
}

/**
 * Trích xuất text từ ảnh (URI file hoặc content://).
 * Nếu URI là content:// thì đọc base64 qua FileSystem rồi gọi getTextFromFrame(..., true).
 * Cần development build; không chạy trong Expo Go.
 */
export async function recognizeTextFromUri(uri: string): Promise<string> {
  const isContentUri = uri.startsWith('content://');
  let lines: string[];
  if (isContentUri) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    lines = await getTextFromFrame(base64, true);
  } else {
    lines = await getTextFromFrame(uri, false);
  }
  return (Array.isArray(lines) ? lines.filter(Boolean).join('\n') : String(lines ?? '')).trim();
}
