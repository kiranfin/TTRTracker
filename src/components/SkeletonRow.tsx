import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { ListGroup } from './ListGroup';

// Pulsierende Platzhalterzeile für Ladezustände in Listen.
export function SkeletonRow({ avatar = true }: { avatar?: boolean }) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  return (
      <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.row, { opacity: pulse }]}>
        {avatar ? <View style={[styles.avatar, { backgroundColor: colors.soft }]} /> : null}

        <View style={styles.lines}>
          <View style={[styles.line, styles.lineLong, { backgroundColor: colors.soft }]} />
          <View style={[styles.line, styles.lineShort, { backgroundColor: colors.soft }]} />
        </View>
      </Animated.View>
  );
}

export function SkeletonList({ count = 4, avatar = true }: { count?: number; avatar?: boolean }) {
  return (
      <ListGroup>
        {Array.from({ length: count }, (_, index) => (
            <SkeletonRow key={index} avatar={avatar} />
        ))}
      </ListGroup>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  lines: {
    flex: 1,
    gap: 8,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
  lineLong: {
    width: '70%',
  },
  lineShort: {
    width: '40%',
  },
});
