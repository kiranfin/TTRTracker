import { Pressable, Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { Card } from '@/src/components/Card';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { TeamLinkContext } from '../types';
import { styles } from '../styles';

type TeamSideProps = {
  name: string;
  won: boolean;
  link: TeamLinkContext | null;
  onOpenTeam: (link: TeamLinkContext) => void;
};

function TeamSide({ name, won, link, onOpenTeam }: TeamSideProps) {
  const { colors } = useTheme();

  const content = (
      <Text
          style={[
            typography.bodyStrong,
            styles.heroTeam,
            { color: link ? colors.primary : colors.text, fontWeight: won ? '900' : '600' },
          ]}
          numberOfLines={3}
      >
        {name}
      </Text>
  );

  if (!link) return <View style={styles.heroTeamWrap}>{content}</View>;

  return (
      <Pressable
          accessibilityRole="link"
          accessibilityLabel={name}
          onPress={() => onOpenTeam(link)}
          hitSlop={8}
          style={styles.heroTeamWrap}
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
  onOpenTeam: (link: TeamLinkContext) => void;
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
                            onOpenTeam,
                            summary,
                          }: MatchHeroProps) {
  const { colors } = useTheme();

  return (
      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <TeamSide name={homeTeam} won={homeWon} link={homeLink} onOpenTeam={onOpenTeam} />

          <View style={styles.heroScore}>
            <Text style={[numeric.hero, { color: colors.text }]}>{score}</Text>
            <Text style={[typography.label, { color: colors.mutedText }]}>{status}</Text>
          </View>

          <TeamSide name={awayTeam} won={awayWon} link={awayLink} onOpenTeam={onOpenTeam} />
        </View>

        {summary.length > 0 ? (
            <View style={styles.heroPills}>
              {summary.map((part) => (
                  <Badge key={part} tone="outline">
                    {part}
                  </Badge>
              ))}
            </View>
        ) : null}
      </Card>
  );
}
