import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function DateFilterButton({
                              label,
                              value,
                              invalid,
                              disabled,
                              onPress,
                          }: {
    label: string;
    value: string;
    invalid: boolean;
    disabled: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();

    return (
        <View style={styles.dateInputBlock}>
            <Text style={[styles.inputLabel, { color: colors.mutedText }]}>{label}</Text>

            <Pressable
                onPress={onPress}
                disabled={disabled}
                style={({ pressed }) => [
                    styles.dateButton,
                    {
                        backgroundColor: colors.card,
                        borderColor: invalid ? colors.destructive : pressed ? colors.primarySoftBorder : colors.border,
                        opacity: disabled ? 0.6 : 1,
                    },
                ]}
            >
                <Text
                    style={[
                        styles.dateButtonText,
                        { color: value ? colors.text : colors.mutedText },
                    ]}
                    numberOfLines={1}
                >
                    {value || t('club.chooseDate')}
                </Text>

                <Ionicons name="calendar-outline" size={17} color={colors.mutedText} />
            </Pressable>
        </View>
    );
}
