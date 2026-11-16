import { Pressable, Text, View } from 'react-native';
import { getInitials } from '@/src/components/Avatar';
import { Card } from '@/src/components/Card';
import { ClubLogo } from '@/src/components/ClubLogo';
import { useTheme } from '@/src/theme/ThemeProvider';
import { font, typography } from '@/src/theme/typography';
import type { MeetingClub, TeamLinkContext } from '../types';
import { styles } from '../styles';

type TeamSideProps = {
  name: string;
  won: boolean;
  home: boolean;
  club?: MeetingClub;
  link: TeamLinkContext | null;
  onOpenTeam: (link: TeamLinkContext) => void;
};

// Mannschaft mit Vereinslogo, ohne Logo mit Kürzel-Kachel (Heim akzentfarben, Gast neutral).
// Verlinkt, wenn Liga-Kontext da ist.
function TeamSide({ name, won, home, club, link, onOpenTeam }: TeamSideProps) {
  const { colors } = useTheme();

  const initialsBadge = (
      <View style={[styles.heroBadge, { backgroundColor: home ? colors.primarySoft : colors.soft }]}>
        <Text style={[typography.bodyStrong, styles.heroBadgeText, { color: home ? colors.primary : colors.text }]}>
          {getInitials(name)}
        </Text>
      </View>
  );

  const content = (
      <>
        <ClubLogo
            organization={club?.organization}
            clubNumber={club?.clubNumber}
            uri={club?.logoUrl}
            size={48}
            fallback={initialsBadge}
        />
        <Text
            style={[typography.meta, styles.heroTeam, { color: colors.text, ...font(won ? '700' : '500') }]}
            numberOfLines={3}
        >
          {name}
        </Text>
      </>
  );

  if (!link) return <View style={styles.heroTeamWrap}>{content}</View>;

  return (
      <Pressable
          accessibilityRole="link"
          accessibilityLabel={name}
          onPress={() => onOpenTeam(link)}
          hitSlop={8}
          style={({ pressed }) => [styles.heroTeamWrap, { opacity: pressed ? 0.7 : 1 }]}
      >
        {content}
      </Pressable>
  );
}

type MatchHeroProps = {
  homeTeam: string;
  awayTeam: string;
  score: string;
  status: string;
  homeWon: boolean;
  awayWon: boolean;
  homeLink: TeamLinkContext | null;
  awayLink: TeamLinkContext | null;
  homeClub?: MeetingClub;
  awayClub?: MeetingClub;
  onOpenTeam: (link: TeamLinkContext) => void;
  // Datum, Uhrzeit und Liga in einer Zeile über den Mannschaften
  meta?: string;
  // Sätze und Bälle als kurze Pills unter dem Ergebnis
  summary: string[];
};

export function MatchHero({
                            homeTeam,
                            awayTeam,
                            score,
                            status,
                            homeWon,
                            awayWon,
                            homeLink,
                            awayLink,
                            homeClub,
                            awayClub,
                            onOpenTeam,
                            meta,
                            summary,
                          }: MatchHeroProps) {
  const { colors } = useTheme();

  return (
      <Card style={styles.heroCard}>
        {meta ? (
            <Text style={[typography.meta, styles.heroMeta, { color: colors.mutedText }]} numberOfLines={2}>
              {meta}
            </Text>
        ) : null}

        <View style={styles.heroRow}>
          <TeamSide name={homeTeam} won={homeWon} home club={homeClub} link={homeLink} onOpenTeam={onOpenTeam} />

          <View style={styles.heroScore}>
            <Text style={[styles.heroScoreText, { color: colors.text }]}>{score}</Text>
            <View style={[styles.statusPill, { backgroundColor: colors.soft }]}>
              <Text style={[typography.caption, styles.statusText, { color: colors.mutedText }]}>{status}</Text>
            </View>
          </View>

          <TeamSide name={awayTeam} won={awayWon} home={false} club={awayClub} link={awayLink} onOpenTeam={onOpenTeam} />
        </View>

        {summary.length > 0 ? (
            <View style={styles.heroPills}>
              {summary.map((part) => (
                  <View key={part} style={[styles.summaryPill, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <Text style={[typography.metaStrong, { color: colors.text }]}>{part}</Text>
                  </View>
              ))}
            </View>
        ) : null}
      </Card>
  );
}
