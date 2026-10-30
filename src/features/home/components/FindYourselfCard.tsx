import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { styles } from '../styles';

export function FindYourselfCard({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <Card style={styles.messageCard}>
        <View style={[styles.findIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="person-add-outline" size={24} color={colors.primary} />
        </View>

        <View style={styles.messageText}>
          <Text style={[typography.section, { color: colors.text }]}>{t('home.findYourselfTitle')}</Text>
          <Text style={[typography.body, { color: colors.mutedText }]}>{t('home.findYourselfSubtitle')}</Text>
        </View>

        <Button variant="primary" icon="search-outline" onPress={onPress}>
          {t('home.findYourselfAction')}
        </Button>
      </Card>
  );
}
