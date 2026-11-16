import { Pressable, Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { PlayerCompareSide } from '../types';
import { formatOptionalNumber, getClubName, getPlayerName } from '../utils';
import { styles } from '../styles';

type PlayerHalfProps = {
  player?: PlayerCompareSide;
  color: string;
  onChange: () => void;
  onOpenProfile?: () => void;
};

// Eine Hälfte der Vergleichskarte: Avatar, Name, Verein, TTR in Seitenfarbe, darunter "Wechseln".
function PlayerHalf({ player, color, onChange, onOpenProfile }: PlayerHalfProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const name = player ? getPlayerName(player, t) : undefined;

  return (
      <View style={styles.half}>
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={name ?? t('compare.pickPlayer')}
            onPress={player && onOpenProfile ? onOpenProfile : onChange}
            style={styles.halfIdentity}
        >
          <View style={[styles.halfAvatar, { backgroundColor: `${color}24` }]}>
            {name ? (
                <Text style={[typography.section, { color }]}>{name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</Text>
            ) : (
                <Avatar icon="person-add-outline" size={52} />
            )}
          </View>

          <Text style={[typography.bodyStrong, styles.halfText, { color: name ? colors.text : colors.primary }]} numberOfLines={2}>
            {name ?? t('compare.pickPlayer')}
          </Text>

          {player ? (
              <Text style={[typography.label, styles.halfText, { color: colors.mutedText }]} numberOfLines={1}>
                {getClubName(player, t)}
              </Text>
          ) : null}

          {player ? (
              <Text style={[numeric.large, { color }]}>{formatOptionalNumber(player.ratings?.currentTtr)}</Text>
          ) : null}
        </Pressable>

        <Pressable
            accessibilityRole="button"
            onPress={onChange}
            style={({ pressed }) => [
              styles.changePill,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
        >
          <Text style={[typography.label, styles.changePillText, { color: colors.text }]}>{t('compare.change')}</Text>
        </Pressable>
      </View>
  );
}

type PlayersCardProps = {
  left?: PlayerCompareSide;
  right?: PlayerCompareSide;
  onChangeLeft: () => void;
  onChangeRight: () => void;
  onOpenLeft?: () => void;
  onOpenRight?: () => void;
  onSwap?: () => void;
};

// Beide Spieler in einer Karte, dazwischen "VS". Tippen auf VS tauscht die Seiten.
export function PlayersCard({ left, right, onChangeLeft, onChangeRight, onOpenLeft, onOpenRight, onSwap }: PlayersCardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <View style={[styles.playersCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <PlayerHalf player={left} color={colors.primary} onChange={onChangeLeft} onOpenProfile={onOpenLeft} />

        <View style={styles.vsWrap}>
          <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('compare.swapSides')}
              disabled={!onSwap}
              onPress={onSwap}
              style={[styles.vsBadge, { backgroundColor: colors.text }]}
          >
            <Text style={[typography.caption, styles.vsText, { color: colors.card }]}>VS</Text>
          </Pressable>
        </View>

        <PlayerHalf player={right} color={colors.orange} onChange={onChangeRight} onOpenProfile={onOpenRight} />
      </View>
  );
}
