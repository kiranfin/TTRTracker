import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TranslationKey } from '../i18n';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import { font } from '../theme/typography';

// Einstellungen sind kein Tab mehr (Zugang über den Avatar auf der Startseite), gehören aber zum Start-Tab.
const items = [
  { labelKey: 'tabs.home', href: '/', icon: 'home-outline', activeIcon: 'home', match: (path: string) => path === '/' || path.startsWith('/settings') },
  { labelKey: 'tabs.search', href: '/search', icon: 'search-outline', activeIcon: 'search', match: (path: string) => path.startsWith('/search') || path.startsWith('/player') || path.startsWith('/club') },
  { labelKey: 'tabs.leagues', href: '/leagues', icon: 'trophy-outline', activeIcon: 'trophy', match: (path: string) => path.startsWith('/leagues') || path.startsWith('/region') || path.startsWith('/league') || path.startsWith('/match') || path.startsWith('/team') },
  { labelKey: 'tabs.favorites', href: '/favorites', icon: 'star-outline', activeIcon: 'star', match: (path: string) => path.startsWith('/favorites') },
] as const;

export function AppTabBar() {
  const pathname = usePathname();
  const { colors } = useTheme();
  const { t } = useI18n();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  return (
      <SafeAreaView
          edges={['bottom']}
          pointerEvents="box-none"
          style={[styles.safe, { backgroundColor: colors.card, borderTopColor: colors.border }]}
      >
        <View style={styles.row}>
          {items.map((item) => {
            const active = item.match(pathname);
            const label = t(item.labelKey as TranslationKey);

            return (
                <Pressable
                    key={item.href}
                    accessibilityRole="tab"
                    accessibilityLabel={label}
                    accessibilityState={{ selected: active }}
                    onPress={() => router.push(item.href)}
                    style={({ pressed }) => [styles.item, noWebOutline, pressed && styles.pressed]}
                >
                  <View style={[styles.pill, active && { backgroundColor: colors.primarySoft }]}>
                    <Ionicons
                        name={(active ? item.activeIcon : item.icon) as keyof typeof Ionicons.glyphMap}
                        size={21}
                        color={active ? colors.primary : colors.mutedText}
                    />
                  </View>

                  <Text style={[styles.label, { color: active ? colors.text : colors.mutedText }]} numberOfLines={1}>
                    {label}
                  </Text>
                </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
  },
  row: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pill: {
    width: 56,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    ...font('600'),
  },
  pressed: {
    opacity: 0.72,
  },
});
