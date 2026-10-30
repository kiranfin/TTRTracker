import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { ClubPickerSheet } from '@/src/components/ClubPickerSheet';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { PlayerPickerSheet } from '@/src/components/PlayerPickerSheet';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useOnboarding } from '@/src/features/onboarding/useOnboarding';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';

export default function OnboardingScreen() {
    const { colors } = useTheme();
    const { t } = useI18n();
    const onboarding = useOnboarding();

    return (
        <Screen>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 48, gap: 20 }}>
                <ScreenHeader hideBack title={t('onboarding.title')} />

                <View style={{ gap: 6 }}>
                    <Text style={[typography.section, { color: colors.text }]}>{t('onboarding.question')}</Text>
                    <Text style={[typography.body, { color: colors.mutedText }]}>{t('onboarding.subtitle')}</Text>
                </View>

                <ListGroup>
                    <ListRow
                        leading={<Ionicons name="person-outline" size={22} color={colors.primary} />}
                        title={t('onboarding.player')}
                        subtitle={onboarding.hasPlayer ? (onboarding.playerName ?? t('onboarding.selected')) : t('onboarding.notSet')}
                        onPress={() => onboarding.setPlayerPickerOpen(true)}
                    />
                    <ListRow
                        leading={<Ionicons name="business-outline" size={22} color={colors.primary} />}
                        title={t('onboarding.club')}
                        subtitle={onboarding.clubName ?? t('onboarding.notSet')}
                        onPress={() => onboarding.setClubPickerOpen(true)}
                    />
                </ListGroup>

                <Text style={[typography.caption, { color: colors.mutedText }]}>{t('onboarding.mytt')}</Text>

                <View style={{ gap: 8 }}>
                    <Button
                        variant="primary"
                        icon="arrow-forward-outline"
                        onPress={() => {
                            onboarding.finish().catch(() => undefined);
                        }}
                    >
                        {onboarding.hasPlayer || onboarding.clubName ? t('onboarding.start') : t('onboarding.skip')}
                    </Button>
                </View>
            </ScrollView>

            <PlayerPickerSheet
                visible={onboarding.playerPickerOpen}
                title={t('picker.meTitle')}
                onClose={() => onboarding.setPlayerPickerOpen(false)}
                onSelect={(selection) => onboarding.selectPlayer(selection.nuid, selection.name)}
            />

            <ClubPickerSheet
                visible={onboarding.clubPickerOpen}
                title={t('settings.myClub')}
                onClose={() => onboarding.setClubPickerOpen(false)}
                onSelect={onboarding.selectClub}
            />
        </Screen>
    );
}
