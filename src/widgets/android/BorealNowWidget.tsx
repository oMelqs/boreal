// O projeto roda com o React Compiler ligado (`experiments.reactCompiler`), que
// memoiza componentes. A lib do widget Android renderiza a árvore chamando a
// função direto, fora do React, e rejeita o componente transformado com
// "Invalid Hook Call". A diretiva desliga o compiler só neste arquivo.
'use no memo';

import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { WidgetPayload } from '@/presentation/widget/toWidgetPayload';
import { strings } from '@/presentation/i18n/strings';

type BorealNowWidgetProps = {
  /** `null` enquanto o app nunca publicou nada (§11). */
  payload: WidgetPayload | null;
  theme?: 'light' | 'dark';
};

/** Tokens do tema, copiados de `presentation/theme/tokens.ts`: o widget roda
 *  fora da árvore do app e não tem acesso ao `useTheme`. */
const COLORS = {
  dark: { background: '#121B26', textPrimary: '#E9F1F7', textSecondary: '#8FA6B8' },
  light: { background: '#FFFFFF', textPrimary: '#101D29', textSecondary: '#4E6478' },
} as const;

/**
 * Widget Android (§6 do SPECS-WIDGET). A lib renderiza esta árvore como
 * imagem, então layout tolerante: nada colado na borda e sem texto que dependa
 * de refluxo. Tamanhos e layout definitivo entram no PR 5.
 *
 * `clickAction="OPEN_URI"` abre o app pelo scheme `boreal` — o mesmo caminho de
 * deep link que as telas já usam.
 */
export function BorealNowWidget({ payload, theme = 'dark' }: BorealNowWidgetProps) {
  const colors = COLORS[theme];
  const hasOutfit = payload !== null && payload.outfitLabel !== '';

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'boreal://' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        backgroundColor: colors.background,
        borderRadius: 16,
      }}
    >
      {payload === null ? (
        <TextWidget
          text={strings.widget.empty}
          style={{ fontSize: 16, color: colors.textPrimary }}
        />
      ) : (
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <TextWidget
            text={`${hasOutfit ? payload.outfitEmoji : payload.icon} ${payload.temp}`}
            style={{ fontSize: 28, color: colors.textPrimary }}
          />
          <TextWidget
            text={hasOutfit ? payload.outfitLabel : payload.description}
            style={{ fontSize: 14, color: colors.textPrimary }}
          />
          <TextWidget
            text={payload.habit?.name ?? payload.cityName}
            style={{ fontSize: 12, color: colors.textSecondary }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
