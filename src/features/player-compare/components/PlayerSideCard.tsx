import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { PlayerCompareSide } from '../types';
import { formatOptionalNumber, getClubName, getPlayerName } from '../utils';
import { styles } from '../styles';

type PlayerSideCardProps = {
  player?: PlayerCompareSide;
  favorite?: boolean;
  onPress: () => void;
  onOpenProfile?: () => void;
};

// Spielerkarte. Tippen öffnet die Spielerwahl, das kleine Icon das Profil.
export function PlayerSideCard({ player, favorite, onPress, onOpenProfile }: PlayerSideCardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <Card
          pressable
          onPress={onPress}
          style={[styles.sideCard, favorite && { borderColor: colors.primary }]}
      >
        <View style={styles.sideCardTop}>
          {player ? <Avatar name={getPlayerName(player, t)} size={52} /> : <Avatar icon="person-add" size={52} />}

          {player && onOpenProfile ? (
              <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('compare.openProfile')}
                  onPress={onOpenProfile}
                  style={styles.sideOpenProfile}
              >
                <Ionicons name="open-outline" size={18} color={colors.mutedText} />
              </Pressable>
          ) : null}
        </View>

        {player ? (
            <>
              <Text style={[typography.bodyStrong, styles.sideName, { color: colors.text }]} numberOfLines={2}>
                {getPlayerName(player, t)}
              </Text>

              <Text style={[typography.label, styles.sideName, { color: colors.mutedText }]} numberOfLines={1}>
                {getClubName(player, t)}
              </Text>

              <Text style={[numeric.large, { color: colors.text }]}>{formatOptionalNumber(player.ratings?.currentTtr)}</Text>
            </>
        ) : (
            <Text style={[typography.bodyStrong, styles.sideName, { color: colors.primary }]}>
              {t('compare.pickPlayer')}
            </Text>
        )}
      </Card>
  );
}
