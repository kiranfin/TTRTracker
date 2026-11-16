import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
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

type TabItemProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
};

function TabItem({ label, icon, activeIcon, active, onPress }: TabItemProps) {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, { damping: 16, stiffness: 220, mass: 0.7 });
  }, [active, progress]);

  // Die Pille wächst beim Aktivieren von der Mitte aus auf und blendet ein.
  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: 0.55 + 0.45 * progress.value }, { scaleY: 0.75 + 0.25 * progress.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.08 * progress.value }],
  }));

  return (
      <Pressable
          accessibilityRole="tab"
          accessibilityLabel={label}
          accessibilityState={{ selected: active }}
          onPress={onPress}
          style={({ pressed }) => [styles.item, noWebOutline, pressed && styles.pressed]}
      >
        <View style={styles.iconWrap}>
          <Animated.View
              pointerEvents="none"
              style={[
                styles.pill,
                { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder },
                pillStyle,
              ]}
          />
          <Animated.View style={iconStyle}>
            <Ionicons
                name={active ? activeIcon : icon}
                size={21}
                color={active ? colors.primary : colors.mutedText}
            />
          </Animated.View>
        </View>

        <Text style={[styles.label, { color: active ? colors.text : colors.mutedText }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
  );
}

export function AppTabBar() {
  const pathname = usePathname();
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <SafeAreaView
          edges={['bottom']}
          pointerEvents="box-none"
          style={[
            styles.safe,
            { backgroundColor: colors.card, borderTopColor: colors.border, shadowColor: colors.shadow },
          ]}
      >
        <View style={styles.row}>
          {items.map((item) => (
              <TabItem
                  key={item.href}
                  label={t(item.labelKey as TranslationKey)}
                  icon={item.icon as keyof typeof Ionicons.glyphMap}
                  activeIcon={item.activeIcon as keyof typeof Ionicons.glyphMap}
                  active={item.match(pathname)}
                  onPress={() => router.push(item.href)}
              />
          ))}
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 12,
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
  iconWrap: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
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
