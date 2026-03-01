import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RouteLoadingFallback } from '@/components/route-loading-fallback';
import { useRouteLoading } from '@/context/route-loading-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <RouteLoadingFallback />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Từ vựng',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Ôn tập',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          tabBarButton: TabBarButtonWithLoading,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Thống kê',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          tabBarButton: TabBarButtonWithLoading,
        }}
      />
    </Tabs>
  );
}

function TabBarButtonWithLoading(props: BottomTabBarButtonProps) {
  const { setRouteLoading } = useRouteLoading();
  const handlePress = useCallback(
    (ev: unknown) => {
      setRouteLoading(true);
      props.onPress?.(ev as never);
    },
    [props, setRouteLoading]
  );
  return <HapticTab {...props} onPress={handlePress} />;
}
