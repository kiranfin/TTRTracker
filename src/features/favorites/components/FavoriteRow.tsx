import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { ClubLogo } from '@/src/components/ClubLogo';
import { ListRow } from '@/src/components/ListRow';
import { useI18n } from '@/src/i18n/I18nProvider';
import { FavoriteItem } from '@/src/storage/favorites';
import { MIN_TOUCH } from '@/src/theme/spacing';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric } from '@/src/theme/typography';
import { styles } from '../styles';

type FavoriteRowProps = {
  item: FavoriteItem;
  editing: boolean;
  onPress: () => void;
  onRemove: () => void;
};

// Neue Favoriten speichern den TTR im Feld `ttr`, ältere nur als String in params.
function getFavoriteTtr(item: FavoriteItem) {
  const value = typeof item.ttr === 'number' ? item.ttr : Number(item.params?.ttr);

  return Number.isFinite(value) && value > 0 ? value : undefined;
}

export function FavoriteRow({ item, editing, onPress, onRemove }: FavoriteRowProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const ttr = item.type === 'player' ? getFavoriteTtr(item) : undefined;

  const subtitle =
      item.type === 'player'
          ? item.params?.clubName || item.subtitle || t('entities.clubUnknown')
          : item.type === 'club'
              ? [item.params?.organizationName, item.params?.organization].filter(Boolean).join(' · ') ||
              item.subtitle ||
              t('search.associationUnknown')
              : [item.subtitle || t('entities.league'), item.params?.season ? t('favorites.seasonValue', { season: item.params.season }) : undefined]
                  .filter(Boolean)
                  .join(' · ');

  const leading =
      item.type === 'player' ? (
          <Avatar name={item.title} size={40} />
      ) : item.type === 'club' ? (
          <ClubLogo
              organization={item.params?.organization}
              clubNumber={item.params?.clubNumber}
              size={40}
          />
      ) : (
          <Avatar icon="trophy-outline" shape="square" size={40} tone="neutral" />
      );

  return (
      <ListRow
          leading={leading}
          title={item.title}
          subtitle={subtitle}
          chevron={!editing}
          onPress={editing ? undefined : onPress}
          trailing={
            <View style={styles.trailing}>
              {typeof ttr === 'number' ? <Text style={[numeric.medium, { color: colors.text }]}>{ttr}</Text> : null}

              {editing ? (
                  <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${t('favorites.removeFavorite')}: ${item.title}`}
                      onPress={onRemove}
                      style={({ pressed }) => ({
                        width: MIN_TOUCH,
                        height: MIN_TOUCH,
                        marginRight: -8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.6 : 1,
                      })}
                  >
                    <Ionicons name="remove-circle" size={26} color={colors.destructive} />
                  </Pressable>
              ) : null}
            </View>
          }
      />
  );
}
