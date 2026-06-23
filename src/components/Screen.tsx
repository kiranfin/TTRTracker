import { ReactNode } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, style, contentStyle }: ScreenProps) {
  const { colors, mode, backgroundImageUri } = useTheme();
  const insets = useSafeAreaInsets();

  const androidStatusBarHeight =
      Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const topSpacing = Math.max(insets.top, androidStatusBarHeight) + 10;

  const overlayColor =
      mode === 'dark'
          ? 'rgba(23, 23, 23, 0.78)'
          : 'rgba(249, 250, 251, 0.78)';

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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
        >
          <View style={[styles.content, contentStyle]}>{children}</View>
        </KeyboardAvoidingView>
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