import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable } from 'react-native';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function OpenClubButton({
                            disabled,
                            onPress,
                        }: {
    disabled: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('player.openClubDetails')}
            style={({ pressed }) => [
                styles.headerActionButton,
                noWebOutline,
                {
                    backgroundColor: pressed && !disabled ? colors.primarySoft : 'transparent',
                    borderColor: pressed && !disabled ? colors.primarySoftBorder : colors.border,
                    opacity: disabled ? 0.35 : 1,
                },
            ]}
        >
            <Ionicons
                name="tennisball-outline"
                size={22}
                color={disabled ? colors.mutedText : colors.text}
            />
        </Pressable>
    );
}
