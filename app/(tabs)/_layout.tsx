import { Tabs } from 'expo-router';
import { AppTabBar } from '../../src/components/AppTabBar';

export default function TabsLayout() {
    return (
        <Tabs
            backBehavior="history"
            tabBar={() => <AppTabBar />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="search" />
            <Tabs.Screen name="leagues" />
            <Tabs.Screen name="favorites" />
            <Tabs.Screen name="settings" />

            <Tabs.Screen name="player/[nuid]" options={{ href: null }} />
            <Tabs.Screen name="club/[clubKey]" options={{ href: null }} />
            <Tabs.Screen name="league/[leagueKey]" options={{ href: null }} />
            <Tabs.Screen name="region/[region]" options={{ href: null }} />
            <Tabs.Screen name="match/[meetingId]" options={{ href: null }} />
            <Tabs.Screen name="team/[teamId]" options={{ href: null }} />
        </Tabs>
    );
}