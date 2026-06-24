import { Pressable, Text } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function ChartRangeButton({
                              label,
                              selected,
                              onPress,
                          }: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.rangeButton,
                {
                    backgroundColor: selected ? colors.primary : 'transparent',
                },
            ]}
        >
            <Text
                style={[
                    styles.rangeButtonText,
                    {
                        color: selected ? colors.card : colors.mutedText,
                    },
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}
