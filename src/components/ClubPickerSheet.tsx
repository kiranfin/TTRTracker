import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { ttApi } from '../api/tttracker';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';
import type { NormalizedClub } from '../types/tttracker';
import { normalizeClub } from '../utils/normalizers';
import { BottomSheet } from './BottomSheet';
import { ClubLogo } from './ClubLogo';
import { ListGroup } from './ListGroup';
import { ListRow } from './ListRow';
import { SearchInput } from './SearchInput';
import { SkeletonList } from './SkeletonRow';

type ClubPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (club: NormalizedClub) => void | Promise<void>;
  title: string;
};

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

// Vereinssuche im Bottom Sheet, ohne Einstellungs-Logik. Wird vom Onboarding genutzt.
export function ClubPickerSheet({ visible, onClose, onSelect, title }: ClubPickerSheetProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState<NormalizedClub[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestCounter = useRef(0);

  // Beim Schließen zurücksetzen, damit das Sheet beim nächsten Öffnen leer startet.
  useEffect(() => {
    if (visible) return;

    requestCounter.current += 1;
    setQuery('');
    setClubs([]);
    setLoading(false);
    setError(null);
  }, [visible]);

  useEffect(() => {
    const text = query.trim();
    const requestId = ++requestCounter.current;

    if (text.length < MIN_QUERY_LENGTH) {
      setClubs([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      ttApi
          .searchClubs(text)
          .then((rows) => {
            // Veraltete Antworten verwerfen
            if (requestId !== requestCounter.current) return;

            const seen = new Set<string>();
            const normalized = (Array.isArray(rows) ? rows : [])
                .map((row) => normalizeClub(row))
                .filter((club) => {
                  // Ohne Verband und Vereinsnummer lässt sich der Verein nicht speichern
                  if (!club.organization || !club.clubNumber || seen.has(club.id)) return false;
                  seen.add(club.id);
                  return true;
                });

            setClubs(normalized);
          })
          .catch((searchError) => {
            if (requestId !== requestCounter.current) return;

            setClubs([]);
            setError(searchError instanceof Error ? searchError.message : t('search.failed'));
          })
          .finally(() => {
            if (requestId === requestCounter.current) setLoading(false);
          });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasQuery = query.trim().length >= MIN_QUERY_LENGTH;

  return (
      <BottomSheet visible={visible} title={title} onClose={onClose}>
        <View style={{ gap: 12 }}>
          <SearchInput value={query} onChangeText={setQuery} placeholder={t('settings.clubSearchPlaceholder')} />

          {loading ? <SkeletonList count={3} /> : null}

          {error ? <Text style={[typography.meta, { color: colors.destructive }]}>{error}</Text> : null}

          {!hasQuery && !loading ? (
              <Text style={[typography.meta, { color: colors.mutedText }]}>{t('picker.hint')}</Text>
          ) : null}

          {hasQuery && !loading && !error && clubs.length === 0 ? (
              <Text style={[typography.meta, { color: colors.mutedText }]}>{t('settings.clubSearchNoResults')}</Text>
          ) : null}

          {clubs.length > 0 ? (
              <ListGroup>
                {clubs.map((club) => (
                    <ListRow
                        key={club.id}
                        leading={<ClubLogo organization={club.organization} clubNumber={club.clubNumber} size={40} />}
                        title={club.name}
                        subtitle={[club.state, club.organizationName ?? club.organization].filter(Boolean).join(' · ') || undefined}
                        chevron={false}
                        onPress={() => {
                          Promise.resolve(onSelect(club)).catch(() => undefined);
                        }}
                    />
                ))}
              </ListGroup>
          ) : null}
        </View>
      </BottomSheet>
  );
}
