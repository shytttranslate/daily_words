import * as Speech from 'expo-speech';

export type SpeakLocale = 'en-US' | 'en-GB';

/**
 * Phát âm từ theo giọng US hoặc UK.
 * Gọi Speech.stop() trước để tránh xếp hàng phát khi bấm nhanh.
 */
export function speakWord(text: string, locale: SpeakLocale): void {
  const trimmed = text?.trim();
  if (!trimmed) return;

  try {
    Speech.stop().then(() => {
      Speech.speak(trimmed, { language: locale });
    }).catch(() => {
      Speech.speak(trimmed, { language: locale });
    });
  } catch (e) {
    if (__DEV__) {
      console.warn('speakWord error', e);
    }
  }
}
