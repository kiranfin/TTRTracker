import { ScrollView, Text } from 'react-native';
import { PlayerPickerSheet } from '@/src/components/PlayerPickerSheet';
import { Screen } from '@/src/components/Screen';
import { HeaderIconButton, ScreenHeader } from '@/src/components/ScreenHeader';
import { StatGrid, StatStrip } from '@/src/components/StatStrip';
import { MyttConnectNotice } from '@/src/features/mytt';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { parseDateValue } from '@/src/utils/dates';
import { HistorySection, PlayerHeader, TtrChartCard } from '../../../src/features/player-details/components';
import { usePlayerDetails } from '../../../src/features/player-details/hooks/usePlayerDetails';
import { styles } from '../../../src/features/player-details/styles';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { DataFreshness } from '@/src/components/DataFreshness';
import {
    formatOptionalNumber,
    formatSignedAverage,
    formatSignedNumber,
    isFiniteNumber,
} from '../../../src/features/player-details/utils';

export default function PlayerDetailsScreen() {
    const { colors } = useTheme();
    const { t, language } = useI18n();
    const details = usePlayerDetails();

    const {
        displayName,
        clubName,
        history,
        historyIsEstimated,
        estimatePending,
        loading,
        error,
        currentTtr,
        ttrSource,
        freshness,
        unavailableReason,
        qTtr,
        maxTtr,
        monthlyDelta,
        stats,
        hasMePlayer,
        isMeProfile,
        canClaimProfile,
        mePlayerLoading,
        isFavoritePlayer,
        effectiveClubKey,
        clubOrganization,
        clubNumber,
        comparePickerOpen,
        setComparePickerOpen,
        chartRange,
        setChartRange,
        chartEvents,
        toggleMeProfile,
        toggleFavoritePlayer,
        openCompare,
        compareWith,
        openClubDetails,
    } = details;

    const positive = (value?: number) => (isFiniteNumber(value) && value > 0 ? colors.positive : undefined);
    const negative = (value?: number) => (isFiniteNumber(value) && value < 0 ? colors.negative : undefined);

    const peakDate = parseDateValue(history?.maxTtrDate);
    const peakHelper = peakDate
        ? peakDate.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB', { month: 'short', year: 'numeric' }).replace('.', '')
        : undefined;
    const lost = stats.ratedMatchCount - stats.matchesWon;

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <ScreenHeader
                    right={
                        <>
                            <HeaderIconButton
                                icon="swap-horizontal"
                                accessibilityLabel={hasMePlayer && !isMeProfile ? t('player.compareWithMe') : t('player.compareAction')}
                                onPress={openCompare}
                            />
                            <HeaderIconButton
                                icon={isFavoritePlayer ? 'star' : 'star-outline'}
                                color={isFavoritePlayer ? colors.warning : colors.text}
                                accessibilityLabel={isFavoritePlayer ? t('favorites.removeFavorite') : t('player.addFavorite')}
                                onPress={() => { toggleFavoritePlayer().catch(() => undefined); }}
                            />
                        </>
                    }
                />

                <PlayerHeader
                    name={displayName}
                    clubName={clubName}
                    clubOrganization={clubOrganization}
                    clubNumber={clubNumber}
                    ttr={currentTtr}
                    ttrDate={history?.ttrDate}
                    ttrSource={ttrSource}
                    monthlyDelta={monthlyDelta}
                    loading={loading}
                    claimLoading={mePlayerLoading}
                    onOpenClub={effectiveClubKey ? openClubDetails : undefined}
                    onClaimProfile={canClaimProfile ? () => { toggleMeProfile().catch(() => undefined); } : undefined}
                />

                {!loading ? <DataFreshness freshness={freshness} /> : null}

                {loading ? <SkeletonList count={3} /> : null}
                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {!loading && unavailableReason ? (
                    <MyttConnectNotice
                        reason={unavailableReason}
                        message={unavailableReason === 'expired' ? t('player.officialExpired') : t('player.officialUnavailable')}
                    />
                ) : null}

                {!loading && !error && (!unavailableReason || historyIsEstimated) ? (
                    <>
                        {historyIsEstimated ? (
                            <Text style={[typography.meta, { color: colors.mutedText }]}>{estimatePending ? `${t('player.estimatedHistory')} ${t('player.estimatedHistoryPending')}` : t('player.estimatedHistory')}</Text>
                        ) : null}

                        <StatStrip
                            items={[
                                { label: t('home.qTtr'), value: formatOptionalNumber(qTtr) },
                                { label: t('home.bestValue'), value: formatOptionalNumber(maxTtr), helper: peakHelper },
                                {
                                    label: t('player.record'),
                                    value: stats.ratedMatchCount > 0 ? `${stats.matchesWon}:${lost}` : '–',
                                    helper: isFiniteNumber(stats.winRate)
                                        ? t('player.winsPercent', { value: Math.round(stats.winRate) })
                                        : undefined,
                                },
                            ]}
                        />

                        <TtrChartCard range={chartRange} onRangeChange={setChartRange} events={chartEvents} />

                        <StatGrid
                            items={[
                                {
                                    label: t('player.averagePerEntry'),
                                    value: formatSignedAverage(stats.averageDelta),
                                    color: positive(stats.averageDelta) ?? negative(stats.averageDelta),
                                },
                                { label: t('player.gamesPlayed'), value: String(stats.matchCount) },
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
