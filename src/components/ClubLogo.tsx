import { Image } from 'expo-image';
import { isValidElement, useState, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubLogo } from '../hooks/useClubLogo';
import { useTheme } from '../theme/ThemeProvider';
import { Avatar } from './Avatar';

type ClubLogoProps = {
  organization?: string;
  clubNumber?: string;
  // Schon bekannte URL (Vereinsinfos), spart den Abruf
  uri?: string;
  size?: number;
  // icon: Gebäude-Icon wie bisher (Listen, Kopf), blank: leere Kachel, damit Tabellenzeilen bündig bleiben,
  // none: gar nichts (Logo neben einem Textlink), oder ein eigenes Element (Kürzel-Kachel im Spielbericht)
  fallback?: 'icon' | 'blank' | 'none' | ReactElement;
};

// Vereinslogo von click-tt auf weißer Kachel (die Logos sind meist JPGs mit weißem Rand).
// Ohne Logo oder bei Ladefehler der Fallback.
export function ClubLogo({ organization, clubNumber, uri, size = 40, fallback = 'icon' }: ClubLogoProps) {
  const { colors } = useTheme();
  const url = useClubLogo(organization, clubNumber, uri);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const borderRadius = Math.round(size * 0.3);

  if (!url || failedUrl === url) {
    if (fallback === 'none') return null;
    if (isValidElement(fallback)) return fallback;

    return fallback === 'blank' ? (
        <View style={{ width: size, height: size, borderRadius, backgroundColor: colors.soft }} />
    ) : (
        <Avatar icon="business-outline" shape="square" size={size} tone="accent" />
    );
  }

  return (
      <View
          style={[
            styles.tile,
            {
              width: size,
              height: size,
              borderRadius,
              padding: Math.max(2, Math.round(size * 0.09)),
              borderColor: colors.border,
            },
          ]}
      >
        <Image
            source={{ uri: url }}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={150}
            accessibilityIgnoresInvertColors
            onError={() => setFailedUrl(url)}
        />
      </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
});
