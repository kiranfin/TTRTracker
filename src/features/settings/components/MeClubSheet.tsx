import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ttApi } from '@/src/api/tttracker';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Button } from '@/src/components/Button';
import { ClubLogo } from '@/src/components/ClubLogo';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { SearchInput } from '@/src/components/SearchInput';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { useTheme } from '@/src/theme/ThemeProvider';
import { font, typography } from '@/src/theme/typography';
import type { NormalizedClub } from '@/src/types/tttracker';
import { normalizeClub } from '@/src/utils/normalizers';
import type { SettingsController } from '../hooks/useSettings';
import { styles } from '../styles';
import { formatClubId, getClubDisplayName } from '../utils';
import { MessageText } from './MessageText';
import { SettingsInput } from './SettingsInput';
import { describeApiError } from '@/src/utils/apiErrors';

type SheetProps = {
  settings: SettingsController;
  visible: boolean;
  onClose: () => void;
};

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

export function MeClubSheet({ settings, visible, onClose }: SheetProps) {
  const { colors } = useTheme();
  const {
    t,
    clubIdInput,
    setClubIdInput,
    clubNameInput,
    setClubNameInput,
    savedMeClub,
    meClubMessage,
    meClubLoading,
    handleSaveMeClub,
    handleSelectMeClub,
    handleClearMeClub,
    openSavedMeClub,
  } = settings;

  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState<NormalizedClub[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const requestCounter = useRef(0);

  // Beim Schließen zurücksetzen, damit das Sheet beim nächsten Öffnen leer startet.
  useEffect(() => {
    if (visible) return;

    requestCounter.current += 1;
    setQuery('');
    setClubs([]);
    setLoading(false);
    setError(null);
    setManualOpen(false);
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
            setError(describeApiError(searchError, t, 'search.failed'));
          })
          .finally(() => {
            if (requestId === requestCounter.current) setLoading(false);
          });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function select(club: NormalizedClub) {
    try {
      await handleSelectMeClub(club);
      onClose();
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : t('settings.clubSaveError'));
    }
  }

  const hasQuery = query.trim().length >= MIN_QUERY_LENGTH;
  const savedId = formatClubId(savedMeClub);

  return (
      <BottomSheet visible={visible} title={t('settings.myClub')} onClose={onClose}>
        <View style={styles.sheetBody}>
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
                        trailing={
                          club.id === savedId ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : undefined
                        }
                        onPress={() => {
                          select(club).catch(() => undefined);
                        }}
                    />
                ))}
              </ListGroup>
          ) : null}

          {savedMeClub ? (
              <View style={[styles.savedBox, { borderColor: colors.border }]}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.positive} />

                <View style={styles.savedBoxText}>
                  <Text style={[styles.savedBoxTitle, { color: colors.text }]}>{t('settings.clubSavedTitle')}</Text>
                  <Text style={[styles.savedBoxMeta, { color: colors.mutedText }]} numberOfLines={1}>
                    {getClubDisplayName(savedMeClub) || t('settings.clubSavedTitle')} · {formatClubId(savedMeClub)}
                  </Text>
                </View>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('settings.openClub')}
                    onPress={() => {
                      onClose();
                      openSavedMeClub();
                    }}
                    hitSlop={12}
                >
                  <Ionicons name="open-outline" size={20} color={colors.text} />
                </Pressable>
              </View>
          ) : null}

          <Pressable
              accessibilityRole="button"
              onPress={() => setManualOpen((current) => !current)}
              hitSlop={8}
              style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}
          >
            <Text style={[typography.meta, { color: colors.primary, ...font('700') }]}>
              {t('settings.clubManualToggle')}
            </Text>
          </Pressable>

          {manualOpen ? (
              <>
                <SettingsInput
                    value={clubIdInput}
                    onChangeText={setClubIdInput}
                    placeholder={t('settings.clubIdPlaceholder')}
                    autoCapitalize="characters"
                />

                <SettingsInput
                    value={clubNameInput}
                    onChangeText={setClubNameInput}
                    placeholder={t('settings.clubNamePlaceholder')}
                    autoCapitalize="words"
                />

                <Button
                    variant="primary"
                    icon="save-outline"
                    loading={meClubLoading === 'save'}
                    onPress={handleSaveMeClub}
                    style={styles.halfButton}
                >
                  {t('common.save')}
                </Button>
              </>
          ) : null}

          {savedMeClub ? (
              <Button
                  variant="outline"
                  icon="trash-outline"
                  loading={meClubLoading === 'clear'}
                  onPress={handleClearMeClub}
              >
                {t('common.remove')}
              </Button>
          ) : null}

          <MessageText message={meClubMessage} />
        </View>
      </BottomSheet>
  );
}
