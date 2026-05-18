import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

type Props = {
    title: string;
    subtitle?: string;
    children: ReactNode;
};

export function Screen({ title, subtitle, children }: Props) {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.eyebrow}>Tischtennis Tracker</Text>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>

            {children}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 64,
        gap: 16,
        backgroundColor: colors.background,
        minHeight: '100%',
    },
    header: {
        gap: 6,
        marginBottom: 4,
    },
    eyebrow: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    title: {
        color: colors.text,
        fontSize: 30,
        fontWeight: '800',
    },
    subtitle: {
        color: colors.muted,
        fontSize: 16,
        lineHeight: 22,
    },
});