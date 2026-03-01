/**
 * Cấu trúc chi tiết một từ (từ API / dictionary).
 * Dùng cho màn hình Word detail.
 */
export interface WordDefinition {
  definition: string;
  examples: string[];
  level: string;
  pos: string;
}

export interface WordPhonetics {
  uk_pronun: string;
  uk_sound: string;
  us_pronun: string;
  us_sound: string;
  grammar: string;
}

export interface WordDetail {
  word: string;
  definitions: WordDefinition[];
  phonetics: WordPhonetics;
}
