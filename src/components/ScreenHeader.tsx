import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nProvider';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

type BackButtonProps = {
  onPress?: () => void;
};

export function BackButton({ onPress }: BackButtonProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  return (
      <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={onPress ?? (() => router.back())}
          hitSlop={6}
          style={({ pressed }) => [
            styles.backButton,
            noWebOutline,
            {
              backgroundColor: pressed ? colors.primarySoft : colors.card,
              borderColor: pressed ? colors.primarySoftBorder : colors.border,
            },
          ]}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
  );
}

type ScreenHeaderProps = {
  title?: string;
  onBack?: () => void;
  hideBack?: boolean;
  right?: ReactNode;
};

export function ScreenHeader({ title, onBack, hideBack, right }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
      <View style={styles.row}>
        {hideBack ? null : <BackButton onPress={onBack} />}

        <View style={styles.titleWrap}>
          {title ? (
              <Text style={[typography.section, styles.title, { color: colors.text }]} numberOfLines={1}>
                {title}
              </Text>
          ) : null}
        </View>

        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    textAlign: 'left',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
