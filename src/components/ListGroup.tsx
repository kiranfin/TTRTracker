import { Children, type ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type ListGroupProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Karte mit Trennlinien zwischen den Zeilen. Leere Kinder (false/null) werden übersprungen.
export function ListGroup({ children, style }: ListGroupProps) {
  const { colors } = useTheme();
  const rows = Children.toArray(children);

  return (
      <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
        {rows.map((row, index) => (
            <View key={index}>
              {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
              {row}
            </View>
        ))}
      </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});
