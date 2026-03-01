import type { RootState } from '../index';
import type { Word } from '@/types/word';

export const selectWords = (state: RootState) => state.words.words;
export const selectKnownIds = (state: RootState) => state.words.knownIds;
export const selectWordsLoaded = (state: RootState) => state.words.loaded;

/** Memoized: returns whether word id is known. Use with useSelector(selectIsKnown) and call result(id). */
export const selectKnownIdsSet = (state: RootState) => state.words.knownIds;

export function selectIsKnown(state: RootState, id: string): boolean {
  return state.words.knownIds.includes(id);
}

/** For use in list items: pass id and get isKnown. Use with shallowEqual or in a memoized selector per id. */
export function createSelectIsKnownForId(id: string) {
  return (state: RootState) => state.words.knownIds.includes(id);
}
