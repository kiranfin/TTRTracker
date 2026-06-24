import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable } from 'react-native';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { TeamContext } from '../types';
import { styles } from '../styles';

export function LeagueDetailsButton({ team }: { team: TeamContext }) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};
    const canOpenLeague = Boolean(team.association && team.groupId);

    function openLeagueDetails() {
        if (!canOpenLeague) return;

        router.push({
            pathname: '/league/[leagueKey]',
            params: {
                leagueKey: team.groupId!,
                association: team.association!,
                groupId: team.groupId!,
                season: team.season,
                leagueSlug: team.leagueSlug,
                title: team.leagueTitle ?? t('team.leagueDetailsTitle'),
            },
        });
    }

    return (
        <Pressable
            onPress={openLeagueDetails}
            disabled={!canOpenLeague}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('team.openLeagueDetails')}
            style={({ pressed }) => [
                styles.headerActionButton,
                noWebOutline,
                {
                    backgroundColor:
                        pressed && canOpenLeague ? colors.primarySoft : 'transparent',
                    borderColor:
                        pressed && canOpenLeague ? colors.primarySoftBorder : colors.border,
                    opacity: canOpenLeague ? 1 : 0.4,
                },
            ]}
        >
            <Ionicons
                name="podium-outline"
                size={22}
                color={canOpenLeague ? colors.text : colors.mutedText}
            />
        </Pressable>
    );
}
