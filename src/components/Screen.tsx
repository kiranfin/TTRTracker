import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Props = {
    title: string;
    subtitle?: string;
    children: ReactNode;
};

export function Screen({ title, subtitle, children }: Props) {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <ScrollView
            style={styles.root}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>

            <View style={styles.content}>{children}</View>
        </ScrollView>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
    return StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        container: {
            padding: 18,
            paddingTop: 64,
            paddingBottom: 120,
            minHeight: '100%',
        },
        header: {
            marginBottom: 18,
            gap: 6,
        },
        title: {
            color: theme.colors.text,
            fontSize: 32,
            fontWeight: '900',
            letterSpacing: -0.8,
        },
        subtitle: {
            color: theme.colors.muted,
            fontSize: 15,
            lineHeight: 21,
        },
        content: {
            gap: 12,
        },
    });
}