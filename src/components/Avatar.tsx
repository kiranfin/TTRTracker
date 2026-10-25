import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type AvatarProps = {
  name?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  shape?: 'round' | 'square';
  tone?: 'soft' | 'primary';
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

export function Avatar({ name, icon, size = 44, shape = 'round', tone = 'soft' }: AvatarProps) {
  const { colors } = useTheme();

  const backgroundColor = tone === 'primary' ? colors.primary : colors.primarySoft;
  const foreground = tone === 'primary' ? colors.primaryForeground : colors.primary;
  const initials = getInitials(name);

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
        {icon || !initials ? (
            <Ionicons name={icon ?? 'person'} size={Math.round(size * 0.46)} color={foreground} />
        ) : (
            <Text style={[styles.initials, { color: foreground, fontSize: Math.round(size * 0.38) }]}>
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
    fontWeight: '800',
  },
});
