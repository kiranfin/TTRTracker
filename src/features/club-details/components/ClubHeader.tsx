import { Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { styles } from '../styles';

type ClubHeaderProps = {
    title: string;
    subtitle: string;
};

export function ClubHeader({ title, subtitle }: ClubHeaderProps) {
    const { colors } = useTheme();
    const { t } = useI18n();

    return (
        <View style={styles.clubHead}>
            <Avatar icon="home" shape="square" size={64} />

            <View style={styles.clubHeadText}>
                <Text style={[typography.title, { color: colors.text }]} numberOfLines={2}>
                    {title}
                </Text>

                <Text style={[typography.meta, { color: colors.mutedText }]} numberOfLines={1}>
                    {subtitle || t('club.defaultTitle')}
                </Text>
            </View>
        </View>
    );
}
