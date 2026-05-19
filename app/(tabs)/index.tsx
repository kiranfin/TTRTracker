import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme/ThemeProvider';

const featureRows = [
  'TTR-Werte und Spielerstatistiken',
  'Aktuelle Ligatabellen und Spielpläne',
  'Detaillierte Begegnungsergebnisse',
  'Favoriten für schnellen Zugriff',
];

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Willkommen</Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedText }]}>Schneller Zugriff auf deine Tischtennis-Daten aus myTischtennis</Text>
        </View>

        <View style={styles.stack}>
          <HomeCard
            title="Suche"
            subtitle="Finde Spieler und Vereine"
            text="Suche nach Spielern und Vereinen, sehe TTR-Werte und Mannschaften"
            icon="search"
            iconBg="#dbeafe"
            iconColor="#2563eb"
            onPress={() => router.push('/search')}
          />
          <HomeCard
            title="Ligatabellen"
            subtitle="Alle Ligen und Tabellen"
            text="Sehe Tabellenstände, Spielpläne und Ergebnisse"
            icon="trophy"
            iconBg="#f3e8ff"
            iconColor="#9333ea"
            onPress={() => router.push('/leagues')}
          />
          <HomeCard
            title="Favoriten"
            subtitle="Schnellzugriff"
            text="Speichere deine wichtigsten Spieler, Vereine und Ligen"
            icon="star"
            iconBg="#fef3c7"
            iconColor="#d97706"
            onPress={() => router.push('/favorites')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

type HomeCardProps = {
  title: string;
  subtitle: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
};

function HomeCard({ title, subtitle, text, icon, iconBg, iconColor, onPress }: HomeCardProps) {
  const { colors } = useTheme();

  return (
    <Card pressable onPress={onPress} style={styles.homeCard}>
      <View style={styles.homeHeader}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={25} color={iconColor} />
        </View>
        <View style={styles.homeTextBlock}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.mutedText }]}>{subtitle}</Text>
        </View>
      </View>
      <Text style={[styles.homeBody, { color: colors.mutedText }]}>{text}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 340,
  },
  stack: {
    gap: 16,
  },
  homeCard: {
    padding: 18,
    gap: 16,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeTextBlock: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  homeBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  featureCard: {
    padding: 18,
    gap: 16,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
