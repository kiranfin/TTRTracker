import { Text } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

// Die Hook-Meldungen sind reine Strings, die Farbe leiten wir deshalb aus Textbausteinen ab.
const POSITIVE_HINTS = [
  'gespeichert',
  'entfernt',
  'erstellt',
  'Eingeloggt',
  'Registriert',
  'ausgeloggt',
  'Standard',
  'Keine Änderung',
  'saved',
  'removed',
  'created',
  'Logged',
  'Registered',
  'restored',
  'No changes',
];

export function MessageText({ message, tone }: { message: string | null; tone?: 'positive' | 'negative' }) {
  const { colors } = useTheme();

  if (!message) return null;

  const positive = tone ? tone === 'positive' : POSITIVE_HINTS.some((hint) => message.includes(hint));

  return (
      <Text style={[styles.backendText, { color: positive ? colors.positive : colors.destructive }]}>
        {message}
      </Text>
  );
}
