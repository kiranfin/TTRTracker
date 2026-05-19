import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { REGIONS } from '../../src/data/leagues';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function LeaguesScreen() {
  const { colors } = useTheme();

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>Ligen</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>Wähle ein Bundesland. Die Ligen werden erst danach vom Backend geladen.</Text>
          </View>

          <View style={styles.grid}>
            {REGIONS.map((region) => (
                <Card key={region.id} pressable style={styles.regionCard} onPress={() => router.push(`/region/${region.id}`)}>
                  <View style={[styles.iconBubble, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
                    <Ionicons name="map-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.regionTextBlock}>
                    <Text style={[styles.regionTitle, { color: colors.text }]} numberOfLines={2}>{region.name}</Text>
                    <Text style={[styles.regionSubtitle, { color: colors.mutedText }]}>Ligen öffnen</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
                </Card>
            ))}
          </View>
        </ScrollView>
      </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 20,
  },
  titleBlock: {
    gap: 4,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  grid: {
    gap: 12,
  },
  regionCard: {
    minHeight: 76,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionTextBlock: {
    flex: 1,
    gap: 2,
  },
  regionTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  regionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});