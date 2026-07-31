// Entry point do app. O expo-router monta as rotas (era o `main` do
// package.json até o widget entrar); o handler do widget Android precisa ser
// registrado no mesmo arquivo, porque ele roda headless — sem UI e sem passar
// por nenhuma tela — quando o sistema pede uma atualização.
import 'expo-router/entry';

import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';

registerWidgetTaskHandler(widgetTaskHandler);
