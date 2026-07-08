const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'coverage/*', '.expo/*'],
  },
  {
    // Camada de domínio: TypeScript puro, sem dependências de UI, rede ou storage.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react/*',
                'react-dom',
                'react-native',
                'react-native/*',
                'react-native-*',
                'expo',
                'expo-*',
                '@expo/*',
                '@tanstack/*',
                'zustand',
                'zustand/*',
                '@react-native-async-storage/*',
                '@testing-library/*',
              ],
              message: 'domain/ não pode depender de React, React Native, Expo ou libs externas.',
            },
            {
              group: ['@/data/*', '@/presentation/*', '@/di/*', '**/data/**', '**/presentation/**', '**/di/**'],
              message: 'domain/ não pode importar das camadas externas (data, presentation, di).',
            },
          ],
        },
      ],
    },
  },
]);
