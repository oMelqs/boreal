const { withProjectBuildGradle } = require('expo/config-plugins');

/**
 * Alinha a versão do androidx.work no Android.
 *
 * Os dois pacotes de widget colidem: o `expo-widgets` traz o Glance, que
 * depende de `work-runtime-ktx:2.7.1`, e o `react-native-android-widget` usa
 * `work-runtime:2.8.1`. As mesmas classes aparecem duas vezes e o build falha
 * em `checkDebugDuplicateClasses`.
 *
 * Forçar a linha 2.8.1 (a mais nova das duas) resolve sem tocar em nenhuma das
 * bibliotecas. Fica como config plugin porque `android/` é regenerado a cada
 * prebuild — editar o Gradle à mão duraria até o próximo comando.
 */
const FORCE_BLOCK = `
allprojects {
    configurations.all {
        resolutionStrategy {
            force 'androidx.work:work-runtime:2.8.1'
            force 'androidx.work:work-runtime-ktx:2.8.1'
        }
    }
}
`;

module.exports = function withAndroidWorkVersion(config) {
  return withProjectBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.contents.includes("force 'androidx.work:work-runtime:2.8.1'")) {
      return gradleConfig;
    }
    gradleConfig.modResults.contents += FORCE_BLOCK;
    return gradleConfig;
  });
};
