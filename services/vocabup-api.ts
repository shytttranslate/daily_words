import axios from 'axios';
import type { CEFRLevel } from '@/types/word';

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
