import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Word } from '@/types/word';
import { STORAGE_KEYS } from '@/store/storage-keys';

type WordsContextType = {
  words: Word[];
  knownIds: Set<string>;
  loaded: boolean;
  load: () => Promise<void>;
  toggleKnown: (id: string) => Promise<void>;
  addWord: (word: Omit<Word, 'id'>) => Promise<Word>;
  isKnown: (id: string) => boolean;
};

const WordsContext = createContext<WordsContextType | null>(null);

export function WordsProvider({ children }: { children: React.ReactNode }) {
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
        setWords(JSON.parse(wordsJson) as Word[]);
      } else {
        const { SEED_WORDS } = await import('@/data/seed-words');
        setWords(SEED_WORDS);
        await AsyncStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(SEED_WORDS));
      }
      if (knownJson) {
        setKnownIds(new Set(JSON.parse(knownJson) as string[]));
      } else {
        setKnownIds(new Set());
      }
    } catch {
      const { SEED_WORDS } = await import('@/data/seed-words');
      setWords(SEED_WORDS);
      setKnownIds(new Set());
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleKnown = useCallback(async (id: string) => {
    setKnownIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      AsyncStorage.setItem(STORAGE_KEYS.KNOWN_IDS, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const addWord = useCallback(async (word: Omit<Word, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const newWord: Word = { ...word, id };
    setWords((prev) => {
      const next = [newWord, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(next));
      return next;
    });
    return newWord;
  }, []);

  const isKnown = useCallback((id: string) => knownIds.has(id), [knownIds]);

  return (
    <WordsContext.Provider
      value={{ words, knownIds, loaded, load, toggleKnown, addWord, isKnown }}
    >
      {children}
    </WordsContext.Provider>
  );
}

export function useWords() {
  const ctx = useContext(WordsContext);
  if (!ctx) throw new Error('useWords must be used within WordsProvider');
  return ctx;
}
