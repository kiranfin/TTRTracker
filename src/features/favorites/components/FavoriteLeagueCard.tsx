import { Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { IconButton } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { FavoriteItem } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function FavoriteLeagueCard({
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
              {item.subtitle || t('entities.league')}
            </Text>
          </View>

          <IconButton icon="star" active onPress={onRemove} />
        </View>

        <View style={styles.badgeRow}>
          {item.params?.season ? (
              <Badge tone="outline">{t('favorites.seasonValue', { season: item.params.season })}</Badge>
          ) : null}
          {item.params?.association ? <Badge tone="secondary">{item.params.association}</Badge> : null}
        </View>
      </Card>
  );
}
