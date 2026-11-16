import { Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { ListRow } from '@/src/components/ListRow';
import { StarButton } from '@/src/components/StarButton';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric } from '@/src/theme/typography';
import type { NormalizedPlayer } from '@/src/types/tttracker';
import { styles } from '../styles';

type PlayerRowProps = {
  player: NormalizedPlayer;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
};

export function PlayerRow({ player, favorite, onPress, onToggleFavorite }: PlayerRowProps) {
  const { colors } = useTheme();

  return (
      <ListRow
          leading={<Avatar name={player.fullName} size={40} />}
          title={player.fullName}
          subtitle={player.clubName || undefined}
          chevron={false}
          onPress={onPress}
          trailing={
            <View style={styles.trailing}>
              {typeof player.ttr === 'number' ? (
                  <View style={styles.ttrBlock}>
                    <Text style={[numeric.medium, { color: colors.text }]}>{player.ttr}</Text>
                    <Text style={[styles.ttrCaption, { color: colors.mutedText }]}>TTR</Text>
                  </View>
              ) : null}
              <StarButton active={favorite} onPress={onToggleFavorite} />
            </View>
          }
      />
  );
}
