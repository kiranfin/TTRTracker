import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useI18n } from '../i18n/I18nProvider';
import { MIN_TOUCH } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';

type StarButtonProps = {
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

// Stern zum Merken, 44 pt Touch-Ziel. Der Press-Handler liegt in Listenzeilen bewusst nicht im Zeilen-Press.
export function StarButton({ active, onPress, accessibilityLabel }: StarButtonProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? t('tabs.favorites')}
          accessibilityState={{ selected: active }}
          onPress={onPress}
          style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons
            name={active ? 'star' : 'star-outline'}
            size={22}
            color={active ? colors.warning : colors.mutedText}
        />
      </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
