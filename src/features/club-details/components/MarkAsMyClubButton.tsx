import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Platform, Pressable } from 'react-native';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function MarkAsMyClubButton({
                                active,
                                loading,
                                onPress,
                            }: {
    active: boolean;
    loading: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

    return (
        <Pressable
            onPress={onPress}
            disabled={loading}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={active ? t('club.removeMyClub') : t('club.markMyClub')}
            style={({ pressed }) => [
                styles.headerActionButton,
                noWebOutline,
                {
                    backgroundColor:
                        active || pressed ? colors.primarySoft : 'transparent',
                    borderColor:
                        active || pressed ? colors.primarySoftBorder : colors.border,
                    opacity: loading ? 0.65 : 1,
                },
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <Ionicons
                    name={active ? 'home' : 'home-outline'}
                    size={21}
                    color={active ? colors.primary : colors.text}
                />
            )}
        </Pressable>
    );
}
