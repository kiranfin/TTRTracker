import { ScrollView, Text, View } from 'react-native';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { FavoriteSection, FavoritePlayerCard, FavoriteClubCard, FavoriteLeagueCard } from '../../src/features/favorites/components';
import { useFavorites } from '../../src/features/favorites/hooks/useFavorites';
import { styles } from '../../src/features/favorites/styles';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { favorites, players, clubs, leagues, openFavorite, removeItem } = useFavorites();

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>{t('favorites.title')}</Text>
          </View>

          {favorites.length === 0 ? (
              <EmptyState
                  icon="star-outline"
                  title={t('favorites.emptyTitle')}
                  subtitle={t('favorites.emptySubtitle')}
              />
          ) : null}

          {players.length > 0 ? (
              <FavoriteSection title={t('entities.players')} icon="person-outline" count={players.length}>
                {players.map((item) => (
                    <FavoritePlayerCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        onPress={() => openFavorite(item)}
                        onRemove={() => removeItem(item)}
                    />
                ))}
              </FavoriteSection>
          ) : null}

          {clubs.length > 0 ? (
              <FavoriteSection title={t('entities.clubs')} icon="tennisball-outline" count={clubs.length}>
                {clubs.map((item) => (
                    <FavoriteClubCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        onPress={() => openFavorite(item)}
                        onRemove={() => removeItem(item)}
                    />
                ))}
              </FavoriteSection>
          ) : null}

          {leagues.length > 0 ? (
              <FavoriteSection title={t('entities.leagues')} icon="podium-outline" count={leagues.length}>
                {leagues.map((item) => (
                    <FavoriteLeagueCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        onPress={() => openFavorite(item)}
                        onRemove={() => removeItem(item)}
                    />
                ))}
              </FavoriteSection>
          ) : null}
        </ScrollView>
      </Screen>
  );
}
