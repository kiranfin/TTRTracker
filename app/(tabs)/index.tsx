import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ListGroup } from '@/src/components/ListGroup';
import { PlayerPickerSheet } from '@/src/components/PlayerPickerSheet';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { ClubCard, FindYourselfCard, HomeHeader, MeHeroCard, RecentHistoryRow } from '../../src/features/home/components';
import { useHome } from '../../src/features/home/hooks/useHome';
import { styles } from '../../src/features/home/styles';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [pickerOpen, setPickerOpen] = useState(false);

  const {
    meNuid,
    displayName,
    firstName,
    clubName,
    currentTtr,
    qTtr,
    maxTtr,
    recentEvents,
    ttrSeries,
    ttrDelta30,
    winRate,
    meLoading,
    meError,
    meClub,
    clubCompletedMatches,
    clubUpcomingMatches,
    clubLoading,
    clubError,
    selectMePlayer,
    reloadMe,
    openMeProfile,
    openMyClub,
  } = useHome();

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <HomeHeader firstName={firstName} displayName={displayName} hasProfile={Boolean(meNuid)} />

          {meNuid ? (
              <>
                <MeHeroCard
                    currentTtr={currentTtr}
                    qTtr={qTtr}
                    maxTtr={maxTtr}
                    winRate={winRate}
                    delta30={ttrDelta30}
                    series={ttrSeries}
                    loading={meLoading}
                    error={meError}
                    onOpenProfile={openMeProfile}
                    onRetry={reloadMe}
                />

                {!meLoading && !meError ? (
                    <View style={styles.section}>
                      <SectionHeader
                          title={t('home.recentMatches')}
                          actionLabel={t('common.viewAll')}
                          onActionPress={openMeProfile}
                      />

                      {recentEvents.length > 0 ? (
                          <ListGroup>
                            {recentEvents.map((event) => (
                                <RecentHistoryRow key={event.id} event={event} onOpenProfile={openMeProfile} />
                            ))}
                          </ListGroup>
                      ) : (
                          <Text style={[typography.body, { color: colors.mutedText }]}>
                            {t('home.noHistoryEntries')}
                          </Text>
                      )}
                    </View>
                ) : null}

                <ClubCard
                    clubName={meClub?.title ?? meClub?.clubName ?? clubName}
                    organization={meClub?.organization}
                    clubNumber={meClub?.clubNumber}
                    hasSavedClub={Boolean(meClub)}
                    upcoming={clubUpcomingMatches}
                    results={clubCompletedMatches}
                    loading={clubLoading}
                    error={clubError}
                    onOpenClub={openMyClub}
                    onOpenSearch={() => router.push('/search')}
                />
              </>
          ) : (
              <FindYourselfCard onPress={() => setPickerOpen(true)} />
          )}
        </ScrollView>

        <PlayerPickerSheet
            visible={pickerOpen}
            title={t('picker.meTitle')}
            onClose={() => setPickerOpen(false)}
            onSelect={(selection) => selectMePlayer(selection.nuid)}
        />
      </Screen>
  );
}
