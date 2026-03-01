import React, { createContext, useCallback, useContext, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { RouteLoadingFallback } from '@/components/route-loading-fallback';

type RouteLoadingContextType = {
  isRouteLoading: boolean;
  setRouteLoading: (loading: boolean) => void;
};

const RouteLoadingContext = createContext<RouteLoadingContextType | null>(null);

export function RouteLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isRouteLoading, setRouteLoading] = useState(false);

  const setLoading = useCallback((loading: boolean) => {
    setRouteLoading(loading);
  }, []);

  return (
    <RouteLoadingContext.Provider value={{ isRouteLoading, setRouteLoading: setLoading }}>
      {children}
      <Modal
        visible={isRouteLoading}
        transparent
        statusBarTranslucent
        animationType="fade"
        supportedOrientations={['portrait']}
      >
        <View style={styles.overlay}>
          <RouteLoadingFallback />
        </View>
      </Modal>
    </RouteLoadingContext.Provider>
  );
}

export function useRouteLoading() {
  const ctx = useContext(RouteLoadingContext);
  if (!ctx) throw new Error('useRouteLoading must be used within RouteLoadingProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
