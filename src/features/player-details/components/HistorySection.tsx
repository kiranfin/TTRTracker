import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { useI18n } from '@/src/i18n/I18nProvider';
import { MIN_TOUCH } from '@/src/theme/spacing';
import { useTheme } from '@/src/theme/ThemeProvider';
import { font, typography } from '@/src/theme/typography';
import type { PlayerDetailsController } from '../hooks/usePlayerDetails';
import { styles } from '../styles';
import { HistoryEventRow } from './HistoryEventRow';
import { LeagueFilterSheet } from './LeagueFilterSheet';

// Verlauf nach Monat gruppiert, Liga-Filter im Bottom Sheet und eine Suche hinter dem Lupen-Icon.
export function HistorySection({ details }: { details: PlayerDetailsController }) {
    const { colors, } = useTheme();
    const { t, language } = useI18n();

    const {
        leagueOptions,
        selectedLeague,
        setSelectedLeague,
        historySearchQuery,
        setHistorySearchQuery,
        searchOpen,
        setSearchOpen,
        leagueSheetOpen,
        setLeagueSheetOpen,
        totalEventCount,
        filteredEventCount,
        monthGroups,
        hasMoreEvents,
        expandedEventId,
        toggleExpanded,
        loadMoreEvents,
        clearHistoryFilters,
    } = details;

    const filtersActive = selectedLeague !== null || historySearchQuery.trim().length > 0;
    const leagueActive = selectedLeague !== null;
    const leagueTextColor = leagueActive ? colors.card : colors.text;
    const locale = language === 'de' ? 'de-DE' : 'en-GB';

    return (
        <View style={styles.historySection}>
            <View style={styles.historyHeader}>
                <View style={styles.historyHeaderText}>
                    <Text style={[typography.section, { color: colors.text }]}>{t('player.allEntries')}</Text>
                </View>

                {filtersActive ? (
                    <Pressable onPress={clearHistoryFilters} hitSlop={8} style={styles.historyIconButton}>
                        <Text style={[typography.meta, { color: colors.primary, ...font('700') }]}>
                            {t('common.reset')}
                        </Text>
                    </Pressable>
                ) : null}

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('player.searchHistory')}
                    onPress={() => setSearchOpen(!searchOpen)}
                    style={styles.historyIconButton}
                >
                    <Ionicons name="search-outline" size={22} color={searchOpen ? colors.primary : colors.text} />
                </Pressable>
            </View>

            {searchOpen ? (
                <View style={[styles.searchInputWrap, { backgroundColor: colors.input, borderColor: colors.border, minHeight: MIN_TOUCH }]}>
                    <Ionicons name="search-outline" size={16} color={colors.mutedText} />

                    <TextInput
                        value={historySearchQuery}
                        onChangeText={setHistorySearchQuery}
                        placeholder={t('player.searchPlaceholder')}
                        placeholderTextColor={colors.mutedText}
                        style={[styles.searchInput, { color: colors.text }]}
                        autoCorrect={false}
                        autoCapitalize="none"
                        autoFocus
                    />

                    {historySearchQuery.trim().length > 0 ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('common.reset')}
                            onPress={() => setHistorySearchQuery('')}
                            hitSlop={8}
                        >
                            <Ionicons name="close-circle" size={18} color={colors.mutedText} />
                        </Pressable>
                    ) : null}
                </View>
            ) : null}

            {leagueOptions.length > 1 ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('player.filterLeague')}
                    onPress={() => setLeagueSheetOpen(true)}
                    style={({ pressed }) => [
                        styles.leagueFilterButton,
                        {
                            backgroundColor: leagueActive ? colors.text : colors.card,
                            borderColor: leagueActive ? colors.text : colors.border,
                            opacity: pressed ? 0.78 : 1,
                        },
                    ]}
                >
                    <Ionicons name="funnel-outline" size={16} color={leagueTextColor} />

                    <Text style={[typography.metaStrong, styles.leagueFilterLabel, { color: leagueTextColor }]} numberOfLines={1}>
                        {selectedLeague ?? t('player.allLeagues')}
                    </Text>

                    <Ionicons name="chevron-down" size={16} color={leagueTextColor} />
                </Pressable>
            ) : null}

            <LeagueFilterSheet
                visible={leagueSheetOpen}
                onClose={() => setLeagueSheetOpen(false)}
                options={leagueOptions}
                totalCount={totalEventCount}
                selected={selectedLeague}
                onSelect={setSelectedLeague}
            />

            {totalEventCount === 0 ? (
                <EmptyState icon="time-outline" title={t('player.noHistory')} />
            ) : filteredEventCount === 0 ? (
                <EmptyState icon="search-outline" title={t('player.noSearchResults')} />
            ) : (
                <>
                    {monthGroups.map((group) => (
                        <View key={group.key} style={styles.monthGroup}>
                            <Text style={[typography.groupLabel, styles.monthLabel, { color: colors.mutedText }]}>
                                {group.month
                                    ? group.month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
                                    : t('common.dateUnknown')}
                            </Text>

                            <ListGroup>
                                {group.events.map((event) => (
                                    <HistoryEventRow
                                        key={event.id}
                                        event={event}
                                        expanded={expandedEventId === event.id}
                                        onPress={() => toggleExpanded(event.id)}
                                    />
                                ))}
                            </ListGroup>
                        </View>
                    ))}

                    {hasMoreEvents ? (
                        <Button variant="outline" onPress={loadMoreEvents}>
                            {t('player.moreEvents')}
                        </Button>
                    ) : null}
                </>
            )}
        </View>
    );
}
