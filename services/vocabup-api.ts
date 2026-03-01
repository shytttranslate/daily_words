import axios from 'axios';
import type { CEFRLevel } from '@/types/word';
import type { WordDetail } from '@/types/word-detail';

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

/** Item trả về từ POST /v1/vocabup/generate-vocabulary */
export interface GeneratedVocabularyItem {
  word: string;
  ipa?: string;
  pos?: string;
  level?: string;
  meaning_vi: string;
  example?: string;
}

/** Item có thêm id (sinh client) dùng cho key và trạng thái đã thêm */
export type GeneratedWord = GeneratedVocabularyItem & { id: string };

/** Map từ Free Dictionary API / backend sang WordDetail */
function mapDictionaryEntryToWordDetail(entry: {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{ definition?: string; example?: string }>;
  }>;
}): WordDetail {
  const phoneticText =
    entry.phonetics?.[0]?.text ?? entry.phonetic ?? '';
  const definitions = (entry.meanings ?? []).flatMap((m) =>
    (m.definitions ?? []).map((d) => ({
      definition: d.definition ?? '',
      examples: d.example ? [d.example] : [],
      level: '',
      pos: m.partOfSpeech ?? '',
    }))
  );
  if (definitions.length === 0) {
    definitions.push({ definition: '', examples: [], level: '', pos: '' });
  }
  return {
    word: entry.word,
    definitions,
    phonetics: {
      uk_pronun: phoneticText,
      uk_sound: entry.phonetics?.find((p) => p.audio)?.audio ?? '',
      us_pronun: phoneticText,
      us_sound: entry.phonetics?.find((p) => p.audio)?.audio ?? '',
      grammar: '',
    },
  };
}

/**
 * Lấy chi tiết từ (tra từ điển).
 * Ưu tiên backend nếu có endpoint; không thì dùng Free Dictionary API.
 */
export async function getWordDetail(word: string): Promise<WordDetail | null> {
  const normalized = word.trim().toLowerCase();
  if (!normalized) return null;

  if (baseURL) {
    try {
      const { data } = await apiClient.get<WordDetail>(
        '/v1/vocabup/word-detail',
        { params: { word: normalized } }
      );
      if (data?.word && Array.isArray(data?.definitions) && data?.phonetics) {
        return data;
      }
    } catch {
      // fallback to Free Dictionary API
    }
  }

  try {
    const { data } = await axios.get<unknown[]>(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`,
      { timeout: 10_000 }
    );
    const entry = Array.isArray(data) && data[0] && typeof data[0] === 'object' ? data[0] : null;
    if (entry && typeof (entry as { word?: string }).word === 'string') {
      return mapDictionaryEntryToWordDetail(entry as Parameters<typeof mapDictionaryEntryToWordDetail>[0]);
    }
  } catch {
    // not found or network error
  }
  return null;
}

export interface GenerateVocabularyRequest {
  content: string;
  level?: CEFRLevel;
  wordCount?: number;
}

/**
 * POST /v1/vocabup/generate-vocabulary
 * Body: { content, level?, wordCount? }
 */
export async function generateVocabulary(
  body: GenerateVocabularyRequest,
): Promise<GeneratedVocabularyItem[]> {
  const { data } = await apiClient.post<GeneratedVocabularyItem[]>(
    '/v1/vocabup/generate-vocabulary',
    body,
  );
  return Array.isArray(data) ? data : [];
}

/**
 * POST /v1/vocabup/suggestions
 * Body: { userInput }
 */
export async function getSuggestions(body: {
  userInput: string;
}): Promise<string[]> {
  const { data } = await apiClient.post<{ suggestions?: string[] } | string[]>(
    '/v1/vocabup/suggestions',
    body,
  );
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.suggestions)) {
    return data.suggestions;
  }
  return [];
}
