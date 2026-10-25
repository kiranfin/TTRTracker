import { Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { styles } from '../styles';

type ClubHeaderProps = {
  title: string;
  subtitle: string;
};

export function ClubHeader({ title, subtitle }: ClubHeaderProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <View style={styles.clubHead}>
        <Avatar icon="business-outline" shape="square" size={60} tone="accent" />

        <View style={styles.clubHeadText}>
          <Text style={[typography.heading, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[typography.meta, styles.clubHeadSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
            {subtitle || t('club.defaultTitle')}
          </Text>
        </View>
      </View>
  );
}
