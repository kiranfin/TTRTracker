import { Tabs } from 'expo-router';
import { Home, Search, Star, Table2, Settings } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function TabLayout() {
    const { theme } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.accent,
                tabBarInactiveTintColor: theme.colors.muted,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.border,
                    height: 84,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '800',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Start',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />

            <Tabs.Screen
                name="search"
                options={{
                    title: 'Suche',
                    tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
                }}
            />

            <Tabs.Screen
                name="leagues"
                options={{
                    title: 'Ligen',
                    tabBarIcon: ({ color, size }) => <Table2 color={color} size={size} />,
                }}
            />

            <Tabs.Screen
                name="favorites"
                options={{
                    title: 'Favoriten',
                    tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
                }}
            />

            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Setup',
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}