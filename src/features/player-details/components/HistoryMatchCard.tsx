import { Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { NormalizedTtrHistoryMatch } from '@/src/types/tttracker';
import { styles } from '../styles';

export function HistoryMatchCard({ match }: { match: NormalizedTtrHistoryMatch }) {
    const { colors } = useTheme();
    const { t } = useI18n();

    const result =
        match.ownSets !== undefined && match.otherSets !== undefined
            ? `${match.ownSets}:${match.otherSets}`
            : '-';

    return (
        <View style={[styles.matchDetailCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={styles.matchDetailTopRow}>
                <View style={styles.matchPlayers}>
                    <Text style={[styles.matchPlayerName, { color: colors.text }]} numberOfLines={1}>
                        {match.ownPlayerName ?? t('player.ownPlayer')}
                    </Text>
                    <Text style={[styles.matchOpponentName, { color: colors.mutedText }]} numberOfLines={1}>
                        {t('player.againstOpponent', { opponent: match.otherPlayerName ?? t('player.unknownOpponent') })}
                        {match.otherTtr !== undefined ? ` · TTR ${match.otherTtr}` : ''}
                    </Text>
                </View>

                <View style={[styles.matchResultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.matchResultText, { color: colors.text }]}>{result}</Text>
                </View>
            </View>

            {match.setResults.length > 0 ? (
                <View style={styles.eventBottomRow}>
                    {match.setResults.map((setResult, index) => (
                        <Badge key={`${match.id}-set-${index}`} tone="outline">
                            {t('player.setResult', { number: index + 1, result: setResult })}
                        </Badge>
                    ))}
                </View>
            ) : null}

            <View style={styles.eventBottomRow}>
                {match.ownPoints !== undefined || match.otherPoints !== undefined ? (
                    <Badge tone="secondary">
                        {t('player.pointsResult', { own: match.ownPoints ?? 0, other: match.otherPoints ?? 0 })}
                    </Badge>
                ) : null}

                {match.expectedResult ? (
                    <Badge tone="outline">{t('player.expectedResult', { result: match.expectedResult })}</Badge>
                ) : null}
            </View>
        </View>
    );
}
