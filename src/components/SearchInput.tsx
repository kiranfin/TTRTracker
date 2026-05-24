import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type SearchInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  onSubmitEditing?: () => void;
};

export function SearchInput({ value, onChangeText, placeholder, onSubmitEditing }: SearchInputProps) {
  const { colors } = useTheme();

  return (
      <View style={[styles.wrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.mutedText} />

        <TextInput
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmitEditing}
            returnKeyType="search"
            placeholder={placeholder}
            placeholderTextColor={colors.mutedText}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: colors.text }]}
        />

        {value.length > 0 ? (
            <Pressable hitSlop={8} onPress={() => onChangeText('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={19} color={colors.mutedText} />
            </Pressable>
        ) : null}
      </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 9,
  },
  clearButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});