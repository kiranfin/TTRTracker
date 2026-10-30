import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { DeltaPill } from '@/src/components/Delta';
import { Sparkline } from '@/src/components/Sparkline';
import { DataFreshness } from '@/src/components/DataFreshness';
import type { Freshness } from '@/src/utils/staleness';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import { formatOptionalNumber } from '../utils';
import { styles } from '../styles';

const LINE_COLOR = 'rgba(255,255,255,0.22)';

type MeHeroCardProps = {
  currentTtr?: number;
  qTtr?: number;
  maxTtr?: number;
  winRate?: number;
  delta30?: number;
  series: number[];
  loading: boolean;
  error: string | null;
  freshness?: Freshness | null;
  onOpenProfile: () => void;
  onRetry: () => void;
};

// Hero-Karte in Akzentfarbe: TTR groß, Änderung der letzten 30 Tage, Verlaufslinie und drei Kennzahlen.
export function MeHeroCard({
                             currentTtr,
                             qTtr,
                             maxTtr,
                             winRate,
                             delta30,
                             series,
                             loading,
                             error,
                             freshness = null,
                             onOpenProfile,
                             onRetry,
                           }: MeHeroCardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const foreground = colors.primaryForeground;
  const subtle = { color: foreground, opacity: 0.86 };

  const stats = [
    { label: t('home.qTtr'), value: formatOptionalNumber(qTtr) },
    { label: t('home.bestValue'), value: formatOptionalNumber(maxTtr) },
    { label: t('home.winRate'), value: typeof winRate === 'number' ? `${winRate} %` : '–' },
  ];

  return (
      <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.yourTtr')}
          onPress={onOpenProfile}
          style={({ pressed }) => [styles.heroCard, { backgroundColor: colors.primary, opacity: pressed ? 0.92 : 1 }]}
      >
        <View style={styles.heroHeader}>
          <Text style={[typography.bodyStrong, styles.heroHeaderLabel, subtle]}>{t('home.yourTtr')}</Text>
          <View style={styles.heroProfileLink}>
            <Text style={[typography.metaStrong, subtle]}>{t('home.profileLink')}</Text>
            <Ionicons name="chevron-forward" size={15} color={foreground} />
          </View>
        </View>

        {loading ? (
            <View style={styles.heroLoading}>
              <ActivityIndicator color={foreground} />
              <Text style={[typography.body, subtle]}>{t('home.loadingMyData')}</Text>
            </View>
        ) : error ? (
            <View style={styles.heroError}>
              <Text style={[typography.body, { color: foreground }]}>{error}</Text>
              <Button variant="outline" icon="refresh-outline" onPress={onRetry}>
                {t('common.retry')}
              </Button>
            </View>
        ) : (
            <>
              <View style={styles.heroTopRow}>
                <Text style={[numeric.display, { color: foreground }]}>{formatOptionalNumber(currentTtr)}</Text>
                {typeof delta30 === 'number' ? (
                    <View style={styles.heroDelta}>
                      <DeltaPill value={delta30} suffix={t('home.in30Days')} onPrimary />
                    </View>
                ) : null}
              </View>

              <Sparkline values={series} color={foreground} endDot />

              <View style={[styles.heroStats, { borderTopColor: LINE_COLOR }]}>
                {stats.map((stat) => (
                    <View key={stat.label} style={styles.heroStat}>
                      <Text style={[typography.label, subtle]}>{stat.label}</Text>
                      <Text style={[numeric.medium, { color: foreground }]}>{stat.value}</Text>
                    </View>
                ))}
              </View>

              <DataFreshness freshness={freshness} onPrimary />
            </>
        )}
      </Pressable>
  );
}
