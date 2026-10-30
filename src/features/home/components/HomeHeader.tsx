import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { styles } from '../styles';

type HomeHeaderProps = {
  firstName: string;
  displayName: string;
  hasProfile: boolean;
};

export function HomeHeader({ firstName, displayName, hasProfile }: HomeHeaderProps) {
  const { colors } = useTheme();
  const { t, language } = useI18n();

  const dateLabel = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[typography.meta, styles.headerDate, { color: colors.mutedText }]}>{dateLabel}</Text>

          <Text style={[typography.titleLarge, { color: colors.text }]} numberOfLines={1}>
            {firstName ? t('home.greeting', { name: firstName }) : t('home.greetingAnonymous')}
          </Text>
        </View>

        <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home.openSettings')}
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.avatarButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Avatar name={hasProfile ? displayName : undefined} size={44} tone="accent" />
        </Pressable>
      </View>
  );
}
