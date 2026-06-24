import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Screen } from '@/src/components/Screen';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { ShortcutCard, MeQuickStatsCard, ClubQuickStatsCard } from '../../src/features/home/components';
import { useHome } from '../../src/features/home/hooks/useHome';
import { styles } from '../../src/features/home/styles';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const {
    meNuid,
    displayName,
    firstName,
    clubName,
    currentTtr,
    qTtr,
    maxTtr,
    recentEvents,
    meLoading,
    meError,
    meClub,
    clubCompletedMatches,
    clubLoading,
    clubError,
    openMeProfile,
    openMyClub,
  } = useHome();

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topArea}>
            <View style={styles.hero}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                {t('home.welcome')}{firstName ? ` ${firstName}` : ''}
              </Text>
            </View>

            <View style={styles.shortcutGrid}>
              <ShortcutCard
                  title={t('tabs.search')}
                  icon="search"
                  iconBg="#dbeafe"
                  iconColor="#2563eb"
                  onPress={() => router.push('/search')}
              />

              <ShortcutCard
                  title={t('tabs.leagues')}
                  icon="trophy"
                  iconBg="#f3e8ff"
                  iconColor="#9333ea"
                  onPress={() => router.push('/leagues')}
              />

              <ShortcutCard
                  title={t('tabs.favorites')}
                  icon="star"
                  iconBg="#fef3c7"
                  iconColor="#d97706"
                  onPress={() => router.push('/favorites')}
              />
            </View>
          </View>

          <MeQuickStatsCard
              meNuid={meNuid}
              displayName={displayName}
              clubName={clubName}
              currentTtr={currentTtr}
              qTtr={qTtr}
              maxTtr={maxTtr}
              recentEvents={recentEvents}
              loading={meLoading}
              error={meError}
              onOpenProfile={openMeProfile}
              onOpenSettings={() => router.push('/settings')}
          />

          <ClubQuickStatsCard
              meNuid={meNuid}
              clubName={meClub?.title ?? meClub?.clubName ?? clubName}
              hasSavedClub={Boolean(meClub)}
              matches={clubCompletedMatches}
              loading={clubLoading}
              error={clubError}
              onOpenClub={openMyClub}
              onOpenSearch={() => router.push('/search')}
          />
        </ScrollView>
      </Screen>
  );
}
