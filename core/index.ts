/**
 * Core module: re-export store, context, constants, and hooks for app use.
 */
export { store, persistor } from './store';
export type { RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector } from './store/hooks';
export { useWords } from './store/use-words';
export { useQuizStore } from './store/quiz-store';
export { RouteLoadingProvider, useRouteLoading } from './context/route-loading-context';
export { Colors, Fonts } from './constants/theme';
