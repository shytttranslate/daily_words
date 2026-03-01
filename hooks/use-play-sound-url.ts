import { Audio } from "expo-av";

const MEDIA_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

/**
 * Chuyển đường dẫn sound từ API (relative) thành URL đầy đủ.
 * Nếu path đã là URL (http/https) thì trả về nguyên.
 */
export function getSoundUri(path: string | undefined): string | null {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const base = MEDIA_BASE.replace(/\/$/, "");
  const segment = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return base ? `${base}${segment}` : null;
}

/**
 * Phát file âm thanh từ URI (expo-av).
 * Gọi khi bấm icon sound ở phần Phiên âm.
 */
export async function playSoundFromUri(uri: string | null): Promise<boolean> {
  if (!uri) return false;
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
    );
    await sound.getStatusAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinishAndNotReset) {
        sound.unloadAsync().catch(() => {});
      }
    });
    await sound.playAsync();
    return true;
  } catch (e) {
    if (__DEV__) {
      console.warn("playSoundFromUri error", e);
    }
    return false;
  }
}
