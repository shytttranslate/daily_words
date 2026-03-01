import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { RouteLoadingProvider } from "@/context/route-loading-context";
import { WordsProvider, useWords } from "@/context/words-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

function HideSplashWhenReady() {
  const { loaded } = useWords();
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <WordsProvider>
          <RouteLoadingProvider>
            <HideSplashWhenReady />
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Thêm từ" }}
              />
              <Stack.Screen
                name="generate-modal"
                options={{ presentation: "modal", title: "Tạo từ theo chủ đề" }}
              />
              <Stack.Screen
                name="word-detail"
                options={{ title: "Chi tiết từ" }}
              />
              <StatusBar style="auto" />
            </Stack>
          </RouteLoadingProvider>
        </WordsProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
