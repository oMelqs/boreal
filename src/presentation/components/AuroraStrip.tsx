import { StyleSheet, View } from 'react-native';

import { auroraColors, radius } from '@/presentation/theme/tokens';

/**
 * Assinatura visual do Boreal: faixa fina com as cores da aurora
 * (verde → ciano → violeta). Puramente decorativa para leitores de tela.
 */
export function AuroraStrip({ width = 88 }: { width?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.strip, { width }]}
    >
      <View style={[styles.segment, { flex: 5, backgroundColor: auroraColors[0] }]} />
      <View style={[styles.segment, { flex: 3, backgroundColor: auroraColors[1] }]} />
      <View style={[styles.segment, { flex: 2, backgroundColor: auroraColors[2] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    borderRadius: radius.pill,
  },
  strip: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 3,
    height: 4,
    overflow: 'hidden',
  },
});
