import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheet } from '@/src/components/BottomSheet';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { SearchInput } from '@/src/components/SearchInput';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { LeagueOption } from '../types';
import { styles } from '../styles';

// Ab dieser Anzahl Ligen bekommt das Sheet ein eigenes Suchfeld.
const SEARCH_THRESHOLD = 8;

type LeagueFilterSheetProps = {
    visible: boolean;
    onClose: () => void;
    options: LeagueOption[];
    totalCount: number;
    selected: string | null;
    onSelect: (league: string | null) => void;
};

// Liga-Auswahl im Bottom Sheet statt einer endlosen Chip-Zeile.
export function LeagueFilterSheet({ visible, onClose, options, totalCount, selected, onSelect }: LeagueFilterSheetProps) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const [query, setQuery] = useState('');

    useEffect(() => {
        if (!visible) setQuery('');
    }, [visible]);

    const visibleOptions = useMemo(() => {
        const text = query.trim().toLocaleLowerCase();

        if (!text) return options;

        return options.filter((option) => option.name.toLocaleLowerCase().includes(text));
    }, [options, query]);

    function select(league: string | null) {
        onSelect(league);
        onClose();
    }

    function renderTrailing(count: number, active: boolean) {
        return (
            <View style={styles.leagueOptionTrailing}>
                <Text style={[typography.meta, styles.leagueOptionCount, { color: colors.mutedText }]}>{count}</Text>
                <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.primary}
                    style={{ opacity: active ? 1 : 0 }}
                />
            </View>
        );
    }

    return (
        <BottomSheet visible={visible} title={t('player.filterLeague')} onClose={onClose}>
            <View style={styles.leagueSheetBody}>
                {options.length > SEARCH_THRESHOLD ? (
                    <SearchInput value={query} onChangeText={setQuery} placeholder={t('player.searchLeague')} />
                ) : null}

                {!query.trim() ? (
                    <ListGroup>
                        <ListRow
                            title={t('player.allLeagues')}
                            chevron={false}
                            trailing={renderTrailing(totalCount, selected === null)}
                            onPress={() => select(null)}
                        />
                    </ListGroup>
                ) : null}

                {visibleOptions.length > 0 ? (
                    <ListGroup>
                        {visibleOptions.map((option) => (
                            <ListRow
                                key={option.name}
                                title={option.name}
                                chevron={false}
                                trailing={renderTrailing(option.count, selected === option.name)}
                                onPress={() => select(option.name)}
                            />
                        ))}
                    </ListGroup>
                ) : (
                    <Text style={[typography.meta, { color: colors.mutedText }]}>{t('player.noSearchResults')}</Text>
                )}
            </View>
        </BottomSheet>
    );
}
