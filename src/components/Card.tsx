import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

type Props = {
    title: string;
    subtitle?: string;
    meta?: string;
    children?: ReactNode;
    onPress?: () => void;
};

export function Card({ title, subtitle, meta, children, onPress }: Props) {
    const Wrapper = onPress ? Pressable : View;

    return (
        <Wrapper style={({ pressed }: any) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
            <View style={styles.topRow}>
                <View style={styles.textBlock}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                {meta ? <Text style={styles.meta}>{meta}</Text> : null}
            </View>

            {children ? <View style={styles.content}>{children}</View> : null}
        </Wrapper>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
    },
    pressed: {
        opacity: 0.75,
        transform: [{ scale: 0.99 }],
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    textBlock: {
        flex: 1,
        gap: 4,
    },
    title: {
        color: colors.text,
        fontSize: 17,
        fontWeight: '800',
    },
    subtitle: {
        color: colors.muted,
        fontSize: 14,
        lineHeight: 20,
    },
    meta: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '800',
    },
    content: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 12,
    },
});