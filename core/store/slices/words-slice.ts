import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Word } from '@/types/word';

export type WordsState = {
  words: Word[];
  knownIds: string[];
  loaded: boolean;
};

const initialState: WordsState = {
  words: [],
  knownIds: [],
  loaded: false,
};

const wordsSlice = createSlice({
  name: 'words',
  initialState,
  reducers: {
    setWords: (state, action: PayloadAction<Word[]>) => {
      state.words = action.payload;
    },
    setKnownIds: (state, action: PayloadAction<string[]>) => {
      state.knownIds = action.payload;
    },
    setLoaded: (state, action: PayloadAction<boolean>) => {
      state.loaded = action.payload;
    },
    addWord: (state, action: PayloadAction<Word>) => {
      state.words.unshift(action.payload);
    },
    toggleKnown: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const idx = state.knownIds.indexOf(id);
      if (idx >= 0) {
        state.knownIds.splice(idx, 1);
      } else {
        state.knownIds.push(id);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase('persist/REHYDRATE', (state, action: PayloadAction<Partial<WordsState> & { key?: string }>) => {
      const p = action.payload;
      if (p && Array.isArray(p.words)) state.words = p.words;
      if (p && Array.isArray(p.knownIds)) state.knownIds = p.knownIds;
      state.loaded = true;
    });
  },
});

export const { setWords, setKnownIds, setLoaded, addWord, toggleKnown } = wordsSlice.actions;

export const addWordThunk =
  (word: Omit<Word, 'id'>) =>
  (dispatch: (a: ReturnType<typeof addWord>) => void): Word => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const newWord: Word = { ...word, id };
    dispatch(addWord(newWord));
    return newWord;
  };

export default wordsSlice.reducer;
