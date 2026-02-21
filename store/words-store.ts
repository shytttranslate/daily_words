import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { Word } from '@/types/word';
import { SEED_WORDS } from '@/data/seed-words';

const STORAGE_KEYS = {
  WORDS: '@daily_words:words',
  KNOWN_IDS: '@daily_words:knownIds',
  QUIZ_RESULTS: '@daily_words:quizResults',
};

export function useWordsStore() {
  const [words, setWords] = useState<Word[]>([]);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [wordsJson, knownJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WORDS),
        AsyncStorage.getItem(STORAGE_KEYS.KNOWN_IDS),
      ]);
      if (wordsJson) {
        const parsed = JSON.parse(wordsJson) as Word[];
        setWords(parsed);
      } else {
        setWords(SEED_WORDS);
        await AsyncStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(SEED_WORDS));
      }
      if (knownJson) {
        setKnownIds(new Set(JSON.parse(knownJson) as string[]));
      } else {
        setKnownIds(new Set());
      }
    } catch (e) {
      setWords(SEED_WORDS);
      setKnownIds(new Set());
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleKnown = useCallback(
    async (id: string) => {
      const next = new Set(knownIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setKnownIds(next);
      await AsyncStorage.setItem(STORAGE_KEYS.KNOWN_IDS, JSON.stringify([...next]));
    },
    [knownIds]
  );

  const addWord = useCallback(
    async (word: Omit<Word, 'id'>) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const newWord: Word = { ...word, id };
      const next = [newWord, ...words];
      setWords(next);
      await AsyncStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(next));
      return newWord;
    },
    [words]
  );

  const isKnown = useCallback(
    (id: string) => knownIds.has(id),
    [knownIds]
  );

  return { words, knownIds, loaded, load, toggleKnown, addWord, isKnown };
}

export { STORAGE_KEYS };
