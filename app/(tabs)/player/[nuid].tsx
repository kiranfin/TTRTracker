import { ScrollView, Text, View } from 'react-native';
import { ActionButton } from '@/src/components/ActionButton';
import { PlayerPickerSheet } from '@/src/components/PlayerPickerSheet';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { StarButton } from '@/src/components/StarButton';
import { StatGrid, StatStrip } from '@/src/components/StatStrip';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { HistorySection, PlayerHeader, TtrChartCard } from '../../../src/features/player-details/components';
import { usePlayerDetails } from '../../../src/features/player-details/hooks/usePlayerDetails';
import { styles } from '../../../src/features/player-details/styles';
import { SkeletonList } from '@/src/components/SkeletonRow';
import {
    formatOptionalNumber,
    formatSignedAverage,
    formatSignedNumber,
    isFiniteNumber,
} from '../../../src/features/player-details/utils';

export default function PlayerDetailsScreen() {
    const { colors } = useTheme();
    const { t } = useI18n();
    const details = usePlayerDetails();

    const {
        displayName,
        clubName,
        history,
        loading,
        error,
        currentTtr,
        qTtr,
        maxTtr,
        monthlyDelta,
        stats,
        isMeProfile,
        mePlayerLoading,
        isFavoritePlayer,
        effectiveClubKey,
        comparePickerOpen,
        setComparePickerOpen,
        chartRange,
        setChartRange,
        chartEvents,
        chartTopEvent,
        toggleMeProfile,
        toggleFavoritePlayer,
        openCompare,
        compareWith,
        openClubDetails,
    } = details;

    const positive = (value?: number) => (isFiniteNumber(value) && value > 0 ? colors.positive : undefined);
    const negative = (value?: number) => (isFiniteNumber(value) && value < 0 ? colors.negative : undefined);

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <ScreenHeader
                    right={<StarButton active={isFavoritePlayer} onPress={() => { toggleFavoritePlayer().catch(() => undefined); }} />}
                />

                <PlayerHeader
                    name={displayName}
                    clubName={clubName}
                    ttr={currentTtr}
                    ttrDate={history?.ttrDate}
                    monthlyDelta={monthlyDelta}
                    loading={loading}
                    onOpenClub={effectiveClubKey ? openClubDetails : undefined}
                />

                <View style={styles.actionRow}>
                    <ActionButton icon="git-compare-outline" label={t('player.compareAction')} variant="primary" onPress={openCompare} />

                    <ActionButton
                        icon="business-outline"
                        label={t('entities.club')}
                        disabled={!effectiveClubKey}
                        onPress={openClubDetails}
                    />

                    <ActionButton
                        icon={isMeProfile ? 'checkmark-circle' : 'person-circle-outline'}
                        label={t('player.meAction')}
                        loading={mePlayerLoading}
                        onPress={() => { toggleMeProfile().catch(() => undefined); }}
                    />
                </View>

                {loading ? <SkeletonList count={3} /> : null}
                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {!loading && !error ? (
                    <>
                        <StatStrip
                            items={[
                                { label: t('home.qTtr'), value: formatOptionalNumber(qTtr) },
                                { label: t('player.peak'), value: formatOptionalNumber(maxTtr) },
                                {
                                    label: t('player.record'),
                                    value: stats.ratedMatchCount > 0 ? `${stats.matchesWon}:${stats.ratedMatchCount - stats.matchesWon}` : '—',
                                },
                            ]}
                        />

                        <TtrChartCard
                            range={chartRange}
                            onRangeChange={setChartRange}
                            events={chartEvents}
                            topEvent={chartTopEvent}
                        />

                        <StatGrid
                            items={[
                                {
                                    label: t('player.averageChange'),
                                    value: formatSignedAverage(stats.averageDelta),
                                    color: positive(stats.averageDelta) ?? negative(stats.averageDelta),
                                },
                                { label: t('player.games'), value: String(stats.matchCount) },
                                {
                                    label: t('player.bestJump'),
                                    value: formatSignedNumber(stats.bestGain),
                                    color: positive(stats.bestGain),
                                },
                                {
                                    label: t('player.biggestLoss'),
                                    value: formatSignedNumber(stats.worstLoss),
                                    color: negative(stats.worstLoss),
                                },
                            ]}
                        />

                        <HistorySection details={details} />
                    </>
                ) : null}
            </ScrollView>

            <PlayerPickerSheet
                visible={comparePickerOpen}
                title={t('player.compareAction')}
                onClose={() => setComparePickerOpen(false)}
                onSelect={(selection) => compareWith(selection.nuid, selection.name)}
            />
        </Screen>
    );
}
