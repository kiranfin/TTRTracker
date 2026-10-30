import { ReactNode } from 'react';
import {
  ImageBackground,
  Platform,
  StatusBar,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardOverlap } from '../hooks/useKeyboardOverlap';
import { useTheme } from '../theme/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, style, contentStyle }: ScreenProps) {
  const { colors, mode, backgroundImageUri } = useTheme();
  const insets = useSafeAreaInsets();
  const { ref, overlap } = useKeyboardOverlap();

  const androidStatusBarHeight =
      Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const topSpacing = Math.max(insets.top, androidStatusBarHeight) + 10;

  const overlayColor =
      mode === 'dark'
          ? 'rgba(11, 15, 23, 0.78)'
          : 'rgba(244, 245, 247, 0.78)';

  const content = (
      <View
          style={[
            styles.safeArea,
            {
              paddingTop: topSpacing,
            },
            style,
          ]}
      >
        <View ref={ref} style={[styles.keyboardView, { paddingBottom: overlap }]}>
          <View style={[styles.content, contentStyle]}>{children}</View>
        </View>
      </View>
  );

  if (backgroundImageUri) {
    return (
        <ImageBackground
            source={{ uri: backgroundImageUri }}
            resizeMode="cover"
            style={styles.root}
        >
          <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
            {content}
          </View>
        </ImageBackground>
    );
  }

  return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {content}
      </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});