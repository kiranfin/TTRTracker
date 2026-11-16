import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { font } from '../theme/typography';

type AvatarProps = {
  name?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  shape?: 'round' | 'square';
  // neutral: grau (Personen in Listen), accent: Akzent getönt (Vereine, eigenes Profil), primary: voll
  tone?: 'neutral' | 'accent' | 'primary';
};

export function getInitials(name?: string | null) {
  const parts = String(name ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Avatar({ name, icon, size = 44, shape = 'round', tone }: AvatarProps) {
  const { colors } = useTheme();
  const initials = getInitials(name);
  const showIcon = Boolean(icon) || !initials;
  const resolvedTone = tone ?? (showIcon ? 'accent' : 'neutral');

  const backgroundColor =
      resolvedTone === 'primary' ? colors.primary : resolvedTone === 'accent' ? colors.primarySoft : colors.soft;
  const foreground =
      resolvedTone === 'primary' ? colors.primaryForeground : resolvedTone === 'accent' ? colors.primary : colors.text;

  return (
      <View
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: shape === 'round' ? size / 2 : Math.round(size * 0.3),
              backgroundColor,
            },
          ]}
      >
        {showIcon ? (
            <Ionicons name={icon ?? 'person-outline'} size={Math.round(size * 0.48)} color={foreground} />
        ) : (
            <Text style={[styles.initials, { color: foreground, fontSize: Math.round(size * 0.35) }]}>
              {initials}
            </Text>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...font('700'),
  },
});
