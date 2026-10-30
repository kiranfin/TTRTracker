import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ttApi } from '../api/tttracker';
import { useI18n } from '../i18n/I18nProvider';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { font, typography } from '../theme/typography';
import type { NormalizedPlayer } from '../types/tttracker';
import { normalizePlayer } from '../utils/normalizers';
import { Avatar } from './Avatar';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { ListGroup } from './ListGroup';
import { ListRow } from './ListRow';
import { SearchInput } from './SearchInput';
import { SkeletonList } from './SkeletonRow';
import { describeApiError } from '@/src/utils/apiErrors';

export type PlayerSelection = {
  nuid: string;
  name?: string;
  clubName?: string;
};

type PlayerPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (selection: PlayerSelection) => void | Promise<void>;
  title?: string;
  // Optionaler Button unten, z. B. um das gespeicherte Profil zu entfernen
  clearLabel?: string;
  onClear?: () => void | Promise<void>;
};

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

// Spielersuche im Bottom Sheet. Wird für "Das bin ich", den Vergleich und die Einstellungen genutzt.
export function PlayerPickerSheet({ visible, onClose, onSelect, title, clearLabel, onClear }: PlayerPickerSheetProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<NormalizedPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualNuid, setManualNuid] = useState('');
  const requestCounter = useRef(0);

  // Beim Schließen alles zurücksetzen, damit das Sheet beim nächsten Öffnen leer startet.
  useEffect(() => {
    if (visible) return;

    requestCounter.current += 1;
    setQuery('');
    setPlayers([]);
    setLoading(false);
    setError(null);
    setManualOpen(false);
    setManualNuid('');
  }, [visible]);

  useEffect(() => {
    const text = query.trim();
    const requestId = ++requestCounter.current;

    if (text.length < MIN_QUERY_LENGTH) {
      setPlayers([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      ttApi
          .searchPlayers(text)
          .then((rows) => {
            // Veraltete Antworten verwerfen
            if (requestId !== requestCounter.current) return;

            const seen = new Set<string>();
            const normalized = (Array.isArray(rows) ? rows : [])
                .map((row) => normalizePlayer(row))
                .filter((player) => {
                  if (!player.internalId || seen.has(player.id)) return false;
                  seen.add(player.id);
                  return true;
                });

            setPlayers(normalized);
          })
          .catch((searchError) => {
            if (requestId !== requestCounter.current) return;

            setPlayers([]);
            setError(describeApiError(searchError, t, 'search.failed'));
          })
          .finally(() => {
            if (requestId === requestCounter.current) setLoading(false);
          });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function select(selection: PlayerSelection) {
    try {
      await onSelect(selection);
      onClose();
    } catch (selectError) {
      setError(describeApiError(selectError, t, 'search.failed'));
    }
  }

  function confirmManual() {
    const nuid = manualNuid.trim();

    if (!nuid) {
      setError(t('picker.invalidNuid'));
      return;
    }

    select({ nuid }).catch(() => undefined);
  }

  const hasQuery = query.trim().length >= MIN_QUERY_LENGTH;

  return (
      <BottomSheet visible={visible} title={title ?? t('picker.title')} onClose={onClose}>
        <View style={styles.body}>
          <SearchInput value={query} onChangeText={setQuery} placeholder={t('picker.searchPlaceholder')} />

          {loading ? (
              <View style={styles.center}>
                <SkeletonList count={3} />
              </View>
          ) : null}

          {error ? <Text style={[typography.meta, { color: colors.destructive }]}>{error}</Text> : null}

          {!hasQuery && !loading ? (
              <Text style={[typography.meta, { color: colors.mutedText }]}>{t('picker.hint')}</Text>
          ) : null}

          {hasQuery && !loading && !error && players.length === 0 ? (
              <Text style={[typography.meta, { color: colors.mutedText }]}>{t('picker.noResults')}</Text>
          ) : null}

          {players.length > 0 ? (
              <ListGroup>
                {players.map((player) => (
                    <ListRow
                        key={player.id}
                        leading={<Avatar name={player.fullName} size={40} />}
                        title={player.fullName}
                        subtitle={player.clubName || undefined}
                        trailing={
                          typeof player.ttr === 'number' ? (
                              <Text style={[typography.bodyStrong, { color: colors.text }]}>{player.ttr}</Text>
                          ) : undefined
                        }
                        onPress={() =>
                            select({
                              nuid: player.internalId!,
                              name: player.fullName,
                              clubName: player.clubName,
                            }).catch(() => undefined)
                        }
                    />
                ))}
              </ListGroup>
          ) : null}

          <Pressable
              accessibilityRole="button"
              onPress={() => setManualOpen((current) => !current)}
              hitSlop={8}
              style={styles.manualToggle}
          >
            <Text style={[typography.meta, { color: colors.primary, ...font('700') }]}>
              {t('picker.manualToggle')}
            </Text>
          </Pressable>

          {manualOpen ? (
              <View style={styles.manualRow}>
                <TextInput
                    value={manualNuid}
                    onChangeText={setManualNuid}
                    placeholder={t('picker.manualPlaceholder')}
                    placeholderTextColor={colors.mutedText}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.manualInput,
                      { color: colors.text, backgroundColor: colors.input, borderColor: colors.border },
                    ]}
                />

                <Button variant="secondary" onPress={confirmManual}>
                  {t('picker.manualConfirm')}
                </Button>
              </View>
          ) : null}
          {onClear && clearLabel ? (
              <Button
                  variant="outline"
                  icon="close-circle-outline"
                  onPress={() => {
                    Promise.resolve(onClear()).then(onClose).catch(() => undefined);
                  }}
              >
                {clearLabel}
              </Button>
          ) : null}
        </View>
      </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  center: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  manualToggle: {
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  manualInput: { ...font('400'),
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
});
