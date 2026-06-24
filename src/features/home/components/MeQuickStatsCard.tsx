import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { MeQuickStatsCardProps } from '../types';
import { formatOptionalNumber } from '../utils';
import { styles } from '../styles';
import { MiniStat } from './MiniStat';
import { RecentHistoryRow } from './RecentHistoryRow';

export function MeQuickStatsCard({
                            meNuid,
                            displayName,
                            clubName,
                            currentTtr,
                            qTtr,
                            maxTtr,
                            recentEvents,
                            loading,
                            error,
                            onOpenProfile,
                            onOpenSettings,
                          }: MeQuickStatsCardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (!meNuid) {
    return (
        <Card style={styles.emptyMeCard}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="person-add-outline" size={24} color={colors.primary} />
          </View>

          <View style={styles.emptyTextBlock}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('home.missingProfileTitle')}
            </Text>

            <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
              {t('home.missingProfileSubtitle')}
            </Text>
          </View>

          <Button variant="primary" icon="settings-outline" onPress={onOpenSettings}>
            {t('home.setNuid')}
          </Button>
        </Card>
    );
  }

  return (
      <Card style={styles.meCard}>
        <View style={styles.meHeader}>
          <View style={styles.meHeaderText}>
            <Text style={[styles.meTitle, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>

            <Text style={[styles.meSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {clubName ?? t('entities.clubUnknown')}
            </Text>
          </View>

          <Pressable
              onPress={onOpenProfile}
              hitSlop={10}
              style={({ pressed }) => [
                styles.profileButton,
                {
                  backgroundColor: pressed ? colors.primarySoft : colors.muted,
                  borderColor: pressed ? colors.primarySoftBorder : colors.border,
                },
              ]}
          >
            <Ionicons name="open-outline" size={19} color={colors.text} />
          </Pressable>
        </View>

        {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />

              <Text style={[styles.homeBody, { color: colors.mutedText }]}>
                {t('home.loadingMyData')}
              </Text>
            </View>
        ) : error ? (
            <>
              <Text style={[styles.homeBody, { color: colors.destructive }]}>
                {error}
              </Text>

              <Button variant="outline" icon="settings-outline" onPress={onOpenSettings}>
                {t('home.checkNuid')}
              </Button>
            </>
        ) : (
            <>
              <View style={styles.ttrOverview}>
                <View
                    style={[
                      styles.primaryTtrTile,
                      {
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primarySoftBorder,
                      },
                    ]}
                >
                  <Text style={[styles.primaryTtrLabel, { color: colors.primary }]}>
                    {t('home.currentTtr')}
                  </Text>

                  <Text style={[styles.primaryTtrValue, { color: colors.text }]}>
                    {formatOptionalNumber(currentTtr)}
                  </Text>
                </View>

                <View style={styles.secondaryStats}>
                  <MiniStat label="Q-TTR" value={formatOptionalNumber(qTtr)} />
                  <MiniStat label="Peak" value={formatOptionalNumber(maxTtr)} />
                </View>
              </View>

              <View style={styles.historyHeader}>
                <Text style={[styles.historyTitle, { color: colors.text }]}>
                  {t('home.lastEntries')}
                </Text>

                <Pressable onPress={onOpenProfile} hitSlop={8}>
                  <Text style={[styles.historyLink, { color: colors.primary }]}>
                    {t('common.viewAll')}
                  </Text>
                </Pressable>
              </View>

              {recentEvents.length > 0 ? (
                  <View style={styles.recentList}>
                    {recentEvents.map((event) => (
                        <RecentHistoryRow key={event.id} event={event} />
                    ))}
                  </View>
              ) : (
                  <Text style={[styles.homeBody, { color: colors.mutedText }]}>
                    {t('home.noHistoryEntries')}
                  </Text>
              )}
            </>
        )}
      </Card>
  );
}
