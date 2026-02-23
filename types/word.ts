export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Word {
  id: string;
  en: string;
  vi: string;
  example: string;
  level?: CEFRLevel;
}

export interface QuizResult {
  id: string;
  date: string;
  total: number;
  correct: number;
  answers: { wordId: string; correct: boolean }[];
}
