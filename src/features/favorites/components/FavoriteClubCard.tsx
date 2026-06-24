import { Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { IconButton } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { FavoriteItem } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function FavoriteClubCard({
                            item,
                            onPress,
                            onRemove,
                          }: {
  item: FavoriteItem;
  onPress: () => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <Card pressable onPress={onPress} style={styles.resultCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardText}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.resultSubtitle, { color: colors.mutedText }]}>
              {[item.params?.organizationName, item.params?.organization].filter(Boolean).join(' • ') ||
                  item.subtitle ||
                  t('search.associationUnknown')}
            </Text>
          </View>

          <IconButton icon="star" active onPress={onRemove} />
        </View>

        <View style={styles.badgeRow}>
          {item.params?.clubNumber ? (
              <Badge tone="secondary" icon="people-outline">#{item.params.clubNumber}</Badge>
          ) : null}

          {item.params?.state ? <Badge tone="outline">{item.params.state}</Badge> : null}
        </View>
      </Card>
  );
}
