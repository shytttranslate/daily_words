/**
 * Public API for words feature. Use this instead of direct Redux selectors/dispatch.
 */
import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import {
  selectWords,
  selectWordsLoaded,
  selectKnownIdsSet,
} from './selectors/words-selectors';
import { toggleKnown, addWordThunk } from './slices/words-slice';
import type { Word } from '@/types/word';

export function useWords() {
  const dispatch = useAppDispatch();
  const words = useAppSelector(selectWords);
  const loaded = useAppSelector(selectWordsLoaded);
  const knownIds = useAppSelector(selectKnownIdsSet);

  const knownIdsSet = useMemo(() => new Set(knownIds), [knownIds]);
  const isKnown = useCallback(
    (id: string) => knownIds.includes(id),
    [knownIds]
  );

  const toggleKnownHandler = useCallback(
    (id: string) => {
      dispatch(toggleKnown(id));
    },
    [dispatch]
  );

  const addWord = useCallback(
    async (word: Omit<Word, 'id'>): Promise<Word> => {
      const result = dispatch(addWordThunk(word));
      return result as unknown as Word;
    },
    [dispatch]
  );

  return {
    words,
    knownIds: knownIdsSet,
    loaded,
    toggleKnown: toggleKnownHandler,
    addWord,
    isKnown,
  };
}
