import { Text, View } from 'react-native';
import { SegmentedTabs, type SegmentOption } from '@/src/components/SegmentedTabs';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { styles } from '../styles';

type SettingSegmentProps<T extends string> = {
  title: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
};

// Zeile mit Titel und SegmentedTabs für Einstellungen mit wenigen festen Optionen (Sprache, Design).
export function SettingSegment<T extends string>({ title, value, onChange, options }: SettingSegmentProps<T>) {
  const { colors } = useTheme();

  return (
      <View style={styles.segmentRow}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{title}</Text>
        <SegmentedTabs value={value} onChange={onChange} options={options} />
      </View>
  );
}
