export interface Word {
  id: string;
  en: string;
  vi: string;
  example: string;
}

export interface QuizResult {
  id: string;
  date: string;
  total: number;
  correct: number;
  answers: { wordId: string; correct: boolean }[];
}
