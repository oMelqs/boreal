import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, type DimensionValue } from 'react-native';

import { useTheme } from '@/presentation/theme/useTheme';

/** Bloco pulsante para o primeiro load (sem lib de skeleton). */
export function Skeleton({
  height,
  width = '100%',
}: {
  height: number;
  width?: DimensionValue;
}) {
  const { colors, radius } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        { backgroundColor: colors.surface, borderRadius: radius.md, height, opacity, width },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
  },
});
