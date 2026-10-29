import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

// Vereinslogo von click-tt auf weißer Kachel (die Logos sind meist JPGs mit weißem Rand).
// Ohne Logo oder bei Ladefehler das bisherige Gebäude-Icon.
export function ClubLogo({ uri, size = 64 }: { uri?: string; size?: number }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return <Avatar icon="business-outline" shape="square" size={size} tone="accent" />;
  }

  return (
      <View
          style={[
            styles.logoTile,
            { width: size, height: size, borderRadius: Math.round(size * 0.3), borderColor: colors.border },
          ]}
      >
        <Image
            source={{ uri }}
            style={styles.logoImage}
            contentFit="contain"
            transition={150}
            accessibilityIgnoresInvertColors
            onError={() => setFailed(true)}
        />
      </View>
  );
}
