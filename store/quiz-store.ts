import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { QuizResult } from '@/types/word';
import { STORAGE_KEYS } from './words-store';

export function useQuizStore() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
      if (json) setResults(JSON.parse(json) as QuizResult[]);
      else setResults([]);
    } catch {
      setResults([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addResult = useCallback(async (result: QuizResult) => {
    const next = [result, ...results];
    setResults(next);
    await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(next));
  }, [results]);

  return { results, loaded, load, addResult };
}
