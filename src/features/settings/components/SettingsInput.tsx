import { TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function SettingsInput(props: TextInputProps) {
  const { colors } = useTheme();

  return (
      <TextInput
          placeholderTextColor={colors.mutedText}
          autoCorrect={false}
          {...props}
          style={[styles.input, { color: colors.text, borderColor: colors.border }, props.style]}
      />
  );
}
