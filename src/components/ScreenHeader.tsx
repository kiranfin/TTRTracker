import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nProvider';
import { MIN_TOUCH, spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

type BackButtonProps = {
  onPress?: () => void;
};

// Schlichter Chevron ohne Rahmen, links bündig mit dem Inhalt.
export function BackButton({ onPress }: BackButtonProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  return (
      <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={onPress ?? (() => router.back())}
          style={({ pressed }) => [styles.backButton, noWebOutline, { opacity: pressed ? 0.5 : 1 }]}
      >
        <Ionicons name="chevron-back" size={26} color={colors.text} />
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
              <Text style={[typography.title, { color: colors.text }]} numberOfLines={1}>
                {title}
              </Text>
          ) : null}
        </View>

        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
  );
}

type HeaderIconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  onPress: () => void;
  color?: string;
};

// Umrandeter 44er Button rechts im Header (z. B. Stern auf Profil und Liga).
export function HeaderIconButton({ icon, accessibilityLabel, onPress, color }: HeaderIconButtonProps) {
  const { colors } = useTheme();

  return (
      <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={onPress}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
      >
        <Ionicons name={icon} size={20} color={color ?? colors.text} />
      </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH,
  },
  backButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
