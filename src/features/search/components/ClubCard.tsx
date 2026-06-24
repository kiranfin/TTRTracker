import { Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { IconButton } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { NormalizedClub } from '@/src/types/tttracker';
import { styles } from '../styles';

export function ClubCard({
                    club,
                    favorite,
                    onPress,
                    onToggleFavorite,
                  }: {
  club: NormalizedClub;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <Card pressable onPress={onPress} style={styles.resultCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardText}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{club.name}</Text>
            <Text style={[styles.resultSubtitle, { color: colors.mutedText }]}>
              {[club.organizationName, club.organization].filter(Boolean).join(' • ') || t('search.associationUnknown')}
            </Text>
          </View>
          <IconButton icon={favorite ? 'star' : 'star-outline'} active={favorite} onPress={onToggleFavorite} />
        </View>

        <View style={styles.badgeRow}>
          {club.clubNumber ? <Badge tone="secondary" icon="people-outline">#{club.clubNumber}</Badge> : null}
          {club.state ? <Badge tone="outline">{club.state}</Badge> : null}
        </View>
      </Card>
  );
}
