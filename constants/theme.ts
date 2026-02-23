/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Green as base color — works in both light and dark
const tintColorLight = '#16a34a';
const tintColorDark = '#4ade80'; // brighter green for dark mode contrast

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#6b7280',
    background: '#fff',
    cardBackground: '#f3f4f6',
    inputBackground: '#f9fafb',
    border: '#e5e7eb',
    placeholder: '#9ca3af',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#f3f4f6',
    textSecondary: '#9ca3af',
    background: '#0f1114',
    cardBackground: '#1a1e24',
    inputBackground: '#15191f',
    border: '#374151',
    placeholder: '#6b7280',
    tint: tintColorDark,
    icon: '#9ca3af',
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
