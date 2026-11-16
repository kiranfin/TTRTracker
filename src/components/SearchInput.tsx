import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useI18n } from '../i18n/I18nProvider';
import { MIN_TOUCH } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { font } from '../theme/typography';

type SearchInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
};

// Großes Suchfeld; beim Tippen bekommt es einen Rahmen in Akzentfarbe.
export function SearchInput({ value, onChangeText, placeholder, onSubmitEditing, autoFocus }: SearchInputProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);

  return (
      <View
          style={[
            styles.wrap,
            {
              backgroundColor: colors.card,
              borderColor: focused ? colors.primary : colors.border,
              borderWidth: focused ? 2 : 1,
              paddingHorizontal: focused ? 15 : 16,
            },
          ]}
      >
        <Ionicons name="search-outline" size={20} color={colors.mutedText} />

        <TextInput
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmitEditing}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus={autoFocus}
            returnKeyType="search"
            placeholder={placeholder}
            placeholderTextColor={colors.mutedText}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: colors.text }]}
        />

        {value.length > 0 ? (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.reset')}
                onPress={() => onChangeText('')}
                style={styles.clearButton}
            >
              <Ionicons name="close" size={20} color={colors.mutedText} />
            </Pressable>
        ) : null}
      </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    ...font('500'),
    paddingVertical: 0,
  },
  clearButton: {
    width: MIN_TOUCH - 4,
    height: MIN_TOUCH - 4,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
