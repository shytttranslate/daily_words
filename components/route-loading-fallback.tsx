import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';

/**
 * Full-screen loading fallback for async route chunks (Suspense).
 * Use in root and tab layouts so users see an indicator instead of a white screen.
 */
export function RouteLoadingFallback() {
  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
