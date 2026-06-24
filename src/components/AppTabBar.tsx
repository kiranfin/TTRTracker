import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TranslationKey } from '../i18n';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';

const items = [
  { labelKey: 'tabs.home', href: '/', icon: 'home-outline', activeIcon: 'home', match: (path: string) => path === '/' },
  { labelKey: 'tabs.search', href: '/search', icon: 'search-outline', activeIcon: 'search', match: (path: string) => path.startsWith('/search') || path.startsWith('/player') || path.startsWith('/club') },
  { labelKey: 'tabs.leagues', href: '/leagues', icon: 'podium-outline', activeIcon: 'podium', match: (path: string) => path.startsWith('/leagues') || path.startsWith('/region') || path.startsWith('/league') || path.startsWith('/match') },
  { labelKey: 'tabs.favorites', href: '/favorites', icon: 'star-outline', activeIcon: 'star', match: (path: string) => path.startsWith('/favorites') },
  { labelKey: 'tabs.settings', href: '/settings', icon: 'settings-outline', activeIcon: 'settings', match: (path: string) => path.startsWith('/settings') },
] as const;

export function AppTabBar() {
  const pathname = usePathname();
  const { colors } = useTheme();
  const { t } = useI18n();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  return (
      <SafeAreaView edges={['bottom']} pointerEvents="box-none" style={styles.safe}>
        <View style={[styles.shell, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}>
          {items.map((item) => {
            const active = item.match(pathname);
            const color = active ? colors.primary : colors.mutedText;

            return (
                <Pressable
                    key={item.href}
                    onPress={() => router.push(item.href)}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.item,
                      noWebOutline,
                      active && { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder },
                      pressed && styles.pressed,
                    ]}
                >
                  <Ionicons
                      name={(active ? item.activeIcon : item.icon) as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={color}
                  />
                  <Text style={[styles.label, { color }]} numberOfLines={1}>
                    {t(item.labelKey as TranslationKey)}
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
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  shell: {
    maxWidth: 672,
    width: '100%',
    minHeight: 68,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 8,
  },
  item: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
