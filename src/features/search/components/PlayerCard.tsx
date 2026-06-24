import { Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { IconButton } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { NormalizedPlayer } from '@/src/types/tttracker';
import { ttrTone } from '@/src/utils/normalizers';
import { styles } from '../styles';

export function PlayerCard({
                      player,
                      favorite,
                      onPress,
                      onToggleFavorite,
                    }: {
  player: NormalizedPlayer;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const { colors } = useTheme();

  return (
      <Card pressable onPress={onPress} style={styles.resultCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardText}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{player.fullName}</Text>
            <Text style={[styles.resultSubtitle, { color: colors.mutedText }]}>{player.clubName}</Text>
          </View>
          <IconButton icon={favorite ? 'star' : 'star-outline'} active={favorite} onPress={onToggleFavorite} />
        </View>

        <View style={styles.badgeRow}>
          <Badge tone={ttrTone(player.ttr)} icon="trophy-outline">TTR: {player.ttr ?? '-'}</Badge>
          {player.state ? <Badge tone="outline">{player.state}</Badge> : null}
        </View>
      </Card>
  );
}
