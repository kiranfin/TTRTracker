import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { Chip, ChipRow } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { useI18n } from '@/src/i18n/I18nProvider';
import { MIN_TOUCH } from '@/src/theme/spacing';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { PlayerDetailsController } from '../hooks/usePlayerDetails';
import { styles } from '../styles';
import { HistoryEventRow } from './HistoryEventRow';

// Verlauf nach Monat gruppiert, Filter über Liga-Chips und eine Suche hinter dem Lupen-Icon.
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
    const locale = language === 'de' ? 'de-DE' : 'en-GB';

    return (
        <View style={styles.historySection}>
            <View style={styles.historyHeader}>
                <View style={styles.historyHeaderText}>
                    <Text style={[typography.section, { color: colors.text }]}>{t('player.history')}</Text>
                    <Text style={[typography.meta, { color: colors.mutedText }]}>
                        {t('player.historyCount', { filtered: filteredEventCount, total: totalEventCount })}
                    </Text>
                </View>

                {filtersActive ? (
                    <Pressable onPress={clearHistoryFilters} hitSlop={8} style={styles.historyIconButton}>
                        <Text style={[typography.meta, { color: colors.primary, fontWeight: '700' }]}>
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
                    <Ionicons name="search-outline" size={22} color={searchOpen ? colors.primary : colors.mutedText} />
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
                <ChipRow>
                    <Chip label={t('player.allLeagues')} active={selectedLeague === null} onPress={() => setSelectedLeague(null)} />

                    {leagueOptions.map((league) => (
                        <Chip
                            key={league}
                            label={league}
                            active={selectedLeague === league}
                            onPress={() => setSelectedLeague(selectedLeague === league ? null : league)}
                        />
                    ))}
                </ChipRow>
            ) : null}

            {totalEventCount === 0 ? (
                <EmptyState icon="time-outline" title={t('player.noHistory')} />
            ) : filteredEventCount === 0 ? (
                <EmptyState icon="search-outline" title={t('player.noSearchResults')} />
            ) : (
                <>
                    {monthGroups.map((group) => (
                        <View key={group.key} style={styles.monthGroup}>
                            <Text style={[typography.label, styles.monthLabel, { color: colors.mutedText }]}>
                                {group.month
                                    ? group.month.toLocaleDateString(locale, { month: 'long', year: 'numeric' }).toUpperCase()
                                    : t('common.dateUnknown').toUpperCase()}
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
                        <Button variant="outline" icon="chevron-down" onPress={loadMoreEvents}>
                            {t('player.moreEvents')}
                        </Button>
                    ) : null}
                </>
            )}
        </View>
    );
}
