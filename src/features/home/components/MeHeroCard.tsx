import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { DeltaPill } from '@/src/components/Delta';
import { Sparkline } from '@/src/components/Sparkline';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import { formatOptionalNumber } from '../utils';
import { styles } from '../styles';

const LINE_COLOR = 'rgba(255,255,255,0.28)';

type MeHeroCardProps = {
  displayName: string;
  clubName?: string | null;
  currentTtr?: number;
  qTtr?: number;
  maxTtr?: number;
  winRate?: number;
  delta30?: number;
  series: number[];
  loading: boolean;
  error: string | null;
  onOpenProfile: () => void;
  onRetry: () => void;
};

// Hero-Karte in Akzentfarbe: TTR groß, Änderung der letzten 30 Tage, Sparkline und Kennzahlen.
export function MeHeroCard({
                             displayName,
                             clubName,
                             currentTtr,
                             qTtr,
                             maxTtr,
                             winRate,
                             delta30,
                             series,
                             loading,
                             error,
                             onOpenProfile,
                             onRetry,
                           }: MeHeroCardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const foreground = colors.primaryForeground;
  const subtle = { color: foreground, opacity: 0.74 };

  const stats = [
    { label: t('home.qTtr'), value: formatOptionalNumber(qTtr) },
    { label: t('home.bestValue'), value: formatOptionalNumber(maxTtr) },
    { label: t('home.winRate'), value: typeof winRate === 'number' ? `${winRate}%` : '—' },
  ];

  return (
      <Pressable
          accessibilityRole="button"
          accessibilityLabel={displayName}
          onPress={onOpenProfile}
          style={({ pressed }) => [styles.heroCard, { backgroundColor: colors.primary, opacity: pressed ? 0.92 : 1 }]}
      >
        <View>
          <Text style={[typography.bodyStrong, { color: foreground }]} numberOfLines={1}>
            {displayName}
          </Text>

          {clubName ? (
              <Text style={[typography.meta, subtle]} numberOfLines={1}>
                {clubName}
              </Text>
          ) : null}
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
                <View>
                  <Text style={[typography.label, subtle]}>{t('home.currentTtr')}</Text>
                  <Text style={[numeric.hero, { color: foreground }]}>{formatOptionalNumber(currentTtr)}</Text>
                </View>

                {typeof delta30 === 'number' ? (
                    <View style={styles.heroDeltaBlock}>
                      <DeltaPill value={delta30} onPrimary />
                      <Text style={[typography.label, subtle]}>{t('home.last30Days')}</Text>
                    </View>
                ) : null}
              </View>

              <Sparkline values={series} color={foreground} />

              <View style={[styles.heroStats, { borderTopColor: LINE_COLOR }]}>
                {stats.map((stat, index) => (
                    <View key={stat.label} style={styles.heroStatCell}>
                      {index > 0 ? <View style={[styles.heroStatDivider, { backgroundColor: LINE_COLOR }]} /> : null}

                      <View style={styles.heroStat}>
                        <Text style={[numeric.medium, { color: foreground }]}>{stat.value}</Text>
                        <Text style={[typography.label, subtle]}>{stat.label}</Text>
                      </View>
                    </View>
                ))}
              </View>
            </>
        )}
      </Pressable>
  );
}
