import { StyleSheet, Text, View } from 'react-native';

import { strings } from '@/presentation/i18n/strings';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {strings.home.title}
      </Text>
      <Text style={styles.subtitle}>{strings.home.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    padding: 24,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
});
