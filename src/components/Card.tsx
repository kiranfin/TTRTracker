import { ReactNode } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { AppTheme, useTheme } from '../theme/ThemeProvider';

type Props = {
    title: string;
    subtitle?: string;
    meta?: string;
    children?: ReactNode;
    onPress?: () => void;
};

type CardStyles = {
    card: ViewStyle;
    pressed: ViewStyle;
    topRow: ViewStyle;
    textBlock: ViewStyle;
    title: TextStyle;
    subtitle: TextStyle;
    badge: ViewStyle;
    badgeText: TextStyle;
    content: ViewStyle;
};

export function Card({ title, subtitle, meta, children, onPress }: Props) {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const content = (
        <>
            <View style={styles.topRow}>
                <View style={styles.textBlock}>
                    <Text style={styles.title} numberOfLines={2}>
                        {title}
                    </Text>

                    {subtitle ? (
                        <Text style={styles.subtitle} numberOfLines={2}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                {meta ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{meta}</Text>
                    </View>
                ) : null}
            </View>

            {children ? <View style={styles.content}>{children}</View> : null}
        </>
    );

    if (onPress) {
        return (
            <Pressable
                style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
                onPress={onPress}
            >
                {content}
            </Pressable>
        );
    }

    return <View style={styles.card}>{content}</View>;
}

function createStyles(theme: AppTheme) {
    return StyleSheet.create<CardStyles>({
        card: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xl,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            gap: 12,
            shadowColor: '#000',
            shadowOpacity: theme.isDark ? 0 : 0.05,
            shadowRadius: 16,
            shadowOffset: {
                width: 0,
                height: 8,
            },
            elevation: theme.isDark ? 0 : 2,
        },
        pressed: {
            opacity: 0.78,
            transform: [{ scale: 0.99 }],
        },
        topRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
        },
        textBlock: {
            flex: 1,
            gap: 4,
        },
        title: {
            color: theme.colors.text,
            fontSize: 17,
            fontWeight: '800',
            letterSpacing: -0.2,
        },
        subtitle: {
            color: theme.colors.muted,
            fontSize: 14,
            lineHeight: 20,
        },
        badge: {
            backgroundColor: theme.colors.accentSoft,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 6,
        },
        badgeText: {
            color: theme.colors.accent,
            fontSize: 12,
            fontWeight: '900',
        },
        content: {
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingTop: 12,
        },
    });
}